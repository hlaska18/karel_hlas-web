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
 * Kódy tříd se dopisují podle potřeby — hodí se, když má učitel vědět,
 * odkud kdo přišel, nebo když chce mít pro každou třídu vlastní vstup.
 */
export const KODY: readonly string[] = [
  /*
   * Společný kód. Píše se na tabuli a platí do OBOU prostředí, do Windows
   * i do macOS – proto není pojmenovaný po žádném z nich. `WIN11` tu
   * zůstává, protože ho třídy znají a rozepsaný na tabuli ho mají i teď;
   * odebrat ho by uprostřed pololetí zavřelo dveře lidem, kteří nic
   * neudělali špatně.
   */
  "OS2026",
  "WIN11",

  // Kódy tříd pro školní rok 2026/27. Značky oborů jsou tytéž, jaké používá
  // banka materiálů (`public/materialy/1L`, `1S`, `1P`), takže je netřeba
  // si pamatovat dvojí. Nová třída = jeden řádek sem a nahrát web.
  "1LA-2026", // Technické lyceum A
  "1LB-2026", // Technické lyceum B
  "1S-2026", // Strojírenství
  "1P-2026", // Pozemní stavitelství
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
