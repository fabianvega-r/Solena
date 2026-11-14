"use client";
// Menú de arriba del catálogo, como botones dorados. «Inicio» aparece en todas las páginas
// menos en el inicio, y el botón de la página donde se está queda marcado (aria-current).
// «Escríbenos» (WhatsApp) va aparte del menú: en el celular queda junto al logo, siempre a la
// vista, mientras la fila del menú se desliza de lado si no cabe.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EnlaceWhatsapp } from "./Seguimiento";

export function MenuPrincipal() {
  const ruta = usePathname();
  const aqui = (href: string) => (ruta === href ? "page" : undefined);

  return (
    <>
      <nav className="cabecera-nav" aria-label="Principal">
        {ruta !== "/" && <Link href="/">Inicio</Link>}
        <Link href="/#colecciones">Colecciones</Link>
        <Link href="/sobre-solena" aria-current={aqui("/sobre-solena")}>
          Sobre Solena
        </Link>
      </nav>
      <EnlaceWhatsapp className="cabecera-whatsapp">Escríbenos</EnlaceWhatsapp>
    </>
  );
}
