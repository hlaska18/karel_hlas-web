/**
 * Kód postupu: shrnutí kurzu, které žák opíše do Teams a učitel vloží do
 * Přehledu třídy. Bez serveru a bez účtů.
 *
 * Je to SHRNUTÍ, NE DŮKAZ. Kód vzniká v prohlížeči žáka, takže si ho zdatný
 * žák může upravit – kontrolní součet by nic nechránil (rada 24. 9. 2026).
 * Důkazem práce je stažený soubor .db z lekce 19.
 */

import type { Varianta } from "@/lib/dbb/pisemka";

/**
 * Skóre sady (detektivka, procvičování): [samostatně, celkem, s řešením].
 * Úlohy splněné po zobrazení řešení se do prvního čísla nepočítají
 * (rada 24. 9. 2026) – starší kódy třetí číslo nemají.
 */
export type SkoreSady = [number, number, number?];

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
  /** Procvičování a detektivka: [samostatně, celkem, s řešením]. */
  sady?: Record<string, SkoreSady>;
  /** Splněné úlohy od učitele z odkazu (jejich kódy „u-…“). */
  ulohy?: string[];
  /** Splněné úlohy navíc a úkoly detektivky a procvičování – aby šly obnovit. */
  klice?: string[];
  /** Začátky zadání úloh od učitele podle kódu – do Přehledu třídy místo „u-…“. */
  nazvyUloh?: Record<string, string>;
  /** Kód vznikl v písemce (/sql?pisemka=A|B) – Přehled třídy ho ukáže zvlášť. */
  pisemka?: Varianta;
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
      JSON.stringify({
        j: p.jmeno,
        d: p.datum,
        h: p.hotove,
        s: p.sede,
        n: p.navic,
        x: p.sady || {},
        u: p.ulohy || [],
        k: p.klice || [],
        v: p.nazvyUloh || {},
        ...(p.pisemka ? { p: p.pisemka } : {}),
      }),
    )
  );
}

/** Přečte kód; poškozený nebo cizí text vrátí jako null. */
export function dekoduj(kod: string): Postup | null {
  const k = kod.trim();
  const i = k.indexOf(PREDPONA);
  if (i === -1) return null;
  const telo = k.slice(i + PREDPONA.length).split(/\s/)[0];
  // Nesmyslně dlouhý kód (vložený omylem nebo schválně) se ani nedekóduje.
  if (!telo || telo.length > MAX_DELKA_KODU) return null;
  try {
    const d = JSON.parse(zBase64Url(telo)) as {
      j: string;
      d: string;
      h: number[];
      s: number[];
      n: number;
      x?: Record<string, unknown>;
      u?: string[];
      k?: string[];
      v?: Record<string, unknown>;
      p?: string;
    };
    if (!d || typeof d !== "object" || typeof d.j !== "string" || !Array.isArray(d.h)) return null;
    const hotove = cislaLekci(d.h);
    return {
      jmeno: d.j.trim().slice(0, 60),
      datum: typeof d.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.d) ? d.d : "",
      hotove,
      // Šedá fajfka jen u lekce, která je opravdu hotová.
      sede: cislaLekci(d.s).filter((l) => hotove.indexOf(l) !== -1),
      navic: celeCislo(d.n, 1000),
      sady: skoreSad(d.x),
      ulohy: kratkeTexty(d.u, 100, 40).filter((u) => u.indexOf("u-") === 0),
      klice: kratkeTexty(d.k, 200, 80),
      nazvyUloh: nazvy(d.v),
      ...(d.p === "A" || d.p === "B" ? { pisemka: d.p as Varianta } : {}),
    };
  } catch {
    return null;
  }
}

/*
 * Kontrola obsahu kódu (audit 4. 10. 2026). Kód je přehled, ne důkaz – jde
 * o to, aby poškozený nebo upravený kód neshodil Přehled třídy a neukázal
 * nesmysl (NaN, záporné body, tisíc lekcí). Platné starší kódy projdou beze
 * změny.
 */
const MAX_DELKA_KODU = 20000;

/** Konečné nezáporné celé číslo do `max`; jinak 0. */
function celeCislo(x: unknown, max: number): number {
  const n = Number(x);
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), max) : 0;
}

/** Čísla lekcí: kladná celá čísla do 999, bez opakování, nejvýš 100 položek. */
function cislaLekci(x: unknown): number[] {
  if (!Array.isArray(x)) return [];
  const vysledek: number[] = [];
  for (const h of x.slice(0, 100)) {
    const n = Number(h);
    if (Number.isInteger(n) && n > 0 && n < 1000 && vysledek.indexOf(n) === -1) vysledek.push(n);
  }
  return vysledek;
}

/** Krátké texty ze seznamu: nejvýš `pocet` položek, každá nejvýš `delka` znaků. */
function kratkeTexty(x: unknown, pocet: number, delka: number): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .slice(0, pocet)
    .filter((v) => typeof v === "string" || typeof v === "number")
    .map((v) => String(v).slice(0, delka));
}

/** Skóre sad z kódu – jen dvojice a trojice nezáporných celých čísel. */
function skoreSad(x: unknown): Record<string, SkoreSady> {
  const vysledek: Record<string, SkoreSady> = {};
  if (!x || typeof x !== "object" || Array.isArray(x)) return vysledek;
  Object.keys(x as object)
    .slice(0, 40)
    .forEach((id) => {
      if (id.length > 40) return;
      const s = (x as Record<string, unknown>)[id];
      if (!Array.isArray(s) || s.length < 2) return;
      const celkem = celeCislo(s[1], 1000);
      // Samostatně ani s řešením nemůže být víc než celkem.
      const sam = Math.min(celeCislo(s[0], 1000), celkem);
      vysledek[id] = s.length > 2 ? [sam, celkem, Math.min(celeCislo(s[2], 1000), celkem)] : [sam, celkem];
    });
  return vysledek;
}

/** Skóre sady k přečtení: „12/16“, nebo „12/16 (3 s řešením)“. */
export function skoreSadyText(s: SkoreSady, sReseni: string): string {
  return `${s[0]}/${s[1]}${s[2] ? ` (${s[2]} ${sReseni})` : ""}`;
}

/** Názvy úloh z kódu – jen krátké texty, cokoli jiného se zahodí. */
function nazvy(v: unknown): Record<string, string> {
  const vysledek: Record<string, string> = {};
  if (!v || typeof v !== "object" || Array.isArray(v)) return vysledek;
  Object.keys(v as object).slice(0, 100).forEach((k) => {
    const n = (v as Record<string, unknown>)[k];
    if (k.indexOf("u-") === 0 && typeof n === "string") vysledek[k] = n.slice(0, 60);
  });
  return vysledek;
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

/* ─────────────────────────── přehled třídy ─────────────────────────── */

/** Jméno pro porovnání: bez diakritiky, malými písmeny, slova podle abecedy („Novák Adam“ = „Adam Novák“). */
export function normalizujJmeno(jmeno: string): string {
  return jmeno
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s)
    .sort()
    .join(" ");
}

function sjednot<T>(a: T[], b: T[]): T[] {
  return a.concat(b.filter((x) => a.indexOf(x) === -1));
}

/**
 * Sloučí kódy téhož žáka (rada 24. 9. 2026). Dřív platil jen nejnovější,
 * takže domácí úkol (lekce 11–13 z domu) zmizel, když žák pak poslal kód
 * ze školy. Teď se splněné lekce sčítají, zelená přebije šedou, u detektivky
 * a procvičování platí nejlepší výsledek.
 */
export function sloucitPostupy(postupy: Postup[]): Postup[] {
  // Map, ne obyčejný objekt: jméno „__proto__“ nebo „constructor“ v kódu od
  // žáka by jinak sáhlo na zděděnou vlastnost a shodilo celý přehled třídy
  // (Codex 29. 9. 2026). Ze stejného důvodu jsou níž objekty bez prototypu.
  const podleJmena = new Map<string, Postup[]>();
  postupy.forEach((p) => {
    // Písemka se se zbytkem kurzu nesčítá – má svůj řádek.
    const k = normalizujJmeno(p.jmeno) + (p.pisemka ? `|${p.pisemka}` : "");
    const skupina = podleJmena.get(k);
    if (skupina) skupina.push(p);
    else podleJmena.set(k, [p]);
  });
  return Array.from(podleJmena.values())
    .map((skupina) => {
      const kody = skupina.slice().sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));
      const posledni = kody[kody.length - 1];
      let hotove: number[] = [];
      let sede: number[] = [];
      const zelene: number[] = [];
      const sady: Record<string, SkoreSady> = Object.create(null);
      let ulohy: string[] = [];
      let klice: string[] = [];
      const nazvyUloh: Record<string, string> = Object.create(null);
      let navic = 0;
      kody.forEach((p) => {
        hotove = sjednot(hotove, p.hotove);
        sede = sjednot(sede, p.sede);
        p.hotove.forEach((id) => p.sede.indexOf(id) === -1 && zelene.indexOf(id) === -1 && zelene.push(id));
        navic = Math.max(navic, p.navic);
        Object.keys(p.sady || {}).forEach((id) => {
          const s = (p.sady || {})[id];
          if (!sady[id] || sady[id][0] < s[0]) sady[id] = [s[0], s[1], s[2] || 0];
        });
        ulohy = sjednot(ulohy, p.ulohy || []);
        klice = sjednot(klice, p.klice || []);
        Object.keys(p.nazvyUloh || {}).forEach((u) => (nazvyUloh[u] = (p.nazvyUloh || {})[u]));
      });
      return {
        jmeno: posledni.jmeno,
        datum: posledni.datum,
        hotove: hotove.sort((a, b) => a - b),
        sede: sede.filter((id) => zelene.indexOf(id) === -1).sort((a, b) => a - b),
        navic,
        sady,
        ulohy,
        klice,
        nazvyUloh,
        ...(posledni.pisemka ? { pisemka: posledni.pisemka } : {}),
      };
    })
    .sort((a, b) => a.jmeno.localeCompare(b.jmeno, "cs"));
}

/** Kolik žáků má kterou lekci hotovou (zelenou i šedou) – kde třída skončila. */
export function souhrnTridy(zaci: Postup[], lekce: number[]): number[] {
  return lekce.map((id) => zaci.filter((z) => z.hotove.indexOf(id) !== -1).length);
}

/**
 * První lekce, kterou má hotovou méně než polovina třídy – tam příště začít
 * (rada 24. 9. 2026). Vrací index do seznamu lekcí, nebo -1.
 */
export function kdeZacit(souhrn: number[], pocetZaku: number): number {
  if (!pocetZaku) return -1;
  for (let i = 0; i < souhrn.length; i++) if (souhrn[i] * 2 < pocetZaku) return i;
  return -1;
}
