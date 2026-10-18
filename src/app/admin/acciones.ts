"use server";
// Acciones del panel de administración. Las fotos no pasan por aquí: se suben
// directamente a /api/fotos, que ya las procesa (ver GestorFotos).
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { COOKIE_SESION, DURACION_SESION, exigirAdmin, tokenValido, valorSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { DatosColeccion, DatosMarca, DatosPrenda } from "@/lib/esquemas";
import { guardarTextosMarca } from "@/lib/marca";
import { borrarArchivosFoto } from "@/lib/imagenes";
import { esFotoDeColeccion, revisionDeColeccion, type Paso } from "@/lib/publicacion";
import { conUrls } from "@/lib/imagenes";
import { slugify } from "@/lib/slug";

// `id`: lo que se acaba de crear, para que la interfaz siga con el paso siguiente (p. ej. subir sus fotos).
export type Estado = { error?: string; ok?: string; id?: string } | undefined;

// --- Lectura de formularios ---------------------------------------------------

function texto(form: FormData, campo: string): string | undefined {
  const valor = String(form.get(campo) ?? "").trim();
  return valor || undefined;
}

// "XS, S, M" -> ["XS", "S", "M"]
function lista(form: FormData, campo: string): string[] {
  return (texto(form, campo) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

// Acepta "189000", "189.000" o "$ 189.000".
function pesos(form: FormData, campo: string): number | null {
  const valor = texto(form, campo)?.replace(/[$.\s]/g, "");
  return valor ? Number(valor) : null;
}

const ETIQUETAS: Record<string, string> = {
  nombre: "Nombre",
  slug: "Dirección",
  temporada: "Temporada",
  descripcion: "Descripción",
  fechaLanzamiento: "Fecha de lanzamiento",
  precio: "Precio",
  tallas: "Tallas",
  colores: "Colores",
  coleccionId: "Colección",
  categoriaId: "Categoría",
  titulo: "Frase de presentación",
  historia: "Cómo nació Solena",
  fundadoraNombre: "Nombre",
  fundadoraCargo: "Cargo",
  fundadoraTexto: "Sobre ella",
};

function mensajeError(error: z.ZodError): string {
  const campo = String(error.issues[0]?.path[0] ?? "");
  return `Revisa el campo «${ETIQUETAS[campo] ?? campo}».`;
}

// --- Sesión -------------------------------------------------------------------

export async function iniciarSesion(_previo: Estado, form: FormData): Promise<Estado> {
  if (!tokenValido(String(form.get("token") ?? ""))) return { error: "Clave incorrecta." };
  (await cookies()).set(COOKIE_SESION, valorSesion()!, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION,
  });
  redirect("/admin");
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE_SESION);
  redirect("/admin/login");
}

// --- Colecciones --------------------------------------------------------------

export async function guardarColeccion(id: string | null, _previo: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();

  const datos = DatosColeccion.safeParse({
    nombre: texto(form, "nombre"),
    slug: texto(form, "slug"),
    temporada: texto(form, "temporada"),
    descripcion: texto(form, "descripcion"),
    // `publicada` no se toca aquí: se cambia solo con cambiarPublicacion, que revisa que esté lista.
    fechaLanzamiento: texto(form, "fechaLanzamiento"),
  });
  if (!datos.success) return { error: mensajeError(datos.error) };

  const slug = slugify(datos.data.slug || datos.data.nombre);
  if (!slug) return { error: "El nombre debe tener al menos una letra o número." };
  const otra = await db.coleccion.findUnique({ where: { slug }, select: { id: true } });
  if (otra && otra.id !== id) return { error: `Ya existe otra colección con la dirección «${slug}».` };

  const data = {
    ...datos.data,
    slug,
    temporada: datos.data.temporada ?? null,
    descripcion: datos.data.descripcion ?? null,
    fechaLanzamiento: datos.data.fechaLanzamiento ?? null,
  };

  revalidatePath("/", "layout"); // panel y catálogo público
  if (id) {
    await db.coleccion.update({ where: { id }, data });
    return { ok: "Cambios guardados." };
  }
  const coleccion = await db.coleccion.create({ data });
  // Paso 2 del asistente: las prendas.
  redirect(`/admin/prendas/nueva?coleccion=${coleccion.id}&creada=1`);
}

export async function cambiarPublicacion(id: string, publicar: boolean): Promise<Estado> {
  await exigirAdmin();

  if (publicar) {
    const revision = await revisionDeColeccion(id);
    if (!revision) return { error: "La colección ya no existe." };
    const pendientes = revision.requisitos.filter((p) => !p.cumplido);
    if (pendientes.length > 0) {
      return { error: `Todavía no se puede publicar: ${pendientes.map((p) => p.texto.toLowerCase()).join("; ")}.` };
    }
  }

  await db.coleccion.update({ where: { id }, data: { publicada: publicar } });
  revalidatePath("/", "layout"); // panel y catálogo público
  return {
    ok: publicar
      ? "¡Colección publicada! Ya es visible en el catálogo."
      : "La colección volvió a borrador y ya no se ve en el catálogo.",
  };
}

export async function borrarColeccion(id: string): Promise<Estado> {
  await exigirAdmin();

  const prendas = await db.prenda.count({ where: { coleccionId: id } });
  if (prendas > 0) {
    return { error: `Primero borra o mueve sus ${prendas} prendas a otra colección.` };
  }

  const fotos = await db.foto.findMany({ where: { coleccionId: id }, select: { clave: true } });
  await db.coleccion.delete({ where: { id } }); // borra también los registros de sus fotos
  await Promise.all(fotos.map((f) => borrarArchivosFoto(f.clave).catch(() => {})));

  revalidatePath("/", "layout"); // panel y catálogo público
  redirect("/admin");
}

// --- Prendas ------------------------------------------------------------------

export async function guardarPrenda(id: string | null, _previo: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();

  const datos = DatosPrenda.safeParse({
    nombre: texto(form, "nombre"),
    slug: texto(form, "slug"),
    descripcion: texto(form, "descripcion"),
    precio: pesos(form, "precio"),
    tallas: lista(form, "tallas"),
    colores: lista(form, "colores"),
    disponible: form.get("disponible") === "on",
    destacada: form.get("destacada") === "on",
    coleccionId: texto(form, "coleccionId"),
    categoriaId: texto(form, "categoriaId") ?? null,
  });
  if (!datos.success) return { error: mensajeError(datos.error) };

  const slug = slugify(datos.data.slug || datos.data.nombre);
  if (!slug) return { error: "El nombre debe tener al menos una letra o número." };
  const otra = await db.prenda.findUnique({ where: { slug }, select: { id: true } });
  if (otra && otra.id !== id) return { error: `Ya existe otra prenda con la dirección «${slug}».` };

  const data = { ...datos.data, slug, descripcion: datos.data.descripcion ?? null };

  revalidatePath("/", "layout"); // panel y catálogo público
  if (id) {
    await db.prenda.update({ where: { id }, data });
    return { ok: "Cambios guardados." };
  }
  // No redirige: el formulario sube enseguida las fotos de la prenda y ofrece publicar o añadir otra.
  const prenda = await db.prenda.create({ data });
  return { ok: "Prenda creada.", id: prenda.id };
}

// Para el asistente: ¿la colección ya se puede publicar? Si no, qué falta y dónde resolverlo.
export async function estadoPublicacion(coleccionId: string): Promise<{
  nombre: string;
  slug: string;
  publicada: boolean;
  portada: string | null; // miniatura de la portada actual
  faltan: Paso[];
} | null> {
  await exigirAdmin();
  const [coleccion, revision] = await Promise.all([
    db.coleccion.findUnique({
      where: { id: coleccionId },
      select: {
        nombre: true,
        slug: true,
        publicada: true,
        portada: true,
        fotos: { orderBy: { orden: "asc" }, take: 1 },
      },
    }),
    revisionDeColeccion(coleccionId),
  ]);
  if (!coleccion || !revision) return null;
  const { portada, fotos, ...datos } = coleccion;
  const foto = portada ?? fotos[0];
  return { ...datos, portada: foto ? conUrls(foto).urls.sm : null, faltan: revision.requisitos.filter((p) => !p.cumplido) };
}

export async function elegirPortada(coleccionId: string, fotoId: string): Promise<Estado> {
  await exigirAdmin();
  if (!(await esFotoDeColeccion(fotoId, coleccionId))) {
    return { error: "Esa foto no pertenece a esta colección." };
  }
  await db.coleccion.update({ where: { id: coleccionId }, data: { portadaId: fotoId } });
  revalidatePath("/", "layout"); // panel y catálogo público
  return { ok: "Portada actualizada." };
}

export async function borrarPrenda(id: string): Promise<Estado> {
  await exigirAdmin();

  const prenda = await db.prenda.findUnique({
    where: { id },
    select: { coleccionId: true, fotos: { select: { clave: true } } },
  });
  if (!prenda) return { error: "La prenda ya no existe." };

  await db.prenda.delete({ where: { id } });
  await Promise.all(prenda.fotos.map((f) => borrarArchivosFoto(f.clave).catch(() => {})));

  revalidatePath("/", "layout"); // panel y catálogo público
  redirect(`/admin/colecciones/${prenda.coleccionId}`);
}

// --- Sobre la marca -------------------------------------------------------------

export async function guardarMarca(_previo: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  const datos = DatosMarca.safeParse({
    titulo: texto(form, "titulo"),
    historia: texto(form, "historia"),
    fundadoraNombre: texto(form, "fundadoraNombre"),
    fundadoraCargo: texto(form, "fundadoraCargo"),
    fundadoraTexto: texto(form, "fundadoraTexto"),
  });
  if (!datos.success) return { error: mensajeError(datos.error) };

  const d = datos.data;
  await guardarTextosMarca({
    titulo: d.titulo ?? null,
    historia: d.historia ?? null,
    fundadoraNombre: d.fundadoraNombre ?? null,
    fundadoraCargo: d.fundadoraCargo ?? null,
    fundadoraTexto: d.fundadoraTexto ?? null,
  });
  revalidatePath("/", "layout"); // panel y catálogo público
  return { ok: "Guardado. Ya se ve en la página «Sobre Solena» del catálogo." };
}
