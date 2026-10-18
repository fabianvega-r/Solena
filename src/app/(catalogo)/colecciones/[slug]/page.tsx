// Página de una colección publicada: presentación, fotos de campaña y sus prendas.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coleccionPublicada } from "@/lib/catalogo";
import { Espiral } from "../../_componentes/Espiral";
import { Imagen } from "../../_componentes/Imagen";
import { Prendas } from "../../_componentes/Prendas";
import { EnlaceWhatsapp } from "../../_componentes/Seguimiento";
import { nombreTemporada, precio } from "@/lib/tienda";

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
  // Las fotos de campaña, sin repetir la que ya se muestra como portada.
  const campana = c.fotos.filter((f) => f.id !== c.portada?.id);

  return (
    <>
      <header className="cabecera-coleccion">
        <div className="cabecera-coleccion-texto">
          <Link className="volver" href="/">
            Volver al inicio
          </Link>
          <p className="antetitulo">{c.temporada ? nombreTemporada(c.temporada) : "Colección"}</p>
          <h1 className="titular">{c.nombre}</h1>
          {c.descripcion && <p className="entrada">{c.descripcion}</p>}

          {/* Lo que una clienta quiere saber de un vistazo. */}
          <dl className="datos-coleccion">
            {c.temporada && (
              <div>
                <dt>Temporada</dt>
                <dd>{c.temporada.charAt(0).toLocaleUpperCase("es") + c.temporada.slice(1)}</dd>
              </div>
            )}
            <div>
              <dt>Prendas</dt>
              <dd>{c.prendas.length}</dd>
            </div>
            {c.desde != null && (
              <div>
                <dt>Desde</dt>
                <dd>{precio(c.desde)}</dd>
              </div>
            )}
          </dl>

          <div className="acciones-coleccion">
            {c.prendas.length > 0 && (
              <a className="boton" href="#prendas">
                Ver las prendas
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
        {c.portada && (
          <div className="cabecera-coleccion-foto">
            <Imagen foto={c.portada} sizes="(min-width: 900px) 45vw, 100vw" prioridad />
            <Espiral className="sello" animada />
          </div>
        )}
      </header>

      {campana.length > 0 && (
        <section className="campana" aria-label="Fotos de la campaña">
          <ul>
            {campana.map((f) => (
              <li key={f.id}>
                <Imagen foto={f} sizes="(min-width: 900px) 40vw, 85vw" />
              </li>
            ))}
          </ul>
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
