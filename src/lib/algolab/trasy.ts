/**
 * Hodina 5: heuristiky u okružní trasy (servisní technik objíždí zákazníky
 * a vrací se do dílny). Vzdálenost je vzdušnou čarou v km.
 *
 * Nejbližší soused: z místa, kde technik je, jede k nejbližšímu dosud
 * nenavštívenému. 2-opt: vezme dvě hrany trasy, rozpojí je a úsek mezi nimi
 * projede obráceně. Když se tím trasa zkrátí, změnu nechá. Tady se v každém
 * kroku bere změna, která zkrátí nejvíc.
 */

import { cisloZ, generator, zamichej } from "./nahoda";

export interface Misto {
  nazev: string;
  x: number;
  y: number;
}

/**
 * Dílna a sedm zákazníků. Nejbližší soused tu ujede 313,6 km, nejkratší trasa
 * má 253,6 km a 2-opt se k ní dostane ve dvou krocích (ověřuje test).
 */
export const MISTA: Misto[] = [
  { nazev: "Dílna", x: 50, y: 50 },
  { nazev: "Pila", x: 72, y: 8 },
  { nazev: "Lakovna", x: 70, y: 62 },
  { nazev: "Slévárna", x: 27, y: 27 },
  { nazev: "Mlýn", x: 59, y: 38 },
  { nazev: "Tiskárna", x: 57, y: 81 },
  { nazev: "Kotelna", x: 88, y: 81 },
  { nazev: "Mlékárna", x: 30, y: 76 },
];

export const vzdalenost = (a: Misto, b: Misto) => Math.hypot(a.x - b.x, a.y - b.y);

/** Délka okružní trasy (poslední místo se vrací na první). */
export function delkaTrasy(mista: Misto[], trasa: number[]): number {
  let soucet = 0;
  for (let i = 0; i < trasa.length; i++) soucet += vzdalenost(mista[trasa[i]], mista[trasa[(i + 1) % trasa.length]]);
  return soucet;
}

export const km = (d: number) => d.toLocaleString("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export interface KrokSouseda {
  z: number;
  /** Vzdálenosti ke všem dosud nenavštíveným. */
  kandidati: { misto: number; d: number }[];
  vybrane: number;
}

export function nejblizsiSoused(mista: Misto[], start = 0): { trasa: number[]; kroky: KrokSouseda[] } {
  const trasa = [start];
  const kroky: KrokSouseda[] = [];
  const zbyva = new Set(mista.map((_, i) => i).filter((i) => i !== start));
  while (zbyva.size) {
    const z = trasa[trasa.length - 1];
    const kandidati = Array.from(zbyva)
      .map((misto) => ({ misto, d: vzdalenost(mista[z], mista[misto]) }))
      .sort((a, b) => a.d - b.d || a.misto - b.misto);
    const vybrane = kandidati[0].misto;
    kroky.push({ z, kandidati, vybrane });
    trasa.push(vybrane);
    zbyva.delete(vybrane);
  }
  return { trasa, kroky };
}

/** Hrana trasy číslo i vede z trasa[i] do trasa[i + 1] (poslední zpět na start). */
export const hrana = (trasa: number[], i: number): [number, number] => [trasa[i], trasa[(i + 1) % trasa.length]];

function orientace(p: Misto, q: Misto, r: Misto) {
  return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
}

/** Kříží se dvě úsečky (bez společného konce)? */
export function krizi(a: Misto, b: Misto, c: Misto, d: Misto): boolean {
  return orientace(a, b, c) * orientace(a, b, d) < 0 && orientace(c, d, a) * orientace(c, d, b) < 0;
}

/** Dvojice hran, které se kříží (indexy hran, menší první). */
export function krizeni(mista: Misto[], trasa: number[]): [number, number][] {
  const n = trasa.length;
  const vysledek: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    for (let k = i + 2; k < n; k++) {
      if (i === 0 && k === n - 1) continue;
      const [a, b] = hrana(trasa, i);
      const [c, d] = hrana(trasa, k);
      if (krizi(mista[a], mista[b], mista[c], mista[d])) vysledek.push([i, k]);
    }
  }
  return vysledek;
}

/** Výměna hran i a k (i < k): úsek trasa[i+1..k] se projede obráceně. */
export function vymen(trasa: number[], i: number, k: number): number[] {
  return [...trasa.slice(0, i + 1), ...trasa.slice(i + 1, k + 1).reverse(), ...trasa.slice(k + 1)];
}

export interface Krok2opt {
  i: number;
  k: number;
  pred: number[];
  po: number[];
  usetri: number;
}

/** 2-opt s nejlepší změnou v každém kroku, dokud se trasa zkracuje. */
export function dvaOpt(mista: Misto[], trasa: number[], limit = 200): Krok2opt[] {
  const kroky: Krok2opt[] = [];
  let aktualni = trasa.slice();
  for (let krok = 0; krok < limit; krok++) {
    const n = aktualni.length;
    let nejlepsi: Krok2opt | null = null;
    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 2; k < n; k++) {
        if (i === 0 && k === n - 1) continue;
        const [a, b] = hrana(aktualni, i);
        const [c, d] = hrana(aktualni, k);
        const usetri =
          vzdalenost(mista[a], mista[b]) + vzdalenost(mista[c], mista[d]) - vzdalenost(mista[a], mista[c]) - vzdalenost(mista[b], mista[d]);
        if (usetri > 1e-9 && (!nejlepsi || usetri > nejlepsi.usetri)) {
          nejlepsi = { i, k, pred: aktualni, po: vymen(aktualni, i, k), usetri };
        }
      }
    }
    if (!nejlepsi) break;
    kroky.push(nejlepsi);
    aktualni = nejlepsi.po;
  }
  return kroky;
}

/** Nejkratší trasa hrubou silou (pro n ≤ 10). Směr jízdy se nepočítá dvakrát. */
export function nejkratsiTrasa(mista: Misto[]): { trasa: number[]; delka: number; zkouseno: number } {
  const zbytek = mista.map((_, i) => i).slice(1);
  let nejlepsi = { trasa: [0, ...zbytek], delka: Infinity };
  let zkouseno = 0;
  const permutuj = (hotovo: number[], zbyva: number[]) => {
    if (!zbyva.length) {
      if (hotovo[0] > hotovo[hotovo.length - 1]) return; // stejná trasa opačným směrem
      zkouseno++;
      const t = [0, ...hotovo];
      const d = delkaTrasy(mista, t);
      if (d < nejlepsi.delka - 1e-9) nejlepsi = { trasa: t, delka: d };
      return;
    }
    for (let i = 0; i < zbyva.length; i++) permutuj([...hotovo, zbyva[i]], [...zbyva.slice(0, i), ...zbyva.slice(i + 1)]);
  };
  permutuj([], zbytek);
  return { ...nejlepsi, zkouseno };
}

/** Různých okružních tras pro dílnu a k zákazníků (směr nerozlišujeme): k!/2. */
export function pocetTras(k: number): number {
  if (k < 2) return 1;
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return f / 2;
}

/* ───────────── Výzva ───────────── */

export interface VyzvaTras {
  seed: number;
  mista: Misto[];
  soused: number[];
  /** Křížení na trase souseda, která se dají rozplést. */
  krizeni: [number, number][];
  zakazniku: number;
  tras: number;
}

const JMENA = ["Pila", "Lakovna", "Mlýn", "Kotelna", "Tiskárna", "Mlékárna", "Slévárna", "Pekárna", "Sklárna", "Cihelna"];

function hledejVyzvu(seed: number): VyzvaTras | null {
  const nahoda = generator(seed);
  for (let pokus = 0; pokus < 4000; pokus++) {
    const jmena = zamichej(JMENA, nahoda);
    const mista: Misto[] = [{ nazev: "Dílna", x: 50, y: 50 }];
    for (let i = 0; i < 5; i++) mista.push({ nazev: jmena[i], x: cisloZ(nahoda, 6, 94), y: cisloZ(nahoda, 8, 92) });
    let blizko = false;
    for (let i = 0; i < mista.length; i++) for (let j = i + 1; j < mista.length; j++) if (vzdalenost(mista[i], mista[j]) < 15) blizko = true;
    if (blizko) continue;
    const { trasa, kroky } = nejblizsiSoused(mista);
    // Bez těsných shod, jinak by „nejbližší“ nešlo od oka poznat.
    if (kroky.some((k) => k.kandidati.length > 1 && k.kandidati[1].d - k.kandidati[0].d < 3)) continue;
    const kriz = krizeni(mista, trasa);
    if (!kriz.length) continue;
    const zakazniku = cisloZ(nahoda, 6, 9);
    return { seed, mista, soused: trasa, krizeni: kriz, zakazniku, tras: pocetTras(zakazniku) };
  }
  return null;
}

export function vyzvaTras(seed: number): VyzvaTras {
  return hledejVyzvu(seed >>> 0) ?? hledejVyzvu(1)!;
}

/* ───────────── Data hodiny ───────────── */

export const vychoziH5 = () => ({
  trasa: [] as number[],
  tipSoused: -1,
  cast: "soused",
  krokSoused: 0,
  krok2opt: 0,
  tipOpt: -1,
  seed: -1,
  vyzvaSoused: [] as number[],
  vyzvaHrany: [] as number[],
  /** Otázka 2 výzvy zůstane odemčená, dokud žák nezmění pořadí v otázce 1. */
  vyzvaOdemceno: false,
  odpovedTras: "",
  zkontrolovano: false,
  reflexe: "",
  vzor: false,
});

export type DataH5 = ReturnType<typeof vychoziH5>;
