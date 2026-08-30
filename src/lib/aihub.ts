/**
 * AI Hub — materiály vytvořené s pomocí AI, které prošly skutečnou výukou.
 *
 * Vzniká na SPŠ Tábor v rámci práce koordinátora ICT. Je to SEKCE tohoto
 * webu, ne samostatný web: patří k bance materiálů, jen má přísnější vstup.
 *
 * Výstup NENÍ soubor ke stažení. Popisuje ho jednotná šablona o sedmi polích
 * a hodnotu má právě to, co v běžné bance chybí: KDY A JAK byl výstup ověřen
 * ve skutečné výuce, co při tom NEfungovalo a za jakých podmínek ho může
 * převzít někdo další. Bez těch tří věcí je to jen příloha a do Hubu nepatří.
 *
 * Data leží v `public/ai-hub/<slug>/vystup.json`, přílohy ve stejné složce.
 * Stejná úvaha jako u banky materiálů: přidat výstup znamená přidat složku,
 * ne sáhnout do kódu.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "ai-hub");

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
 * Prázdný seznam je NORMÁLNÍ stav, ne chyba: dokud nic neprojde hodinou,
 * není co zveřejnit. Sekce to musí umět říct, ne se tvářit rozbitě.
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
