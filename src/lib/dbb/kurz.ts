/**
 * Kurz SQL ve virtuálním DB Browseru.
 *
 * Lekce 1–13 se berou přímo z `LESSONS` (sqlExercise.ts) – na ně navazuje
 * tištěný pracovní list, plán hodin i řešení v bance, takže se text nesmí
 * rozejít. Tady se jen převádějí na seznam úkolů jako v SQLBoltu: hlavní úkol
 * a případně úloha navíc, obojí se odškrtne samo po spuštění dotazu.
 *
 * Lekce 14–19 jsou nové a patří k programu samotnému – navazují na „Úlohy –
 * DB Browser“ z banky. Úlohy 1 a 2 odtamtud („stejný dotaz, jiný program“)
 * tu nemají smysl, celý kurz už v DB Browseru běží; místo nich jsou lekce
 * o kartách Struktura databáze a Prohlížet data, které jsou pro žáka nové.
 */

import { LESSONS, type SqlTask } from "@/lib/sqlExercise";
import type { SqlResult } from "@/lib/sqljs";
import { KNIHOVNA } from "@/lib/dbb/soubory";

/** Co má kontrola k dispozici u úkolů, které se neověřují výsledkem dotazu. */
export type Kontext = {
  /** Název otevřeného souboru, nebo null, když je databáze zavřená. */
  otevreny: string | null;
  /** Dotaz nad otevřenou databází v paměti (i s neuloženými změnami). */
  dotazZive(sql: string): SqlResult | null;
  /** Dotaz nad tím, co je zapsané v souboru na disku. */
  dotazSoubor(nazev: string, sql: string): SqlResult | null;
  /** Soubory na disku. */
  soubory: string[];
  /** Co žák v programu udělal (karta, rozbalená tabulka, zavření bez uložení…). */
  udalosti: Set<string>;
  /** Co je teď vidět na kartě Prohlížet data. */
  prohlizeni: { tabulka: string; id: string[] } | null;
  /** Kolik různých SELECTů žák úspěšně spustil nad vlastní databází. */
  vlastniSelecty: number;
};

export type Hodnoceni = { ok: boolean; proc?: string };

export type Kontrola =
  /** Výsledek dotazu se porovná s referenčním. U lekcí 1–13 nad čistou knihovnou. */
  | { druh: "dotaz"; reference: string; nadCistou: boolean }
  /** INSERT/UPDATE/DELETE: porovná se stav tabulky po příkazu, na čistých kopiích. */
  | { druh: "zmena"; reference: string; check: string }
  /** Stav programu nebo souboru. */
  | { druh: "stav"; test: (k: Kontext) => Hodnoceni };

export type UkolKurzu = {
  /** „3“ hlavní úkol lekce 3, „3b“ úloha navíc, „16a“ úkol nové lekce. */
  klic: string;
  zadani: string;
  hint: string;
  /** Co ukáže tlačítko Ukázat řešení. U úkolů bez SQL popis postupu. */
  reseni: string;
  /** Řešení je SQL, které jde vložit do editoru. */
  reseniJeSql: boolean;
  /** Nepovinná úloha – do „Hotovo“ se nepočítá. */
  navic?: boolean;
  kontrola: Kontrola;
};

export type LekceKurzu = {
  id: number;
  title: string;
  teach: string;
  example?: string;
  /** Tabulka, jejíž data se ukážou na kartě Spustit SQL, než žák poprvé něco spustí. */
  tabulka?: string;
  /** Lekce pracuje s knihovnou (1–18); poslední s vlastní databází. */
  knihovna: boolean;
  ukoly: UkolKurzu[];
};

/** První tabulka, se kterou dotaz pracuje (za FROM, INTO nebo UPDATE). */
export function hlavniTabulka(sql: string): string | undefined {
  const m = sql.match(/\b(?:from|into|update)\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  return m ? m[1] : undefined;
}

function zKurzu(t: SqlTask, klic: string, navic: boolean): UkolKurzu {
  return {
    klic,
    zadani: t.zadani,
    hint: t.hint,
    reseni: t.reference,
    reseniJeSql: true,
    navic: navic || undefined,
    kontrola: t.check
      ? { druh: "zmena", reference: t.reference, check: t.check }
      : { druh: "dotaz", reference: t.reference, nadCistou: true },
  };
}

/**
 * Výklad lekce 13 mluví o tlačítku webového kurzu, které databázi vrátí do
 * původního stavu. Tady tu práci dělá Vrátit změny – a jen do posledního zápisu.
 */
function vyklad(l: (typeof LESSONS)[number]): string {
  if (l.id !== 13) return l.teach;
  return l.teach.replace(
    /a proto má tenhle kurz tlačítko[^.]*\./,
    "a proto má DB Browser tlačítko Vrátit změny: dokud změny nezapíšeš, zahodí je.",
  );
}

const PUVODNI: LekceKurzu[] = LESSONS.map((l) => ({
  id: l.id,
  title: l.title,
  teach: vyklad(l),
  example: l.example,
  tabulka: hlavniTabulka(l.reference),
  knihovna: true,
  ukoly: [zKurzu(l, String(l.id), false)].concat(l.bonus ? [zKurzu(l.bonus, `${l.id}b`, true)] : []),
}));

/* ─────────────────────────── pomocné testy stavu ─────────────────────────── */

const hodnoty = (r: SqlResult | null) => (r ? r.values.map((v) => v.map((c) => String(c))) : []);
const stejne = (a: string[][], b: string[][]) => JSON.stringify(a) === JSON.stringify(b);

const HODNOCENI = "SELECT kniha_id, hvezdy FROM hodnoceni ORDER BY kniha_id";
const HODNOCENI_SPRAVNE = [
  ["1", "5"],
  ["4", "4"],
  ["8", "3"],
];

/** Tabulka hodnoceni podle zadání lekce 17 – s vysvětlením, co chybí. */
function testTabulkyHodnoceni(k: Kontext): Hodnoceni {
  if (k.otevreny !== KNIHOVNA) return { ok: false, proc: "Otevři databázi knihovna.db – tabulka patří do ní." };
  const sloupce = k.dotazZive("PRAGMA table_info(hodnoceni)");
  if (!sloupce || sloupce.values.length === 0) {
    return { ok: false, proc: "Tabulka hodnoceni v databázi zatím není." };
  }
  // table_info: cid, name, type, notnull, dflt_value, pk
  const podleNazvu: Record<string, unknown[]> = {};
  for (const r of sloupce.values) podleNazvu[String(r[1]).toLowerCase()] = r;
  for (const nazev of ["id", "kniha_id", "hvezdy"]) {
    if (!podleNazvu[nazev]) return { ok: false, proc: `V tabulce chybí sloupec ${nazev}.` };
    if (String(podleNazvu[nazev][2]).toUpperCase().indexOf("INT") === -1) {
      return { ok: false, proc: `Sloupec ${nazev} má mít typ INTEGER.` };
    }
  }
  if (Number(podleNazvu.id[5]) !== 1) return { ok: false, proc: "Sloupec id má být PRIMARY KEY." };
  const klice = k.dotazZive("PRAGMA foreign_key_list(hodnoceni)");
  // foreign_key_list: id, seq, table, from, to, …
  const odkaz = klice
    ? klice.values.some((r) => String(r[2]).toLowerCase() === "knihy" && String(r[3]).toLowerCase() === "kniha_id")
    : false;
  if (!odkaz) {
    return { ok: false, proc: "Sloupec kniha_id má odkazovat na knihy – doplň REFERENCES knihy(id)." };
  }
  return { ok: true };
}

/** Vlastní soubory na disku (všechno kromě knihovny). */
const vlastni = (k: Kontext) => k.soubory.filter((s) => s !== KNIHOVNA);

/** Tabulky vlastního souboru s počtem řádků, jak jsou zapsané na disku. */
function tabulkySouboru(k: Kontext, soubor: string): { nazev: string; radku: number }[] {
  const t = k.dotazSoubor(soubor, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
  return hodnoty(t).map(([nazev]) => {
    const pocet = k.dotazSoubor(soubor, `SELECT COUNT(*) FROM "${nazev.replace(/"/g, '""')}"`);
    return { nazev, radku: Number(hodnoty(pocet)[0]?.[0] ?? 0) };
  });
}

/* ─────────────────────────────── nové lekce ─────────────────────────────── */

const NOVE: LekceKurzu[] = [
  {
    id: 14,
    title: "Program DB Browser a Struktura databáze",
    teach:
      "Celou dobu pracuješ v napodobenině programu DB Browser for SQLite – toho, ve kterém se s databázemi pracuje doopravdy. Dotazy z lekcí 1–13 v něm fungují beze změny, pod ním je pořád stejné SQLite. Nové je okolí: karta Struktura databáze ukazuje, jaké tabulky databáze má, z jakých sloupců se skládají a jakého jsou typu. INTEGER je celé číslo, TEXT je text.",
    tabulka: "vypujcky",
    knihovna: true,
    ukoly: [
      {
        klic: "14a",
        zadani: "Přepni na kartu Struktura databáze a rozbal tabulku knihy.",
        hint: "Karty jsou nahoře pod lištou s tlačítky. Tabulku rozbalíš šipkou vlevo od jejího názvu.",
        reseni: "Klikni na kartu Struktura databáze, pak na šipku vedle Tabulky a nakonec na šipku vedle knihy.",
        reseniJeSql: false,
        kontrola: {
          druh: "stav",
          test: (k) => ({ ok: k.udalosti.has("strom:knihy") }),
        },
      },
      {
        klic: "14b",
        zadani:
          "Ve struktuře najdi dva sloupce tabulky vypujcky, které odkazují do jiných tabulek, a na kartě Spustit SQL vypiš jen tyhle dva sloupce.",
        hint: "Odkaz do jiné tabulky prozradí konec názvu _id a slovo REFERENCES ve sloupci Schéma.",
        reseni: "SELECT kniha_id, ctenar_id FROM vypujcky;",
        reseniJeSql: true,
        kontrola: { druh: "dotaz", reference: "SELECT kniha_id, ctenar_id FROM vypujcky;", nadCistou: true },
      },
    ],
  },
  {
    id: 15,
    title: "Prohlížet data: tabulka jako v Excelu",
    teach:
      "Karta Prohlížet data ukáže obsah tabulky bez psaní dotazu. Tabulku vybereš vlevo nahoře a kliknutím na záhlaví sloupce řadíš. Do políčka Filtr pod záhlavím napíšeš, co hledáš: kus textu, nebo podmínku jako >1900. Dvojklikem buňku přepíšeš a program za tebe pošle databázi příkaz UPDATE – uvidíš ho v panelu Log SQL.",
    tabulka: "knihy",
    knihovna: true,
    ukoly: [
      {
        klic: "15a",
        zadani:
          "Na kartě Prohlížet data ukaž tabulku knihy a filtrem ve sloupci rok nech jen knihy vydané po roce 1900.",
        hint: "Do políčka Filtr pod záhlavím sloupce rok napiš podmínku stejně jako za WHERE, jen bez názvu sloupce.",
        reseni: "Vyber tabulku knihy a do filtru pod sloupcem rok napiš >1900.",
        reseniJeSql: false,
        kontrola: {
          druh: "stav",
          test: (k) => {
            if (!k.prohlizeni || k.prohlizeni.tabulka !== "knihy") return { ok: false };
            const ocekavane = hodnoty(k.dotazZive("SELECT id FROM knihy WHERE rok > 1900 ORDER BY id")).map((r) => r[0]);
            const videt = k.prohlizeni.id.slice().sort((a, b) => Number(a) - Number(b));
            return { ok: ocekavane.length > 0 && stejne([videt], [ocekavane]) };
          },
        },
      },
      {
        klic: "15b",
        zadani: "Eva Marková přestoupila do 1.B. Oprav jí třídu přímo v mřížce tabulky ctenari.",
        hint: "Vyber tabulku ctenari, dvakrát klikni na buňku s třídou Evy Markové, přepiš ji a potvrď Enterem.",
        reseni: "Tabulka ctenari → dvojklik na 1.A u Evy Markové → napiš 1.B → Enter.",
        reseniJeSql: false,
        kontrola: {
          druh: "stav",
          test: (k) => {
            if (k.otevreny !== KNIHOVNA) return { ok: false };
            const r = hodnoty(k.dotazZive("SELECT trida FROM ctenari WHERE jmeno = 'Eva Marková'"));
            return { ok: r.length === 1 && r[0][0] === "1.B" };
          },
        },
      },
    ],
  },
  {
    id: 16,
    title: "Změny se musí zapsat",
    teach:
      "Databáze je soubor na disku – tady knihovna.db ve složce Stažené soubory. Co změníš, je zatím jen v paměti programu; poznáš to podle toho, že tlačítka Zapsat změny a Vrátit změny přestanou být šedá. Do souboru se to dostane až přes Soubor → Zapsat změny (Ctrl+S). Když databázi zavřeš a změny nezapíšeš, jsou pryč. Vrátit změny naopak zahodí všechno, co vzniklo od posledního zápisu.",
    tabulka: "knihy",
    knihovna: true,
    ukoly: [
      {
        klic: "16a",
        zadani:
          "Temno se vrátilo do knihovny – nastav mu dostupna na 1. Pak databázi zavři BEZ uložení (Soubor → Zavřít databázi → Neukládat), znovu ji otevři a podívej se, že změna zmizela.",
        hint: "Příkaz UPDATE znáš z lekce 12. Databázi znovu otevřeš přes Soubor → Otevřít databázi.",
        reseni:
          "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Temno';  → Soubor → Zavřít databázi → Neukládat → Soubor → Otevřít databázi → knihovna.db",
        reseniJeSql: false,
        kontrola: {
          druh: "stav",
          test: (k) => ({ ok: k.udalosti.has("znovu-otevreno-po-zahozeni") }),
        },
      },
      {
        klic: "16b",
        zadani:
          "Udělej změnu znovu a tentokrát ji zapiš (Ctrl+S). Když teď databázi zavřeš a otevřeš, Temno zůstane dostupné.",
        hint: "Zapsat změny je v nabídce Soubor i jako tlačítko na liště nahoře.",
        reseni: "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Temno';  → Soubor → Zapsat změny",
        reseniJeSql: false,
        kontrola: {
          druh: "stav",
          test: (k) => {
            const r = hodnoty(k.dotazSoubor(KNIHOVNA, "SELECT dostupna FROM knihy WHERE nazev = 'Temno'"));
            if (r.length === 1 && r[0][0] === "1") return { ok: true };
            const zive = hodnoty(k.dotazZive("SELECT dostupna FROM knihy WHERE nazev = 'Temno'"));
            if (zive.length === 1 && zive[0][0] === "1") {
              return { ok: false, proc: "Změna je zatím jen v paměti programu – ještě ji zapiš." };
            }
            return { ok: false };
          },
        },
      },
      {
        klic: "16c",
        navic: true,
        zadani: "Změň cokoli jiného a vyzkoušej Vrátit změny – databáze se vrátí do stavu po posledním zápisu.",
        hint: "Vrátit změny je na liště hned vedle Zapsat změny.",
        reseni: "Třeba UPDATE ctenari SET trida = '4.A';  → Soubor → Vrátit změny",
        reseniJeSql: false,
        kontrola: { druh: "stav", test: (k) => ({ ok: k.udalosti.has("vraceno") }) },
      },
    ],
  },
  {
    id: 17,
    title: "Vlastní tabulka CREATE TABLE",
    teach:
      "Zatím jsi pracoval(a) s hotovými tabulkami. Novou založí příkaz CREATE TABLE: za názvem tabulky jsou v závorce sloupce a u každého jeho typ. PRIMARY KEY označí sloupec, který jednoznačně určuje řádek. REFERENCES tabulka(sloupec) udělá ze sloupce odkaz do jiné tabulky – cizí klíč. Stejnou práci udělá i tlačítko Vytvořit tabulku na kartě Struktura databáze.",
    example: "CREATE TABLE autori (\n  id INTEGER PRIMARY KEY,\n  jmeno TEXT NOT NULL\n);",
    knihovna: true,
    ukoly: [
      {
        klic: "17a",
        zadani:
          "Knihovna chce sbírat hodnocení knih. Vytvoř tabulku hodnoceni se sloupci id (INTEGER PRIMARY KEY), kniha_id (INTEGER, odkaz na knihy.id) a hvezdy (INTEGER).",
        hint: "Odkaz na knihy napíšeš za typ sloupce: kniha_id INTEGER REFERENCES knihy(id).",
        reseni: "CREATE TABLE hodnoceni (\n  id INTEGER PRIMARY KEY,\n  kniha_id INTEGER REFERENCES knihy(id),\n  hvezdy INTEGER\n);",
        reseniJeSql: true,
        kontrola: { druh: "stav", test: testTabulkyHodnoceni },
      },
      {
        klic: "17b",
        zadani:
          "Vlož do ní tři hodnocení: Babička (kniha 1) 5 hvězd, R.U.R. (kniha 4) 4 hvězdy a Krakatit (kniha 8) 3 hvězdy.",
        hint: "id vynechej – u INTEGER PRIMARY KEY ho databáze doplní sama. Víc řádků najednou: VALUES (…), (…), (…).",
        reseni: "INSERT INTO hodnoceni (kniha_id, hvezdy) VALUES (1, 5), (4, 4), (8, 3);",
        reseniJeSql: true,
        kontrola: {
          druh: "stav",
          test: (k) => {
            if (k.otevreny !== KNIHOVNA) return { ok: false };
            const r = hodnoty(k.dotazZive(HODNOCENI));
            if (stejne(r, HODNOCENI_SPRAVNE)) return { ok: true };
            if (r.length > 3) return { ok: false, proc: `V tabulce je ${r.length} hodnocení, mají být přesně tři. Přebytečná smaž, nebo použij Vrátit změny.` };
            return { ok: false };
          },
        },
      },
      {
        klic: "17c",
        zadani: "Zapiš změny, ať tabulka i hodnocení v souboru zůstanou.",
        hint: "Ctrl+S, nebo Soubor → Zapsat změny.",
        reseni: "Soubor → Zapsat změny",
        reseniJeSql: false,
        kontrola: {
          druh: "stav",
          test: (k) => ({ ok: stejne(hodnoty(k.dotazSoubor(KNIHOVNA, HODNOCENI)), HODNOCENI_SPRAVNE) }),
        },
      },
    ],
  },
  {
    id: 18,
    title: "Propoj svou tabulku s hotovou",
    teach:
      "JOIN znáš z lekcí 9 a 10. Teď ho poprvé píšeš přes klíč, který jsi navrhl(a) sám: hodnoceni.kniha_id ukazuje na knihy.id. Postup je stejný – za ON napíšeš, které dva sloupce k sobě patří.",
    example:
      "SELECT ctenari.jmeno, vypujcky.datum_vypujcky\nFROM vypujcky\nJOIN ctenari ON ctenari.id = vypujcky.ctenar_id;",
    tabulka: "hodnoceni",
    knihovna: true,
    ukoly: [
      {
        klic: "18a",
        zadani: "U každého hodnocení vypiš název knihy a počet hvězd.",
        hint: "Vybírej z hodnoceni a připoj knihy: JOIN knihy ON knihy.id = hodnoceni.kniha_id.",
        reseni:
          "SELECT knihy.nazev, hodnoceni.hvezdy\nFROM hodnoceni\nJOIN knihy ON knihy.id = hodnoceni.kniha_id;",
        reseniJeSql: true,
        kontrola: {
          druh: "dotaz",
          reference: "SELECT knihy.nazev, hodnoceni.hvezdy FROM hodnoceni JOIN knihy ON knihy.id = hodnoceni.kniha_id;",
          nadCistou: false,
        },
      },
      {
        klic: "18b",
        navic: true,
        zadani: "Seřaď je od nejlépe hodnocené knihy.",
        hint: "Řadit sestupně: ORDER BY … DESC.",
        reseni:
          "SELECT knihy.nazev, hodnoceni.hvezdy\nFROM hodnoceni\nJOIN knihy ON knihy.id = hodnoceni.kniha_id\nORDER BY hodnoceni.hvezdy DESC;",
        reseniJeSql: true,
        kontrola: {
          druh: "dotaz",
          reference:
            "SELECT knihy.nazev, hodnoceni.hvezdy FROM hodnoceni JOIN knihy ON knihy.id = hodnoceni.kniha_id ORDER BY hodnoceni.hvezdy DESC;",
          nadCistou: false,
        },
      },
    ],
  },
  {
    id: 19,
    title: "Vlastní databáze",
    teach:
      "Na závěr si postavíš databázi od nuly. Soubor → Nová databáze se zeptá na název souboru a hned nabídne okno pro první tabulku – můžeš ji naklikat, nebo okno zavřít a napsat CREATE TABLE. Téma je na tobě: hry, sport, hudba, auta… Na konci nezapomeň změny zapsat.",
    knihovna: false,
    ukoly: [
      {
        klic: "19a",
        zadani: "Založ novou databázi (Soubor → Nová databáze).",
        hint: "Název souboru vymysli sám – třeba hry.db.",
        reseni: "Soubor → Nová databáze → napiš název → Uložit",
        reseniJeSql: false,
        kontrola: { druh: "stav", test: (k) => ({ ok: vlastni(k).length > 0 }) },
      },
      {
        klic: "19b",
        zadani: "Vytvoř v ní aspoň jednu tabulku, vlož do ní aspoň 5 záznamů a změny zapiš.",
        hint: "Nejdřív CREATE TABLE (nebo tlačítko Vytvořit tabulku), pak INSERT INTO … VALUES a nakonec Ctrl+S.",
        reseni:
          "CREATE TABLE hry (id INTEGER PRIMARY KEY, nazev TEXT, rok INTEGER);\nINSERT INTO hry (nazev, rok) VALUES ('Minecraft', 2011), ('Tetris', 1984), ('Portal', 2007), ('Pac-Man', 1980), ('Doom', 1993);",
        reseniJeSql: true,
        kontrola: {
          druh: "stav",
          test: (k) => {
            for (const soubor of vlastni(k)) {
              if (tabulkySouboru(k, soubor).some((t) => t.radku >= 5)) return { ok: true };
            }
            if (k.otevreny && k.otevreny !== KNIHOVNA) {
              const zive = k.dotazZive("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
              if (hodnoty(zive).length > 0) {
                return { ok: false, proc: "V souboru zatím není tabulka s aspoň 5 záznamy. Nezapomněl(a) jsi zapsat změny?" };
              }
            }
            return { ok: false };
          },
        },
      },
      {
        klic: "19c",
        zadani: "Napiš nad svou databází dva vlastní SELECT dotazy, které dávají smysl.",
        hint: "Třeba všechny záznamy seřazené podle jednoho sloupce a pak jen ty, které splní podmínku.",
        reseni: "SELECT * FROM hry ORDER BY rok;\nSELECT nazev FROM hry WHERE rok > 2000;",
        reseniJeSql: true,
        kontrola: { druh: "stav", test: (k) => ({ ok: k.vlastniSelecty >= 2 }) },
      },
      {
        klic: "19d",
        navic: true,
        zadani: "Přidej druhou tabulku a propoj ji s první cizím klíčem (REFERENCES).",
        hint: "Stejně jako hodnoceni.kniha_id v lekci 17. Nezapomeň zapsat změny.",
        reseni:
          "CREATE TABLE hodnoceni_her (\n  id INTEGER PRIMARY KEY,\n  hra_id INTEGER REFERENCES hry(id),\n  body INTEGER\n);",
        reseniJeSql: true,
        kontrola: {
          druh: "stav",
          test: (k) => {
            for (const soubor of vlastni(k)) {
              for (const t of tabulkySouboru(k, soubor)) {
                const fk = k.dotazSoubor(soubor, `PRAGMA foreign_key_list("${t.nazev.replace(/"/g, '""')}")`);
                if (fk && fk.values.length > 0) return { ok: true };
              }
            }
            return { ok: false };
          },
        },
      },
    ],
  },
];

export const KURZ: LekceKurzu[] = PUVODNI.concat(NOVE);

/** Povinné úkoly lekce (bez úloh navíc). */
export const povinne = (l: LekceKurzu) => l.ukoly.filter((u) => !u.navic);

/** Je lekce hotová? Všechny povinné úkoly splněné. */
export function lekceHotova(l: LekceKurzu, splneno: Set<string>): boolean {
  return povinne(l).every((u) => splneno.has(u.klic));
}
