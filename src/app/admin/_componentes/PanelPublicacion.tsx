// Checklist de publicación de una colección, con el botón para publicar o pasar a borrador.
import Link from "next/link";
import type { Paso, Revision } from "@/lib/publicacion";
import { cambiarPublicacion } from "../acciones";
import { BotonAccion } from "./Formularios";

function ListaPasos({ pasos, opcional }: { pasos: Paso[]; opcional?: boolean }) {
  return (
    <ul className="pasos">
      {pasos.map((p) => (
        <li key={p.id} className={p.cumplido ? "cumplido" : opcional ? "opcional" : "pendiente"}>
          <span className="paso-icono" aria-hidden>
            {p.cumplido ? "✓" : opcional ? "·" : "!"}
          </span>
          <div>
            {p.enlace && !p.cumplido ? <Link href={p.enlace}>{p.texto}</Link> : <span>{p.texto}</span>}
            {p.detalle && <small>{p.detalle}</small>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PanelPublicacion({ id, publicada, revision }: { id: string; publicada: boolean; revision: Revision }) {
  const { requisitos, recomendaciones, lista } = revision;
  const hechos = requisitos.filter((p) => p.cumplido).length;
  const recomendacionesPendientes = recomendaciones.filter((p) => !p.cumplido).length;

  let titulo: string;
  let descripcion: string;
  let tono: string;
  if (publicada && lista) {
    titulo = "Publicada";
    descripcion = "Esta colección y todas sus prendas se ven en el catálogo.";
    tono = "ok";
  } else if (publicada) {
    titulo = "Publicada, con problemas";
    descripcion = "Se ve en el catálogo, pero hay prendas sin fotos que aparecerán sin imagen.";
    tono = "aviso";
  } else if (lista) {
    titulo = "Lista para publicar";
    descripcion = "Cumple todo lo necesario. Cuando la publiques, se verá en el catálogo.";
    tono = "listo";
  } else {
    titulo = "Borrador";
    descripcion = "Completa los pasos obligatorios para poder publicarla. Mientras tanto nadie la ve.";
    tono = "borrador";
  }

  return (
    <section className={`tarjeta publicacion ${tono}`} id="publicar" aria-labelledby="titulo-publicacion">
      <div className="publicacion-cabecera">
        <div>
          <h2 id="titulo-publicacion">{titulo}</h2>
          <p className="ayuda">{descripcion}</p>
        </div>
        {!publicada && (
          <span className="progreso-texto">
            {hechos} de {requisitos.length} pasos
          </span>
        )}
      </div>

      {!publicada && (
        <div className="progreso" role="progressbar" aria-valuemin={0} aria-valuemax={requisitos.length} aria-valuenow={hechos}>
          <div style={{ width: `${(hechos / requisitos.length) * 100}%` }} />
        </div>
      )}

      {(!publicada || !lista) && (
        <>
          <h3>Obligatorio</h3>
          <ListaPasos pasos={requisitos} />
        </>
      )}

      {recomendacionesPendientes > 0 && (
        <details open={!publicada && lista}>
          <summary>Recomendado ({recomendacionesPendientes} pendientes)</summary>
          <ListaPasos pasos={recomendaciones} opcional />
        </details>
      )}

      <div className="publicacion-acciones">
        {publicada ? (
          <BotonAccion
            accion={cambiarPublicacion.bind(null, id, false)}
            texto="Pasar a borrador"
            textoPendiente="Cambiando…"
            pregunta="La colección dejará de verse en el catálogo. No se borra nada. ¿Continuar?"
          />
        ) : lista ? (
          <BotonAccion
            accion={cambiarPublicacion.bind(null, id, true)}
            texto="Publicar colección"
            textoPendiente="Publicando…"
            clase="primario"
            pregunta={
              recomendacionesPendientes > 0
                ? `Quedan ${recomendacionesPendientes} recomendaciones sin hacer. Puedes publicar igual y completarlas después. ¿Publicar ahora?`
                : undefined
            }
          />
        ) : (
          <button type="button" className="primario" disabled>
            Publicar colección
          </button>
        )}
      </div>
    </section>
  );
}
