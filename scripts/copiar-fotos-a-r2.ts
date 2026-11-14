// Copia todas las fotos de MinIO (local) a Cloudflare R2, con los mismos nombres, para publicar
// el sitio sin perder fotos. La base de datos no cambia: solo guarda el nombre (clave) de cada foto.
//
// Uso (desde la carpeta del proyecto, con Docker/MinIO encendido):
//   1. Agrega al .env las 4 variables de R2 (R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).
//   2. npm run fotos:copiar-a-r2
// Se puede repetir sin problema: las fotos que ya están en R2 se saltan.
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

function env(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable ${nombre} en el .env`);
  return valor;
}

const origen = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: env("S3_ENDPOINT"),
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: { accessKeyId: env("S3_ACCESS_KEY_ID"), secretAccessKey: env("S3_SECRET_ACCESS_KEY") },
});
const destino = new S3Client({
  region: "auto",
  endpoint: env("R2_ENDPOINT"),
  credentials: { accessKeyId: env("R2_ACCESS_KEY_ID"), secretAccessKey: env("R2_SECRET_ACCESS_KEY") },
});
const BUCKET_ORIGEN = env("S3_BUCKET");
const BUCKET_DESTINO = env("R2_BUCKET");
const VARIANTES = ["sm", "md", "lg"]; // las mismas de src/lib/imagenes.ts

async function yaExiste(clave: string) {
  try {
    await destino.send(new HeadObjectCommand({ Bucket: BUCKET_DESTINO, Key: clave }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const db = new PrismaClient();
  const fotos = await db.foto.findMany({ select: { clave: true } });
  await db.$disconnect();
  console.log(`Fotos en la base de datos: ${fotos.length} (${fotos.length * VARIANTES.length} archivos)`);

  let copiados = 0;
  let saltados = 0;
  const faltan: string[] = [];
  for (const { clave } of fotos) {
    for (const v of VARIANTES) {
      const archivo = `${clave}/${v}.webp`;
      if (await yaExiste(archivo)) {
        saltados++;
        continue;
      }
      try {
        const obj = await origen.send(new GetObjectCommand({ Bucket: BUCKET_ORIGEN, Key: archivo }));
        const cuerpo = Buffer.from(await obj.Body!.transformToByteArray());
        await destino.send(
          new PutObjectCommand({
            Bucket: BUCKET_DESTINO,
            Key: archivo,
            Body: cuerpo,
            ContentType: "image/webp",
            CacheControl: "public, max-age=31536000, immutable", // igual que src/lib/storage.ts
          }),
        );
        copiados++;
        process.stdout.write(".");
      } catch {
        faltan.push(archivo);
      }
    }
  }

  console.log(`\n✔ Copiados: ${copiados} · ya estaban: ${saltados} · no encontrados en MinIO: ${faltan.length}`);
  if (faltan.length) console.log("No se encontraron (revisa que Docker/MinIO esté encendido):\n  " + faltan.join("\n  "));
}

main().catch((e) => {
  console.error("✘ No se pudo copiar:", e.message);
  process.exit(1);
});
