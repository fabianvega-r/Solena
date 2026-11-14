import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { revisarColeccion } from "@/lib/publicacion";
import { contenidoColeccion, formatoTamano } from "@/lib/limpieza";
import { guardarColeccion } from "../../../acciones";
import { EliminarColeccion } from "../../../_componentes/EliminarColeccion";
import { FormularioColeccion } from "../../../_componentes/Formularios";
import { PanelPublicacion } from "../../../_componentes/PanelPublicacion";
import { avanceDe, PasosColeccion } from "../../../_componentes/PasosColeccion";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default async function EditarColeccion({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;

  const coleccion = await db.coleccion.findUnique({
    where: { id },
    include: {
      portada: true,
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
  const contenido = (await contenidoColeccion(id))!;
  const revision = revisarColeccion(coleccion);
  const avance = avanceDe(coleccion);
  // Resalta el primer paso pendiente; si todo está hecho, el de publicar.
  const pasoActual = avance.prendasConFoto === 0 ? 2 : !avance.tienePortada ? 3 : 4;
  const portada = coleccion.portada ?? coleccion.fotos[0];

  return (
    <>
      <Link href="/admin" className="volver">
        ← Colecciones
      </Link>
      <PasosColeccion actual={pasoActual} coleccion={avance} />
      <div className="encabezado">
        <h1>{coleccion.nombre}</h1>
        <span className={coleccion.publicada ? "estado publicada" : "estado"}>
          {coleccion.publicada ? "Publicada" : "Borrador"}
        </span>
      </div>

      <PanelPublicacion id={id} publicada={coleccion.publicada} revision={revision} />

      <FormularioColeccion
        accion={guardarColeccion.bind(null, id)}
        coleccion={{
          nombre: coleccion.nombre,
          slug: coleccion.slug,
          temporada: coleccion.temporada,
          descripcion: coleccion.descripcion,
          historia: coleccion.historia,
          inspiracion: coleccion.inspiracion,
          materiales: coleccion.materiales,
          fechaLanzamiento: coleccion.fechaLanzamiento,
        }}
      />

      <section className="tarjeta portada-resumen" id="portada">
        <div
          className="foto-marco"
          style={portada ? { backgroundImage: `url(${portada.blurDataUrl})` } : undefined}
        >
          {portada ? <img src={conUrls(portada).urls.sm} alt="" /> : <span>Sin portada</span>}
        </div>
        <div>
          <h2>Foto de portada</h2>
          <p className="ayuda">
            {portada
              ? "Es la foto con la que se presenta la colección en el catálogo."
              : "Elige una de las fotos de las prendas como portada para poder publicar."}
          </p>
          <Link href={`/admin/colecciones/${id}/portada`} className={portada ? "boton" : "boton primario"}>
            {portada ? "Cambiar portada" : "Elegir portada"}
          </Link>
        </div>
      </section>

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

      <EliminarColeccion
        id={id}
        nombre={coleccion.nombre}
        prendas={contenido.prendas}
        fotos={contenido.fotos}
        tamano={formatoTamano(contenido.megas)}
      />
    </>
  );
}
