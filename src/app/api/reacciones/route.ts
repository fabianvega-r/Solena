// POST /api/reacciones — pone o quita el corazón de un visitante a una prenda.
// Body: { prendaId, activa }. Cada visitante tiene como máximo un corazón por prenda.
import { NextResponse } from "next/server";
import { DatosReaccion } from "@/lib/esquemas";
import {
  cambiarReaccion,
  debeContar,
  guardarVisitante,
  puedeSumarVisitante,
  vieneDelCatalogo,
  visitanteDe,
} from "@/lib/metricas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!vieneDelCatalogo(req)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const datos = DatosReaccion.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: datos.error.flatten() }, { status: 400 });

  // Los corazones de la sesión del panel no cuentan, ni los que superan el tope de visitantes
  // nuevos por conexión; el botón responde igual (el corazón se guarda en el navegador).
  if (!(await debeContar(req))) return new NextResponse(null, { status: 204 });
  const visitante = visitanteDe(req);
  if (!(await puedeSumarVisitante(req, visitante))) return new NextResponse(null, { status: 204 });

  if (!(await cambiarReaccion(datos.data.prendaId, visitante.id, datos.data.activa))) {
    return NextResponse.json({ error: "Esta prenda ya no está en el catálogo." }, { status: 404 });
  }
  const res = new NextResponse(null, { status: 204 });
  guardarVisitante(res, visitante);
  return res;
}
