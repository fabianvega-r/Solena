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
  // Para ahorrar datos: solo se descargan las fotos hasta la siguiente a la que se ha visto.
  // Las demás se piden cuando la clienta desliza (no todas de una vez en cada tarjeta).
  const [hasta, setHasta] = useState(1);
  const varias = fotos.length > 1;

  useEffect(() => setHasta((h) => Math.max(h, actual + 1)), [actual]);

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
        {fotos.map((f, i) => (
          // Cada foto lleva a la ficha. Para teclado y lectores de pantalla el enlace es el nombre
          // de la tarjeta (h3), por eso estas fotos se les ocultan. Las que aún no tocan se
          // muestran como el difuminado de la foto (pesa casi nada) hasta que se acerque su turno.
          <Link key={f.id} href={href} tabIndex={-1} aria-hidden className="fotos-tarjeta-foto">
            {i <= hasta ? (
              <Imagen foto={f} sizes={sizes} alt="" />
            ) : (
              <span className="imagen" style={{ backgroundImage: `url(${f.blurDataUrl})` }} />
            )}
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
