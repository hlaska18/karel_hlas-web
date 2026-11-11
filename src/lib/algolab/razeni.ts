/**
 * Hodina 2: Bubble Sort a Merge Sort (rozděl a panuj, rekurze).
 *
 * Bubble Sort je tu v nejjednodušší podobě: n − 1 průchodů, v každém o jedno
 * porovnání méně, bez předčasného konce. Merge Sort dělí balík na polovinu
 * (levá má ⌊n/2⌋ karet), obě poloviny seřadí stejným postupem a pak je slije.
 */

import { cisloZ, generator } from "./nahoda";

/** Průměry hřídelí v mm na kartách z vlastního pokusu a experimentu. */
export const KARTY = [42, 18, 35, 27, 50, 12, 31, 22];

export interface KrokBubble {
  pruchod: number;
  /** Index levé z porovnávaných karet. */
  i: number;
  prohodit: boolean;
  /** Pořadí po kroku. */
  pole: number[];
  /** Od tohoto indexu doprava jsou karty na svém místě (po kroku). */
  hotovoOd: number;
}

export function bubbleKroky(vstup: number[]): KrokBubble[] {
  const pole = vstup.slice();
  const n = pole.length;
  const kroky: KrokBubble[] = [];
  for (let p = 0; p < n - 1; p++) {
    for (let i = 0; i < n - 1 - p; i++) {
      const prohodit = pole[i] > pole[i + 1];
      if (prohodit) [pole[i], pole[i + 1]] = [pole[i + 1], pole[i]];
      const konecPruchodu = i === n - 2 - p;
      kroky.push({ pruchod: p + 1, i, prohodit, pole: pole.slice(), hotovoOd: konecPruchodu ? n - 1 - p : n - p });
    }
  }
  return kroky;
}

/** Porovnání Bubble Sortu v téhle podobě: n(n − 1)/2, nezávisle na datech. */
export const bubblePorovnani = (n: number) => (n * (n - 1)) / 2;

/** Inverze = dvojice karet ve špatném pořadí. Tolik výměn sousedů je potřeba vždycky (a stačí). */
export function inverze(pole: number[]): number {
  let pocet = 0;
  for (let i = 0; i < pole.length; i++) for (let j = i + 1; j < pole.length; j++) if (pole[i] > pole[j]) pocet++;
  return pocet;
}

export interface KrokSlevani {
  /** Odkud se bere: z levé, nebo pravé hromádky. */
  odkud: "L" | "P";
  hodnota: number;
  /** Bylo potřeba porovnávat? Když je jedna hromádka prázdná, zbytek druhé se jen přesune. */
  porovnani: boolean;
}

export interface Slevani {
  hloubka: number;
  levy: number[];
  pravy: number[];
  vysledek: number[];
  kroky: KrokSlevani[];
  porovnani: number;
}

export function slij(levy: number[], pravy: number[], hloubka = 0): Slevani {
  const kroky: KrokSlevani[] = [];
  let i = 0;
  let j = 0;
  while (i < levy.length || j < pravy.length) {
    if (i < levy.length && j < pravy.length) {
      // Při shodě bere levou: řazení zůstane stabilní.
      if (levy[i] <= pravy[j]) kroky.push({ odkud: "L", hodnota: levy[i++], porovnani: true });
      else kroky.push({ odkud: "P", hodnota: pravy[j++], porovnani: true });
    } else if (i < levy.length) kroky.push({ odkud: "L", hodnota: levy[i++], porovnani: false });
    else kroky.push({ odkud: "P", hodnota: pravy[j++], porovnani: false });
  }
  return {
    hloubka,
    levy,
    pravy,
    vysledek: kroky.map((k) => k.hodnota),
    kroky,
    porovnani: kroky.filter((k) => k.porovnani).length,
  };
}

/** Úrovně dělení: [[celý balík], [dvě poloviny], …, [jednotlivé karty]]. */
export function urovneDeleni(pole: number[]): number[][][] {
  const urovne: number[][][] = [[pole.slice()]];
  while (urovne[urovne.length - 1].some((c) => c.length > 1)) {
    const dalsi: number[][] = [];
    for (const cast of urovne[urovne.length - 1]) {
      if (cast.length <= 1) dalsi.push(cast);
      else {
        const pul = Math.floor(cast.length / 2);
        dalsi.push(cast.slice(0, pul), cast.slice(pul));
      }
    }
    urovne.push(dalsi);
  }
  return urovne;
}

/** Všechna slévání v pořadí, jak je udělá rekurze (nejdřív celá levá polovina). */
export function mergeSort(pole: number[]): { serazene: number[]; slevani: Slevani[] } {
  const slevani: Slevani[] = [];
  const rad = (cast: number[], hloubka: number): number[] => {
    if (cast.length <= 1) return cast.slice();
    const pul = Math.floor(cast.length / 2);
    const levy = rad(cast.slice(0, pul), hloubka + 1);
    const pravy = rad(cast.slice(pul), hloubka + 1);
    const s = slij(levy, pravy, hloubka);
    slevani.push(s);
    return s.vysledek;
  };
  return { serazene: rad(pole, 0), slevani };
}

/** Nejvíc porovnání Merge Sortu pro n karet: n⌈log2 n⌉ − 2^⌈log2 n⌉ + 1. */
export function mergeNejvic(n: number): number {
  if (n <= 1) return 0;
  const k = Math.ceil(Math.log2(n));
  return n * k - 2 ** k + 1;
}

/** Kolikrát se balík rozpůlí, než zbudou jednotlivé karty: ⌈log2 n⌉. */
export const urovniDeleni = (n: number) => (n <= 1 ? 0 : Math.ceil(Math.log2(n)));

export const VELIKOSTI_RAZENI = [8, 100, 1000, 10000, 100000, 1000000];

/* ───────────── Výzva ───────────── */

export interface VyzvaRazeni {
  seed: number;
  levy: number[];
  pravy: number[];
  slevani: Slevani;
  bubbleVstup: number[];
  poPrvnimPruchodu: number[];
  n: number;
  urovni: number;
}

function ruzna(nahoda: () => number, pocet: number, od: number, po: number, krome: Set<number> = new Set()): number[] {
  const s = new Set<number>();
  while (s.size < pocet) {
    const c = cisloZ(nahoda, od, po);
    if (!krome.has(c)) s.add(c);
  }
  return Array.from(s);
}

export function vyzvaRazeni(seed: number): VyzvaRazeni {
  const nahoda = generator(seed);
  // Slévání musí mít aspoň jedno „přeskočení“ mezi hromádkami, jinak je to jen opsání.
  let levy: number[] = [];
  let pravy: number[] = [];
  let slevani = slij([], []);
  for (let pokus = 0; pokus < 200; pokus++) {
    const cisla = ruzna(nahoda, 8, 10, 99);
    levy = cisla.slice(0, 4).sort((a, b) => a - b);
    pravy = cisla.slice(4).sort((a, b) => a - b);
    slevani = slij(levy, pravy);
    const prechody = slevani.kroky.filter((k, i) => i > 0 && k.odkud !== slevani.kroky[i - 1].odkud).length;
    if (prechody >= 3 && slevani.porovnani >= 6) break;
  }
  const bubbleVstup = ruzna(nahoda, 6, 10, 99);
  const kroky = bubbleKroky(bubbleVstup);
  const poPrvnimPruchodu = kroky[bubbleVstup.length - 2].pole;
  const n = [16, 32, 64, 128, 256, 1024][cisloZ(nahoda, 0, 5)];
  return { seed, levy, pravy, slevani, bubbleVstup, poPrvnimPruchodu, n, urovni: urovniDeleni(n) };
}

/* ───────────── Data hodiny ───────────── */

export const vychoziH2 = () => ({
  poradi: KARTY.slice(),
  vymen: 0,
  vybrana: -1,
  cast: "bubble",
  krokBubble: 0,
  tipMerge: -1,
  krokMerge: 0,
  seed: -1,
  odpovedPorovnani: "",
  odpovedPruchod: "",
  odpovedUrovne: "",
  zkontrolovano: false,
  reflexe: "",
  vzor: false,
});

export type DataH2 = ReturnType<typeof vychoziH2>;
