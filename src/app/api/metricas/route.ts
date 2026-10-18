// POST /api/metricas — el catálogo avisa que alguien abrió una página o tocó «Preguntar por WhatsApp».
// Body: { tipo: "visita" | "whatsapp", ruta: "/prendas/<slug>" }. Responde 204 aunque no cuente
// (robots, sesión del panel abierta, ruta desconocida): para el visitante no cambia nada.
import { NextResponse } from "next/server";
import { DatosEvento } from "@/lib/esquemas";
import { debeContar, guardarVisitante, registrarEvento, visitanteDe } from "@/lib/metricas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Solo se aceptan avisos enviados desde las páginas del propio catálogo.
  if (req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const datos = DatosEvento.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: datos.error.flatten() }, { status: 400 });

  const res = new NextResponse(null, { status: 204 });
  if (!debeContar(req)) return res;

  const visitante = visitanteDe(req);
  const tipo = datos.data.tipo === "visita" ? "VISITA" : "WHATSAPP";
  if (await registrarEvento(tipo, visitante.id, datos.data.ruta)) guardarVisitante(res, visitante);
  return res;
}
