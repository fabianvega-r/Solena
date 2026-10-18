// Regla única de "lista para publicar". La usan el panel (para mostrar el checklist)
// y la acción de publicar (para hacerla cumplir), así nunca se contradicen.
import type { Prisma } from "@prisma/client";
import { db } from "./db";

export type Paso = {
  id: string;
  texto: string;
  cumplido: boolean;
  detalle?: string;
  enlace?: string; // a dónde ir para resolverlo
};

export type Revision = {
  requisitos: Paso[]; // obligatorios para publicar
  recomendaciones: Paso[]; // mejoran el catálogo, pero no impiden publicar
  lista: boolean;
};

// Solo los datos que necesita la revisión; se obtienen con `seleccionRevision`.
export type ColeccionARevisar = {
  id: string;
  portadaId: string | null;
  descripcion: string | null;
  fechaLanzamiento: Date | null;
  _count: { fotos: number };
  prendas: { id: string; nombre: string; precio: number | null; _count: { fotos: number } }[];
};

export const seleccionRevision = {
  id: true,
  portadaId: true,
  descripcion: true,
  fechaLanzamiento: true,
  _count: { select: { fotos: true } },
  prendas: {
    select: { id: true, nombre: true, precio: true, _count: { select: { fotos: true } } },
    orderBy: [{ destacada: "desc" }, { orden: "asc" }, { createdAt: "desc" }],
  },
} satisfies Prisma.ColeccionSelect;

// Portada: la foto elegida o, en colecciones antiguas, su primera foto de campaña.
export function tienePortada(c: { portadaId: string | null; _count: { fotos: number } }) {
  return !!c.portadaId || c._count.fotos > 0;
}

// Al subir la primera foto de una prenda, si la colección aún no tiene portada, esa foto
// pasa a serlo. Así se puede publicar sin otro paso; en el panel se puede cambiar después.
export async function asignarPortadaSiFalta(fotoId: string, prendaId: string) {
  const prenda = await db.prenda.findUnique({
    where: { id: prendaId },
    select: { coleccion: { select: { id: true, portadaId: true, _count: { select: { fotos: true } } } } },
  });
  if (!prenda || tienePortada(prenda.coleccion)) return;
  await db.coleccion.update({ where: { id: prenda.coleccion.id }, data: { portadaId: fotoId } });
}

// Solo puede ser portada una foto de la propia colección: de campaña o de una de sus prendas.
export async function esFotoDeColeccion(fotoId: string, coleccionId: string): Promise<boolean> {
  const foto = await db.foto.findFirst({
    where: { id: fotoId, OR: [{ coleccionId }, { prenda: { coleccionId } }] },
    select: { id: true },
  });
  return !!foto;
}

// "Vestido, Blusa, Falda y 2 más"
function nombres(lista: { nombre: string }[], maximo = 3) {
  const visibles = lista.slice(0, maximo).map((p) => p.nombre);
  const resto = lista.length - visibles.length;
  return resto > 0 ? `${visibles.join(", ")} y ${resto} más` : visibles.join(", ");
}

export function revisarColeccion(c: ColeccionARevisar): Revision {
  const base = `/admin/colecciones/${c.id}`;
  const sinFoto = c.prendas.filter((p) => p._count.fotos === 0);
  const sinPrecio = c.prendas.filter((p) => p.precio == null);
  const hayPrendas = c.prendas.length > 0;

  const requisitos: Paso[] = [
    {
      id: "prendas",
      texto: "Agregar al menos una prenda",
      cumplido: hayPrendas,
      detalle: hayPrendas ? (c.prendas.length === 1 ? "1 prenda" : `${c.prendas.length} prendas`) : undefined,
      enlace: hayPrendas ? undefined : `/admin/prendas/nueva?coleccion=${c.id}`,
    },
    {
      id: "fotos-prendas",
      texto: "Todas las prendas tienen al menos una foto",
      cumplido: hayPrendas && sinFoto.length === 0,
      detalle: !hayPrendas
        ? "Primero agrega prendas."
        : sinFoto.length > 0
          ? `Faltan fotos en: ${nombres(sinFoto)}.`
          : undefined,
      enlace: sinFoto.length > 0 ? `/admin/prendas/${sinFoto[0].id}#fotos` : undefined,
    },
    {
      id: "portada",
      texto: "Elegir la foto de portada",
      cumplido: tienePortada(c),
      detalle: tienePortada(c) ? undefined : "Es la foto con la que se presenta la colección. Se elige entre las fotos de sus prendas.",
      enlace: tienePortada(c) ? undefined : `${base}/portada`,
    },
  ];

  const recomendaciones: Paso[] = [
    {
      id: "descripcion",
      texto: "Escribir una descripción",
      cumplido: !!c.descripcion,
      enlace: c.descripcion ? undefined : `${base}#datos`,
    },
  ];
  // Sin prendas no tiene sentido hablar de precios: lo cubre el primer requisito.
  if (hayPrendas) {
    recomendaciones.push({
      id: "precios",
      texto: "Poner precio a las prendas",
      cumplido: sinPrecio.length === 0,
      detalle: sinPrecio.length > 0 ? `Sin precio (se mostrarán sin él): ${nombres(sinPrecio)}.` : undefined,
      enlace: sinPrecio.length > 0 ? `/admin/prendas/${sinPrecio[0].id}` : undefined,
    });
  }

  return { requisitos, recomendaciones, lista: requisitos.every((p) => p.cumplido) };
}

export async function revisionDeColeccion(id: string): Promise<Revision | null> {
  const coleccion = await db.coleccion.findUnique({ where: { id }, select: seleccionRevision });
  return coleccion ? revisarColeccion(coleccion) : null;
}
