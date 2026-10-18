"use client";
// Rejilla de prendas de una colección, con filtro por tipo de prenda. El filtro solo
// aparece si la colección tiene más de un tipo; las destacadas ocupan doble ancho.
import { useState } from "react";
import type { PrendaResumen } from "@/lib/catalogo";
import { TAMANOS_REJILLA, TarjetaPrenda } from "./TarjetaPrenda";

function cuantas(n: number) {
  return n === 1 ? "1 prenda" : `${n} prendas`;
}

export function Prendas({ prendas }: { prendas: PrendaResumen[] }) {
  const [filtro, setFiltro] = useState<string | null>(null);

  const categorias = [
    ...new Map(prendas.flatMap((p) => (p.categoria ? [[p.categoria.slug, p.categoria.nombre] as const] : []))),
  ];
  const visibles = filtro ? prendas.filter((p) => p.categoria?.slug === filtro) : prendas;

  return (
    <section className="prendas" id="prendas" aria-labelledby="titulo-prendas">
      <div className="prendas-cabecera">
        <h2 id="titulo-prendas">Prendas</h2>
        <p className="conteo" aria-live="polite">
          {cuantas(visibles.length)}
        </p>
      </div>

      {categorias.length > 1 && (
        <div className="filtros" role="group" aria-label="Filtrar por tipo de prenda">
          <button type="button" aria-pressed={filtro === null} onClick={() => setFiltro(null)}>
            Todas
          </button>
          {categorias.map(([slug, nombre]) => (
            <button key={slug} type="button" aria-pressed={filtro === slug} onClick={() => setFiltro(slug)}>
              {nombre}
            </button>
          ))}
        </div>
      )}

      <ul className="rejilla-prendas">
        {visibles.map((p) => (
          <li key={p.id} className={p.destacada ? "destacada" : undefined}>
            <TarjetaPrenda
              prenda={p}
              sizes={p.destacada ? "(min-width: 1100px) 50vw, (min-width: 700px) 66vw, 50vw" : TAMANOS_REJILLA}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
