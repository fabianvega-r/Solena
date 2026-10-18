// Inicio del catálogo: todas las colecciones lado a lado (la más reciente primero), las prendas
// de la más reciente y «Sobre la marca». Al entrar se entiende qué hay y dónde tocar.
import Link from "next/link";
import { coleccionesPublicadas, coleccionPublicada } from "@/lib/catalogo";
import { hayMarca, obtenerMarca } from "@/lib/marca";
import { nombreTemporada, precio } from "@/lib/tienda";
import { Espiral } from "./_componentes/Espiral";
import { Imagen } from "./_componentes/Imagen";
import { EnlaceWhatsapp } from "./_componentes/Seguimiento";
import { TAMANOS_REJILLA, TarjetaPrenda } from "./_componentes/TarjetaPrenda";

// Se actualiza al instante cuando el panel cambia algo; esto es solo un respaldo.
export const revalidate = 3600;

// Cuántas prendas de la colección reciente se muestran en el inicio.
const PRENDAS_EN_INICIO = 8;

function cuantas(n: number) {
  return n === 1 ? "1 prenda" : `${n} prendas`;
}

export default async function Inicio() {
  const [colecciones, marca] = await Promise.all([coleccionesPublicadas(), obtenerMarca()]);

  if (colecciones.length === 0) {
    return (
      <section className="vacio">
        <Espiral className="vacio-espiral" />
        <h1>Estamos preparando la próxima colección</h1>
        <p>Mientras tanto, escríbenos y te contamos qué prendas hay disponibles.</p>
        <EnlaceWhatsapp className="boton" mensaje="Hola, quiero saber qué prendas tienen disponibles.">
          Escribir por WhatsApp
        </EnlaceWhatsapp>
      </section>
    );
  }

  // La primera es la más reciente (ver coleccionesPublicadas): sus prendas van debajo como «Lo nuevo».
  const reciente = colecciones[0];
  const detalle = await coleccionPublicada(reciente.slug);
  const prendas = detalle?.prendas.slice(0, PRENDAS_EN_INICIO) ?? [];

  return (
    <>
      <section className="inicio-colecciones" aria-labelledby="titulo-colecciones">
        <div className="inicio-intro">
          <h1 id="titulo-colecciones">Colecciones</h1>
          <p>Elige una colección para ver sus prendas. Si algo te gusta, pregúntanos por WhatsApp.</p>
        </div>
        <ul className="rejilla-colecciones">
          {colecciones.map((c, i) => (
            <li key={c.id} className="tarjeta-coleccion">
              <div className="tarjeta-coleccion-foto">
                {c.portada ? (
                  <Imagen foto={c.portada} sizes="(min-width: 900px) 33vw, 50vw" alt="" prioridad={i < 3} />
                ) : (
                  <div className="sin-foto">
                    <Espiral />
                  </div>
                )}
                {i === 0 && <span className="etiqueta-nueva">Nueva</span>}
              </div>
              <h2>
                <Link href={`/colecciones/${c.slug}`}>{c.nombre}</Link>
              </h2>
              {c.temporada && <p className="antetitulo">{nombreTemporada(c.temporada)}</p>}
              <p>
                {cuantas(c.totalPrendas)}
                {c.desde != null ? `, desde ${precio(c.desde)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {prendas.length > 0 && (
        <section className="seccion-inicio" aria-labelledby="titulo-prendas-inicio">
          <div className="seccion-cabecera">
            <h2 id="titulo-prendas-inicio">Lo más nuevo</h2>
            <Link href={`/colecciones/${reciente.slug}`} className="ver-todo">
              Ver toda la colección {reciente.nombre}
            </Link>
          </div>
          <ul className="rejilla-prendas">
            {prendas.map((p) => (
              <li key={p.id}>
                <TarjetaPrenda prenda={p} sizes={TAMANOS_REJILLA} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hayMarca(marca) && (
        <section className="sobre-marca" id="sobre-la-marca" aria-labelledby="titulo-marca">
          {marca.foto && (
            <div className="foto-arco">
              <Imagen
                foto={marca.foto}
                sizes="(min-width: 900px) 34vw, 100vw"
                alt={marca.fundadoraNombre ? `${marca.fundadoraNombre}, de Solena` : "La fundadora de Solena"}
              />
            </div>
          )}
          <div className="sobre-marca-texto">
            <h2 id="titulo-marca">{marca.titulo ?? "Sobre Solena"}</h2>
            {marca.resumen && <p className="historia">{marca.resumen}</p>}
            {marca.fundadoraNombre && (
              <p className="cargo">
                {marca.fundadoraNombre}
                {marca.fundadoraCargo ? `, ${marca.fundadoraCargo.toLowerCase()}` : ""}
              </p>
            )}
            <Link className="boton" href="/sobre-solena">
              Conoce la historia de Solena
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
