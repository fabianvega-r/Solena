// Prenda en una rejilla: fotos y nombre. El precio se ve solo en la ficha de la prenda, cuando
// la clienta ya se interesó: en la rejilla, una fila de precios puede espantar antes de enamorar.
// Las fotos se pasan dentro de la tarjeta (FotosTarjeta); tocar la foto o el nombre abre la
// prenda. El corazón queda encima y funciona por separado.
import Link from "next/link";
import type { PrendaResumen } from "@/lib/catalogo";
import { Corazon } from "./Corazon";
import { Espiral } from "./Espiral";
import { FotosTarjeta } from "./FotosTarjeta";

// Ancho de cada tarjeta en la rejilla: 2 columnas en celular, 3 en tableta, 4 en computador.
export const TAMANOS_REJILLA = "(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw";

export type DatosTarjeta = Pick<PrendaResumen, "id" | "slug" | "nombre" | "disponible" | "fotos">;

export function TarjetaPrenda({ prenda, sizes }: { prenda: DatosTarjeta; sizes: string }) {
  const href = `/prendas/${prenda.slug}`;
  return (
    <article className={`tarjeta-prenda${prenda.disponible ? "" : " agotada"}`}>
      <div className="tarjeta-foto">
        {prenda.fotos.length > 0 ? (
          <FotosTarjeta fotos={prenda.fotos} href={href} nombre={prenda.nombre} sizes={sizes} />
        ) : (
          <Link href={href} tabIndex={-1} aria-hidden className="sin-foto">
            <Espiral />
          </Link>
        )}
        {!prenda.disponible && <span className="etiqueta-agotada">Agotada</span>}
      </div>
      <h3>
        <Link href={href}>{prenda.nombre}</Link>
      </h3>
      <Corazon prendaId={prenda.id} nombre={prenda.nombre} />
    </article>
  );
}
