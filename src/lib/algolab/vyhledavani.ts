/**
 * Hodina 1: lineární a binární vyhledávání.
 *
 * Porovnání = jedno otevření krabice (podívat se na číslo a rozhodnout).
 * Binární hledání bere prostřední prvek dolů zaokrouhleně: (od + do) div 2.
 */

import { cisloZ, generator, zamichej } from "./nahoda";

/** Výrobní čísla dílů ve skladu, seřazená vzestupně. 31 = 2^5 − 1, binární hledání tu potřebuje nejvýš 5 kroků. */
export const SKLAD = [
  1012, 1034, 1047, 1063, 1088, 1095, 1121, 1136, 1150, 1178, 1185, 1203, 1219, 1240, 1252, 1277, 1291, 1306, 1324, 1339,
  1358, 1372, 1390, 1405, 1427, 1443, 1461, 1480, 1496, 1512, 1538,
];

/** Díl, který žák hledá ve vlastním pokusu (1390, 23. krabice). */
export const POKUS_INDEX = 22;

export type Vysledek = "nalezeno" | "vlevo" | "vpravo";

export interface KrokBinarni {
  od: number;
  do: number;
  stred: number;
  hodnota: number;
  vysledek: Vysledek;
}

/** Kroky binárního hledání. Prázdný úsek (nenalezeno) už krok nedělá. */
export function binarniKroky(pole: number[], cil: number): KrokBinarni[] {
  const kroky: KrokBinarni[] = [];
  let od = 0;
  let po = pole.length - 1;
  while (od <= po) {
    const stred = Math.floor((od + po) / 2);
    const hodnota = pole[stred];
    const vysledek: Vysledek = hodnota === cil ? "nalezeno" : cil < hodnota ? "vlevo" : "vpravo";
    kroky.push({ od, do: po, stred, hodnota, vysledek });
    if (vysledek === "nalezeno") break;
    if (vysledek === "vlevo") po = stred - 1;
    else od = stred + 1;
  }
  return kroky;
}

/** Kolik krabic otevře lineární hledání (od první, dokud nenajde nebo nedojde na konec). */
export function linearniPocet(pole: number[], cil: number): number {
  const i = pole.indexOf(cil);
  return i < 0 ? pole.length : i + 1;
}

/** Nejvíc porovnání binárního hledání v n prvcích: ⌊log2 n⌋ + 1. */
export function binarniNejvic(n: number): number {
  if (n < 1) return 0;
  return Math.floor(Math.log2(n)) + 1;
}

/** Hodnoty pro tabulku „Jak to roste“. */
export const VELIKOSTI_RUSTU = [10, 100, 1000, 10000, 1000000, 1000000000];

/**
 * Neseřazený sklad pro ukázku, že binární hledání potřebuje seřazená data.
 * Pevné pořadí, aby učitel ve třídě ukazoval totéž co žáci.
 */
export const NESERAZENA = [1203, 1047, 1390, 1136, 1512, 1088, 1277, 1012, 1461, 1185, 1324, 1063, 1427, 1240, 1358];

/** Díl, který v neseřazeném skladu je, a binární hledání ho přesto nenajde. */
export function cilNeserazene(): number {
  for (const hodnota of NESERAZENA) {
    const kroky = binarniKroky(NESERAZENA, hodnota);
    if (kroky[kroky.length - 1].vysledek !== "nalezeno") return hodnota;
  }
  return NESERAZENA[0];
}

/* ───────────── Výzva ───────────── */

export interface VyzvaHledani {
  seed: number;
  pole: number[];
  cil: number;
  kroky: KrokBinarni[];
  n: number;
  nejvic: number;
}

const VELIKOSTI_VYZVY = [500, 1000, 2000, 5000, 100000, 1000000];

export function vyzvaHledani(seed: number): VyzvaHledani {
  const nahoda = generator(seed);
  const hodnoty = new Set<number>();
  while (hodnoty.size < 15) hodnoty.add(cisloZ(nahoda, 100, 999));
  const pole = Array.from(hodnoty).sort((a, b) => a - b);
  // Cíl nikdy uprostřed: jeden krok by nebyl k ničemu.
  const indexy = zamichej(
    pole.map((_, i) => i).filter((i) => i !== 7),
    nahoda,
  );
  const cil = pole[indexy[0]];
  const n = VELIKOSTI_VYZVY[cisloZ(nahoda, 0, VELIKOSTI_VYZVY.length - 1)];
  return { seed, pole, cil, kroky: binarniKroky(pole, cil), n, nejvic: binarniNejvic(n) };
}

/** Rozloží text žáka na čísla („1203, 1277; 1291“). */
export function cislaZTextu(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}

/* ───────────── Data hodiny ───────────── */

export const vychoziH1 = () => ({
  otevrene: [] as number[],
  cast: "krokovani",
  cilKrok: 9,
  krok: 0,
  tipKrok: -1,
  tipRust: -1,
  tipNeserazena: -1,
  krokNeserazena: 0,
  seed: -1,
  odpovedKroky: "",
  odpovedNejvic: "",
  odpovedVolba: -1,
  zkontrolovano: false,
  reflexe: "",
  vzor: false,
});

export type DataH1 = ReturnType<typeof vychoziH1>;
