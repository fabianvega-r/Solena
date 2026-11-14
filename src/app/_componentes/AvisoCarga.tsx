"use client";
// Aviso «Cargando…» al ir a otra página, en el catálogo y en el panel. Next deja la pantalla
// quieta mientras el servidor prepara la página nueva; sin este aviso parece que el toque no sirvió.
// Se enciende al tocar un enlace interno o enviar un formulario que navega (p. ej. «Buscar»),
// y se apaga cuando cambia la dirección. Los formularios que guardan ya muestran «Guardando…».
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Si la página tarda menos que esto, no se muestra nada (evita un parpadeo).
const RETRASO_MS = 150;
// Por si algo falla y la dirección nunca cambia: el aviso no se queda pegado.
const MAXIMO_MS = 15000;

// ¿Este clic lleva a otra página de este mismo sitio, en esta misma pestaña?
// (No se mira e.defaultPrevented: <Link> de Next siempre cancela el clic para navegar por su cuenta.)
function esNavegacionInterna(e: MouseEvent): HTMLAnchorElement | null {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const enlace = (e.target as Element | null)?.closest?.("a[href]");
  if (!(enlace instanceof HTMLAnchorElement)) return null;
  if (enlace.target && enlace.target !== "_self") return null; // abre otra pestaña
  if (enlace.hasAttribute("download")) return null;
  const destino = new URL(enlace.href, location.href);
  if (destino.origin !== location.origin) return null; // WhatsApp u otro sitio
  // Mismo lugar o solo un ancla (#prendas): no hay nada que cargar.
  if (destino.pathname === location.pathname && destino.search === location.search) return null;
  return enlace;
}

export function AvisoCarga() {
  const ruta = usePathname();
  const parametros = useSearchParams();
  const [cargando, setCargando] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let tocado: Element | null = null;
    const empezar = (elemento: Element | null) => {
      tocado?.removeAttribute("data-cargando");
      tocado = elemento;
      tocado?.setAttribute("data-cargando", "");
      setCargando(true);
    };
    const alHacerClic = (e: MouseEvent) => {
      const enlace = esNavegacionInterna(e);
      if (enlace) empezar(enlace);
    };
    // Solo formularios que de verdad cambian de página: los que guardan cancelan el envío
    // normal (preventDefault) y muestran su propio «Guardando…».
    const alEnviar = (e: SubmitEvent) => {
      const form = e.target;
      if (e.defaultPrevented || !(form instanceof HTMLFormElement) || form.target === "_blank") return;
      // Una búsqueda repetida deja la misma dirección: no habría cuándo apagar el aviso.
      if (form.method === "get") {
        const destino = new URL(form.action, location.href);
        // (TypeScript no admite FormData aquí aunque el navegador sí; de ahí la conversión).
        destino.search = new URLSearchParams(new FormData(form) as unknown as string[][]).toString();
        if (destino.pathname === location.pathname && destino.search === location.search) return;
      }
      empezar(e.submitter ?? form);
    };
    // Clics: en captura (antes que React), para verlos aunque <Link> los cancele.
    // Envíos: en burbuja, cuando el formulario ya decidió si cancela el envío normal.
    window.addEventListener("click", alHacerClic, { capture: true });
    document.addEventListener("submit", alEnviar);
    const limpiar = () => tocado?.removeAttribute("data-cargando");
    // Al volver con «Atrás», el navegador puede restaurar la página tal cual quedó: se apaga el aviso.
    const alVolver = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      limpiar();
      setCargando(false);
    };
    window.addEventListener("pagehide", limpiar);
    window.addEventListener("pageshow", alVolver);
    return () => {
      window.removeEventListener("click", alHacerClic, { capture: true });
      document.removeEventListener("submit", alEnviar);
      window.removeEventListener("pagehide", limpiar);
      window.removeEventListener("pageshow", alVolver);
      limpiar();
    };
  }, []);

  // Llegó la página nueva: se apaga el aviso y el botón tocado vuelve a la normalidad.
  useEffect(() => {
    setCargando(false);
  }, [ruta, parametros]);

  useEffect(() => {
    if (!cargando) {
      setVisible(false);
      document.querySelectorAll("[data-cargando]").forEach((el) => el.removeAttribute("data-cargando"));
      return;
    }
    const mostrar = setTimeout(() => setVisible(true), RETRASO_MS);
    const rendirse = setTimeout(() => setCargando(false), MAXIMO_MS); // también quita el atenuado
    return () => {
      clearTimeout(mostrar);
      clearTimeout(rendirse);
    };
  }, [cargando]);

  return (
    <div className="aviso-carga" data-visible={visible || undefined} role="status" aria-live="polite">
      {visible && (
        <>
          <span className="aviso-carga-barra" aria-hidden />
          <span className="aviso-carga-texto">Cargando…</span>
        </>
      )}
    </div>
  );
}
