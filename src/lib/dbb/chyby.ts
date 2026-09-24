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
export type KontextChyby = {
  sloupce?: string[];
  sql?: string;
  /** Lekce, ve které žák je – některé chyby mají v určité lekci jasnou příčinu. */
  lekce?: number;
};

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

/** Znaky, které žák napíše místo apostrofu: ´ z klávesy vedle „=“, uvozovky z Wordu a PDF. */
const SPATNE_UVOZOVKY = /[\u00b4\u2018\u2019\u201a\u201b\u201c\u201d\u201e]/;

/**
 * Projde dotaz jako SQLite: řetězce '…', komentáře (dva spojovníky a lomítko s hvězdičkou). Špatný
 * apostrof mimo řetězec otvírá „řetězec“, který zavře další špatný nebo
 * rovný apostrof – tak ho žák myslel.
 */
function projdiUvozovky(sql: string, naSpatny: (i: number) => void) {
  let stav: "venku" | "retezec" | "spatny" = "venku";
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (stav === "retezec") {
      if (c === "'") stav = "venku";
    } else if (stav === "spatny") {
      if (c === "'" || SPATNE_UVOZOVKY.test(c)) {
        naSpatny(i);
        stav = "venku";
      }
    } else if (c === "'") {
      stav = "retezec";
    } else if (SPATNE_UVOZOVKY.test(c)) {
      naSpatny(i);
      stav = "spatny";
    } else if (c === "-" && sql[i + 1] === "-") {
      const konec = sql.indexOf("\n", i);
      i = konec === -1 ? sql.length : konec;
    } else if (c === "/" && sql[i + 1] === "*") {
      const konec = sql.indexOf("*/", i + 2);
      i = konec === -1 ? sql.length : konec + 1;
    }
  }
}

/**
 * Najde v dotazu „špatný apostrof“ mimo správné řetězce '…' (rada 24. 9. 2026).
 * Na české klávesnici píše klávesa vedle „=“ čárku ´ a SQLite pak ´Temno´
 * bere jako název sloupce – rada „dej to do apostrofů“ by žákovi rozdíl neukázala.
 */
export function spatneUvozovky(sql: string): string | null {
  let prvni: string | null = null;
  projdiUvozovky(sql, (i) => {
    if (prvni === null) prvni = sql[i];
  });
  return prvni;
}

/** Nahradí špatné apostrofy a uvozovky mimo řetězce rovným apostrofem '. */
export function opravUvozovky(sql: string): string {
  const znaky = sql.split("");
  projdiUvozovky(sql, (i) => {
    znaky[i] = "'";
  });
  return znaky.join("");
}

/** Tabulky databází kurzu – ty se znovu nezakládají a DROP se u nich neradí. */
const TABULKY_KURZU = [
  "knihy", "ctenari", "vypujcky", "dily", "dodavatele", "objednavky",
  "materialy", "stavby", "dodavky", "hlaseni", "osoby", "pruchody", "kamera",
];

export function chybaCesky(raw: string, tabulky: string[], kontext: KontextChyby = {}): string {
  const m = raw.trim().replace(/^Error:\s*/i, "");

  const znak = kontext.sql !== undefined ? spatneUvozovky(kontext.sql) : null;
  if (znak) {
    return t(
      `Místo apostrofu máš v dotazu znak ${znak}. SQL bere jen rovný apostrof ' – na české klávesnici je to Shift + klávesa s ¨ vlevo od Enteru. Klávesa vedle „=“ píše ´, to je čárka nad písmeno. Uvozovky zkopírované z Wordu nebo PDF taky přepiš na '.`,
      `Instead of a single quote, your query contains ${znak}. SQL only accepts the straight quote ' . Curly quotes copied from Word or a PDF won't work either – retype them as '.`,
    );
  }

  const bezTabulky = m.match(/no such table:\s*(\S+)/i);
  if (bezTabulky) {
    const nazev = bezTabulky[1];
    if (nazev.toLowerCase() === "hodnoceni" && tabulky.indexOf("knihy") !== -1) {
      return t(
        "Tabulka hodnoceni v databázi není. Založíš ji v lekci 17 – a jestli ji tam máš hotovou, nejspíš zmizela zavřením databáze bez zápisu změn, nebo jsi na jiném počítači. V lekci 18 ji vrátíš tlačítkem Založit hodnoceni znovu.",
        "There is no hodnoceni table in the database. You create it in lesson 17 – and if it is done there, it probably disappeared when you closed the database without writing the changes, or you are on another computer. In lesson 18 the Recreate hodnoceni button brings it back.",
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
    // Lekce 11: INSERT s překlepem prošel, oprava pak narazí na vlastní špatný
    // řádek s id 11 – Shift+F5 by nepomohl (rada 24. 9. 2026).
    if (kontext.lekce === 11 && /knihy\.id/i.test(m)) {
      return t(
        "Knihu s id 11 už v tabulce máš z minulého pokusu – i s případným překlepem. Klikni na Vrátit změny v liště nahoře – tím zmizí – a spusť opravený příkaz znovu.",
        "You already have a book with id 11 in the table from an earlier attempt – typo included, if there was one. Click Revert Changes in the toolbar at the top – that removes it – then run the corrected command again.",
      );
    }
    return t(
      "Řádek s tímhle id už v tabulce máš – buď jsi INSERT spustil(a) podruhé, nebo tam zůstal z minulého pokusu. Byl minulý pokus špatně? Klikni na Vrátit změny a spusť opravený příkaz znovu. Spouštíš jen INSERT podruhé? Klikni do řádku s novým příkazem a dej Shift+F5 – spustí se jen ten.",
      "A row with this id is already in the table – either you ran the INSERT twice, or it stayed there from an earlier attempt. Was the earlier attempt wrong? Click Revert Changes and run the corrected command again. Just running the INSERT twice? Click into the line with your new command and press Shift+F5 – only that one runs.",
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
    const nazev = existuje[1].replace(/^["`[]|["`\]]$/g, "");
    // Tabulky kurzu se nezakládají znovu a DROP se u nich neradí – přišel by o data lekcí.
    if (TABULKY_KURZU.indexOf(nazev.toLowerCase()) !== -1) {
      return t(
        `Tabulka ${nazev} patří k databázi kurzu – znovu ji nezakládej. CREATE TABLE z editoru smaž.`,
        `The table ${nazev} is part of the course database – don't create it again. Delete the CREATE TABLE from the editor.`,
      );
    }
    return t(
      `Tabulku ${nazev} už máš založenou. CREATE TABLE z editoru smaž, nebo klikni do řádku s INSERTem a dej Shift+F5 – spustí se jen ten. (Až kdybys ji chtěl(a) založit úplně znovu: DROP TABLE ${nazev}; ji smaže i se všemi řádky.)`,
      `You have already created the table ${nazev}. Delete the CREATE TABLE from the editor, or click into the line with the INSERT and press Shift+F5 – only that one runs. (Only if you want to start it again from scratch: DROP TABLE ${nazev}; deletes it with all its rows.)`,
    );
  }

  return sqlErrorCs(raw, jeAnglicky());
}
