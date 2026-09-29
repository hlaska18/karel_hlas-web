/**
 * Hlášení, jestli se práce povedla uložit do prohlížeče (localStorage).
 *
 * Plné nebo zakázané úložiště dřív všechna prostředí tiše spolkla: práce
 * běžela dál, ale po zavření karty zmizela bez varování (Codex 29. 9. 2026,
 * Karel: „mělo by být upozornění“). Ukládací místa teď po každém pokusu
 * zavolají `hlasUlozeni` a `UpozorneniUlozeni` v layoutu ukáže pruh, dokud
 * se ukládání nevzpamatuje.
 */

export const UDALOST_ULOZENI = "web:ulozeni";

let posledni: boolean | null = null;

/** `ok = false`, když zápis do úložiště selhal. Hlásí jen změnu stavu. */
export function hlasUlozeni(ok: boolean): void {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function" || posledni === ok) return;
  posledni = ok;
  window.dispatchEvent(new CustomEvent<boolean>(UDALOST_ULOZENI, { detail: ok }));
}

/** localStorage.setItem, který selhání nahlásí. Vrací, jestli se zápis povedl. */
export function ulozDoProhlizece(klic: string, hodnota: string): boolean {
  try {
    window.localStorage.setItem(klic, hodnota);
    hlasUlozeni(true);
    return true;
  } catch {
    hlasUlozeni(false);
    return false;
  }
}
