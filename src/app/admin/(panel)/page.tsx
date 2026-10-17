import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { revisarColeccion, type Revision } from "@/lib/publicacion";

const LIMITE_GRATIS_MB = 10 * 1024; // Cloudflare R2: 10 GB gratis

function EstadoColeccion({ publicada, revision }: { publicada: boolean; revision: Revision }) {
  const faltan = revision.requisitos.filter((p) => !p.cumplido).length;
  if (publicada && revision.lista) return <span className="estado publicada">Publicada</span>;
  if (publicada) return <span className="estado aviso">Publicada · revisar</span>;
  if (revision.lista) return <span className="estado listo">Lista para publicar</span>;
  return <span className="estado">Borrador · {faltan === 1 ? "falta 1 paso" : `faltan ${faltan} pasos`}</span>;
}

export default async function InicioPanel() {
  await exigirAdmin();

  const [colecciones, uso] = await Promise.all([
    db.coleccion.findMany({
      orderBy: [{ fechaLanzamiento: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      include: {
        fotos: { orderBy: { orden: "asc" }, take: 1 },
        prendas: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            _count: { select: { fotos: true } },
            fotos: { orderBy: { orden: "asc" }, take: 1 },
          },
          orderBy: [{ destacada: "desc" }, { orden: "asc" }, { createdAt: "desc" }],
        },
        _count: { select: { prendas: true, fotos: true } },
      },
    }),
    db.foto.aggregate({ _count: true, _sum: { bytes: true } }),
  ]);

  const megas = (uso._sum.bytes ?? 0) / 1024 / 1024;

  return (
    <>
      <div className="encabezado">
        <h1>Colecciones</h1>
        <Link href="/admin/colecciones/nueva" className="boton primario">
          Nueva colección
        </Link>
      </div>

      <p className="ayuda">
        {uso._count} fotos · {megas.toFixed(1)} MB usados de {LIMITE_GRATIS_MB / 1024} GB gratis (
        {((megas / LIMITE_GRATIS_MB) * 100).toFixed(2)}%)
      </p>

      {colecciones.length === 0 ? (
        <div className="tarjeta vacio">
          <p>Todavía no hay colecciones.</p>
          <Link href="/admin/colecciones/nueva" className="boton primario">
            Crear la primera
          </Link>
        </div>
      ) : (
        <ul className="rejilla">
          {colecciones.map((c) => {
            // Portada: la primera foto de campaña o, si no hay, la de su primera prenda.
            const portada = c.fotos[0] ?? c.prendas.find((p) => p.fotos[0])?.fotos[0];
            return (
              <li key={c.id}>
                <Link href={`/admin/colecciones/${c.id}`} className="tarjeta coleccion">
                  <div className="portada" style={portada ? { backgroundImage: `url(${portada.blurDataUrl})` } : undefined}>
                    {portada ? <img src={conUrls(portada).urls.sm} alt="" /> : <span>Sin fotos</span>}
                  </div>
                  <div className="coleccion-texto">
                    <strong>{c.nombre}</strong>
                    <span>
                      {c.temporada ?? "Sin temporada"} · {c._count.prendas === 1 ? "1 prenda" : `${c._count.prendas} prendas`}
                    </span>
                    <EstadoColeccion publicada={c.publicada} revision={revisarColeccion(c)} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
