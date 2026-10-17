// Protección mínima para las rutas de administración: un token compartido
// enviado como `Authorization: Bearer <token>`. Suficiente mientras solo
// administre una persona; más adelante se puede reemplazar por login con usuarios.
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function hash(valor: string) {
  return createHash("sha256").update(valor).digest();
}

export function esAdmin(req: Request): boolean {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) return false;
  const recibido = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  // Comparación en tiempo constante para no filtrar el token por tiempos de respuesta.
  return timingSafeEqual(hash(recibido), hash(esperado));
}

export function noAutorizado() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
