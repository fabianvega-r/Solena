// Página de una colección publicada: portada (igual a la del inicio), su historia y sus prendas.
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

// Cada colección se arma la primera vez que alguien la abre y queda guardada, como el inicio:
// las visitas siguientes no consultan la base de datos (de 1-2 s a milisegundos). Se renueva
// cuando el panel guarda cambios (revalidatePath en acciones.ts) o, como respaldo, cada hora.
export async function generateStaticParams() {
  return [];
}

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
  const total = c.prendas.length;

  return (
    <>
      {/* Mismo botón de regreso que la ficha de prenda: claro y en el mismo lugar. */}
      <nav className="navegacion-pagina" aria-label="Navegación">
        <Link className="volver-coleccion" href="/#colecciones">
          <span aria-hidden>←</span> Todas las colecciones
        </Link>
      </nav>

      {/* Misma portada que el inicio (clases .portada-*): un solo diseño en todo el catálogo.
          Una sola línea de antetítulo, el nombre, la descripción y dos botones; el conteo de
          prendas va dentro del botón principal. La foto conserva su forma (no se corta). */}
      <header className="portada">
        <div
          className="portada-foto"
          style={
            c.portada
              ? ({ "--proporcion": `${c.portada.ancho} / ${c.portada.alto}` } as React.CSSProperties)
              : undefined
          }
        >
          {c.portada ? (
            <Imagen foto={c.portada} sizes="(min-width: 900px) 40vw, 100vw" prioridad />
          ) : (
            <div className="sin-foto">
              <Espiral />
            </div>
          )}
          <Espiral className="sello" animada />
        </div>
        <div className="portada-texto">
          <p className="portada-antetitulo">{c.temporada ? nombreTemporada(c.temporada) : "Colección"}</p>
          <h1 className="portada-titulo">{c.nombre}</h1>
          {c.descripcion && <p className="portada-descripcion">{c.descripcion}</p>}
          <div className="portada-acciones">
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
