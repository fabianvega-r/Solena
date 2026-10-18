"use client";
// Elegir la portada de una colección entre las fotos que ya tiene (de sus prendas o de campaña).
// Al tocar una foto se guarda al instante y se confirma.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { elegirPortada } from "../acciones";

export type FotoElegible = { id: string; sm: string; blurDataUrl: string; origen: string };

export function ElegirPortada({
  coleccionId,
  fotos,
  actual,
}: {
  coleccionId: string;
  fotos: FotoElegible[];
  actual: string | null;
}) {
  const [elegida, setElegida] = useState(actual);
  const [aviso, setAviso] = useState<{ error?: string; ok?: string } | undefined>();
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  function elegir(fotoId: string) {
    if (fotoId === elegida || pendiente) return;
    const anterior = elegida;
    setElegida(fotoId);
    setAviso(undefined);
    iniciar(async () => {
      const r = await elegirPortada(coleccionId, fotoId);
      if (r?.error) setElegida(anterior);
      setAviso(r);
      router.refresh(); // actualiza la barra de pasos y el estado de publicación
    });
  }

  return (
    <>
      <ul className="fotos portada-opciones" role="radiogroup" aria-label="Foto de portada">
        {fotos.map((f) => {
          const activa = f.id === elegida;
          return (
            <li key={f.id}>
              <button
                type="button"
                role="radio"
                aria-checked={activa}
                className={`portada-opcion${activa ? " activa" : ""}`}
                onClick={() => elegir(f.id)}
              >
                <span className="foto-marco" style={{ backgroundImage: `url(${f.blurDataUrl})` }}>
                  <img src={f.sm} alt="" loading="lazy" />
                  {activa && <span className="insignia">Portada</span>}
                </span>
                <span className="portada-origen">{f.origen}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {pendiente && (
        <p className="mensaje" role="status">
          Guardando…
        </p>
      )}
      {aviso?.error && <p className="mensaje error">{aviso.error}</p>}
      {aviso?.ok && !pendiente && (
        <p className="mensaje ok" role="status">
          {aviso.ok} Así se verá la colección en el catálogo.
        </p>
      )}
    </>
  );
}
