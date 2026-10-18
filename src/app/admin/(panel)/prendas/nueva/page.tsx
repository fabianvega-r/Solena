// Paso 2 del asistente: crear prendas una por una, cada una con sus fotos.
import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AvisoCreado } from "../../../_componentes/Aviso";
import { NuevaPrenda } from "../../../_componentes/NuevaPrenda";
import { avanceDe, PasosColeccion } from "../../../_componentes/PasosColeccion";

export default async function PaginaNuevaPrenda({
  searchParams,
}: {
  searchParams: Promise<{ coleccion?: string; creada?: string }>;
}) {
  await exigirAdmin();
  const { coleccion: coleccionId, creada } = await searchParams;

  const [colecciones, categorias, coleccion] = await Promise.all([
    db.coleccion.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, nombre: true } }),
    db.categoria.findMany({ orderBy: { orden: "asc" }, select: { id: true, nombre: true } }),
    coleccionId
      ? db.coleccion.findUnique({
          where: { id: coleccionId },
          select: {
            id: true,
            nombre: true,
            publicada: true,
            portadaId: true,
            _count: { select: { fotos: true } },
            prendas: { select: { _count: { select: { fotos: true } } } },
          },
        })
      : null,
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
      <Link href={coleccion ? `/admin/colecciones/${coleccion.id}` : "/admin"} className="volver">
        ← {coleccion ? coleccion.nombre : "Colecciones"}
      </Link>
      {coleccion && <PasosColeccion actual={2} coleccion={avanceDe(coleccion)} />}
      {coleccion && creada && (
        <AvisoCreado titulo={`Colección «${coleccion.nombre}» creada`}>
          <p>Quedó como borrador: nadie la ve todavía. Ahora agrega sus prendas, una por una, con sus fotos.</p>
        </AvisoCreado>
      )}
      <h1>Nueva prenda</h1>
      <p className="ayuda">
        Llena los datos y agrega sus fotos. Al guardar podrás publicar la colección o seguir añadiendo prendas.
      </p>
      <NuevaPrenda coleccionId={coleccion?.id} colecciones={colecciones} categorias={categorias} />
    </>
  );
}
