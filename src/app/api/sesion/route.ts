// GET /api/sesion?ruta=/prendas/<slug> — le dice al catálogo si quien lo mira tiene la
// sesión del panel abierta y, si es así, a qué página del panel ir para editar lo que está viendo.
// A los visitantes solo les responde { admin: false }.
import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

async function enlaceEdicion(ruta: string): Promise<{ editar: string; texto: string } | null> {
  const [, seccion, slug] = ruta.match(/^\/(colecciones|prendas)\/([a-z0-9-]{1,160})$/) ?? [];
  if (seccion === "colecciones") {
    const c = await db.coleccion.findUnique({ where: { slug }, select: { id: true } });
    return c ? { editar: `/admin/colecciones/${c.id}`, texto: "Editar esta colección" } : null;
  }
  if (seccion === "prendas") {
    const p = await db.prenda.findUnique({ where: { slug }, select: { id: true } });
    return p ? { editar: `/admin/prendas/${p.id}`, texto: "Editar esta prenda" } : null;
  }
  return null;
}

export async function GET(req: Request) {
  const sinCache = { headers: { "cache-control": "private, no-store" } };
  if (!esAdmin(req)) return NextResponse.json({ admin: false }, sinCache);

  const ruta = new URL(req.url).searchParams.get("ruta") ?? "";
  return NextResponse.json({ admin: true, ...(await enlaceEdicion(ruta)) }, sinCache);
}
