/**
 * Hlášky SQLite po česku – verze pro virtuální DB Browser.
 *
 * Většinu umí `sqlErrorCs` z kurzu. Tři hlášky tam ale počítají s webovým
 * kurzem (jen tři tabulky, přehled nad editorem, tlačítko Obnovit databázi),
 * takže je tu říkáme po svém. A přibyly hlášky, které v kurzu nastat nemohly:
 * vlastní tabulky, cizí klíče a NOT NULL.
 */

import { sqlErrorCs } from "@/lib/sqlExercise";
import { jeAnglicky, t } from "@/lib/dbb/jazyk";

export const TRANSAKCE_ZAKAZANE = t(
  "Transakce si DB Browser řídí sám: co změníš, drží v paměti a do souboru to zapíše tlačítko Zapsat změny (Ctrl+S). Příkazy BEGIN, COMMIT, ROLLBACK a podobné tu proto nepouštěj.",
  "DB Browser manages transactions itself: it keeps your changes in memory and the Write Changes button (Ctrl+S) writes them to the file. So don't run BEGIN, COMMIT, ROLLBACK and the like here.",
);

/** Co ještě hláška může vědět: sloupce otevřené databáze a příkaz, který spadl. */
export type KontextChyby = { sloupce?: string[]; sql?: string };

const bezDiakritiky = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const PISMENO = /[0-9A-Za-z_\u00C0-\u024F]/;

/**
 * Stojí slovo v příkazu tam, kde se píše hodnota (za =, LIKE, v IN (…)
 * nebo ve VALUES (…))? Jen tam dává smysl rada „dej ho do apostrofů“ –
 * za SELECTem by žáka poslala do slepé uličky (rada 24. 9. 2026).
 * Bez lookbehindu v regulárních výrazech – Safari 12 ho neumí.
 */
export function stojiJakoHodnota(sql: string, slovo: string): boolean {
  const maly = sql.toLowerCase();
  const hledane = slovo.toLowerCase();
  let i = maly.indexOf(hledane);
  while (i !== -1) {
    const pred = i > 0 ? maly[i - 1] : "";
    const za = maly[i + hledane.length] || "";
    if (!PISMENO.test(pred) && !PISMENO.test(za)) {
      const predtim = maly.slice(0, i);
      const orez = predtim.replace(/\s+$/, "");
      if (
        /(=|<>|!=|<|>)$/.test(orez) ||
        /\blike$/.test(orez) ||
        /\bin\s*\([^)]*$/.test(predtim) ||
        /\bvalues\s*(\([^)]*\)\s*,\s*)*\([^)]*$/.test(predtim)
      ) {
        return true;
      }
    }
    i = maly.indexOf(hledane, i + 1);
  }
  return false;
}

export function chybaCesky(raw: string, tabulky: string[], kontext: KontextChyby = {}): string {
  const m = raw.trim().replace(/^Error:\s*/i, "");

  const bezTabulky = m.match(/no such table:\s*(\S+)/i);
  if (bezTabulky) {
    const nazev = bezTabulky[1];
    if (nazev.toLowerCase() === "hodnoceni" && tabulky.indexOf("knihy") !== -1) {
      return t(
        "Tabulka hodnoceni v databázi není. Založíš ji v lekci 17 – a jestli už jsi ji založil(a), nejspíš zmizela zavřením databáze bez zápisu změn.",
        "There is no hodnoceni table in the database. You create it in lesson 17 – and if you already did, it probably disappeared when you closed the database without writing the changes.",
      );
    }
    if (tabulky.length === 0) {
      return t(
        `Tabulka „${nazev}“ tu není – databáze je zatím prázdná, nemá žádnou tabulku.`,
        `There is no table “${nazev}” – the database is still empty, it has no tables at all.`,
      );
    }
    return t(
      `Tabulka „${nazev}“ v otevřené databázi není. Jsou v ní: ${tabulky.join(", ")}.`,
      `There is no table “${nazev}” in the open database. It has: ${tabulky.join(", ")}.`,
    );
  }

  const bezSloupce = m.match(/no such column:\s*(\S+)/i);
  if (bezSloupce) {
    const nazev = bezSloupce[1];
    const posledni = nazev.split(".").pop() || nazev;
    // „název“ místo „nazev“: sloupce jsou bez háčků a čárek.
    const holy = bezDiakritiky(posledni);
    const sloupec = holy !== posledni.toLowerCase() ? (kontext.sloupce || []).filter((s) => s.toLowerCase() === holy)[0] : undefined;
    if (sloupec) {
      return t(
        `Názvy sloupců jsou bez háčků a čárek – napiš ${sloupec} místo ${posledni}.`,
        `Column names have no accents – write ${sloupec} instead of ${posledni}.`,
      );
    }
    if (kontext.sql !== undefined && !stojiJakoHodnota(kontext.sql, posledni)) {
      return t(
        `Sloupec „${nazev}“ tu není. Zkontroluj překlep – názvy sloupců najdeš v panelu Schéma DB vpravo.`,
        `There is no column “${nazev}”. Check the spelling – the column names are in the DB Schema panel on the right.`,
      );
    }
    return t(
      `Sloupec „${nazev}“ tu není. Jde-li o text, patří do apostrofů – tedy '${nazev}'. Jinak zkontroluj překlep; názvy sloupců najdeš v panelu Schéma DB vpravo.`,
      `There is no column “${nazev}”. If it is meant to be text, it belongs in single quotes – '${nazev}'. Otherwise check the spelling; the column names are in the DB Schema panel on the right.`,
    );
  }

  if (/UNIQUE constraint failed/i.test(m)) {
    return t(
      "Tenhle řádek už v tabulce je – nejspíš jsi INSERT spustil(a) podruhé. Smaž ho z editoru, nebo klikni do nového příkazu a zmáčkni Shift+F5 – spustí se jen ten.",
      "This row is already in the table – you probably ran the INSERT twice. Delete it from the editor, or click into your new command and press Shift+F5 – only that one runs.",
    );
  }

  const prazdny = m.match(/NOT NULL constraint failed:\s*(\S+)/i);
  if (prazdny) {
    const sloupec = prazdny[1].split(".").pop();
    return t(
      `Sloupec ${sloupec} nesmí zůstat prázdný (má NOT NULL) – doplň mu hodnotu.`,
      `The column ${sloupec} can't be left empty (it is NOT NULL) – give it a value.`,
    );
  }

  if (/FOREIGN KEY constraint failed/i.test(m)) {
    return t(
      "Na tenhle řádek odkazuje jiná tabulka (třeba výpůjčky), nebo odkazuješ na řádek, který neexistuje. Cizí klíč hlídá, aby odkazy nevedly do prázdna.",
      "Another table (loans, for example) points to this row, or you are pointing to a row that doesn't exist. The foreign key makes sure links don't lead nowhere.",
    );
  }

  const existuje = m.match(/table\s+(\S+)\s+already exists/i);
  if (existuje) {
    return t(
      `Tabulka ${existuje[1]} už v databázi je. Když ji chceš založit znovu, nejdřív ji smaž: DROP TABLE ${existuje[1]};`,
      `The table ${existuje[1]} is already in the database. To create it again, delete it first: DROP TABLE ${existuje[1]};`,
    );
  }

  return sqlErrorCs(raw, jeAnglicky());
}
