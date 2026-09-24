/**
 * Úložiště kurzu v prohlížeči (localStorage) s oddělením pro režim předvádění.
 *
 * Učitel promítá kurz na počítači, na kterém jindy sedí žák. V režimu
 * předvádění dostanou všechny klíče předponu, takže učitelova ukázka
 * nesmíchá postup ani soubory žáka. Režim platí jen do zavření karty
 * (sessionStorage) – další žák u počítače ho nezdědí.
 */

const PREDVADENI = "dbb-predvadeni";
const PREDPONA = "predvadeni:";

function zjistiRezim(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PREDVADENI) === "1";
  } catch {
    return false;
  }
}

let predvadeni = zjistiRezim();

export function jePredvadeni(): boolean {
  return predvadeni;
}

/** Přepne režim předvádění; volající pak stránku načte znovu. */
export function nastavPredvadeni(zapnout: boolean): void {
  predvadeni = zapnout;
  try {
    if (zapnout) sessionStorage.setItem(PREDVADENI, "1");
    else sessionStorage.removeItem(PREDVADENI);
  } catch {
    /* bez sessionStorage platí režim jen do obnovení stránky */
  }
}

export const klic = (k: string) => (predvadeni ? PREDPONA + k : k);

export function cist(k: string): string | null {
  try {
    return localStorage.getItem(klic(k));
  } catch {
    return null;
  }
}

export function zapsat(k: string, hodnota: string): boolean {
  try {
    localStorage.setItem(klic(k), hodnota);
    return true;
  } catch {
    return false;
  }
}

export function smazat(k: string): void {
  try {
    localStorage.removeItem(klic(k));
  } catch {
    /* není co mazat */
  }
}
