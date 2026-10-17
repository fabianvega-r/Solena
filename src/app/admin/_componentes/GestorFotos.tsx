"use client";
// Subida, orden, descripción y borrado de las fotos de una prenda o colección.
// Habla directamente con /api/fotos; la cookie de sesión del panel autoriza las peticiones.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { prepararFoto } from "./prepararFoto";

export type FotoPanel = {
  id: string;
  alt: string;
  orden: number;
  blurDataUrl: string;
  urls: { sm: string; md: string; lg: string };
};

type Destino = { prendaId: string } | { coleccionId: string };

type Subida = { id: number; nombre: string; estado: "preparando" | "subiendo" | "error"; error?: string };

async function errorDe(res: Response) {
  const cuerpo = await res.json().catch(() => null);
  return typeof cuerpo?.error === "string" ? cuerpo.error : `Error ${res.status}`;
}

export function GestorFotos({
  destino,
  fotosIniciales,
  titulo,
  ayuda,
}: {
  destino: Destino;
  fotosIniciales: FotoPanel[];
  titulo: string;
  ayuda: string;
}) {
  const [fotos, setFotos] = useState(fotosIniciales);
  const [subidas, setSubidas] = useState<Subida[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const contador = useRef(0);
  const router = useRouter();

  function actualizarSubida(id: number, cambios: Partial<Subida>) {
    setSubidas((s) => s.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
  }

  async function subir(archivos: File[]) {
    const nuevas = archivos.map((a) => ({ id: ++contador.current, nombre: a.name, estado: "preparando" as const }));
    setSubidas((s) => [...s, ...nuevas]);

    // Una a la vez: así el orden de las fotos respeta el de selección y no se satura la conexión.
    for (const [i, archivo] of archivos.entries()) {
      const { id } = nuevas[i];
      try {
        const lista = await prepararFoto(archivo);
        actualizarSubida(id, { estado: "subiendo" });

        const form = new FormData();
        form.append("archivo", lista);
        for (const [campo, valor] of Object.entries(destino)) form.append(campo, valor);

        const res = await fetch("/api/fotos", { method: "POST", body: form });
        if (!res.ok) throw new Error(await errorDe(res));
        const foto: FotoPanel = await res.json();
        setFotos((f) => [...f, foto]);
        setSubidas((s) => s.filter((x) => x.id !== id));
      } catch (e) {
        actualizarSubida(id, { estado: "error", error: e instanceof Error ? e.message : "Error desconocido" });
      }
    }
    // Actualiza lo que se calcula en el servidor a partir de las fotos (checklist de publicación, portadas).
    router.refresh();
  }

  async function guardarAlt(foto: FotoPanel, alt: string) {
    if (alt === foto.alt) return;
    setError(null);
    const res = await fetch(`/api/fotos/${foto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt }),
    });
    if (!res.ok) return setError(`No se guardó la descripción: ${await errorDe(res)}`);
    setFotos((f) => f.map((x) => (x.id === foto.id ? { ...x, alt } : x)));
  }

  async function mover(indice: number, delta: -1 | 1) {
    const destinoIndice = indice + delta;
    if (destinoIndice < 0 || destinoIndice >= fotos.length) return;
    const nuevas = [...fotos];
    [nuevas[indice], nuevas[destinoIndice]] = [nuevas[destinoIndice], nuevas[indice]];
    const anteriores = fotos;
    setFotos(nuevas);
    setError(null);

    // El orden guardado pasa a ser la posición en la lista; solo se envían las que cambiaron.
    const cambios = nuevas.map((f, orden) => ({ f, orden })).filter(({ f, orden }) => f.orden !== orden);
    const respuestas = await Promise.all(
      cambios.map(({ f, orden }) =>
        fetch(`/api/fotos/${f.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orden }),
        }),
      ),
    );
    if (respuestas.some((r) => !r.ok)) {
      setFotos(anteriores);
      return setError("No se pudo cambiar el orden. Intenta de nuevo.");
    }
    setFotos(nuevas.map((f, orden) => ({ ...f, orden })));
  }

  async function borrar(foto: FotoPanel) {
    if (!confirm("¿Borrar esta foto? No se puede deshacer.")) return;
    setError(null);
    const res = await fetch(`/api/fotos/${foto.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) return setError(`No se pudo borrar: ${await errorDe(res)}`);
    setFotos((f) => f.filter((x) => x.id !== foto.id));
    router.refresh();
  }

  function elegir(lista: FileList | null) {
    if (lista?.length) subir(Array.from(lista));
  }

  return (
    <section className="tarjeta" id="fotos">
      <h2>{titulo}</h2>
      <p className="ayuda">{ayuda}</p>

      {fotos.length > 0 && (
        <ul className="fotos">
          {fotos.map((foto, i) => (
            <li key={foto.id} className="foto">
              <div className="foto-marco" style={{ backgroundImage: `url(${foto.blurDataUrl})` }}>
                <img src={foto.urls.sm} alt={foto.alt} loading="lazy" />
                {i === 0 && <span className="insignia">Principal</span>}
              </div>
              <textarea
                defaultValue={foto.alt}
                placeholder="Describe la foto: prenda, color, vista…"
                rows={2}
                maxLength={300}
                onBlur={(e) => guardarAlt(foto, e.target.value.trim())}
              />
              <div className="foto-acciones">
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover antes">
                  ←
                </button>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} aria-label="Mover después">
                  →
                </button>
                <button type="button" className="peligro" onClick={() => borrar(foto)}>
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {subidas.length > 0 && (
        <ul className="subidas">
          {subidas.map((s) => (
            <li key={s.id} className={s.estado === "error" ? "error" : undefined}>
              <span>{s.nombre}</span>
              <span>
                {s.estado === "preparando" && "Preparando…"}
                {s.estado === "subiendo" && "Subiendo…"}
                {s.estado === "error" && s.error}
              </span>
              {s.estado === "error" && (
                <button type="button" onClick={() => setSubidas((x) => x.filter((y) => y.id !== s.id))}>
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mensaje error">{error}</p>}

      <div
        className={`zona-subida${arrastrando ? " activa" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          elegir(e.dataTransfer.files);
        }}
      >
        <strong>Arrastra fotos aquí o haz clic para elegirlas</strong>
        <span>JPG, PNG, WebP o HEIC (iPhone). Se reducen automáticamente.</span>
        <input
          ref={input}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            elegir(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
