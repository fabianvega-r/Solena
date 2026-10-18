// Cálculos de paginación, sin nada de pantalla: sirven para cualquier listado (colecciones, prendas…).

export type Pagina = {
  actual: number; // página que se muestra, empezando en 1
  total: number; // cuántas páginas hay en total
  saltar: number; // cuántos registros saltarse en la base de datos (OFFSET)
  tomar: number; // cuántos registros traer (LIMIT)
};

// `pedida` viene de la dirección (?pagina=3), así que puede ser cualquier texto:
// se convierte a número y se ajusta para que siempre caiga entre 1 y la última página.
export function calcularPagina(pedida: string | undefined, totalRegistros: number, porPagina: number): Pagina {
  const total = Math.max(1, Math.ceil(totalRegistros / porPagina));
  const numero = Number.parseInt(pedida ?? "1", 10);
  const actual = Number.isFinite(numero) ? Math.min(Math.max(numero, 1), total) : 1;
  return { actual, total, saltar: (actual - 1) * porPagina, tomar: porPagina };
}
