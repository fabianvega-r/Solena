import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { revisarColeccion } from "@/lib/publicacion";
import { borrarColeccion, guardarColeccion } from "../../../acciones";
import { AvisoCreado } from "../../../_componentes/Aviso";
import { BotonBorrar, FormularioColeccion } from "../../../_componentes/Formularios";
import { GestorFotos } from "../../../_componentes/GestorFotos";
import { PanelPublicacion } from "../../../_componentes/PanelPublicacion";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default async function EditarColeccion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creada?: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const { creada } = await searchParams;

  const coleccion = await db.coleccion.findUnique({
    where: { id },
    include: {
      fotos: { orderBy: { orden: "asc" } },
      _count: { select: { fotos: true } },
      prendas: {
        orderBy: [{ destacada: "desc" }, { orden: "asc" }, { createdAt: "desc" }],
        include: {
          fotos: { orderBy: { orden: "asc" }, take: 1 },
          categoria: { select: { nombre: true } },
          _count: { select: { fotos: true } },
        },
      },
    },
  });
  if (!coleccion) notFound();
  const revision = revisarColeccion(coleccion);

  return (
    <>
      <Link href="/admin" className="volver">
        ← Colecciones
      </Link>
      <div className="encabezado">
        <h1>{coleccion.nombre}</h1>
        <span className={coleccion.publicada ? "estado publicada" : "estado"}>
          {coleccion.publicada ? "Publicada" : "Borrador"}
        </span>
      </div>

      {creada && (
        <AvisoCreado titulo={`Colección «${coleccion.nombre}» creada`}>
          <p>
            Quedó como borrador, así que nadie la ve todavía. Agrégale prendas con sus fotos y, cuando la lista
            de publicación de abajo esté completa, publícala.
          </p>
          <div className="acciones">
            <Link href={`/admin/prendas/nueva?coleccion=${id}`} className="boton primario">
              Agregar prenda
            </Link>
            <a href="#fotos" className="boton">
              Subir fotos
            </a>
          </div>
        </AvisoCreado>
      )}

      <PanelPublicacion id={id} publicada={coleccion.publicada} revision={revision} />

      <FormularioColeccion
        accion={guardarColeccion.bind(null, id)}
        coleccion={{
          nombre: coleccion.nombre,
          slug: coleccion.slug,
          temporada: coleccion.temporada,
          descripcion: coleccion.descripcion,
          fechaLanzamiento: coleccion.fechaLanzamiento,
        }}
      />

      <GestorFotos
        destino={{ coleccionId: id }}
        fotosIniciales={coleccion.fotos.map(conUrls)}
        titulo="Fotos de campaña"
        ayuda="Fotos de la colección completa (lookbook). La primera es la portada."
      />

      <section className="tarjeta">
        <div className="encabezado">
          <h2>Prendas ({coleccion.prendas.length})</h2>
          <Link href={`/admin/prendas/nueva?coleccion=${id}`} className="boton primario">
            Nueva prenda
          </Link>
        </div>
        {coleccion.prendas.length === 0 ? (
          <p className="ayuda">Esta colección todavía no tiene prendas.</p>
        ) : (
          <ul className="lista-prendas">
            {coleccion.prendas.map((p) => {
              const foto = p.fotos[0];
              return (
                <li key={p.id}>
                  <Link href={`/admin/prendas/${p.id}`}>
                    <div className="miniatura" style={foto ? { backgroundImage: `url(${foto.blurDataUrl})` } : undefined}>
                      {foto && <img src={conUrls(foto).urls.sm} alt="" />}
                    </div>
                    <div>
                      <strong>{p.nombre}</strong>
                      <span>
                        {[p.categoria?.nombre, p.precio != null ? pesos.format(p.precio) : null].filter(Boolean).join(" · ") ||
                          "Sin categoría"}
                      </span>
                    </div>
                    <div className="etiquetas">
                      {p.destacada && <span className="estado publicada">Destacada</span>}
                      {!p.disponible && <span className="estado">Agotada</span>}
                      {!foto && <span className="estado aviso">Sin fotos</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <BotonBorrar
        accion={borrarColeccion.bind(null, id)}
        pregunta={`¿Borrar la colección «${coleccion.nombre}» y sus fotos de campaña? No se puede deshacer.`}
        texto="Borrar colección"
      />
    </>
  );
}
