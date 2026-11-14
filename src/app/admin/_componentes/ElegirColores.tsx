"use client";
// Colores de una prenda: se tocan en la paleta (cada uno con su círculo de color) y, si falta
// alguno, se escribe en «Otro color». Lo elegido viaja al servidor en un campo oculto «colores»,
// separado por comas, igual que antes; el servidor lo valida (ver guardarPrenda).
import { useState, type KeyboardEvent } from "react";
import { limpiarColor, mismoColor, muestraDeColor } from "@/lib/colores";

const MAXIMO = 20; // el mismo límite que DatosPrenda en src/lib/esquemas.ts

export function ElegirColores({ conocidos, iniciales }: { conocidos: string[]; iniciales: string[] }) {
  // Los colores ya guardados se muestran con el nombre de la paleta («amarillo» → «Amarillo»).
  const comoEnPaleta = (c: string) => conocidos.find((k) => mismoColor(k, c)) ?? c;
  const [opciones, setOpciones] = useState(() => {
    const extra = iniciales.filter((c) => !conocidos.some((k) => mismoColor(k, c)));
    return [...conocidos, ...extra];
  });
  const [elegidos, setElegidos] = useState(() => iniciales.map(comoEnPaleta));
  const [nuevo, setNuevo] = useState("");
  const [aviso, setAviso] = useState("");

  const estaElegido = (c: string) => elegidos.some((e) => mismoColor(e, c));

  function alternar(color: string) {
    setAviso("");
    if (estaElegido(color)) {
      setElegidos(elegidos.filter((e) => !mismoColor(e, color)));
    } else if (elegidos.length >= MAXIMO) {
      setAviso(`Puedes elegir hasta ${MAXIMO} colores.`);
    } else {
      setElegidos([...elegidos, color]);
    }
  }

  function agregar() {
    const color = limpiarColor(nuevo);
    if (!color) return;
    const existente = opciones.find((o) => mismoColor(o, color));
    if (existente) {
      if (!estaElegido(existente)) alternar(existente);
      setAviso(`«${existente}» ya estaba en la lista y quedó elegido.`);
    } else if (elegidos.length >= MAXIMO) {
      setAviso(`Puedes elegir hasta ${MAXIMO} colores.`);
      return;
    } else {
      setOpciones([...opciones, color]);
      setElegidos([...elegidos, color]);
      setAviso(`«${color}» se añadió. Al guardar la prenda quedará en la lista para las siguientes.`);
    }
    setNuevo("");
  }

  // Enter en «Otro color» añade el color, no envía el formulario de la prenda.
  function alTeclear(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      agregar();
    }
  }

  return (
    <fieldset className="elegir-colores">
      <legend>Colores</legend>
      <input type="hidden" name="colores" value={elegidos.join(", ")} />
      <p className="ayuda">Toca los colores en que viene la prenda. Tócalo otra vez para quitarlo.</p>

      <div className="paleta" role="group" aria-label="Paleta de colores">
        {opciones.map((color) => {
          const elegido = estaElegido(color);
          const muestra = muestraDeColor(color);
          return (
            <button
              key={color}
              type="button"
              className="color-opcion"
              aria-pressed={elegido}
              onClick={() => alternar(color)}
            >
              <i
                className={`muestra-color${muestra ? "" : " sin-muestra"}`}
                style={muestra ? { background: muestra } : undefined}
                aria-hidden
              />
              {color}
            </button>
          );
        })}
      </div>

      <div className="otro-color">
        <label>
          Otro color
          <input
            value={nuevo}
            maxLength={40}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={alTeclear}
            placeholder="Por ejemplo: Lavanda grisáceo"
          />
        </label>
        <button type="button" onClick={agregar} disabled={!nuevo.trim()}>
          Añadir color
        </button>
      </div>

      <p className="colores-elegidos" aria-live="polite">
        {elegidos.length === 0
          ? "Todavía no has elegido colores (es opcional)."
          : `Elegidos (${elegidos.length}): ${elegidos.join(", ")}.`}
        {aviso && <span className="aviso-color"> {aviso}</span>}
      </p>
    </fieldset>
  );
}
