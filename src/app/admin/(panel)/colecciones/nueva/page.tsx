import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { guardarColeccion } from "../../../acciones";
import { FormularioColeccion } from "../../../_componentes/Formularios";

export default async function NuevaColeccion() {
  await exigirAdmin();
  return (
    <>
      <Link href="/admin" className="volver">
        ← Colecciones
      </Link>
      <h1>Nueva colección</h1>
      <p className="ayuda">Después de crearla podrás agregarle fotos de campaña y prendas.</p>
      <FormularioColeccion accion={guardarColeccion.bind(null, null)} />
    </>
  );
}
