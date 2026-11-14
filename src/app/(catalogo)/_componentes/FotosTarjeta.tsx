"use client";
// Fotos de una tarjeta de prenda: se pasan dentro de la misma tarjeta, sin entrar a la ficha.
// Celular: deslizar con el dedo. Computador: flechas ‹ › que aparecen al pasar el mouse.
// Los puntitos de abajo dicen en qué foto se va. Tocar la foto abre la ficha de la prenda.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FotoPublica } from "@/lib/catalogo";
import { Imagen } from "./Imagen";

type Props = { fotos: FotoPublica[]; href: string; nombre: string; sizes: string };

export function FotosTarjeta({ fotos, href, nombre, sizes }: Props) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const varias = fotos.length > 1;

  // Al deslizar con el dedo, se averigua qué foto quedó a la vista (para los puntitos).
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

  return (
    <div className="fotos-tarjeta">
      <div ref={pista} className="fotos-tarjeta-pista">
        {fotos.map((f) => (
          // Cada foto lleva a la ficha. Para teclado y lectores de pantalla el enlace es el nombre
          // de la tarjeta (h3), por eso estas fotos se les ocultan.
          <Link key={f.id} href={href} tabIndex={-1} aria-hidden className="fotos-tarjeta-foto">
            <Imagen foto={f} sizes={sizes} alt="" />
          </Link>
        ))}
      </div>

      {varias && (
        <>
          <button
            type="button"
            className="fotos-tarjeta-flecha anterior"
            onClick={() => ir(actual - 1)}
            aria-label={`Foto anterior de ${nombre}`}
          >
            ‹
          </button>
          <button
            type="button"
            className="fotos-tarjeta-flecha siguiente"
            onClick={() => ir(actual + 1)}
            aria-label={`Foto siguiente de ${nombre}`}
          >
            ›
          </button>
          <div className="fotos-tarjeta-puntos" aria-hidden>
            {fotos.map((f, i) => (
              <span key={f.id} data-activo={i === actual || undefined} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
