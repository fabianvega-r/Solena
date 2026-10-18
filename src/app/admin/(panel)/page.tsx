import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { conUrls } from "@/lib/imagenes";
import { calcularPagina } from "@/lib/paginacion";
import { revisarColeccion, type Revision } from "@/lib/publicacion";
import { Paginacion } from "../_componentes/Paginacion";

const LIMITE_GRATIS_MB = 10 * 1024; // Cloudflare R2: 10 GB gratis
const POR_PAGINA = 12;

const ESTADOS = [
  { valor: "", nombre: "Todas" },
  { valor: "publicadas", nombre: "Publicadas" },
  { valor: "borradores", nombre: "Borradores" },
] as const;

type Filtros = { q?: string; estado?: string; pagina?: string };

function EstadoColeccion({ publicada, revision }: { publicada: boolean; revision: Revision }) {
  const faltan = revision.requisitos.filter((p) => !p.cumplido).length;
  if (publicada && revision.lista) return <span className="estado publicada">Publicada</span>;
  if (publicada) return <span className="estado aviso">Publicada · revisar</span>;
  if (revision.lista) return <span className="estado listo">Lista para publicar</span>;
  return <span className="estado">Borrador · {faltan === 1 ? "falta 1 paso" : `faltan ${faltan} pasos`}</span>;
}

// Arma la dirección /admin?q=…&estado=…&pagina=… sin parámetros vacíos.
function direccion({ q, estado, pagina }: Filtros) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (estado) params.set("estado", estado);
  if (pagina && pagina !== "1") params.set("pagina", pagina);
  const texto = params.toString();
  return texto ? `/admin?${texto}` : "/admin";
}

export default async function InicioPanel({ searchParams }: { searchParams: Promise<Filtros> }) {
  await exigirAdmin();

  // Lo que llega en la dirección se limpia: la búsqueda se recorta y el estado solo acepta valores conocidos.
  const filtros = await searchParams;
  const q = filtros.q?.trim().slice(0, 100) ?? "";
  const estado = ESTADOS.some((e) => e.valor === filtros.estado) ? filtros.estado! : "";

  // El filtro lo aplica la base de datos: solo viajan las colecciones de la página actual.
  const donde: Prisma.ColeccionWhereInput = {
    ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
    ...(estado ? { publicada: estado === "publicadas" } : {}),
  };

  const [totalFiltradas, totalColecciones, uso] = await Promise.all([
    db.coleccion.count({ where: donde }),
    db.coleccion.count(),
    db.foto.aggregate({ _count: true, _sum: { bytes: true } }),
  ]);
  const pagina = calcularPagina(filtros.pagina, totalFiltradas, POR_PAGINA);

  const colecciones = await db.coleccion.findMany({
    where: donde,
    orderBy: [{ fechaLanzamiento: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    skip: pagina.saltar,
    take: pagina.tomar,
    include: {
      portada: true,
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
  });

  const megas = (uso._sum.bytes ?? 0) / 1024 / 1024;
  const filtrando = !!q || !!estado;

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

      {totalColecciones === 0 ? (
        <div className="tarjeta vacio">
          <p>Todavía no hay colecciones.</p>
          <Link href="/admin/colecciones/nueva" className="boton primario">
            Crear la primera
          </Link>
        </div>
      ) : (
        <>
          {/* Formulario GET: no guarda nada, solo cambia la dirección (/admin?q=…). */}
          <form className="buscador" method="get" action="/admin" role="search">
            <label className="solo-lectores" htmlFor="buscar-coleccion">
              Buscar colección por nombre
            </label>
            <input
              id="buscar-coleccion"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar colección por nombre…"
              maxLength={100}
            />
            {estado && <input type="hidden" name="estado" value={estado} />}
            <button type="submit" className="primario">
              Buscar
            </button>
          </form>

          <nav className="filtro-estado" aria-label="Filtrar por estado">
            {ESTADOS.map((e) => (
              <Link
                key={e.valor}
                href={direccion({ q, estado: e.valor })}
                aria-current={e.valor === estado ? "page" : undefined}
              >
                {e.nombre}
              </Link>
            ))}
          </nav>

          <p className="ayuda resultado-busqueda" role="status">
            {totalFiltradas === 1 ? "1 colección" : `${totalFiltradas} colecciones`}
            {q && ` con «${q}» en el nombre`}
            {filtrando && (
              <>
                {" · "}
                <Link href="/admin">Ver todas</Link>
              </>
            )}
          </p>

          {colecciones.length === 0 ? (
            <div className="tarjeta vacio">
              <p>No hay colecciones que coincidan{q ? ` con «${q}»` : ""}.</p>
              <p className="ayuda">Revisa cómo está escrito el nombre o prueba con una parte, por ejemplo «mar».</p>
              <Link href="/admin" className="boton">
                Ver todas las colecciones
              </Link>
            </div>
          ) : (
            <ul className="rejilla">
              {colecciones.map((c) => {
                // Portada: la elegida; si no hay, la primera foto de campaña o la de su primera prenda.
                const portada = c.portada ?? c.fotos[0] ?? c.prendas.find((p) => p.fotos[0])?.fotos[0];
                return (
                  <li key={c.id}>
                    <Link href={`/admin/colecciones/${c.id}`} className="tarjeta coleccion">
                      <div
                        className="portada"
                        style={portada ? { backgroundImage: `url(${portada.blurDataUrl})` } : undefined}
                      >
                        {portada ? <img src={conUrls(portada).urls.sm} alt="" /> : <span>Sin fotos</span>}
                      </div>
                      <div className="coleccion-texto">
                        <strong>{c.nombre}</strong>
                        <span>
                          {c.temporada ?? "Sin temporada"} ·{" "}
                          {c._count.prendas === 1 ? "1 prenda" : `${c._count.prendas} prendas`}
                        </span>
                        <EstadoColeccion publicada={c.publicada} revision={revisarColeccion(c)} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Paginacion pagina={pagina} enlace={(n) => direccion({ q, estado, pagina: String(n) })} />
        </>
      )}
    </>
  );
}
