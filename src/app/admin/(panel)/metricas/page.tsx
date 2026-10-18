// Métricas del catálogo: cuántas personas entraron, cuántas dieron corazón y cuántas
// tocaron WhatsApp, más las prendas que más gustan.
import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { PERIODOS, resumenMetricas } from "@/lib/metricas";

function personas(n: number) {
  return n === 1 ? "1 persona" : `${n} personas`;
}

function porcentaje(parte: number, total: number) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

type Props = { searchParams: Promise<{ dias?: string }> };

export default async function Metricas({ searchParams }: Props) {
  await exigirAdmin();

  const { dias } = await searchParams;
  const periodo = PERIODOS.find((p) => String(p.dias) === dias) ?? PERIODOS[1];
  const r = await resumenMetricas(periodo.dias);
  const conCorazon = porcentaje(r.reaccionaron, r.visitantes);
  const conWhatsapp = porcentaje(r.contactaron, r.visitantes);

  return (
    <>
      <div className="encabezado">
        <h1>Cómo le va al catálogo</h1>
      </div>

      <nav className="periodos" aria-label="Periodo">
        {PERIODOS.map((p) => (
          <Link
            key={p.dias}
            href={`/admin/metricas?dias=${p.dias}`}
            aria-current={p.dias === periodo.dias ? "page" : undefined}
          >
            {p.nombre}
          </Link>
        ))}
      </nav>

      {r.visitantes === 0 ? (
        <div className="tarjeta vacio">
          <p>Todavía no hay visitas en este periodo.</p>
          <p className="ayuda">
            Comparte el enlace del catálogo por WhatsApp o Instagram. Aquí verás cuántas personas entran y qué prendas
            les gustan.
          </p>
          <a href="/" target="_blank" rel="noreferrer" className="boton">
            Abrir el catálogo
          </a>
        </div>
      ) : (
        <>
          <p className="resumen-frase">
            {personas(r.visitantes)} entraron al catálogo y {r.reaccionaron} dieron corazón ({conCorazon} %).
          </p>

          <ul className="cifras">
            <li className="tarjeta">
              <strong>{r.visitantes}</strong>
              <span>{r.visitantes === 1 ? "persona entró" : "personas entraron"}</span>
            </li>
            <li className="tarjeta">
              <strong>{r.reaccionaron}</strong>
              <span>dieron corazón</span>
              <small>{conCorazon} % de las que entraron</small>
            </li>
            <li className="tarjeta">
              <strong>{r.corazones}</strong>
              <span>{r.corazones === 1 ? "corazón en total" : "corazones en total"}</span>
            </li>
            <li className="tarjeta">
              <strong>{r.contactaron}</strong>
              <span>tocaron «Preguntar por WhatsApp»</span>
              <small>{conWhatsapp} % de las que entraron</small>
            </li>
          </ul>

          <section className="tarjeta">
            <h2>Prendas que más gustan</h2>
            <p className="ayuda">Las 10 con más corazones en este periodo. Cada persona cuenta una vez.</p>
            <div className="tabla-desplazable">
              <table className="tabla-metricas">
                <thead>
                  <tr>
                    <th scope="col">Prenda</th>
                    <th scope="col">La vieron</th>
                    <th scope="col">Corazones</th>
                    <th scope="col">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {r.prendas.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">
                        <Link href={`/admin/prendas/${p.id}`}>{p.nombre}</Link>
                        <small>{p.coleccion}</small>
                      </th>
                      <td>{p.vistas}</td>
                      <td>{p.corazones}</td>
                      <td>{p.whatsapp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <p className="ayuda">
        Cada persona cuenta una vez por día en cada página, aunque recargue. Tus propias visitas y corazones no cuentan
        mientras tengas abierta la sesión del panel en este navegador. No se guarda ningún dato personal.
      </p>
    </>
  );
}
