// POST /api/fotos (admin) — sube una foto a una prenda o a una colección.
// Body: multipart/form-data con `archivo` y un solo destino: `prendaId`, `coleccionId` o `tienda=1`
// (la foto de «Sobre la marca», que reemplaza a la anterior). `alt` es opcional.
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "@/lib/auth";
import { db } from "@/lib/db";
import { borrarArchivosFoto, conUrls, procesarYSubirFoto, TIPOS_PERMITIDOS } from "@/lib/imagenes";
import { reemplazarFotoMarca } from "@/lib/marca";
import { asignarPortadaSiFalta } from "@/lib/publicacion";

export const runtime = "nodejs"; // sharp necesita Node, no Edge

// Vercel corta los cuerpos de petición a 4.5 MB. El panel de administración
// debe reducir la foto en el navegador antes de subirla (ver README).
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await esAdmin(req))) return noAutorizado();

  const form = await req.formData();
  const archivo = form.get("archivo");
  const prendaId = (form.get("prendaId") as string | null) || null;
  const coleccionId = (form.get("coleccionId") as string | null) || null;
  const paraTienda = form.get("tienda") === "1";
  const alt = ((form.get("alt") as string | null) ?? "").slice(0, 300);

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Falta el campo `archivo`" }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return NextResponse.json(
      { error: `Formato no permitido (${archivo.type}). Usa JPG, PNG, WebP o AVIF.` },
      { status: 415 },
    );
  }
  if (archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto pesa más de 4 MB" }, { status: 413 });
  }
  if ([prendaId, coleccionId, paraTienda || null].filter(Boolean).length !== 1) {
    return NextResponse.json({ error: "Envía un solo destino: `prendaId`, `coleccionId` o `tienda`" }, { status: 400 });
  }

  if (!paraTienda) {
    const destino = prendaId
      ? await db.prenda.findUnique({ where: { id: prendaId }, select: { id: true } })
      : await db.coleccion.findUnique({ where: { id: coleccionId! }, select: { id: true } });
    if (!destino) {
      return NextResponse.json({ error: "La prenda o colección no existe" }, { status: 404 });
    }
  }

  let procesada;
  try {
    procesada = await procesarYSubirFoto(Buffer.from(await archivo.arrayBuffer()));
  } catch (e) {
    console.error("Error procesando foto", e);
    return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 422 });
  }

  try {
    const orden = paraTienda ? 0 : await db.foto.count({ where: prendaId ? { prendaId } : { coleccionId } });
    const foto = await db.foto.create({
      data: { ...procesada, alt, orden, prendaId, coleccionId },
    });
    if (prendaId) await asignarPortadaSiFalta(foto.id, prendaId);
    if (paraTienda) await reemplazarFotoMarca(foto.id);
    revalidatePath("/", "layout"); // el catálogo público muestra la foto nueva
    return NextResponse.json(conUrls(foto), { status: 201 });
  } catch (e) {
    await borrarArchivosFoto(procesada.clave).catch(() => {});
    throw e;
  }
}
