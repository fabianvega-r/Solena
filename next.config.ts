import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde el celular u otro equipo de la red Wi-Fi.
  allowedDevOrigins: ["192.168.1.33", "192.168.*.*"],

  // Cabeceras de seguridad. En el panel: ninguna otra página puede mostrarlo dentro de un marco
  // (evita que lo «disfracen» para engañar clics). En todo el sitio: el navegador no adivina tipos
  // de archivo y no se envía la dirección completa a otros sitios.
  async headers() {
    return [
      {
        source: "/:ruta*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/admin/:ruta*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },

  // Solo en desarrollo: /almacen-local/… se reenvía a MinIO, así las fotos se ven desde cualquier
  // aparato de la red (ver urlPublica en src/lib/storage.ts). En producción las fotos salen de R2.
  async rewrites() {
    const fotos = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
    if (process.env.NODE_ENV !== "development" || !fotos) return [];
    return [{ source: "/almacen-local/:ruta*", destination: `${fotos}/:ruta*` }];
  },
};

export default nextConfig;
