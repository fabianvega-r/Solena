// Validación de colecciones y prendas, compartida por la API y el panel de administración.
import { z } from "zod";

export const DatosColeccion = z.object({
  nombre: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  temporada: z.string().max(120).optional(),
  descripcion: z.string().max(5000).optional(),
  fechaLanzamiento: z.coerce.date().optional(),
  orden: z.number().int().optional(),
});

export const DatosPrenda = z.object({
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
