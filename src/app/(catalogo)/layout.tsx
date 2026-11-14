// Estructura del catálogo público: logo, contenido, pie con el contacto y el registro de visitas.
import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import Link from "next/link";
import { WHATSAPP_VISIBLE } from "@/lib/tienda";
import { BarraAdmin } from "./_componentes/BarraAdmin";
import { Espiral } from "./_componentes/Espiral";
import { MenuPrincipal } from "./_componentes/MenuPrincipal";
import { EnlaceWhatsapp, RegistroVisita } from "./_componentes/Seguimiento";
import "./catalogo.css";

// Serif para nombres y descripciones (voz de revista); sans para precios, tallas y botones.
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--letra-serif",
  display: "swap",
});
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--letra-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Solena", template: "%s · Solena" },
  description: "Colecciones de ropa Solena. Mira las prendas y pregunta por WhatsApp.",
};

export default function LayoutCatalogo({ children }: { children: React.ReactNode }) {
  return (
    <div className={`catalogo ${serif.variable} ${sans.variable}`}>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>

      <BarraAdmin />

      <header className="cabecera">
        <Link href="/" className="logo">
          <img src="/logo.png" alt="Solena, inicio" width={752} height={274} />
        </Link>
        <MenuPrincipal />
      </header>

      <main id="contenido">{children}</main>

      <footer className="pie">
        <Espiral className="pie-espiral" />
        <div>
          <p>
            Pedidos y preguntas por WhatsApp: <EnlaceWhatsapp>{WHATSAPP_VISIBLE}</EnlaceWhatsapp>
          </p>
          <p className="pie-nota">
            Contamos las visitas de forma anónima, sin guardar datos personales, para saber qué prendas gustan más.
          </p>
          <p className="pie-nota">
            <Link href="/sobre-solena">Sobre Solena</Link>
            {" · "}
            <a href="/admin" rel="nofollow">
              Administrar la tienda
            </a>
          </p>
        </div>
      </footer>

      <RegistroVisita />
    </div>
  );
}
