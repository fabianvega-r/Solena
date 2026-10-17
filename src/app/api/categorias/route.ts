// GET /api/categorias — todas las categorías, en orden.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const categorias = await db.categoria.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json(categorias);
}
