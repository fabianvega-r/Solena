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

// Tarjeta de prenda: sus fotos se pasan deslizando dentro de la tarjeta (FotosTarjeta.tsx),
// sin entrar a la ficha. Se limitan para que una rejilla grande no descargue de más.
export const FOTOS_POR_TARJETA = 6;
const fotosTarjeta = { orderBy: { orden: "asc" }, take: FOTOS_POR_TARJETA } satisfies Prisma.Prenda$fotosArgs;

function conFotosDeTarjeta<T extends { fotos: Foto[] }>({ fotos, ...p }: T) {
  const conDirecciones = fotos.map(conUrls);
  return { ...p, foto: conDirecciones[0] ?? null, fotos: conDirecciones };
}

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
      prendas: { select: { id: true, slug: true, nombre: true, fotos: primeraFoto }, orderBy: ordenPrendas },
      _count: { select: { prendas: true } },
    },
  });
  return colecciones.map(({ portada: elegida, fotos, prendas, _count, ...c }) => ({
    ...c,
    portada: portada(elegida, fotos, prendas),
    totalPrendas: _count.prendas,
    // Vista previa en el inicio: las 3 primeras prendas que tienen foto.
    vistaPrevia: prendas
      .filter((p) => p.fotos[0])
      .slice(0, 3)
      .map(({ fotos, ...p }) => ({ ...p, foto: conUrls(fotos[0]) })),
  }));
}

// «Prendas destacadas» del inicio: de todas las colecciones publicadas, primero las marcadas
// como destacadas en el panel y luego las más nuevas. Solo prendas con foto.
export async function prendasDestacadas(limite: number) {
  const prendas = await db.prenda.findMany({
    where: { coleccion: { publicada: true }, fotos: { some: {} } },
    orderBy: [{ destacada: "desc" }, { createdAt: "desc" }],
    take: limite,
    include: { fotos: fotosTarjeta },
  });
  return prendas.map(conFotosDeTarjeta);
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
        include: { fotos: fotosTarjeta, categoria: { select: { slug: true, nombre: true } } },
      },
    },
  });
  if (!c) return null;
  return {
    ...c,
    portada: portada(c.portada, c.fotos, c.prendas),
    fotos: c.fotos.map(conUrls),
    prendas: c.prendas.map(conFotosDeTarjeta),
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

  const [hermanas, otras] = await Promise.all([
    // Todas las prendas de la colección, en el mismo orden de la rejilla: para «Anterior / Siguiente».
    db.prenda.findMany({
      where: { coleccionId: p.coleccionId },
      orderBy: ordenPrendas,
      select: { id: true, slug: true, nombre: true },
    }),
    db.prenda.findMany({
      where: { coleccionId: p.coleccionId, id: { not: p.id } },
      orderBy: ordenPrendas,
      take: 4,
      include: { fotos: fotosTarjeta, categoria: { select: { slug: true, nombre: true } } },
    }),
  ]);

  // Si la colección no tiene más prendas, se sugieren de otras colecciones publicadas: la ficha
  // nunca termina sin un siguiente paso.
  const deOtrasColecciones =
    otras.length > 0
      ? []
      : await db.prenda.findMany({
          where: { coleccion: { publicada: true }, coleccionId: { not: p.coleccionId }, fotos: { some: {} } },
          orderBy: [{ destacada: "desc" }, { createdAt: "desc" }],
          take: 4,
          include: { fotos: fotosTarjeta },
        });

  // Anterior y siguiente dentro de la colección; después de la última vuelve a la primera.
  const i = hermanas.findIndex((h) => h.id === p.id);
  const total = hermanas.length;
  const vecinas =
    total > 1
      ? { anterior: hermanas[(i - 1 + total) % total], siguiente: hermanas[(i + 1) % total], posicion: i + 1, total }
      : null;

  return {
    ...p,
    fotos: p.fotos.map(conUrls),
    otras: otras.map(conFotosDeTarjeta),
    deOtrasColecciones: deOtrasColecciones.map(conFotosDeTarjeta),
    vecinas,
  };
});
