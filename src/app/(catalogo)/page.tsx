// Inicio del catálogo, de arriba abajo:
//   1. Portada: la colección más reciente (foto + nombre + frase + «Ver la colección»), máx. 70 % de la pantalla.
//   2. Prendas destacadas: producto real en los primeros segundos (3 a 6 tarjetas grandes).
//   3. Las demás colecciones: foto, historia o descripción y vista previa de sus prendas.
//   4. Sobre la marca, en la franja oscura.
// Ninguna foto ni nombre se repite: la colección de la portada no vuelve a salir en el punto 3.
import Link from "next/link";
import { coleccionesPublicadas, prendasDestacadas } from "@/lib/catalogo";
import { hayMarca, obtenerMarca } from "@/lib/marca";
import { nombreTemporada } from "@/lib/tienda";
import { Espiral } from "./_componentes/Espiral";
import { Imagen } from "./_componentes/Imagen";
import { EnlaceWhatsapp } from "./_componentes/Seguimiento";
import { TarjetaPrenda } from "./_componentes/TarjetaPrenda";

// Se actualiza al instante cuando el panel cambia algo; esto es solo un respaldo.
export const revalidate = 3600;

// Cuántas prendas destacadas se muestran como máximo debajo de la portada.
const MAXIMO_DESTACADAS = 6;

// Hasta cuántas colecciones se muestran en bloques grandes; con más, en rejilla de tarjetas.
const MAXIMO_EN_BLOQUES = 3;

// La vista previa de prendas de una colección aparece desde estas prendas (con una sola,
// repetiría la foto grande del bloque).
const MINIMO_VISTA_PREVIA = 2;

// «Cómo comprar»: solo pasos que son ciertos para cualquier pedido por WhatsApp. Si un día hay
// datos fijos de envío o pagos, se agregan aquí.
const PASOS_COMPRA = [
  ["Elige tu prenda", "Mira las colecciones y abre la prenda que te guste para ver todas sus fotos y tallas."],
  ["Escríbenos por WhatsApp", "Toca «Preguntar por WhatsApp»: el mensaje ya lleva la prenda, tu talla y tu color."],
  ["Confirmamos tu pedido", "Te respondemos con la disponibilidad, el valor del envío y la forma de pago."],
] as const;

// Tarjetas destacadas: 2 columnas en el celular, 3 en computador.
const TAMANOS_DESTACADAS = "(min-width: 900px) 30vw, 50vw";

function cuantas(n: number) {
  return n === 1 ? "1 prenda" : `${n} prendas`;
}

export default async function Inicio() {
  const [colecciones, destacadasCrudas, marca] = await Promise.all([
    coleccionesPublicadas(),
    prendasDestacadas(MAXIMO_DESTACADAS),
    obtenerMarca(),
  ]);

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

  // La primera es la más reciente (ver coleccionesPublicadas): va en la portada.
  const [reciente, ...otras] = colecciones;

  // Si una prenda destacada tiene como foto principal la misma de la portada, su primera foto
  // pasa al final (si tiene más) para no ver la misma imagen dos veces seguidas.
  const destacadas = destacadasCrudas.map((p) =>
    p.fotos[0]?.id === reciente.portada?.id && p.fotos.length > 1
      ? { ...p, fotos: [...p.fotos.slice(1), p.fotos[0]] }
      : p,
  );

  return (
    <>
      {/* El título de la página queda para Google y lectores de pantalla; a la vista manda la portada. */}
      <h1 className="solo-lectores">Solena: colecciones de ropa</h1>

      {/* 1. Portada. Texto y foto forman un bloque centrado; la foto conserva su forma (no se corta). */}
      <section
        className="portada"
        id={otras.length === 0 ? "colecciones" : undefined}
        aria-labelledby="titulo-portada"
      >
        <div
          className="portada-foto"
          style={
            reciente.portada
              ? ({ "--proporcion": `${reciente.portada.ancho} / ${reciente.portada.alto}` } as React.CSSProperties)
              : undefined
          }
        >
          {reciente.portada ? (
            <Imagen foto={reciente.portada} sizes="(min-width: 900px) 40vw, 100vw" prioridad />
          ) : (
            <div className="sin-foto">
              <Espiral />
            </div>
          )}
          <Espiral className="sello" animada />
        </div>
        <div className="portada-texto">
          <p className="portada-antetitulo">
            Nueva · {reciente.temporada ? nombreTemporada(reciente.temporada) : "Colección"}
          </p>
          <h2 id="titulo-portada" className="portada-titulo">
            {reciente.nombre}
          </h2>
          {reciente.descripcion && <p className="portada-descripcion">{reciente.descripcion}</p>}
          <div className="portada-acciones">
            <Link className="boton" href={`/colecciones/${reciente.slug}`}>
              Ver la colección
            </Link>
            <EnlaceWhatsapp
              className="boton secundario"
              mensaje={`Hola, vi la colección ${reciente.nombre} y quiero saber más.`}
            >
              Preguntar por WhatsApp
            </EnlaceWhatsapp>
          </div>
          <p className="portada-dato">{cuantas(reciente.totalPrendas)}</p>
        </div>
      </section>

      {/* 2. Prendas destacadas: producto real apenas se baja de la portada. */}
      {destacadas.length > 0 && (
        // Con 1 o 2 prendas, el título va a la izquierda y las tarjetas a la derecha (sin hueco vacío).
        <section
          className={`seccion-inicio${destacadas.length <= 2 ? " destacadas-pocas" : ""}`}
          aria-labelledby="titulo-destacadas"
        >
          <div className="seccion-cabecera">
            <div>
              <p className="seccion-antetitulo">Para descubrir</p>
              <h2 id="titulo-destacadas">Prendas destacadas</h2>
            </div>
          </div>
          <ul className={`rejilla-destacadas cantidad-${Math.min(destacadas.length, 3)}`}>
            {destacadas.map((p) => (
              <li key={p.id}>
                <TarjetaPrenda prenda={p} sizes={TAMANOS_DESTACADAS} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cómo comprar: la clienta ve que hay un proceso claro y una persona real detrás. */}
      <section className="como-comprar aparece" aria-labelledby="titulo-como-comprar">
        <div className="seccion-cabecera centrada">
          <div>
            <p className="seccion-antetitulo">Así de fácil</p>
            <h2 id="titulo-como-comprar">Cómo comprar</h2>
          </div>
        </div>
        <ol className="pasos-compra">
          {PASOS_COMPRA.map(([titulo, texto], i) => (
            <li key={titulo}>
              <span className="paso-numero" aria-hidden>
                {i + 1}
              </span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
        <div className="como-comprar-accion">
          <EnlaceWhatsapp className="boton" mensaje="Hola, quiero hacer un pedido.">
            Escribir por WhatsApp
          </EnlaceWhatsapp>
        </div>
      </section>

      {/* 3. Las demás colecciones. */}
      {otras.length > 0 && (
        <section className="inicio-colecciones aparece" id="colecciones" aria-labelledby="titulo-colecciones">
          <div className="seccion-cabecera">
            <div>
              <p className="seccion-antetitulo">Colecciones</p>
              <h2 id="titulo-colecciones">Sigue descubriendo</h2>
            </div>
          </div>

          {otras.length <= MAXIMO_EN_BLOQUES ? (
            // Pocas: cada una en un bloque con foto grande, texto y vista previa, alternando lados.
            <ul className="colecciones-filas">
              {otras.map((c) => (
                <li key={c.id} className="coleccion-fila">
                  <Link href={`/colecciones/${c.slug}`} className="coleccion-fila-foto" tabIndex={-1} aria-hidden>
                    {c.portada ? (
                      <Imagen foto={c.portada} sizes="(min-width: 900px) 40vw, 100vw" alt="" />
                    ) : (
                      <div className="sin-foto">
                        <Espiral />
                      </div>
                    )}
                  </Link>
                  <div className="coleccion-fila-texto">
                    {c.temporada && <p className="antetitulo">{nombreTemporada(c.temporada)}</p>}
                    <h3>{c.nombre}</h3>
                    {(c.inspiracion || c.historia || c.descripcion) && (
                      <p className="coleccion-fila-descripcion">{c.inspiracion || c.historia || c.descripcion}</p>
                    )}
                    {c.vistaPrevia.length >= MINIMO_VISTA_PREVIA && (
                      <ul className="vista-previa" aria-label={`Algunas prendas de ${c.nombre}`}>
                        {c.vistaPrevia.map((p) => (
                          <li key={p.id}>
                            <Link href={`/prendas/${p.slug}`}>
                              <span className="vista-previa-foto">
                                <Imagen foto={p.foto} sizes="10rem" alt="" />
                              </span>
                              <span className="vista-previa-nombre">{p.nombre}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="coleccion-fila-acciones">
                      <Link className="boton secundario" href={`/colecciones/${c.slug}`}>
                        Ver la colección
                      </Link>
                      <span className="coleccion-dato">{cuantas(c.totalPrendas)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            // Muchas: rejilla de tarjetas grandes, todas a la vista y sin movimiento.
            <ul className="rejilla-colecciones">
              {otras.map((c) => (
                <li key={c.id} className="tarjeta-coleccion">
                  <div className="tarjeta-coleccion-foto">
                    {c.portada ? (
                      <Imagen foto={c.portada} sizes="(min-width: 900px) 30vw, 50vw" alt="" />
                    ) : (
                      <div className="sin-foto">
                        <Espiral />
                      </div>
                    )}
                  </div>
                  {c.temporada && <p className="antetitulo">{nombreTemporada(c.temporada)}</p>}
                  <h3>
                    <Link href={`/colecciones/${c.slug}`}>{c.nombre}</Link>
                  </h3>
                  <p>{cuantas(c.totalPrendas)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 4. Sobre la marca. */}
      {hayMarca(marca) && (
        <section className="sobre-marca aparece" id="sobre-la-marca" aria-labelledby="titulo-marca">
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
            <p className="seccion-antetitulo">La marca</p>
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
