/**
 * Vstup do prostředí: kód od učitele a paměť rozběhnutého sezení.
 *
 * ORGANIZAČNÍ ZÁVORA, NE ZÁMEK — a je to tak napsané i na obrazovce.
 * Kód se porovnává v prohlížeči, takže kdo se podívá do zdrojového kódu
 * stránky, najde ho. Nevadí to: po zrušení účtů žáků tu není co chránit,
 * na server nejde nic. Kód drží pohromadě třídu a otevírá hodinu.
 *
 * ŽÁDNÁ NÁPOVĚDA NA ZAMYKACÍ OBRAZOVCE. Dřívější podoba kódu nabízela
 * výchozí hodnotu tlačítkem, které ji po kliknutí vyplnilo — závora, kterou
 * obsluha otevírá návštěvníkovi. Přesně kvůli tomu se rušila (`de570c6`)
 * a nevrací se. Veřejné kódy pro učitele z jiných škol (`VEREJNE_KODY`)
 * stojí jinde: na dlaždici simulátoru v bance, kterou čte učitel, ne žák.
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
   * i do macOS – proto není pojmenovaný po žádném z nich.
   *
   * Od 21. 9. 2026 je to `SPSTABOR`, na Karlovo zadání. Předchozí společné
   * kódy `WIN11` a `OS2026` tím přestaly platit (`WIN11` se 23. 9. vrátil,
   * ale jen jako veřejný kód do Windows – viz `VEREJNE_KODY`). Kdo je zrovna
   * přihlášený, toho to nevyhodí – přihlášení drží `sessionStorage` do
   * zavření záložky.
   */
  "SPSTABOR",

  // Kódy tříd pro školní rok 2026/27. Značky oborů jsou tytéž, jaké používá
  // banka materiálů (`public/materialy/1L`, `1S`, `1P`), takže je netřeba
  // si pamatovat dvojí. Nová třída = jeden řádek sem a nahrát web.
  "1LA-2026", // Technické lyceum A
  "1LB-2026", // Technické lyceum B
  "1S-2026", // Strojírenství
  "1P-2026", // Pozemní stavitelství
];

/** Které prostředí se odemyká. Veřejné kódy platí každý jen do svého. */
export type Prostredi = "windows" | "macos";

/**
 * Veřejné kódy pro učitele z jiných škol – od 23. 9. 2026, na Karlovo
 * rozhodnutí po radě o distribuci. Dřív se cizí učitel do simulátorů
 * nedostal vůbec: kód nebyl napsaný nikde na webu. Teď je vypsaný na
 * dlaždici simulátoru v bance (`public/materialy/1L/11/_nastroj.json`,
 * pole `kod`) – kdo ho mění tady, musí ho změnit i tam.
 *
 * Na rozdíl od školních kódů výš platí každý JEN DO SVÉHO prostředí.
 */
export const VEREJNE_KODY: Record<Prostredi, string> = {
  windows: "WIN11",
  macos: "MACOS",
};

/**
 * Mezery, pomlčky, velikost písmen a DIAKRITIKA se ignorují. Žák opisuje
 * z tabule a překlep nemá být důvod, proč se nedostane do hodiny.
 *
 * Diakritika kvůli společnému kódu: škola se jmenuje SPŠ Tábor a žák ho
 * napíše přirozeně s háčkem a čárkou. „SPŠ Tábor", „sps tabor" i
 * „spstabor" proto projdou všechny.
 */
const normalizuj = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]/g, "")
    .toUpperCase();

export const kodSedi = (zadano: string, prostredi: Prostredi): boolean => {
  const hledany = normalizuj(zadano);
  if (hledany.length === 0) return false;
  if (KODY.some((k) => normalizuj(k) === hledany)) return true;
  return normalizuj(VEREJNE_KODY[prostredi]) === hledany;
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
