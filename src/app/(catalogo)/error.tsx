"use client";
// Si algo falla al preparar una página del catálogo (por ejemplo, la base de datos tarda en
// despertar), la clienta ve esto en vez del error técnico de Next: puede reintentar o escribir.
import { useEffect } from "react";
import { Espiral } from "./_componentes/Espiral";
import { EnlaceWhatsapp } from "./_componentes/Seguimiento";

export default function ErrorCatalogo({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <section className="vacio" role="alert">
      <Espiral className="vacio-espiral" />
      <h1>No pudimos cargar esta página</h1>
      <p>Puede ser un problema pasajero de conexión. Intenta de nuevo en unos segundos o escríbenos.</p>
      <div className="vacio-acciones">
        <button type="button" className="boton" onClick={reset}>
          Intentar de nuevo
        </button>
        <EnlaceWhatsapp className="boton secundario" mensaje="Hola, quería ver el catálogo pero la página no cargó.">
          Escribir por WhatsApp
        </EnlaceWhatsapp>
      </div>
    </section>
  );
}
