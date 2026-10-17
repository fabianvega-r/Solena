// Prepara una foto en el navegador antes de subirla:
// - Convierte HEIC/HEIF (fotos de iPhone) a JPG.
// - La reduce para que no pase el límite de la API (4 MB; Vercel corta en 4.5 MB).
// El servidor genera después las variantes finales de 480, 960 y 1600 px.

const LADO_MAXIMO = 2400; // margen sobre los 1600 px de la variante más grande
const PESO_MAXIMO = 3.8 * 1024 * 1024;
const TIPOS_DIRECTOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function esHeic(archivo: File) {
  return /image\/hei[cf]/.test(archivo.type) || /\.hei[cf]$/i.test(archivo.name);
}

function nombreJpg(nombre: string) {
  return nombre.replace(/\.[^.]+$/, "") + ".jpg";
}

function aBlob(canvas: HTMLCanvasElement, calidad: number): Promise<Blob> {
  return new Promise((resolver, rechazar) =>
    canvas.toBlob((b) => (b ? resolver(b) : rechazar(new Error("No se pudo comprimir la foto"))), "image/jpeg", calidad),
  );
}

export async function prepararFoto(archivo: File): Promise<File> {
  let imagen: Blob = archivo;

  if (esHeic(archivo)) {
    const { default: heic2any } = await import("heic2any");
    const resultado = await heic2any({ blob: archivo, toType: "image/jpeg", quality: 0.92 });
    imagen = Array.isArray(resultado) ? resultado[0] : resultado;
  } else if (!TIPOS_DIRECTOS.includes(archivo.type)) {
    throw new Error("Formato no soportado. Usa JPG, PNG, WebP, AVIF o HEIC.");
  }

  const bitmap = await createImageBitmap(imagen, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));

  // Si ya es pequeña y liviana, se sube tal cual para no perder calidad.
  if (imagen === archivo && escala === 1 && archivo.size <= PESO_MAXIMO) {
    bitmap.close();
    return archivo;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // fondo blanco para PNG con transparencia
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const calidad of [0.88, 0.8, 0.7, 0.6]) {
    const blob = await aBlob(canvas, calidad);
    if (blob.size <= PESO_MAXIMO) return new File([blob], nombreJpg(archivo.name), { type: "image/jpeg" });
  }
  throw new Error("La foto sigue pesando más de 4 MB después de reducirla.");
}
