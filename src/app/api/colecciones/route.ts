// GET  /api/colecciones — colecciones publicadas, la más reciente primero, con su portada.
// POST /api/colecciones (admin) — crea una colección.
import { NextResponse } from "next/server";
import { z } from "zod";
import { esAdmin, noAutorizado } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET() {
  const colecciones = await db.coleccion.findMany({
    where: { publicada: true },
    orderBy: [{ fechaLanzamiento: "desc" }, { orden: "asc" }],
    include: {
      fotos: { orderBy: { orden: "asc" }, take: 1 },
      _count: { select: { prendas: true } },
    },
  });

  return NextResponse.json(
    colecciones.map(({ fotos, ...c }) => ({
      ...c,
      portada: fotos[0] ? conUrls(fotos[0]) : null,
    })),
  );
}

const NuevaColeccion = z.object({
  nombre: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  temporada: z.string().max(120).optional(),
  descripcion: z.string().max(5000).optional(),
  publicada: z.boolean().optional(),
  fechaLanzamiento: z.coerce.date().optional(),
  orden: z.number().int().optional(),
});

export async function POST(req: Request) {
  if (!esAdmin(req)) return noAutorizado();

  const datos = NuevaColeccion.safeParse(await req.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: datos.error.flatten() }, { status: 400 });
  }

  const slug = slugify(datos.data.slug || datos.data.nombre);
  if (await db.coleccion.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: `Ya existe una colección con slug "${slug}"` }, { status: 409 });
  }

  const coleccion = await db.coleccion.create({ data: { ...datos.data, slug } });
  return NextResponse.json(coleccion, { status: 201 });
}
