// Enlaces «Anterior · Página X de Y · Siguiente». Son enlaces normales (no botones):
// cada página tiene su propia dirección, así que se puede recargar o compartir.
import Link from "next/link";
import type { Pagina } from "@/lib/paginacion";

export function Paginacion({ pagina, enlace }: { pagina: Pagina; enlace: (numero: number) => string }) {
  if (pagina.total <= 1) return null;
  const { actual, total } = pagina;
  return (
    <nav className="paginacion" aria-label="Páginas">
      {actual > 1 ? (
        <Link href={enlace(actual - 1)} className="boton">
          Anterior
        </Link>
      ) : (
        <span className="boton deshabilitado" aria-hidden>
          Anterior
        </span>
      )}
      <span aria-current="page">
        Página {actual} de {total}
      </span>
      {actual < total ? (
        <Link href={enlace(actual + 1)} className="boton">
          Siguiente
        </Link>
      ) : (
        <span className="boton deshabilitado" aria-hidden>
          Siguiente
        </span>
      )}
    </nav>
  );
}
