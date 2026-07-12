/**
 * Data pro interaktivní SQL KURZ (běží client-side přes sql.js / SQLite WASM).
 * Každá lekce = krátký výklad (teach) + příklad + úkol s referenčním dotazem.
 * SCHEMA je shodné s public/materialy/1L/8/SQL - základy databází/knihovna.sql,
 * aby výsledky ve webové appce i ve staženém .db byly stejné.
 */

export const SCHEMA = `
CREATE TABLE knihy (
  id INTEGER PRIMARY KEY, nazev TEXT NOT NULL, autor TEXT NOT NULL,
  rok INTEGER, zanr TEXT, pocet_stran INTEGER, dostupna INTEGER
);
CREATE TABLE ctenari (
  id INTEGER PRIMARY KEY, jmeno TEXT NOT NULL, trida TEXT
);
CREATE TABLE vypujcky (
  id INTEGER PRIMARY KEY, kniha_id INTEGER REFERENCES knihy(id),
  ctenar_id INTEGER REFERENCES ctenari(id), datum_vypujcky TEXT
);
INSERT INTO knihy VALUES
 (1,'Babička','Božena Němcová',1855,'román',240,1),
 (2,'Máj','Karel Hynek Mácha',1836,'poezie',60,1),
 (3,'Kytice','Karel Jaromír Erben',1853,'poezie',140,0),
 (4,'R.U.R.','Karel Čapek',1920,'drama',96,1),
 (5,'Bílá nemoc','Karel Čapek',1937,'drama',112,1),
 (6,'Osudy dobrého vojáka Švejka','Jaroslav Hašek',1923,'román',752,0),
 (7,'Povídky malostranské','Jan Neruda',1878,'povídky',180,1),
 (8,'Krakatit','Karel Čapek',1924,'román',360,1),
 (9,'Temno','Alois Jirásek',1915,'román',420,0),
 (10,'Pole orná a válečná','Vladislav Vančura',1925,'román',200,1);
INSERT INTO ctenari VALUES
 (1,'Adam Novák','1.A'),(2,'Bára Svobodová','1.A'),(3,'Cyril Dvořák','1.B'),
 (4,'Dita Horáková','1.B'),(5,'Eva Marková','1.A');
INSERT INTO vypujcky VALUES
 (1,3,1,'2026-09-05'),(2,6,3,'2026-09-07'),(3,9,2,'2026-09-10');
`;

/** Přehled struktury tabulek (zobrazí se jako nápověda ke sloupcům). */
export const SCHEMA_INFO: { table: string; columns: string }[] = [
  { table: "knihy", columns: "id, nazev, autor, rok, zanr, pocet_stran, dostupna" },
  { table: "ctenari", columns: "id, jmeno, trida" },
  { table: "vypujcky", columns: "id, kniha_id, ctenar_id, datum_vypujcky" },
];

export type SqlLesson = {
  id: number;
  title: string;
  /** Krátký výklad nového konceptu (2–4 věty, jazyk pro 1. ročník SŠ). */
  teach: string;
  /** Ukázkový dotaz k výkladu — schválně nad JINOU tabulkou, než chce úkol. */
  example: string;
  zadani: string;
  /** Referenční dotaz – kontrola porovná výsledek žáka s výsledkem tohoto dotazu. */
  reference: string;
  hint: string;
};

export const LESSONS: SqlLesson[] = [
  {
    id: 1,
    title: "Co je databáze a příkaz SELECT",
    teach:
      "Databáze ukládá data v tabulkách: řádek = jeden záznam (třeba jedna kniha), sloupec = jedna vlastnost (název, rok…). S databází se mluví jazykem SQL a nejdůležitější příkaz je SELECT — vybírá data. Hvězdička * znamená „všechny sloupce“.",
    example: "SELECT * FROM ctenari;",
    zadani: "Vypiš všechny knihy (všechny sloupce).",
    reference: "SELECT * FROM knihy;",
    hint: "Stejně jako v příkladu, jen z tabulky knihy: SELECT * FROM knihy;",
  },
  {
    id: 2,
    title: "Výběr sloupců",
    teach:
      "Málokdy potřebuješ úplně všechno. Za SELECT vyjmenuj jen sloupce, které tě zajímají, oddělené čárkou — výsledek je přehlednější.",
    example: "SELECT jmeno, trida FROM ctenari;",
    zadani: "Vypiš jen název a autora všech knih.",
    reference: "SELECT nazev, autor FROM knihy;",
    hint: "Sloupce se jmenují nazev a autor: SELECT nazev, autor FROM knihy;",
  },
  {
    id: 3,
    title: "Podmínka WHERE",
    teach:
      "WHERE pustí do výsledku jen řádky, které splní podmínku. Čísla porovnáváš pomocí =, >, <, >=, <=. Texty piš do apostrofů, např. zanr = 'poezie'.",
    example: "SELECT nazev FROM knihy WHERE zanr = 'poezie';",
    zadani: "Vypiš název a rok knih vydaných po roce 1900.",
    reference: "SELECT nazev, rok FROM knihy WHERE rok > 1900;",
    hint: "„Po roce 1900“ znamená rok > 1900. Použij WHERE rok > 1900.",
  },
  {
    id: 4,
    title: "Řazení ORDER BY",
    teach:
      "ORDER BY seřadí výsledek podle zadaného sloupce od nejmenšího; pro opačné pořadí přidej DESC. Krásně se kombinuje s WHERE — podmínka se píše vždy dřív než řazení.",
    example: "SELECT nazev, pocet_stran FROM knihy ORDER BY pocet_stran DESC;",
    zadani: "Vypiš dostupné knihy (dostupna = 1) seřazené podle roku vydání od nejstarší.",
    reference: "SELECT nazev, rok FROM knihy WHERE dostupna = 1 ORDER BY rok;",
    hint: "Spoj obojí: WHERE dostupna = 1 ORDER BY rok.",
  },
  {
    id: 5,
    title: "Počítání COUNT",
    teach:
      "Agregační funkce udělají z mnoha řádků jedno číslo. COUNT(*) vrátí počet řádků výsledku — hodí se na otázky typu „kolik…“.",
    example: "SELECT COUNT(*) FROM ctenari;",
    zadani: "Zjisti, kolik knih je celkem v databázi.",
    reference: "SELECT COUNT(*) FROM knihy;",
    hint: "SELECT COUNT(*) FROM knihy;",
  },
  {
    id: 6,
    title: "Průměr AVG",
    teach:
      "AVG(sloupec) spočítá průměr hodnot ve sloupci. Ze stejné rodiny jsou SUM (součet), MIN (nejmenší) a MAX (největší).",
    example: "SELECT MAX(rok) FROM knihy;",
    zadani: "Zjisti průměrný počet stran knih.",
    reference: "SELECT AVG(pocet_stran) FROM knihy;",
    hint: "Použij AVG(pocet_stran).",
  },
  {
    id: 7,
    title: "Skupiny GROUP BY",
    teach:
      "GROUP BY seskupí řádky se stejnou hodnotou a agregace se spočítá pro každou skupinu zvlášť. Typicky: „kolik čeho“ — počty po kategoriích.",
    example: "SELECT trida, COUNT(*) FROM ctenari GROUP BY trida;",
    zadani: "Zjisti, kolik knih je od každého žánru.",
    reference: "SELECT zanr, COUNT(*) FROM knihy GROUP BY zanr;",
    hint: "Seskup podle žánru: GROUP BY zanr, a spočítej COUNT(*).",
  },
  {
    id: 8,
    title: "Propojení tabulek JOIN",
    teach:
      "Data bývají rozdělená do více tabulek propojených klíči — výpůjčka si pamatuje jen ID knihy a ID čtenáře. JOIN tabulky spojí dohromady: JOIN tabulka ON podmínka (obvykle rovnost klíčů).",
    example: "SELECT * FROM vypujcky JOIN knihy ON vypujcky.kniha_id = knihy.id;",
    zadani:
      "Vypiš, kdo si půjčil kterou knihu — jméno čtenáře a název knihy. (Propojíš tři tabulky.)",
    reference:
      "SELECT ctenari.jmeno, knihy.nazev FROM vypujcky " +
      "JOIN ctenari ON vypujcky.ctenar_id = ctenari.id " +
      "JOIN knihy ON vypujcky.kniha_id = knihy.id;",
    hint: "Dva JOINy za sebou: na ctenari (ctenar_id = ctenari.id) a na knihy (kniha_id = knihy.id).",
  },
];
