/**
 * Data pro interaktivní SQL cvičení (běží client-side přes sql.js / SQLite WASM).
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

export type SqlTask = {
  id: number;
  zadani: string;
  /** Referenční dotaz – kontrola porovná výsledek žáka s výsledkem tohoto dotazu. */
  reference: string;
  hint: string;
};

export const TASKS: SqlTask[] = [
  {
    id: 1,
    zadani: "Vypiš všechny knihy (všechny sloupce).",
    reference: "SELECT * FROM knihy;",
    hint: "Hvězdička * znamená „všechny sloupce“: SELECT * FROM knihy;",
  },
  {
    id: 2,
    zadani: "Vypiš jen název a autora všech knih.",
    reference: "SELECT nazev, autor FROM knihy;",
    hint: "Za SELECT vyjmenuj sloupce oddělené čárkou: SELECT nazev, autor FROM knihy;",
  },
  {
    id: 3,
    zadani: "Vypiš název a rok knih vydaných po roce 1900.",
    reference: "SELECT nazev, rok FROM knihy WHERE rok > 1900;",
    hint: "Použij podmínku WHERE rok > 1900.",
  },
  {
    id: 4,
    zadani: "Vypiš dostupné knihy (dostupna = 1) seřazené podle roku vydání od nejstarší.",
    reference: "SELECT nazev, rok FROM knihy WHERE dostupna = 1 ORDER BY rok;",
    hint: "Spoj podmínku WHERE dostupna = 1 a seřazení ORDER BY rok.",
  },
  {
    id: 5,
    zadani: "Zjisti, kolik knih je celkem v databázi.",
    reference: "SELECT COUNT(*) FROM knihy;",
    hint: "Funkce COUNT(*) spočítá řádky: SELECT COUNT(*) FROM knihy;",
  },
  {
    id: 6,
    zadani: "Zjisti průměrný počet stran knih.",
    reference: "SELECT AVG(pocet_stran) FROM knihy;",
    hint: "Použij funkci AVG(pocet_stran).",
  },
  {
    id: 7,
    zadani: "Zjisti, kolik knih je od každého žánru.",
    reference: "SELECT zanr, COUNT(*) FROM knihy GROUP BY zanr;",
    hint: "Seskup řádky přes GROUP BY zanr a spočítej je COUNT(*).",
  },
  {
    id: 8,
    zadani:
      "Vypiš, kdo si půjčil kterou knihu – jméno čtenáře a název knihy. (Propojíš tři tabulky.)",
    reference:
      "SELECT ctenari.jmeno, knihy.nazev FROM vypujcky " +
      "JOIN ctenari ON vypujcky.ctenar_id = ctenari.id " +
      "JOIN knihy ON vypujcky.kniha_id = knihy.id;",
    hint: "Propoj vypujcky s ctenari a knihy přes JOIN ... ON ... (podle id).",
  },
];
