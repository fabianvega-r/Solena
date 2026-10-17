// Procesamiento de fotos: cada imagen subida se convierte en 3 variantes WebP
// optimizadas. Una foto de celular de 5 MB queda en ~300-500 KB en total, lo que
// multiplica la cantidad de fotos que caben en el plan gratuito del almacenamiento.
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { Foto } from "@prisma/client";
import { borrarObjetos, subirObjeto, urlPublica } from "./storage";

export const VARIANTES = { sm: 480, md: 960, lg: 1600 } as const;
export type Variante = keyof typeof VARIANTES;

const NOMBRES_VARIANTES = Object.keys(VARIANTES) as Variante[];

export const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function claveVariante(clave: string, variante: Variante) {
  return `${clave}/${variante}.webp`;
}

export type FotoProcesada = {
  clave: string;
  ancho: number;
  alto: number;
  blurDataUrl: string;
  bytes: number;
};

// Procesa la imagen y sube sus variantes al bucket. Si algo falla a mitad de
// camino, borra lo que alcanzó a subir para no dejar archivos huérfanos.
export async function procesarYSubirFoto(entrada: Buffer): Promise<FotoProcesada> {
  const clave = `fotos/${randomUUID()}`;

  const variantes = await Promise.all(
    NOMBRES_VARIANTES.map(async (nombre) => {
      const { data, info } = await sharp(entrada, { failOn: "error" })
        .rotate() // respeta la orientación EXIF de las fotos de celular
        .resize({ width: VARIANTES[nombre], withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      return { nombre, data, info };
    }),
  );

  const blur = await sharp(entrada).rotate().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

  const subidas = variantes.map((v) => claveVariante(clave, v.nombre));
  try {
    await Promise.all(variantes.map((v) => subirObjeto(claveVariante(clave, v.nombre), v.data, "image/webp")));
  } catch (e) {
    await borrarObjetos(subidas).catch(() => {});
    throw e;
  }

  const grande = variantes.find((v) => v.nombre === "lg")!.info;
  return {
    clave,
    ancho: grande.width,
    alto: grande.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    bytes: variantes.reduce((total, v) => total + v.info.size, 0),
  };
}

export async function borrarArchivosFoto(clave: string) {
  await borrarObjetos(NOMBRES_VARIANTES.map((v) => claveVariante(clave, v)));
}

// Agrega las URLs públicas de cada variante, listas para usar en <img srcset>.
export function conUrls<T extends Pick<Foto, "clave">>(foto: T) {
  const urls = Object.fromEntries(
    NOMBRES_VARIANTES.map((v) => [v, urlPublica(claveVariante(foto.clave, v))]),
  ) as Record<Variante, string>;
  const srcSet = NOMBRES_VARIANTES.map((v) => `${urls[v]} ${VARIANTES[v]}w`).join(", ");
  return { ...foto, urls, srcSet };
}
