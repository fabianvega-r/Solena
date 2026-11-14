// Lista de colores que se ofrece en el panel: la paleta base más los que la tienda ya usó en
// alguna prenda. Así, un color nuevo («Lavanda grisáceo») queda en la lista desde que se guarda
// la primera prenda con él. Solo servidor: consulta la base de datos.
import { db } from "./db";
import { COLORES_BASE, mismoColor } from "./colores";

export async function coloresDeLaTienda(): Promise<string[]> {
  const prendas = await db.prenda.findMany({ select: { colores: true } });
  const propios: string[] = [];
  for (const color of prendas.flatMap((p) => p.colores)) {
    if (![...COLORES_BASE, ...propios].some((c) => mismoColor(c, color))) propios.push(color);
  }
  return [...COLORES_BASE, ...propios.sort((a, b) => a.localeCompare(b, "es"))];
}
