"use client";
import { startTransition, useActionState, useTransition, useState, type FormEvent } from "react";
import { guardarMarca, iniciarSesion, type Estado } from "../acciones";
import { ElegirColores } from "./ElegirColores";

type Accion = (previo: Estado, form: FormData) => Promise<Estado>;

// Se envía con onSubmit en vez de <form action>, porque React 19 vacía el
// formulario después de cada envío y se perdería lo escrito si hay un error.
function useFormulario(accion: Accion) {
  const [estado, ejecutar, pendiente] = useActionState(accion, undefined);
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => ejecutar(datos));
  }
  return { estado, pendiente, onSubmit };
}

function BotonGuardar({ texto, pendiente }: { texto: string; pendiente: boolean }) {
  return (
    <button type="submit" className="primario" disabled={pendiente}>
      {pendiente ? "Guardando…" : texto}
    </button>
  );
}

export function Mensaje({ estado }: { estado: Estado }) {
  if (estado?.error) return <p className="mensaje error">{estado.error}</p>;
  if (estado?.ok) return <p className="mensaje ok">{estado.ok}</p>;
  return null;
}

export function FormularioLogin() {
  const { estado, pendiente, onSubmit } = useFormulario(iniciarSesion);
  return (
    <form onSubmit={onSubmit} className="tarjeta login">
      <h1>Solena · Panel</h1>
      <label>
        Clave de administración
        <input name="token" type="password" required autoFocus autoComplete="current-password" />
      </label>
      <p className="ayuda">Es el valor de ADMIN_TOKEN en el archivo .env.</p>
      <Mensaje estado={estado} />
      <BotonGuardar texto="Entrar" pendiente={pendiente} />
    </form>
  );
}

export type ColeccionFormulario = {
  nombre: string;
  slug: string;
  temporada: string | null;
  descripcion: string | null;
  historia: string | null;
  inspiracion: string | null;
  materiales: string | null;
  fechaLanzamiento: Date | null;
};

export function FormularioColeccion({ accion, coleccion }: { accion: Accion; coleccion?: ColeccionFormulario }) {
  const { estado, pendiente, onSubmit } = useFormulario(accion);
  return (
    <form onSubmit={onSubmit} className="tarjeta formulario" id="datos">
      <label>
        Nombre *
        <input name="nombre" required maxLength={120} defaultValue={coleccion?.nombre} placeholder="Primavera" />
      </label>
      <div className="fila">
        <label>
          Temporada
          <input name="temporada" maxLength={120} defaultValue={coleccion?.temporada ?? ""} placeholder="Primavera 2026" />
        </label>
        <label>
          Fecha de lanzamiento
          <input
            name="fechaLanzamiento"
            type="date"
            defaultValue={coleccion?.fechaLanzamiento?.toISOString().slice(0, 10) ?? ""}
          />
        </label>
      </div>
      <label>
        Descripción
        <textarea name="descripcion" rows={4} maxLength={5000} defaultValue={coleccion?.descripcion ?? ""} />
        <span className="ayuda">Una o dos frases. Sale en la portada del inicio, bajo el nombre.</span>
      </label>

      {/* Textos editoriales: plegados para no abrumar; se abren solos si ya tienen algo escrito. */}
      <details
        className="opcional-editorial"
        open={Boolean(coleccion?.historia || coleccion?.inspiracion || coleccion?.materiales)}
      >
        <summary>Para contar más de la colección (opcional)</summary>
        <p className="ayuda">
          Aparecen en la página de la colección, en la sección «La historia». Lo que dejes vacío no se muestra.
        </p>
        <label>
          La historia
          <textarea
            name="historia"
            rows={5}
            maxLength={5000}
            defaultValue={coleccion?.historia ?? ""}
            placeholder="Cómo nació esta colección, qué quiere contar…"
          />
        </label>
        <label>
          Inspiración
          <textarea
            name="inspiracion"
            rows={3}
            maxLength={2000}
            defaultValue={coleccion?.inspiracion ?? ""}
            placeholder="El mar del Caribe al atardecer, las casas de Mompox…"
          />
        </label>
        <label>
          Materiales
          <textarea
            name="materiales"
            rows={2}
            maxLength={2000}
            defaultValue={coleccion?.materiales ?? ""}
            placeholder="Lino, algodón orgánico, botones de coco…"
          />
        </label>
      </details>

      <label>
        Dirección en la web
        <input name="slug" maxLength={120} defaultValue={coleccion?.slug} placeholder="Se genera a partir del nombre" />
        <span className="ayuda">Solo letras, números y guiones. Cambiarla rompe los enlaces que ya hayas compartido.</span>
      </label>
      <Mensaje estado={estado} />
      <BotonGuardar texto={coleccion ? "Guardar cambios" : "Crear y seguir"} pendiente={pendiente} />
    </form>
  );
}

export type PrendaFormulario = {
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number | null;
  tallas: string[];
  colores: string[];
  materiales: string | null;
  cuidados: string | null;
  medidasModelo: string | null;
  disponible: boolean;
  destacada: boolean;
  coleccionId: string;
  categoriaId: string | null;
};

type Opcion = { id: string; nombre: string };

export function FormularioPrenda({
  accion,
  prenda,
  coleccionId,
  colecciones,
  categorias,
  paleta,
}: {
  accion: Accion;
  prenda?: PrendaFormulario;
  coleccionId?: string;
  colecciones: Opcion[];
  categorias: Opcion[];
  paleta: string[];
}) {
  const { estado, pendiente, onSubmit } = useFormulario(accion);
  return (
    <form onSubmit={onSubmit} className="tarjeta formulario" id="datos">
      <CamposPrenda
        prenda={prenda}
        coleccionId={coleccionId}
        colecciones={colecciones}
        categorias={categorias}
        paleta={paleta}
      />
      <Mensaje estado={estado} />
      <BotonGuardar texto={prenda ? "Guardar cambios" : "Crear prenda"} pendiente={pendiente} />
    </form>
  );
}

export type TextosMarcaFormulario = {
  titulo: string | null;
  historia: string | null;
  fundadoraNombre: string | null;
  fundadoraCargo: string | null;
  fundadoraTexto: string | null;
};

// `fotoFundadora`: el cargador de la foto, que sube por su cuenta (no se envía con el formulario).
export function FormularioMarca({
  marca,
  fotoFundadora,
}: {
  marca: TextosMarcaFormulario;
  fotoFundadora: React.ReactNode;
}) {
  const { estado, pendiente, onSubmit } = useFormulario(guardarMarca);
  return (
    <form onSubmit={onSubmit} className="formulario-marca">
      <fieldset className="tarjeta formulario">
        <legend>Cómo nació Solena</legend>
        <label>
          Frase de presentación
          <input
            name="titulo"
            maxLength={120}
            defaultValue={marca.titulo ?? ""}
            placeholder="Ropa hecha con calma, pensada para el calor del Caribe"
          />
          <span className="ayuda">Una frase corta que resuma qué es Solena.</span>
        </label>
        <label>
          La historia de la marca
          <textarea
            name="historia"
            rows={9}
            maxLength={5000}
            defaultValue={marca.historia ?? ""}
            placeholder="Cómo empezó Solena, por qué ese nombre, qué la hace distinta, cómo se hace cada prenda…"
          />
          <span className="ayuda">
            Deja una línea en blanco para separar párrafos. El primer párrafo aparece como resumen en el inicio.
          </span>
        </label>
      </fieldset>

      <fieldset className="tarjeta formulario">
        <legend>La fundadora</legend>
        {fotoFundadora}
        <div className="fila">
          <label>
            Nombre
            <input name="fundadoraNombre" maxLength={80} defaultValue={marca.fundadoraNombre ?? ""} />
          </label>
          <label>
            Cargo
            <input
              name="fundadoraCargo"
              maxLength={80}
              defaultValue={marca.fundadoraCargo ?? ""}
              placeholder="Fundadora y diseñadora"
            />
          </label>
        </div>
        <label>
          Sobre ella
          <textarea
            name="fundadoraTexto"
            rows={6}
            maxLength={3000}
            defaultValue={marca.fundadoraTexto ?? ""}
            placeholder="Quién es, de dónde viene, qué la inspira, cómo trabaja…"
          />
          <span className="ayuda">Escribe como le hablarías a una clienta.</span>
        </label>
      </fieldset>

      <Mensaje estado={estado} />
      <BotonGuardar texto="Guardar" pendiente={pendiente} />
    </form>
  );
}

// Campos de una prenda, compartidos por el formulario de edición y el de prenda nueva.
// `paleta`: colores que se ofrecen para elegir (ver coloresDeLaTienda en src/lib/paleta.ts).
export function CamposPrenda({
  prenda,
  coleccionId,
  colecciones,
  categorias,
  paleta,
}: {
  prenda?: PrendaFormulario;
  coleccionId?: string;
  colecciones: Opcion[];
  categorias: Opcion[];
  paleta: string[];
}) {
  return (
    <>
        <label>
          Nombre *
          <input name="nombre" required maxLength={160} defaultValue={prenda?.nombre} placeholder="Vestido de lino" />
        </label>
        <div className="fila">
          <label>
            Colección *
            <select name="coleccionId" required defaultValue={prenda?.coleccionId ?? coleccionId}>
              {colecciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoría
            <select name="categoriaId" defaultValue={prenda?.categoriaId ?? ""}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Descripción
          <textarea name="descripcion" rows={4} maxLength={5000} defaultValue={prenda?.descripcion ?? ""} />
        </label>
        <div className="fila">
          <label>
            Precio (pesos)
            <input name="precio" inputMode="numeric" defaultValue={prenda?.precio ?? ""} placeholder="189000" />
            <span className="ayuda">Déjalo vacío para no mostrar precio.</span>
          </label>
          <label>
            Tallas
            <input name="tallas" defaultValue={prenda?.tallas.join(", ")} placeholder="XS, S, M, L" />
            <span className="ayuda">Separadas por comas.</span>
          </label>
        </div>
        <ElegirColores conocidos={paleta} iniciales={prenda?.colores ?? []} />

        {/* Detalles de la ficha: plegados; se abren solos si ya tienen algo escrito. */}
        <details
          className="opcional-editorial"
          open={Boolean(prenda?.materiales || prenda?.cuidados || prenda?.medidasModelo)}
        >
          <summary>Detalles de la prenda (opcional)</summary>
          <p className="ayuda">Ayudan a decidir la talla y a confiar en la compra. Lo que dejes vacío no se muestra.</p>
          <label>
            Medidas de la modelo
            <input
              name="medidasModelo"
              maxLength={160}
              defaultValue={prenda?.medidasModelo ?? ""}
              placeholder="La modelo mide 1,70 y usa talla S"
            />
            <span className="ayuda">Sale junto a las tallas.</span>
          </label>
          <label>
            Materiales
            <input
              name="materiales"
              maxLength={500}
              defaultValue={prenda?.materiales ?? ""}
              placeholder="100 % lino"
            />
          </label>
          <label>
            Cuidados
            <textarea
              name="cuidados"
              rows={2}
              maxLength={1000}
              defaultValue={prenda?.cuidados ?? ""}
              placeholder="Lavar a mano con agua fría. No usar secadora."
            />
          </label>
        </details>
        <label>
          Dirección en la web
          <input name="slug" maxLength={160} defaultValue={prenda?.slug} placeholder="Se genera a partir del nombre" />
        </label>
        <div className="fila">
          <label className="casilla">
            <input name="disponible" type="checkbox" defaultChecked={prenda?.disponible ?? true} />
            Disponible
          </label>
          <label className="casilla">
            <input name="destacada" type="checkbox" defaultChecked={prenda?.destacada ?? false} />
            Destacada (aparece primero)
          </label>
        </div>
    </>
  );
}

// Botón que ejecuta una acción del servidor y muestra su resultado.
export function BotonAccion({
  accion,
  texto,
  textoPendiente,
  pregunta,
  clase,
}: {
  accion: () => Promise<Estado>;
  texto: string;
  textoPendiente: string;
  pregunta?: string; // si se indica, pide confirmación antes
  clase?: string;
}) {
  const [pendiente, iniciar] = useTransition();
  const [estado, setEstado] = useState<Estado>();
  return (
    <>
      <button
        type="button"
        className={clase}
        disabled={pendiente}
        onClick={() => {
          if (pregunta && !confirm(pregunta)) return;
          setEstado(undefined);
          iniciar(async () => setEstado(await accion()));
        }}
      >
        {pendiente ? textoPendiente : texto}
      </button>
      <Mensaje estado={estado} />
    </>
  );
}

export function BotonBorrar({ accion, pregunta, texto }: { accion: () => Promise<Estado>; pregunta: string; texto: string }) {
  return (
    <div className="zona-peligro">
      <BotonAccion accion={accion} pregunta={pregunta} texto={texto} textoPendiente="Borrando…" clase="peligro" />
    </div>
  );
}
