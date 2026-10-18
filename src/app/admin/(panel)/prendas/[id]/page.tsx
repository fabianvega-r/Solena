import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { borrarPrenda, guardarPrenda } from "../../../acciones";
import { BotonBorrar, FormularioPrenda } from "../../../_componentes/Formularios";
import { GestorFotos } from "../../../_componentes/GestorFotos";

export default async function EditarPrenda({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;

  const [prenda, colecciones, categorias] = await Promise.all([
    db.prenda.findUnique({
      where: { id },
      include: { fotos: { orderBy: { orden: "asc" } }, coleccion: { select: { nombre: true, publicada: true } } },
    }),
    db.coleccion.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, nombre: true } }),
    db.categoria.findMany({ orderBy: { orden: "asc" }, select: { id: true, nombre: true } }),
  ]);
  if (!prenda) notFound();

  return (
    <>
      <Link href={`/admin/colecciones/${prenda.coleccionId}`} className="volver">
        ← {prenda.coleccion.nombre}
      </Link>
      <div className="encabezado">
        <h1>{prenda.nombre}</h1>
        {prenda.coleccion.publicada ? (
          <span className="estado publicada">Visible en el catálogo</span>
        ) : (
          <span className="estado">No visible: la colección es borrador</span>
        )}
      </div>
      {prenda.coleccion.publicada && prenda.fotos.length === 0 && (
        <p className="mensaje aviso">
          Esta prenda ya se ve en el catálogo pero no tiene fotos. Súbele al menos una.
        </p>
      )}

      <FormularioPrenda
        accion={guardarPrenda.bind(null, id)}
        prenda={{
          nombre: prenda.nombre,
          slug: prenda.slug,
          descripcion: prenda.descripcion,
          precio: prenda.precio,
          tallas: prenda.tallas,
          colores: prenda.colores,
          disponible: prenda.disponible,
          destacada: prenda.destacada,
          coleccionId: prenda.coleccionId,
          categoriaId: prenda.categoriaId,
        }}
        colecciones={colecciones}
        categorias={categorias}
      />

      <GestorFotos
        destino={{ prendaId: id }}
        fotosIniciales={prenda.fotos.map(conUrls)}
        titulo="Fotos"
        ayuda="La primera es la foto principal en el catálogo. Usa las flechas para cambiar el orden."
      />

      <BotonBorrar
        accion={borrarPrenda.bind(null, id)}
        pregunta={`¿Borrar «${prenda.nombre}» y todas sus fotos? No se puede deshacer.`}
        texto="Borrar prenda"
      />
    </>
  );
}
