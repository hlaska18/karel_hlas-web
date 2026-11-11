/**
 * Úložiště rozdělaných prací závěrečného ověření (hodina 8).
 *
 * Na sdíleném školním počítači sedí u jednoho prohlížeče víc žáků a žák si
 * vedle ostrého ověření může otevřít cvičné. Proto se práce ukládají zvlášť
 * podle zadání a jména (Codex a rada 11. 11. 2026): nikdo nikomu nic
 * nepřepíše a nic se nemusí mazat. Dřív bylo místo jen jedno.
 *
 * Klíč `algolab-h8` drží `{ v: 2, prace: { "ZADANI|jmeno": práce } }`.
 * Starší podobu (jedna práce přímo v klíči) čtení převede.
 */

import { normalizujJmeno } from "@/lib/dbb/kodPostupu";
import { dekodujOdevzdani, VERZE_GENERATORU, zakodujOdevzdani, type OdpovediZaverecne } from "./zaverecne";

export interface PraceZaka {
  zadani: string;
  jmeno: string;
  odpovedi: OdpovediZaverecne;
  odevzdano: boolean;
  /** RRRR-MM-DD */
  datum: string;
}

/** Uložená práce a čas poslední změny (ms), podle kterého se při plném skladu vyřazuje nejstarší. */
export type UlozenaPrace = PraceZaka & { zmena: number };

export type SkladPraci = Record<string, UlozenaPrace>;

/** Víc prací se v jednom prohlížeči nedrží; nejdéle neměněná vypadne. */
export const MAX_PRACI = 60;

/** Stejné jméno bez ohledu na diakritiku, velikost písmen, mezery a pořadí slov. */
export const klicPrace = (zadani: string, jmeno: string) => `${zadani.trim().toUpperCase()}|${normalizujJmeno(jmeno)}`;

/** Uložená práce prochází stejnou kontrolou jako kód od žáka. Poškozená se zahodí. */
function overPraci(x: unknown, dnes: string): PraceZaka | null {
  try {
    const p = x as Partial<PraceZaka> | null;
    if (!p || typeof p.zadani !== "string" || typeof p.jmeno !== "string" || !p.odpovedi) return null;
    const datum = typeof p.datum === "string" ? p.datum : dnes;
    const kod = dekodujOdevzdani(zakodujOdevzdani({ verze: VERZE_GENERATORU, zadani: p.zadani, jmeno: p.jmeno, datum, odpovedi: p.odpovedi }));
    return kod ? { zadani: kod.zadani, jmeno: kod.jmeno, odpovedi: kod.odpovedi, odevzdano: p.odevzdano === true, datum: kod.datum } : null;
  } catch {
    return null;
  }
}

/** Obsah klíče `algolab-h8` → práce podle klíče. Rozbitý zápis dá prázdný sklad. */
export function praceZTextu(text: string | null, dnes: string): SkladPraci {
  const sklad: SkladPraci = {};
  if (!text) return sklad;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return sklad;
  }
  if (!data || typeof data !== "object") return sklad;
  const d = data as { v?: unknown; prace?: unknown };
  // Starší podoba: jediná práce přímo v klíči.
  const polozky: unknown[] = d.v === 2 && d.prace && typeof d.prace === "object" ? Object.values(d.prace as object) : [data];
  for (const polozka of polozky) {
    const p = overPraci(polozka, dnes);
    if (!p) continue;
    const zmena = Number((polozka as { zmena?: unknown }).zmena);
    sklad[klicPrace(p.zadani, p.jmeno)] = { ...p, zmena: Number.isFinite(zmena) ? zmena : 0 };
  }
  return sklad;
}

const doTextu = (sklad: SkladPraci) => JSON.stringify({ v: 2, prace: sklad });

/** Sklad s přidanou nebo přepsanou prací. Ostatní práce zůstanou, nad `MAX_PRACI` vypadne nejdéle neměněná. */
export function praceDoTextu(sklad: SkladPraci, prace: PraceZaka, ted: number): string {
  const klic = klicPrace(prace.zadani, prace.jmeno);
  const novy: SkladPraci = { ...sklad, [klic]: { ...prace, zmena: ted } };
  const klice = Object.keys(novy);
  if (klice.length > MAX_PRACI) {
    const odNejstarsi = klice.filter((k) => k !== klic).sort((a, b) => novy[a].zmena - novy[b].zmena);
    for (const k of odNejstarsi.slice(0, klice.length - MAX_PRACI)) delete novy[k];
  }
  return doTextu(novy);
}

/** Sklad bez jedné práce (cvičné ověření „zkusit znovu“). */
export function praceBez(sklad: SkladPraci, klic: string): string {
  const novy = { ...sklad };
  delete novy[klic];
  return doTextu(novy);
}

/** Otisk obsahu práce: dvě karty podle něj poznají, že se práce vedle změnila. */
export function otiskPrace(p: PraceZaka): string {
  return `${zakodujOdevzdani({ verze: VERZE_GENERATORU, zadani: p.zadani, jmeno: p.jmeno, datum: p.datum, odpovedi: p.odpovedi })}|${p.odevzdano ? 1 : 0}`;
}

/** Jména uložených prací pro jedno zadání (nápověda na obrazovce se jménem). */
export const jmenaPraci = (sklad: SkladPraci, zadani: string) =>
  Object.values(sklad)
    .filter((p) => p.zadani === zadani.trim().toUpperCase())
    .map((p) => p.jmeno);
