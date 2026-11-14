// Todo lo que está dentro de (panel) exige sesión; /admin/login queda fuera.
import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { cerrarSesion } from "../acciones";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <>
      <header className="barra">
        <Link href="/admin" className="marca">
          <img src="/logo.webp" alt="Solena" width={395} height={144} />
          <span>Panel</span>
        </Link>
        <nav>
          <Link href="/admin">Colecciones</Link>
          <Link href="/admin/marca">Sobre Solena</Link>
          <Link href="/admin/metricas">Métricas</Link>
          <Link href="/admin/espacio">Espacio</Link>
          <a href="/" target="_blank" rel="noreferrer">
            Ver sitio
          </a>
          <form action={cerrarSesion}>
            <button type="submit" className="enlace">
              Salir
            </button>
          </form>
        </nav>
      </header>
      <main className="contenido">{children}</main>
    </>
  );
}
