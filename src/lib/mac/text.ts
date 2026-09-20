/**
 * Drobnosti kolem češtiny, které prostředí píše na víc místech.
 *
 * Bydlí to zvlášť proto, že stavový řádek Finderu a informace o ploše musí
 * říkat totéž. Když měl každý svoje počítání, napsala jedna část „2 položky"
 * a druhá „3 položek" o tomtéž místě.
 */

/** „1 položka" / „2 položky" / „5 položek" – české skloňování po číslovce. */
export function polozekSlovy(n: number): string {
  if (n === 1) return "1 položka";
  if (n >= 2 && n <= 4) return `${n} položky`;
  return `${n} položek`;
}
