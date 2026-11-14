// GET  /api/colecciones — colecciones publicadas, la más reciente primero, con su portada.
// POST /api/colecciones (admin) — crea una colección.
import { NextResponse } from "next/server";
import { esAdmin, noAutorizado } from "@/lib/auth";
import { db } from "@/lib/db";
import { DatosColeccion } from "@/lib/esquemas";
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

export async function POST(req: Request) {
  if (!(await esAdmin(req))) return noAutorizado();

  const datos = DatosColeccion.safeParse(await req.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: datos.error.flatten() }, { status: 400 });
  }

  const slug = slugify(datos.data.slug || datos.data.nombre);
  if (await db.coleccion.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: `Ya existe una colección con slug "${slug}"` }, { status: 409 });
  }

  // Toda colección nueva empieza como borrador: aún no tiene prendas, así que no puede estar lista para publicar.
  const coleccion = await db.coleccion.create({ data: { ...datos.data, slug, publicada: false } });
  return NextResponse.json(coleccion, { status: 201 });
}
