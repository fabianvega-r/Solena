// Almacenamiento de las fotos. Dos opciones, según las variables de entorno:
// - Vercel Blob (producción): si existe BLOB_READ_WRITE_TOKEN. Gratis hasta 1 GB, sin tarjeta.
// - Compatible con S3 (MinIO en local, o R2 / cualquier S3): con las variables S3_*.
// El resto del proyecto solo usa subirObjeto, borrarObjetos y urlPublica: no sabe cuál está activo.
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { del, put } from "@vercel/blob";

function env(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

// Cada archivo tiene una clave única que nunca se reescribe: el navegador y la red de entrega
// pueden guardarlo en caché todo un año.
const UN_ANIO = 60 * 60 * 24 * 365;

export function usaVercelBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

let cliente: S3Client | undefined;

function s3(): S3Client {
  cliente ??= new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: env("S3_ENDPOINT"),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY_ID"),
      secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
    },
  });
  return cliente;
}

export async function subirObjeto(clave: string, cuerpo: Buffer, tipo: string) {
  if (usaVercelBlob()) {
    await put(clave, cuerpo, {
      access: "public",
      contentType: tipo,
      addRandomSuffix: false, // la clave ya es única (lleva un código al azar)
      cacheControlMaxAge: UN_ANIO,
    });
    return;
  }
  await s3().send(
    new PutObjectCommand({
      Bucket: env("S3_BUCKET"),
      Key: clave,
      Body: cuerpo,
      ContentType: tipo,
      CacheControl: `public, max-age=${UN_ANIO}, immutable`,
    }),
  );
}

export async function borrarObjetos(claves: string[]) {
  if (claves.length === 0) return;
  if (usaVercelBlob()) {
    await del(claves); // acepta el nombre (clave) de cada archivo
    return;
  }
  await s3().send(
    new DeleteObjectsCommand({
      Bucket: env("S3_BUCKET"),
      Delete: { Objects: claves.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}

// Dirección pública de un archivo.
// - Vercel Blob: FOTOS_URL_PUBLICA (la dirección base del almacenamiento; el script
//   «npm run fotos:copiar-a-blob» la muestra).
// - MinIO en desarrollo: pasa por el propio servidor de Next (ver `rewrites` en next.config.ts),
//   porque la dirección de MinIO dice "localhost" y en el celular "localhost" es el celular.
// - Otro S3: S3_PUBLIC_URL.
export function urlPublica(clave: string): string {
  if (usaVercelBlob()) return `${env("FOTOS_URL_PUBLICA").replace(/\/$/, "")}/${clave}`;
  if (process.env.NODE_ENV === "development") return `/almacen-local/${clave}`;
  return `${env("S3_PUBLIC_URL").replace(/\/$/, "")}/${clave}`;
}
