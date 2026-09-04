/**
 * Rangos de tallas por categoría de calzado, alineados con las numeraciones
 * rápidas del jefe (OrderFormModal / SummarySizer).
 *
 * Dama: 33-38 · Caballero: 33-42 · Infantil: 21-32
 */

type ShoeCategory = 'Infantil' | 'Dama' | 'Caballero';

/** Normaliza un nombre de categoría (case-insensitive) a las 3 categorías estándar. */
export function resolveCategory(categoryName?: string): ShoeCategory {
  if (!categoryName) return 'Caballero';
  const cat = categoryName.toLowerCase();
  if (cat.includes('infantil')) return 'Infantil';
  if (cat.includes('dama')) return 'Dama';
  return 'Caballero';
}

/** Devuelve { start, end } según la categoría. */
export function getSizeRange(
  categoryName?: string
): { start: number; end: number } {
  const cat = resolveCategory(categoryName);
  if (cat === 'Infantil') return { start: 21, end: 32 };
  if (cat === 'Dama') return { start: 33, end: 38 };
  return { start: 33, end: 42 }; // Caballero
}

/** Devuelve la lista de tallas como strings: ['21','22',…] o ['33','34',…] */
export function getSizesList(categoryName?: string): string[] {
  const { start, end } = getSizeRange(categoryName);
  return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
}

/** Texto legible de tallas: "33 al 38", "21 al 32", etc. */
export function getSizeRangeText(categoryName?: string): string {
  const { start, end } = getSizeRange(categoryName);
  return `${start} al ${end}`;
}
