// GET  /api/prendas?coleccion=<slug>&categoria=<slug>&disponible=true
//      Prendas de colecciones publicadas, con sus fotos ordenadas.
// POST /api/prendas (admin) — crea una prenda.
import { NextResponse } from "next/server";
import { z } from "zod";
import { esAdmin, noAutorizado } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const coleccion = params.get("coleccion");
  const categoria = params.get("categoria");
  const disponible = params.get("disponible");

  const prendas = await db.prenda.findMany({
    where: {
      coleccion: { publicada: true, ...(coleccion ? { slug: coleccion } : {}) },
      ...(categoria ? { categoria: { slug: categoria } } : {}),
      ...(disponible !== null ? { disponible: disponible === "true" } : {}),
    },
    orderBy: [{ destacada: "desc" }, { orden: "asc" }, { createdAt: "desc" }],
    include: {
      fotos: { orderBy: { orden: "asc" } },
      coleccion: { select: { slug: true, nombre: true } },
      categoria: { select: { slug: true, nombre: true } },
    },
  });

  return NextResponse.json(prendas.map((p) => ({ ...p, fotos: p.fotos.map(conUrls) })));
}

const NuevaPrenda = z.object({
  nombre: z.string().min(1).max(160),
  slug: z.string().max(160).optional(),
  descripcion: z.string().max(5000).optional(),
  precio: z.number().int().min(0).nullable().optional(),
  tallas: z.array(z.string().min(1).max(20)).max(20).default([]),
  colores: z.array(z.string().min(1).max(40)).max(20).default([]),
  disponible: z.boolean().optional(),
  destacada: z.boolean().optional(),
  orden: z.number().int().optional(),
  coleccionId: z.string().min(1),
  categoriaId: z.string().min(1).nullable().optional(),
});

export async function POST(req: Request) {
  if (!esAdmin(req)) return noAutorizado();

  const datos = NuevaPrenda.safeParse(await req.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: datos.error.flatten() }, { status: 400 });
  }

  const { coleccionId, categoriaId } = datos.data;
  if (!(await db.coleccion.findUnique({ where: { id: coleccionId }, select: { id: true } }))) {
    return NextResponse.json({ error: "La colección no existe" }, { status: 404 });
  }
  if (categoriaId && !(await db.categoria.findUnique({ where: { id: categoriaId }, select: { id: true } }))) {
    return NextResponse.json({ error: "La categoría no existe" }, { status: 404 });
  }

  const slug = slugify(datos.data.slug || datos.data.nombre);
  if (await db.prenda.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: `Ya existe una prenda con slug "${slug}"` }, { status: 409 });
  }

  const prenda = await db.prenda.create({ data: { ...datos.data, slug } });
  return NextResponse.json(prenda, { status: 201 });
}
