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

/** Která tabulka kurzu odkazuje na kterou (cizím klíčem) – pro radu u DELETE. */
const ODKAZUJE: Record<string, string> = {
  knihy: "vypujcky", ctenari: "vypujcky",
  dily: "objednavky", dodavatele: "objednavky",
  materialy: "dodavky", stavby: "dodavky",
};

/** Dotaz bez textů v apostrofech – čárka v textu („Novák, Jan“) není desetinná. */
function desetinneKandidaty(sql: string): string {
  return sql.replace(/'[^']*'/g, "''");
}

/** Tabulky za FROM a JOIN v pořadí, jak jsou v dotazu. */
export function tabulkyVDotazu(sql: string): string[] {
  const vysledek: string[] = [];
  const re = /\b(?:from|join)\s+["`[]?([A-Za-z_][A-Za-z0-9_]*)/gi;
  let n: RegExpExecArray | null;
  while ((n = re.exec(desetinneKandidaty(sql)))) {
    if (vysledek.indexOf(n[1]) === -1) vysledek.push(n[1]);
  }
  return vysledek;
}

/** Části SELECTu v pořadí, v jakém se musí psát. */
const CASTI: { slovo: string; re: RegExp; nazev: string }[] = [
  { slovo: "where", re: /\bwhere\b/gi, nazev: "WHERE" },
  { slovo: "group", re: /\bgroup\s+by\b/gi, nazev: "GROUP BY" },
  { slovo: "having", re: /\bhaving\b/gi, nazev: "HAVING" },
  { slovo: "order", re: /\border\s+by\b/gi, nazev: "ORDER BY" },
  { slovo: "limit", re: /\blimit\b/gi, nazev: "LIMIT" },
];

/**
 * Syntaktická chyba u WHERE, GROUP, ORDER… má u začátečníka skoro vždycky
 * jednu ze dvou příčin: části dotazu jsou v jiném pořadí (ORDER BY před WHERE),
 * nebo je v dotazu druhé WHERE místo AND. Obecná rada „překlep“ ho nenavede.
 */
export function radaKPoradi(blizko: string, sql: string): string | null {
  const slovo = blizko.toLowerCase();
  const index = CASTI.map((c) => c.slovo).indexOf(slovo);
  if (index === -1) return null;
  const cisty = desetinneKandidaty(sql).replace(/--[^\n]*/g, "");
  const vyskyty = (re: RegExp) => {
    const pozice: number[] = [];
    let n: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((n = re.exec(cisty))) pozice.push(n.index);
    return pozice;
  };
  const moje = vyskyty(CASTI[index].re);
  if (slovo === "where" && moje.length > 1) {
    return t(
      "V jednom dotazu smí být jen jedno WHERE. Další podmínku k němu připoj slovem AND (musí platit obě), nebo OR (stačí jedna).",
      "A query may only have one WHERE. Attach the next condition to it with AND (both must hold) or OR (one is enough).",
    );
  }
  const prvni = moje.length ? moje[moje.length - 1] : -1;
  const predtim = CASTI.slice(index + 1).filter((c) => vyskyty(c.re).some((p) => p < prvni));
  if (predtim.length) {
    const poradi = "SELECT … FROM … WHERE … GROUP BY … ORDER BY … LIMIT";
    return t(
      `${CASTI[index].nazev} patří před ${predtim[0].nazev}. Části dotazu mají pevné pořadí: ${poradi}.`,
      `${CASTI[index].nazev} goes before ${predtim[0].nazev}. The parts of a query have a fixed order: ${poradi}.`,
    );
  }
  return null;
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
    const sql = kontext.sql || "";
    const smaz = sql.match(/\bdelete\s+from\s+["`[]?([A-Za-z_][A-Za-z0-9_]*)/i);
    if (smaz) {
      const tabulka = smaz[1];
      const odkud = ODKAZUJE[tabulka.toLowerCase()];
      const bezWhere = !/\bwhere\b/i.test(sql);
      const kdo = odkud ? `tabulka ${odkud}` : "jiná tabulka";
      const kdoEn = odkud ? `the ${odkud} table` : "another table";
      if (bezWhere) {
        return t(
          `Bez WHERE bys smazal(a) celou tabulku ${tabulka}. Na některé její řádky ale odkazuje ${kdo} a cizí klíč nedovolí smazat řádek, na který se něco odkazuje. Databáze proto nesmazala nic. Doplň WHERE, ať mažeš jen to, co máš.`,
          `Without WHERE you would delete the whole ${tabulka} table. But ${kdoEn} points to some of its rows, and the foreign key won't let you delete a row that something points to. So the database deleted nothing. Add WHERE so you only delete what you should.`,
        );
      }
      return t(
        `Na to, co mažeš, odkazuje ${kdo} a cizí klíč nedovolí smazat řádek, na který se něco odkazuje. Databáze proto nesmazala nic. Smazat by to šlo, až bys nejdřív smazal(a) i řádky ${odkud ? `v tabulce ${odkud}` : "v té druhé tabulce"}, které na to ukazují.`,
        `${odkud ? `The ${odkud} table` : "Another table"} points to what you are deleting, and the foreign key won't let you delete a row that something points to. So the database deleted nothing. You could only delete it after first deleting the rows in ${kdoEn} that point to it.`,
      );
    }
    if (/^\s*update\b/i.test(sql) || /\bupdate\s+["`[]?[A-Za-z_]/i.test(sql)) {
      return t(
        "Takovou hodnotu cizí klíč nepustí: buď odkazuješ na řádek, který v druhé tabulce není, nebo měníš id, na které se odkazuje jiná tabulka. Databáze proto nezměnila nic.",
        "The foreign key won't allow that value: either you point to a row that isn't in the other table, or you change an id that another table points to. So the database changed nothing.",
      );
    }
    return t(
      "Odkazuješ na řádek, který v druhé tabulce není – zkontroluj čísla id v cizích klíčích. Cizí klíč hlídá, aby odkazy nevedly do prázdna, a proto se řádek nezapsal.",
      "You are pointing to a row that isn't in the other table – check the id numbers in the foreign keys. The foreign key makes sure links don't lead nowhere, so the row wasn't written.",
    );
  }

  if (/foreign key mismatch/i.test(m)) {
    const nesedi = m.match(/"([^"]+)"\s+referencing\s+"([^"]+)"/i);
    const kde = nesedi ? nesedi[1] : "";
    const kam = nesedi ? nesedi[2] : "";
    if (nesedi) {
      return t(
        `Cizí klíč v tabulce ${kde} ukazuje do tabulky ${kam} na sloupec, který tam není primárním klíčem (nebo tam vůbec není). Cizí klíč má ukazovat na primární klíč – obvykle REFERENCES ${kam}(id). Dokud to neopravíš, zápis do tabulky ${kde} skončí touto chybou. Oprav to v definici tabulky ${kde}, nebo ji smaž a založ znovu.`,
        `The foreign key in the ${kde} table points into the ${kam} table at a column that isn't its primary key (or isn't there at all). A foreign key should point to the primary key – usually REFERENCES ${kam}(id). Until you fix it, writing to the ${kde} table ends with this error. Fix it in the definition of ${kde}, or drop the table and create it again.`,
      );
    }
    return t(
      "Cizí klíč ukazuje na sloupec, který v druhé tabulce není primárním klíčem (nebo tam vůbec není). Má ukazovat na primární klíč – obvykle REFERENCES tabulka(id).",
      "A foreign key points at a column that isn't the other table's primary key (or isn't there at all). It should point to the primary key – usually REFERENCES table(id).",
    );
  }

  // „7 values for 6 columns“ (INSERT se sloupci), „table x has 6 columns but
  // 7 values were supplied“ (INSERT bez nich).
  const pocty = m.match(/(\d+)\s+values\s+for\s+(\d+)\s+columns/i);
  const pocty2 = m.match(/has\s+(\d+)\s+columns\s+but\s+(\d+)\s+values/i);
  if (pocty || pocty2) {
    const hodnot = Number(pocty ? pocty[1] : pocty2![2]);
    const sloupcu = Number(pocty ? pocty[2] : pocty2![1]);
    // Nejčastější česká chyba: 0,05 místo 0.05 – čárka je pro SQL oddělovač hodnot.
    const carka = /\d\s*,\s*\d/.test(desetinneKandidaty(kontext.sql || ""));
    if (carka && hodnot > sloupcu) {
      return t(
        `Ve VALUES máš ${hodnot} hodnot, ale sloupců je ${sloupcu}. Nemáš tam desetinné číslo s čárkou? Čárka v SQL odděluje hodnoty, takže 0,05 jsou dvě hodnoty 0 a 05. Desetinné číslo se píše s tečkou: 0.05.`,
        `VALUES has ${hodnot} values but there are ${sloupcu} columns. Is there a decimal number written with a comma? In SQL a comma separates values, so 0,05 is two values, 0 and 05. Write decimals with a dot: 0.05.`,
      );
    }
    return t(
      `Ve VALUES máš ${hodnot} ${hodnot >= 2 && hodnot <= 4 ? "hodnoty" : hodnot === 1 ? "hodnotu" : "hodnot"}, ale sloupců je ${sloupcu}. Ke každému sloupci patří právě jedna hodnota ve stejném pořadí – nějaká ti chybí nebo přebývá. Desetinná čísla se píšou s tečkou (0.05), ne s čárkou.`,
      `VALUES has ${hodnot} ${hodnot === 1 ? "value" : "values"} but there are ${sloupcu} columns. Each column gets exactly one value in the same order – one is missing or extra. Decimals are written with a dot (0.05), not a comma.`,
    );
  }

  const nejasny = m.match(/ambiguous column name:\s*(\S+)/i);
  if (nejasny && kontext.sql) {
    const tabulkyDotazu = tabulkyVDotazu(kontext.sql);
    if (tabulkyDotazu.length) {
      const sloupec = nejasny[1];
      return t(
        `Sloupec „${sloupec}“ je ve víc propojených tabulkách naráz a SQL neví, který myslíš. Napiš ho i s tabulkou, například ${tabulkyDotazu[0]}.${sloupec}.`,
        `The column “${sloupec}” is in more than one of the joined tables and SQL doesn't know which one you mean. Write it with the table name, for example ${tabulkyDotazu[0]}.${sloupec}.`,
      );
    }
  }

  const blizko = m.match(/near "([^"]+)":\s*syntax error/i);
  if (blizko && kontext.sql) {
    const rada = radaKPoradi(blizko[1], kontext.sql);
    if (rada) return rada;
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
