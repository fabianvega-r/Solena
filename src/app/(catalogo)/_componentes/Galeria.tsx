"use client";
// Galería de la ficha de prenda: todas las fotos de la prenda sin salir de la página.
// Una foto grande a la vez, con flechas ‹ › (computador), deslizar con el dedo (celular),
// las flechas del teclado y miniaturas debajo para saltar directo a cualquier foto.
// Por dentro es una fila con «scroll-snap»: cada foto encaja sola al deslizar.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { FotoPublica } from "@/lib/catalogo";
import { Imagen } from "./Imagen";

export function Galeria({ fotos, nombre }: { fotos: FotoPublica[]; nombre: string }) {
  const pista = useRef<HTMLUListElement>(null);
  const [actual, setActual] = useState(0);
  const varias = fotos.length > 1;

  // Al deslizar con el dedo o la rueda, se averigua qué foto quedó a la vista.
  useEffect(() => {
    const el = pista.current;
    if (!el || !varias) return;
    const alMover = () => setActual(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", alMover, { passive: true });
    return () => el.removeEventListener("scroll", alMover);
  }, [varias]);

  function ir(indice: number) {
    const el = pista.current;
    if (!el) return;
    const destino = (indice + fotos.length) % fotos.length; // después de la última vuelve a la primera
    el.scrollTo({ left: destino * el.clientWidth, behavior: "smooth" });
    setActual(destino);
  }

  function alTeclear(e: KeyboardEvent) {
    if (e.key === "ArrowRight") ir(actual + 1);
    if (e.key === "ArrowLeft") ir(actual - 1);
  }

  return (
    <div className="galeria" onKeyDown={varias ? alTeclear : undefined}>
      <div className="galeria-visor">
        <ul ref={pista} className="galeria-pista" aria-label={`Fotos de ${nombre}`} tabIndex={varias ? 0 : undefined}>
          {fotos.map((f, i) => (
            <li key={f.id} aria-hidden={varias && i !== actual}>
              <Imagen
                foto={f}
                sizes="(min-width: 900px) 55vw, 100vw"
                prioridad={i === 0}
                alt={f.alt || (i === 0 ? nombre : `${nombre}, foto ${i + 1}`)}
              />
            </li>
          ))}
        </ul>

        {varias && (
          <>
            <button type="button" className="galeria-flecha anterior" onClick={() => ir(actual - 1)} aria-label="Foto anterior">
              ‹
            </button>
            <button type="button" className="galeria-flecha siguiente" onClick={() => ir(actual + 1)} aria-label="Foto siguiente">
              ›
            </button>
            <p className="galeria-contador" aria-live="polite">
              {actual + 1} / {fotos.length}
            </p>
          </>
        )}
      </div>

      {varias && (
        <ul className="galeria-miniaturas" aria-label="Elegir foto">
          {fotos.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
                aria-current={i === actual || undefined}
              >
                <Imagen foto={f} sizes="5rem" alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
