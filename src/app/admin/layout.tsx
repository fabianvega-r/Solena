import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./admin.css";

// La misma letra de los botones y precios del catálogo, para que el panel se sienta Solena.
const letra = Instrument_Sans({ subsets: ["latin"], variable: "--letra-panel", display: "swap" });

export const metadata: Metadata = {
  title: "Panel · Solena",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <div className={`admin ${letra.variable}`}>{children}</div>;
}
