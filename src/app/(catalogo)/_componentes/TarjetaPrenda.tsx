// Prenda en una rejilla: foto, nombre y precio. Toda la tarjeta lleva a la prenda;
// el corazón queda encima y funciona por separado.
import Link from "next/link";
import type { PrendaResumen } from "@/lib/catalogo";
import { precio } from "@/lib/tienda";
import { Corazon } from "./Corazon";
import { Espiral } from "./Espiral";
import { Imagen } from "./Imagen";

// Ancho de cada tarjeta en la rejilla: 2 columnas en celular, 3 en tableta, 4 en computador.
export const TAMANOS_REJILLA = "(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw";

export type DatosTarjeta = Pick<PrendaResumen, "id" | "slug" | "nombre" | "precio" | "disponible" | "foto">;

export function TarjetaPrenda({ prenda, sizes }: { prenda: DatosTarjeta; sizes: string }) {
  return (
    <article className={`tarjeta-prenda${prenda.disponible ? "" : " agotada"}`}>
      <div className="tarjeta-foto">
        {prenda.foto ? (
          <Imagen foto={prenda.foto} sizes={sizes} alt="" />
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
      {prenda.precio != null && <p className="precio">{precio(prenda.precio)}</p>}
      <Corazon prendaId={prenda.id} nombre={prenda.nombre} />
    </article>
  );
}
