// Métricas del catálogo: visitas, clics en WhatsApp y corazones. Regla única para
// registrar (rutas /api/metricas y /api/reacciones) y para resumir (panel).
// No se guarda nada personal: el visitante es un código al azar en una cookie.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import type { TipoEvento } from "@prisma/client";
import { tieneSesion } from "./auth";
import { db } from "./db";
import { huellaIp, REGLAS, segundosBloqueado, sumarIntento } from "./limites";
import { ZONA_HORARIA } from "./tienda";

const COOKIE_VISITANTE = "solena_visitante";
const UN_ANIO = 60 * 60 * 24 * 365;
const ROBOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i;
const DIA_MS = 24 * 60 * 60 * 1000;

// --- Solo desde el propio catálogo --------------------------------------------------

// Los navegadores marcan con Sec-Fetch-Site de dónde sale cada petición. Las métricas solo se
// aceptan desde páginas del propio sitio; un script puede imitar la cabecera, por eso además
// hay tope de visitantes nuevos por conexión (ver puedeSumarVisitante).
export function vieneDelCatalogo(req: Request): boolean {
  return req.headers.get("sec-fetch-site") === "same-origin";
}

// --- Quién visita -------------------------------------------------------------

// El código del visitante va firmado («código.firma»): uno inventado no se acepta, así que
// para tener un visitante nuevo hay que pedírselo al servidor (y eso tiene tope por conexión).
function firmaVisitante(id: string): string {
  return createHmac("sha256", process.env.ADMIN_TOKEN ?? "solena").update(`visitante:${id}`).digest("base64url").slice(0, 22);
}

export function visitanteDe(req: Request): { id: string; nuevo: boolean } {
  const valor = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${COOKIE_VISITANTE}=([\\w-]{36}\\.[\\w-]{22})`))?.[1];
  if (valor) {
    const [id, firma] = valor.split(".");
    const esperada = firmaVisitante(id);
    if (timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return { id, nuevo: false };
  }
  return { id: randomUUID(), nuevo: true };
}

// Tope de visitantes nuevos por conexión (REGLAS.visitantesPorIp). Sin él, un script podría
// crear miles de «visitantes» falsos y llenar la base de datos y las métricas.
export async function puedeSumarVisitante(req: Request, visitante: { nuevo: boolean }): Promise<boolean> {
  if (!visitante.nuevo) return true;
  const clave = `visitantes:${huellaIp(req.headers)}`;
  if (await segundosBloqueado(clave)) return false;
  await sumarIntento(clave, REGLAS.visitantesPorIp);
  return true;
}

export function guardarVisitante(res: NextResponse, visitante: { id: string; nuevo: boolean }) {
  if (!visitante.nuevo) return;
  res.cookies.set(COOKIE_VISITANTE, `${visitante.id}.${firmaVisitante(visitante.id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UN_ANIO,
  });
}

// No cuentan los robots ni quien administra la tienda mientras tiene la sesión del panel abierta.
// Solo mira la cookie del panel (nunca una clave por cabecera: no debe servir para probar claves).
export async function debeContar(req: Request): Promise<boolean> {
  if (ROBOTS.test(req.headers.get("user-agent") ?? "")) return false;
  return !(await tieneSesion(req));
}

// --- Fechas en hora de Colombia ----------------------------------------------

// Fecha (sin hora) del día en Colombia, como medianoche UTC para la columna @db.Date.
export function diaColombia(fecha = new Date()): Date {
  const texto = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
  return new Date(`${texto}T00:00:00Z`);
}

// Colombia es UTC-5 todo el año: el día empieza a las 05:00 UTC.
function inicioDelDia(dia: Date): Date {
  return new Date(dia.getTime() + 5 * 60 * 60 * 1000);
}

// --- Registrar ------------------------------------------------------------------

// Traduce la dirección visitada a la prenda o colección que muestra. Solo acepta
// páginas del catálogo con contenido publicado; cualquier otra cosa se ignora.
async function destinoDeRuta(ruta: string): Promise<{ prendaId?: string; coleccionId?: string } | null> {
  if (ruta === "/") return {};

  const [, seccion, slug] = ruta.match(/^\/(colecciones|prendas)\/([a-z0-9-]{1,160})$/) ?? [];
  if (seccion === "colecciones") {
    const c = await db.coleccion.findFirst({ where: { slug, publicada: true }, select: { id: true } });
    return c ? { coleccionId: c.id } : null;
  }
  if (seccion === "prendas") {
    const p = await db.prenda.findFirst({
      where: { slug, coleccion: { publicada: true } },
      select: { id: true, coleccionId: true },
    });
    return p ? { prendaId: p.id, coleccionId: p.coleccionId } : null;
  }
  return null;
}

export async function registrarEvento(tipo: TipoEvento, visitante: string, ruta: string): Promise<boolean> {
  const destino = await destinoDeRuta(ruta);
  if (!destino) return false;
  // Si ya contó hoy esta página para esta persona, la restricción única la ignora.
  await db.evento.createMany({
    data: [{ tipo, visitante, ruta, dia: diaColombia(), ...destino }],
    skipDuplicates: true,
  });
  return true;
}

export async function cambiarReaccion(prendaId: string, visitante: string, activa: boolean): Promise<boolean> {
  const prenda = await db.prenda.findFirst({
    where: { id: prendaId, coleccion: { publicada: true } },
    select: { id: true },
  });
  if (!prenda) return false;
  if (activa) {
    await db.reaccion.createMany({ data: [{ prendaId, visitante }], skipDuplicates: true });
  } else {
    await db.reaccion.deleteMany({ where: { prendaId, visitante } });
  }
  return true;
}

// --- Resumir para el panel -------------------------------------------------------

export const PERIODOS = [
  { dias: 1, nombre: "Hoy" },
  { dias: 7, nombre: "Últimos 7 días" },
  { dias: 30, nombre: "Últimos 30 días" },
] as const;

export type ResumenMetricas = Awaited<ReturnType<typeof resumenMetricas>>;

export async function resumenMetricas(dias: number) {
  const desde = diaColombia(new Date(Date.now() - (dias - 1) * DIA_MS));
  const desdeHora = inicioDelDia(desde);

  const [[totales], [reacciones], prendas] = await Promise.all([
    db.$queryRaw<{ visitantes: bigint; contactaron: bigint }[]>`
      SELECT
        COUNT(DISTINCT visitante) FILTER (WHERE tipo = 'VISITA') AS visitantes,
        COUNT(DISTINCT visitante) FILTER (WHERE tipo = 'WHATSAPP') AS contactaron
      FROM "Evento"
      WHERE dia >= ${desde}::date`,
    // "De los que entraron, cuántos reaccionaron": personas con corazón en el periodo que también visitaron.
    db.$queryRaw<{ corazones: bigint; reaccionaron: bigint }[]>`
      SELECT
        COUNT(*) AS corazones,
        COUNT(DISTINCT r.visitante) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM "Evento" e
            WHERE e.visitante = r.visitante AND e.tipo = 'VISITA' AND e.dia >= ${desde}::date
          )
        ) AS reaccionaron
      FROM "Reaccion" r
      WHERE r."createdAt" >= ${desdeHora}`,
    db.$queryRaw<{ id: string; nombre: string; coleccion: string; vistas: bigint; corazones: bigint; whatsapp: bigint }[]>`
      SELECT p.id, p.nombre, c.nombre AS coleccion,
        (SELECT COUNT(DISTINCT e.visitante) FROM "Evento" e
          WHERE e."prendaId" = p.id AND e.tipo = 'VISITA' AND e.dia >= ${desde}::date) AS vistas,
        (SELECT COUNT(*) FROM "Reaccion" r
          WHERE r."prendaId" = p.id AND r."createdAt" >= ${desdeHora}) AS corazones,
        (SELECT COUNT(DISTINCT e.visitante) FROM "Evento" e
          WHERE e."prendaId" = p.id AND e.tipo = 'WHATSAPP' AND e.dia >= ${desde}::date) AS whatsapp
      FROM "Prenda" p
      JOIN "Coleccion" c ON c.id = p."coleccionId"
      WHERE c.publicada
      ORDER BY corazones DESC, vistas DESC, p.nombre
      LIMIT 10`,
  ]);

  return {
    visitantes: Number(totales.visitantes),
    contactaron: Number(totales.contactaron),
    corazones: Number(reacciones.corazones),
    reaccionaron: Number(reacciones.reaccionaron),
    prendas: prendas.map((p) => ({
      ...p,
      vistas: Number(p.vistas),
      corazones: Number(p.corazones),
      whatsapp: Number(p.whatsapp),
    })),
  };
}
