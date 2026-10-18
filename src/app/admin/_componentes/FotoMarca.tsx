"use client";
// La foto de la fundadora en «Sobre Solena». Es una sola: al subir otra, el servidor reemplaza y borra la anterior.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { prepararFoto } from "./prepararFoto";

type Foto = { blurDataUrl: string; urls: { sm: string; md: string } };

export function FotoMarca({ inicial }: { inicial: Foto | null }) {
  const [foto, setFoto] = useState(inicial);
  const [estado, setEstado] = useState<{ error?: string; ok?: string; subiendo?: boolean }>({});
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function subir(archivo: File | undefined) {
    if (!archivo) return;
    setEstado({ subiendo: true });
    try {
      const form = new FormData();
      form.append("archivo", await prepararFoto(archivo));
      form.append("tienda", "1");
      const res = await fetch("/api/fotos", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Error ${res.status}`);
      setFoto(await res.json());
      setEstado({ ok: "Foto guardada. Ya se ve en «Sobre Solena»." });
      router.refresh();
    } catch (e) {
      setEstado({ error: `No se pudo subir la foto: ${e instanceof Error ? e.message : "error desconocido"}.` });
    }
  }

  return (
    <div className="foto-marca">
      <div className="foto-marco" style={foto ? { backgroundImage: `url(${foto.blurDataUrl})` } : undefined}>
        {foto ? <img src={foto.urls.md} alt="Foto de la fundadora" /> : <span>Sin foto</span>}
      </div>
      <div>
        <strong>Su foto</strong>
        <p className="ayuda">
          Una foto de ella, trabajando o con las prendas. Ayuda a que las clientas sepan que detrás de Solena hay una
          persona real. Se guarda apenas la eliges.
        </p>
        <button
          type="button"
          className={foto ? undefined : "primario"}
          disabled={estado.subiendo}
          onClick={() => input.current?.click()}
        >
          {estado.subiendo ? "Subiendo…" : foto ? "Cambiar foto" : "Subir foto"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*,.heic,.heif"
          hidden
          onChange={(e) => {
            subir(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {estado.ok && (
          <p className="mensaje ok" role="status">
            {estado.ok}
          </p>
        )}
        {estado.error && <p className="mensaje error">{estado.error}</p>}
      </div>
    </div>
  );
}
