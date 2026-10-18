// Paso 3 del asistente: elegir la portada entre las fotos de las prendas, sin subir nada nuevo.
// Subir una foto de campaña aparte queda como opción.
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { revisarColeccion } from "@/lib/publicacion";
import { ElegirPortada, type FotoElegible } from "../../../../_componentes/ElegirPortada";
import { GestorFotos } from "../../../../_componentes/GestorFotos";
import { avanceDe, PasosColeccion } from "../../../../_componentes/PasosColeccion";

export default async function Portada({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;

  const coleccion = await db.coleccion.findUnique({
    where: { id },
    include: {
      fotos: { orderBy: { orden: "asc" } },
      _count: { select: { fotos: true } },
      prendas: {
        orderBy: [{ destacada: "desc" }, { orden: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          nombre: true,
          precio: true,
          fotos: { orderBy: { orden: "asc" } },
          _count: { select: { fotos: true } },
        },
      },
    },
  });
  if (!coleccion) notFound();

  const elegibles: FotoElegible[] = [
    ...coleccion.prendas.flatMap((p) =>
      p.fotos.map((f) => ({ id: f.id, sm: conUrls(f).urls.sm, blurDataUrl: f.blurDataUrl, origen: p.nombre })),
    ),
    ...coleccion.fotos.map((f) => ({
      id: f.id,
      sm: conUrls(f).urls.sm,
      blurDataUrl: f.blurDataUrl,
      origen: "Foto de campaña",
    })),
  ];
  // Colecciones antiguas sin portada elegida usan su primera foto de campaña.
  const actual = coleccion.portadaId ?? coleccion.fotos[0]?.id ?? null;
  const revision = revisarColeccion(coleccion);

  return (
    <>
      <Link href={`/admin/colecciones/${id}`} className="volver">
        ← {coleccion.nombre}
      </Link>
      <PasosColeccion actual={3} coleccion={avanceDe(coleccion)} />

      <h1>Foto de portada</h1>
      <p className="ayuda">
        Es la foto grande con la que se presenta la colección en el catálogo. Toca la que quieras: se usan las fotos
        que ya subiste en las prendas, así no tienes que subirla otra vez.
      </p>

      {elegibles.length === 0 ? (
        <div className="tarjeta vacio">
          <p>Todavía no hay fotos para elegir. Agrega una prenda con sus fotos y vuelve aquí.</p>
          <Link href={`/admin/prendas/nueva?coleccion=${id}`} className="boton primario">
            Agregar prenda
          </Link>
        </div>
      ) : (
        <section className="tarjeta">
          <ElegirPortada coleccionId={id} fotos={elegibles} actual={actual} />
        </section>
      )}

      <div className="siguiente-paso">
        {coleccion.publicada ? (
          <a href={`/colecciones/${coleccion.slug}`} target="_blank" rel="noreferrer" className="boton primario">
            Ver en el catálogo
          </a>
        ) : revision.lista ? (
          <Link href={`/admin/colecciones/${id}#publicar`} className="boton primario">
            Seguir: publicar
          </Link>
        ) : (
          <>
            <button type="button" className="primario" disabled>
              Seguir: publicar
            </button>
            <p className="ayuda">
              Falta: {revision.requisitos.filter((p) => !p.cumplido).map((p) => p.texto.toLowerCase()).join("; ")}.
            </p>
          </>
        )}
      </div>

      <details className="tarjeta opcional-campana">
        <summary>¿Prefieres una foto de campaña distinta a las de las prendas? (opcional)</summary>
        <GestorFotos
          destino={{ coleccionId: id }}
          fotosIniciales={coleccion.fotos.map(conUrls)}
          titulo="Fotos de campaña"
          ayuda="Súbelas solo si no aparecen en ninguna prenda. Luego elígela arriba como portada."
        />
      </details>
    </>
  );
}
