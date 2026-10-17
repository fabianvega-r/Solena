"use client";
// Aviso de confirmación después de crear algo. Quita el ?creada=1 de la dirección
// para que no vuelva a aparecer al recargar la página.
import { useEffect, useState } from "react";

export function AvisoCreado({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("creada");
    window.history.replaceState(window.history.state, "", url);
  }, []);

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
