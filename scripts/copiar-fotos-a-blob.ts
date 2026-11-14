// Copia todas las fotos de MinIO (local) a Vercel Blob, con los mismos nombres, para publicar el
// sitio sin perder fotos. La base de datos no cambia: solo guarda el nombre (clave) de cada foto.
//
// Uso (desde la carpeta del proyecto, con Docker/MinIO encendido):
//   1. Agrega al .env la variable BLOB_READ_WRITE_TOKEN (Vercel → Storage → tu Blob → .env.local).
//   2. npm run fotos:copiar-a-blob
//   3. El script muestra FOTOS_URL_PUBLICA: agrégala al .env y a Vercel.
// Se puede repetir sin problema: las fotos que ya están en Vercel Blob se saltan.
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { head, put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

function env(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable ${nombre} en el .env`);
  return valor;
}

env("BLOB_READ_WRITE_TOKEN"); // la usa @vercel/blob por su cuenta; se revisa aquí para avisar claro

const minio = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: env("S3_ENDPOINT"),
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: { accessKeyId: env("S3_ACCESS_KEY_ID"), secretAccessKey: env("S3_SECRET_ACCESS_KEY") },
});
const BUCKET = env("S3_BUCKET");
const VARIANTES = ["sm", "md", "lg"]; // las mismas de src/lib/imagenes.ts
const UN_ANIO = 60 * 60 * 24 * 365; // igual que src/lib/storage.ts

async function yaExiste(clave: string): Promise<string | null> {
  try {
    return (await head(clave)).url;
  } catch {
    return null;
  }
}

async function main() {
  const db = new PrismaClient();
  const fotos = await db.foto.findMany({ select: { clave: true } });
  await db.$disconnect();
  console.log(`Fotos en la base de datos: ${fotos.length} (${fotos.length * VARIANTES.length} archivos)`);

  let copiados = 0;
  let saltados = 0;
  let unaUrl: string | null = null; // para mostrar la dirección base del almacenamiento
  const faltan: string[] = [];
  for (const { clave } of fotos) {
    for (const v of VARIANTES) {
      const archivo = `${clave}/${v}.webp`;
      const existente = await yaExiste(archivo);
      if (existente) {
        unaUrl ??= existente;
        saltados++;
        continue;
      }
      try {
        const obj = await minio.send(new GetObjectCommand({ Bucket: BUCKET, Key: archivo }));
        const cuerpo = Buffer.from(await obj.Body!.transformToByteArray());
        const subido = await put(archivo, cuerpo, {
          access: "public",
          contentType: "image/webp",
          addRandomSuffix: false,
          cacheControlMaxAge: UN_ANIO,
        });
        unaUrl ??= subido.url;
        copiados++;
        process.stdout.write(".");
      } catch {
        faltan.push(archivo);
      }
    }
  }

  console.log(`\n✔ Copiados: ${copiados} · ya estaban: ${saltados} · no encontrados en MinIO: ${faltan.length}`);
  if (faltan.length) console.log("No se encontraron (revisa que Docker/MinIO esté encendido):\n  " + faltan.join("\n  "));
  if (unaUrl) {
    console.log(`\nAgrega esta variable al .env y en Vercel (Settings → Environment Variables):`);
    console.log(`FOTOS_URL_PUBLICA=${new URL(unaUrl).origin}`);
  }
}

main().catch((e) => {
  console.error("✘ No se pudo copiar:", e.message);
  process.exit(1);
});
