// Página de una colección publicada: presentación, fotos de campaña y sus prendas.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coleccionPublicada } from "@/lib/catalogo";
import { Espiral } from "../../_componentes/Espiral";
import { Imagen } from "../../_componentes/Imagen";
import { Prendas } from "../../_componentes/Prendas";
import { EnlaceWhatsapp } from "../../_componentes/Seguimiento";
import { nombreTemporada, parrafos } from "@/lib/tienda";

export const revalidate = 3600;

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

        {/* Jerarquía simple: ruta → qué es (antetítulo) → nombre → descripción → acciones.
            Los nombres de las prendas no se listan aquí: ya salen en las fotos y en la rejilla. */}
        <div className="cabecera-coleccion-texto">
          <nav className="ruta" aria-label="Estás en">
            <Link href="/">Inicio</Link>
            <span aria-hidden> / </span>
            <Link href="/#colecciones">Colecciones</Link>
          </nav>
          {c.temporada && <p className="antetitulo">{nombreTemporada(c.temporada)}</p>}
          <h1 className="titular">{c.nombre}</h1>
          {c.descripcion && <p className="cabecera-coleccion-descripcion">{c.descripcion}</p>}

          <div className="acciones-coleccion">
            {total > 0 && (
              <a className="boton" href="#prendas">
                {total === 1 ? "Ver la prenda" : "Ver las prendas"}
              </a>
            )}
            <EnlaceWhatsapp
              className="boton secundario"
              mensaje={`Hola, vi la colección «${c.nombre}» en el catálogo y quiero saber más.`}
            >
              Preguntar por WhatsApp
            </EnlaceWhatsapp>
          </div>
          {total > 0 && <p className="coleccion-dato">{total === 1 ? "1 prenda" : `${total} prendas`}</p>}
        </div>
      </header>

      {/* «La historia»: texto editorial a la izquierda; inspiración y materiales como notas a la
          derecha. Solo aparece si la colección tiene alguno de esos textos (se escriben en el panel). */}
      {(c.historia || c.inspiracion || c.materiales) && (
        <section className="coleccion-historia aparece" aria-labelledby="titulo-historia">
          <div className="coleccion-historia-texto">
            <p className="seccion-antetitulo">La historia</p>
            <h2 id="titulo-historia">Detrás de la colección</h2>
            {c.historia && (
              <div className="texto-largo">
                {parrafos(c.historia).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </div>
          {(c.inspiracion || c.materiales) && (
            <dl className="notas">
              {c.inspiracion && (
                <div>
                  <dt>Inspiración</dt>
                  <dd>{c.inspiracion}</dd>
                </div>
              )}
              {c.materiales && (
                <div>
                  <dt>Materiales</dt>
                  <dd>{c.materiales}</dd>
                </div>
              )}
            </dl>
          )}
        </section>
      )}

      {c.prendas.length > 0 ? (
        <Prendas prendas={c.prendas} />
      ) : (
        <p className="vacio">Esta colección todavía no tiene prendas.</p>
      )}
    </>
  );
}
