import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde el celular u otro equipo de la red Wi-Fi.
  allowedDevOrigins: ["192.168.1.33", "192.168.*.*"],

  // Solo en desarrollo: /almacen-local/… se reenvía a MinIO, así las fotos se ven desde cualquier
  // aparato de la red (ver urlPublica en src/lib/storage.ts). En producción las fotos salen de R2.
  async rewrites() {
    const fotos = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
    if (process.env.NODE_ENV !== "development" || !fotos) return [];
    return [{ source: "/almacen-local/:ruta*", destination: `${fotos}/:ruta*` }];
  },
};

export default nextConfig;
