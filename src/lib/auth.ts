// Protección de la administración con un solo token compartido (ADMIN_TOKEN).
// - La API lo recibe como `Authorization: Bearer <token>`.
// - El panel pide el token una vez y guarda una cookie de sesión.
// Contra quien intenta adivinar la clave: límites de intentos por conexión y en total (src/lib/limites.ts).
// Suficiente mientras solo administre una persona; más adelante se puede reemplazar por login con usuarios.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "./db";
import { CLAVE_ACCESO_GLOBAL, huellaIp, REGLAS, segundosBloqueado, sumarIntento } from "./limites";

export const COOKIE_SESION = "solena_admin";
export const DURACION_SESION = 60 * 60 * 24 * 30; // 30 días, en segundos

const ID_TIENDA = "solena"; // la única fila de Tienda (ver src/lib/marca.ts)

function hash(valor: string) {
  return createHash("sha256").update(valor).digest();
}

// Comparación en tiempo constante para no filtrar el valor por tiempos de respuesta.
function iguales(a: string, b: string) {
  return timingSafeEqual(hash(a), hash(b));
}

// Una clave corta se puede adivinar aunque haya límites de intentos: se avisa en el registro del servidor.
let fuerzaRevisada = false;
function revisarFuerza(token: string) {
  if (fuerzaRevisada) return;
  fuerzaRevisada = true;
  if (token.length < 32) {
    console.warn(
      "[Solena] ADMIN_TOKEN es corta (menos de 32 caracteres). Genera una nueva con: " +
        "node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
    );
  }
}

export function tokenValido(token: string): boolean {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) return false;
  revisarFuerza(esperado);
  return iguales(token, esperado);
}

// --- Sesión del panel ---------------------------------------------------------------
// La cookie es «vence.versión.firma». La firma usa ADMIN_TOKEN, así que no se puede inventar; la
// fecha hace que venza en el servidor (no solo en el navegador) y la versión permite que «Salir»
// cierre todas las sesiones abiertas. La cookie nunca guarda la clave misma.

function firmar(vence: number, version: number): string | null {
  const token = process.env.ADMIN_TOKEN;
  return token ? createHmac("sha256", token).update(`sesion-panel:${vence}:${version}`).digest("base64url") : null;
}

async function versionSesion(): Promise<number> {
  const tienda = await db.tienda.findUnique({ where: { id: ID_TIENDA }, select: { versionSesion: true } });
  return tienda?.versionSesion ?? 1;
}

export async function crearValorSesion(): Promise<string | null> {
  const vence = Date.now() + DURACION_SESION * 1000;
  const version = await versionSesion();
  const firma = firmar(vence, version);
  return firma ? `${vence}.${version}.${firma}` : null;
}

// Cierra todas las sesiones del panel (en cualquier aparato): las cookies anteriores dejan de servir.
export async function cerrarTodasLasSesiones() {
  await db.tienda.upsert({
    where: { id: ID_TIENDA },
    update: { versionSesion: { increment: 1 } },
    create: { id: ID_TIENDA, versionSesion: 2 },
  });
}

async function sesionValida(valor: string | undefined): Promise<boolean> {
  const [vence, version, firma] = valor?.split(".") ?? [];
  if (!vence || !version || !firma) return false;
  if (!(Number(vence) > Date.now())) return false; // vencida (o con fecha inválida)
  const esperada = firmar(Number(vence), Number(version));
  if (!esperada || !iguales(firma, esperada)) return false;
  // Solo al final se consulta la base de datos: una cookie inventada no cuesta una consulta.
  return Number(version) === (await versionSesion());
}

function cookieDe(req: Request): string | undefined {
  return req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${COOKIE_SESION}=([^;]+)`))?.[1];
}

// ¿Quien hace la petición tiene la sesión del panel abierta? (Solo la cookie, nunca la clave.)
export async function tieneSesion(req: Request): Promise<boolean> {
  return sesionValida(cookieDe(req));
}

// Para la API: clave por cabecera (Bearer) o la sesión del panel. La clave por cabecera tiene los
// mismos límites de intentos que el inicio de sesión: sin ellos sería otra puerta para adivinarla.
export async function esAdmin(req: Request): Promise<boolean> {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return tieneSesion(req);

  const claveIp = `acceso:${huellaIp(req.headers)}`;
  if ((await segundosBloqueado(claveIp)) || (await segundosBloqueado(CLAVE_ACCESO_GLOBAL))) return false;
  if (tokenValido(bearer)) return true;
  await Promise.all([sumarIntento(claveIp, REGLAS.accesoPorIp), sumarIntento(CLAVE_ACCESO_GLOBAL, REGLAS.accesoGlobal)]);
  return false;
}

export function noAutorizado() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

// Para páginas y acciones del panel.
export async function sesionActiva(): Promise<boolean> {
  return sesionValida((await cookies()).get(COOKIE_SESION)?.value);
}

export async function exigirAdmin() {
  if (!(await sesionActiva())) redirect("/admin/login");
}
