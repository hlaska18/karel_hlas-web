/**
 * Vstup do prostředí: paměť rozběhnutého sezení.
 *
 * Vstupní kódy (SPSTABOR, kódy tříd, veřejné WIN11 a MACOS) Karel
 * 25. 9. 2026 zrušil: nic nechránily ani neukládaly, kódy tříd jen
 * propustily dál. Žák se teď přihlásí svým jménem a výsledek pošle kódem
 * postupu (`lib/postupSimulatoru.ts`), stejně jako v kurzu SQL.
 */

export type Prostredi = "windows" | "macos";

/**
 * Klíč v `sessionStorage`: po obnovení stránky se nepřihlašuje znovu.
 *
 * Každé prostředí má svůj. Dokud platil společný vstupní kód, stačilo
 * přihlásit se jednou do obou; se jménem by ale macOS pustil žáka do Windows
 * bez jména („Žák“) a kód postupu by odešel bezejmenný.
 */
const klicOdemceno = (prostredi: Prostredi) => `win11-vyuka-odemceno-${prostredi}`;

export function jePrihlasen(prostredi: Prostredi): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(klicOdemceno(prostredi)) === "1";
  } catch {
    return false;
  }
}

export function zapamatujPrihlaseni(prihlasen: boolean, prostredi: Prostredi): void {
  if (typeof window === "undefined") return;
  try {
    if (prihlasen) window.sessionStorage.setItem(klicOdemceno(prostredi), "1");
    else window.sessionStorage.removeItem(klicOdemceno(prostredi));
  } catch {
    // Zakázané úložiště nevadí – jen se po obnovení stránky začne od zámku.
  }
}
