/**
 * Hodina 8: závěrečné ověření, jediný známkovaný výstup bloku.
 *
 * Varianta vzniká deterministicky ze jména žáka, id zadání od učitele a verze
 * generátoru. Učitel ji v přehledu vytvoří znovu a body spočítá sám, žák je
 * během práce nevidí.
 *
 * POZOR: `VERZE_GENERATORU` a všechno, co varianta používá (tady i ve
 * `vyzva.ts`, `vyhledavani.ts`, `razeni.ts`, `trasy.ts`), mění správné
 * odpovědi už odevzdaných prací. Oprava generátoru = nová verze a stará cesta
 * zůstane. Hlídá to `zaverecne.zmrazene.test.ts`.
 *
 * Kód ALGZ1- je podepsaný a zamíchaný (`obal.ts`), upravený se nenačte. Id
 * zadání vzniká z hesla vyučujícího (`zadaniZHesla`) a přehled bez hesla
 * odpovědi nevyhodnotí, takže žák nezjistí, co má správně. Bez serveru ale
 * nejde ověřit totožnost a kdo čte kód stránky, ochranu obejde. Je to nástroj
 * pro běžné školní hodnocení, ne pro zabezpečenou zkoušku.
 */

import { normalizujJmeno } from "@/lib/dbb/kodPostupu";
import { binarniNejvic } from "./vyhledavani";
import { bubblePorovnani, urovniDeleni } from "./razeni";
import { pocetTras } from "./trasy";
import { vygenerujVyzvu, type Vyzva } from "./vyzva";
import { cisloZ, generator, seedZTextu, zamichej } from "./nahoda";
import { noveHeslo, rozbal, zabal, zadaniZHesla } from "./obal";

export const VERZE_GENERATORU = 1;
export const PREDPONA_ZAVERECNE = "ALGZ1-";
export const MAX_ODPOVEDI = 600;

export const STRATEGIE = [
  "Lineární vyhledávání",
  "Binární vyhledávání",
  "Rozděl a panuj (Merge Sort)",
  "Dynamické programování",
  "Heuristika (nejbližší soused, 2-opt)",
  "Dijkstrův algoritmus",
];

/** Situace pro část 1. `s` = index správné strategie. */
const SITUACE: { text: string; s: number }[] = [
  { text: "Ceník 50 000 dílů je seřazený podle čísla dílu. Během dne v něm hledáš stovky různých čísel.", s: 1 },
  { text: "V seřazeném seznamu 10 000 zaměstnanců (podle příjmení) hledáš kolegu.", s: 1 },
  { text: "Jednou potřebuješ zjistit, jestli je v neseřazeném seznamu 300 zakázek číslo 4711.", s: 0 },
  { text: "Na štítku stroje hledáš jednou sériové číslo mezi 80 neseřazenými záznamy servisu.", s: 0 },
  { text: "Měřicí stanice uložila 200 000 naměřených hodnot a ty je potřebuješ seřadit od nejmenší.", s: 2 },
  { text: "Archiv má milion záznamů o výrobě, které je třeba seřadit podle data.", s: 2 },
  { text: "Stroj má 40 volných hodin a čeká 25 zakázek. Každá se udělá celá, nebo vůbec. Chceš jistě nejvyšší přínos.", s: 3 },
  { text: "Robot jede mřížkou skladu jen vpravo a dolů, každé pole stojí jiný čas. Chceš jistě nejrychlejší cestu.", s: 3 },
  { text: "Technik má objet 60 zákazníků a vrátit se. Stačí rychle dobrá trasa, nejkratší možná není nutná.", s: 4 },
  { text: "Rozvoz má 500 zastávek a trasa musí být hotová do minuty. Jistě nejkratší trasu by počítač za tu dobu nenašel.", s: 4 },
  { text: "V síti cest mezi halami (u každé cesty minuty jízdy) hledáš nejrychlejší cestu ze skladu do montáže.", s: 5 },
  { text: "Navigace hledá nejrychlejší cestu městem, kde každá ulice má jinou dobu průjezdu.", s: 5 },
];

/**
 * Situace, kde jistě správný výsledek dá i jiný postup, než čeká `s`: cestu
 * mřížkou najde jistě i Dijkstrův algoritmus. Uznávají se obě odpovědi.
 * Schválně mimo `SITUACE`, ať se nezmění vygenerované varianty.
 */
const UZNAT_TAKE: Record<string, number[]> = {
  [SITUACE[7].text]: [5],
};

/** Všechny odpovědi, které se u situace uznají. První je ta, kterou lekce učí. */
export const spravneStrategie = (s: { text: string; s: number }): number[] => [s.s, ...(UZNAT_TAKE[s.text] ?? [])];

export interface OtazkaPorovnani {
  text: string;
  spravne: number;
}

export interface Varianta {
  verze: number;
  zadani: string;
  jmeno: string;
  situace: { text: string; s: number }[];
  dp: Vyzva;
  porovnani: OtazkaPorovnani[];
  zduvodneni: string[];
}

/** Úlohy k části 4 (ručně hodnocené): výběr algoritmu, souvislost postupu a výsledku, podmínka. */
const VYBER = [
  "Firma má 25 zakázek a stroj na 40 hodin. Kolega navrhuje brát zakázky od nejvýnosnější. Co navrhneš ty a proč ne jeho postup?",
  "Ve skladu je 100 000 krabic seřazených podle čísla dílu a skladník je prochází jednu po druhé od začátku. Co mu poradíš a proč?",
  "Servisní technik má 80 zákazníků a chce vyzkoušet všechny trasy, aby měl jistě nejkratší. Co mu poradíš a proč?",
];

const PODMINKA = [
  "Napiš jednu podmínku, bez které binární vyhledávání nefunguje, a co se stane, když neplatí.",
  "Napiš jedno omezení heuristiky nejbližší soused a 2-opt a kdy na něm záleží.",
  "Napiš jedno omezení tabulky dynamického programování u batohu (co musí platit pro doby zakázek) a proč.",
];

export function klicVarianty(jmeno: string, zadani: string, verze = VERZE_GENERATORU) {
  return `${normalizujJmeno(jmeno)}|${zadani.trim().toUpperCase()}|${verze}`;
}

export function vytvorVariantu(jmeno: string, zadani: string, verze = VERZE_GENERATORU): Varianta {
  if (verze !== 1) throw new Error(`Neznámá verze generátoru ${verze}`);
  const seed = seedZTextu(klicVarianty(jmeno, zadani, verze));
  const nahoda = generator(seed);

  // Čtyři situace s různými správnými strategiemi.
  const strategie = zamichej([0, 1, 2, 3, 4, 5], nahoda).slice(0, 4);
  const situace = strategie.map((s) => {
    const moznosti = SITUACE.filter((x) => x.s === s);
    return moznosti[cisloZ(nahoda, 0, moznosti.length - 1)];
  });

  const dp = vygenerujVyzvu(Math.floor(nahoda() * 4294967296));

  const nHledani = [500, 1000, 2000, 5000, 20000, 100000][cisloZ(nahoda, 0, 5)];
  const nBubble = cisloZ(nahoda, 10, 40);
  const kTras = cisloZ(nahoda, 5, 8);
  const nBatoh = cisloZ(nahoda, 10, 20);
  const nUrovne = [16, 32, 64, 128, 256, 512, 1024][cisloZ(nahoda, 0, 6)];
  const porovnani: OtazkaPorovnani[] = [
    { text: `Nejvýš kolik kroků potřebuje binární vyhledávání v seřazeném seznamu ${nHledani.toLocaleString("cs-CZ")} položek?`, spravne: binarniNejvic(nHledani) },
    { text: `Kolik porovnání udělá Bubble Sort (bez předčasného konce) pro ${nBubble} karet?`, spravne: bubblePorovnani(nBubble) },
    { text: `Kolik různých okružních tras existuje pro dílnu a ${kTras} zákazníků? Trasa a tatáž trasa opačným směrem se počítají jednou.`, spravne: pocetTras(kTras) },
    { text: `Kolik kombinací vyzkouší hrubá síla u batohu s ${nBatoh} zakázkami (včetně prázdného výběru)?`, spravne: 2 ** nBatoh },
    { text: `Kolik úrovní půlení potřebuje Merge Sort u balíku ${nUrovne} karet, než zbudou jednotlivé karty?`, spravne: urovniDeleni(nUrovne) },
  ];

  const b = dp.bunky[cisloZ(nahoda, 0, 2)];
  const zduvodneni = [
    VYBER[cisloZ(nahoda, 0, VYBER.length - 1)],
    `Vysvětli na tabulce z části 2, jak vznikla hodnota v řádku ${b.zakazka.nazev} a sloupci ${b.sloupec} h a proč lepší výsledek pro tyhle úkoly a hodiny neexistuje.`,
    PODMINKA[cisloZ(nahoda, 0, PODMINKA.length - 1)],
  ];

  return { verze, zadani: zadani.trim().toUpperCase(), jmeno: jmeno.trim(), situace, dp, porovnani, zduvodneni };
}

/* ───────────── Odpovědi a body ───────────── */

export interface OdpovediZaverecne {
  situace: number[];
  bunky: string[];
  vyznam: number;
  kapacita: string;
  porovnani: string[];
  texty: string[];
}

export const prazdneOdpovedi = (): OdpovediZaverecne => ({
  situace: [-1, -1, -1, -1],
  bunky: ["", "", ""],
  vyznam: -1,
  kapacita: "",
  porovnani: ["", "", "", "", ""],
  texty: ["", "", ""],
});

export const BODY = { strategie: 20, dp: 30, porovnani: 25, zduvodneni: 25 };
export const RUBRIKA = [
  { nazev: "Výběr algoritmu", stupne: [0, 5, 10] },
  { nazev: "Souvislost postupu a výsledku", stupne: [0, 5, 10] },
  { nazev: "Podmínka nebo omezení", stupne: [0, 2, 5] },
];

const HORNI_INDEX = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/**
 * Číslo z odpovědi, jak ho žáci opravdu píšou (rada 11. 11. 2026):
 * „131072“, „131 072“, „131.072“, mocnina „2^17“, „2**17“ i „2¹⁷“
 * a zápis s rovnítkem „2^17 = 131072“ (platí výsledek za posledním rovnítkem).
 * Faktoriál ani jiný výpočet se nevyhodnocuje, pokyn říká ho dopočítat.
 */
export const cisloOdpovedi = (t: string) => {
  const casti = t.replace(/\s/g, "").split("=").filter((c) => c !== "");
  if (!casti.length) return NaN;
  let s = casti[casti.length - 1].replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (h) => `^${[...h].map((c) => HORNI_INDEX.indexOf(c)).join("")}`);
  const mocnina = /^(\d+)(?:\^|\*\*)(\d+)$/.exec(s);
  if (mocnina) return Number(mocnina[1]) ** Number(mocnina[2]);
  // Tečky po třech číslicích jsou oddělovač tisíců, desetinná je v češtině čárka.
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return Number(s.replace(",", "."));
};

export interface Body {
  strategie: number;
  dp: number;
  porovnani: number;
  automaticky: number;
  /** Po částech pro přehled: co bylo dobře. */
  detail: { situace: boolean[]; bunky: boolean[]; vyznam: boolean; kapacita: boolean; porovnani: boolean[] };
}

export function spoctiBody(v: Varianta, o: OdpovediZaverecne): Body {
  const situace = v.situace.map((s, i) => spravneStrategie(s).includes(o.situace[i]));
  const bunky = v.dp.bunky.map((b, i) => cisloOdpovedi(o.bunky[i] ?? "") === b.hodnota);
  const vyznam = v.dp.vyznam.moznosti[o.vyznam]?.spravne === true;
  const kapacita = cisloOdpovedi(o.kapacita) === v.dp.kapacitaNavic.rozdil;
  const porovnani = v.porovnani.map((q, i) => cisloOdpovedi(o.porovnani[i] ?? "") === q.spravne);
  const strategie = situace.filter(Boolean).length * 5;
  const dp = bunky.filter(Boolean).length * 5 + (vyznam ? 5 : 0) + (kapacita ? 10 : 0);
  const por = porovnani.filter(Boolean).length * 5;
  return { strategie, dp, porovnani: por, automaticky: strategie + dp + por, detail: { situace, bunky, vyznam, kapacita, porovnani } };
}

/* ───────────── Kód pro učitele ───────────── */

export interface Odevzdani {
  verze: number;
  zadani: string;
  jmeno: string;
  /** RRRR-MM-DD */
  datum: string;
  odpovedi: OdpovediZaverecne;
}

export function zakodujOdevzdani(od: Odevzdani): string {
  const o = od.odpovedi;
  const data = {
    v: 1,
    g: od.verze,
    z: od.zadani,
    j: od.jmeno.slice(0, 80),
    d: od.datum,
    s: o.situace,
    b: o.bunky,
    y: o.vyznam,
    k: o.kapacita,
    p: o.porovnani,
    t: o.texty.map((t) => t.slice(0, MAX_ODPOVEDI)),
  };
  return PREDPONA_ZAVERECNE + zabal(JSON.stringify(data), "ALGZ1");
}

const texty = (x: unknown, n: number, max = 40): string[] | null =>
  Array.isArray(x) && x.length === n && x.every((t) => typeof t === "string" && t.length <= max) ? (x as string[]) : null;

export function dekodujOdevzdani(kod: string): Odevzdani | null {
  const m = /ALGZ1-([A-Za-z0-9_-]+)/.exec(kod);
  if (!m || m[1].length > 12000) return null;
  try {
    const text = rozbal(m[1], "ALGZ1");
    if (text === null) return null;
    const d = JSON.parse(text) as Record<string, unknown>;
    if (!d || d.v !== 1 || d.g !== 1 || typeof d.z !== "string" || typeof d.j !== "string" || typeof d.d !== "string") return null;
    if (!/^[A-Z0-9]{3,12}$/.test(d.z) || d.j.trim().length < 2 || d.j.length > 80 || !/^\d{4}-\d{2}-\d{2}$/.test(d.d)) return null;
    const s = d.s;
    if (!Array.isArray(s) || s.length !== 4 || !s.every((x) => Number.isInteger(x) && x >= -1 && x < STRATEGIE.length)) return null;
    const b = texty(d.b, 3);
    const p = texty(d.p, 5);
    const t = texty(d.t, 3, MAX_ODPOVEDI);
    if (!b || !p || !t || typeof d.k !== "string" || d.k.length > 40) return null;
    if (!Number.isInteger(d.y) || (d.y as number) < -1 || (d.y as number) > 3) return null;
    return {
      verze: d.g,
      zadani: d.z,
      jmeno: d.j.trim(),
      datum: d.d,
      odpovedi: { situace: s as number[], bunky: b, vyznam: d.y as number, kapacita: d.k, porovnani: p, texty: t },
    };
  } catch {
    return null;
  }
}

/**
 * Kódy ve vloženém textu, které se nepodařilo načíst (useknuté, upravené).
 * Vrací jméno ze zprávy před kódem („Jméno: …“), aby vyučující věděl, kdo má
 * poslat zprávu znovu. Bez jména ve zprávě vrátí prázdný řetězec.
 */
export function nenactenaOdevzdani(text: string): string[] {
  const jmena: string[] = [];
  const kody = /ALGZ1-[A-Za-z0-9_-]+/g;
  let odkud = 0;
  for (let m = kody.exec(text); m; m = kody.exec(text)) {
    if (!dekodujOdevzdani(m[0])) {
      const pred = text.slice(odkud, m.index);
      const radky = [...pred.matchAll(/Jméno:[ \t]*([^\r\n]{1,80})/g)];
      jmena.push(radky.length ? radky[radky.length - 1][1].trim() : "");
    }
    odkud = m.index + m[0].length;
  }
  return jmena;
}

/** Všechny kódy ve vloženém textu (zprávy z Teams), každý jednou. */
export function najdiOdevzdani(text: string): Odevzdani[] {
  const kody = text.match(/ALGZ1-[A-Za-z0-9_-]+/g) ?? [];
  const videno = new Set<string>();
  const vysledek: Odevzdani[] = [];
  for (const k of kody) {
    if (videno.has(k)) continue;
    videno.add(k);
    const o = dekodujOdevzdani(k);
    if (o) vysledek.push(o);
  }
  return vysledek;
}

/** Čitelná zpráva pro učitele. Kód na konci je to, podle čeho se boduje. */
export function zpravaProUcitele(v: Varianta, od: Odevzdani): string {
  const o = od.odpovedi;
  const radky = [
    "ALGOLAB – závěrečné ověření",
    `Jméno: ${od.jmeno}`,
    `Zadání: ${od.zadani}`,
    "",
    "Část 1: strategie",
    ...v.situace.map((s, i) => `   ${i + 1}. ${o.situace[i] >= 0 ? STRATEGIE[o.situace[i]] : "bez odpovědi"}`),
    "Část 2: tabulka",
    `   5. buňky: ${v.dp.bunky.map((b, i) => `${b.zakazka.nazev} ${b.sloupec} h = ${o.bunky[i] || "–"}`).join(", ")}`,
    `   6. význam: ${o.vyznam >= 0 ? String.fromCharCode(97 + o.vyznam) : "–"}`,
    `   7. hodina navíc: ${o.kapacita || "–"}`,
    "Část 3: porovnání",
    ...o.porovnani.map((p, i) => `   ${8 + i}. ${p || "–"}`),
    "Část 4: zdůvodnění",
    ...o.texty.map((t, i) => `   ${13 + i}. ${t.trim() || "bez odpovědi"}`),
    "",
    `Kód pro učitele: ${zakodujOdevzdani(od)}`,
  ];
  return radky.join("\n");
}

/** Nové zadání: heslo pro vyučujícího a z něj id pro žáky (6 znaků bez 0/O, 1/I). */
export function noveZadani(): { id: string; heslo: string } {
  const heslo = noveHeslo();
  return { id: zadaniZHesla(heslo), heslo };
}

/** Cvičné zadání: žák vidí body hned, učitel nic nedostává. */
export const CVICNE_ZADANI = "CVICNE";
