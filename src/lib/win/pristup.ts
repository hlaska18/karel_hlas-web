/**
 * Vstup do prostředí: kód od učitele a paměť rozběhnutého sezení.
 *
 * ORGANIZAČNÍ ZÁVORA, NE ZÁMEK — a je to tak napsané i na obrazovce.
 * Kód se porovnává v prohlížeči, takže kdo se podívá do zdrojového kódu
 * stránky, najde ho. Nevadí to: po zrušení účtů žáků tu není co chránit,
 * na server nejde nic. Kód drží pohromadě třídu a otevírá hodinu.
 *
 * ŽÁDNÁ NÁPOVĚDA. Dřívější podoba kódu nabízela výchozí hodnotu tlačítkem,
 * které ji po kliknutí vyplnilo — závora, kterou obsluha otevírá
 * návštěvníkovi. Přesně kvůli tomu se rušila (`de570c6`) a nevrací se.
 *
 * PŘIDÁNÍ KÓDU PRO TŘÍDU: dopiš řádek do `KODY` níž a nahraj web. Nic
 * jiného měnit netřeba.
 */

/**
 * Kódy, kterými se do prostředí vchází. Stačí, když sedí kterýkoli.
 *
 * `WIN11` je společný a zůstává. Kódy tříd se dopisují podle potřeby —
 * hodí se, když má učitel vědět, odkud kdo přišel, nebo když chce mít
 * pro každou třídu vlastní vstup.
 */
export const KODY: readonly string[] = [
  "WIN11",
  // "1A-2026",
  // "2B-2026",
];

/**
 * Mezery, pomlčky a velikost písmen se ignorují. Žák opisuje z tabule
 * a překlep ve „win 11" nemá být důvod, proč se nedostane do hodiny.
 */
const normalizuj = (text: string) => text.replace(/[\s-]/g, "").toUpperCase();

export const kodSedi = (zadano: string): boolean => {
  const hledany = normalizuj(zadano);
  return hledany.length > 0 && KODY.some((k) => normalizuj(k) === hledany);
};

/** Klíč v `sessionStorage`: po obnovení stránky se kód nezadává znovu. */
export const KLIC_ODEMCENO = "win11-vyuka-odemceno";

export function jePrihlasen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KLIC_ODEMCENO) === "1";
  } catch {
    return false;
  }
}

export function zapamatujPrihlaseni(prihlasen: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (prihlasen) window.sessionStorage.setItem(KLIC_ODEMCENO, "1");
    else window.sessionStorage.removeItem(KLIC_ODEMCENO);
  } catch {
    // Zakázané úložiště nevadí – jen se po obnovení stránky začne od zámku.
  }
}
