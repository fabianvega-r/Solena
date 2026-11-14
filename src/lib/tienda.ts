// Datos de contacto y formato de la tienda, usados por el catálogo público.

// Número de WhatsApp de la tienda, con indicativo de país y sin «+» ni espacios.
export const WHATSAPP = "573006102215";
export const WHATSAPP_VISIBLE = "+57 300 610 2215";

// Colombia no cambia de horario en el año.
export const ZONA_HORARIA = "America/Bogota";

export function enlaceWhatsapp(mensaje?: string): string {
  return `https://wa.me/${WHATSAPP}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;
}

// Orden habitual de las tallas de letra; las numéricas (6, 8, 10…) van de menor a mayor.
const ORDEN_TALLAS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// ["m", "s", "xs"] -> ["XS", "S", "M"]. Las tallas que no reconoce quedan al final, como se escribieron.
export function ordenarTallas(tallas: string[]): string[] {
  const posicion = (t: string) => {
    const letra = ORDEN_TALLAS.indexOf(t.toUpperCase());
    if (letra >= 0) return letra;
    const numero = Number(t.replace(",", "."));
    return Number.isFinite(numero) ? 100 + numero : 10_000;
  };
  return tallas
    .map((t) => (ORDEN_TALLAS.includes(t.toUpperCase()) ? t.toUpperCase() : t))
    .map((t, i) => ({ t, i, p: posicion(t) }))
    .sort((a, b) => a.p - b.p || a.i - b.i) // si empatan, respeta el orden original
    .map(({ t }) => t);
}

// "otoño" -> "Colección Otoño". Si ya empieza por "Colección", se deja como está.
export function nombreTemporada(temporada: string): string {
  const t = temporada.trim();
  const conMayuscula = t.charAt(0).toLocaleUpperCase("es") + t.slice(1);
  return /^colecci[oó]n(\s|$)/i.test(t) ? conMayuscula : `Colección ${conMayuscula}`;
}

const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// 189000 -> "$ 189.000"
export function precio(pesos: number): string {
  return formatoPesos.format(pesos);
}
