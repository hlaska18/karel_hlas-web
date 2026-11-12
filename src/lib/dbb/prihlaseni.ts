/**
 * Přihlášení do kurzu SQL (Karel 11. 11. 2026): stejně jako ve Windows, na
 * Macu a v labech napíše žák na začátku jméno, a kdo pokračuje z jiného
 * počítače, vloží místo jména svůj kód postupu SQLKURZ1-.
 *
 * Dřív se jméno psalo až v Moje výsledky. Formát kódu se nezměnil a
 * „Pokračovat z kódu“ v Moje výsledky zůstává.
 */

import { jmenoPlatne } from "@/lib/postupSimulatoru";
import { dekoduj, najdiKody, type Postup } from "./kodPostupu";

export type VstupPrihlaseni =
  | { druh: "jmeno"; jmeno: string }
  | { druh: "kod"; jmeno: string; postup: Postup }
  | { druh: "chyba"; cs: string; en: string };

const MAX_JMENO = 40;

const CIZI_KODY: [RegExp, string, string][] = [
  [/WSIT1-/, "z NETLABu", "from NETLAB"],
  [/WIN1-/, "ze simulátoru Windows", "from the Windows simulator"],
  [/MAC1-/, "ze simulátoru macOS", "from the macOS simulator"],
  [/ALGZ?1-/, "z ALGOLABu", "from ALGOLAB"],
];

/** Napsal žák místo jména kód? */
export const vypadaJakoKod = (text: string) => /SQLKURZ1-/.test(text) || CIZI_KODY.some(([vzor]) => vzor.test(text));

/** Co žák napsal do pole při přihlášení: jméno, kód postupu, nebo chyba s vysvětlením. */
export function vstupPrihlaseni(text: string, vPisemce: boolean): VstupPrihlaseni {
  if (/SQLKURZ1-/.test(text)) {
    if (vPisemce) {
      return {
        druh: "chyba",
        cs: "V písemce se postup z kódu nenačítá. Napiš své jméno a příjmení.",
        en: "A progress code can't be loaded in a test. Type your first and last name.",
      };
    }
    const postup = najdiKody(text)[0] || dekoduj(text.trim());
    if (!postup) {
      return {
        druh: "chyba",
        cs: "Tohle není celý kód postupu. Vlož ho celý, jak jsi ho poslal(a) do Teams.",
        en: "This is not a whole progress code. Paste all of it, the way you sent it in Teams.",
      };
    }
    const jmeno = (postup.jmeno || "").trim().slice(0, MAX_JMENO);
    if (!jmenoPlatne(jmeno)) {
      return {
        druh: "chyba",
        cs: "V kódu chybí jméno. Přihlas se jménem a kód vlož potom v Moje výsledky → Pokračovat z kódu.",
        en: "The code has no name in it. Sign in with your name and then paste the code in My Results → Continue from a code.",
      };
    }
    return { druh: "kod", jmeno, postup };
  }
  for (const [vzor, cs, en] of CIZI_KODY) {
    if (vzor.test(text)) return { druh: "chyba", cs: `Tohle je kód ${cs}, tady je DBLAB (kurz SQL).`, en: `This is a code ${en}; this is DBLAB (the SQL course).` };
  }
  const jmeno = text.trim().replace(/\s+/g, " ").slice(0, MAX_JMENO);
  if (!jmenoPlatne(jmeno)) return { druh: "chyba", cs: "Napiš své jméno a příjmení.", en: "Type your first and last name." };
  return { druh: "jmeno", jmeno };
}
