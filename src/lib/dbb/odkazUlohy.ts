/**
 * Úloha z odkazu: učitel napíše zadání a správný SELECT, program z toho
 * udělá odkaz (/sql?ukol=…) a žák po otevření dostane úlohu jako lekci navíc.
 * Kontroluje se stejně jako lekce 1–13 – nad čistou kopií databáze.
 *
 * Odkaz může kdokoli přepsat, proto se z něj bere jen jeden příkaz na čtení
 * (SELECT nebo WITH) a běží jen nad kopií v paměti. Správný dotaz je v odkazu
 * čitelný pro každého, kdo ho umí dekódovat – na test to není, na procvičení
 * a domácí úkol ano.
 */

import { SCHEMA } from "@/lib/sqlExercise";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import { rozdelPrikazy, druhPrikazu, tabulkyDotazu } from "@/lib/dbb/prikazy";
import { hashRetezce } from "@/lib/dbb/otisk";
import { DILNA, STAVEBNINY, DETEKTIVKA } from "@/lib/dbb/sady";
import type { Databaze, LekceKurzu } from "@/lib/dbb/kurz";
import { t } from "@/lib/dbb/jazyk";

export type UlohaOdkazu = {
  zadani: string;
  /** Nepovinná nápověda od učitele. */
  napoveda: string;
  soubor: string;
  reference: string;
};

/** Databáze, nad kterými může úloha z odkazu běžet. */
export const DATABAZE_ULOH: Databaze[] = [{ soubor: KNIHOVNA, schema: SCHEMA }, DILNA, STAVEBNINY, DETEKTIVKA];

/** Číslo lekce s úlohou z odkazu (za lekcemi kurzu a procvičováním). */
export const ID_ULOHY = 90;

export const MAX_ZADANI = 600;
export const MAX_DOTAZU = 2000;

function naBase64Url(text: string): string {
  const bajty = unescape(encodeURIComponent(text));
  return btoa(bajty).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function zBase64Url(text: string): string {
  let b = text.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return decodeURIComponent(escape(atob(b)));
}

/** Je dotaz jediný příkaz na čtení? Vrací chybu po česku, nebo null. */
export function chybaDotazu(sql: string): string | null {
  const prikazy = rozdelPrikazy(sql);
  if (!prikazy.length) return t("Napiš správný dotaz SELECT.", "Write the correct SELECT query.");
  if (prikazy.length > 1) {
    return t(
      "Správné řešení musí být jeden dotaz – bez dalších příkazů za středníkem.",
      "The correct solution must be a single query – no further commands after a semicolon.",
    );
  }
  const slovo = (prikazy[0].text.match(/^[A-Za-z]+/) || [""])[0].toUpperCase();
  if (druhPrikazu(prikazy[0].text) !== "cteni" || (slovo !== "SELECT" && slovo !== "WITH")) {
    return t(
      "Úloha z odkazu umí jen dotazy SELECT – změny dat se v ní kontrolovat nedají.",
      "A task from a link can only use SELECT queries – changes to data can't be checked in it.",
    );
  }
  return null;
}

/**
 * Dotaz s LIKE, LOWER nebo UPPER a textem s háčky a čárkami. SQLite srovnává
 * velká a malá písmena jen u písmen bez diakritiky: LIKE '%čapek%' nenajde
 * „Čapek“ a LOWER('Č') zůstane 'Č'. Žák, který to napíše jinak než učitel,
 * pak neprojde, i když dotaz „dělá totéž“ (rada 24. 9. 2026).
 */
export function varovaniDiakritiky(sql: string): boolean {
  if (!/\b(like|lower|upper)\b/i.test(sql)) return false;
  const retezce = sql.match(/'(?:[^']|'')*'/g) || [];
  return retezce.some((r) => /[^\x00-\x7f]/.test(r));
}

export function zakodujUlohu(u: UlohaOdkazu): string {
  return naBase64Url(JSON.stringify({ z: u.zadani, n: u.napoveda || undefined, s: u.soubor, r: u.reference }));
}

/** Přečte úlohu z odkazu; cokoli podezřelého vrátí jako null. */
export function dekodujUlohu(kod: string | null | undefined): UlohaOdkazu | null {
  if (!kod || kod.length > 12000) return null;
  try {
    const d = JSON.parse(zBase64Url(kod)) as { z?: unknown; n?: unknown; s?: unknown; r?: unknown };
    if (typeof d.z !== "string" || typeof d.s !== "string" || typeof d.r !== "string") return null;
    const zadani = d.z.trim().slice(0, MAX_ZADANI);
    const reference = d.r.trim();
    if (!zadani || reference.length > MAX_DOTAZU || chybaDotazu(reference)) return null;
    if (!DATABAZE_ULOH.some((x) => x.soubor === d.s)) return null;
    const napoveda = typeof d.n === "string" ? d.n.trim().slice(0, MAX_ZADANI) : "";
    return { zadani, napoveda, soubor: d.s, reference };
  } catch {
    return null;
  }
}

/** Klíč splnění – stejná úloha dá stejný klíč, ať se nepočítá dvakrát. */
export const klicUlohy = (u: UlohaOdkazu) => `u-${hashRetezce(`${u.soubor}\n${u.reference}\n${u.zadani}`)}`;

/** Lekce s jedinou úlohou z odkazu. */
export function lekceZOdkazu(u: UlohaOdkazu): LekceKurzu {
  const databaze = DATABAZE_ULOH.filter((x) => x.soubor === u.soubor)[0];
  const knihovna = u.soubor === KNIHOVNA;
  return {
    id: ID_ULOHY,
    title: t("Úloha od učitele", "Task from your teacher"),
    teach: t(
      `Tuhle úlohu ti poslal(a) učitel(ka) odkazem. Pracuje s databází ${u.soubor} – program ji otevřel sám. Kontroluje se nad původními daty, takže nevadí, co sis v souboru předtím změnil(a). Až úlohu splníš, ukáže se v Moje výsledky a v kódu postupu.`,
      `Your teacher sent you this task as a link. It works with the ${u.soubor} database – the program has opened it for you. It is checked against the original data, so it doesn't matter what you changed in the file before. Once you solve it, it shows up in My Results and in your progress code.`,
    ),
    tabulka: tabulkyDotazu(u.reference)[0],
    knihovna,
    databaze: knihovna ? undefined : databaze,
    ukoly: [
      {
        klic: klicUlohy(u),
        zadani: u.zadani,
        hint:
          u.napoveda ||
          t(
            "K téhle úloze učitel nápovědu nenapsal. Podívej se na kartu Struktura databáze, jaké tabulky a sloupce máš k dispozici.",
            "Your teacher didn't write a hint for this task. Look at the Database Structure tab to see which tables and columns you have.",
          ),
        // Řešení se neukazuje – úlohu zadal učitel.
        reseni: "",
        reseniJeSql: true,
        kontrola: { druh: "dotaz", reference: u.reference, nadCistou: true, databaze },
      },
    ],
  };
}
