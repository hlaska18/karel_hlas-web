"use client";

/**
 * Vysvětlení algoritmů obrázkem (Karel 9. 11. 2026: „čím méně textu, tím lépe“).
 * Každý algoritmus má krokovač: obrázek na malém příkladu a pod ním jedna věta.
 *
 * Všechna čísla počítá stejný kód, který běží v hodinách (binarniKroky,
 * bubbleKroky, slij, spoctiMrizku, spoctiTabulku, nejblizsiSoused, dvaOpt,
 * dijkstra, generator). Ručně psaná jsou jen malá zadání příkladů.
 *
 * Věty nesmí prozradit tip ani reflexi (JakFunguje.test.ts): nejbližší soused
 * neukazuje délku trasy, Merge Sort nepočítá porovnání, 2-opt neříká,
 * o kolik trasu zkrátí, Dijkstra a mřížka neříkají, proč postup funguje.
 */

import { useState, type ReactNode } from "react";
import { spoctiTabulku, type Zakazka } from "@/lib/algolab/batoh";
import { cestaDo, dijkstra, type Hrana, type Uzel } from "@/lib/algolab/grafy";
import { nejlepsiCesta, spoctiMrizku } from "@/lib/algolab/mrizka";
import { generator } from "@/lib/algolab/nahoda";
import { bubbleKroky, slij } from "@/lib/algolab/razeni";
import { delkaTrasy, dvaOpt, hrana, km, nejblizsiSoused, pocetTras, type Misto } from "@/lib/algolab/trasy";
import { binarniKroky, linearniPocet } from "@/lib/algolab/vyhledavani";
import { TabulkaDP, hlavni, tlacitko } from "./spolecne";

export interface Snimek {
  veta: string;
  obraz: ReactNode;
}

const ZLUTA = "#e5b73b";
const ZELENA = "#6fe3c2";
const CERVENA = "#ff9d8a";
const HRANA = "#4b6159";
const TEXT = "#e8f3ef";
const TLUMENY = "#a6bdb4";

const cz = (n: number) => n.toLocaleString("cs-CZ");

/** 1 krok, 2–4 kroky, 5 a víc kroků. */
function sklon(n: number, jeden: string, dva: string, pet: string) {
  return `${cz(n)} ${n === 1 ? jeden : n >= 2 && n <= 4 ? dva : pet}`;
}

/* ------------------------------------------------------------------ */
/* Krokovač                                                            */
/* ------------------------------------------------------------------ */

export function Obrazem({ snimky, popis }: { snimky: Snimek[]; popis: string }) {
  const [i, setI] = useState(0);
  const k = Math.min(i, snimky.length - 1);
  const s = snimky[k];
  const posledni = k === snimky.length - 1;
  return (
    <div className="mt-2.5">
      <div
        role="img"
        aria-label={`${popis}: obrázek ${k + 1} z ${snimky.length}`}
        className="overflow-x-auto rounded-lg border border-white/10 bg-[#0b1411] px-3 py-4"
      >
        <div className="mx-auto w-fit min-w-0">{s.obraz}</div>
      </div>
      <p aria-live="polite" className="mt-2.5 min-h-[3.2em] text-[15px] leading-relaxed text-[#e8f3ef]">
        {s.veta}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button type="button" className={tlacitko} disabled={k === 0} onClick={() => setI(k - 1)}>
          ← Zpět
        </button>
        {posledni ? (
          <button type="button" className={tlacitko} onClick={() => setI(0)}>
            Znovu od začátku
          </button>
        ) : (
          <button type="button" className={hlavni} onClick={() => setI(k + 1)}>
            Další →
          </button>
        )}
        <span className="text-[13px] tabular-nums text-[#a6bdb4]">
          {k + 1} / {snimky.length}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stavební díly obrázků                                               */
/* ------------------------------------------------------------------ */

type StavPolozky = "zakladni" | "aktivni" | "pryc" | "hotovo";

const TRIDA_POLOZKY: Record<StavPolozky, string> = {
  zakladni: "border-white/25 bg-[#18332b] text-[#e8f3ef]",
  aktivni: "border-[#e5b73b] bg-[#e5b73b] text-[#1a1405]",
  pryc: "border-dashed border-white/[.12] bg-transparent text-[#5d7069]",
  hotovo: "border-[#6fe3c2] bg-[#6fe3c2] text-[#06201a]",
};

interface Polozka {
  h: ReactNode;
  s: StavPolozky;
  pod?: string;
}

function Rada({ polozky }: { polozky: Polozka[] }) {
  const sPopisky = polozky.some((p) => p.pod !== undefined);
  return (
    <div className="flex gap-2">
      {polozky.map((p, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-[19px] font-semibold tabular-nums transition-colors motion-reduce:transition-none ${TRIDA_POLOZKY[p.s]}`}
          >
            {p.h}
          </div>
          {sPopisky && <div className="h-4 whitespace-nowrap text-[12px] text-[#a6bdb4]">{p.pod ?? ""}</div>}
        </div>
      ))}
    </div>
  );
}

function Hromadky({ skupiny, sipka }: { skupiny: Polozka[][]; sipka?: number }) {
  return (
    <div className="flex items-center gap-6">
      {skupiny.map((g, i) => (
        <div key={i} className="flex items-center gap-6">
          {sipka === i && <span className="text-[22px] text-[#a6bdb4]">→</span>}
          {g.length ? <Rada polozky={g} /> : <div className="h-12 w-12 rounded-lg border-2 border-dashed border-white/10" />}
        </div>
      ))}
    </div>
  );
}

function Legenda({ polozky }: { polozky: [string, string][] }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-[#a6bdb4]">
      {polozky.map(([barva, text]) => (
        <span key={text} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: barva }} />
          {text}
        </span>
      ))}
    </div>
  );
}

type StavHrany = "zakladni" | "aktivni" | "cesta" | "zavrena" | "navrh" | "zrusena";
type StavUzlu = "zakladni" | "aktivni" | "hotovo";

interface GUzel {
  x: number;
  y: number;
  nazev: string;
  /** Popisek pod uzlem (true = nad uzlem). */
  nahore?: boolean;
}

interface GHrana {
  a: number;
  b: number;
  popisek?: string;
  stav?: StavHrany;
}

const STYL_HRANY: Record<StavHrany, { barva: string; sirka: number; carky?: string }> = {
  zakladni: { barva: HRANA, sirka: 2 },
  aktivni: { barva: ZLUTA, sirka: 4 },
  cesta: { barva: ZELENA, sirka: 4 },
  zavrena: { barva: CERVENA, sirka: 2, carky: "7 6" },
  navrh: { barva: ZLUTA, sirka: 1.5, carky: "5 5" },
  zrusena: { barva: CERVENA, sirka: 1.5, carky: "3 6" },
};

function Graf({
  uzly,
  hrany,
  sirka,
  vyska,
  stavUzlu,
  popisUzlu,
  maly,
}: {
  uzly: GUzel[];
  hrany: GHrana[];
  sirka: number;
  vyska: number;
  stavUzlu?: (i: number) => StavUzlu;
  popisUzlu?: (i: number) => { text: string; jisty?: boolean } | null;
  /** Malá mapa bez názvů (hrubá síla u trasy). */
  maly?: boolean;
}) {
  const r = (u: GUzel) => (maly ? 7 : u.nazev.length > 2 ? 30 : 22);
  return (
    <svg viewBox={`0 0 ${sirka} ${vyska}`} width={sirka} height={vyska} className="block h-auto max-w-full" aria-hidden="true">
      {hrany.map((h, i) => {
        const a = uzly[h.a];
        const b = uzly[h.b];
        const st = STYL_HRANY[h.stav ?? "zakladni"];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={st.barva} strokeWidth={st.sirka} strokeDasharray={st.carky} strokeLinecap="round" />
            {h.popisek && (
              <>
                <rect x={mx - 4 - h.popisek.length * 4} y={my - 11} width={8 + h.popisek.length * 8} height={22} rx={11} fill="#0b1411" stroke={st.barva} strokeWidth={1} />
                <text x={mx} y={my + 4.5} textAnchor="middle" fontSize={13} fill={TEXT} className="tabular-nums">
                  {h.popisek}
                </text>
              </>
            )}
          </g>
        );
      })}
      {uzly.map((u, i) => {
        const st = stavUzlu?.(i) ?? "zakladni";
        const vypln = st === "hotovo" ? ZELENA : st === "aktivni" ? ZLUTA : "#18332b";
        const obrys = st === "zakladni" ? "#6f8a80" : vypln;
        const popis = popisUzlu?.(i);
        const ru = r(u);
        return (
          <g key={i}>
            <circle cx={u.x} cy={u.y} r={ru} fill={vypln} stroke={obrys} strokeWidth={1.5} />
            {maly ? (
              <text x={u.x} y={u.y - 11} textAnchor="middle" fontSize={11} fill={TLUMENY}>
                {u.nazev}
              </text>
            ) : (
              <text x={u.x} y={u.y + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill={st === "zakladni" ? TEXT : "#06201a"}>
                {u.nazev}
              </text>
            )}
            {popis && (
              <text
                x={u.x}
                y={u.nahore ? u.y - ru - 10 : u.y + ru + 20}
                textAnchor="middle"
                fontSize={15}
                fontWeight={popis.jisty ? 700 : 400}
                fill={popis.jisty ? ZELENA : TLUMENY}
                className="tabular-nums"
              >
                {popis.text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Mapa z kilometrů (0–100) do obrázku. */
const naMape = (mista: Misto[], meritko = 3.4, okraj = 40): GUzel[] =>
  mista.map((m) => ({ x: okraj + m.x * meritko, y: 24 + m.y * meritko * 0.82, nazev: m.nazev }));

const rozmerMapy = (meritko = 3.4, okraj = 40) => ({ sirka: 2 * okraj + 100 * meritko, vyska: 48 + 100 * meritko * 0.82 });

/** Úseky okružní trasy (poslední místo se vrací na první). */
const useky = (trasa: number[]): [number, number][] => trasa.map((_, i) => hrana(trasa, i));
const stejnyUsek = (u: [number, number], a: number, b: number) => (u[0] === a && u[1] === b) || (u[0] === b && u[1] === a);

/* ------------------------------------------------------------------ */
/* Hodina 1: hledání                                                   */
/* ------------------------------------------------------------------ */

export const LIN = [4, 7, 9, 2];
export const LIN_CIL = 9;

function linearni(): Snimek[] {
  const n = linearniPocet(LIN, LIN_CIL);
  const snimky: Snimek[] = [
    {
      veta: `Hledáš číslo ${LIN_CIL}. Krabice nejsou seřazené, a tak otvíráš jednu po druhé.`,
      obraz: <Rada polozky={LIN.map(() => ({ h: "?", s: "zakladni" }))} />,
    },
  ];
  for (let k = 0; k < n; k++) {
    const nasel = k === n - 1;
    snimky.push({
      veta: nasel
        ? `${LIN[k]}! Máš ho. Stačily ${sklon(n, "krok", "kroky", "kroků")}.`
        : `${LIN[k]}? Není to ${LIN_CIL}. Otevřeš další krabici.`,
      obraz: (
        <Rada
          polozky={LIN.map((h, j) =>
            j < k ? { h, s: "pryc" } : j === k ? { h, s: nasel ? "hotovo" : "aktivni", pod: `${k + 1}. krok` } : { h: "?", s: "zakladni" },
          )}
        />
      ),
    });
  }
  return snimky;
}

export const BIN = [3, 8, 12, 20, 25, 31, 40];
export const BIN_CIL = 25;

function binarni(): Snimek[] {
  const kroky = binarniKroky(BIN, BIN_CIL);
  const otevrene = new Set<number>();
  const rada = (od: number, po: number, aktualni: number, nasel: boolean, krok = 0) => (
    <Rada
      polozky={BIN.map((h, j) => {
        if (j === aktualni) return { h, s: nasel ? "hotovo" : "aktivni", pod: `${krok}. krok` } as Polozka;
        if (j < od || j > po) return { h: otevrene.has(j) ? h : "?", s: "pryc" } as Polozka;
        return { h: "?", s: "zakladni" } as Polozka;
      })}
    />
  );
  const snimky: Snimek[] = [
    {
      veta: `Krabice jsou seřazené od nejmenšího čísla po největší. Hledáš ${BIN_CIL}.`,
      obraz: rada(0, BIN.length - 1, -1, false),
    },
  ];
  kroky.forEach((k, i) => {
    const nasel = k.vysledek === "nalezeno";
    snimky.push({
      veta: nasel
        ? `Uprostřed je ${k.hodnota}. To je ono! Stačily ${sklon(kroky.length, "krok", "kroky", "kroků")}.`
        : `${i === 0 ? "Otevřeš krabici přesně uprostřed" : "Otevřeš prostřední ze zbylých krabic"}: je v ní ${k.hodnota}.`,
      obraz: rada(k.od, k.do, k.stred, nasel, i + 1),
    });
    otevrene.add(k.stred);
    if (nasel) return;
    const vpravo = k.vysledek === "vpravo";
    snimky.push({
      veta: vpravo
        ? `${BIN_CIL} je víc než ${k.hodnota}. Vlevo jsou jen menší čísla, ty krabice už otvírat nemusíš.`
        : `${BIN_CIL} je míň než ${k.hodnota}. Vpravo jsou jen větší čísla, ty krabice už otvírat nemusíš.`,
      obraz: vpravo ? rada(k.stred + 1, k.do, -1, false) : rada(k.od, k.stred - 1, -1, false),
    });
  });
  return snimky;
}

/* ------------------------------------------------------------------ */
/* Hodina 2: řazení                                                    */
/* ------------------------------------------------------------------ */

export const BUBBLE = [5, 1, 4, 2];

function bubble(): Snimek[] {
  const kroky = bubbleKroky(BUBBLE);
  const n = BUBBLE.length;
  const rada = (pole: number[], hotovoOd: number, par: number) => (
    <Rada
      polozky={pole.map((h, j) => ({ h, s: j >= hotovoOd ? "hotovo" : j === par || j === par + 1 ? "aktivni" : "zakladni" }))}
    />
  );
  const snimky: Snimek[] = [
    { veta: `Karty ${BUBBLE.join(", ")}. Porovnáváš vždycky jen dvě karty vedle sebe.`, obraz: rada(BUBBLE, n, -1) },
  ];
  kroky.forEach((k, idx) => {
    const pred = idx === 0 ? BUBBLE : kroky[idx - 1].pole;
    const hotovoPred = idx === 0 ? n : kroky[idx - 1].hotovoOd;
    const a = pred[k.i];
    const b = pred[k.i + 1];
    snimky.push({
      veta: k.prohodit ? `${a} je větší než ${b}, a tak je prohodíš.` : `${a} není větší než ${b}, zůstanou, jak jsou.`,
      obraz: rada(pred, hotovoPred, k.i),
    });
    const konecPruchodu = k.hotovoOd === n - k.pruchod;
    if (!konecPruchodu) return;
    const posledni = k.pruchod === n - 1;
    snimky.push({
      veta: posledni
        ? `Hotovo: ${k.pole.join(", ")}.`
        : `Konec ${k.pruchod}. průchodu. Největší ze zbylých karet (${k.pole[k.hotovoOd]}) doputovala doprava a tam už zůstane.`,
      obraz: rada(k.pole, posledni ? 0 : k.hotovoOd, -1),
    });
  });
  return snimky;
}

export const MERGE = [7, 2, 5, 3];

function merge(): Snimek[] {
  const z = (pole: number[], s: StavPolozky = "zakladni") => pole.map((h) => ({ h, s }));
  const [a, b, c, d] = MERGE;
  const levy = slij([a], [b]).vysledek;
  const pravy = slij([c], [d]).vysledek;
  const cele = slij(levy, pravy);
  const snimky: Snimek[] = [
    { veta: `Balík karet ${MERGE.join(", ")}.`, obraz: <Hromadky skupiny={[z(MERGE)]} /> },
    { veta: "Rozpůlíš ho na dvě hromádky.", obraz: <Hromadky skupiny={[z([a, b]), z([c, d])]} /> },
    {
      veta: "Každou hromádku rozpůlíš znovu. Hromádka s jednou kartou je seřazená sama od sebe.",
      obraz: <Hromadky skupiny={[z([a]), z([b]), z([c]), z([d])]} />,
    },
    {
      veta: `Sliješ ${a} a ${b}: menší dáš dopředu. Vznikne ${levy.join(", ")}.`,
      obraz: <Hromadky skupiny={[z(levy, "aktivni"), z([c]), z([d])]} />,
    },
    {
      veta: `Stejně sliješ ${c} a ${d}: vznikne ${pravy.join(", ")}.`,
      obraz: <Hromadky skupiny={[z(levy), z(pravy, "aktivni")]} />,
    },
  ];
  let i = 0;
  let j = 0;
  const vysledek: number[] = [];
  const obraz = (aktivniL: boolean, aktivniP: boolean) => (
    <Hromadky
      sipka={2}
      skupiny={[
        levy.map((h, x) => ({ h, s: x < i ? "pryc" : x === i && aktivniL ? "aktivni" : "zakladni" }) as Polozka),
        pravy.map((h, x) => ({ h, s: x < j ? "pryc" : x === j && aktivniP ? "aktivni" : "zakladni" }) as Polozka),
        vysledek.map((h) => ({ h, s: vysledek.length === MERGE.length ? "hotovo" : "zakladni" }) as Polozka),
      ]}
    />
  );
  snimky.push({ veta: "Teď sliješ obě hromádky do jedné. Vždycky se díváš jen na první kartu každé hromádky.", obraz: obraz(true, true) });
  for (let k = 0; k < cele.kroky.length; k++) {
    const krok = cele.kroky[k];
    if (krok.porovnani) {
      const veta = `${levy[i]} nebo ${pravy[j]}? Menší je ${krok.hodnota}, ta jde do nové hromádky.`;
      if (krok.odkud === "L") i++;
      else j++;
      vysledek.push(krok.hodnota);
      snimky.push({ veta, obraz: obraz(i < levy.length && j < pravy.length, i < levy.length && j < pravy.length) });
    } else {
      // Jedna hromádka došla: zbytek druhé se jen přesune na konec (jedním snímkem).
      const zbytek = cele.kroky.slice(k).map((x) => x.hodnota);
      const strana = krok.odkud === "L" ? "Pravá" : "Levá";
      i = levy.length;
      j = pravy.length;
      vysledek.push(...zbytek);
      snimky.push({
        veta: `${strana} hromádka došla. Zbytek (${zbytek.join(", ")}) dáš na konec. Seřazeno: ${vysledek.join(", ")}.`,
        obraz: obraz(false, false),
      });
      break;
    }
  }
  return snimky;
}

/* ------------------------------------------------------------------ */
/* Hodina 3 a 4: tabulky                                               */
/* ------------------------------------------------------------------ */

export const HALA_MALA = [
  [1, 2],
  [3, 4],
];

function MalaHala({
  spocteno,
  aktualni,
  zdroje = [],
  cesta = [],
}: {
  spocteno: (r: number, s: number) => number | null;
  aktualni?: [number, number];
  zdroje?: [number, number][];
  cesta?: [number, number][];
}) {
  const g = HALA_MALA;
  const je = (seznam: [number, number][], r: number, s: number) => seznam.some(([a, b]) => a === r && b === s);
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${g[0].length}, 88px)` }}>
      {g.map((radek, r) =>
        radek.map((cas, s) => {
          const hodnota = spocteno(r, s);
          const trida = aktualni && aktualni[0] === r && aktualni[1] === s
            ? "border-[#e5b73b] bg-[#e5b73b] text-[#1a1405]"
            : je(cesta, r, s)
              ? "border-[#6fe3c2] bg-[#6fe3c2] text-[#06201a]"
              : je(zdroje, r, s)
                ? "border-[#e5b73b] bg-[#18332b] text-[#e8f3ef]"
                : "border-white/20 bg-[#18332b] text-[#e8f3ef]";
          const start = r === 0 && s === 0;
          const cil = r === g.length - 1 && s === radek.length - 1;
          return (
            <div key={`${r}-${s}`} className={`relative flex h-[76px] items-center justify-center rounded-lg border-2 ${trida}`}>
              <span className="absolute left-1.5 top-1 text-[12px] opacity-75">{cas} s</span>
              {(start || cil) && <span className="absolute bottom-1 right-1.5 text-[11px] opacity-75">{start ? "start" : "cíl"}</span>}
              <span className="text-[24px] font-semibold tabular-nums">{hodnota ?? ""}</span>
            </div>
          );
        }),
      )}
    </div>
  );
}

function mrizka(): Snimek[] {
  const g = HALA_MALA;
  const t = spoctiMrizku(g);
  const poradi: [number, number][] = [];
  g.forEach((radek, r) => radek.forEach((_, s) => poradi.push([r, s])));
  const snimky: Snimek[] = [
    {
      veta: "Malé číslo v rohu je, kolik sekund trvá projet polem. Vozík jede jen doprava, nebo dolů.",
      obraz: <MalaHala spocteno={() => null} />,
    },
  ];
  poradi.forEach(([r, s], idx) => {
    const spocteno = (rr: number, ss: number) => (poradi.findIndex(([a, b]) => a === rr && b === ss) <= idx ? t[rr][ss] : null);
    let veta: string;
    let zdroje: [number, number][] = [];
    if (r === 0 && s === 0) veta = `Start: projet ho trvá ${g[0][0]} s. Do pole napíšeš ${t[0][0]}.`;
    else if (r === 0) {
      zdroje = [[r, s - 1]];
      veta = `Sem se dá přijet jen zleva: ${t[r][s - 1]} + ${g[r][s]} = ${t[r][s]}.`;
    } else if (s === 0) {
      zdroje = [[r - 1, s]];
      veta = `Sem se dá přijet jen shora: ${t[r - 1][s]} + ${g[r][s]} = ${t[r][s]}.`;
    } else {
      zdroje = [
        [r, s - 1],
        [r - 1, s],
      ];
      const mensi = Math.min(t[r][s - 1], t[r - 1][s]);
      veta = `Sem se dá přijet zleva (${t[r][s - 1]}), nebo shora (${t[r - 1][s]}). Vezmeš menší ${mensi} a přičteš ${g[r][s]}: ${t[r][s]}.`;
    }
    snimky.push({ veta, obraz: <MalaHala spocteno={spocteno} aktualni={[r, s]} zdroje={zdroje} /> });
  });
  const cesta = nejlepsiCesta(g) as [number, number][];
  const cil = t[g.length - 1][g[0].length - 1];
  snimky.push({
    veta: `Nejrychlejší cesta trvá ${sklon(cil, "sekundu", "sekundy", "sekund")}. Kudy vede, zjistíš pozpátku: z cíle jdeš vždycky na menší číslo.`,
    obraz: <MalaHala spocteno={(r, s) => t[r][s]} cesta={cesta} />,
  });
  return snimky;
}

export const BATOH_MALY: Zakazka[] = [
  { id: "1", nazev: "Zakázka 1", doba: 2, prinos: 3 },
  { id: "2", nazev: "Zakázka 2", doba: 1, prinos: 2 },
];
export const BATOH_HODIN = 3;

function batoh(): Snimek[] {
  const z = BATOH_MALY;
  const H = BATOH_HODIN;
  const T = spoctiTabulku(z, H);
  const poradi = (r: number, s: number) => r * (H + 1) + s;
  const obraz = (doR: number, doS: number, aktualni: [number, number] | null, zdroje: [number, number][] = [], cesta: [number, number][] = []) => (
    <div className="w-[420px]">
      <TabulkaDP
        zakazky={z}
        kapacita={H}
        tabulka={T}
        odkryta={(r, s) => poradi(r, s) <= poradi(doR, doS)}
        aktualni={aktualni}
        zdroje={zdroje}
        cesta={cesta}
      />
    </div>
  );
  const snimky: Snimek[] = [
    {
      veta: `Stroj má ${H} h. Sloupce jsou hodiny stroje, řádky zakázky. Bez zakázky nic nevyděláš, proto horní řádek jsou nuly.`,
      obraz: obraz(0, H, null),
    },
  ];
  for (let r = 1; r <= z.length; r++) {
    const { doba, prinos, nazev } = z[r - 1];
    const nevejde = Array.from({ length: Math.min(doba, H + 1) }, (_, h) => h);
    if (nevejde.length) {
      snimky.push({
        veta: `${nazev} trvá ${doba} h. Když má stroj ${nevejde.join(" nebo ")} h, nevejde se. Opíšeš číslo nad.`,
        obraz: obraz(r, nevejde[nevejde.length - 1], null, nevejde.map((h) => [r, h] as [number, number])),
      });
    }
    for (let h = doba; h <= H; h++) {
      const bez = T[r - 1][h];
      const s = prinos + T[r - 1][h - doba];
      const vysledek = T[r][h];
      const zaver = bez === s ? `Obojí dá ${vysledek}.` : `Větší je ${vysledek}.`;
      snimky.push({
        veta: `${h} h: bez zakázky ${z[r - 1].id} je to ${bez} (číslo nad). Se zakázkou ${prinos} (její přínos) + ${T[r - 1][h - doba]} (nad, o ${doba} h vlevo) = ${s}. ${zaver}`,
        obraz: obraz(r, h, [r, h], [
          [r - 1, h],
          [r - 1, h - doba],
        ]),
      });
    }
  }
  // Pozpátku: kde se číslo liší od čísla nad, tam se zakázka vzala.
  const cesta: [number, number][] = [];
  const vzate: string[] = [];
  let h = H;
  for (let r = z.length; r >= 1; r--) {
    cesta.push([r, h]);
    if (T[r][h] !== T[r - 1][h]) {
      vzate.unshift(z[r - 1].id);
      h -= z[r - 1].doba;
    }
  }
  snimky.push({
    veta: `Pravý dolní roh: nejlepší přínos je ${T[z.length][H]}. Kde se číslo liší od čísla nad ním, tam se zakázka vzala: ${vzate.length === z.length ? "vyplatí se obě" : `zakázka ${vzate.join(" a ")}`}.`,
    obraz: obraz(z.length, H, null, [], cesta),
  });
  return snimky;
}

export const HRUBY_BATOH = [
  { nazev: "A", doba: 2, prinos: 3 },
  { nazev: "B", doba: 1, prinos: 2 },
  { nazev: "C", doba: 2, prinos: 4 },
];
export const HRUBY_HODIN = 3;

/** Všechny výběry z prvních `k` zakázek (bit = vzít). */
export function vyberyHrube(k: number) {
  const vybery: { vzit: boolean[]; doba: number; prinos: number }[] = [];
  for (let m = 0; m < 2 ** k; m++) {
    const vzit = Array.from({ length: k }, (_, i) => ((m >> (k - 1 - i)) & 1) === 1);
    let doba = 0;
    let prinos = 0;
    vzit.forEach((v, i) => {
      if (v) {
        doba += HRUBY_BATOH[i].doba;
        prinos += HRUBY_BATOH[i].prinos;
      }
    });
    vybery.push({ vzit, doba, prinos });
  }
  return vybery;
}

function hrubabatoh(): Snimek[] {
  const nejlepsi = (vybery: ReturnType<typeof vyberyHrube>) =>
    vybery.reduce((best, v, i) => (v.doba <= HRUBY_HODIN && (best < 0 || v.prinos > vybery[best].prinos) ? i : best), -1);
  const seznam = (k: number, soucty: boolean, zvyraznit: boolean) => {
    const vybery = vyberyHrube(k);
    const best = zvyraznit ? nejlepsi(vybery) : -1;
    return (
      <div className="flex flex-col gap-1">
        {vybery.map((v, i) => {
          const nevejde = soucty && v.doba > HRUBY_HODIN;
          return (
            <div key={i} className={`flex items-center gap-1.5 ${nevejde ? "opacity-40" : ""}`}>
              {v.vzit.map((ano, j) => (
                <span
                  key={j}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-[14px] font-semibold ${
                    i === best ? "border-[#6fe3c2] bg-[#6fe3c2] text-[#06201a]" : ano ? "border-white/25 bg-[#18332b] text-[#e8f3ef]" : "border-white/[.08] text-[#5d7069]"
                  }`}
                >
                  {ano ? HRUBY_BATOH[j].nazev : "–"}
                </span>
              ))}
              {soucty && (
                <span className={`ml-2 w-[170px] text-[13px] tabular-nums ${i === best ? "font-semibold text-[#6fe3c2]" : "text-[#c5d6cf]"}`}>
                  {v.doba} h, přínos {v.prinos}
                  {nevejde ? " (nevejde se)" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  const vsechny = vyberyHrube(HRUBY_BATOH.length);
  const b = vsechny[nejlepsi(vsechny)];
  const nazvy = HRUBY_BATOH.filter((_, i) => b.vzit[i]).map((x) => x.nazev);
  return [
    {
      veta: `Stroj má ${HRUBY_HODIN} h. Zakázky: ${HRUBY_BATOH.map((x) => `${x.nazev} (${x.doba} h, přínos ${x.prinos})`).join(", ")}.`,
      obraz: (
        <div className="flex gap-2">
          {HRUBY_BATOH.map((x) => (
            <span key={x.nazev} className="rounded-lg border border-white/25 bg-[#18332b] px-3 py-2 text-[14px] text-[#e8f3ef]">
              <b>{x.nazev}</b> · {x.doba} h · přínos {x.prinos}
            </span>
          ))}
        </div>
      ),
    },
    { veta: `Zakázku ${HRUBY_BATOH[0].nazev} můžeš vzít, nebo nevzít. To jsou 2 výběry.`, obraz: seznam(1, false, false) },
    { veta: `Přidáš ${HRUBY_BATOH[1].nazev}: každý výběr se rozdvojí. Výběry jsou 4.`, obraz: seznam(2, false, false) },
    { veta: `Přidáš ${HRUBY_BATOH[2].nazev}: výběrů je 8. Teď máš opravdu všechny.`, obraz: seznam(3, false, false) },
    {
      veta: `U každého výběru sečteš hodiny a přínos. Co trvá víc než ${HRUBY_HODIN} h, nevejde se.`,
      obraz: seznam(3, true, false),
    },
    { veta: `Nejlepší výběr, který se vejde: ${nazvy.join(" a ")}, přínos ${b.prinos}.`, obraz: seznam(3, true, true) },
    {
      veta: `Každá další zakázka počet výběrů zdvojnásobí. U 10 zakázek je jich ${cz(2 ** 10)}, u 30 přes miliardu.`,
      obraz: (
        <div className="flex items-end gap-3">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <span className="text-[12px] tabular-nums text-[#c5d6cf]">{2 ** k}</span>
              <div className="w-9 rounded-t bg-[#e5b73b]" style={{ height: 2 ** k * 2.4 }} />
              <span className="text-[12px] text-[#a6bdb4]">{k} zak.</span>
            </div>
          ))}
        </div>
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Hodina 5: trasy                                                     */
/* ------------------------------------------------------------------ */

export const MAPA_SOUSED: Misto[] = [
  { nazev: "Dílna", x: 10, y: 50 },
  { nazev: "A", x: 35, y: 22 },
  { nazev: "B", x: 72, y: 15 },
  { nazev: "C", x: 90, y: 60 },
  { nazev: "D", x: 45, y: 85 },
];

function soused(): Snimek[] {
  const mista = MAPA_SOUSED;
  const uzly = naMape(mista);
  const { sirka, vyska } = rozmerMapy();
  const { trasa, kroky } = nejblizsiSoused(mista);
  const odkud = (i: number) => (i === 0 ? "Z dílny" : `Od ${mista[i].nazev}`);
  const obraz = (dosud: number[], kandidati: { misto: number; d: number }[], z: number, vybrane: number, zpet: boolean) => {
    const hrany: GHrana[] = [];
    for (let i = 0; i + 1 < dosud.length; i++) hrany.push({ a: dosud[i], b: dosud[i + 1], stav: "cesta" });
    if (zpet) hrany.push({ a: dosud[dosud.length - 1], b: 0, stav: "aktivni" });
    for (const k of kandidati) hrany.push({ a: z, b: k.misto, stav: k.misto === vybrane ? "aktivni" : "navrh", popisek: km(k.d) });
    return (
      <Graf
        uzly={uzly}
        hrany={hrany}
        sirka={sirka}
        vyska={vyska}
        stavUzlu={(i) => (i === vybrane ? "aktivni" : dosud.includes(i) ? "hotovo" : "zakladni")}
      />
    );
  };
  const snimky: Snimek[] = [
    {
      veta: "Začínáš v dílně. Pokaždé pojedeš k nejbližšímu zákazníkovi, u kterého jsi ještě nebyl(a).",
      obraz: obraz([0], [], 0, -1, false),
    },
  ];
  kroky.forEach((k, i) => {
    const dosud = trasa.slice(0, i + 1);
    const nazev = mista[k.vybrane].nazev;
    snimky.push({
      veta:
        k.kandidati.length === 1
          ? `Zbývá jen ${nazev} (${km(k.kandidati[0].d)} km). Jedeš tam.`
          : `${odkud(k.z)} je nejblíž ${nazev} (${km(k.kandidati[0].d)} km). Jedeš tam.`,
      obraz: obraz(dosud, k.kandidati, k.z, k.vybrane, false),
    });
  });
  snimky.push({ veta: "Všechny zákazníky máš objeté. Vracíš se do dílny.", obraz: obraz(trasa, [], 0, -1, true) });
  return snimky;
}

export const MAPA_2OPT: Misto[] = [
  { nazev: "Dílna", x: 8, y: 50 },
  { nazev: "A", x: 35, y: 12 },
  { nazev: "B", x: 85, y: 12 },
  { nazev: "C", x: 85, y: 88 },
  { nazev: "D", x: 35, y: 88 },
];
export const TRASA_2OPT = [0, 1, 3, 2, 4];

function dvaopt(): Snimek[] {
  const mista = MAPA_2OPT;
  const uzly = naMape(mista);
  const { sirka, vyska } = rozmerMapy();
  const krok = dvaOpt(mista, TRASA_2OPT)[0];
  const [a, b] = hrana(krok.pred, krok.i);
  const [c, d] = hrana(krok.pred, krok.k);
  const n = (i: number) => mista[i].nazev;
  const nazevTrasy = (t: number[]) => [...t, t[0]].map(n).join(" → ");
  const graf = (trasa: number[], stav: (u: [number, number]) => StavHrany, navic: GHrana[] = []) => (
    <Graf
      uzly={uzly}
      sirka={sirka}
      vyska={vyska}
      hrany={[...useky(trasa).map((u) => ({ a: u[0], b: u[1], stav: stav(u) })), ...navic]}
      stavUzlu={(i) => (i === 0 ? "hotovo" : "zakladni")}
    />
  );
  const jeVymena = (u: [number, number]) => stejnyUsek(u, a, b) || stejnyUsek(u, c, d);
  return [
    { veta: `Hotová trasa ${nazevTrasy(krok.pred)}. Na mapě se kříží sama se sebou.`, obraz: graf(krok.pred, () => "zakladni") },
    {
      veta: `Kříží se úseky ${n(a)}–${n(b)} a ${n(c)}–${n(d)}.`,
      obraz: graf(krok.pred, (u) => (jeVymena(u) ? "aktivni" : "zakladni")),
    },
    { veta: "Oba úseky rozpojíš.", obraz: graf(krok.pred, (u) => (jeVymena(u) ? "zrusena" : "zakladni")) },
    {
      veta: `Konce spojíš obráceně: ${n(a)}–${n(c)} a ${n(b)}–${n(d)}. Kousek trasy mezi nimi pojedeš opačným směrem.`,
      obraz: graf(krok.pred, (u) => (jeVymena(u) ? "zrusena" : "zakladni"), [
        { a, b: c, stav: "aktivni" },
        { a: b, b: d, stav: "aktivni" },
      ]),
    },
    {
      veta: `Nová trasa ${nazevTrasy(krok.po)} se už nekříží a je kratší. 2-opt takhle zkouší dvojice úseků, dokud nějaká výměna trasu zkracuje.`,
      obraz: graf(krok.po, () => "cesta"),
    },
  ];
}

export const MAPA_HRUBA: Misto[] = [
  { nazev: "Dílna", x: 10, y: 50 },
  { nazev: "A", x: 42, y: 12 },
  { nazev: "B", x: 88, y: 38 },
  { nazev: "C", x: 58, y: 88 },
];

/** Různé okruhy (okruh a týž okruh pozpátku se počítají jednou) s délkou. */
export function okruhyHrube() {
  const zak = [1, 2, 3];
  const poradi: number[][] = [];
  for (const x of zak) for (const y of zak) for (const w of zak) if (x !== y && y !== w && x !== w) poradi.push([x, y, w]);
  const okruhy = poradi.filter((p) => p[0] < p[2]).map((p) => ({ poradi: p, delka: delkaTrasy(MAPA_HRUBA, [0, ...p]) }));
  return { poradi, okruhy };
}

function hrubatrasy(): Snimek[] {
  const mista = MAPA_HRUBA;
  const { poradi, okruhy } = okruhyHrube();
  const nazev = (p: number[]) => p.map((i) => mista[i].nazev).join("");
  const nej = okruhy.reduce((x, y) => (y.delka < x.delka ? y : x));
  const velka = naMape(mista);
  const { sirka, vyska } = rozmerMapy();
  const male = naMape(mista, 1.6, 14);
  const rozmerMaly = rozmerMapy(1.6, 14);
  const cip = (text: string, s: StavPolozky = "zakladni") => (
    <span key={text} className={`rounded-md border-2 px-2.5 py-1 font-mono text-[15px] font-semibold ${TRIDA_POLOZKY[s]}`}>
      {text}
    </span>
  );
  const mapky = (zvyraznit: boolean) => (
    <div className="flex gap-4">
      {okruhy.map((o) => {
        const t = [0, ...o.poradi];
        const nejkratsi = zvyraznit && o === nej;
        return (
          <div key={nazev(o.poradi)} className="flex flex-col items-center gap-1">
            <Graf
              uzly={male}
              sirka={rozmerMaly.sirka}
              vyska={rozmerMaly.vyska}
              maly
              hrany={useky(t).map((u) => ({ a: u[0], b: u[1], stav: nejkratsi ? "cesta" : "zakladni" }))}
              stavUzlu={(i) => (i === 0 ? "hotovo" : "zakladni")}
            />
            <span className={`text-[13px] tabular-nums ${nejkratsi ? "font-semibold text-[#6fe3c2]" : "text-[#c5d6cf]"}`}>
              {nazev(o.poradi)}: {km(o.delka)} km
            </span>
          </div>
        );
      })}
    </div>
  );
  return [
    {
      veta: "Dílna a tři zákazníci. Vozík musí objet všechny a vrátit se do dílny.",
      obraz: <Graf uzly={velka} hrany={[]} sirka={sirka} vyska={vyska} stavUzlu={(i) => (i === 0 ? "hotovo" : "zakladni")} />,
    },
    {
      veta: `Pořadí, v jakém je můžeš objet, je ${poradi.length}.`,
      obraz: <div className="flex flex-wrap gap-2">{poradi.map((p) => cip(nazev(p)))}</div>,
    },
    {
      veta: `${nazev(poradi[0])} a ${nazev(poradi[0].slice().reverse())} je stejný okruh, jen jetý opačně. Různé okruhy jsou proto jen ${okruhy.length}.`,
      obraz: (
        <div className="flex gap-4">
          {okruhy.map((o) => (
            <div key={nazev(o.poradi)} className="flex flex-col gap-1.5">
              {cip(nazev(o.poradi))}
              {cip(nazev(o.poradi.slice().reverse()), "pryc")}
            </div>
          ))}
        </div>
      ),
    },
    { veta: "Každý okruh změříš.", obraz: mapky(false) },
    { veta: `Nejkratší je ${nazev(nej.poradi)}: ${km(nej.delka)} km. Hrubá síla ho najde vždycky.`, obraz: mapky(true) },
    {
      veta: `Jenže okruhů rychle přibývá. Se 4 zákazníky je jich ${pocetTras(4)}, s 8 už ${cz(pocetTras(8))}.`,
      obraz: (
        <table className="text-[15px] tabular-nums">
          <thead>
            <tr className="text-[12px] text-[#a6bdb4]">
              <th className="px-3 py-1 text-right font-medium">zákazníků</th>
              <th className="px-3 py-1 text-right font-medium">různých okruhů</th>
            </tr>
          </thead>
          <tbody>
            {[3, 4, 5, 8, 15].map((k) => (
              <tr key={k} className="border-t border-white/[.07]">
                <td className="px-3 py-1 text-right text-[#c5d6cf]">{k}</td>
                <td className="px-3 py-1 text-right font-semibold text-[#e8f3ef]">{cz(pocetTras(k))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Hodina 6: síť hal                                                   */
/* ------------------------------------------------------------------ */

export const SIT_UZLY: (Uzel & { nahore?: boolean })[] = [
  { nazev: "Sklad", x: 70, y: 150 },
  { nazev: "A", x: 235, y: 62, nahore: true },
  { nazev: "B", x: 235, y: 238 },
  { nazev: "C", x: 420, y: 100, nahore: true },
  { nazev: "Montáž", x: 600, y: 205 },
];
export const SIT_HRANY: Hrana[] = [
  { a: 0, b: 1, minut: 4 },
  { a: 0, b: 2, minut: 6 },
  { a: 1, b: 2, minut: 1 },
  { a: 1, b: 3, minut: 7 },
  { a: 2, b: 3, minut: 3 },
  { a: 3, b: 4, minut: 2 },
  { a: 2, b: 4, minut: 9 },
];
const SIT_START = 0;
const SIT_CIL = 4;
const SIT_ROZMER = { sirka: 680, vyska: 300 };

function sit(stavHrany: (i: number) => StavHrany, stavUzlu: (i: number) => StavUzlu, popis?: (i: number) => { text: string; jisty?: boolean } | null) {
  return (
    <Graf
      uzly={SIT_UZLY}
      hrany={SIT_HRANY.map((h, i) => ({ a: h.a, b: h.b, popisek: String(h.minut), stav: stavHrany(i) }))}
      {...SIT_ROZMER}
      stavUzlu={stavUzlu}
      popisUzlu={popis}
    />
  );
}

const hranaMezi = (a: number, b: number) => SIT_HRANY.findIndex((h) => (h.a === a && h.b === b) || (h.a === b && h.b === a));
const hranyCesty = (cesta: number[]) => cesta.slice(1).map((u, i) => hranaMezi(cesta[i], u));

/** „do Skladu“, „do Montáže“, „do A“. */
const do2 = (i: number) => ({ Sklad: "Skladu", Montáž: "Montáže" })[SIT_UZLY[i].nazev] ?? SIT_UZLY[i].nazev;

function dijkstraObrazem(): Snimek[] {
  const n = (i: number) => SIT_UZLY[i].nazev;
  const v = dijkstra(SIT_UZLY, SIT_HRANY, SIT_START);
  const popis = (casy: number[], uzavrene: number[]) => (i: number) =>
    casy[i] === Infinity ? { text: "?" } : { text: `${casy[i]} min`, jisty: uzavrene.includes(i) };
  const legenda = <Legenda polozky={[[ZELENA, "čas je jistý"], [TLUMENY, "zatím nejlepší čas"], [ZLUTA, "právě zlepšeno"]]} />;
  const pocatek = SIT_UZLY.map((_, i) => (i === SIT_START ? 0 : Infinity));
  const snimky: Snimek[] = [
    {
      veta: `Hledáš nejrychlejší cestu ze Skladu do Montáže. Ve Skladu jsi za 0 minut, jinam čas zatím neznáš.`,
      obraz: (
        <>
          {sit(() => "zakladni", () => "zakladni", popis(pocatek, []))}
          {legenda}
        </>
      ),
    },
  ];
  v.kroky.forEach((k, idx) => {
    const u = k.uzavrena;
    const lepsi = k.zlepseni.filter((z) => z.zlepsi);
    const casti = lepsi.map((z) =>
      idx === 0
        ? `do ${do2(z.v)} za ${z.novy}`
        : `do ${do2(z.v)} za ${k.cas} + ${z.novy - k.cas} = ${z.novy}${z.stary === Infinity ? "" : ` místo ${z.stary}`}`,
    );
    const uvod =
      idx === 0 ? `${n(u)} zezelená.` : `Nejmenší šedé číslo má ${n(u)} (${k.cas} min). ${n(u)} zezelená: tenhle čas už platí.`;
    const dal = casti.length ? ` ${idx === 0 ? "Odtud" : `Přes ${n(u)}`} je to ${casti.join(", ")}.` : idx === v.kroky.length - 1 ? "" : ` Přes ${n(u)} se nic nezlepší.`;
    const zlepseneHrany = lepsi.map((z) => hranaMezi(u, z.v));
    snimky.push({
      veta: uvod + dal,
      obraz: (
        <>
          {sit(
            (i) => (zlepseneHrany.includes(i) ? "aktivni" : "zakladni"),
            (i) => (k.uzavrene.includes(i) ? "hotovo" : "zakladni"),
            popis(k.casy, k.uzavrene),
          )}
          {legenda}
        </>
      ),
    });
  });
  const cesta = cestaDo(v.predchozi, SIT_CIL);
  const naCeste = hranyCesty(cesta);
  snimky.push({
    veta: `Montáž: ${v.casy[SIT_CIL]} minut. Kudy, přečteš pozpátku podle toho, odkud se do každé haly přijelo: ${cesta.map(n).join(" → ")}.`,
    obraz: (
      <>
        {sit(
          (i) => (naCeste.includes(i) ? "cesta" : "zakladni"),
          () => "hotovo",
          popis(v.casy, SIT_UZLY.map((_, i) => i)),
        )}
        {legenda}
      </>
    ),
  });
  return snimky;
}

export const SIM_DNU = 200;
export const SIM_P = 10;
const SIM_SEED = 2026;

/** Dny nanečisto na malé síti: čas do Montáže, nebo null (nedojel). */
export function simulaceMala(): (number | null)[] {
  const nahoda = generator(SIM_SEED);
  const dny: (number | null)[] = [];
  for (let d = 0; d < SIM_DNU; d++) {
    const otevrene = SIT_HRANY.map(() => nahoda() * 100 >= SIM_P);
    const cas = dijkstra(SIT_UZLY, SIT_HRANY, SIT_START, otevrene).casy[SIT_CIL];
    dny.push(cas === Infinity ? null : cas);
  }
  return dny;
}

function simulace(): Snimek[] {
  const n = (i: number) => SIT_UZLY[i].nazev;
  const den = (zavrene: number[]) => {
    const otevrene = SIT_HRANY.map((_, i) => !zavrene.includes(i));
    const v = dijkstra(SIT_UZLY, SIT_HRANY, SIT_START, otevrene);
    const cas = v.casy[SIT_CIL];
    const naCeste = cas === Infinity ? [] : hranyCesty(cestaDo(v.predchozi, SIT_CIL));
    return {
      cas,
      obraz: sit(
        (i) => (zavrene.includes(i) ? "zavrena" : naCeste.includes(i) ? "cesta" : "zakladni"),
        (i) => (i === SIT_START || (i === SIT_CIL && cas !== Infinity) ? "hotovo" : "zakladni"),
        (i) => (i === SIT_CIL ? { text: cas === Infinity ? "nedojede" : `${cas} min`, jisty: cas !== Infinity } : null),
      ),
    };
  };
  const nazevHrany = (i: number) => `${n(SIT_HRANY[i].a)}–${n(SIT_HRANY[i].b)}`;
  const AB = hranaMezi(1, 2);
  const CM = hranaMezi(3, 4);
  const BM = hranaMezi(2, 4);
  const bezny = den([]);
  const d1 = den([AB]);
  const d2 = den([CM]);
  const d3 = den([CM, BM]);
  const dny = simulaceMala();
  const cetnosti = new Map<number, number>();
  for (const c of dny) if (c !== null) cetnosti.set(c, (cetnosti.get(c) ?? 0) + 1);
  const casy = Array.from(cetnosti.keys()).sort((a, b) => a - b);
  const nedojel = dny.filter((c) => c === null).length;
  const sloupce: [string, number, boolean][] = [...casy.map((c) => [`${c} min`, cetnosti.get(c) ?? 0, false] as [string, number, boolean])];
  if (nedojel) sloupce.push(["nedojel", nedojel, true]);
  const nejvic = Math.max(...sloupce.map((s) => s[1]));
  const bezZdrzeni = cetnosti.get(bezny.cas) ?? 0;
  const zdrzeni = SIM_DNU - bezZdrzeni - nedojel;
  return [
    { veta: `Běžný den: všechny cesty jsou otevřené. Rozvoz trvá ${bezny.cas} minut.`, obraz: bezny.obraz },
    { veta: `Den, kdy je zavřená cesta ${nazevHrany(AB)}: rozvoz trvá ${d1.cas} minut.`, obraz: d1.obraz },
    { veta: `Den, kdy je zavřená cesta ${nazevHrany(CM)}: ${d2.cas} minut.`, obraz: d2.obraz },
    {
      veta: `Den, kdy jsou zavřené ${nazevHrany(CM)} i ${nazevHrany(BM)}: ${d3.cas === Infinity ? "vozík do Montáže nedojede" : `${d3.cas} minut`}.`,
      obraz: d3.obraz,
    },
    {
      veta: `Počítač si vymyslí ${SIM_DNU} dní. Každý den je každá cesta zavřená s pravděpodobností ${SIM_P} %. ${bezny.cas} minut to trvalo ${sklon(bezZdrzeni, "den", "dny", "dní")}, déle ${sklon(zdrzeni, "den", "dny", "dní")}, nedojel ${sklon(nedojel, "den", "dny", "dní")}.`,
      obraz: (
        <div className="flex items-end gap-2.5">
          {sloupce.map(([popisek, pocet, spatne]) => (
            <div key={popisek} className="flex w-[54px] flex-col items-center gap-1">
              <span className="text-[13px] tabular-nums text-[#e8f3ef]">{pocet}</span>
              <div className="w-10 rounded-t" style={{ height: Math.max(3, (pocet / nejvic) * 170), background: spatne ? CERVENA : ZELENA }} />
              <span className="whitespace-nowrap text-[12px] text-[#a6bdb4]">{popisek}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */

export type AlgoritmusObrazem =
  | "linearni"
  | "binarni"
  | "bubble"
  | "merge"
  | "mrizka"
  | "batoh"
  | "hrubabatoh"
  | "hrubatrasy"
  | "soused"
  | "dvaopt"
  | "dijkstra"
  | "simulace";

export const SNIMKY: Record<AlgoritmusObrazem, () => Snimek[]> = {
  linearni,
  binarni,
  bubble,
  merge,
  mrizka,
  batoh,
  hrubabatoh,
  hrubatrasy,
  soused,
  dvaopt,
  dijkstra: dijkstraObrazem,
  simulace,
};
