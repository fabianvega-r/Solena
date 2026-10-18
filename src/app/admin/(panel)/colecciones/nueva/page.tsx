import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { guardarColeccion } from "../../../acciones";
import { FormularioColeccion } from "../../../_componentes/Formularios";
import { PasosColeccion } from "../../../_componentes/PasosColeccion";

export default async function NuevaColeccion() {
  await exigirAdmin();
  return (
    <>
      <Link href="/admin" className="volver">
        ← Colecciones
      </Link>
      <PasosColeccion actual={1} />
      <h1>Nueva colección</h1>
      <p className="ayuda">
        Empieza por los datos básicos. Después agregarás las prendas con sus fotos, elegirás la portada y la publicas.
      </p>
      <FormularioColeccion accion={guardarColeccion.bind(null, null)} />
    </>
  );
}
