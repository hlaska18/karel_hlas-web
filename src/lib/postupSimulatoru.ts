/**
 * Kód postupu ze simulátorů Windows a macOS – obdoba `SQLKURZ1-…` z kurzu SQL
 * (`lib/dbb/kodPostupu.ts`). Karel 25. 9. 2026 zrušil vstupní kódy („nic
 * nechránily ani neukládaly“) a chtěl místo nich jméno a kód postupu: žák se
 * přihlásí jménem, na konci hodiny zkopíruje kód do Teams a učitel kódy
 * vloží do Přehledu třídy.
 *
 * Je to SHRNUTÍ, NE DŮKAZ. Kód vzniká v prohlížeči žáka a dá se upravit;
 * na server nejde nic. Sdílí ho oba simulátory, podobně jako `win/pristup.ts`.
 *
 * Úlohy se v kódu nesou podle `id`, ne podle pořadí. Když časem úloha
 * přibude nebo se přesune, starý kód pořád ukazuje na ty správné.
 */

import { normalizujJmeno } from "@/lib/dbb/kodPostupu";
import { CHYBY_SITE } from "@/lib/win/sit";

/**
 * `sit` je Síťová dílna (`/sitova-dilna`, od 3. 11. 2026; předtím úlohy
 * v simulátoru Windows). Má vlastní předponu WSIT1-, takže se kódy WIN1-
 * nemíchají s jinou sadou úloh.
 */
export type Simulator = "windows" | "macos" | "sit";

export const NAZEV_SIMULATORU: Record<Simulator, string> = {
  windows: "Windows",
  macos: "macOS",
  sit: "Síťová dílna",
};

const PREDPONA: Record<Simulator, string> = {
  windows: "WIN1-",
  macos: "MAC1-",
  sit: "WSIT1-",
};

/** Jméno účtu, dokud se žák nepřihlásí svým. */
export const VYCHOZI_JMENO = "Žák";

export type PostupSimulatoru = {
  simulator: Simulator;
  jmeno: string;
  /** RRRR-MM-DD, kdy kód vznikl. */
  datum: string;
  /** Id splněných úloh. */
  splneno: string[];
  /** Kolik úloh simulátor měl, když kód vznikl. */
  celkem: number;
  /**
   * Chyby při opravě sítě (id z `CHYBY_SITE` → kolikrát). Nese je WSIT1 a WIN1
   * žáka, který dělal síťové úlohy. Jiné kódy pole nemají – Přehled pak píše
   * „neměřeno“, ne nulu.
   */
  chyby?: Record<string, number>;
};

const dva = (n: number) => (n < 10 ? `0${n}` : String(n));

export function dnes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dva(d.getMonth() + 1)}-${dva(d.getDate())}`;
}

function naBase64Url(text: string): string {
  // UTF-8 přes encodeURIComponent – funguje i ve starých prohlížečích z cíle.
  return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function zBase64Url(text: string): string {
  let b = text.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return decodeURIComponent(escape(atob(b)));
}

export function zakodujSimulator(p: PostupSimulatoru): string {
  const data: Record<string, unknown> = { j: p.jmeno, d: p.datum, h: p.splneno, c: p.celkem };
  if (p.chyby) data.ch = p.chyby;
  return PREDPONA[p.simulator] + naBase64Url(JSON.stringify(data));
}

/** Chyby z kódu: jen známá id a celá čísla 0–99, cokoli jiného se zahodí. */
function prectiChyby(ch: unknown): Record<string, number> {
  const chyby: Record<string, number> = {};
  if (!ch || typeof ch !== "object" || Array.isArray(ch)) return chyby;
  Object.keys(CHYBY_SITE).forEach((id) => {
    const n = (ch as Record<string, unknown>)[id];
    if (typeof n === "number" && Number.isFinite(n) && n > 0) chyby[id] = Math.min(Math.floor(n), 99);
  });
  return chyby;
}

/*
 * Kontrola obsahu kódu (audit 4. 10. 2026, stejně jako u kurzu SQL). Kód je
 * přehled, ne důkaz – jde o to, aby poškozený nebo upravený kód neshodil
 * Přehled třídy a neukázal nesmysl. Platné starší kódy projdou beze změny.
 */
const MAX_DELKA_KODU = 10000;
/** Id úlohy: malá písmena, číslice a pomlčky (`cmd-dir`, `dvojkova-2026`). */
const ID_ULOHY = /^[a-z0-9-]{1,40}$/;

/** Přečte kód; poškozený nebo cizí text vrátí jako null. */
export function dekodujSimulator(kod: string): PostupSimulatoru | null {
  const m = /(WSIT1|WIN1|MAC1)-([A-Za-z0-9_-]+)/.exec(kod);
  if (!m || m[2].length > MAX_DELKA_KODU) return null;
  const simulator: Simulator = m[1] === "WIN1" ? "windows" : m[1] === "WSIT1" ? "sit" : "macos";
  try {
    const d = JSON.parse(zBase64Url(m[2])) as { j?: unknown; d?: unknown; h?: unknown; c?: unknown; ch?: unknown };
    if (!d || typeof d !== "object" || typeof d.j !== "string" || !Array.isArray(d.h)) return null;
    const splneno: string[] = [];
    for (const h of d.h.slice(0, 200)) {
      // Jen platná id úloh, bez opakování – cokoli jiného by v přehledu
      // vytvořilo neexistující „úlohu“.
      if (typeof h === "string" && ID_ULOHY.test(h) && splneno.indexOf(h) === -1) splneno.push(h);
    }
    const c = Number(d.c);
    const postup: PostupSimulatoru = {
      simulator,
      jmeno: d.j.trim().slice(0, 60),
      datum: typeof d.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.d) ? d.d : "",
      splneno,
      celkem: Number.isFinite(c) && c > 0 ? Math.min(Math.floor(c), 500) : 0,
    };
    // Kód bez `ch` a kód MAC1 klíč `chyby` nedostanou nikdy – musí se číst přesně jako dřív.
    if (simulator !== "macos" && d.ch !== undefined) postup.chyby = prectiChyby(d.ch);
    return postup;
  } catch {
    return null;
  }
}

/** Všechny kódy simulátorů z vloženého textu (třeba celé vlákno z Teams). */
export function najdiKodySimulatoru(text: string): PostupSimulatoru[] {
  const vysledek: PostupSimulatoru[] = [];
  const re = /(?:WSIT1|WIN1|MAC1)-[A-Za-z0-9_-]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const p = dekodujSimulator(m[0]);
    if (p) vysledek.push(p);
  }
  return vysledek;
}

/**
 * Síťové úlohy byly od 1. do 3. 11. 2026 v běžném seznamu Windows, takže je
 * z té doby nese i kód WIN1- (a kdo je má uložené, nese je dál). Přehled je
 * ukáže stejně jako z kódu WSIT1-, „x/33“ zůstává čisté.
 * Výsledný `celkem` Přehled nečte, bere počet ze seznamu úloh.
 */
function oddelSit(p: PostupSimulatoru): PostupSimulatoru[] {
  const sitove = p.splneno.filter((id) => id.startsWith("sit-"));
  if (p.simulator !== "windows" || (!sitove.length && !p.chyby)) return [p];
  const { chyby, ...bezChyb } = p;
  return [
    { ...bezChyb, splneno: p.splneno.filter((id) => !id.startsWith("sit-")) },
    { ...bezChyb, simulator: "sit", splneno: sitove, celkem: 0, ...(chyby ? { chyby } : {}) },
  ];
}

/**
 * Sloučí kódy téhož žáka v témže simulátoru: splněné úlohy se sčítají
 * (škola i domov), jméno a datum jsou z nejnovějšího kódu.
 */
export function sloucitSimulatory(postupy: PostupSimulatoru[]): PostupSimulatoru[] {
  const skupiny: Record<string, PostupSimulatoru[]> = {};
  postupy.flatMap(oddelSit).forEach((p) => {
    const k = `${p.simulator}|${normalizujJmeno(p.jmeno)}`;
    (skupiny[k] = skupiny[k] || []).push(p);
  });
  return Object.keys(skupiny)
    .map((k) => {
      const kody = skupiny[k].slice().sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));
      const posledni = kody[kody.length - 1];
      const splneno: string[] = [];
      kody.forEach((p) => p.splneno.forEach((id) => splneno.indexOf(id) === -1 && splneno.push(id)));
      const sloucene: PostupSimulatoru = {
        simulator: posledni.simulator,
        jmeno: posledni.jmeno,
        datum: posledni.datum,
        splneno,
        celkem: Math.max(...kody.map((p) => p.celkem)),
      };
      // Chyby: u každé nejvyšší počet. Každý další kód z téhož počítače nese
      // celý dosavadní součet, sčítání by chyby započítalo vícekrát.
      const sChybami = kody.filter((p) => p.chyby);
      if (sChybami.length) {
        const chyby: Record<string, number> = {};
        sChybami.forEach((p) =>
          Object.keys(p.chyby!).forEach((id) => (chyby[id] = Math.max(chyby[id] ?? 0, p.chyby![id]))),
        );
        sloucene.chyby = chyby;
      }
      return sloucene;
    })
    .sort((a, b) => (a.simulator !== b.simulator ? (a.simulator < b.simulator ? 1 : -1) : a.jmeno.localeCompare(b.jmeno, "cs")));
}

/** Co se zkopíruje do Teams: jméno a skóre před kódem. */
export function textKopieSimulatoru(p: PostupSimulatoru, kod: string, hotovo: number, celkem: number): string {
  return `${p.jmeno} · ${NAZEV_SIMULATORU[p.simulator]} ${hotovo}/${celkem} · ${kod}`;
}

/** Stejný žák? Bez diakritiky, velikosti písmen a pořadí slov. */
export const stejneJmeno = (a: string, b: string) => normalizujJmeno(a) === normalizujJmeno(b);

/** Dá se tímhle jménem přihlásit? Aspoň dvě písmena a ne výchozí „Žák“. */
export function jmenoPlatne(jmeno: string): boolean {
  const j = jmeno.trim();
  return j.length >= 2 && !stejneJmeno(j, VYCHOZI_JMENO);
}
