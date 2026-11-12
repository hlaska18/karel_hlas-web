/**
 * Přihlášení do ALGOLABu (Karel 11. 11. 2026): stejně jako v simulátorech
 * napíše žák jméno, a kdo pokračuje z jiného počítače, vloží místo jména svůj
 * kód postupu ALG1-. Jméno i práce zůstávají v prohlížeči.
 *
 * Přihlášení platí pro kartu prohlížeče (`sessionStorage`): po obnovení
 * stránky se nepřihlašuje znovu, v nové kartě ano. Na sdíleném počítači tak
 * další žák nesedne do cizí práce bez otázky.
 */

import { jmenoPlatne, stejneJmeno } from "@/lib/postupSimulatoru";
import { dekodujAlgolab, type PraceAlgolabu } from "./kod";

export { jmenoPlatne, stejneJmeno };

/** Jméno přihlášeného žáka (localStorage). */
export const KLIC_JMENA = "algolab-jmeno";
/** Rozběhnuté sezení v téhle kartě (sessionStorage). */
const KLIC_SEZENI = "algolab-prihlasen";

export type VstupAlgolabu =
  | { druh: "jmeno"; jmeno: string }
  | { druh: "kod"; jmeno: string; prace: PraceAlgolabu }
  | { druh: "chyba"; hlaska: string };

const CIZI_KODY: [RegExp, string][] = [
  [/ALGZ1-/, "Tohle je odevzdání závěrečného ověření. Kód postupu začíná ALG1-."],
  [/WSIT1-/, "Tohle je kód postupu z NETLABu, tady je ALGOLAB."],
  [/WIN1-/, "Tohle je kód postupu ze simulátoru Windows, tady je ALGOLAB."],
  [/MAC1-/, "Tohle je kód postupu ze simulátoru macOS, tady je ALGOLAB."],
  [/SQLKURZ1-/, "Tohle je kód postupu z DBLABu (kurz SQL), tady je ALGOLAB."],
];

/** Napsal žák místo jména kód? Podle toho se mění nadpis pole. */
export const vypadaJakoKod = (text: string) => /ALG1-/.test(text) || CIZI_KODY.some(([vzor]) => vzor.test(text));

/** Co žák napsal do pole na přihlašovací obrazovce: jméno, kód postupu, nebo chyba s vysvětlením. */
export function vstupAlgolabu(text: string): VstupAlgolabu {
  if (/ALG1-/.test(text)) {
    const prace = dekodujAlgolab(text);
    if (!prace) return { druh: "chyba", hlaska: "Tohle není celý kód postupu. Vlož ho celý, jak jsi ho zkopíroval(a)." };
    if (!prace.jmeno || !jmenoPlatne(prace.jmeno)) {
      return { druh: "chyba", hlaska: "Tenhle kód je ze starší verze ALGOLABu a nenese jméno, načíst už nejde. Přihlas se jménem." };
    }
    return { druh: "kod", jmeno: prace.jmeno, prace };
  }
  for (const [vzor, hlaska] of CIZI_KODY) if (vzor.test(text)) return { druh: "chyba", hlaska };
  const jmeno = text.trim().replace(/\s+/g, " ").slice(0, 60);
  if (!jmenoPlatne(jmeno)) return { druh: "chyba", hlaska: "Napiš své jméno a příjmení." };
  return { druh: "jmeno", jmeno };
}

export function ctiJmeno(): string {
  try {
    return (window.localStorage.getItem(KLIC_JMENA) || "").trim().slice(0, 60);
  } catch {
    return "";
  }
}

export function jeVSezeni(): boolean {
  try {
    return window.sessionStorage.getItem(KLIC_SEZENI) === "1";
  } catch {
    return false;
  }
}

export function zapamatujSezeni(prihlasen: boolean): void {
  try {
    if (prihlasen) window.sessionStorage.setItem(KLIC_SEZENI, "1");
    else window.sessionStorage.removeItem(KLIC_SEZENI);
  } catch {
    /* Zakázané úložiště: po obnovení stránky se jen přihlásí znovu. */
  }
}
