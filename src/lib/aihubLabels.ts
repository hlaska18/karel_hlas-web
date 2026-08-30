/**
 * Typy a konstanty AI Hubu – čistě klientská data (žádné `fs`/`path`),
 * bezpečné importovat do "use client" komponent (na rozdíl od `aihub.ts`).
 *
 * PROČ TO JE ZVLÁŠŤ: `aihub.ts` čte soubory, takže importuje `node:fs`.
 * Když si klientská komponenta vzala z toho modulu byť jedinou HODNOTU
 * (stačilo `OZNACENI_VYSTUPU`), zatáhla ho tím celý do prohlížečového
 * balíčku a build spadl na „Reading from node:fs is not handled by plugins".
 * Typy se při překladu zahodí a nevadí; hodnoty ne. Stejné dělení jako
 * `materials.ts` (server) a `bankLabels.ts` (klient).
 */

/**
 * Pod jakým označením se výstupy publikují. Ukazuje se u každé karty.
 *
 * Na jednom místě schválně: kdyby se označení někdy měnilo, je to jeden
 * řádek, ne tolik zásahů, kolik je výstupů.
 */
export const OZNACENI_VYSTUPU = "AI Hub";

/** Zařazení výstupu v čase. Kvůli přehledu, ne kvůli vykazování. */
export const MILNIKY = ["M1", "M2", "M3", "M4", "M5", "M6"] as const;
export type Milnik = (typeof MILNIKY)[number];

export type Priloha = {
  /** Jak se příloha jmenuje v seznamu. */
  nazev: string;
  /** Soubor ve složce výstupu. */
  soubor: string;
};

export type Vystup = {
  /** Odvozeno z názvu složky – slouží jako kotva v adrese. */
  id: string;
  /* ── Identifikace ── */
  nazev: string;
  autor: string;
  predmet: string;
  cilovaSkupina: string;
  /* ── Zbytek šablony ── */
  /** Co má aktivita nebo materiál ve výuce řešit. */
  cil: string;
  /** Použitý nástroj a způsob využití, případně postup nebo prompt. */
  nastroj: string;
  /** Kdy a jak byl výstup použit v reálné výuce. */
  overeni: string;
  /** Co fungovalo, co nefungovalo, omezení a rizika. */
  reflexe: string;
  /** Jak postup upravit a kdy je přenositelný pro další pedagogy. */
  doporuceni: string;
  prilohy: Priloha[];
  /* ── Zařazení ── */
  milnik: Milnik;
  /** ISO datum publikace. Podle něj se výstupy řadí. */
  publikovano: string;
  /** Cesta ke složce výstupu na webu. */
  href: string;
};
