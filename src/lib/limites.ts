// Límites contra abusos: cuántas veces se puede intentar algo en una ventana de tiempo antes de
// quedar bloqueado un rato. Los contadores van en la base de datos (tabla Limite) porque Vercel
// corre muchas copias del servidor: un contador en memoria se podría esquivar repartiendo intentos.
import { createHmac } from "node:crypto";
import { db } from "./db";

const MINUTO = 60 * 1000;

export type Regla = { max: number; ventanaMs: number; bloqueoMs: number };

export const REGLAS = {
  // Claves incorrectas (panel o API) desde una misma conexión: 5 en 15 min → 15 min sin poder intentar.
  accesoPorIp: { max: 5, ventanaMs: 15 * MINUTO, bloqueoMs: 15 * MINUTO },
  // Claves incorrectas desde CUALQUIER lugar (ataque repartido en muchas computadoras): 30 en
  // 15 min → el inicio de sesión se cierra 15 min para todos. Las sesiones abiertas siguen.
  accesoGlobal: { max: 30, ventanaMs: 15 * MINUTO, bloqueoMs: 15 * MINUTO },
  // Visitantes nuevos creados desde una misma conexión (métricas): 30 por hora.
  visitantesPorIp: { max: 30, ventanaMs: 60 * MINUTO, bloqueoMs: 60 * MINUTO },
} satisfies Record<string, Regla>;

export const CLAVE_ACCESO_GLOBAL = "acceso:global";

// Dirección de quien hace la petición. En Vercel, x-forwarded-for la pone la propia plataforma.
function ipDe(cabeceras: Headers): string {
  return (
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() || cabeceras.get("x-real-ip")?.trim() || "desconocida"
  );
}

// Huella de la IP: sirve para contar intentos sin guardar la dirección real (privacidad).
export function huellaIp(cabeceras: Headers): string {
  const secreto = process.env.ADMIN_TOKEN ?? "solena";
  return createHmac("sha256", secreto).update(`ip:${ipDe(cabeceras)}`).digest("base64url").slice(0, 32);
}

// Segundos que faltan para que se levante el bloqueo de esta clave (0 si no está bloqueada).
export async function segundosBloqueado(clave: string): Promise<number> {
  const fila = await db.limite.findUnique({ where: { clave }, select: { bloqueadoHasta: true } });
  const restante = (fila?.bloqueadoHasta?.getTime() ?? 0) - Date.now();
  return restante > 0 ? Math.ceil(restante / 1000) : 0;
}

// Suma un intento. Si con este se llega al máximo de la ventana, la clave queda bloqueada.
// Devuelve true si quedó bloqueada.
export async function sumarIntento(clave: string, regla: Regla): Promise<boolean> {
  const ahora = new Date();
  const fila = await db.limite.findUnique({ where: { clave } });
  const ventanaVigente = !!fila && ahora.getTime() - fila.desde.getTime() < regla.ventanaMs;
  const cuenta = ventanaVigente ? fila.cuenta + 1 : 1;
  const bloquear = cuenta >= regla.max;
  const datos = {
    cuenta: bloquear ? 0 : cuenta, // tras el bloqueo, la cuenta vuelve a empezar
    desde: ventanaVigente && !bloquear ? fila.desde : ahora,
    bloqueadoHasta: bloquear ? new Date(ahora.getTime() + regla.bloqueoMs) : (fila?.bloqueadoHasta ?? null),
  };
  await db.limite.upsert({ where: { clave }, create: { clave, ...datos }, update: datos });
  return bloquear;
}

export async function reiniciarIntentos(clave: string) {
  await db.limite.deleteMany({ where: { clave } });
}

// «15 minutos», «1 minuto»: para los mensajes a la persona.
export function enMinutos(segundos: number): string {
  const minutos = Math.max(1, Math.ceil(segundos / 60));
  return minutos === 1 ? "1 minuto" : `${minutos} minutos`;
}
