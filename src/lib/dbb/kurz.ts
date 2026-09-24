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
import { SADY as SADY_LEKCI } from "@/lib/dbb/sady";
import { prelozLekci } from "@/lib/dbb/anglicky";
import { t } from "@/lib/dbb/jazyk";

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

/** Databáze, nad kterou úkol běží (výchozí je knihovna). Procvičování má vlastní. */
export type Databaze = { soubor: string; schema: string };

export type Kontrola =
  /** Výsledek dotazu se porovná s referenčním. U lekcí 1–13 nad čistou knihovnou. */
  | { druh: "dotaz"; reference: string; nadCistou: boolean; databaze?: Databaze }
  /** INSERT/UPDATE/DELETE: porovná se stav tabulky po příkazu, na čistých kopiích. */
  | { druh: "zmena"; reference: string; check: string; databaze?: Databaze }
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
  /** Na co úkol čeká – ukáže se u nesplněného úkolu, ať žák ví, co program sleduje. */
  ceka?: string;
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
  /**
   * Lekce počítá s PŮVODNÍ knihovnou (1–17). Když je soubor změněný z minula
   * (druhý průchod, další žák na stejném počítači), program při vstupu
   * nabídne obnovení – jinak by se úkoly odškrtly samy a v lekci 16 by
   * změna „nezmizela“.
   */
  cista?: boolean;
  /** Lekce s vlastní databází (procvičování, detektivka) – program ji při vstupu otevře. */
  databaze?: Databaze;
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
  cista: true,
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
  if (k.otevreny !== KNIHOVNA) return { ok: false, proc: t("Otevři databázi knihovna.db – tabulka patří do ní.", "Open the knihovna.db database – the table belongs in it.") };
  const sloupce = k.dotazZive("PRAGMA table_info(hodnoceni)");
  if (!sloupce || sloupce.values.length === 0) {
    return { ok: false, proc: t("Tabulka hodnoceni v databázi zatím není.", "There is no hodnoceni table in the database yet.") };
  }
  // table_info: cid, name, type, notnull, dflt_value, pk
  const podleNazvu: Record<string, unknown[]> = {};
  for (const r of sloupce.values) podleNazvu[String(r[1]).toLowerCase()] = r;
  for (const nazev of ["id", "kniha_id", "hvezdy"]) {
    if (!podleNazvu[nazev]) return { ok: false, proc: t(`V tabulce chybí sloupec ${nazev}.`, `The table is missing the column ${nazev}.`) };
    if (String(podleNazvu[nazev][2]).toUpperCase().indexOf("INT") === -1) {
      return { ok: false, proc: t(`Sloupec ${nazev} má mít typ INTEGER.`, `The column ${nazev} should be of type INTEGER.`) };
    }
  }
  if (Number(podleNazvu.id[5]) !== 1) return { ok: false, proc: t("Sloupec id má být PRIMARY KEY.", "The id column should be the PRIMARY KEY.") };
  const klice = k.dotazZive("PRAGMA foreign_key_list(hodnoceni)");
  // foreign_key_list: id, seq, table, from, to, …
  const odkaz = klice
    ? klice.values.some((r) => String(r[2]).toLowerCase() === "knihy" && String(r[3]).toLowerCase() === "kniha_id")
    : false;
  if (!odkaz) {
    return {
      ok: false,
      proc: t(
        "Sloupec kniha_id má odkazovat na knihy – doplň REFERENCES knihy(id).",
        "The kniha_id column should point to knihy – add REFERENCES knihy(id).",
      ),
    };
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

/** Sloupce tabulky bez datového typu (CREATE TABLE t (a, b) typy nemá). */
function sloupceBezTypu(k: Kontext, soubor: string, tabulka: string): string[] {
  const info = k.dotazSoubor(soubor, `PRAGMA table_info("${tabulka.replace(/"/g, '""')}")`);
  return hodnoty(info)
    .filter((r) => !r[2] || r[2] === "null")
    .map((r) => r[1]);
}

/**
 * Lekce 19, úloha navíc: druhá tabulka propojená cizím klíčem, který dává smysl –
 * odkazy vedou na existující řádky a aspoň jeden řádek se opravdu spojí JOINem.
 */
function testPropojeni(k: Kontext): Hodnoceni {
  let proc: string | undefined;
  for (const soubor of vlastni(k)) {
    for (const tab of tabulkySouboru(k, soubor)) {
      const q = (x: string) => `"${x.replace(/"/g, '""')}"`;
      const fk = hodnoty(k.dotazSoubor(soubor, `PRAGMA foreign_key_list(${q(tab.nazev)})`));
      if (!fk.length) continue;
      // foreign_key_list: id, seq, table, from, to, …
      const [, , cil, z, na] = fk[0];
      const chybne = hodnoty(k.dotazSoubor(soubor, `PRAGMA foreign_key_check(${q(tab.nazev)})`));
      if (chybne.length) {
        proc = t(
          `Cizí klíč máš, ale ${chybne.length === 1 ? "jeden řádek" : `${chybne.length} řádky`} v tabulce ${tab.nazev} ukazuje na řádek, který v tabulce ${cil} neexistuje.`,
          `You have a foreign key, but ${chybne.length === 1 ? "one row" : `${chybne.length} rows`} in the table ${tab.nazev} ${chybne.length === 1 ? "points" : "point"} to a row that doesn't exist in the table ${cil}.`,
        );
        continue;
      }
      const cilSloupec = na && na !== "null" ? na : "rowid";
      const spojene = hodnoty(
        k.dotazSoubor(soubor, `SELECT COUNT(*) FROM ${q(tab.nazev)} JOIN ${q(cil)} ON ${q(tab.nazev)}.${q(z)} = ${q(cil)}.${q(cilSloupec)}`),
      );
      if (Number(spojene[0] ? spojene[0][0] : 0) > 0) return { ok: true };
      proc = t(
        `Cizí klíč v tabulce ${tab.nazev} máš, ale žádný její řádek se zatím nespojí s tabulkou ${cil} – vlož řádek, který na ni odkazuje, a zapiš změny.`,
        `You have a foreign key in the table ${tab.nazev}, but none of its rows joins with the table ${cil} yet – insert a row that points to it and write the changes.`,
      );
    }
  }
  return { ok: false, proc };
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
    cista: true,
    ukoly: [
      {
        klic: "14a",
        zadani: "Přepni na kartu Struktura databáze a rozbal tabulku knihy.",
        hint: "Karty jsou nahoře pod lištou s tlačítky. Tabulku rozbalíš šipkou vlevo od jejího názvu.",
        reseni: "Klikni na kartu Struktura databáze, pak na šipku vedle Tabulky a nakonec na šipku vedle knihy.",
        reseniJeSql: false,
        ceka: "Čeká se, až na kartě Struktura databáze rozbalíš tabulku knihy.",
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
    cista: true,
    ukoly: [
      {
        klic: "15a",
        zadani:
          "Na kartě Prohlížet data ukaž tabulku knihy a filtrem ve sloupci rok nech jen knihy vydané po roce 1900.",
        hint: "Do políčka Filtr pod záhlavím sloupce rok napiš podmínku stejně jako za WHERE, jen bez názvu sloupce.",
        reseni: "Vyber tabulku knihy a do filtru pod sloupcem rok napiš >1900.",
        reseniJeSql: false,
        ceka: "Čeká se na filtr ve sloupci rok na kartě Prohlížet data.",
        kontrola: {
          druh: "stav",
          test: (k) => {
            // Filtr musí vzniknout v téhle lekci – pohled z dřívějška se nepočítá.
            if (!k.udalosti.has("filtr:knihy")) return { ok: false };
            if (!k.prohlizeni || k.prohlizeni.tabulka !== "knihy") return { ok: false };
            const ocekavane = hodnoty(k.dotazZive("SELECT id FROM knihy WHERE rok > 1900 ORDER BY id")).map((r) => r[0]);
            const videt = k.prohlizeni.id.slice().sort((a, b) => Number(a) - Number(b));
            if (!ocekavane.length) {
              // Po DELETE z lekcí 1–13 bez WHERE není co filtrovat (rada 24. 9. 2026).
              return {
                ok: false,
                proc: t(
                  "V otevřené knihovně teď není žádná kniha vydaná po roce 1900 – nejspíš zmizely nějakým DELETE. Vrať ji do původního stavu: Nápověda → Obnovit původní knihovna.db.",
                  "The open library has no books published after 1900 right now – a DELETE probably removed them. Restore it: Help → Restore Original knihovna.db.",
                ),
              };
            }
            return { ok: stejne([videt], [ocekavane]) };
          },
        },
      },
      {
        klic: "15b",
        zadani: "Eva Marková přestoupila do 1.B. Oprav jí třídu přímo v mřížce tabulky ctenari.",
        hint: "Vyber tabulku ctenari, dvakrát klikni na buňku s třídou Evy Markové, přepiš ji a potvrď Enterem.",
        reseni: "Tabulka ctenari → dvojklik na 1.A u Evy Markové → napiš 1.B → Enter.",
        reseniJeSql: false,
        ceka: "Čeká se, až v mřížce tabulky ctenari přepíšeš třídu Evy Markové.",
        kontrola: {
          druh: "stav",
          test: (k) => {
            if (k.otevreny !== KNIHOVNA) return { ok: false };
            // Úkol je o mřížce: bez úpravy buňky v téhle lekci se neodškrtne,
            // i kdyby Eva v 1.B už byla (z minula nebo přes UPDATE).
            if (!k.udalosti.has("upraveno:ctenari")) return { ok: false };
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
    cista: true,
    teach:
      "Databáze je soubor – tady knihovna.db, který kurz drží v tomhle prohlížeči (ve skutečném programu leží na disku). Co změníš, je zatím jen v paměti programu; poznáš to podle toho, že tlačítka Zapsat změny a Vrátit změny přestanou být šedá. Do souboru se to dostane až přes Soubor → Zapsat změny (Ctrl+S). Když databázi zavíráš s nezapsanými změnami, program se zeptá – tlačítko Uložit v tom dialogu udělá totéž co Zapsat změny, Neukládat je zahodí. Vrátit změny zahodí všechno, co vzniklo od posledního zápisu. Do skutečného počítače si soubor stáhneš přes Soubor → Uložit kopii do počítače.",
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
        ceka: "Čeká se na celý postup: změna Temna → Zavřít databázi → Neukládat → znovu otevřít.",
        kontrola: {
          druh: "stav",
          test: (k) => {
            // Odškrtne se, až změna po „Neukládat“ opravdu zmizí – ne za samotné zavření.
            if (k.udalosti.has("temno-zmizelo")) return { ok: true };
            if (k.udalosti.has("znovu-otevreno-po-zahozeni")) {
              return {
                ok: false,
                proc: t(
                  "Databázi jsi zavřel(a) a otevřel(a), ale Temno je dostupné pořád – v souboru bylo zapsané už z minula. Obnov původní knihovnu (Nápověda → Obnovit původní knihovna.db) a zkus to znovu.",
                  "You closed and reopened the database, but Temno is still available – it was already written in the file from before. Restore the original library (Help → Restore Original knihovna.db) and try again.",
                ),
              };
            }
            return { ok: false };
          },
        },
      },
      {
        klic: "16b",
        zadani:
          "Udělej změnu znovu a tentokrát ji zapiš (Ctrl+S). Když teď databázi zavřeš a otevřeš, Temno zůstane dostupné.",
        hint: "Zapsat změny je v nabídce Soubor i jako tlačítko na liště nahoře.",
        reseni: "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Temno';  → Soubor → Zapsat změny",
        reseniJeSql: false,
        ceka: "Čeká se, až změnu Temna zapíšeš do souboru.",
        kontrola: {
          druh: "stav",
          test: (k) => {
            const r = hodnoty(k.dotazSoubor(KNIHOVNA, "SELECT dostupna FROM knihy WHERE nazev = 'Temno'"));
            // Zápis musí proběhnout v téhle lekci, ne někdy dřív.
            if (r.length === 1 && r[0][0] === "1" && k.udalosti.has("zapsano")) return { ok: true };
            const zive = hodnoty(k.dotazZive("SELECT dostupna FROM knihy WHERE nazev = 'Temno'"));
            if (zive.length === 1 && zive[0][0] === "1") {
              return {
                ok: false,
                proc: t("Změna je zatím jen v paměti programu – ještě ji zapiš.", "The change is only in the program's memory so far – write it too."),
              };
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
        ceka: "Čeká se, až nějakou změnu vrátíš tlačítkem Vrátit změny.",
        kontrola: { druh: "stav", test: (k) => ({ ok: k.udalosti.has("vraceno") }) },
      },
    ],
  },
  {
    id: 17,
    title: "Vlastní tabulka CREATE TABLE",
    cista: true,
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
            if (r.length > 3) {
              return {
                ok: false,
                // Vrátit změny by zahodilo i nezapsanou tabulku z úkolu 17a (rada 24. 9. 2026).
                proc: t(
                  `V tabulce je ${r.length} hodnocení, mají být přesně tři – INSERT nejspíš proběhl víckrát. Přebytečná smaž příkazem DELETE FROM hodnoceni WHERE id > 3; (Vrátit změny nepoužívej, zahodilo by i tabulku).`,
                  `There are ${r.length} ratings in the table; there should be exactly three – the INSERT probably ran more than once. Delete the extra ones with DELETE FROM hodnoceni WHERE id > 3; (don't use Revert Changes, it would throw away the table too).`,
                ),
              };
            }
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
            let bezTypu: string | undefined;
            for (const soubor of vlastni(k)) {
              for (const tab of tabulkySouboru(k, soubor)) {
                if (tab.radku < 5) continue;
                // „Rozumné datové typy“ z Úloh: každý sloupec musí nějaký typ mít.
                const chybi = sloupceBezTypu(k, soubor, tab.nazev);
                if (!chybi.length) return { ok: true };
                bezTypu = t(
                  `V tabulce ${tab.nazev} nemá typ ${chybi.length === 1 ? "sloupec" : "sloupce"} ${chybi.join(", ")}. Doplň INTEGER, TEXT nebo REAL – tabulku založ znovu.`,
                  `In the table ${tab.nazev}, the ${chybi.length === 1 ? "column" : "columns"} ${chybi.join(", ")} ${chybi.length === 1 ? "has" : "have"} no type. Add INTEGER, TEXT or REAL – create the table again.`,
                );
              }
            }
            if (bezTypu) return { ok: false, proc: bezTypu };
            if (k.otevreny && k.otevreny !== KNIHOVNA) {
              const zive = k.dotazZive("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
              if (hodnoty(zive).length > 0) {
                return {
                  ok: false,
                  proc: t(
                    "V souboru zatím není tabulka s aspoň 5 záznamy. Nezapomněl(a) jsi zapsat změny?",
                    "There is no table with at least 5 records in the file yet. Did you forget to write the changes?",
                  ),
                };
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
        klic: "19e",
        zadani:
          "Stáhni svou databázi do počítače (Soubor → Uložit kopii do počítače) a hned ji odevzdej podle pokynů učitele – třeba do zadání v Teams. Nečekej na konec hodiny: po odhlášení může soubor ze Stažených souborů zmizet.",
        hint: "Stažený soubor najdeš ve složce Stažené soubory svého počítače. Otevřít ho jde i ve skutečném programu DB Browser for SQLite.",
        reseni: "Otevři svou databázi → Soubor → Uložit kopii do počítače",
        reseniJeSql: false,
        ceka: "Čeká se, až si svou databázi stáhneš do počítače.",
        kontrola: {
          druh: "stav",
          test: (k) => ({ ok: vlastni(k).some((s) => k.udalosti.has(`stazeno:${s}`)) }),
        },
      },
      {
        klic: "19d",
        navic: true,
        zadani: "Přidej druhou tabulku a propoj ji s první cizím klíčem (REFERENCES).",
        hint: "Stejně jako hodnoceni.kniha_id v lekci 17. Nezapomeň zapsat změny.",
        reseni:
          "CREATE TABLE hodnoceni_her (\n  id INTEGER PRIMARY KEY,\n  hra_id INTEGER REFERENCES hry(id),\n  body INTEGER\n);",
        reseniJeSql: true,
        ceka: "Čeká se na druhou tabulku s cizím klíčem, jejíž řádky se spojí s první tabulkou.",
        kontrola: { druh: "stav", test: testPropojeni },
      },
    ],
  },
];

export const KURZ: LekceKurzu[] = PUVODNI.concat(NOVE).map(prelozLekci);

export { SADY } from "@/lib/dbb/sady";

/** Kurz i lekce navíc (detektivka, procvičování) – pro vyhledání lekce podle čísla. */
export const VSECHNY_LEKCE: LekceKurzu[] = KURZ.concat(SADY_LEKCI.map((s) => s.lekce));

/** Soubor, se kterým lekce pracuje (knihovna, databáze sady), nebo null u vlastní databáze. */
export function souborLekce(l: LekceKurzu): string | null {
  if (l.databaze) return l.databaze.soubor;
  return l.knihovna ? KNIHOVNA : null;
}

/** Lekce podle hodin: dotazy SQL (1–13, první hodina) a práce v programu (14–19). */
export const LEKCE_DOTAZY = KURZ.filter((l) => l.id <= 13).map((l) => l.id);
export const LEKCE_PROGRAM = KURZ.filter((l) => l.id > 13).map((l) => l.id);

/**
 * Skóre rozdělené podle hodin. Samotné „9/19“ po první hodině vypadá jako
 * propadák, i když žák stihl, co měl – „Dotazy 9/13 · Program 0/6“ ne
 * (rada 24. 9. 2026).
 */
export function rozdelSkore(hotove: number[]): { dotazy: [number, number]; program: [number, number] } {
  const pocet = (ids: number[]) => ids.filter((id) => hotove.indexOf(id) !== -1).length;
  return {
    dotazy: [pocet(LEKCE_DOTAZY), LEKCE_DOTAZY.length],
    program: [pocet(LEKCE_PROGRAM), LEKCE_PROGRAM.length],
  };
}

/** Povinné úkoly lekce (bez úloh navíc). */
export const povinne = (l: LekceKurzu) => l.ukoly.filter((u) => !u.navic);

/** Je lekce hotová? Všechny povinné úkoly splněné. */
export function lekceHotova(l: LekceKurzu, splneno: Set<string>): boolean {
  return povinne(l).every((u) => splneno.has(u.klic));
}

/**
 * Co se stalo při novém otevření souboru, který se předtím zavřel s „Neukládat“.
 * Lekce 16 se odškrtne, až změna Temna opravdu zmizí: před zahozením bylo
 * dostupné (1), po otevření zase ne (0). Když bylo Temno dostupné už v souboru
 * z minula, nic nezmizí a úkol se neodškrtne.
 */
export function udalostiPoZnovuotevreni(temnoPred: string | null, temnoPo: string | null): string[] {
  const u = ["znovu-otevreno-po-zahozeni"];
  if (temnoPred === "1" && temnoPo === "0") u.push("temno-zmizelo");
  return u;
}

/** Co program ví o knihovně, když žák vstupuje do lekce. */
export type StavKnihovny = {
  /** Otisk knihovny při načtení stránky, když už tehdy nebyla původní (jinak null). */
  zmenenaPriNacteni: string | null;
  /** Žák už v téhle relaci (kartě prohlížeče) rozhodl – obnovil, nebo si nechal svou. */
  vyresenoVRelaci: boolean;
  /** Otisk, u kterého žák někdy dřív řekl „Pokračovat se svou“. */
  odmitnutyOtisk: string | null;
  /** Hodnota dostupna u Temna v souboru knihovna.db. */
  temnoVSouboru: string | null;
  lekce16Hotova: boolean;
};

/**
 * Má program při vstupu do lekce řešit stav knihovny? (rada 24. 9. 2026)
 *
 * Dřív se ptal při každém přechodu na lekci 1–17 a počítal i změny, které
 * žák udělal před minutou – INSERT v lekci 11, a v lekci 12 mu dialog řekl,
 * že knihovnu změnil „někdo před tebou“. Teď:
 *  - lekce 1–13 se kontrolují nad čistou kopií, stav knihovny jim je jedno,
 *  - lekce 16 potřebuje jen Temno nedostupné v souboru – když není a lekce
 *    ještě není hotová, knihovna se obnoví potichu,
 *  - lekce 14, 15 a 17 se zeptají jednou za relaci a jen tehdy, když
 *    knihovna nebyla původní už při načtení stránky (z minulé hodiny).
 */
export function coSKnihovnou(lekceId: number, s: StavKnihovny): "nic" | "zeptat" | "obnovit" {
  if (lekceId === 16) return !s.lekce16Hotova && s.temnoVSouboru === "1" ? "obnovit" : "nic";
  if (lekceId !== 14 && lekceId !== 15 && lekceId !== 17) return "nic";
  if (!s.zmenenaPriNacteni || s.vyresenoVRelaci || s.odmitnutyOtisk === s.zmenenaPriNacteni) return "nic";
  return "zeptat";
}
