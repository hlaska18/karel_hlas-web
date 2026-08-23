/**
 * Přístupový kód do prostředí.
 *
 * ZMĚNA KÓDU: přepiš `PRISTUPOVY_KOD` níž a nahraj web. Nic jiného měnit
 * netřeba – nápověda na přihlašovací obrazovce zmizí sama.
 *
 * Kód se porovnává bez ohledu na velikost písmen, mezery a pomlčky – žák
 * opisuje z tabule a překlep v „win 11" nemá být důvod, proč se nedostane
 * do hodiny. Zároveň platí, že tohle není zabezpečení: kód je součástí
 * stránky a kdo se umí podívat do zdrojového kódu, najde ho. Je to závora,
 * ne zámek – má držet pohromadě třídu, ne bránit útočníkovi.
 */

/** Kód, se kterým se web veze. Tenhle řádek neměň – slouží k porovnání. */
const VYCHOZI_KOD: string = "WIN11";

/** Kód, kterým se do prostředí vchází. TOHLE JE TEN ŘÁDEK K PŘEPSÁNÍ. */
export const PRISTUPOVY_KOD: string = "WIN11";

/**
 * Je kód pořád ten výchozí?
 *
 * Přihlašovací obrazovka podle toho pozná, jestli smí kód napovědět. Dokud je
 * výchozí, nemá co tajit – stojí i ve zdrojáku stránky a je to závora, ne
 * zámek, takže je lepší, když se návštěvník dostane dovnitř, než aby stál
 * před polem a nevěděl. Jakmile si ho vyučující přepíše na vlastní, nápověda
 * zmizí sama a závora zase drží třídu pohromadě.
 */
export const jeVychoziKod = (): boolean => PRISTUPOVY_KOD === VYCHOZI_KOD;

/** Klíč v `sessionStorage`: po obnovení stránky se kód nezadává znovu. */
export const KLIC_ODEMCENO = "win11-vyuka-odemceno";

const normalizuj = (text: string) => text.replace(/[\s-]/g, "").toUpperCase();

export const kodSedi = (zadano: string): boolean =>
  normalizuj(zadano) === normalizuj(PRISTUPOVY_KOD);

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
    // Zakázané úložiště nevadí – jen se kód po obnovení stránky zadá znovu.
  }
}
