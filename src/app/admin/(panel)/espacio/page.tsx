// «Espacio»: cuánto ocupan las fotos y qué colecciones conviene eliminar para liberar espacio.
// Cada colección muestra su impacto de los últimos 90 días (visitas, WhatsApp, corazones) para
// decidir con datos. Las reglas (qué es «candidata», cómo se borra) viven en src/lib/limpieza.ts.
import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { DIAS_ANTIGUA, DIAS_IMPACTO, formatoTamano, LIMITE_GRATIS_MB, resumenEspacio } from "@/lib/limpieza";
import { AvisoCreado } from "../../_componentes/Aviso";
import { EliminarColeccion } from "../../_componentes/EliminarColeccion";

const fecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" });

type Props = { searchParams: Promise<{ eliminada?: string; liberado?: string }> };

export default async function Espacio({ searchParams }: Props) {
  await exigirAdmin();
  const { eliminada, liberado } = await searchParams;
  const r = await resumenEspacio();
  const usado = Math.min(100, (r.totalMegas / LIMITE_GRATIS_MB) * 100);
  const candidatas = r.colecciones.filter((c) => c.candidata).length;

  return (
    <>
      {eliminada && (
        <AvisoCreado titulo={`Colección «${eliminada}» eliminada`} parametros={["eliminada", "liberado"]}>
          <p>Se liberaron {liberado ?? "sus fotos"}. Ya no aparece en el catálogo.</p>
        </AvisoCreado>
      )}

      <div className="encabezado">
        <h1>Espacio</h1>
      </div>

      <section className="tarjeta espacio-uso" aria-label="Espacio usado por las fotos">
        <p>
          <strong>{formatoTamano(r.totalMegas)}</strong> en {r.totalFotos === 1 ? "1 foto" : `${r.totalFotos} fotos`},
          de {LIMITE_GRATIS_MB / 1024} GB gratis.
        </p>
        <div
          className="barra-uso"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(usado)}
          aria-label="Porcentaje del espacio gratis usado"
        >
          <span style={{ width: `${Math.max(usado, 0.5)}%` }} />
        </div>
        <p className="ayuda">
          {usado < 50
            ? "Hay espacio de sobra. Elimina colecciones solo si ya no las quieres mostrar."
            : usado < 85
              ? "Vas por buen camino, pero conviene revisar las colecciones antiguas con poco impacto."
              : "Estás cerca del límite gratis: elimina las colecciones antiguas que no tuvieron impacto."}
        </p>
      </section>

      <h2 className="espacio-titulo">Colecciones</h2>
      <p className="ayuda">
        Primero aparecen las que conviene revisar. Impacto = últimos {DIAS_IMPACTO} días.
        {candidatas > 0 &&
          ` Las marcadas «Para revisar» tienen más de ${DIAS_ANTIGUA} días y casi no tuvieron visitas ni mensajes.`}
      </p>

      {r.colecciones.length === 0 ? (
        <div className="tarjeta vacio">
          <p>No hay colecciones todavía.</p>
        </div>
      ) : (
        <ul className="lista-espacio">
          {r.colecciones.map((c) => (
            <li key={c.id} className={`tarjeta${c.candidata ? " candidata" : ""}`}>
              <div className="espacio-fila">
                <div className="espacio-nombre">
                  <Link href={`/admin/colecciones/${c.id}`}>
                    <strong>{c.nombre}</strong>
                  </Link>
                  <span className="etiquetas">
                    <span className={`estado${c.publicada ? " publicada" : ""}`}>
                      {c.publicada ? "Publicada" : "Borrador"}
                    </span>
                    {c.candidata && <span className="estado aviso">Para revisar</span>}
                  </span>
                  <span className="ayuda">
                    Creada el {fecha.format(c.creada)} · {c.prendas === 1 ? "1 prenda" : `${c.prendas} prendas`} ·{" "}
                    {c.fotos === 1 ? "1 foto" : `${c.fotos} fotos`}
                  </span>
                </div>

                <dl className="espacio-datos">
                  <div>
                    <dt>Ocupa</dt>
                    <dd>{formatoTamano(c.megas)}</dd>
                  </div>
                  <div>
                    <dt>Visitas</dt>
                    <dd>{c.visitas}</dd>
                  </div>
                  <div>
                    <dt>WhatsApp</dt>
                    <dd>{c.whatsapp}</dd>
                  </div>
                  <div>
                    <dt>Corazones</dt>
                    <dd>{c.corazones}</dd>
                  </div>
                </dl>
              </div>

              <EliminarColeccion
                id={c.id}
                nombre={c.nombre}
                prendas={c.prendas}
                fotos={c.fotos}
                tamano={formatoTamano(c.megas)}
                compacto
              />
            </li>
          ))}
        </ul>
      )}

      <p className="ayuda">
        ¿Solo quieres quitar algunas fotos? Abre la prenda y usa «Borrar» debajo de cada foto.
      </p>
    </>
  );
}
