// Barra de pasos para publicar una colección: Datos → Prendas → Portada → Publicar.
// Marca lo hecho, resalta el paso actual y deja saltar a cualquier paso cuando la colección ya existe.
import Link from "next/link";
import { tienePortada } from "@/lib/publicacion";

export type AvanceColeccion = {
  id: string;
  prendasConFoto: number;
  tienePortada: boolean;
  publicada: boolean;
};

type Props = {
  actual: 1 | 2 | 3 | 4;
  coleccion?: AvanceColeccion; // aún no existe en el paso 1
};

export function PasosColeccion({ actual, coleccion }: Props) {
  const pasos = [
    { texto: "Datos", hecho: !!coleccion, enlace: coleccion && `/admin/colecciones/${coleccion.id}#datos` },
    {
      texto: "Prendas",
      hecho: (coleccion?.prendasConFoto ?? 0) > 0,
      enlace: coleccion && `/admin/prendas/nueva?coleccion=${coleccion.id}`,
    },
    {
      texto: "Portada",
      hecho: !!coleccion?.tienePortada,
      enlace: coleccion && `/admin/colecciones/${coleccion.id}/portada`,
    },
    { texto: "Publicar", hecho: !!coleccion?.publicada, enlace: coleccion && `/admin/colecciones/${coleccion.id}#publicar` },
  ];

  return (
    <nav aria-label="Pasos para publicar la colección">
      <ol className="pasos-coleccion">
        {pasos.map((p, i) => {
          const numero = i + 1;
          const esActual = numero === actual;
          const clase = esActual ? "actual" : p.hecho ? "hecho" : undefined;
          const contenido = (
            <>
              <span className="paso-numero" aria-hidden>
                {p.hecho && !esActual ? "✓" : numero}
              </span>
              <span>
                {p.texto}
                {p.hecho && !esActual && <span className="solo-lectores"> (hecho)</span>}
              </span>
            </>
          );
          return (
            <li key={p.texto} className={clase} aria-current={esActual ? "step" : undefined}>
              {p.enlace && !esActual ? <Link href={p.enlace}>{contenido}</Link> : <span>{contenido}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Datos que necesita la barra, a partir de una colección con sus conteos.
export function avanceDe(c: {
  id: string;
  publicada: boolean;
  portadaId: string | null;
  _count: { fotos: number };
  prendas: { _count: { fotos: number } }[];
}): AvanceColeccion {
  return {
    id: c.id,
    publicada: c.publicada,
    tienePortada: tienePortada(c),
    prendasConFoto: c.prendas.filter((p) => p._count.fotos > 0).length,
  };
}
