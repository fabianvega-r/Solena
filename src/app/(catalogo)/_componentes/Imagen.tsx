// Foto del catálogo: el navegador elige la variante (480/960/1600 px) según el ancho
// de pantalla, y mientras descarga se ve la versión difuminada de fondo.
import type { FotoPublica } from "@/lib/catalogo";

type Props = {
  foto: FotoPublica;
  // Ancho que ocupa la foto en pantalla, p. ej. "(min-width: 900px) 50vw, 100vw".
  sizes: string;
  // Solo para la primera foto visible al abrir la página.
  prioridad?: boolean;
  alt?: string;
};

export function Imagen({ foto, sizes, prioridad = false, alt }: Props) {
  return (
    <img
      className="imagen"
      src={foto.urls.md}
      srcSet={foto.srcSet}
      sizes={sizes}
      width={foto.ancho}
      height={foto.alto}
      alt={alt ?? foto.alt}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : "auto"}
      decoding="async"
      style={{ backgroundImage: `url(${foto.blurDataUrl})` }}
    />
  );
}
