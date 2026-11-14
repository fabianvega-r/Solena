// Ficha de una prenda: fotos, precio, talla y color, y el botón para preguntar por WhatsApp.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prendaPublicada } from "@/lib/catalogo";
import { ordenarTallas, precio } from "@/lib/tienda";
import { Espiral } from "../../_componentes/Espiral";
import { Imagen } from "../../_componentes/Imagen";
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

  return (
    <>
      <article className="ficha">
        <div className="galeria">
          {p.fotos.length > 0 ? (
            <ul aria-label={`Fotos de ${p.nombre}`}>
              {p.fotos.map((f, i) => (
                <li key={f.id}>
                  <Imagen
                    foto={f}
                    sizes="(min-width: 900px) 58vw, 100vw"
                    prioridad={i === 0}
                    alt={f.alt || (i === 0 ? p.nombre : `${p.nombre}, foto ${i + 1}`)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="sin-foto">
              <Espiral />
            </div>
          )}
          {p.fotos.length > 1 && <p className="pista">Desliza para ver las {p.fotos.length} fotos</p>}
        </div>

        <div className="ficha-info">
          {/* Una sola línea dice dónde está la prenda y sirve para regresar: Inicio / Colección. */}
          <nav className="ruta" aria-label="Estás en">
            <Link href="/">Inicio</Link>
            <span aria-hidden> / </span>
            <Link href={`/colecciones/${p.coleccion.slug}`}>{p.coleccion.nombre}</Link>
          </nav>
          <h1>{p.nombre}</h1>
          <div className="ficha-precio">
            {p.precio != null && <p className="precio grande">{precio(p.precio)}</p>}
            {!p.disponible && <p className="aviso-agotada">Agotada por ahora</p>}
          </div>
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

      {p.otras.length > 0 && (
        <section className="otras aparece" aria-labelledby="titulo-otras">
          <p className="seccion-antetitulo">De la misma colección</p>
          <h2 id="titulo-otras">Completa el look</h2>
          <ul className="rejilla-prendas">
            {p.otras.map((o) => (
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
