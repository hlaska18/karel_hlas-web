/**
 * Hodina 6: nejrychlejší cesta v síti cest (Dijkstrův algoritmus) a simulace
 * náhodných výpadků spojů.
 *
 * Areál závodu: haly spojené cestami pro vozíky, číslo u cesty = minuty jízdy.
 * Dijkstra si drží dočasné časy, vždy uzavře nejbližší dosud neuzavřenou halu
 * a z ní zkusí zlepšit časy sousedů.
 */

import { generator } from "./nahoda";

export interface Uzel {
  nazev: string;
  x: number;
  y: number;
}

export interface Hrana {
  a: number;
  b: number;
  minut: number;
}

export const HALY: Uzel[] = [
  { nazev: "Sklad", x: 7, y: 50 },
  { nazev: "Lisovna", x: 30, y: 16 },
  { nazev: "Obrobna", x: 30, y: 84 },
  { nazev: "Svařovna", x: 51, y: 50 },
  { nazev: "Lakovna", x: 72, y: 16 },
  { nazev: "Kontrola", x: 72, y: 84 },
  { nazev: "Montáž", x: 93, y: 50 },
];

export const START = 0;
export const CIL = 6;

/**
 * Nejrychlejší cesta Sklad → Lisovna → Svařovna → Kontrola → Montáž trvá 16 min
 * a je jediná. Dijkstra uzavírá haly bez shody časů (ověřuje test).
 */
export const CESTY: Hrana[] = [
  { a: 0, b: 1, minut: 4 },
  { a: 0, b: 2, minut: 6 },
  { a: 0, b: 3, minut: 9 },
  { a: 1, b: 3, minut: 3 },
  { a: 2, b: 3, minut: 4 },
  { a: 1, b: 4, minut: 8 },
  { a: 3, b: 4, minut: 6 },
  { a: 3, b: 5, minut: 6 },
  { a: 2, b: 5, minut: 9 },
  { a: 4, b: 6, minut: 5 },
  { a: 5, b: 6, minut: 3 },
  { a: 4, b: 5, minut: 3 },
];

export const nazevCesty = (uzly: Uzel[], h: Hrana) => `${uzly[h.a].nazev} – ${uzly[h.b].nazev}`;

/** Sousedé uzlu přes otevřené cesty. */
function sousede(hrany: Hrana[], otevrene: boolean[], u: number): { v: number; minut: number; hrana: number }[] {
  const s: { v: number; minut: number; hrana: number }[] = [];
  hrany.forEach((h, i) => {
    if (!otevrene[i]) return;
    if (h.a === u) s.push({ v: h.b, minut: h.minut, hrana: i });
    else if (h.b === u) s.push({ v: h.a, minut: h.minut, hrana: i });
  });
  return s;
}

export interface Zlepseni {
  v: number;
  stary: number;
  novy: number;
  zlepsi: boolean;
}

export interface KrokDijkstry {
  /** Hala, která se v tomhle kroku uzavřela. */
  uzavrena: number;
  cas: number;
  zlepseni: Zlepseni[];
  /** Dočasné časy po kroku (Infinity = zatím nedosažitelné). */
  casy: number[];
  uzavrene: number[];
}

export interface VysledekDijkstry {
  casy: number[];
  predchozi: number[];
  kroky: KrokDijkstry[];
}

export function dijkstra(uzly: Uzel[], hrany: Hrana[], start: number, otevrene: boolean[] = hrany.map(() => true)): VysledekDijkstry {
  const n = uzly.length;
  const casy = Array(n).fill(Infinity);
  const predchozi = Array(n).fill(-1);
  const uzavreno = Array(n).fill(false);
  casy[start] = 0;
  const kroky: KrokDijkstry[] = [];
  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!uzavreno[i] && casy[i] < Infinity && (u < 0 || casy[i] < casy[u])) u = i;
    if (u < 0) break;
    uzavreno[u] = true;
    const zlepseni: Zlepseni[] = [];
    for (const { v, minut } of sousede(hrany, otevrene, u)) {
      if (uzavreno[v]) continue;
      const novy = casy[u] + minut;
      const zlepsi = novy < casy[v];
      zlepseni.push({ v, stary: casy[v], novy, zlepsi });
      if (zlepsi) {
        casy[v] = novy;
        predchozi[v] = u;
      }
    }
    kroky.push({ uzavrena: u, cas: casy[u], zlepseni, casy: casy.slice(), uzavrene: uzavreno.map((b, i) => (b ? i : -1)).filter((i) => i >= 0) });
  }
  return { casy, predchozi, kroky };
}

export function cestaDo(predchozi: number[], cil: number): number[] {
  const cesta: number[] = [];
  for (let u = cil; u >= 0; u = predchozi[u]) cesta.unshift(u);
  return cesta;
}

/** Index cesty mezi dvěma halami, nebo −1. */
export const najdiHranu = (hrany: Hrana[], a: number, b: number) =>
  hrany.findIndex((h) => (h.a === a && h.b === b) || (h.a === b && h.b === a));

/** Čas cesty po halách (−1, když dvě po sobě nejsou spojené). */
export function casCesty(hrany: Hrana[], cesta: number[]): number {
  let soucet = 0;
  for (let i = 0; i + 1 < cesta.length; i++) {
    const h = najdiHranu(hrany, cesta[i], cesta[i + 1]);
    if (h < 0) return -1;
    soucet += hrany[h].minut;
  }
  return soucet;
}

/** Nejrychlejší čas, když je jedna cesta natrvalo zavřená (Infinity = nedá se dojet). */
export function bezCesty(uzly: Uzel[], hrany: Hrana[], zavrena: number): number {
  return dijkstra(uzly, hrany, START, hrany.map((_, i) => i !== zavrena)).casy[CIL];
}

/** Cesta, jejíž uzavření prodlouží rozvoz nejvíc. */
export function kritickaCesta(uzly: Uzel[], hrany: Hrana[]): { hrana: number; cas: number } {
  let nej = { hrana: 0, cas: -1 };
  hrany.forEach((_, i) => {
    const cas = bezCesty(uzly, hrany, i);
    if (cas > nej.cas) nej = { hrana: i, cas };
  });
  return nej;
}

/* ───────────── Simulace ───────────── */

export const DNU = 200;

export interface Simulace {
  /** Čas rozvozu v jednotlivých dnech (null = díly ten den do Montáže nedojedou). */
  dny: (number | null)[];
  prumer: number;
  nejhorsi: number;
  nedojelo: number;
  /** Kolik dní je doba stejná jako bez výpadků. */
  bezZdrzeni: number;
  /** Četnosti časů pro sloupcový graf (klíč = minuty). */
  cetnosti: Map<number, number>;
}

/**
 * Každý den se každá cesta nezávisle na ostatních zavře s pravděpodobností p
 * (v procentech). Zálohovaná cesta se nezavře nikdy. Stejný seed = stejné dny,
 * takže se dají porovnat různé zálohy.
 */
export function simuluj(uzly: Uzel[], hrany: Hrana[], p: number, seed: number, zaloha = -1, dnu = DNU): Simulace {
  const nahoda = generator(seed);
  const zakladni = dijkstra(uzly, hrany, START).casy[CIL];
  const dny: (number | null)[] = [];
  for (let d = 0; d < dnu; d++) {
    // Los pro všechny cesty se táhne vždy, i pro zálohovanou: jinak by záloha posunula náhodu ostatním.
    const otevrene = hrany.map((_, i) => {
      const los = nahoda() * 100;
      return i === zaloha || los >= p;
    });
    const cas = dijkstra(uzly, hrany, START, otevrene).casy[CIL];
    dny.push(cas === Infinity ? null : cas);
  }
  const dojelo = dny.filter((c): c is number => c !== null);
  const cetnosti = new Map<number, number>();
  for (const c of dojelo) cetnosti.set(c, (cetnosti.get(c) ?? 0) + 1);
  return {
    dny,
    prumer: dojelo.length ? dojelo.reduce((a, b) => a + b, 0) / dojelo.length : 0,
    nejhorsi: dojelo.length ? Math.max(...dojelo) : 0,
    nedojelo: dnu - dojelo.length,
    bezZdrzeni: dojelo.filter((c) => c === zakladni).length,
    cetnosti,
  };
}

/** Pro každou cestu: jak by dopadla simulace, kdyby byla zálohovaná. */
export function porovnejZalohy(uzly: Uzel[], hrany: Hrana[], p: number, seed: number): Simulace[] {
  return hrany.map((_, i) => simuluj(uzly, hrany, p, seed, i));
}

/** Nejlepší záloha = nejméně dní bez dojezdu, při shodě nižší průměr. Shody v rámci 0,05 min se berou jako stejně dobré. */
export function nejlepsiZalohy(sim: Simulace[]): number[] {
  const klic = (s: Simulace) => s.nedojelo * 1000 + s.prumer;
  const nej = Math.min(...sim.map(klic));
  return sim.map((s, i) => (klic(s) - nej < 0.05 ? i : -1)).filter((i) => i >= 0);
}

export const FAZE_H6 = [
  { id: "zadani", nazev: "Zadání", minut: 5 },
  { id: "pokus", nazev: "Vlastní pokus", minut: 7 },
  { id: "dijkstra", nazev: "Dijkstra krok za krokem", minut: 8 },
  { id: "simulace", nazev: "Simulace výpadků", minut: 10 },
  { id: "interpretace", nazev: "Co z toho plyne", minut: 10 },
  { id: "reflexe", nazev: "Vyhodnocení", minut: 5 },
];

export const vychoziH6 = () => ({
  cesta: [0] as number[],
  krok: 0,
  tipy: [] as number[],
  p: 10,
  simSeed: 2026,
  zaloha: -1,
  kriticka: -1,
  odpovedBezZdrzeni: "",
  proc: -1,
  nejlepsiZaloha: -1,
  zkontrolovano: false,
  reflexe: "",
  vzor: false,
});

export type DataH6 = ReturnType<typeof vychoziH6>;
