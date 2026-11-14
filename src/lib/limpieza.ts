// Espacio y limpieza: cuánto ocupa cada colección, qué impacto tuvo y el borrado completo de una
// colección (prendas, fotos en la base de datos y archivos en el almacenamiento).
// Lo usan la página /admin/espacio y la página de cada colección.
import { db } from "./db";
import { borrarArchivosFoto } from "./imagenes";
import { diaColombia } from "./metricas";

const DIA_MS = 24 * 60 * 60 * 1000;

// Impacto de los últimos 90 días: suficiente para juzgar una colección de temporada.
export const DIAS_IMPACTO = 90;
// Una colección más antigua que esto y con poco impacto se marca como candidata a borrar.
export const DIAS_ANTIGUA = 60;
// «Poco impacto»: menos de esta cantidad de visitas en DIAS_IMPACTO y ningún WhatsApp.
const POCAS_VISITAS = 10;

// Plan gratuito de Cloudflare R2: 10 GB.
export const LIMITE_GRATIS_MB = 10 * 1024;

export type FilaEspacio = Awaited<ReturnType<typeof resumenEspacio>>["colecciones"][number];

export async function resumenEspacio() {
  const desde = diaColombia(new Date(Date.now() - (DIAS_IMPACTO - 1) * DIA_MS));

  const [colecciones, eventos, reacciones, fotosTotal] = await Promise.all([
    db.coleccion.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nombre: true,
        publicada: true,
        createdAt: true,
        fotos: { select: { bytes: true } },
        prendas: { select: { id: true, fotos: { select: { bytes: true } } } },
      },
    }),
    db.evento.groupBy({
      by: ["coleccionId", "tipo"],
      where: { dia: { gte: desde }, coleccionId: { not: null } },
      _count: { _all: true },
    }),
    db.reaccion.groupBy({
      by: ["prendaId"],
      where: { createdAt: { gte: new Date(Date.now() - DIAS_IMPACTO * DIA_MS) } },
      _count: { _all: true },
    }),
    db.foto.aggregate({ _count: true, _sum: { bytes: true } }),
  ]);

  const corazonesDe = new Map(reacciones.map((r) => [r.prendaId, r._count._all]));
  const filas = colecciones.map((c) => {
    const fotos = [...c.fotos, ...c.prendas.flatMap((p) => p.fotos)];
    const bytes = fotos.reduce((total, f) => total + f.bytes, 0);
    const contar = (tipo: "VISITA" | "WHATSAPP") =>
      eventos.find((e) => e.coleccionId === c.id && e.tipo === tipo)?._count._all ?? 0;
    const visitas = contar("VISITA");
    const whatsapp = contar("WHATSAPP");
    const corazones = c.prendas.reduce((total, p) => total + (corazonesDe.get(p.id) ?? 0), 0);
    const dias = Math.floor((Date.now() - c.createdAt.getTime()) / DIA_MS);
    const pocoImpacto = visitas < POCAS_VISITAS && whatsapp === 0;
    return {
      id: c.id,
      nombre: c.nombre,
      publicada: c.publicada,
      creada: c.createdAt,
      dias,
      prendas: c.prendas.length,
      fotos: fotos.length,
      megas: bytes / 1024 / 1024,
      visitas,
      whatsapp,
      corazones,
      candidata: dias >= DIAS_ANTIGUA && pocoImpacto,
    };
  });

  // Primero las candidatas, luego las de menos impacto, luego las más antiguas.
  filas.sort(
    (a, b) =>
      Number(b.candidata) - Number(a.candidata) ||
      a.visitas + a.whatsapp * 5 - (b.visitas + b.whatsapp * 5) ||
      a.creada.getTime() - b.creada.getTime(),
  );

  return {
    colecciones: filas,
    totalFotos: fotosTotal._count,
    totalMegas: (fotosTotal._sum.bytes ?? 0) / 1024 / 1024,
  };
}

// Lo que se borraría: para mostrarlo ANTES de confirmar.
export async function contenidoColeccion(id: string) {
  const c = await db.coleccion.findUnique({
    where: { id },
    select: {
      nombre: true,
      fotos: { select: { bytes: true } },
      prendas: { select: { fotos: { select: { bytes: true } } } },
    },
  });
  if (!c) return null;
  const fotos = [...c.fotos, ...c.prendas.flatMap((p) => p.fotos)];
  return {
    nombre: c.nombre,
    prendas: c.prendas.length,
    fotos: fotos.length,
    megas: fotos.reduce((total, f) => total + f.bytes, 0) / 1024 / 1024,
  };
}

// Borra la colección con TODO lo suyo. Primero en la base de datos (una sola transacción: o se
// borra todo o nada) y después los archivos del almacenamiento, que es lo que libera espacio.
// Las visitas registradas quedan como historial anónimo (sin enlace a la colección borrada).
export async function borrarColeccionCompleta(id: string): Promise<{ nombre: string; megas: number } | null> {
  const c = await db.coleccion.findUnique({
    where: { id },
    select: {
      nombre: true,
      fotos: { select: { clave: true, bytes: true } },
      prendas: { select: { fotos: { select: { clave: true, bytes: true } } } },
    },
  });
  if (!c) return null;
  const fotos = [...c.fotos, ...c.prendas.flatMap((p) => p.fotos)];

  await db.$transaction([
    // Las prendas primero: la relación colección→prenda está protegida contra borrados por error.
    // Sus fotos y corazones se borran en cascada.
    db.prenda.deleteMany({ where: { coleccionId: id } }),
    db.coleccion.delete({ where: { id } }), // también borra sus fotos de campaña
  ]);

  // Si un archivo no se pudiera borrar, la colección igual queda eliminada (no se muestra más).
  await Promise.all(fotos.map((f) => borrarArchivosFoto(f.clave).catch(() => {})));

  return { nombre: c.nombre, megas: fotos.reduce((total, f) => total + f.bytes, 0) / 1024 / 1024 };
}

// «4,2 MB», «850 KB».
export function formatoTamano(megas: number): string {
  if (megas < 1) return `${Math.max(1, Math.round(megas * 1024))} KB`;
  return `${megas.toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;
}
