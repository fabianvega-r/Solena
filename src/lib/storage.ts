// Cliente de almacenamiento compatible con S3. El mismo código sirve para
// MinIO (local), Cloudflare R2 (producción) o cualquier otro proveedor S3.
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function env(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
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
  await s3().send(
    new PutObjectCommand({
      Bucket: env("S3_BUCKET"),
      Key: clave,
      Body: cuerpo,
      ContentType: tipo,
      // Cada archivo tiene una clave única que nunca se reescribe,
      // así que el navegador y el CDN pueden guardarlo en caché para siempre.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function borrarObjetos(claves: string[]) {
  if (claves.length === 0) return;
  await s3().send(
    new DeleteObjectsCommand({
      Bucket: env("S3_BUCKET"),
      Delete: { Objects: claves.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}

// En desarrollo, las fotos pasan por el propio servidor de Next (ver `rewrites` en next.config.ts),
// porque la dirección de MinIO dice "localhost" y en el celular "localhost" es el celular.
export function urlPublica(clave: string): string {
  if (process.env.NODE_ENV === "development") return `/almacen-local/${clave}`;
  return `${env("S3_PUBLIC_URL").replace(/\/$/, "")}/${clave}`;
}
