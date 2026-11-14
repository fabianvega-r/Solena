// Página de una colección publicada: presentación, fotos de campaña y sus prendas.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coleccionPublicada } from "@/lib/catalogo";
import { Espiral } from "../../_componentes/Espiral";
import { Imagen } from "../../_componentes/Imagen";
import { Prendas } from "../../_componentes/Prendas";
import { EnlaceWhatsapp } from "../../_componentes/Seguimiento";
import { nombreTemporada } from "@/lib/tienda";

export const revalidate = 3600;

// Cuántos nombres de prenda se muestran junto al nombre de la colección; el resto, en la rejilla.
const PRENDAS_EN_CABECERA = 5;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await coleccionPublicada((await params).slug);
  if (!c) return {};
  return {
    title: c.nombre,
    description: c.descripcion ?? `Colección ${c.nombre} de Solena.`,
    openGraph: { images: c.portada ? [c.portada.urls.md] : [] },
  };
}

export default async function PaginaColeccion({ params }: Props) {
  const c = await coleccionPublicada((await params).slug);
  if (!c) notFound();
  // Portada primero y luego las fotos de campaña, sin repetirla: la ropa abre la página.
  const fotos = [...(c.portada ? [c.portada] : []), ...c.fotos.filter((f) => f.id !== c.portada?.id)];
  // Si la foto es de una prenda (la portada suele serlo), se dice cuál es y se enlaza a ella.
  const prendaDe = (f: (typeof fotos)[number]) => c.prendas.find((p) => p.id === f.prendaId);
  const total = c.prendas.length;

  return (
    <>
      <header className="cabecera-coleccion">
        {fotos.length > 0 && (
          <ul className="cabecera-coleccion-fotos" aria-label="Fotos de la colección">
            {fotos.map((f, i) => {
              const prenda = prendaDe(f);
              return (
                <li key={f.id}>
                  <Imagen foto={f} sizes="(min-width: 900px) 34vw, 85vw" prioridad={i === 0} />
                  {i === 0 && <Espiral className="sello" animada />}
                  {prenda && (
                    <Link className="foto-prenda" href={`/prendas/${prenda.slug}`}>
                      <span className="foto-prenda-etiqueta">Prenda</span>
                      {prenda.nombre}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Jerarquía simple: qué es (antetítulo) → nombre → descripción → ficha de datos → acciones.
            Un solo estilo de etiqueta en toda la ficha, para que se lea ordenado. */}
        <div className="cabecera-coleccion-texto">
          <p className="antetitulo">{c.temporada ? nombreTemporada(c.temporada) : "Colección"}</p>
          <h1 className="titular">{c.nombre}</h1>
          {c.descripcion && <p className="cabecera-coleccion-descripcion">{c.descripcion}</p>}

          {/* Ficha de datos: etiqueta a la izquierda, valor a la derecha, entre líneas finas. */}
          {total > 0 && (
            <dl className="ficha-datos">
              <div>
                <dt>{total === 1 ? "Prenda" : "Prendas"}</dt>
                <dd>
                  {c.prendas.slice(0, PRENDAS_EN_CABECERA).map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && " · "}
                      <Link href={`/prendas/${p.slug}`}>{p.nombre}</Link>
                    </span>
                  ))}
                  {total > PRENDAS_EN_CABECERA && (
                    <>
                      {" · "}
                      <a href="#prendas">y {total - PRENDAS_EN_CABECERA} más</a>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          )}

          <div className="acciones-coleccion">
            {total > 0 && (
              <a className="boton" href="#prendas">
                {total === 1 ? "Ver la prenda" : `Ver las ${total} prendas`}
              </a>
            )}
            <EnlaceWhatsapp
              className="boton secundario"
              mensaje={`Hola, vi la colección «${c.nombre}» en el catálogo y quiero saber más.`}
            >
              Preguntar por WhatsApp
            </EnlaceWhatsapp>
          </div>
        </div>
      </header>

      {c.prendas.length > 0 ? (
        <Prendas prendas={c.prendas} />
      ) : (
        <p className="vacio">Esta colección todavía no tiene prendas.</p>
      )}
    </>
  );
}
