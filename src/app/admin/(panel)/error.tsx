"use client";
// Si algo falla en el panel (conexión, base de datos), se explica en español llano qué pasó,
// que lo ya guardado no se perdió, y qué hacer: reintentar o volver a las colecciones.
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPanel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <section className="tarjeta error-panel" role="alert">
      <h1>Algo salió mal</h1>
      <p>
        No se pudo completar lo que pediste. Lo que ya estaba guardado no se perdió. Suele ser un problema pasajero de
        conexión: intenta de nuevo en unos segundos.
      </p>
      <div className="acciones">
        <button type="button" className="primario" onClick={reset}>
          Intentar de nuevo
        </button>
        <Link href="/admin">Volver a las colecciones</Link>
      </div>
      <p className="ayuda">Si vuelve a pasar, anota qué estabas haciendo para revisarlo.</p>
    </section>
  );
}
