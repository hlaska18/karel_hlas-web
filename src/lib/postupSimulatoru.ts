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

export type Simulator = "windows" | "macos";

export const NAZEV_SIMULATORU: Record<Simulator, string> = {
  windows: "Windows",
  macos: "macOS",
};

const PREDPONA: Record<Simulator, string> = {
  windows: "WIN1-",
  macos: "MAC1-",
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
  return PREDPONA[p.simulator] + naBase64Url(JSON.stringify({ j: p.jmeno, d: p.datum, h: p.splneno, c: p.celkem }));
}

/** Přečte kód; poškozený nebo cizí text vrátí jako null. */
export function dekodujSimulator(kod: string): PostupSimulatoru | null {
  const m = /(WIN1|MAC1)-([A-Za-z0-9_-]+)/.exec(kod);
  if (!m) return null;
  const simulator: Simulator = m[1] === "WIN1" ? "windows" : "macos";
  try {
    const d = JSON.parse(zBase64Url(m[2])) as { j?: unknown; d?: unknown; h?: unknown; c?: unknown };
    if (typeof d.j !== "string" || !Array.isArray(d.h)) return null;
    return {
      simulator,
      jmeno: d.j.slice(0, 60),
      datum: String(d.d || "").slice(0, 10),
      splneno: d.h.map(String).slice(0, 200),
      celkem: Math.max(0, Number(d.c) || 0),
    };
  } catch {
    return null;
  }
}

/** Všechny kódy simulátorů z vloženého textu (třeba celé vlákno z Teams). */
export function najdiKodySimulatoru(text: string): PostupSimulatoru[] {
  const vysledek: PostupSimulatoru[] = [];
  const re = /(?:WIN1|MAC1)-[A-Za-z0-9_-]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const p = dekodujSimulator(m[0]);
    if (p) vysledek.push(p);
  }
  return vysledek;
}

/**
 * Sloučí kódy téhož žáka v témže simulátoru: splněné úlohy se sčítají
 * (škola i domov), jméno a datum jsou z nejnovějšího kódu.
 */
export function sloucitSimulatory(postupy: PostupSimulatoru[]): PostupSimulatoru[] {
  const skupiny: Record<string, PostupSimulatoru[]> = {};
  postupy.forEach((p) => {
    const k = `${p.simulator}|${normalizujJmeno(p.jmeno)}`;
    (skupiny[k] = skupiny[k] || []).push(p);
  });
  return Object.keys(skupiny)
    .map((k) => {
      const kody = skupiny[k].slice().sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));
      const posledni = kody[kody.length - 1];
      const splneno: string[] = [];
      kody.forEach((p) => p.splneno.forEach((id) => splneno.indexOf(id) === -1 && splneno.push(id)));
      return {
        simulator: posledni.simulator,
        jmeno: posledni.jmeno,
        datum: posledni.datum,
        splneno,
        celkem: Math.max(...kody.map((p) => p.celkem)),
      };
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
