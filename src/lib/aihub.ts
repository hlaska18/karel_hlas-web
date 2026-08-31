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

import {
  FAZE,
  MILNIKY,
  VYSLEDKY,
  type Faze,
  type Milnik,
  type Vysledek,
  type Vystup,
} from "@/lib/aihubLabels";

// Typy a označení se re-exportují, ať to volající nemusí tahat ze dvou míst.
// Klientské komponenty ale musí sáhnout PŘÍMO do `aihubLabels` – přes tenhle
// modul by si do prohlížeče zatáhly `node:fs`.
export { FAZE, MILNIKY, VYSLEDKY, OZNACENI_VYSTUPU } from "@/lib/aihubLabels";
export type { Faze, Milnik, Priloha, Vysledek, Vystup } from "@/lib/aihubLabels";

const ROOT = path.join(process.cwd(), "public", "ai-hub");

/** Pole, bez kterých výstup není ověřeným výstupem, jen souborem. */
const POVINNA = [
  "nazev",
  "autor",
  "predmet",
  "cilovaSkupina",
  "cil",
  "nastroj",
  "overeni",
  "uspora",
  "reflexe",
  "doporuceni",
  "faze",
  "vysledek",
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

  if (!FAZE.includes(syrove.faze as Faze)) {
    console.warn(
      `[ai-hub] ${slozka}: neznámá fáze „${syrove.faze}" – čekám ${FAZE.join(", ")}.`,
    );
    return null;
  }

  // Bez výsledku by neúspěšný pokus vypadal jako doporučení. Radši nezveřejnit.
  if (!VYSLEDKY.includes(syrove.vysledek as Vysledek)) {
    console.warn(
      `[ai-hub] ${slozka}: neznámý výsledek „${syrove.vysledek}" – čekám ${VYSLEDKY.join(", ")}.`,
    );
    return null;
  }

  // Milník je nepovinný, ale když tam je, musí dávat smysl. Překlep by se
  // jinak tiše ukázal na kartě.
  if (syrove.milnik !== undefined && !MILNIKY.includes(syrove.milnik as Milnik)) {
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
