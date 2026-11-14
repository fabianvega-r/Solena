// Estructura del catálogo público: logo, contenido, pie con el contacto y el registro de visitas.
import type { Metadata } from "next";
import { Cormorant, Instrument_Sans } from "next/font/google";
import Link from "next/link";
import { WHATSAPP_VISIBLE } from "@/lib/tienda";
import { BarraAdmin } from "./_componentes/BarraAdmin";
import { Espiral } from "./_componentes/Espiral";
import { MenuPrincipal } from "./_componentes/MenuPrincipal";
import { EnlaceWhatsapp, RegistroVisita } from "./_componentes/Seguimiento";
import "./catalogo.css";

// Cormorant (serif fina, de revista de moda) para títulos y textos de la marca; va bien con el
// logo caligráfico. Instrument Sans para el texto corriente, precios, tallas y botones: Cormorant
// es demasiado delgada para leerse en letra pequeña.
const serif = Cormorant({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
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
          <img src="/logo.webp" alt="Solena, inicio" width={395} height={144} />
        </Link>
        <MenuPrincipal />
      </header>

      <main id="contenido">{children}</main>

      {/* Pie en tres columnas (una sola en el celular): la marca, a dónde ir y cómo escribir. */}
      <footer className="pie">
        <div className="pie-columnas">
          <div className="pie-marca">
            <Link href="/" className="pie-logo">
              <img src="/logo.webp" alt="Solena, inicio" width={395} height={144} loading="lazy" />
            </Link>
            <p>Colecciones de ropa. Mira las prendas con calma y pregúntanos por WhatsApp.</p>
          </div>
          <nav className="pie-enlaces" aria-label="Pie de página">
            <h2>Explora</h2>
            <ul>
              <li>
                <Link href="/">Inicio</Link>
              </li>
              <li>
                <Link href="/#colecciones">Colecciones</Link>
              </li>
              <li>
                <Link href="/sobre-solena">Sobre Solena</Link>
              </li>
            </ul>
          </nav>
          <div className="pie-contacto">
            <h2>Pedidos y preguntas</h2>
            <p>Escríbenos por WhatsApp al {WHATSAPP_VISIBLE}.</p>
            <EnlaceWhatsapp className="boton">Escribir por WhatsApp</EnlaceWhatsapp>
          </div>
        </div>
        <div className="pie-final">
          <Espiral className="pie-espiral" />
          <p>
            © {new Date().getFullYear()} Solena. Contamos las visitas de forma anónima, sin guardar datos
            personales, para saber qué prendas gustan más.
          </p>
          <a href="/admin" rel="nofollow">
            Administrar la tienda
          </a>
        </div>
      </footer>

      <RegistroVisita />
    </div>
  );
}
