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

/**
 * Fáze učitelovy VLASTNÍ práce, ne fáze vyučovací hodiny.
 *
 * „V hodině" tu schválně NENÍ. AI Hub není o tom, co učitel dělá se třídou –
 * na to je banka materiálů. Je o tom, čím si ušetří čas, když u toho žádní
 * žáci nejsou: příprava předem a po hodině opravování, vyhodnocení,
 * zpětná vazba a reflexe vlastní hodiny.
 */
export const FAZE = ["pred", "po"] as const;
export type Faze = (typeof FAZE)[number];

/**
 * Vyplatilo se to, nebo ne. NENÍ to jen štítek: záznam „tohle nefunguje,
 * nezkoušej to" je plnohodnotný obsah Hubu a musí jít poznat na první
 * pohled, aby ho nikdo nečetl jako doporučení.
 */
export const VYSLEDKY = ["vyplatilo", "nevyplatilo"] as const;
export type Vysledek = (typeof VYSLEDKY)[number];

/**
 * Volitelné zařazení v čase. NEPOVINNÉ schválně: M1–M6 jsou milníky
 * projektu, a dokud žádný neběží, označit jimi materiál by byla nepravda.
 */
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
  /** Co bylo potřeba udělat – úkol z učitelovy vlastní práce, ne cíl hodiny. */
  cil: string;
  /** Použitý nástroj a způsob využití, případně postup nebo prompt. */
  nastroj: string;
  /** Na čem a kdy to autor zkusil ve své práci. */
  overeni: string;
  /** Kolik času to ušetřilo – měřítko, podle kterého se sem věci vybírají. */
  uspora: string;
  /** Co fungovalo, co nefungovalo, omezení a rizika. */
  reflexe: string;
  /** Jak postup upravit a kdy je přenositelný pro další pedagogy. */
  doporuceni: string;
  prilohy: Priloha[];
  /* ── Zařazení ── */
  faze: Faze;
  /** Vyplatilo se to. Neúspěch je plnohodnotný záznam, ne chybějící údaj. */
  vysledek: Vysledek;
  /** Nepovinné – vyplní se, jen když výstup vznikl v rámci projektu. */
  milnik?: Milnik;
  /** ISO datum publikace. Podle něj se výstupy řadí. */
  publikovano: string;
  /** Cesta ke složce výstupu na webu. */
  href: string;
};
