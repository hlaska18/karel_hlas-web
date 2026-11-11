/**
 * Stav lekce o batohu (hodina 4, starší formát než `lekce.ts`). Hodiny 1–7 jsou formativní, proto žádné přihlášení:
 * všechno zůstává v prohlížeči žáka. Na jiný počítač si práci přenese sám
 * kódem postupu ALG1- (`kod.ts`, Karel 7. 11. 2026).
 */

import { ulozDoProhlizece } from "@/lib/ulozeni";
import { KAPACITA, ZAKAZKY, krokyTabulky, zpetnaCesta, type Zakazka } from "./batoh";

export const KLIC_BATOHU = "algolab-batoh";

export const FAZE = [
  { id: "problem", nazev: "Problém", minut: 5 },
  { id: "pokus", nazev: "Vlastní pokus", minut: 10 },
  { id: "experiment", nazev: "Experiment", minut: 15 },
  { id: "vyzva", nazev: "Výzva", minut: 10 },
  { id: "reflexe", nazev: "Reflexe", minut: 5 },
] as const;

export type Faze = (typeof FAZE)[number]["id"];
export type Pravidlo = "nejvynosnejsi" | "zaHodinu" | "stejne";

/** Hodiny bloku ve finálním pořadí. */
export const HODINY: { cislo: number; nazev: string }[] = [
  { cislo: 1, nazev: "Efektivita algoritmů" },
  { cislo: 2, nazev: "Rozděl a panuj" },
  { cislo: 3, nazev: "Dynamické programování: mřížka" },
  { cislo: 4, nazev: "Dynamické programování: batoh" },
  { cislo: 5, nazev: "Heuristiky" },
  { cislo: 6, nazev: "Grafy a simulace" },
  { cislo: 7, nazev: "Laboratoř efektivity" },
  { cislo: 8, nazev: "Závěrečné ověření" },
];

export interface OdpovediVyzvy {
  bunky: string[];
  vyznam: number | null;
  rozdil: string;
  zkontrolovano: boolean;
}

export const PRAZDNA_VYZVA: OdpovediVyzvy = { bunky: ["", "", ""], vyznam: null, rozdil: "", zkontrolovano: false };

export interface StavBatohu {
  faze: Faze;
  plan: string[];
  planPotvrzen: boolean;
  tip: Pravidlo | null;
  castExperimentu: "tabulka" | "zmena";
  /** Kolik buněk tabulky je hotových. */
  krok: number;
  /** Buňky s odpovědí žáka, `řádek:sloupec`. */
  zodpovezene: string[];
  /** Kolik řádků už žák prošel při hledání plánu odzadu. */
  zpet: number;
  uprava: { zakazky: Zakazka[]; kapacita: number };
  seedVyzvy: number | null;
  vyzva: OdpovediVyzvy;
  reflexe: string;
  vzorOdkryt: boolean;
  hotovo: Faze[];
}

export const vychoziStav = (): StavBatohu => ({
  faze: "problem",
  plan: [],
  planPotvrzen: false,
  tip: null,
  castExperimentu: "tabulka",
  krok: 0,
  zodpovezene: [],
  zpet: 0,
  uprava: { zakazky: ZAKAZKY, kapacita: KAPACITA },
  seedVyzvy: null,
  vyzva: PRAZDNA_VYZVA,
  reflexe: "",
  vzorOdkryt: false,
  hotovo: [],
});

const jeCislo = (x: unknown, od: number, po: number): x is number =>
  typeof x === "number" && Number.isInteger(x) && x >= od && x <= po;

const jeTexty = (x: unknown): x is string[] => Array.isArray(x) && x.every((t) => typeof t === "string");

function platnaUprava(x: unknown): StavBatohu["uprava"] | null {
  const u = x as { zakazky?: unknown; kapacita?: unknown } | null;
  if (!u || !jeCislo(u.kapacita, 1, 20) || !Array.isArray(u.zakazky) || u.zakazky.length !== ZAKAZKY.length) return null;
  const zakazky = ZAKAZKY.map((vzor, i) => {
    const z = (u.zakazky as Partial<Zakazka>[])[i];
    return z && jeCislo(z.doba, 1, 20) && jeCislo(z.prinos, 0, 99) ? { ...vzor, doba: z.doba, prinos: z.prinos } : null;
  });
  return zakazky.every(Boolean) ? { zakazky: zakazky as Zakazka[], kapacita: u.kapacita } : null;
}

/** Cokoli z úložiště se prověří: rozbitý zápis nesmí shodit lekci. */
export function zOdlozeneho(text: string | null): StavBatohu {
  const stav = vychoziStav();
  if (!text) return stav;
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(text);
    if (!d || typeof d !== "object") return stav;
  } catch {
    return stav;
  }

  if (FAZE.some((f) => f.id === d.faze)) stav.faze = d.faze as Faze;
  if (jeTexty(d.plan)) {
    const vybrane = ZAKAZKY.filter((z) => (d.plan as string[]).includes(z.id));
    if (vybrane.reduce((s, z) => s + z.doba, 0) <= KAPACITA) stav.plan = vybrane.map((z) => z.id);
  }
  stav.planPotvrzen = d.planPotvrzen === true && stav.plan.length > 0;
  if (d.tip === "nejvynosnejsi" || d.tip === "zaHodinu" || d.tip === "stejne") stav.tip = d.tip;
  if (d.castExperimentu === "zmena") stav.castExperimentu = "zmena";
  if (jeCislo(d.krok, 0, krokyTabulky(ZAKAZKY, KAPACITA).length)) stav.krok = d.krok;
  if (jeTexty(d.zodpovezene)) stav.zodpovezene = d.zodpovezene;
  if (jeCislo(d.zpet, 0, zpetnaCesta(ZAKAZKY, KAPACITA).length)) stav.zpet = d.zpet;
  stav.uprava = platnaUprava(d.uprava) ?? stav.uprava;
  if (jeCislo(d.seedVyzvy, 0, 4294967295)) stav.seedVyzvy = d.seedVyzvy;
  const v = d.vyzva as Partial<OdpovediVyzvy> | null | undefined;
  if (v && jeTexty(v.bunky) && v.bunky.length === 3 && typeof v.rozdil === "string") {
    stav.vyzva = {
      bunky: v.bunky,
      vyznam: jeCislo(v.vyznam, 0, 3) ? v.vyznam : null,
      rozdil: v.rozdil,
      zkontrolovano: v.zkontrolovano === true,
    };
  }
  if (typeof d.reflexe === "string") stav.reflexe = d.reflexe;
  stav.vzorOdkryt = d.vzorOdkryt === true;
  if (jeTexty(d.hotovo)) stav.hotovo = FAZE.map((f) => f.id).filter((f) => (d.hotovo as string[]).includes(f));
  return stav;
}

export function nactiBatoh(): StavBatohu {
  try {
    return zOdlozeneho(window.localStorage.getItem(KLIC_BATOHU));
  } catch {
    return vychoziStav();
  }
}

export const ulozBatoh = (stav: StavBatohu) => ulozDoProhlizece(KLIC_BATOHU, JSON.stringify(stav));
