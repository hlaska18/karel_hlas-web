/**
 * Hodina 3: nejlevnější cesta mřížkou (dynamické programování).
 *
 * Vozík jede v hale z levého horního pole do pravého dolního a smí jen vpravo
 * nebo dolů. Číslo v poli = sekundy, které průjezd polem stojí. Buňka tabulky =
 * nejkratší čas ze startu až do tohoto pole včetně.
 */

import { cisloZ, generator, zamichej } from "./nahoda";

export type Mrizka = number[][];

/**
 * Hala 5 × 5. Hladové pravidlo (vždy na levnější sousední pole) se hned na
 * začátku vyhne devítce a skončí na 45 s, nejlepší cesta má 28 s a vede přes ni.
 * V hladových rozhodnutích ani v tabulce není žádná shoda, není co vysvětlovat navíc.
 */
export const HALA: Mrizka = [
  [1, 9, 3, 4, 3],
  [7, 8, 6, 7, 1],
  [7, 6, 4, 9, 1],
  [5, 6, 4, 6, 5],
  [8, 2, 9, 7, 1],
];

export type Pole = [number, number];
export const stejne = (a: Pole, b: Pole) => a[0] === b[0] && a[1] === b[1];

export function spoctiMrizku(g: Mrizka): number[][] {
  const t = g.map((r) => r.map(() => 0));
  for (let r = 0; r < g.length; r++) {
    for (let s = 0; s < g[0].length; s++) {
      if (r === 0 && s === 0) t[r][s] = g[0][0];
      else if (r === 0) t[r][s] = g[r][s] + t[r][s - 1];
      else if (s === 0) t[r][s] = g[r][s] + t[r - 1][s];
      else t[r][s] = g[r][s] + Math.min(t[r - 1][s], t[r][s - 1]);
    }
  }
  return t;
}

export interface KrokMrizky {
  r: number;
  s: number;
  cena: number;
  /** Hotová buňka nad / vlevo (null = mimo halu). */
  nad: number | null;
  vlevo: number | null;
  hodnota: number;
  odkud: "nad" | "vlevo" | null;
}

export function krokyMrizky(g: Mrizka): KrokMrizky[] {
  const t = spoctiMrizku(g);
  const kroky: KrokMrizky[] = [];
  for (let r = 0; r < g.length; r++) {
    for (let s = 0; s < g[0].length; s++) {
      const nad = r > 0 ? t[r - 1][s] : null;
      const vlevo = s > 0 ? t[r][s - 1] : null;
      const odkud = nad === null && vlevo === null ? null : vlevo === null || (nad !== null && nad <= vlevo) ? "nad" : "vlevo";
      kroky.push({ r, s, cena: g[r][s], nad, vlevo, hodnota: t[r][s], odkud });
    }
  }
  return kroky;
}

export function komentarMrizky(k: KrokMrizky): string {
  if (k.odkud === null) return `Start: ${k.cena} s za první pole.`;
  if (k.nad === null) return `Horní řada: sem se dá přijet jen zleva, ${k.vlevo} + ${k.cena} = ${k.hodnota}.`;
  if (k.vlevo === null) return `Levý sloupec: sem se dá přijet jen shora, ${k.nad} + ${k.cena} = ${k.hodnota}.`;
  const mensi = Math.min(k.nad, k.vlevo);
  return `Shora ${k.nad}, zleva ${k.vlevo}. Menší je ${mensi} (${k.odkud === "nad" ? "shora" : "zleva"}), ${mensi} + ${k.cena} = ${k.hodnota}.`;
}

/** Nejlepší cesta odzadu: z cíle vždy do pole, odkud se do něj přijelo levněji. */
export function nejlepsiCesta(g: Mrizka): Pole[] {
  const t = spoctiMrizku(g);
  let r = g.length - 1;
  let s = g[0].length - 1;
  const cesta: Pole[] = [[r, s]];
  while (r > 0 || s > 0) {
    if (r === 0) s--;
    else if (s === 0) r--;
    else if (t[r - 1][s] <= t[r][s - 1]) r--;
    else s--;
    cesta.unshift([r, s]);
  }
  return cesta;
}

/** Hladové pravidlo: na levnější ze dvou sousedních polí (při shodě vpravo). */
export function hladovaCesta(g: Mrizka): Pole[] {
  const R = g.length;
  const S = g[0].length;
  let r = 0;
  let s = 0;
  const cesta: Pole[] = [[0, 0]];
  while (r < R - 1 || s < S - 1) {
    if (r === R - 1) s++;
    else if (s === S - 1) r++;
    else if (g[r][s + 1] <= g[r + 1][s]) s++;
    else r++;
    cesta.push([r, s]);
  }
  return cesta;
}

export const cenaCesty = (g: Mrizka, cesta: Pole[]) => cesta.reduce((soucet, [r, s]) => soucet + g[r][s], 0);

/** Všech cest z rohu do rohu: kombinační číslo (R + S − 2 nad R − 1). */
export function pocetCest(R: number, S: number): number {
  let n = 1;
  const k = Math.min(R - 1, S - 1);
  for (let i = 1; i <= k; i++) n = (n * (R + S - 1 - i)) / i;
  return Math.round(n);
}

/** Je pole sousedem vpravo nebo dole? Jen tak smí vozík jet. */
export const dalsiPole = (z: Pole, na: Pole) =>
  (na[0] === z[0] && na[1] === z[1] + 1) || (na[0] === z[0] + 1 && na[1] === z[1]);

/** Všechny cesty, jen pro kontrolu na malé hale. */
export function vsechnyCesty(g: Mrizka): Pole[][] {
  const R = g.length;
  const S = g[0].length;
  const vysledek: Pole[][] = [];
  const jdi = (cesta: Pole[]) => {
    const [r, s] = cesta[cesta.length - 1];
    if (r === R - 1 && s === S - 1) {
      vysledek.push(cesta);
      return;
    }
    if (s < S - 1) jdi([...cesta, [r, s + 1]]);
    if (r < R - 1) jdi([...cesta, [r + 1, s]]);
  };
  jdi([[0, 0]]);
  return vysledek;
}

/* ───────────── Výzva ───────────── */

export interface VyzvaMrizky {
  seed: number;
  hala: Mrizka;
  tabulka: number[][];
  /** Tři buňky k doplnění: jedna zleva, jedna shora, jedna na okraji. */
  bunky: KrokMrizky[];
  vyznam: { r: number; s: number; moznosti: { text: string; spravne: boolean }[] };
  nejlepsi: number;
  hladova: number;
}

function hledejVyzvu(seed: number): VyzvaMrizky | null {
  const nahoda = generator(seed);
  for (let pokus = 0; pokus < 5000; pokus++) {
    const hala = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => cisloZ(nahoda, 1, 9)));
    const tabulka = spoctiMrizku(hala);
    const ceny = vsechnyCesty(hala).map((c) => cenaCesty(hala, c));
    const nejlepsi = Math.min(...ceny);
    if (ceny.filter((c) => c === nejlepsi).length !== 1) continue;
    const hladova = cenaCesty(hala, hladovaCesta(hala));
    if (hladova - nejlepsi < 3) continue;
    const kroky = krokyMrizky(hala);
    const vnitrni = kroky.filter((k) => k.nad !== null && k.vlevo !== null && k.nad !== k.vlevo);
    const shora = vnitrni.filter((k) => k.odkud === "nad");
    const zleva = vnitrni.filter((k) => k.odkud === "vlevo");
    const okraj = kroky.filter((k) => (k.nad === null) !== (k.vlevo === null) && k.r + k.s >= 2);
    if (!shora.length || !zleva.length || !okraj.length) continue;
    const bunky = [shora, zleva, okraj].map((sk) => sk[Math.floor(nahoda() * sk.length)]);
    // Žádná z buněk nesmí potřebovat jinou skrytou buňku jako souseda.
    const skryte = (r: number, s: number) => bunky.some((b) => b.r === r && b.s === s);
    if (bunky.some((b) => skryte(b.r - 1, b.s) || skryte(b.r, b.s - 1))) continue;
    if (new Set(bunky.map((b) => `${b.r}:${b.s}`)).size !== 3) continue;
    // Buňka pro otázku na význam nesmí být žádná ze skrytých: otázka její číslo vypisuje.
    let r = cisloZ(nahoda, 1, 3);
    let s = cisloZ(nahoda, 1, 3);
    while (skryte(r, s)) {
      r = cisloZ(nahoda, 1, 3);
      s = cisloZ(nahoda, 1, 3);
    }
    return {
      seed,
      hala,
      tabulka,
      bunky,
      nejlepsi,
      hladova,
      vyznam: {
        r,
        s,
        moznosti: zamichej(
          [
            { text: `Nejkratší čas ze startu až do pole v ${r + 1}. řadě a ${s + 1}. sloupci, včetně něj.`, spravne: true },
            { text: `Čas průjezdu samotným polem v ${r + 1}. řadě a ${s + 1}. sloupci.`, spravne: false },
            { text: "Nejkratší čas z tohoto pole do cíle.", spravne: false },
            { text: "Součet všech polí nad tímto polem a vlevo od něj.", spravne: false },
          ],
          nahoda,
        ),
      },
    };
  }
  return null;
}

export function vyzvaMrizky(seed: number): VyzvaMrizky {
  return hledejVyzvu(seed >>> 0) ?? hledejVyzvu(1)!;
}

/* ───────────── Data hodiny ───────────── */

export const vychoziH3 = () => ({
  cesta: [] as number[],
  tipHladova: -1,
  /** Čas cesty, ke které žák tipoval. Tip se hodnotí proti ní, i když cestu potom změní. */
  tipCas: 0,
  cast: "tabulka",
  krok: 0,
  zodpovezene: [] as number[],
  zpet: 0,
  uprava: HALA.map((r) => r.slice()),
  seed: -1,
  bunky: ["", "", ""],
  vyznam: -1,
  hladova: "",
  zkontrolovano: false,
  reflexe: "",
  vzor: false,
});

export type DataH3 = ReturnType<typeof vychoziH3>;
