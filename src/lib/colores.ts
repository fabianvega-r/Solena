// Muestra visual de un color escrito a mano en el panel («amarillo», «Azul marino», «verde oliva»).
// Los colores de las prendas son texto libre, así que se busca el nombre más largo que coincida;
// si no se reconoce (p. ej. «estampado»), no hay muestra y solo se ve el nombre.

const MUESTRAS: Record<string, string> = {
  "azul marino": "#1f2a52",
  "azul cielo": "#8ec5e8",
  "azul rey": "#2747b8",
  "verde oliva": "#6b6b2e",
  "verde menta": "#a8e0c4",
  "rosa palo": "#e8c4c0",
  "palo de rosa": "#d8a5a0",
  "gris claro": "#c9c9c9",
  "gris oscuro": "#555555",
  "vino tinto": "#6e1f2e",
  amarillo: "#f2c94c",
  mostaza: "#d4a21c",
  naranja: "#f08a3c",
  coral: "#f07f6a",
  rojo: "#c8352e",
  vino: "#6e1f2e",
  rosado: "#f2a7c0",
  rosa: "#f2a7c0",
  fucsia: "#d6297a",
  lila: "#c3a6e0",
  morado: "#6c3c96",
  violeta: "#7f4fc0",
  azul: "#2f5fb3",
  celeste: "#8ec5e8",
  turquesa: "#2bb5b0",
  verde: "#3c8c4a",
  oliva: "#6b6b2e",
  menta: "#a8e0c4",
  blanco: "#ffffff",
  marfil: "#f6f0e1",
  crema: "#f1e6cc",
  beige: "#dccbaa",
  arena: "#d9c7a7",
  camel: "#c19a6b",
  "café": "#6f4a2f",
  "marrón": "#6f4a2f",
  chocolate: "#4e3020",
  terracota: "#c0603b",
  gris: "#8c8c8c",
  plateado: "#c0c0c8",
  dorado: "#c9a43b",
  negro: "#1a1a1a",
  lavanda: "#b9a8d9",
  durazno: "#f6b98f",
  "verde esmeralda": "#1f8a5c",
  "azul petróleo": "#1c5a66",
  caqui: "#a89a6a",
  "rojo ladrillo": "#a3442d",
};

// Paleta que ve la administradora al crear una prenda, en orden de claro a oscuro por familia.
export const COLORES_BASE = [
  "Blanco", "Marfil", "Crema", "Beige", "Arena", "Camel", "Caqui", "Café", "Terracota",
  "Durazno", "Amarillo", "Mostaza", "Naranja", "Coral", "Rojo", "Rojo ladrillo", "Vino tinto",
  "Rosa palo", "Rosado", "Fucsia", "Lavanda", "Lila", "Morado",
  "Azul cielo", "Azul", "Azul marino", "Azul petróleo", "Turquesa",
  "Verde menta", "Verde", "Verde esmeralda", "Verde oliva",
  "Gris claro", "Gris", "Negro", "Dorado", "Plateado",
];

// Mismo color escrito distinto («amarillo», «Amarillo ») cuenta como uno solo.
export const mismoColor = (a: string, b: string) => normalizar(a) === normalizar(b);

// Limpia lo que escribe la administradora: sin comas (separan colores al guardar), sin espacios
// de más, primera letra en mayúscula. «  azul  REY, » → «Azul rey».
export function limpiarColor(texto: string): string {
  const t = normalizar(texto.replace(/,/g, " ")).slice(0, 40);
  return t.charAt(0).toLocaleUpperCase("es") + t.slice(1);
}

// Lista final que se guarda en la prenda: limpia y sin repetidos («Negro» y «negro» = uno).
export function limpiarColores(colores: string[]): string[] {
  const unicos: string[] = [];
  for (const color of colores.map(limpiarColor).filter(Boolean)) {
    if (!unicos.some((u) => mismoColor(u, color))) unicos.push(color);
  }
  return unicos;
}

// Claves ordenadas de la más larga a la más corta: «azul marino» gana sobre «azul».
const CLAVES = Object.keys(MUESTRAS).sort((a, b) => b.length - a.length);

const normalizar = (t: string) => t.trim().toLocaleLowerCase("es").replace(/\s+/g, " ");

export function muestraDeColor(nombre: string): string | null {
  const texto = normalizar(nombre);
  // Femeninos y plurales («blanca», «negros») se reconocen por su forma base.
  const clave = CLAVES.find((c) => texto === c || texto.startsWith(c + " ") || texto.startsWith(c.slice(0, -1)));
  return clave ? MUESTRAS[clave] : null;
}
