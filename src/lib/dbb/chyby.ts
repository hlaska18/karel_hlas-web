/**
 * Hlášky SQLite po česku – verze pro virtuální DB Browser.
 *
 * Většinu umí `sqlErrorCs` z kurzu. Tři hlášky tam ale počítají s webovým
 * kurzem (jen tři tabulky, přehled nad editorem, tlačítko Obnovit databázi),
 * takže je tu říkáme po svém. A přibyly hlášky, které v kurzu nastat nemohly:
 * vlastní tabulky, cizí klíče a NOT NULL.
 */

import { sqlErrorCs } from "@/lib/sqlExercise";

export const TRANSAKCE_ZAKAZANE =
  "Transakce si DB Browser řídí sám: co změníš, drží v paměti a do souboru to zapíše tlačítko Zapsat změny (Ctrl+S). Příkazy BEGIN, COMMIT, ROLLBACK a podobné tu proto nepouštěj.";

export function chybaCesky(raw: string, tabulky: string[]): string {
  const m = raw.trim().replace(/^Error:\s*/i, "");

  const bezTabulky = m.match(/no such table:\s*(\S+)/i);
  if (bezTabulky) {
    const nazev = bezTabulky[1];
    if (nazev.toLowerCase() === "hodnoceni" && tabulky.indexOf("knihy") !== -1) {
      return "Tabulka hodnoceni v databázi není. Založíš ji v lekci 17 – a jestli už jsi ji založil(a), nejspíš zmizela zavřením databáze bez zápisu změn.";
    }
    if (tabulky.length === 0) {
      return `Tabulka „${nazev}“ tu není – databáze je zatím prázdná, nemá žádnou tabulku.`;
    }
    return `Tabulka „${nazev}“ v otevřené databázi není. Jsou v ní: ${tabulky.join(", ")}.`;
  }

  const bezSloupce = m.match(/no such column:\s*(\S+)/i);
  if (bezSloupce) {
    const nazev = bezSloupce[1];
    return `Sloupec „${nazev}“ tu není. Jde-li o text, patří do apostrofů – tedy '${nazev}'. Jinak zkontroluj překlep; názvy sloupců najdeš v panelu Schéma DB vpravo.`;
  }

  if (/UNIQUE constraint failed/i.test(m)) {
    return "Řádek s tímhle id už v tabulce je – dvakrát se přidat nedá. Zvol jiné id, nebo změny zahoď tlačítkem Vrátit změny.";
  }

  const prazdny = m.match(/NOT NULL constraint failed:\s*(\S+)/i);
  if (prazdny) {
    const sloupec = prazdny[1].split(".").pop();
    return `Sloupec ${sloupec} nesmí zůstat prázdný (má NOT NULL) – doplň mu hodnotu.`;
  }

  if (/FOREIGN KEY constraint failed/i.test(m)) {
    return "Na tenhle řádek odkazuje jiná tabulka (třeba výpůjčky), nebo odkazuješ na řádek, který neexistuje. Cizí klíč hlídá, aby odkazy nevedly do prázdna.";
  }

  const existuje = m.match(/table\s+(\S+)\s+already exists/i);
  if (existuje) {
    return `Tabulka ${existuje[1]} už v databázi je. Když ji chceš založit znovu, nejdřív ji smaž: DROP TABLE ${existuje[1]};`;
  }

  return sqlErrorCs(raw);
}
