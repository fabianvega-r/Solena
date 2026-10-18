// «Sobre Solena»: cómo nació la marca y quién la fundó (foto, nombre, cargo y su texto).
// Es una sola fila (id "solena"); la usan el panel (para editarla) y el catálogo (para mostrarla).
import { cache } from "react";
import { db } from "./db";
import { borrarArchivosFoto, conUrls } from "./imagenes";

const ID = "solena";

// `cache` evita repetir la consulta si varias partes de la misma página la piden.
export const obtenerMarca = cache(async () => {
  const marca = await db.tienda.findUnique({ where: { id: ID }, include: { foto: true } });
  const historia = marca?.historia ?? null;
  return {
    titulo: marca?.titulo ?? null,
    historia,
    // Primer párrafo de la historia, para el resumen del inicio.
    resumen: historia?.split(/\n\s*\n/)[0].trim() ?? null,
    fundadoraNombre: marca?.fundadoraNombre ?? null,
    fundadoraCargo: marca?.fundadoraCargo ?? null,
    fundadoraTexto: marca?.fundadoraTexto ?? null,
    foto: marca?.foto ? conUrls(marca.foto) : null,
  };
});

export type Marca = Awaited<ReturnType<typeof obtenerMarca>>;

// ¿Hay algo que mostrar? Si todo está vacío, el catálogo no muestra la sección ni el enlace.
export function hayMarca(m: Marca) {
  return !!(m.historia || m.foto || m.fundadoraTexto || m.fundadoraNombre);
}

export type TextosMarca = {
  titulo: string | null;
  historia: string | null;
  fundadoraNombre: string | null;
  fundadoraCargo: string | null;
  fundadoraTexto: string | null;
};

export async function guardarTextosMarca(datos: TextosMarca) {
  await db.tienda.upsert({ where: { id: ID }, update: datos, create: { id: ID, ...datos } });
}

// Pone una foto recién subida como foto de la marca y borra la anterior (registro y archivos),
// para no gastar espacio con fotos que ya no se ven.
export async function reemplazarFotoMarca(fotoId: string) {
  const anterior = await db.tienda.findUnique({ where: { id: ID }, select: { foto: { select: { id: true, clave: true } } } });
  await db.tienda.upsert({ where: { id: ID }, update: { fotoId }, create: { id: ID, fotoId } });
  if (anterior?.foto && anterior.foto.id !== fotoId) {
    await db.foto.delete({ where: { id: anterior.foto.id } });
    await borrarArchivosFoto(anterior.foto.clave).catch(() => {});
  }
}
