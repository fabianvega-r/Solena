"use client";
// Piezas del catálogo que cuentan para las métricas.
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { enlaceWhatsapp } from "@/lib/tienda";
import { enviarMetrica } from "./metrica";

// Cuenta una visita cada vez que se abre una página del catálogo.
export function RegistroVisita() {
  const ruta = usePathname();
  useEffect(() => {
    enviarMetrica("visita", ruta);
  }, [ruta]);
  return null;
}

// Enlace a WhatsApp que además cuenta el clic.
export function EnlaceWhatsapp({
  mensaje,
  className,
  tabIndex,
  children,
}: {
  mensaje?: string;
  className?: string;
  tabIndex?: number; // -1 cuando el enlace está oculto (barra fija del celular)
  children: React.ReactNode;
}) {
  return (
    <a
      className={className}
      tabIndex={tabIndex}
      href={enlaceWhatsapp(mensaje)}
      target="_blank"
      rel="noreferrer"
      onClick={() => enviarMetrica("whatsapp")}
    >
      {children}
    </a>
  );
}
