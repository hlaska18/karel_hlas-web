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

const DNY_MAC = ["ne", "po", "út", "st", "čt", "pá", "so"];

/**
 * Datum v horní liště Macu: „čt 24. 9.“ – krátce, jak ho píše skutečná
 * lišta. Celé „čtvrtek 24. září 2026“ z ní dělalo webovou hlavičku
 * (Karlovy návrhy 24. 9. 2026). Den malým písmenem, tak ho píše český
 * macOS i `Intl` (rada 24. 9. 2026). Dlouhé datum zůstává v Centru oznámení.
 */
export function datumMenuMac(d: Date): string {
  return `${DNY_MAC[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}
