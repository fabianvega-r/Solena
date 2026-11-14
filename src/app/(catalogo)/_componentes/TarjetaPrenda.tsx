// Prenda en una rejilla: foto y nombre. El precio se ve solo en la ficha de la prenda, cuando
// la clienta ya se interesó: en la rejilla, una fila de precios puede espantar antes de enamorar.
// Toda la tarjeta lleva a la prenda; el corazón queda encima y funciona por separado.
import Link from "next/link";
import type { PrendaResumen } from "@/lib/catalogo";
import { Corazon } from "./Corazon";
import { Espiral } from "./Espiral";
import { Imagen } from "./Imagen";

// Ancho de cada tarjeta en la rejilla: 2 columnas en celular, 3 en tableta, 4 en computador.
export const TAMANOS_REJILLA = "(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw";

export type DatosTarjeta = Pick<PrendaResumen, "id" | "slug" | "nombre" | "disponible" | "foto" | "foto2">;

export function TarjetaPrenda({ prenda, sizes }: { prenda: DatosTarjeta; sizes: string }) {
  return (
    <article className={`tarjeta-prenda${prenda.disponible ? "" : " agotada"}`}>
      <div className="tarjeta-foto">
        {prenda.foto ? (
          <>
            <Imagen foto={prenda.foto} sizes={sizes} alt="" />
            {/* Segunda foto: aparece al pasar el mouse (ver .foto-2 en catalogo.css). */}
            {prenda.foto2 && <Imagen foto={prenda.foto2} sizes={sizes} alt="" className="foto-2" />}
          </>
        ) : (
          <div className="sin-foto">
            <Espiral />
          </div>
        )}
        {!prenda.disponible && <span className="etiqueta-agotada">Agotada</span>}
      </div>
      <h3>
        <Link href={`/prendas/${prenda.slug}`}>{prenda.nombre}</Link>
      </h3>
      <Corazon prendaId={prenda.id} nombre={prenda.nombre} />
    </article>
  );
}
