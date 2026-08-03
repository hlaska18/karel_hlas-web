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
  /** Ukázkový dotaz k výkladu – schválně nad JINOU tabulkou, než chce úkol. */
  example: string;
  zadani: string;
  /** Referenční dotaz – kontrola porovná výsledek žáka s výsledkem tohoto dotazu. */
  reference: string;
  /**
   * Jen u lekcí, které data mění. INSERT/UPDATE/DELETE nic nevrací, takže se
   * neporovnává výstup příkazu, ale stav tabulky po něm – tímhle dotazem.
   * Schválně nevybírá id: záleží na tom, co v tabulce je, ne pod jakým číslem.
   */
  check?: string;
  /**
   * Postrčení, ne řešení. Řešení si žák může zobrazit zvlášť tlačítkem –
   * když je v nápovědě rovnou celý dotaz, nemá první krok žádnou hodnotu.
   */
  hint: string;
};

/** 1 řádek / 2–4 řádky / 5+ řádků – české skloňování na jednom místě. */
export function radky(n: number): string {
  if (n === 1) return "řádek";
  if (n >= 2 && n <= 4) return "řádky";
  return "řádků";
}

function sloupce(n: number): string {
  if (n === 1) return "sloupec";
  if (n >= 2 && n <= 4) return "sloupce";
  return "sloupců";
}

type Rows = { columns: string[]; values: unknown[][] };

const asKeys = (rows: unknown[][]) =>
  rows.map((r) => JSON.stringify(r.map((c) => String(c))));

/**
 * Proč dotaz nesedí – konkrétně, ne „zkus to znovu“.
 *
 * Žák u kurzu sedí sám (doma, nebo když učitel obchází třídu), takže hláška je
 * jediná zpětná vazba, kterou dostane. Máme jeho i referenční výsledek, tak
 * umíme říct rozdíl: počet řádků, počet sloupců, pořadí. Nikdy neprozradí
 * hodnoty – od toho je tlačítko s řešením.
 */
export function diffMessage(
  mine: Rows | null,
  ref: Rows | null,
  ordered: boolean,
  /** Lekce s INSERT/UPDATE/DELETE – porovnává se stav tabulky, ne výstup dotazu. */
  mutating = false,
): string {
  const mv = mine?.values ?? [];
  const rv = ref?.values ?? [];

  if (mv.length === 0 && rv.length > 0) {
    return mutating
      ? `Po tvém příkazu je tabulka prázdná, ale zůstat v ní mělo ${rv.length} ${radky(rv.length)}. Nejspíš ti chybí WHERE – bez něj příkaz zasáhne úplně všechny řádky.`
      : `Tvůj dotaz nevrátil žádný řádek, správně jich je ${rv.length}. Podmínka ve WHERE je nejspíš moc přísná.`;
  }
  if (mv.length !== rv.length) {
    if (mutating) {
      // Směr chyby se u INSERTu a DELETu obrací, tak ho neuhodneme – jen počty.
      return `Po tvém příkazu má tabulka ${mv.length} ${radky(mv.length)}, správně jich má být ${rv.length}. Zkontroluj podmínku, příkaz zasáhl jiné řádky, než měl.`;
    }
    const konec =
      mv.length > rv.length
        ? " Nejspíš ti chybí podmínka, která výběr zúží."
        : " Podmínka nejspíš odfiltrovala i řádky, které tam patří.";
    return `Vrátil jsi ${mv.length} ${radky(mv.length)}, správně jich je ${rv.length}.${konec}`;
  }

  const mc = mv[0]?.length ?? 0;
  const rc = rv[0]?.length ?? 0;
  if (mc !== rc) {
    return `Řádků máš správně ${mv.length}, ale vypisuješ ${mc} ${sloupce(mc)} místo ${rc}. Zkontroluj, co máš za SELECT.`;
  }

  if (ordered) {
    const a = [...asKeys(mv)].sort();
    const b = [...asKeys(rv)].sort();
    if (a.every((x, i) => x === b[i])) {
      return "Řádky máš správné, ale v jiném pořadí. Zkontroluj ORDER BY – a jestli tam nemá (nebo naopak nemá být) DESC.";
    }
  }

  return mutating
    ? "Počet řádků sedí, ale hodnoty ne. Zkontroluj, jestli měníš správný řádek a jestli do správného sloupce zapisuješ správnou hodnotu."
    : "Počet řádků i sloupců sedí, ale hodnoty ne. Porovnej svůj výsledek s tím, co po tobě úkol chce – nejčastěji je chyba v podmínce nebo ve sloupci, podle kterého vybíráš.";
}

export const LESSONS: SqlLesson[] = [
  {
    id: 1,
    title: "Co je databáze a příkaz SELECT",
    teach:
      "Databáze ukládá data v tabulkách: řádek = jeden záznam (třeba jedna kniha), sloupec = jedna vlastnost (název, rok…). S databází se mluví jazykem SQL a nejdůležitější příkaz je SELECT – vybírá data. Hvězdička * znamená „všechny sloupce“.",
    example: "SELECT * FROM ctenari;",
    zadani: "Vypiš všechny knihy (všechny sloupce).",
    reference: "SELECT * FROM knihy;",
    hint: "Vezmi dotaz z příkladu a vyměň v něm jedinou věc – název tabulky.",
  },
  {
    id: 2,
    title: "Výběr sloupců",
    teach:
      "Málokdy potřebuješ úplně všechno. Za SELECT vyjmenuj jen sloupce, které tě zajímají, oddělené čárkou – výsledek je přehlednější.",
    example: "SELECT jmeno, trida FROM ctenari;",
    zadani: "Vypiš jen název a autora všech knih.",
    reference: "SELECT nazev, autor FROM knihy;",
    hint: "Za SELECT patří místo hvězdičky dva sloupce oddělené čárkou. Jak se přesně jmenují, najdeš v přehledu tabulek pod úkolem.",
  },
  {
    id: 3,
    title: "Podmínka WHERE",
    teach:
      "WHERE pustí do výsledku jen řádky, které splní podmínku. Čísla porovnáváš pomocí =, >, <, >=, <=. Texty piš do apostrofů, např. zanr = 'poezie'.",
    example: "SELECT nazev FROM knihy WHERE zanr = 'poezie';",
    zadani: "Vypiš název a rok knih vydaných po roce 1900.",
    reference: "SELECT nazev, rok FROM knihy WHERE rok > 1900;",
    hint: "„Po roce 1900“ znamená, že rok musí být větší. A všimni si, že vypsat máš dva sloupce, ne jeden.",
  },
  {
    id: 4,
    title: "Řazení ORDER BY",
    teach:
      "ORDER BY seřadí výsledek podle zadaného sloupce od nejmenšího; pro opačné pořadí přidej DESC. Krásně se kombinuje s WHERE – podmínka se píše vždy dřív než řazení.",
    example: "SELECT nazev, pocet_stran FROM knihy ORDER BY pocet_stran DESC;",
    zadani: "Vypiš dostupné knihy (dostupna = 1) seřazené podle roku vydání od nejstarší.",
    reference: "SELECT nazev, rok FROM knihy WHERE dostupna = 1 ORDER BY rok;",
    hint: "V jednom dotazu potřebuješ podmínku i řazení. Podmínka se píše dřív. „Od nejstarší“ je běžné pořadí od nejmenšího, takže DESC nepotřebuješ.",
  },
  {
    id: 5,
    title: "Počítání COUNT",
    teach:
      "Agregační funkce udělají z mnoha řádků jedno číslo. COUNT(*) vrátí počet řádků výsledku – hodí se na otázky typu „kolik…“.",
    example: "SELECT COUNT(*) FROM ctenari;",
    zadani: "Zjisti, kolik knih je celkem v databázi.",
    reference: "SELECT COUNT(*) FROM knihy;",
    hint: "Je to přesně dotaz z příkladu, jen nad jinou tabulkou.",
  },
  {
    id: 6,
    title: "Průměr AVG",
    teach:
      "AVG(sloupec) spočítá průměr hodnot ve sloupci. Ze stejné rodiny jsou SUM (součet), MIN (nejmenší) a MAX (největší).",
    example: "SELECT MAX(rok) FROM knihy;",
    zadani: "Zjisti průměrný počet stran knih.",
    reference: "SELECT AVG(pocet_stran) FROM knihy;",
    hint: "Funkci napiš stejně jako MAX v příkladu – jen se jmenuje jinak a počítá z jiného sloupce.",
  },
  {
    id: 7,
    title: "Skupiny GROUP BY",
    teach:
      "GROUP BY seskupí řádky se stejnou hodnotou a agregace se spočítá pro každou skupinu zvlášť. Typicky: „kolik čeho“ – počty po kategoriích.",
    example: "SELECT trida, COUNT(*) FROM ctenari GROUP BY trida;",
    zadani: "Zjisti, kolik knih je od každého žánru.",
    reference: "SELECT zanr, COUNT(*) FROM knihy GROUP BY zanr;",
    hint: "Příklad počítá čtenáře po třídách, ty potřebuješ knihy po žánrech. Za SELECT patří dvě věci: podle čeho seskupuješ a kolik jich je.",
  },
  {
    id: 8,
    title: "Propojení tabulek JOIN",
    teach:
      "Data bývají rozdělená do více tabulek propojených klíči – výpůjčka si pamatuje jen ID knihy a ID čtenáře. JOIN tabulky spojí dohromady: JOIN tabulka ON podmínka (obvykle rovnost klíčů).",
    example: "SELECT * FROM vypujcky JOIN knihy ON vypujcky.kniha_id = knihy.id;",
    zadani:
      "Vypiš, kdo si půjčil kterou knihu – jméno čtenáře a název knihy. (Propojíš tři tabulky.)",
    reference:
      "SELECT ctenari.jmeno, knihy.nazev FROM vypujcky " +
      "JOIN ctenari ON vypujcky.ctenar_id = ctenari.id " +
      "JOIN knihy ON vypujcky.kniha_id = knihy.id;",
    hint: "Začni od tabulky vypujcky – ta jediná drží obě ID. Pak k ní připoj postupně dvě tabulky, pokaždé přes rovnost ID. Ve výsledku chceš jen jméno a název.",
  },
  {
    id: 9,
    title: "Přidání řádku INSERT",
    teach:
      "Dosud jsi data jen četl. INSERT INTO přidá do tabulky nový řádek: řekneš do které tabulky, do kterých sloupců a jaké hodnoty. Texty patří do apostrofů, čísla se píšou bez nich. Pořadí hodnot musí sedět na pořadí sloupců.",
    example: "INSERT INTO ctenari (id, jmeno, trida) VALUES (6, 'Filip Král', '1.B');",
    zadani:
      "Zapiš do knihovny nový přírůstek: „Bylo nás pět“ od Karla Poláčka z roku 1946, žánr román, 280 stran, dostupná (1). Dej jí id 11.",
    reference:
      "INSERT INTO knihy (id, nazev, autor, rok, zanr, pocet_stran, dostupna) " +
      "VALUES (11, 'Bylo nás pět', 'Karel Poláček', 1946, 'román', 280, 1);",
    check: "SELECT nazev, autor, rok, zanr, pocet_stran, dostupna FROM knihy ORDER BY nazev;",
    hint: "Postav to jako v příkladu, jen sloupců je sedm místo tří. Který je který, najdeš v přehledu tabulek – a dostupnost se ukládá jako číslo, ne jako text.",
  },
  {
    id: 10,
    title: "Změna údaje UPDATE",
    teach:
      "UPDATE přepíše hodnoty v řádcích, které už v tabulce jsou. Za SET napíšeš, co se má změnit, a za WHERE, kterých řádků se to týká. Když WHERE vynecháš, změní se celá tabulka – to je nejčastější a nejdražší chyba v SQL.",
    example: "UPDATE ctenari SET trida = '2.A' WHERE id = 1;",
    zadani: "Kytice se vrátila do knihovny – nastav u ní dostupnost na 1.",
    reference: "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Kytice';",
    check: "SELECT nazev, dostupna FROM knihy ORDER BY nazev;",
    hint: "Měníš jediný sloupec u jediné knihy. Řádek najdeš podmínkou stejně jako u SELECTu – podle názvu. Bez WHERE bys zpřístupnil úplně všechno.",
  },
  {
    id: 11,
    title: "Smazání řádku DELETE",
    teach:
      "DELETE FROM smaže řádky, které vyhoví podmínce. Platí tu stejné pravidlo jako u UPDATE, jen tvrdší: bez WHERE zmizí obsah celé tabulky a zpátky ho nevrátíš. Proto se v praxi před mazáním dělá záloha – a proto má tenhle kurz tlačítko, kterým se databáze vrátí do původního stavu.",
    example: "DELETE FROM ctenari WHERE trida = '1.B';",
    zadani: "Máj se rozpadl a knihovna ho vyřadila – smaž ho ze seznamu knih.",
    reference: "DELETE FROM knihy WHERE nazev = 'Máj';",
    check: "SELECT nazev FROM knihy ORDER BY nazev;",
    hint: "Podmínku napiš stejně jako v předchozí lekci, podle názvu knihy. A znovu si ohlídej, že tam WHERE opravdu je.",
  },
];
