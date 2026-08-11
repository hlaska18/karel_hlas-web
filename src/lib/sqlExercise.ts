/**
 * Data pro interaktivní SQL KURZ (běží client-side přes sql.js / SQLite WASM).
 * Každá lekce = krátký výklad (teach) + příklad + úkol s referenčním dotazem.
 * SCHEMA je shodné s public/materialy/1L/8/3. Práce v DB Browseru/knihovna.sql,
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
 (1,3,1,'2026-09-05'),(2,6,3,'2026-09-07'),(3,9,2,'2026-09-10'),
 (4,1,1,'2026-09-12'),(5,4,4,'2026-09-15'),(6,1,5,'2026-09-18'),
 (7,8,3,'2026-09-20'),(8,10,1,'2026-09-24'),(9,4,2,'2026-10-01'),
 (10,7,5,'2026-10-03'),(11,1,3,'2026-10-06'),(12,5,4,'2026-10-09');
`;

/** Přehled struktury tabulek (zobrazí se jako nápověda ke sloupcům). */
export const SCHEMA_INFO: { table: string; columns: string }[] = [
  { table: "knihy", columns: "id, nazev, autor, rok, zanr, pocet_stran, dostupna" },
  { table: "ctenari", columns: "id, jmeno, trida" },
  { table: "vypujcky", columns: "id, kniha_id, ctenar_id, datum_vypujcky" },
];

/** Úkol – hlavní i ten „navíc“ mají stejná pole, liší se jen zařazením. */
export type SqlTask = {
  zadani: string;
  /** Referenční dotaz – kontrola porovná výsledek žáka s výsledkem tohoto dotazu. */
  reference: string;
  /**
   * Jen u úkolů, které data mění. INSERT/UPDATE/DELETE nic nevrací, takže se
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

export type SqlLesson = SqlTask & {
  id: number;
  title: string;
  /** Krátký výklad nového konceptu (2–4 věty, jazyk pro 1. ročník SŠ). */
  teach: string;
  /** Ukázkový dotaz k výkladu – schválně nad JINOU tabulkou, než chce úkol. */
  example: string;
  /**
   * Nepovinná druhá úloha. Je jen tam, kde se mění vzorec (textová podmínka,
   * řazení podle textu, jiná agregace) – opakovat stejný postup podruhé je
   * pro rychlého žáka trest a pro pomalého zdržení.
   */
  bonus?: SqlTask;
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

const asKeys = (rows: unknown[][]) => rows.map((r) => JSON.stringify(r.map((c) => String(c))));

/**
 * Hlášky SQLite do češtiny.
 *
 * Engine mluví anglicky a jeho hlášky jsou pro žáka 1. ročníku konec práce –
 * přitom skoro vždycky jde o jednu z pěti věcí. Nejčastější je zapomenutý
 * apostrof: `WHERE zanr = poezie` hlásí „no such column: poezie“, což zní jako
 * chyba v datech, ne v zápisu. Originál vracíme zvlášť, ať se dá dohledat.
 */
export function sqlErrorCs(raw: string): string {
  const m = raw.trim().replace(/^Error:\s*/i, "");

  const noColumn = m.match(/no such column:\s*(\S+)/i);
  if (noColumn) {
    return `Sloupec „${noColumn[1]}“ v tabulce není. Pokud jsi myslel(a) text, patří do apostrofů – tedy '${noColumn[1]}'. Jinak zkontroluj překlep, správné názvy jsou v přehledu tabulek nad editorem.`;
  }

  const noTable = m.match(/no such table:\s*(\S+)/i);
  if (noTable) {
    return `Tabulka „${noTable[1]}“ v databázi není. Jsou jen tři: knihy, ctenari a vypujcky (bez háčků a čárek).`;
  }

  if (/UNIQUE constraint failed/i.test(m)) {
    return "Řádek s tímhle id už v tabulce je – dvakrát se přidat nedá. Buď zvol jiné id, nebo klikni na Obnovit databázi a spusť příkaz znovu.";
  }

  const ambiguous = m.match(/ambiguous column name:\s*(\S+)/i);
  if (ambiguous) {
    return `Sloupec „${ambiguous[1]}“ je ve víc propojených tabulkách naráz a SQL neví, který myslíš. Napiš ho i s tabulkou, například knihy.${ambiguous[1]}.`;
  }

  const near = m.match(/near "([^"]+)":\s*syntax error/i);
  if (near) {
    return `Někde u „${near[1]}“ je překlep v zápisu. Nejčastěji chybí čárka mezi sloupci, apostrof kolem textu, nebo je klíčové slovo napsané špatně.`;
  }

  if (/incomplete input/i.test(m)) {
    return "Dotaz vypadá nedopsaně – zkontroluj, jestli máš uzavřené apostrofy a závorky.";
  }

  return m;
}

/**
 * Proč dotaz nesedí – konkrétně, ne „zkus to znovu“.
 *
 * Žák u kurzu sedí sám (doma, nebo když učitel obchází třídu), takže hláška je
 * jediná zpětná vazba, kterou dostane. Máme jeho i referenční výsledek, tak
 * umíme říct rozdíl: počet řádků, počet sloupců, pořadí. Nikdy neprozradí
 * hodnoty – od toho je tlačítko s řešením.
 */
/** Má dotaz podmínku WHERE? (na radu „oprav podmínku" musí nějaká existovat) */
const maWhere = (q: string) => /\bwhere\b/i.test(q);
/** Je v dotazu textová hodnota v apostrofech? */
const maText = (q: string) => /'[^']*'/.test(q);

export function diffMessage(
  mine: Rows | null,
  ref: Rows | null,
  ordered: boolean,
  /** Úkol s INSERT/UPDATE/DELETE – porovnává se stav tabulky, ne výstup dotazu. */
  mutating = false,
  /** Dotazy žáka a reference – bez nich se rada o podmínce jen hádá. */
  dotazy?: { zak: string; ref: string },
): string {
  const mv = mine?.values ?? [];
  const rv = ref?.values ?? [];
  const zakMaWhere = dotazy ? maWhere(dotazy.zak) : true;
  const refMaWhere = dotazy ? maWhere(dotazy.ref) : true;

  if (mv.length === 0 && rv.length > 0) {
    if (mutating) {
      return `Po tvém příkazu je tabulka prázdná, ale zůstat v ní mělo ${rv.length} ${radky(rv.length)}. Nejspíš ti chybí WHERE – bez něj příkaz zasáhne úplně všechny řádky.`;
    }
    if (!zakMaWhere) {
      return `Tvůj dotaz nevrátil žádný řádek, správně jich je ${rv.length}. Podmínku v něm nemáš, takže se podívej, jestli vybíráš ze správné tabulky.`;
    }
    // Nejčastější tichá past: SQLite u českých znaků rozlišuje velikost písmen,
    // takže 'čapek' nenajde nic a hláška o „přísné podmínce" by mátla.
    const velikost = dotazy && maText(dotazy.zak)
      ? " Pozor i na velká písmena – 'Čapek' a 'čapek' jsou pro databázi dvě různé hodnoty."
      : "";
    return `Tvůj dotaz nevrátil žádný řádek, správně jich je ${rv.length}. Podmínka ve WHERE je nejspíš moc přísná.${velikost}`;
  }
  if (mv.length !== rv.length) {
    if (mutating) {
      // Směr chyby se u INSERTu a DELETu obrací, tak ho neuhodneme – jen počty.
      return `Po tvém příkazu má tabulka ${mv.length} ${radky(mv.length)}, správně jich má být ${rv.length}. Zkontroluj podmínku, příkaz zasáhl jiné řádky, než měl.`;
    }
    // Radit „oprav podmínku" tomu, kdo žádnou nenapsal, je matoucí – takový
    // žák si nejspíš spletl tabulku (klasika: opíše ukázku z výkladu).
    let konec: string;
    if (!zakMaWhere && !refMaWhere) {
      konec = " Zkontroluj, jestli vybíráš ze správné tabulky.";
    } else if (!zakMaWhere) {
      konec = " Zatím nemáš žádnou podmínku – bez WHERE dostaneš celou tabulku.";
    } else {
      konec =
        mv.length > rv.length
          ? " Podmínku máš, ale pouští dál moc řádků."
          : " Podmínka nejspíš odfiltrovala i řádky, které tam patří.";
    }
    return `Vrátil jsi ${mv.length} ${radky(mv.length)}, správně jich je ${rv.length}.${konec}`;
  }

  const mc = mv[0]?.length ?? 0;
  const rc = rv[0]?.length ?? 0;
  if (mc !== rc) {
    return `Řádků máš správně ${mv.length}, ale vypisuješ ${mc} ${sloupce(mc)} místo ${rc}. Zkontroluj, co máš za SELECT.`;
  }

  // Stejné názvy sloupců v jiném pořadí = jediná chyba je pořadí za SELECT.
  // Pro verdikt se názvy schválně neporovnávají (žák smí psát knihy.nazev
  // i alias), ale pro diagnózu je to informace zadarmo.
  const mn = mine?.columns ?? [];
  const rn = ref?.columns ?? [];
  if (mn.length === rn.length && mn.length > 1) {
    const key = (xs: string[]) => [...xs].sort().join(" ");
    if (key(mn) === key(rn) && mn.join(" ") !== rn.join(" ")) {
      return "Sloupce máš správné, jen prohozené. Za SELECT je vypiš v pořadí, v jakém je chce úkol.";
    }
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
      "Málokdy potřebuješ úplně všechno. Za SELECT vyjmenuj jen sloupce, které tě zajímají, oddělené čárkou – výsledek je přehlednější. Na pořadí záleží: v jakém je napíšeš, v takovém se vypíšou.",
    example: "SELECT jmeno, trida FROM ctenari;",
    zadani: "Vypiš jen název a autora všech knih (v tomhle pořadí).",
    reference: "SELECT nazev, autor FROM knihy;",
    hint: "Za SELECT patří místo hvězdičky dva sloupce oddělené čárkou. Jak se přesně jmenují, najdeš v přehledu tabulek pod úkolem.",
  },
  {
    id: 3,
    title: "Podmínka WHERE",
    teach:
      "WHERE pustí do výsledku jen řádky, které splní podmínku. Čísla porovnáváš pomocí =, >, <, >=, <=. Texty piš do apostrofů, např. zanr = 'poezie' – bez nich by SQL hledalo sloupec toho jména. Podmínky se dají spojovat: AND platí, když sedí obě, OR když stačí jedna.",
    example: "SELECT nazev FROM knihy WHERE zanr = 'poezie';",
    zadani: "Vypiš název a rok knih vydaných po roce 1900.",
    reference: "SELECT nazev, rok FROM knihy WHERE rok > 1900;",
    hint: "„Po roce 1900“ znamená, že rok musí být větší. A všimni si, že vypsat máš dva sloupce, ne jeden.",
    bonus: {
      zadani: "Vypiš názvy knih, které jsou zároveň žánru román a zároveň dostupné (dostupna = 1).",
      reference: "SELECT nazev FROM knihy WHERE zanr = 'román' AND dostupna = 1;",
      hint: "Obě podmínky spoj slovem AND. Pozor na apostrofy u textu – u čísla se nepíšou.",
    },
  },
  {
    id: 4,
    title: "Hledání podle části textu LIKE",
    teach:
      "Rovnítko najde jen přesnou shodu. Když víš jen část textu, použij LIKE a znak % jako „tady může být cokoli“. 'A%' znamená začíná na A, '%ová' končí na ová, '%Čapek%' obsahuje Čapek kdekoli.",
    example: "SELECT jmeno FROM ctenari WHERE jmeno LIKE 'A%';",
    zadani: "Vypiš název a autora knih, které napsal někdo s příjmením Čapek.",
    reference: "SELECT nazev, autor FROM knihy WHERE autor LIKE '%Čapek%';",
    hint: "Před příjmením je křestní jméno a za ním nic – ale to nemusíš řešit, když dáš procento z obou stran.",
  },
  {
    id: 5,
    title: "Řazení ORDER BY",
    teach:
      "ORDER BY seřadí výsledek podle zadaného sloupce od nejmenšího; pro opačné pořadí přidej DESC. Řadit jde i text – ten se seřadí podle abecedy. Krásně se to kombinuje s WHERE: podmínka se píše vždycky dřív než řazení.",
    example: "SELECT nazev, pocet_stran FROM knihy ORDER BY pocet_stran DESC;",
    zadani:
      "Vypiš název a rok dostupných knih (dostupna = 1), seřazené podle roku vydání od nejstarší.",
    reference: "SELECT nazev, rok FROM knihy WHERE dostupna = 1 ORDER BY rok;",
    hint: "V jednom dotazu potřebuješ podmínku i řazení. Podmínka se píše dřív. „Od nejstarší“ je běžné pořadí od nejmenšího, takže DESC nepotřebuješ.",
    bonus: {
      zadani: "Vypiš názvy všech knih seřazené podle abecedy.",
      reference: "SELECT nazev FROM knihy ORDER BY nazev;",
      hint: "Řadit se dá i podle textového sloupce – zápis je úplně stejný jako u čísel.",
    },
  },
  {
    id: 6,
    title: "Počítání COUNT",
    teach:
      "Agregační funkce udělají z mnoha řádků jedno číslo. COUNT(*) vrátí počet řádků výsledku – hodí se na otázky typu „kolik…“.",
    example: "SELECT COUNT(*) FROM ctenari;",
    zadani: "Zjisti, kolik knih je celkem v databázi.",
    reference: "SELECT COUNT(*) FROM knihy;",
    hint: "Je to přesně dotaz z příkladu, jen nad jinou tabulkou.",
  },
  {
    id: 7,
    title: "Průměr AVG",
    teach:
      "AVG(sloupec) spočítá průměr hodnot ve sloupci. Ze stejné rodiny jsou SUM (součet), MIN (nejmenší) a MAX (největší).",
    example: "SELECT MAX(rok) FROM knihy;",
    zadani: "Zjisti průměrný počet stran knih.",
    reference: "SELECT AVG(pocet_stran) FROM knihy;",
    hint: "Funkci napiš stejně jako MAX v příkladu – jen se jmenuje jinak a počítá z jiného sloupce.",
  },
  {
    id: 8,
    title: "Skupiny GROUP BY",
    teach:
      "GROUP BY seskupí řádky se stejnou hodnotou a agregace se spočítá pro každou skupinu zvlášť. Typicky: „kolik čeho“ – počty po kategoriích. Sloupci s funkcí se hodí dát jméno pomocí AS, jinak se v hlavičce výsledku objeví doslova COUNT(*).",
    example: "SELECT trida, COUNT(*) AS pocet FROM ctenari GROUP BY trida;",
    zadani: "U každého žánru vypiš jeho název a počet knih, které do něj patří.",
    reference: "SELECT zanr, COUNT(*) AS pocet FROM knihy GROUP BY zanr;",
    hint: "Příklad počítá čtenáře po třídách, ty potřebuješ knihy po žánrech. Za SELECT patří dvě věci: podle čeho seskupuješ a kolik jich je.",
    bonus: {
      zadani: "U každého žánru vypiš jeho název a průměrný počet stran.",
      reference: "SELECT zanr, AVG(pocet_stran) AS prumer FROM knihy GROUP BY zanr;",
      hint: "Stejný dotaz jako předtím, jen místo počítání řádků použij funkci na průměr z minulé lekce.",
    },
  },
  {
    id: 9,
    title: "Propojení dvou tabulek JOIN",
    teach:
      "Data bývají rozdělená do víc tabulek propojených klíči – výpůjčka si pamatuje jen ID knihy a ID čtenáře, ne celé názvy. JOIN tabulky spojí: JOIN tabulka ON podmínka, kde podmínka je rovnost klíčů. Když se sloupec jmenuje stejně ve víc tabulkách, napiš ho i s tabulkou: knihy.nazev.",
    example:
      "SELECT vypujcky.datum_vypujcky, knihy.nazev FROM vypujcky " +
      "JOIN knihy ON vypujcky.kniha_id = knihy.id;",
    zadani: "Vypiš datum výpůjčky a jméno čtenáře, který si knihu půjčil.",
    reference:
      "SELECT vypujcky.datum_vypujcky, ctenari.jmeno FROM vypujcky " +
      "JOIN ctenari ON vypujcky.ctenar_id = ctenari.id;",
    hint: "Je to příklad se dvěma změnami: připojuješ tabulku ctenari a klíč se jmenuje ctenar_id.",
  },
  {
    id: 10,
    title: "Propojení tří tabulek",
    teach:
      "JOINů může být za sebou víc. Tabulka vypujcky drží obě ID naráz, takže se přes ni dá dostat od čtenáře ke knize. Každý další JOIN má svoje vlastní ON.",
    example:
      "SELECT vypujcky.datum_vypujcky, ctenari.jmeno FROM vypujcky " +
      "JOIN ctenari ON vypujcky.ctenar_id = ctenari.id;",
    zadani: "Vypiš, kdo si půjčil kterou knihu – jméno čtenáře a název knihy.",
    reference:
      "SELECT ctenari.jmeno, knihy.nazev FROM vypujcky " +
      "JOIN ctenari ON vypujcky.ctenar_id = ctenari.id " +
      "JOIN knihy ON vypujcky.kniha_id = knihy.id;",
    hint: "Začni od tabulky vypujcky jako v příkladu a připoj k ní druhou tabulku úplně stejným způsobem jako první. Ve výsledku chceš jen jméno a název.",
    bonus: {
      zadani: "Zjisti, kolik knih si každý čtenář půjčil – jméno a počet výpůjček.",
      reference:
        "SELECT ctenari.jmeno, COUNT(*) AS pocet FROM vypujcky " +
        "JOIN ctenari ON vypujcky.ctenar_id = ctenari.id GROUP BY ctenari.jmeno;",
      hint: "Spoj dvě věci, které už umíš: propojení tabulek z téhle lekce a seskupení z lekce 8.",
    },
  },
  {
    id: 11,
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
    id: 12,
    title: "Změna údaje UPDATE",
    teach:
      "UPDATE přepíše hodnoty v řádcích, které už v tabulce jsou. Za SET napíšeš, co se má změnit, a za WHERE, kterých řádků se to týká. Když WHERE vynecháš, změní se celá tabulka – to je nejčastější a nejdražší chyba v SQL.",
    example: "UPDATE ctenari SET trida = '2.A' WHERE id = 1;",
    zadani: "Kytice se vrátila do knihovny – nastav u ní dostupnost na 1.",
    reference: "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Kytice';",
    check: "SELECT nazev, dostupna FROM knihy ORDER BY nazev;",
    hint: "Měníš jediný sloupec u jediné knihy. Řádek najdeš podmínkou stejně jako u SELECTu – podle názvu. Bez WHERE bys zpřístupnil úplně všechno.",
    bonus: {
      zadani: "Obě dramata si právě někdo půjčil – nastav u všech knih žánru drama dostupnost na 0.",
      reference: "UPDATE knihy SET dostupna = 0 WHERE zanr = 'drama';",
      check: "SELECT nazev, dostupna FROM knihy ORDER BY nazev;",
      hint: "Podmínka tentokrát nesedí na jednu knihu, ale na dvě naráz – a to je v pořádku. UPDATE změní všechny řádky, které jí vyhoví.",
    },
  },
  {
    id: 13,
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
