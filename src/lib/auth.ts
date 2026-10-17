// Protección de la administración con un solo token compartido (ADMIN_TOKEN).
// - La API lo recibe como `Authorization: Bearer <token>`.
// - El panel pide el token una vez y guarda una cookie de sesión.
// Suficiente mientras solo administre una persona; más adelante se puede reemplazar por login con usuarios.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const COOKIE_SESION = "solena_admin";
export const DURACION_SESION = 60 * 60 * 24 * 30; // 30 días, en segundos

function hash(valor: string) {
  return createHash("sha256").update(valor).digest();
}

// Comparación en tiempo constante para no filtrar el valor por tiempos de respuesta.
function iguales(a: string, b: string) {
  return timingSafeEqual(hash(a), hash(b));
}

export function tokenValido(token: string): boolean {
  const esperado = process.env.ADMIN_TOKEN;
  return !!esperado && iguales(token, esperado);
}

// La cookie guarda un valor derivado del token, nunca el token mismo.
// Cambiar ADMIN_TOKEN cierra todas las sesiones abiertas.
export function valorSesion(): string | null {
  const token = process.env.ADMIN_TOKEN;
  return token ? createHmac("sha256", token).update("sesion-panel").digest("hex") : null;
}

function sesionValida(valor: string | undefined): boolean {
  const esperado = valorSesion();
  return !!esperado && !!valor && iguales(valor, esperado);
}

export function esAdmin(req: Request): boolean {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (bearer) return tokenValido(bearer);
  const cookie = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${COOKIE_SESION}=([^;]+)`))?.[1];
  return sesionValida(cookie);
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
