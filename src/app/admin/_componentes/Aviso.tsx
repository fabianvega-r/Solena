"use client";
// Aviso de confirmación después de crear o eliminar algo. Quita de la dirección los datos del aviso
// (?creada=1, ?eliminada=…) para que no vuelva a aparecer al recargar la página.
import { useEffect, useState } from "react";

export function AvisoCreado({
  titulo,
  children,
  parametros = ["creada"],
}: {
  titulo: string;
  children?: React.ReactNode;
  parametros?: string[];
}) {
  const [visible, setVisible] = useState(true);

  const lista = parametros.join(","); // texto estable: la lista se crea de nuevo en cada render
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const p of lista.split(",")) url.searchParams.delete(p);
    window.history.replaceState(window.history.state, "", url);
  }, [lista]);

  if (!visible) return null;
  return (
    <div className="aviso-creado" role="status">
      <span className="aviso-icono" aria-hidden>
        ✓
      </span>
      <div>
        <strong>{titulo}</strong>
        {children}
      </div>
      <button type="button" className="enlace" onClick={() => setVisible(false)} aria-label="Cerrar aviso">
        ✕
      </button>
    </div>
  );
}
