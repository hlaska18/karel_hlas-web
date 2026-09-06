/* ─────────────────────── Podklady pro úvodní sekci (hero) ───────────────────────
 * Hero má ukázat DŮKAZ (kolik toho tu je) a UKÁZKU (co konkrétně dostanu),
 * ne dekoraci. Obojí se počítá z reálné banky, takže to nezestárne.
 *
 * Vlastní modul schválně: `materials.ts` čte filesystem (`fs`), a tenhle kód
 * potřebuje i prohlížeč (losuje ukázku při každém načtení). */

import type { BankItem } from "@/lib/materials";
import { canPreview } from "@/lib/nahled";

/** Kolik souborů a v kolika tématech – čísla do hera. Odkazy se nepočítají. */
export function getBankStats(items: BankItem[]): { files: number; topics: number } {
  // Soubory počítáme jen vlastní (odkaz na cizí zdroj není soubor ke stažení
  // a nástroj, který běží v prohlížeči, taky ne), ale témat je tolik, kolik
  // jich je v galerii – jinak by hero hlásil 5 témat nad mřížkou s osmi
  // dlaždicemi. Word, Excel a Power BI jsou dnes jen odkazy.
  const own = items.filter((i) => !i.external && !i.interactive);
  return { files: own.length, topics: new Set(items.map((i) => i.tool)).size };
}

/**
 * Typy souborů, které se hodí do ukázky (binárky jako `.db` ne).
 *
 * Dřív tu byly i `xlsx` a `pbix`. Náhled je neumí (`canPreview`), takže od
 * chvíle, kdy karta v hlavičce otevírá náhled, by to byla karta, po jejímž
 * kliknutí se nic nestane. Dnes takový soubor v bance není, takže by ta chyba
 * spala až do prvního nahraného `.xlsx` – proto radši pryč než dva seznamy
 * v jednom souboru, které si odporují.
 */
const SHOWCASE_EXT = ["docx", "pdf", "py", "sql", "txt"];

/**
 * Kandidáti do ukázky: veřejné hostované soubory (bez metodik a odkazů),
 * a jen takové, které umí náhled.
 *
 * `canPreview` je tvrdá branka, ne preference: karta v hlavičce po kliknutí
 * otevírá náhled, takže položka, kterou náhled neumí, by byla slepý odkaz.
 *
 * `!interactive` je tam kvůli laboratořím. `canPreview("html")` je `true`
 * (html je mezi typy kódu), takže hotová stránka ke spuštění by šla ukázat
 * jako zdroják – špatně dvakrát.
 */
export function getHeroPool(items: BankItem[]): BankItem[] {
  const pool = items.filter(
    (i) => !i.external && !i.interactive && i.audience !== "teacher" && canPreview(i.ext),
  );
  // Přednostně jen názorné typy; kdyby po filtru nic nezbylo, ukážeme
  // cokoliv, co projde brankou výš. Uvolňuje se preference typu, ne
  // schopnost náhledu – prázdný stoh je poctivější než mrtvá karta.
  const nice = pool.filter((i) => SHOWCASE_EXT.includes(i.ext));
  return nice.length >= 3 ? nice : pool;
}

/** Fisher–Yates s vlastním zdrojem náhody (ať jde výběr otestovat). */
function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deterministická náhoda (mulberry32). Server i první vykreslení v prohlížeči
 * musí dát STEJNÝ výsledek, jinak React hlásí neshodu při hydrataci –
 * teprve po připojení komponenty se losuje doopravdy (viz HeroPreview).
 */
function seededRand(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Vybere ukázku do hera: z každého nástroje nejvýš jeden materiál a pokud
 * možno pokaždé jiný typ souboru, ať stoh karet nevypadá jako třikrát totéž.
 * `rand` řídí náhodu – bez něj vyjde pokaždé stejná (stabilní) trojice.
 */
export function pickHeroHighlights(
  pool: BankItem[],
  count = 3,
  rand: () => number = seededRand(1),
): BankItem[] {
  const byTool = new Map<string, BankItem[]>();
  for (const it of pool) {
    const list = byTool.get(it.tool);
    if (list) list.push(it);
    else byTool.set(it.tool, [it]);
  }

  const tools = shuffled([...byTool.keys()], rand);
  const picked: BankItem[] = [];
  const usedExt = new Set<string>();

  // 1. průchod bere jen dosud nepoužité přípony, 2. doplní zbytek do počtu.
  for (const onlyNewExt of [true, false]) {
    for (const tool of tools) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.tool === tool)) continue;
      const cands = shuffled(byTool.get(tool)!, rand);
      const it = onlyNewExt ? cands.find((i) => !usedExt.has(i.ext)) : cands[0];
      if (!it) continue;
      picked.push(it);
      usedExt.add(it.ext);
    }
  }
  return picked.slice(0, count);
}
