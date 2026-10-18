// PATCH  /api/fotos/:id (admin) — cambia `alt` u `orden`.
// DELETE /api/fotos/:id (admin) — borra la foto de la base de datos y del bucket.
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { esAdmin, noAutorizado } from "@/lib/auth";
import { db } from "@/lib/db";
import { borrarArchivosFoto, conUrls } from "@/lib/imagenes";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

const CambiosFoto = z.object({
  alt: z.string().max(300).optional(),
  orden: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request, { params }: Contexto) {
  if (!esAdmin(req)) return noAutorizado();
  const { id } = await params;

  const cambios = CambiosFoto.safeParse(await req.json().catch(() => null));
  if (!cambios.success) {
    return NextResponse.json({ error: cambios.error.flatten() }, { status: 400 });
  }

  const existe = await db.foto.findUnique({ where: { id }, select: { id: true } });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const foto = await db.foto.update({ where: { id }, data: cambios.data });
  revalidatePath("/", "layout");
  return NextResponse.json(conUrls(foto));
}

export async function DELETE(req: Request, { params }: Contexto) {
  if (!esAdmin(req)) return noAutorizado();
  const { id } = await params;

  const foto = await db.foto.findUnique({ where: { id } });
  if (!foto) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await db.foto.delete({ where: { id } });
  await borrarArchivosFoto(foto.clave);
  revalidatePath("/", "layout");
  return new NextResponse(null, { status: 204 });
}
