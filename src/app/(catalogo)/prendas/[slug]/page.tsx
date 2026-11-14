// Ficha de una prenda: fotos, precio, talla y color, y el botón para preguntar por WhatsApp.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prendaPublicada } from "@/lib/catalogo";
import { ordenarTallas, precio } from "@/lib/tienda";
import { Espiral } from "../../_componentes/Espiral";
import { Galeria } from "../../_componentes/Galeria";
import { SelectorCompra } from "../../_componentes/SelectorCompra";
import { TAMANOS_REJILLA, TarjetaPrenda } from "../../_componentes/TarjetaPrenda";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await prendaPublicada((await params).slug);
  if (!p) return {};
  return {
    title: p.nombre,
    description: p.descripcion ?? `${p.nombre}, de la colección ${p.coleccion.nombre}.`,
    openGraph: { images: p.fotos[0] ? [p.fotos[0].urls.md] : [] },
  };
}

export default async function PaginaPrenda({ params }: Props) {
  const p = await prendaPublicada((await params).slug);
  if (!p) notFound();

  const otrasPrendas = p.otras.length > 0 ? p.otras : p.deOtrasColecciones;

  return (
    <>
      {/* Barra de navegación: volver a la colección (izquierda) y pasar a la prenda anterior o
          siguiente de la misma colección (derecha), sin tener que regresar y volver a entrar. */}
      <nav className="navegacion-pagina" aria-label="Navegación de la colección">
        <Link className="volver-coleccion" href={`/colecciones/${p.coleccion.slug}`}>
          <span aria-hidden>←</span> Volver a la colección <strong>{p.coleccion.nombre}</strong>
        </Link>
        {p.vecinas && (
          <div className="prenda-vecinas">
            <Link href={`/prendas/${p.vecinas.anterior.slug}`} aria-label={`Prenda anterior: ${p.vecinas.anterior.nombre}`}>
              <span aria-hidden>‹</span> Anterior
            </Link>
            <span className="prenda-posicion">
              {p.vecinas.posicion} de {p.vecinas.total}
            </span>
            <Link href={`/prendas/${p.vecinas.siguiente.slug}`} aria-label={`Prenda siguiente: ${p.vecinas.siguiente.nombre}`}>
              Siguiente <span aria-hidden>›</span>
            </Link>
          </div>
        )}
      </nav>

      <article className="ficha">
        {p.fotos.length > 0 ? (
          <Galeria fotos={p.fotos} nombre={p.nombre} />
        ) : (
          <div className="galeria">
            <div className="sin-foto">
              <Espiral />
            </div>
          </div>
        )}

        <div className="ficha-info">
          <h1>{p.nombre}</h1>
          {/* El precio no va aquí arriba: aparece bajo las tallas (SelectorCompra), cuando la clienta
              ya vio la prenda y eligió su talla. */}
          {!p.disponible && (
            <div className="ficha-precio">
              <p className="aviso-agotada">Agotada por ahora</p>
            </div>
          )}
          {p.descripcion && <p className="descripcion">{p.descripcion}</p>}
          <SelectorCompra
            prendaId={p.id}
            nombre={p.nombre}
            precio={p.precio != null ? precio(p.precio) : null}
            medidasModelo={p.medidasModelo}
            tallas={ordenarTallas(p.tallas)}
            colores={p.colores}
            disponible={p.disponible}
          />

          {/* Materiales y cuidados: plegados, para que la ficha no se alargue; se abren con un toque. */}
          {(p.materiales || p.cuidados) && (
            <div className="detalles">
              {p.materiales && (
                <details>
                  <summary>Materiales</summary>
                  <p>{p.materiales}</p>
                </details>
              )}
              {p.cuidados && (
                <details>
                  <summary>Cuidados</summary>
                  <p>{p.cuidados}</p>
                </details>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Más prendas: de la misma colección («Completa el look») o, si no hay, de otras. */}
      {otrasPrendas.length > 0 && (
        <section className="otras aparece" aria-labelledby="titulo-otras">
          <p className="seccion-antetitulo">{p.otras.length > 0 ? "De la misma colección" : "De otras colecciones"}</p>
          <h2 id="titulo-otras">{p.otras.length > 0 ? "Completa el look" : "También te puede gustar"}</h2>
          <ul className="rejilla-prendas">
            {otrasPrendas.map((o) => (
              <li key={o.id}>
                <TarjetaPrenda prenda={o} sizes={TAMANOS_REJILLA} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
