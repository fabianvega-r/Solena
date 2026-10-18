"use client";
// Franja que solo ve quien administra la tienda, cuando tiene la sesión del panel abierta.
// El catálogo se guarda en caché igual para todos, así que la sesión se consulta desde el navegador.
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Sesion = { admin: boolean; editar?: string; texto?: string };

export function BarraAdmin() {
  const ruta = usePathname();
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    let vigente = true;
    fetch(`/api/sesion?ruta=${encodeURIComponent(ruta)}`)
      .then((r) => r.json())
      .then((s: Sesion) => vigente && setSesion(s))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [ruta]);

  if (!sesion?.admin) return null;
  return (
    <div className="barra-admin" role="region" aria-label="Opciones de administración">
      <p>Tienes la sesión del panel abierta: tus visitas y corazones no se cuentan.</p>
      <div>
        {sesion.editar && <a href={sesion.editar}>{sesion.texto}</a>}
        <a href="/admin">Ir al panel</a>
      </div>
    </div>
  );
}
