import type { Metadata } from "next";
import { Suspense } from "react";
import { AvisoCarga } from "./_componentes/AvisoCarga";
import "./carga.css";

export const metadata: Metadata = {
  title: "Solena",
  description: "Catálogo de colecciones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        {/* Suspense: AvisoCarga lee la dirección (useSearchParams) y no debe frenar la página. */}
        <Suspense fallback={null}>
          <AvisoCarga />
        </Suspense>
      </body>
    </html>
  );
}
