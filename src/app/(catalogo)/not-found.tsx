import Link from "next/link";
import { Espiral } from "./_componentes/Espiral";

export default function NoEncontrada() {
  return (
    <section className="vacio">
      <Espiral className="vacio-espiral" />
      <h1>Esta página no existe</h1>
      <p>Puede que la prenda o la colección ya no esté en el catálogo.</p>
      <Link className="boton" href="/">
        Ver las colecciones
      </Link>
    </section>
  );
}
