// Lo que se ve mientras el servidor prepara una página del catálogo (Next lo muestra solo).
import { Espiral } from "./_componentes/Espiral";

export default function Cargando() {
  return (
    <div className="pantalla-carga" role="status">
      <Espiral />
      <p>Cargando…</p>
    </div>
  );
}
