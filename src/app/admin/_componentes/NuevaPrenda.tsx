"use client";
// Paso 2 del asistente: crear una prenda con sus fotos en una sola pantalla.
// Al guardar, sube las fotos y pregunta qué sigue: publicar la colección o añadir otra prenda.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { cambiarPublicacion, estadoPublicacion, guardarPrenda } from "../acciones";
import { mismoColor } from "@/lib/colores";
import { CamposPrenda } from "./Formularios";
import { prepararFoto } from "./prepararFoto";

type Opcion = { id: string; nombre: string };
type Elegida = { clave: number; archivo: File; vista: string };
type Resultado = {
  prendaId: string;
  nombre: string;
  coleccionId: string;
  colores: string[];
  subidas: number;
  fallidas: string[];
};
type EstadoColeccion = NonNullable<Awaited<ReturnType<typeof estadoPublicacion>>>;

function fotos(n: number) {
  return n === 1 ? "1 foto" : `${n} fotos`;
}

export function NuevaPrenda({
  coleccionId,
  colecciones,
  categorias,
  paleta,
}: {
  coleccionId?: string;
  colecciones: Opcion[];
  categorias: Opcion[];
  paleta: string[];
}) {
  const [intento, setIntento] = useState(0); // al cambiar, el formulario empieza vacío
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [coleccionActual, setColeccionActual] = useState(coleccionId);
  // Los colores nuevos de la prenda recién creada se suman a la paleta de la siguiente.
  const [paletaActual, setPaletaActual] = useState(paleta);

  if (resultado) {
    return (
      <QueSigue
        resultado={resultado}
        otraPrenda={() => {
          setColeccionActual(resultado.coleccionId);
          setPaletaActual((p) => [...p, ...resultado.colores.filter((c) => !p.some((k) => mismoColor(k, c)))]);
          setResultado(null);
          setIntento((n) => n + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }
  return (
    <FormularioNuevaPrenda
      key={intento}
      coleccionId={coleccionActual}
      colecciones={colecciones}
      categorias={categorias}
      paleta={paletaActual}
      alTerminar={setResultado}
    />
  );
}

function FormularioNuevaPrenda({
  coleccionId,
  colecciones,
  categorias,
  paleta,
  alTerminar,
}: {
  coleccionId?: string;
  colecciones: Opcion[];
  categorias: Opcion[];
  paleta: string[];
  alTerminar: (r: Resultado) => void;
}) {
  const [elegidas, setElegidas] = useState<Elegida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const contador = useRef(0);
  const vistas = useRef<string[]>([]);

  // Libera las vistas previas al salir del formulario.
  useEffect(() => () => vistas.current.forEach((v) => URL.revokeObjectURL(v)), []);

  function agregar(lista: FileList | null) {
    if (!lista?.length) return;
    const nuevas = Array.from(lista).map((archivo) => {
      const vista = URL.createObjectURL(archivo);
      vistas.current.push(vista);
      return { clave: ++contador.current, archivo, vista };
    });
    setElegidas((e) => [...e, ...nuevas]);
    setError(null);
  }

  function mover(indice: number, delta: -1 | 1) {
    setElegidas((e) => {
      const copia = [...e];
      [copia[indice], copia[indice + delta]] = [copia[indice + delta], copia[indice]];
      return copia;
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (elegidas.length === 0) {
      setError("Agrega al menos una foto de la prenda: sin foto no puede salir en el catálogo.");
      return;
    }
    const datos = new FormData(e.currentTarget);
    setError(null);
    iniciar(async () => {
      setProgreso("Guardando la prenda…");
      const r = await guardarPrenda(null, undefined, datos);
      if (!r?.id) {
        setProgreso(null);
        setError(r?.error ?? "No se pudo crear la prenda. Intenta de nuevo.");
        return;
      }

      // Una a la vez, en el orden elegido: la primera queda como foto principal.
      const fallidas: string[] = [];
      for (const [i, { archivo }] of elegidas.entries()) {
        setProgreso(`Subiendo foto ${i + 1} de ${elegidas.length}…`);
        try {
          const form = new FormData();
          form.append("archivo", await prepararFoto(archivo));
          form.append("prendaId", r.id);
          const res = await fetch("/api/fotos", { method: "POST", body: form });
          if (!res.ok) throw new Error();
        } catch {
          fallidas.push(archivo.name);
        }
      }

      alTerminar({
        prendaId: r.id,
        nombre: String(datos.get("nombre") ?? "").trim(),
        coleccionId: String(datos.get("coleccionId")),
        colores: String(datos.get("colores") ?? "").split(",").map((c) => c.trim()).filter(Boolean),
        subidas: elegidas.length - fallidas.length,
        fallidas,
      });
    });
  }

  return (
    <form onSubmit={onSubmit} className="tarjeta formulario" id="datos">
      <CamposPrenda coleccionId={coleccionId} colecciones={colecciones} categorias={categorias} paleta={paleta} />

      <fieldset className="fotos-nuevas" disabled={pendiente}>
        <legend>Fotos *</legend>
        <p className="ayuda">La primera será la foto principal en el catálogo. Usa las flechas para cambiar el orden.</p>
        {elegidas.length > 0 && (
          <ul className="fotos">
            {elegidas.map((f, i) => (
              <li key={f.clave} className="foto">
                <div className="foto-marco">
                  <img src={f.vista} alt={`Foto ${i + 1}: ${f.archivo.name}`} />
                  {i === 0 && <span className="insignia">Principal</span>}
                </div>
                <div className="foto-acciones">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover antes">
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === elegidas.length - 1}
                    aria-label="Mover después"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="peligro"
                    onClick={() => setElegidas((e) => e.filter((x) => x.clave !== f.clave))}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="zona-subida" onClick={() => input.current?.click()}>
          <strong>{elegidas.length ? "Agregar más fotos" : "Elegir fotos de la prenda"}</strong>
          <span>JPG, PNG, WebP o HEIC (iPhone). Se reducen automáticamente.</span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = "";
          }}
        />
      </fieldset>

      {error && <p className="mensaje error">{error}</p>}
      {progreso && (
        <p className="mensaje" role="status">
          {progreso}
        </p>
      )}
      <button type="submit" className="primario" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Guardar prenda"}
      </button>
    </form>
  );
}

function QueSigue({ resultado, otraPrenda }: { resultado: Resultado; otraPrenda: () => void }) {
  const [estado, setEstado] = useState<EstadoColeccion | null>(null);
  const [publicando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recienPublicada, setRecienPublicada] = useState(false);
  const router = useRouter();

  // Actualiza también la barra de pasos, que se calcula en el servidor.
  useEffect(() => {
    estadoPublicacion(resultado.coleccionId).then(setEstado);
    router.refresh();
  }, [resultado.coleccionId, router]);

  function publicar() {
    setError(null);
    iniciar(async () => {
      const r = await cambiarPublicacion(resultado.coleccionId, true);
      if (r?.error) return setError(r.error);
      setRecienPublicada(true);
      setEstado(await estadoPublicacion(resultado.coleccionId));
      router.refresh();
    });
  }

  const enlaceColeccion = `/admin/colecciones/${resultado.coleccionId}`;
  const botonOtra = (
    <button type="button" className={estado?.publicada ? "primario" : undefined} onClick={otraPrenda}>
      Añadir otra prenda
    </button>
  );

  return (
    <section className="aviso-creado que-sigue" role="status">
      <span className="aviso-icono" aria-hidden>
        ✓
      </span>
      <div>
        <strong>
          «{resultado.nombre}» quedó guardada con {fotos(resultado.subidas)}
          {estado ? ` en «${estado.nombre}»` : ""}.
        </strong>

        {estado?.portada && (
          <p className="portada-mini">
            <img src={estado.portada} alt="" />
            <span>
              Portada de la colección.{" "}
              <Link href={`/admin/colecciones/${resultado.coleccionId}/portada`}>Cambiar portada</Link>
            </span>
          </p>
        )}

        {resultado.fallidas.length > 0 && (
          <p className="mensaje aviso">
            No se pudieron subir: {resultado.fallidas.join(", ")}.{" "}
            <Link href={`/admin/prendas/${resultado.prendaId}#fotos`}>Súbelas desde la prenda</Link>.
          </p>
        )}

        {!estado ? (
          <p>Revisando la colección…</p>
        ) : estado.publicada ? (
          <>
            <p>
              {recienPublicada
                ? "¡Listo! La colección quedó publicada y ya se ve en el catálogo."
                : "La colección está publicada, así que esta prenda ya se ve en el catálogo."}{" "}
              ¿Quieres añadir otra prenda?
            </p>
            <div className="acciones">
              {botonOtra}
              <a href={`/colecciones/${estado.slug}`} target="_blank" rel="noreferrer" className="boton">
                Ver en el catálogo
              </a>
            </div>
          </>
        ) : estado.faltan.length === 0 ? (
          <>
            <p>¿Qué quieres hacer ahora?</p>
            <div className="acciones">
              <button type="button" className="primario" onClick={publicar} disabled={publicando}>
                {publicando ? "Publicando…" : "Publicar la colección"}
              </button>
              {botonOtra}
            </div>
            <p className="ayuda">Si publicas ahora, podrás seguir añadiendo prendas después.</p>
          </>
        ) : (
          <>
            <p>Para publicar la colección todavía falta:</p>
            <ul className="faltan">
              {estado.faltan.map((p) => (
                <li key={p.id}>{p.enlace ? <Link href={p.enlace}>{p.texto}</Link> : p.texto}</li>
              ))}
            </ul>
            <div className="acciones">
              {botonOtra}
              <button type="button" className="primario" disabled>
                Publicar la colección
              </button>
            </div>
          </>
        )}

        {error && <p className="mensaje error">{error}</p>}

        <p className="ayuda">
          <Link href={`/admin/prendas/${resultado.prendaId}`}>Editar esta prenda</Link> ·{" "}
          <Link href={enlaceColeccion}>Ver la colección en el panel</Link>
        </p>
      </div>
    </section>
  );
}
