"use client";
// «Eliminar colección…»: primero dice exactamente qué se va a borrar y cuánto espacio se libera,
// y pide escribir el nombre de la colección para confirmar (el servidor lo vuelve a comprobar).
import { useState, useTransition } from "react";
import { eliminarColeccion } from "../acciones";

type Props = {
  id: string;
  nombre: string;
  prendas: number;
  fotos: number;
  tamano: string; // «4,2 MB»
  compacto?: boolean; // en la tabla de «Espacio»: solo el botón hasta que se abre
};

function cuantas(n: number, una: string, varias: string) {
  return n === 1 ? `1 ${una}` : `${n} ${varias}`;
}

export function EliminarColeccion({ id, nombre, prendas, fotos, tamano, compacto = false }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const coincide = escrito.trim() === nombre.trim();

  if (!abierto) {
    return (
      <div className={compacto ? undefined : "zona-peligro"}>
        <button type="button" className="peligro" onClick={() => setAbierto(true)}>
          Eliminar colección…
        </button>
      </div>
    );
  }

  return (
    <div className="eliminar-coleccion" role="group" aria-label={`Eliminar la colección ${nombre}`}>
      <p>
        <strong>Se eliminará «{nombre}»</strong> con {cuantas(prendas, "prenda", "prendas")} y{" "}
        {cuantas(fotos, "foto", "fotos")}. Se liberan <strong>{tamano}</strong>.
      </p>
      <p className="ayuda">
        Desaparece del catálogo y del panel, y las fotos se borran del almacenamiento. No se puede deshacer. Las
        métricas de visitas pasadas se conservan sin el nombre.
      </p>
      <label>
        Para confirmar, escribe el nombre de la colección
        <input
          value={escrito}
          onChange={(e) => setEscrito(e.target.value)}
          placeholder={nombre}
          autoComplete="off"
          autoFocus
          disabled={pendiente}
        />
      </label>
      {error && <p className="mensaje error">{error}</p>}
      <div className="acciones">
        <button
          type="button"
          className="peligro"
          disabled={!coincide || pendiente}
          onClick={() =>
            iniciar(async () => {
              setError(null);
              // Si sale bien, el servidor lleva a «Espacio» con el aviso de lo que se liberó.
              const r = await eliminarColeccion(id, escrito);
              if (r?.error) setError(r.error);
            })
          }
        >
          {pendiente ? "Eliminando…" : "Eliminar para siempre"}
        </button>
        <button
          type="button"
          className="enlace"
          disabled={pendiente}
          onClick={() => {
            setAbierto(false);
            setEscrito("");
            setError(null);
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
