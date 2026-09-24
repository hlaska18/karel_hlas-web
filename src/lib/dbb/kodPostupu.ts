/**
 * Kód postupu: shrnutí kurzu, které žák opíše do Teams a učitel vloží do
 * Přehledu třídy. Bez serveru a bez účtů.
 *
 * Je to SHRNUTÍ, NE DŮKAZ. Kód vzniká v prohlížeči žáka, takže si ho zdatný
 * žák může upravit – kontrolní součet by nic nechránil (rada 24. 9. 2026).
 * Důkazem práce je stažený soubor .db z lekce 19.
 */

export type Postup = {
  /** Jméno, které žák napsal. */
  jmeno: string;
  /** Datum, kdy kód vznikl (RRRR-MM-DD). */
  datum: string;
  /** Hotové lekce. */
  hotove: number[];
  /** Lekce splněné s pomocí vloženého řešení (šedá fajfka). */
  sede: number[];
  /** Splněné úlohy navíc. */
  navic: number;
  /** Procvičování a detektivka: splněno / celkem. */
  sady?: Record<string, [number, number]>;
  /** Splněné úlohy od učitele z odkazu (jejich kódy „u-…“). */
  ulohy?: string[];
};

const PREDPONA = "SQLKURZ1-";

function naBase64Url(text: string): string {
  // UTF-8 přes encodeURIComponent – funguje i ve starých prohlížečích.
  const bajty = unescape(encodeURIComponent(text));
  return btoa(bajty).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function zBase64Url(text: string): string {
  let b = text.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return decodeURIComponent(escape(atob(b)));
}

export function zakoduj(p: Postup): string {
  return (
    PREDPONA +
    naBase64Url(
      JSON.stringify({ j: p.jmeno, d: p.datum, h: p.hotove, s: p.sede, n: p.navic, x: p.sady || {}, u: p.ulohy || [] }),
    )
  );
}

/** Přečte kód; poškozený nebo cizí text vrátí jako null. */
export function dekoduj(kod: string): Postup | null {
  const k = kod.trim();
  const i = k.indexOf(PREDPONA);
  if (i === -1) return null;
  const telo = k.slice(i + PREDPONA.length).split(/\s/)[0];
  try {
    const d = JSON.parse(zBase64Url(telo)) as {
      j: string;
      d: string;
      h: number[];
      s: number[];
      n: number;
      x?: Record<string, [number, number]>;
      u?: string[];
    };
    if (typeof d.j !== "string" || !Array.isArray(d.h)) return null;
    return {
      jmeno: d.j,
      datum: String(d.d || ""),
      hotove: d.h.map(Number),
      sede: (d.s || []).map(Number),
      navic: Number(d.n || 0),
      sady: d.x || {},
      ulohy: Array.isArray(d.u) ? d.u.map(String) : [],
    };
  } catch {
    return null;
  }
}

/** Všechny kódy z vloženého textu (třeba celé vlákno z Teams). */
export function najdiKody(text: string): Postup[] {
  const vysledek: Postup[] = [];
  const re = /SQLKURZ1-[A-Za-z0-9_-]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const p = dekoduj(m[0]);
    if (p) vysledek.push(p);
  }
  return vysledek;
}
