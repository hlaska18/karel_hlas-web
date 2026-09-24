/**
 * Lekce navíc s vlastními databázemi: detektivka (lekce 20) a procvičování
 * na jiných datech (21 Dílna, 22 Stavebniny).
 *
 * Procvičování má úlohy stejně poskládané jako lekce 1–13 (SELECT, WHERE,
 * LIKE, ORDER BY, COUNT, AVG, GROUP BY, JOIN, INSERT, UPDATE, DELETE) a dvě
 * úlohy na práci v programu – varianty A a B se hodí na písemku, kde by se
 * s knihovnou z pracovního listu dalo opisovat. Data sedí k oborům školy.
 *
 * Do „Hotovo X/19“ se nepočítají, v Mých výsledcích mají vlastní řádek.
 */

import type { Databaze, Hodnoceni, Kontext, LekceKurzu, UkolKurzu } from "@/lib/dbb/kurz";
import { prelozLekci } from "@/lib/dbb/anglicky";
import { t } from "@/lib/dbb/jazyk";

export const DILNA: Databaze = {
  soubor: "dilna.db",
  schema: `CREATE TABLE dily (
  id INTEGER PRIMARY KEY, nazev TEXT NOT NULL, material TEXT,
  hmotnost_kg REAL, cena INTEGER, skladem INTEGER
);
CREATE TABLE dodavatele (
  id INTEGER PRIMARY KEY, nazev TEXT NOT NULL, mesto TEXT
);
CREATE TABLE objednavky (
  id INTEGER PRIMARY KEY, dil_id INTEGER REFERENCES dily(id),
  dodavatel_id INTEGER REFERENCES dodavatele(id), mnozstvi INTEGER, datum TEXT
);
INSERT INTO dily VALUES
 (1,'Šroub M8','ocel',0.02,4,500),
 (2,'Matice M8','ocel',0.01,2,800),
 (3,'Ložisko 6204','ocel',0.11,85,40),
 (4,'Hřídel 30 mm','ocel',2.4,640,12),
 (5,'Pouzdro','bronz',0.3,210,25),
 (6,'Těsnění','pryž',0.01,15,300),
 (7,'Ozubené kolo','ocel',1.2,980,8),
 (8,'Příruba','litina',3.1,450,0),
 (9,'Podložka','mosaz',0.005,3,1000),
 (10,'Řemenice','hliník',0.9,370,6);
INSERT INTO dodavatele VALUES
 (1,'Ferona','Tábor'),(2,'Bossard','Praha'),(3,'SKF','Brno'),(4,'Kovolis','Tábor');
INSERT INTO objednavky VALUES
 (1,1,2,200,'2026-09-02'),(2,2,2,300,'2026-09-02'),(3,3,3,20,'2026-09-05'),
 (4,4,1,5,'2026-09-08'),(5,7,4,4,'2026-09-10'),(6,8,4,10,'2026-09-12'),
 (7,6,2,100,'2026-09-15'),(8,5,1,10,'2026-09-18'),(9,10,4,3,'2026-09-22'),
 (10,9,2,500,'2026-09-25'),(11,3,3,15,'2026-10-01'),(12,4,1,4,'2026-10-06');`,
};

export const STAVEBNINY: Databaze = {
  soubor: "stavebniny.db",
  schema: `CREATE TABLE materialy (
  id INTEGER PRIMARY KEY, nazev TEXT NOT NULL, druh TEXT,
  jednotka TEXT, cena REAL, skladem INTEGER
);
CREATE TABLE stavby (
  id INTEGER PRIMARY KEY, nazev TEXT NOT NULL, mesto TEXT
);
CREATE TABLE dodavky (
  id INTEGER PRIMARY KEY, material_id INTEGER REFERENCES materialy(id),
  stavba_id INTEGER REFERENCES stavby(id), mnozstvi INTEGER, datum TEXT
);
INSERT INTO materialy VALUES
 (1,'Cihla plná','zdivo','ks',12,5000),
 (2,'Tvárnice 30','zdivo','ks',68,1200),
 (3,'Cement 25 kg','pojivo','pytel',165,300),
 (4,'Vápno 25 kg','pojivo','pytel',140,0),
 (5,'Písek','kamenivo','t',480,40),
 (6,'Štěrk 8/16','kamenivo','t',520,25),
 (7,'Betonářská ocel','výztuž','kg',32,2000),
 (8,'Sádrokarton','deska','m2',95,400),
 (9,'OSB deska','deska','m2',210,150),
 (10,'Minerální vata','izolace','m2',120,0);
INSERT INTO stavby VALUES
 (1,'Rodinný dům','Sezimovo Ústí'),(2,'Garáž','Planá nad Lužnicí'),(3,'Přístavba školy','Tábor');
INSERT INTO dodavky VALUES
 (1,1,1,2000,'2026-09-03'),(2,3,1,40,'2026-09-03'),(3,5,1,8,'2026-09-04'),
 (4,2,2,300,'2026-09-09'),(5,3,2,10,'2026-09-09'),(6,7,1,500,'2026-09-11'),
 (7,8,3,120,'2026-09-16'),(8,9,3,60,'2026-09-16'),(9,6,2,6,'2026-09-19'),
 (10,1,3,1500,'2026-09-23'),(11,10,3,80,'2026-09-30'),(12,3,3,25,'2026-10-02');`,
};

export const DETEKTIVKA: Databaze = {
  soubor: "detektivka.db",
  schema: `CREATE TABLE hlaseni (
  id INTEGER PRIMARY KEY, datum TEXT, cas TEXT, text TEXT
);
CREATE TABLE osoby (
  id INTEGER PRIMARY KEY, jmeno TEXT NOT NULL, role TEXT, cip TEXT
);
CREATE TABLE pruchody (
  id INTEGER PRIMARY KEY, cip TEXT, dvere TEXT, datum TEXT, cas TEXT
);
CREATE TABLE kamera (
  id INTEGER PRIMARY KEY, datum TEXT, cas TEXT, misto TEXT, popis TEXT
);
INSERT INTO hlaseni VALUES
 (1,'2026-10-15','09:30','V čítárně nesvítí žárovka.'),
 (2,'2026-10-16','15:10','Z vitríny ve studovně zmizel Krakatit – první vydání z roku 1924. Ve 14:00 byla vitrína zamčená, v 15:05 jsem ji našla otevřenou a prázdnou. Zámek vitríny odemkne jen čip, a kdo se ke vitríně dostal, musel projít dveřmi studovny. Knihu pak někdo vynesl ven.'),
 (3,'2026-10-17','08:00','Vrácen klíč od skladu.');
INSERT INTO osoby VALUES
 (1,'Jana Horká','knihovnice','C01'),
 (2,'Martin Král','školník','C05'),
 (3,'Radek Vondra','návštěva','C08'),
 (4,'Petra Malá','žákyně','C17'),
 (5,'Lukáš Beneš','žák','C23'),
 (6,'Eva Dvořáková','žákyně','C31'),
 (7,'Tomáš Veselý','učitel','C42');
INSERT INTO pruchody VALUES
 (1,'C08','studovna','2026-10-15','10:15'),
 (2,'C23','studovna','2026-10-16','13:40'),
 (3,'C01','studovna','2026-10-16','13:55'),
 (4,'C17','studovna','2026-10-16','14:12'),
 (5,'C31','jídelna','2026-10-16','14:20'),
 (6,'C42','studovna','2026-10-16','14:31'),
 (7,'C08','studovna','2026-10-16','14:44'),
 (8,'C05','dílna','2026-10-16','14:47'),
 (9,'C42','sborovna','2026-10-16','14:50'),
 (10,'C08','východ','2026-10-16','14:53'),
 (11,'C23','východ','2026-10-16','14:55'),
 (12,'C17','učebna 12','2026-10-16','14:58'),
 (13,'C01','studovna','2026-10-16','15:05');
INSERT INTO kamera VALUES
 (1,'2026-10-16','14:20','jídelna','Žákyně s táckem si sedá k oknu.'),
 (2,'2026-10-16','14:52','chodba u východu','Muž s velkou taškou přes rameno rychle míří ke dveřím.'),
 (3,'2026-10-16','14:55','chodba u východu','Chlapec s batohem běží na autobus.'),
 (4,'2026-10-16','14:58','schodiště','Žákyně s notebookem jde do 2. patra.');`,
};

const hodnoty = (r: { values: unknown[][] } | null) => (r ? r.values.map((v) => v.map((c) => String(c))) : []);

/** Úkol ověřovaný dotazem nad čistou kopií dané databáze. */
function dotaz(klic: string, db: Databaze, zadani: string, hint: string, reference: string): UkolKurzu {
  return {
    klic,
    zadani,
    hint,
    reseni: reference,
    reseniJeSql: true,
    kontrola: { druh: "dotaz", reference, nadCistou: true, databaze: db },
  };
}

/** Úkol na INSERT/UPDATE/DELETE – porovná se stav tabulky po příkazu. */
function zmena(klic: string, db: Databaze, zadani: string, hint: string, reference: string, check: string): UkolKurzu {
  return {
    klic,
    zadani,
    hint,
    reseni: reference,
    reseniJeSql: true,
    kontrola: { druh: "zmena", reference, check, databaze: db },
  };
}

/** Filtr na kartě Prohlížet data, nastavený v téhle lekci. */
function filtr(db: Databaze, tabulka: string, referenceId: string) {
  return (k: Kontext): Hodnoceni => {
    if (k.otevreny !== db.soubor || !k.udalosti.has(`filtr:${tabulka}`)) return { ok: false };
    if (!k.prohlizeni || k.prohlizeni.tabulka !== tabulka) return { ok: false };
    const ocekavane = hodnoty(k.dotazZive(referenceId)).map((r) => r[0]);
    const videt = k.prohlizeni.id.slice().sort((a, b) => Number(a) - Number(b));
    return { ok: ocekavane.length > 0 && JSON.stringify(videt) === JSON.stringify(ocekavane) };
  };
}

/** Změna zapsaná do souboru v téhle lekci. */
function zapsano(db: Databaze, dotazNaSoubor: string, ocekavano: string) {
  return (k: Kontext): Hodnoceni => {
    const r = hodnoty(k.dotazSoubor(db.soubor, dotazNaSoubor));
    if (r.length === 1 && r[0][0] === ocekavano && k.udalosti.has("zapsano")) return { ok: true };
    const zive = hodnoty(k.dotazZive(dotazNaSoubor));
    if (k.otevreny === db.soubor && zive.length === 1 && zive[0][0] === ocekavano) {
      return {
        ok: false,
        proc: t(
          "Změna je zatím jen v paměti programu – ještě ji zapiš (Ctrl+S).",
          "The change is only in the program's memory so far – write it too (Ctrl+S).",
        ),
      };
    }
    return { ok: false };
  };
}

/* ─────────────────────────────── detektivka ─────────────────────────────── */

const D = DETEKTIVKA;
const DETEKTIVKA_LEKCE: LekceKurzu = {
  id: 20,
  title: "Detektivka: Kdo odnesl Krakatit?",
  teach:
    "Ve čtvrtek 16. 10. 2026 zmizelo ze školní knihovny první vydání Krakatitu. Všechno, co potřebuješ, je v databázi detektivka.db: hlášení, osoby s jejich čipy, průchody dveřmi a záznamy z kamer. Postupuj jako vyšetřovatel – každý dotaz tě posune o kus dál. Časy jsou text ve tvaru 14:05, takže mezi dvěma časy se hledá pomocí BETWEEN '14:00' AND '15:00'.",
  tabulka: "hlaseni",
  knihovna: false,
  databaze: D,
  ukoly: [
    dotaz(
      "20a",
      D,
      "Přečti si hlášení ze dne 16. 10. 2026 (datum je uložené jako '2026-10-16').",
      "Vybírej z tabulky hlaseni a podmínkou ve WHERE nech jen jedno datum.",
      "SELECT * FROM hlaseni WHERE datum = '2026-10-16';",
    ),
    dotaz(
      "20b",
      D,
      "Vypiš čipy, které 16. 10. 2026 prošly dveřmi studovny mezi 14:00 a 15:00.",
      "Tabulka pruchody. Tři podmínky spojené AND: dveře, datum a čas BETWEEN.",
      "SELECT cip FROM pruchody WHERE dvere = 'studovna' AND datum = '2026-10-16' AND cas BETWEEN '14:00' AND '15:00';",
    ),
    dotaz(
      "20c",
      D,
      "Zjisti, komu ty čipy patří – vypiš jméno a roli každého podezřelého.",
      "Propoj osoby s pruchody přes sloupec cip a nech podmínky z minulého úkolu.",
      "SELECT osoby.jmeno, osoby.role FROM osoby JOIN pruchody ON pruchody.cip = osoby.cip WHERE pruchody.dvere = 'studovna' AND pruchody.datum = '2026-10-16' AND pruchody.cas BETWEEN '14:00' AND '15:00';",
    ),
    dotaz(
      "20d",
      D,
      "Hlášení říká, že knihu někdo vynesl ven. Kdo z podezřelých ten den prošel dveřmi „východ“? Vypiš jméno a čas průchodu.",
      "Stejné propojení jako v minulém úkolu, jen jiné dveře. Pozor, východem odcházel i někdo, kdo ve studovně nebyl – nech jen podezřelé, třeba osoby.cip IN ('C17', 'C42', 'C08').",
      "SELECT osoby.jmeno, pruchody.cas FROM osoby JOIN pruchody ON pruchody.cip = osoby.cip WHERE pruchody.dvere = 'východ' AND pruchody.datum = '2026-10-16' AND osoby.cip IN ('C17', 'C42', 'C08');",
    ),
    dotaz(
      "20e",
      D,
      "Ověř to kamerou: vypiš záznamy z chodby u východu mezi 14:45 a 15:00. Sedí popis na pachatele?",
      "Tabulka kamera, podmínka na místo (misto) a čas.",
      "SELECT * FROM kamera WHERE misto = 'chodba u východu' AND cas BETWEEN '14:45' AND '15:00';",
    ),
    dotaz(
      "20f",
      D,
      "Uzavři případ: napiš dotaz, který vrátí jen jméno pachatele – jeden řádek, jeden sloupec.",
      "Poskládej to z předchozích úkolů, ale ve SELECT nech jen sloupec jmeno.",
      "SELECT osoby.jmeno FROM osoby JOIN pruchody ON pruchody.cip = osoby.cip WHERE pruchody.dvere = 'východ' AND pruchody.datum = '2026-10-16' AND osoby.cip IN ('C17', 'C42', 'C08');",
    ),
  ],
};

/* ─────────────────────────────── procvičování ─────────────────────────────── */

const A = DILNA;
const PROCVICOVANI_A: LekceKurzu = {
  id: 21,
  title: "Procvičování A: Dílna",
  teach:
    "Stejné příkazy jako v lekcích 1–13, jen nad jinými daty: sklad strojních dílů (dily), dodavatelé (dodavatele) a objednávky (objednavky). Na konci dvě úlohy na práci v programu. Varianta B (Stavebniny) má úlohy postavené stejně – hodí se na písemku.",
  tabulka: "dily",
  knihovna: false,
  databaze: A,
  ukoly: [
    dotaz("A1", A, "Vypiš všechny díly (všechny sloupce).", "Hvězdička vybere všechny sloupce.", "SELECT * FROM dily;"),
    dotaz("A2", A, "Vypiš jen název a cenu všech dílů (v tomhle pořadí).", "Sloupce odděl čárkou.", "SELECT nazev, cena FROM dily;"),
    dotaz("A3", A, "Vypiš název a hmotnost dílů těžších než 1 kg.", "Číslo se v podmínce píše bez apostrofů.", "SELECT nazev, hmotnost_kg FROM dily WHERE hmotnost_kg > 1;"),
    dotaz("A4", A, "Vypiš názvy ocelových dílů, které jsou skladem (skladem > 0).", "Dvě podmínky spojí AND, text patří do apostrofů.", "SELECT nazev FROM dily WHERE material = 'ocel' AND skladem > 0;"),
    dotaz("A5", A, "Vypiš název a cenu dílů, v jejichž názvu je M8.", "LIKE a znak % pro „cokoli před a za“.", "SELECT nazev, cena FROM dily WHERE nazev LIKE '%M8%';"),
    dotaz("A6", A, "Vypiš název a cenu všech dílů od nejdražšího.", "ORDER BY … DESC řadí sestupně.", "SELECT nazev, cena FROM dily ORDER BY cena DESC;"),
    dotaz("A7", A, "Zjisti, kolik druhů dílů je z oceli.", "COUNT(*) spočítá řádky, které projdou podmínkou.", "SELECT COUNT(*) FROM dily WHERE material = 'ocel';"),
    dotaz("A8", A, "Zjisti průměrnou cenu dílu.", "AVG spočítá průměr sloupce.", "SELECT AVG(cena) FROM dily;"),
    dotaz("A9", A, "U každého materiálu vypiš jeho název a počet dílů z něj.", "GROUP BY material a COUNT(*).", "SELECT material, COUNT(*) FROM dily GROUP BY material;"),
    dotaz(
      "A10",
      A,
      "U každé objednávky vypiš datum a název objednaného dílu.",
      "Propoj objednavky s dily: dily.id = objednavky.dil_id.",
      "SELECT objednavky.datum, dily.nazev FROM objednavky JOIN dily ON dily.id = objednavky.dil_id;",
    ),
    dotaz(
      "A11",
      A,
      "U každé objednávky vypiš název dílu, název dodavatele a množství.",
      "Dva JOINy: jeden na dily, druhý na dodavatele.",
      "SELECT dily.nazev, dodavatele.nazev, objednavky.mnozstvi FROM objednavky JOIN dily ON dily.id = objednavky.dil_id JOIN dodavatele ON dodavatele.id = objednavky.dodavatel_id;",
    ),
    zmena(
      "A12",
      A,
      "Přidej nový díl: id 11, Pružina, ocel, 0,05 kg, cena 12, skladem 200.",
      "Desetinné číslo se v SQL píše s tečkou: 0.05.",
      "INSERT INTO dily (id, nazev, material, hmotnost_kg, cena, skladem) VALUES (11, 'Pružina', 'ocel', 0.05, 12, 200);",
      "SELECT nazev, material, hmotnost_kg, cena, skladem FROM dily ORDER BY nazev;",
    ),
    zmena(
      "A13",
      A,
      "Příruby dorazily – nastav u příruby skladem na 20.",
      "UPDATE … SET … WHERE, řádek najdeš podle názvu.",
      "UPDATE dily SET skladem = 20 WHERE nazev = 'Příruba';",
      "SELECT nazev, skladem FROM dily ORDER BY nazev;",
    ),
    zmena(
      "A14",
      A,
      "Dodavatel Kovolis (id 4) skončil – smaž všechny jeho objednávky.",
      "DELETE FROM objednavky WHERE … – podle sloupce dodavatel_id.",
      "DELETE FROM objednavky WHERE dodavatel_id = 4;",
      "SELECT dil_id, dodavatel_id, mnozstvi FROM objednavky ORDER BY id;",
    ),
    {
      klic: "A15",
      zadani: "Na kartě Prohlížet data ukaž tabulku dily a filtrem ve sloupci material nech jen ocelové díly.",
      hint: "Do políčka Filtr pod záhlavím material napiš ocel.",
      reseni: "Prohlížet data → tabulka dily → do filtru pod material napiš ocel.",
      reseniJeSql: false,
      ceka: "Čeká se na filtr ve sloupci material na kartě Prohlížet data.",
      kontrola: { druh: "stav", test: filtr(A, "dily", "SELECT id FROM dily WHERE material = 'ocel' ORDER BY id") },
    },
    {
      klic: "A16",
      zadani: "Hřídel 30 mm zdražila – nastav jí cenu 690 a změnu zapiš do souboru.",
      hint: "UPDATE a pak Ctrl+S.",
      reseni: "UPDATE dily SET cena = 690 WHERE nazev = 'Hřídel 30 mm';  → Soubor → Zapsat změny",
      reseniJeSql: false,
      ceka: "Čeká se, až novou cenu zapíšeš do souboru dilna.db.",
      kontrola: { druh: "stav", test: zapsano(A, "SELECT cena FROM dily WHERE nazev = 'Hřídel 30 mm'", "690") },
    },
  ],
};

const B = STAVEBNINY;
const PROCVICOVANI_B: LekceKurzu = {
  id: 22,
  title: "Procvičování B: Stavebniny",
  teach:
    "Varianta B k Dílně: stejně poskládané úlohy nad sklady stavebnin – materiály (materialy), stavby (stavby) a dodávky na stavby (dodavky). Na konci dvě úlohy na práci v programu.",
  tabulka: "materialy",
  knihovna: false,
  databaze: B,
  ukoly: [
    dotaz("B1", B, "Vypiš všechny materiály (všechny sloupce).", "Hvězdička vybere všechny sloupce.", "SELECT * FROM materialy;"),
    dotaz("B2", B, "Vypiš jen název a cenu všech materiálů (v tomhle pořadí).", "Sloupce odděl čárkou.", "SELECT nazev, cena FROM materialy;"),
    dotaz("B3", B, "Vypiš název a cenu materiálů dražších než 200 Kč.", "Číslo se v podmínce píše bez apostrofů.", "SELECT nazev, cena FROM materialy WHERE cena > 200;"),
    dotaz("B4", B, "Vypiš názvy materiálů na zdivo, které jsou skladem (skladem > 0).", "Dvě podmínky spojí AND, text patří do apostrofů.", "SELECT nazev FROM materialy WHERE druh = 'zdivo' AND skladem > 0;"),
    dotaz("B5", B, "Vypiš název a cenu materiálů, v jejichž názvu je 25 kg.", "LIKE a znak % pro „cokoli před a za“.", "SELECT nazev, cena FROM materialy WHERE nazev LIKE '%25 kg%';"),
    dotaz("B6", B, "Vypiš název a cenu všech materiálů od nejdražšího.", "ORDER BY … DESC řadí sestupně.", "SELECT nazev, cena FROM materialy ORDER BY cena DESC;"),
    dotaz("B7", B, "Zjisti, kolik druhů kameniva je ve skladu (druh kamenivo).", "COUNT(*) spočítá řádky, které projdou podmínkou.", "SELECT COUNT(*) FROM materialy WHERE druh = 'kamenivo';"),
    dotaz("B8", B, "Zjisti průměrnou cenu materiálu.", "AVG spočítá průměr sloupce.", "SELECT AVG(cena) FROM materialy;"),
    dotaz("B9", B, "U každého druhu vypiš jeho název a počet materiálů.", "GROUP BY druh a COUNT(*).", "SELECT druh, COUNT(*) FROM materialy GROUP BY druh;"),
    dotaz(
      "B10",
      B,
      "U každé dodávky vypiš datum a název dodaného materiálu.",
      "Propoj dodavky s materialy: materialy.id = dodavky.material_id.",
      "SELECT dodavky.datum, materialy.nazev FROM dodavky JOIN materialy ON materialy.id = dodavky.material_id;",
    ),
    dotaz(
      "B11",
      B,
      "U každé dodávky vypiš název materiálu, název stavby a množství.",
      "Dva JOINy: jeden na materialy, druhý na stavby.",
      "SELECT materialy.nazev, stavby.nazev, dodavky.mnozstvi FROM dodavky JOIN materialy ON materialy.id = dodavky.material_id JOIN stavby ON stavby.id = dodavky.stavba_id;",
    ),
    zmena(
      "B12",
      B,
      "Přidej nový materiál: id 11, Hydroizolační pás, izolace, jednotka m2, cena 180, skladem 60.",
      "Texty do apostrofů, čísla bez nich.",
      "INSERT INTO materialy (id, nazev, druh, jednotka, cena, skladem) VALUES (11, 'Hydroizolační pás', 'izolace', 'm2', 180, 60);",
      "SELECT nazev, druh, jednotka, cena, skladem FROM materialy ORDER BY nazev;",
    ),
    zmena(
      "B13",
      B,
      "Vápno dorazilo – nastav u vápna skladem na 120.",
      "UPDATE … SET … WHERE, řádek najdeš podle názvu.",
      "UPDATE materialy SET skladem = 120 WHERE nazev = 'Vápno 25 kg';",
      "SELECT nazev, skladem FROM materialy ORDER BY nazev;",
    ),
    zmena(
      "B14",
      B,
      "Stavba garáže (id 2) se zrušila – smaž všechny dodávky na ni.",
      "DELETE FROM dodavky WHERE … – podle sloupce stavba_id.",
      "DELETE FROM dodavky WHERE stavba_id = 2;",
      "SELECT material_id, stavba_id, mnozstvi FROM dodavky ORDER BY id;",
    ),
    {
      klic: "B15",
      zadani: "Na kartě Prohlížet data ukaž tabulku materialy a filtrem ve sloupci druh nech jen desky.",
      hint: "Do políčka Filtr pod záhlavím druh napiš deska.",
      reseni: "Prohlížet data → tabulka materialy → do filtru pod druh napiš deska.",
      reseniJeSql: false,
      ceka: "Čeká se na filtr ve sloupci druh na kartě Prohlížet data.",
      kontrola: { druh: "stav", test: filtr(B, "materialy", "SELECT id FROM materialy WHERE druh = 'deska' ORDER BY id") },
    },
    {
      klic: "B16",
      zadani: "Cement zdražil – nastav mu cenu 175 a změnu zapiš do souboru.",
      hint: "UPDATE a pak Ctrl+S.",
      reseni: "UPDATE materialy SET cena = 175 WHERE nazev = 'Cement 25 kg';  → Soubor → Zapsat změny",
      reseniJeSql: false,
      ceka: "Čeká se, až novou cenu zapíšeš do souboru stavebniny.db.",
      kontrola: { druh: "stav", test: zapsano(B, "SELECT cena FROM materialy WHERE nazev = 'Cement 25 kg'", "175") },
    },
  ],
};

export type Sada = { id: string; kratce: string; lekce: LekceKurzu };

export const SADY: Sada[] = [
  { id: "detektivka", kratce: t("Detektivka", "Detective"), lekce: prelozLekci(DETEKTIVKA_LEKCE) },
  { id: "dilna", kratce: t("Procvičování A", "Practice A"), lekce: prelozLekci(PROCVICOVANI_A) },
  { id: "stavebniny", kratce: t("Procvičování B", "Practice B"), lekce: prelozLekci(PROCVICOVANI_B) },
];
