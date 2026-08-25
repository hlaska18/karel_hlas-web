/**
 * Paměť rozběhnutého sezení.
 *
 * Dřív tu byl přístupový kód do prostředí. Zrušen schválně: kontroloval se
 * jen v prohlížeči, takže API o něm nevědělo a zakládání účtů nechránil ani
 * náhodou, a dokud zůstával výchozí, přihlašovací obrazovka ho sama nabízela
 * tlačítkem, které ho vyplnilo. Byl to krok navíc na začátku hodiny, ne
 * závora. Kdo do prostředí nemá, tomu ho neotevře ani kód stojící ve zdrojáku
 * stránky; kdo v něm chce mít uložený postup, zakládá si účet, a ten je
 * ověřovaný na serveru doopravdy.
 *
 * Zbylo jen tohle: po obnovení stránky se nezačíná znovu od zamykací
 * obrazovky. Drží to karta prohlížeče, takže zavřením zmizí.
 */

/** Klíč v `sessionStorage`. */
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
