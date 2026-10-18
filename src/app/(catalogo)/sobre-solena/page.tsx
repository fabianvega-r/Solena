// «Sobre Solena»: cómo nació la marca y quién la fundó. Los textos y la foto se editan en el panel.
import type { Metadata } from "next";
import Link from "next/link";
import { hayMarca, obtenerMarca } from "@/lib/marca";
import { Espiral } from "../_componentes/Espiral";
import { Imagen } from "../_componentes/Imagen";
import { EnlaceWhatsapp } from "../_componentes/Seguimiento";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sobre Solena",
  description: "Cómo nació Solena y quién está detrás de cada colección.",
};

// "Párrafo 1\n\nPárrafo 2" -> ["Párrafo 1", "Párrafo 2"]: cada uno se muestra como un <p>.
function parrafos(texto: string): string[] {
  return texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export default async function SobreSolena() {
  const m = await obtenerMarca();

  if (!hayMarca(m)) {
    return (
      <section className="vacio">
        <Espiral className="vacio-espiral" />
        <h1>Muy pronto te contaremos la historia de Solena</h1>
        <p>Mientras tanto, mira las colecciones.</p>
        <Link className="boton" href="/">
          Ver las colecciones
        </Link>
      </section>
    );
  }

  const hayFundadora = !!(m.foto || m.fundadoraNombre || m.fundadoraTexto);

  return (
    <>
      <header className="sobre-cabecera">
        <h1 className="titular">Sobre Solena</h1>
        {m.titulo && <p className="entrada">{m.titulo}</p>}
      </header>

      {m.historia && (
        <section className="sobre-historia" aria-labelledby="titulo-historia">
          <h2 id="titulo-historia">Cómo nació Solena</h2>
          <div className="texto-largo">
            {parrafos(m.historia).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {hayFundadora && (
        <section className="fundadora" aria-labelledby="titulo-fundadora">
          {m.foto && (
            <div className="foto-arco">
              <Imagen
                foto={m.foto}
                sizes="(min-width: 900px) 34vw, 100vw"
                alt={m.fundadoraNombre ? `${m.fundadoraNombre}, de Solena` : "La fundadora de Solena"}
              />
            </div>
          )}
          <div className="fundadora-texto">
            <h2 id="titulo-fundadora">{m.fundadoraNombre ?? "Quién está detrás"}</h2>
            {m.fundadoraCargo && <p className="cargo">{m.fundadoraCargo}</p>}
            {m.fundadoraTexto && (
              <div className="texto-largo">
                {parrafos(m.fundadoraTexto).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
            <EnlaceWhatsapp className="boton" mensaje="Hola, leí la historia de Solena y quiero saber más.">
              Escríbenos por WhatsApp
            </EnlaceWhatsapp>
          </div>
        </section>
      )}

      <p className="sobre-cierre">
        <Link href="/">Ver las colecciones</Link>
      </p>
    </>
  );
}
