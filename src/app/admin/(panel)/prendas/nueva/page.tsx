import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { guardarPrenda } from "../../../acciones";
import { FormularioPrenda } from "../../../_componentes/Formularios";

export default async function NuevaPrenda({ searchParams }: { searchParams: Promise<{ coleccion?: string }> }) {
  await exigirAdmin();
  const { coleccion: coleccionId } = await searchParams;

  const [colecciones, categorias] = await Promise.all([
    db.coleccion.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, nombre: true } }),
    db.categoria.findMany({ orderBy: { orden: "asc" }, select: { id: true, nombre: true } }),
  ]);

  if (colecciones.length === 0) {
    return (
      <div className="tarjeta vacio">
        <p>Para crear prendas primero necesitas una colección.</p>
        <Link href="/admin/colecciones/nueva" className="boton primario">
          Crear colección
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href={coleccionId ? `/admin/colecciones/${coleccionId}` : "/admin"} className="volver">
        ← Volver
      </Link>
      <h1>Nueva prenda</h1>
      <p className="ayuda">Después de crearla podrás agregarle fotos.</p>
      <FormularioPrenda
        accion={guardarPrenda.bind(null, null)}
        coleccionId={coleccionId}
        colecciones={colecciones}
        categorias={categorias}
      />
    </>
  );
}
