/**
 * Hodina 7: laboratoř efektivity. Dvojice měří dva postupy na stejné úloze
 * a počítá operace, ne sekundy (ty závisí na počítači a zatížení prohlížeče).
 *
 * Co je jedna operace, říká `UlohaLaboratore.operace`. Postupy se opravdu
 * spustí na náhodných datech a operace se počítají cestou. Nad limitem
 * velikosti se už nespouští nic a ukáže se jen odhad podle vzorce.
 */

import { binarniNejvic } from "./vyhledavani";
import { bubblePorovnani, mergeNejvic } from "./razeni";
import { cisloZ, generator, type Nahoda } from "./nahoda";
import { delkaTrasy, pocetTras, vzdalenost, type Misto } from "./trasy";

export type UlohaId = "hledani" | "razeni" | "batoh" | "trasy";

export interface Mereni {
  uloha: UlohaId;
  n: number;
  a: number;
  b: number;
  /** Jen u tras: délky tras v km. */
  delkaA?: number;
  delkaB?: number;
  odhadA: boolean;
  odhadB: boolean;
}

export interface UlohaLaboratore {
  id: UlohaId;
  nazev: string;
  postupA: string;
  postupB: string;
  operace: string;
  velikost: string;
  /** Do kolika ještě postupy opravdu běží. */
  limitA: number;
  limitB: number;
  navrhy: number[];
  max: number;
  odhadA: (n: number) => number;
  odhadB: (n: number) => number;
}

export const ULOHY: UlohaLaboratore[] = [
  {
    id: "hledani",
    nazev: "Vyhledávání v seřazeném skladu",
    postupA: "Lineární vyhledávání",
    postupB: "Binární vyhledávání",
    operace: "jedno porovnání hledaného čísla s číslem v krabici (průměr z 20 hledání)",
    velikost: "počet krabic",
    limitA: 1000000,
    limitB: 1000000,
    navrhy: [10, 100, 1000, 10000, 100000, 1000000],
    max: 1000000000,
    odhadA: (n) => (n + 1) / 2,
    odhadB: (n) => binarniNejvic(n),
  },
  {
    id: "razeni",
    nazev: "Řazení karet",
    postupA: "Bubble Sort",
    postupB: "Merge Sort",
    operace: "jedno porovnání dvou karet",
    velikost: "počet karet",
    limitA: 3000,
    limitB: 200000,
    navrhy: [8, 50, 200, 1000, 3000, 20000],
    max: 10000000,
    odhadA: (n) => bubblePorovnani(n),
    odhadB: (n) => mergeNejvic(n),
  },
  {
    id: "batoh",
    nazev: "Výběr zakázek do kapacity stroje",
    postupA: "Hrubá síla (všechny kombinace)",
    postupB: "Dynamické programování (tabulka)",
    operace: "jedna vyzkoušená kombinace, nebo jedna spočítaná buňka tabulky",
    velikost: "počet zakázek (kapacita = polovina součtu dob)",
    limitA: 18,
    limitB: 60,
    navrhy: [5, 10, 14, 18, 25, 40],
    max: 60,
    odhadA: (n) => 2 ** n,
    // Kapacita roste s počtem zakázek (průměrná doba 5 h, polovina součtu), proto se odhad dělá stejně.
    odhadB: (n) => n * (Math.round((n * 5) / 2) + 1),
  },
  {
    id: "trasy",
    nazev: "Okružní trasa technika",
    postupA: "Hrubá síla (všechny trasy)",
    postupB: "Nejbližší soused + 2-opt",
    operace: "jedna vyzkoušená trasa, nebo jedno porovnání vzdáleností",
    velikost: "počet zákazníků",
    limitA: 8,
    limitB: 150,
    navrhy: [4, 6, 8, 12, 30, 100],
    // Nad 170 zákazníků už se počet tras nevejde do čísla v prohlížeči.
    max: 150,
    odhadA: (n) => pocetTras(n),
    odhadB: (n) => ((n + 1) * n) / 2 + 3 * (((n + 1) * (n - 2)) / 2),
  },
];

export const ulohaPodleId = (id: string) => ULOHY.find((u) => u.id === id) ?? ULOHY[0];

/* ───────────── Postupy s počítadlem ───────────── */

function serazeneCislo(n: number, nahoda: Nahoda): number[] {
  // Rostoucí čísla s náhodnými mezerami: rychle i pro milion.
  const pole = new Array<number>(n);
  let x = 0;
  for (let i = 0; i < n; i++) {
    x += 1 + Math.floor(nahoda() * 5);
    pole[i] = x;
  }
  return pole;
}

export function merHledani(n: number, seed: number): Mereni {
  const nahoda = generator(seed);
  const pole = serazeneCislo(n, nahoda);
  let sumaA = 0;
  let sumaB = 0;
  const pokusu = 20;
  for (let p = 0; p < pokusu; p++) {
    const cil = pole[Math.floor(nahoda() * n)];
    for (let i = 0; i < n; i++) {
      sumaA++;
      if (pole[i] === cil) break;
    }
    let od = 0;
    let po = n - 1;
    while (od <= po) {
      const s = Math.floor((od + po) / 2);
      sumaB++;
      if (pole[s] === cil) break;
      if (cil < pole[s]) po = s - 1;
      else od = s + 1;
    }
  }
  return { uloha: "hledani", n, a: sumaA / pokusu, b: sumaB / pokusu, odhadA: false, odhadB: false };
}

function nahodnaKarty(n: number, nahoda: Nahoda): number[] {
  return Array.from({ length: n }, () => Math.floor(nahoda() * 1000000));
}

export function bubblePocitej(vstup: number[]): number {
  const pole = vstup.slice();
  let porovnani = 0;
  for (let p = 0; p < pole.length - 1; p++) {
    for (let i = 0; i < pole.length - 1 - p; i++) {
      porovnani++;
      if (pole[i] > pole[i + 1]) {
        const t = pole[i];
        pole[i] = pole[i + 1];
        pole[i + 1] = t;
      }
    }
  }
  return porovnani;
}

export function mergePocitej(vstup: number[]): number {
  let porovnani = 0;
  const rad = (pole: number[]): number[] => {
    if (pole.length <= 1) return pole;
    const pul = Math.floor(pole.length / 2);
    const l = rad(pole.slice(0, pul));
    const r = rad(pole.slice(pul));
    const v: number[] = [];
    let i = 0;
    let j = 0;
    while (i < l.length && j < r.length) {
      porovnani++;
      if (l[i] <= r[j]) v.push(l[i++]);
      else v.push(r[j++]);
    }
    while (i < l.length) v.push(l[i++]);
    while (j < r.length) v.push(r[j++]);
    return v;
  };
  rad(vstup);
  return porovnani;
}

export function merRazeni(n: number, seed: number, u = ULOHY[1]): Mereni {
  const karty = nahodnaKarty(n, generator(seed));
  const odhadA = n > u.limitA;
  const odhadB = n > u.limitB;
  return {
    uloha: "razeni",
    n,
    a: odhadA ? u.odhadA(n) : bubblePocitej(karty),
    b: odhadB ? u.odhadB(n) : mergePocitej(karty),
    odhadA,
    odhadB,
  };
}

export interface ZakazkaLab {
  doba: number;
  prinos: number;
}

export function nahodneZakazky(n: number, nahoda: Nahoda): { zakazky: ZakazkaLab[]; kapacita: number } {
  const zakazky = Array.from({ length: n }, () => ({ doba: cisloZ(nahoda, 1, 9), prinos: cisloZ(nahoda, 3, 40) }));
  const kapacita = Math.round(zakazky.reduce((s, z) => s + z.doba, 0) / 2);
  return { zakazky, kapacita };
}

/** Hrubá síla: vyzkouší všech 2^n kombinací. Vrací nejlepší přínos a počet kombinací. */
export function batohHrubaSila(zakazky: ZakazkaLab[], kapacita: number): { prinos: number; operaci: number } {
  const n = zakazky.length;
  let nejlepsi = 0;
  let operaci = 0;
  for (let maska = 0; maska < 2 ** n; maska++) {
    operaci++;
    let doba = 0;
    let prinos = 0;
    for (let i = 0; i < n; i++) {
      if (maska & (1 << i)) {
        doba += zakazky[i].doba;
        prinos += zakazky[i].prinos;
      }
    }
    if (doba <= kapacita && prinos > nejlepsi) nejlepsi = prinos;
  }
  return { prinos: nejlepsi, operaci };
}

/** Tabulka dynamického programování: n × (kapacita + 1) buněk. */
export function batohTabulka(zakazky: ZakazkaLab[], kapacita: number): { prinos: number; operaci: number } {
  let radek = Array(kapacita + 1).fill(0);
  let operaci = 0;
  for (const z of zakazky) {
    const novy = radek.slice();
    for (let h = 0; h <= kapacita; h++) {
      operaci++;
      if (z.doba <= h) novy[h] = Math.max(radek[h], z.prinos + radek[h - z.doba]);
    }
    radek = novy;
  }
  return { prinos: radek[kapacita], operaci };
}

export function merBatoh(n: number, seed: number, u = ULOHY[2]): Mereni & { stejne: boolean } {
  const { zakazky, kapacita } = nahodneZakazky(n, generator(seed));
  const odhadA = n > u.limitA;
  const dp = batohTabulka(zakazky, kapacita);
  const hs = odhadA ? null : batohHrubaSila(zakazky, kapacita);
  return {
    uloha: "batoh",
    n,
    a: hs ? hs.operaci : 2 ** n,
    b: dp.operaci,
    odhadA,
    odhadB: false,
    stejne: hs ? hs.prinos === dp.prinos : true,
  };
}

function nahodnaMista(n: number, nahoda: Nahoda): Misto[] {
  return [{ nazev: "Dílna", x: 50, y: 50 }, ...Array.from({ length: n }, (_, i) => ({ nazev: String(i + 1), x: nahoda() * 100, y: nahoda() * 100 }))];
}

/** Nejbližší soused a pak 2-opt (první zlepšení), s počítáním porovnání vzdáleností. */
export function heuristikaPocitej(mista: Misto[]): { delka: number; operaci: number } {
  let operaci = 0;
  const n = mista.length;
  const trasa = [0];
  const zbyva = new Set(mista.map((_, i) => i).slice(1));
  while (zbyva.size) {
    const z = trasa[trasa.length - 1];
    let nej = -1;
    let nejD = Infinity;
    for (const v of zbyva) {
      operaci++;
      const d = vzdalenost(mista[z], mista[v]);
      if (d < nejD) {
        nejD = d;
        nej = v;
      }
    }
    trasa.push(nej);
    zbyva.delete(nej);
  }
  let zlepseno = true;
  let kol = 0;
  while (zlepseno && kol < 50) {
    zlepseno = false;
    kol++;
    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 2; k < n; k++) {
        if (i === 0 && k === n - 1) continue;
        operaci++;
        const a = mista[trasa[i]];
        const b = mista[trasa[i + 1]];
        const c = mista[trasa[k]];
        const d = mista[trasa[(k + 1) % n]];
        if (vzdalenost(a, c) + vzdalenost(b, d) < vzdalenost(a, b) + vzdalenost(c, d) - 1e-9) {
          const usek = trasa.slice(i + 1, k + 1).reverse();
          trasa.splice(i + 1, usek.length, ...usek);
          zlepseno = true;
        }
      }
    }
  }
  return { delka: delkaTrasy(mista, trasa), operaci };
}

export function hrubaSilaTras(mista: Misto[]): { delka: number; operaci: number } {
  const zbytek = mista.map((_, i) => i).slice(1);
  let nej = Infinity;
  let operaci = 0;
  const perm = (hotovo: number[], zbyva: number[]) => {
    if (!zbyva.length) {
      if (hotovo.length > 1 && hotovo[0] > hotovo[hotovo.length - 1]) return;
      operaci++;
      const d = delkaTrasy(mista, [0, ...hotovo]);
      if (d < nej) nej = d;
      return;
    }
    for (let i = 0; i < zbyva.length; i++) perm([...hotovo, zbyva[i]], [...zbyva.slice(0, i), ...zbyva.slice(i + 1)]);
  };
  perm([], zbytek);
  return { delka: nej, operaci };
}

export function merTrasy(n: number, seed: number, u = ULOHY[3]): Mereni {
  const mista = nahodnaMista(n, generator(seed));
  const odhadA = n > u.limitA;
  const hs = odhadA ? null : hrubaSilaTras(mista);
  const he = heuristikaPocitej(mista);
  return {
    uloha: "trasy",
    n,
    a: hs ? hs.operaci : pocetTras(n),
    b: he.operaci,
    delkaA: hs ? hs.delka : undefined,
    delkaB: he.delka,
    odhadA,
    odhadB: false,
  };
}

export function mer(uloha: UlohaId, n: number, seed: number): Mereni {
  const u = ulohaPodleId(uloha);
  const m = Math.max(1, Math.min(u.max, Math.round(n)));
  if (uloha === "hledani") {
    if (m > u.limitA) return { uloha, n: m, a: u.odhadA(m), b: u.odhadB(m), odhadA: true, odhadB: true };
    return merHledani(m, seed);
  }
  if (uloha === "razeni") return merRazeni(m, seed, u);
  if (uloha === "batoh") return merBatoh(m, seed, u);
  return merTrasy(m, seed, u);
}

const HORNI_INDEX = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** Čísla česky, velká se zkrátí („1,1 bil.“), obří zapíše mocninou deseti („1,3 · 10²³“). */
export function cislo(n: number): string {
  if (!Number.isFinite(n)) return "víc než 10³⁰⁸";
  if (n >= 1e15) {
    let e = Math.floor(Math.log10(n));
    let m = Math.round((n / 10 ** e) * 10) / 10;
    if (m >= 10) {
      m /= 10;
      e++;
    }
    const mocnina = `10${String(e).replace(/\d/g, (c) => HORNI_INDEX[Number(c)])}`;
    return m === 1 ? mocnina : `${m.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} · ${mocnina}`;
  }
  if (n >= 1e12) return `${(n / 1e12).toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} bil.`;
  if (n >= 1e9) return `${(n / 1e9).toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} mld.`;
  if (n >= 1e7) return `${(n / 1e6).toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} mil.`;
  return n.toLocaleString("cs-CZ", { maximumFractionDigits: 1 });
}

/* ───────────── Výzva: odhad ───────────── */

export const OTAZKY_ODHADU = [
  { text: "Kolik porovnání udělá Bubble Sort pro 10 000 karet?", spravne: bubblePorovnani(10000) },
  { text: "Kolik porovnání udělá Merge Sort pro 10 000 karet nejvýš?", spravne: mergeNejvic(10000) },
  { text: "Kolik kombinací vyzkouší hrubá síla u 40 zakázek?", spravne: 2 ** 40 },
  { text: "Kolik porovnání udělá binární vyhledávání v miliardě krabic nejvýš?", spravne: binarniNejvic(1e9) },
];

/** Odhad je v pořádku, když se od správné hodnoty liší nejvýš o 20 %. */
export const odhadSedi = (odpoved: number, spravne: number) => odpoved > 0 && Math.abs(odpoved - spravne) <= 0.2 * spravne;

/** „1,2 mil.“, „1 200 000“, „1.2e6“, „2^40“ i „10^12“ – žák zapisuje velká čísla různě. */
export function cisloZOdhadu(text: string): number {
  const t = text.replace(/\s/g, "").replace(/,/g, ".").toLowerCase();
  const mocnina = /^(\d+(?:\.\d+)?)\^(\d+)$/.exec(t);
  if (mocnina) return Number(mocnina[1]) ** Number(mocnina[2]);
  const nasobky: [RegExp, number][] = [
    [/(bilion|bil)[^\d]*$/, 1e12],
    [/(miliard|mld)[^\d]*$/, 1e9],
    [/(milion|mil)[^\d]*$/, 1e6],
    [/(tisíc|tis)[^\d]*$/, 1e3],
  ];
  for (const [re, kolik] of nasobky) {
    if (re.test(t)) {
      const n = Number(t.replace(re, ""));
      return Number.isFinite(n) ? n * kolik : NaN;
    }
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export const FAZE_H7 = [
  { id: "problem", nazev: "Zadání", minut: 5 },
  { id: "pokus", nazev: "Hypotéza", minut: 5 },
  { id: "experiment", nazev: "Měření", minut: 20 },
  { id: "vyzva", nazev: "Odhad", minut: 10 },
  { id: "reflexe", nazev: "Závěr", minut: 5 },
];

export const vychoziH7 = () => ({
  uloha: "razeni",
  hypoteza: -1,
  hypotezaText: "",
  /** Měření po osmicích: úloha, n, a, b, délka A, délka B, odhad A, odhad B. */
  mereni: [] as number[],
  seed: 1,
  odhady: ["", "", "", ""],
  zkontrolovano: false,
  zaver: "",
  vzor: false,
});

export type DataH7 = ReturnType<typeof vychoziH7>;

const ID_ULOH: UlohaId[] = ["hledani", "razeni", "batoh", "trasy"];

export function mereniDoCisel(m: Mereni): number[] {
  return [ID_ULOH.indexOf(m.uloha), m.n, m.a, m.b, m.delkaA ?? -1, m.delkaB ?? -1, m.odhadA ? 1 : 0, m.odhadB ? 1 : 0];
}

export function mereniZCisel(c: number[]): Mereni[] {
  const v: Mereni[] = [];
  for (let i = 0; i + 7 < c.length; i += 8) {
    const uloha = ID_ULOH[c[i]];
    if (!uloha) continue;
    v.push({
      uloha,
      n: c[i + 1],
      a: c[i + 2],
      b: c[i + 3],
      delkaA: c[i + 4] >= 0 ? c[i + 4] : undefined,
      delkaB: c[i + 5] >= 0 ? c[i + 5] : undefined,
      odhadA: c[i + 6] === 1,
      odhadB: c[i + 7] === 1,
    });
  }
  return v;
}
