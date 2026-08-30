/**
 * AI Hub — veřejné výstupy projektu AI PEDAGOG 2030.
 *
 * Vzniká podle projektového záměru SPŠ Tábor pro výzvu OP JAK 02_26_048
 * („Poradím se s AI"), kapitola 10.3: veřejný AI Hub je ROZŠÍŘENÍM tohoto
 * webu, ne novým webem. Proto je to sekce na úvodní stránce a ne samostatná
 * adresa.
 *
 * Výstup NENÍ soubor ke stažení. Záměr (10.1) ho definuje jednotnou šablonou
 * o sedmi polích a hodnotu má právě to, co v běžné bance materiálů chybí:
 * KDY A JAK byl výstup ověřen ve skutečné výuce, co při tom NEfungovalo
 * a za jakých podmínek ho může převzít někdo další. Bez těch tří věcí je to
 * jen příloha a do Hubu nepatří.
 *
 * Data leží v `public/ai-hub/<slug>/vystup.json`, přílohy ve stejné složce.
 * Stejná úvaha jako u banky materiálů: přidat výstup znamená přidat složku,
 * ne sáhnout do kódu.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "ai-hub");

/**
 * Pod jakým označením se výstupy publikují.
 *
 * Záměr (10.3) říká „SPŠ Tábor / AI Lab". POZOR: konkrétní podobu označení
 * i licenci má podle téhož odstavce stanovit ŠKOLA před první publikací —
 * v dokumentu je to vedeno jako `DOPLNIT`. Tahle konstanta je proto na
 * jednom místě schválně: až vedení rozhodne, mění se jeden řádek, ne
 * třicet karet.
 */
export const OZNACENI_VYSTUPU = "SPŠ Tábor / AI Lab";

/** Milníky projektu podle harmonogramu záměru (M1–M5 po 6 měsících, M6 dva). */
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
  /* ── Zbytek šablony 10.1 ── */
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
  /* ── Evidence ── */
  milnik: Milnik;
  /** ISO datum publikace. Kvůli zprávě o realizaci projektu. */
  publikovano: string;
  /** Cesta ke složce výstupu na webu. */
  href: string;
};

/** Pole, bez kterých výstup není ověřeným výstupem, jen souborem. */
const POVINNA = [
  "nazev",
  "autor",
  "predmet",
  "cilovaSkupina",
  "cil",
  "nastroj",
  "overeni",
  "reflexe",
  "doporuceni",
  "milnik",
  "publikovano",
] as const;

function precti(slozka: string): Vystup | null {
  const soubor = path.join(ROOT, slozka, "vystup.json");
  let syrove: Partial<Vystup>;
  try {
    syrove = JSON.parse(fs.readFileSync(soubor, "utf8")) as Partial<Vystup>;
  } catch (err) {
    console.warn(`[ai-hub] Nepodařilo se přečíst ${soubor}:`, err);
    return null;
  }

  // Neúplný výstup se schválně NEDOPLŇUJE prázdnými řetězci. Karta bez
  // reflexe nebo bez ověření by vypadala jako hotový výstup a přitom by
  // nedokládala to, kvůli čemu Hub existuje.
  const chybi = POVINNA.filter((k) => {
    const v = syrove[k];
    return typeof v !== "string" || v.trim() === "";
  });
  if (chybi.length) {
    console.warn(`[ai-hub] ${slozka}: chybí ${chybi.join(", ")} – výstup se nezveřejní.`);
    return null;
  }

  if (!MILNIKY.includes(syrove.milnik as Milnik)) {
    console.warn(`[ai-hub] ${slozka}: neznámý milník „${syrove.milnik}".`);
    return null;
  }

  return {
    ...(syrove as Vystup),
    id: slozka,
    href: `/ai-hub/${encodeURIComponent(slozka)}`,
    prilohy: Array.isArray(syrove.prilohy) ? syrove.prilohy : [],
  };
}

/**
 * Zveřejněné výstupy, od nejnovějšího.
 *
 * Prázdný seznam je NORMÁLNÍ stav, ne chyba: realizace projektu je plánovaná
 * od ledna 2027 a do té doby tu žádný ověřený výstup není. Sekce to musí umět
 * říct, ne se tvářit rozbitě.
 */
export function getVystupy(): Vystup[] {
  let slozky: string[] = [];
  try {
    slozky = fs
      .readdirSync(ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    // Složka ještě neexistuje – web běží dál, sekce ukáže, že se připravuje.
    return [];
  }

  return slozky
    .map(precti)
    .filter((v): v is Vystup => v !== null)
    .sort((a, b) => b.publikovano.localeCompare(a.publikovano));
}
