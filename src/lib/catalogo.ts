// Consultas del catálogo público. Regla única: solo se ve lo que pertenece a una
// colección publicada. Las páginas públicas nunca consultan la base de datos por su cuenta.
import { cache } from "react";
import type { Foto, Prisma } from "@prisma/client";
import { db } from "./db";
import { conUrls } from "./imagenes";

export type FotoPublica = ReturnType<typeof conUrls<Foto>>;

const ordenPrendas = [
  { destacada: "desc" },
  { orden: "asc" },
  { createdAt: "desc" },
] satisfies Prisma.PrendaOrderByWithRelationInput[];

const primeraFoto = { orderBy: { orden: "asc" }, take: 1 } satisfies Prisma.Coleccion$fotosArgs;

// Portada de una colección: la elegida en el panel; si no hay, su primera foto de campaña
// y, como último recurso, la foto de su primera prenda.
function portada(elegida: Foto | null, fotos: Foto[], prendas: { fotos: Foto[] }[]): FotoPublica | null {
  const foto = elegida ?? fotos[0] ?? prendas.find((p) => p.fotos[0])?.fotos[0];
  return foto ? conUrls(foto) : null;
}

export async function coleccionesPublicadas() {
  const colecciones = await db.coleccion.findMany({
    where: { publicada: true },
    // La última colección creada va primero: es la que la tienda quiere mostrar ahora.
    orderBy: [{ createdAt: "desc" }],
    include: {
      portada: true,
      fotos: primeraFoto,
      prendas: { select: { fotos: primeraFoto }, orderBy: ordenPrendas },
      _count: { select: { prendas: true } },
    },
  });
  return colecciones.map(({ portada: elegida, fotos, prendas, _count, ...c }) => ({
    ...c,
    portada: portada(elegida, fotos, prendas),
    totalPrendas: _count.prendas,
  }));
}

export type ColeccionResumen = Awaited<ReturnType<typeof coleccionesPublicadas>>[number];

// `cache` evita repetir la consulta entre generateMetadata y la página.
export const coleccionPublicada = cache(async (slug: string) => {
  const c = await db.coleccion.findFirst({
    where: { slug, publicada: true },
    include: {
      portada: true,
      fotos: { orderBy: { orden: "asc" } },
      prendas: {
        orderBy: ordenPrendas,
        include: { fotos: primeraFoto, categoria: { select: { slug: true, nombre: true } } },
      },
    },
  });
  if (!c) return null;
  return {
    ...c,
    portada: portada(c.portada, c.fotos, c.prendas),
    fotos: c.fotos.map(conUrls),
    prendas: c.prendas.map(({ fotos, ...p }) => ({ ...p, foto: fotos[0] ? conUrls(fotos[0]) : null })),
  };
});

export type PrendaResumen = NonNullable<Awaited<ReturnType<typeof coleccionPublicada>>>["prendas"][number];

export const prendaPublicada = cache(async (slug: string) => {
  const p = await db.prenda.findFirst({
    where: { slug, coleccion: { publicada: true } },
    include: {
      fotos: { orderBy: { orden: "asc" } },
      categoria: { select: { slug: true, nombre: true } },
      coleccion: { select: { slug: true, nombre: true, temporada: true } },
    },
  });
  if (!p) return null;

  const otras = await db.prenda.findMany({
    where: { coleccionId: p.coleccionId, id: { not: p.id } },
    orderBy: ordenPrendas,
    take: 4,
    include: { fotos: primeraFoto, categoria: { select: { slug: true, nombre: true } } },
  });

  return {
    ...p,
    fotos: p.fotos.map(conUrls),
    otras: otras.map(({ fotos, ...o }) => ({ ...o, foto: fotos[0] ? conUrls(fotos[0]) : null })),
  };
});
