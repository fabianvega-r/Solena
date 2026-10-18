"use client";
// Botón de corazón de una prenda. El navegador recuerda qué prendas marcó la persona
// (para pintar el corazón lleno); el servidor guarda el conteo para las métricas.
import { useEffect, useState } from "react";

const CLAVE = "solena:corazones";

function leer(): string[] {
  try {
    const valor = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function recordar(prendaId: string, activo: boolean) {
  try {
    const resto = leer().filter((id) => id !== prendaId);
    localStorage.setItem(CLAVE, JSON.stringify(activo ? [...resto, prendaId] : resto));
  } catch {
    // Navegación privada sin almacenamiento: el corazón funciona igual, solo no se recuerda.
  }
}

export function Corazon({ prendaId, nombre, grande = false }: { prendaId: string; nombre: string; grande?: boolean }) {
  const [activo, setActivo] = useState(false);
  const [recien, setRecien] = useState(false); // dispara la animación solo al marcar
  const [error, setError] = useState(false);

  useEffect(() => setActivo(leer().includes(prendaId)), [prendaId]);

  async function alternar() {
    const nuevo = !activo;
    setActivo(nuevo);
    setRecien(nuevo);
    setError(false);
    recordar(prendaId, nuevo);
    try {
      const res = await fetch("/api/reacciones", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prendaId, activa: nuevo }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setActivo(!nuevo);
      recordar(prendaId, !nuevo);
      setError(true);
    }
  }

  const clases = ["corazon", grande && "grande", activo && "activo", recien && "recien"].filter(Boolean).join(" ");

  return (
    <span className={grande ? "corazon-bloque" : undefined}>
      <button
        type="button"
        className={clases}
        aria-pressed={activo}
        aria-label={grande ? undefined : `Me gusta: ${nombre}`}
        title={error ? "No se pudo guardar. Intenta de nuevo." : undefined}
        onClick={alternar}
        onAnimationEnd={() => setRecien(false)}
      >
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
          <path d="M12 20.5s-7.3-4.5-9.3-9C1.3 8.2 3.3 4.6 6.8 4.6c2 0 3.5 1.1 4.2 2.5.7-1.4 2.2-2.5 4.2-2.5 3.5 0 5.5 3.6 4.1 6.9-2 4.5-7.3 9-7.3 9z" />
        </svg>
        {grande && <span>{activo ? "Te gusta" : "Me gusta"}</span>}
      </button>
      <span className={grande ? "corazon-error" : "solo-lectores"} role="status">
        {error ? "No se pudo guardar el corazón. Intenta de nuevo." : ""}
      </span>
    </span>
  );
}
