// GET /api/uso (admin) — cuántas fotos hay y cuánto ocupan, para vigilar el límite gratuito.
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await esAdmin(req))) return noAutorizado();

  const { _count, _sum } = await db.foto.aggregate({ _count: true, _sum: { bytes: true } });
  const bytes = _sum.bytes ?? 0;
  return NextResponse.json({
    fotos: _count,
    megabytes: Math.round((bytes / 1024 / 1024) * 10) / 10,
    promedioKbPorFoto: _count ? Math.round(bytes / _count / 1024) : 0,
  });
}
