/**
 * Společný stav hodin ALGOLABu 1–3 a 5–7 (hodina 4 má vlastní, starší `stav.ts`).
 *
 * Každá hodina má vlastní klíč v úložišti (`algolab-h1` …), takže rozbitý zápis
 * jedné hodiny neshodí ostatní. Data hodiny jsou obyčejný objekt čísel, textů,
 * přepínačů a seznamů. Při čtení z úložiště nebo z kódu postupu se srovnají se
 * vzorem (`podleVzoru`): co nesedí typem, nahradí výchozí hodnota. Rozsahy
 * (index mimo seznam) hlídá až komponenta, vzor zná jen typy.
 */

import { ulozDoProhlizece } from "@/lib/ulozeni";

export interface FazeLekce {
  id: string;
  nazev: string;
  minut: number;
}

export const FAZE_LEKCE: FazeLekce[] = [
  { id: "problem", nazev: "Problém", minut: 5 },
  { id: "pokus", nazev: "Vlastní pokus", minut: 10 },
  { id: "experiment", nazev: "Experiment", minut: 15 },
  { id: "vyzva", nazev: "Výzva", minut: 10 },
  { id: "reflexe", nazev: "Reflexe", minut: 5 },
];

export interface StavLekce<T> {
  faze: string;
  hotovo: string[];
  data: T;
}

export const klicHodiny = (cislo: number) => `algolab-h${cislo}`;

const MAX_TEXT = 3000;
const MAX_SEZNAM = 400;

/**
 * Srovná neznámou hodnotu se vzorem. Prázdný seznam ve vzoru bere čísla a
 * texty, neprázdný bere prvky podle svého prvního prvku.
 */
export function podleVzoru<T>(vzor: T, x: unknown): T {
  if (typeof vzor === "number") return (typeof x === "number" && Number.isFinite(x) ? x : vzor) as T;
  if (typeof vzor === "string") return (typeof x === "string" ? x.slice(0, MAX_TEXT) : vzor) as T;
  if (typeof vzor === "boolean") return (typeof x === "boolean" ? x : vzor) as T;
  if (Array.isArray(vzor)) {
    if (!Array.isArray(x)) return vzor;
    const pole = x.slice(0, MAX_SEZNAM);
    if (!vzor.length) {
      return pole.filter((p) => typeof p === "string" || (typeof p === "number" && Number.isFinite(p))) as T;
    }
    const prvni = vzor[0];
    return pole.map((p) => podleVzoru(prvni, p)) as T;
  }
  if (vzor && typeof vzor === "object") {
    const o = x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
    const vysledek: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(vzor as Record<string, unknown>)) vysledek[k] = podleVzoru(v, o[k]);
    return vysledek as T;
  }
  return vzor;
}

export function vychoziLekce<T>(faze: FazeLekce[], vychozi: () => T): StavLekce<T> {
  return { faze: faze[0].id, hotovo: [], data: vychozi() };
}

export function zDatLekce<T>(x: unknown, faze: FazeLekce[], vychozi: () => T): StavLekce<T> {
  const stav = vychoziLekce(faze, vychozi);
  if (!x || typeof x !== "object") return stav;
  const d = x as Record<string, unknown>;
  const ids = faze.map((f) => f.id);
  if (typeof d.faze === "string" && ids.includes(d.faze)) stav.faze = d.faze;
  if (Array.isArray(d.hotovo)) stav.hotovo = ids.filter((f) => (d.hotovo as unknown[]).includes(f));
  stav.data = podleVzoru(vychozi(), d.data);
  return stav;
}

export function nactiLekci<T>(cislo: number, faze: FazeLekce[], vychozi: () => T): StavLekce<T> {
  try {
    const text = window.localStorage.getItem(klicHodiny(cislo));
    return zDatLekce(text ? JSON.parse(text) : null, faze, vychozi);
  } catch {
    return vychoziLekce(faze, vychozi);
  }
}

export const ulozLekci = <T>(cislo: number, stav: StavLekce<T>) => ulozDoProhlizece(klicHodiny(cislo), JSON.stringify(stav));

/** Je hodina beze změny? Prázdné hodiny do kódu postupu nejdou. */
export const jeVychozi = <T>(stav: StavLekce<T>, faze: FazeLekce[], vychozi: () => T) =>
  JSON.stringify(stav) === JSON.stringify(vychoziLekce(faze, vychozi));
