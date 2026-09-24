/**
 * Detektivka, procvičování A/B, kód postupu a úloha z odkazu – nad skutečným
 * SQLite (sql.js, stejná verze jako v prohlížeči).
 *
 * Stejná pravidla jako u kurzu: řešení projde, prázdný dotaz, SELECT 1
 * ani prázdný výsledek ne.
 */

import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { SADY, KURZ, lekceHotova, type Kontext, type UkolKurzu, type Databaze } from "@/lib/dbb/kurz";
import { DETEKTIVKA } from "@/lib/dbb/sady";
import { vyhodnotDotaz } from "@/lib/dbb/kontrola";
import { rozdelPrikazy, spust, druhPrikazu } from "@/lib/dbb/prikazy";
import { zakoduj, dekoduj, najdiKody, sloucitPostupy, souhrnTridy, normalizujJmeno, type Postup } from "@/lib/dbb/kodPostupu";
import { splnenoZKodu, POVINNE_KLICE } from "@/lib/dbb/obnovaPostupu";
import { zakodujUlohu, dekodujUlohu, lekceZOdkazu, chybaDotazu, klicUlohy } from "@/lib/dbb/odkazUlohy";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import type { SqlDb, SqlDbSoubor, SqlResult } from "@/lib/sqljs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SQL: any;
beforeAll(async () => {
  SQL = await initSqlJs();
});

const cista = (schema: string): SqlDb => {
  const db = new SQL.Database();
  db.run(schema);
  return db;
};

const precti = (db: SqlDb, sql: string): SqlResult | null => {
  try {
    const r = db.exec(sql);
    return r.length ? r[r.length - 1] : { columns: [], values: [] };
  } catch {
    return null;
  }
};

/** Napodobenina programu s jedním souborem sady. */
class Program {
  disk: Record<string, Uint8Array> = {};
  ziva: SqlDbSoubor;
  udalosti = new Set<string>();
  prohlizeni: { tabulka: string; id: string[] } | null = null;

  constructor(private d: Databaze) {
    const db = cista(d.schema) as SqlDbSoubor;
    this.disk[d.soubor] = db.export();
    db.close();
    this.ziva = new SQL.Database(this.disk[d.soubor]);
  }

  zapis() {
    this.disk[this.d.soubor] = this.ziva.export();
    this.udalosti.add("zapsano");
  }

  kontext(): Kontext {
    return {
      otevreny: this.d.soubor,
      dotazZive: (sql) => precti(this.ziva, sql),
      dotazSoubor: (nazev, sql) => {
        const b = this.disk[nazev];
        if (!b) return null;
        const db = new SQL.Database(b);
        try {
          return precti(db, sql);
        } finally {
          db.close();
        }
      },
      soubory: Object.keys(this.disk),
      udalosti: this.udalosti,
      prohlizeni: this.prohlizeni,
      vlastniSelecty: 0,
    };
  }

  zkus(ukol: UkolKurzu, text: string, soubor = this.d.soubor): boolean {
    const beh = spust(this.ziva, rozdelPrikazy(text));
    if (!beh.ok || !beh.provedene.length) return false;
    const posledni = beh.provedene[beh.provedene.length - 1];
    const h = vyhodnotDotaz(
      ukol,
      {
        text: beh.provedene.map((p) => p.text).join("\n"),
        vysledek: beh.vysledek,
        soubor,
        menilData: beh.provedene.some((p) => druhPrikazu(p.text) === "data"),
        konciCtenim: druhPrikazu(posledni.text) === "cteni",
      },
      { cista, ziva: this.ziva },
    );
    return !!(h && h.ok);
  }

  stav(ukol: UkolKurzu) {
    if (ukol.kontrola.druh !== "stav") throw new Error(`${ukol.klic} není stavový úkol`);
    return ukol.kontrola.test(this.kontext());
  }
}

describe("detektivka a procvičování – úkoly ověřované dotazem", () => {
  for (const s of SADY) {
    const d = s.lekce.databaze!;
    for (const u of s.lekce.ukoly.filter((x) => x.kontrola.druh !== "stav")) {
      it(`${u.klic}: řešení projde, prázdný dotaz, SELECT 1 ani prázdný výsledek ne`, () => {
        expect(new Program(d).zkus(u, u.reseni)).toBe(true);
        expect(new Program(d).zkus(u, "")).toBe(false);
        expect(new Program(d).zkus(u, "SELECT 1;")).toBe(false);
        const tabulka = (u.reseni.match(/\b(?:from|into|update)\s+(\w+)/i) || [])[1];
        expect(new Program(d).zkus(u, `SELECT * FROM ${tabulka} WHERE 0;`)).toBe(false);
      });
    }
  }

  it("úkol nad jinou databází neprojde ani se správným dotazem", () => {
    const s = SADY.filter((x) => x.id === "dilna")[0];
    const u = s.lekce.ukoly[0];
    expect(new Program(s.lekce.databaze!).zkus(u, u.reseni, KNIHOVNA)).toBe(false);
  });

  it("detektivka má jediného pachatele", () => {
    const u = SADY.filter((x) => x.id === "detektivka")[0].lekce.ukoly.filter((x) => x.klic === "20f")[0];
    const db = cista(DETEKTIVKA.schema);
    const r = precti(db, u.reseni);
    db.close();
    expect(r && r.values).toEqual([["Radek Vondra"]]);
  });
});

describe("procvičování – práce v programu", () => {
  const ukol = (klic: string) => {
    for (const s of SADY) for (const u of s.lekce.ukoly) if (u.klic === klic) return { u, d: s.lekce.databaze! };
    throw new Error(`úkol ${klic} není`);
  };

  const filtry: [string, string, string][] = [
    ["A15", "dily", "SELECT id FROM dily WHERE material = 'ocel' ORDER BY id"],
    ["B15", "materialy", "SELECT id FROM materialy WHERE druh = 'deska' ORDER BY id"],
  ];
  for (const [klic, tabulka, dotaz] of filtry) {
    it(`${klic}: filtr odškrtne jen se správnými řádky a v téhle lekci`, () => {
      const { u, d } = ukol(klic);
      const p = new Program(d);
      const id = (precti(p.ziva, dotaz) as SqlResult).values.map((r) => String(r[0]));
      expect(id.length).toBeGreaterThan(0);
      p.prohlizeni = { tabulka, id };
      expect(p.stav(u).ok).toBe(false); // bez události filtru (jen otevřená tabulka)
      p.udalosti.add(`filtr:${tabulka}`);
      expect(p.stav(u).ok).toBe(true);
      p.prohlizeni = { tabulka, id: id.slice(1) };
      expect(p.stav(u).ok).toBe(false);
    });
  }

  const zapisy: [string, string][] = [
    ["A16", "UPDATE dily SET cena = 690 WHERE nazev = 'Hřídel 30 mm';"],
    ["B16", "UPDATE materialy SET cena = 175 WHERE nazev = 'Cement 25 kg';"],
  ];
  for (const [klic, sql] of zapisy) {
    it(`${klic}: změna jen v paměti neprojde a řekne proč, po zápisu projde`, () => {
      const { u, d } = ukol(klic);
      const p = new Program(d);
      expect(p.stav(u).ok).toBe(false);
      const beh = spust(p.ziva, rozdelPrikazy(sql));
      expect(beh.ok).toBe(true);
      expect(beh.zmenenoRadku).toBe(1);
      const h = p.stav(u);
      expect(h.ok).toBe(false);
      expect(h.proc).toMatch(/zapiš/);
      p.zapis();
      expect(p.stav(u).ok).toBe(true);
    });
  }
});

describe("kód postupu", () => {
  const p: Postup = {
    jmeno: "Šárka Řeháková",
    datum: "2026-09-24",
    hotove: [1, 2, 3, 14],
    sede: [3],
    navic: 2,
    sady: { detektivka: [6, 6], dilna: [3, 16] },
    ulohy: ["u-abc-1f"],
    klice: ["3b", "20a", "A1"],
    nazvyUloh: { "u-abc-1f": "Vypiš knihy od Čapka" },
  };

  it("se přečte zpátky i s diakritikou", () => {
    expect(dekoduj(zakoduj(p))).toEqual(p);
  });

  it("starý kód bez klíčů a názvů úloh se přečte taky", () => {
    // Kód z verze před 24. 9. 2026 (bez polí k a v).
    const stary = "SQLKURZ1-" + btoa(JSON.stringify({ j: "Petr", d: "2026-09-20", h: [1], s: [], n: 0, x: {}, u: [] }));
    const r = dekoduj(stary.replace(/=+$/, ""));
    expect(r && r.klice).toEqual([]);
    expect(r && r.nazvyUloh).toEqual({});
  });

  it("najde se v celé zprávě z Teams, poškozený ne", () => {
    const kod = zakoduj(p);
    const druhy = zakoduj({ ...p, jmeno: "Petr" });
    const text = `Dobrý den, posílám ${kod}\nA tady je Petrův: ${druhy}. Díky!\nSQLKURZ1-nesmysl`;
    const nalezene = najdiKody(text);
    expect(nalezene.map((x) => x.jmeno)).toEqual(["Šárka Řeháková", "Petr"]);
    expect(dekoduj("SQLKURZ1-abc")).toBeNull();
    expect(dekoduj("úplně něco jiného")).toBeNull();
  });
});

describe("úloha z odkazu", () => {
  const u = {
    zadani: "Vypiš názvy knih od Karla Čapka.",
    napoveda: "WHERE autor = …",
    soubor: KNIHOVNA,
    reference: "SELECT nazev FROM knihy WHERE autor = 'Karel Čapek';",
  };

  it("se přečte zpátky z odkazu", () => {
    expect(dekodujUlohu(zakodujUlohu(u))).toEqual(u);
  });

  it("pustí jen jeden SELECT nad známou databází", () => {
    expect(chybaDotazu("SELECT 1;")).toBeNull();
    expect(chybaDotazu("WITH x AS (SELECT 1) SELECT * FROM x;")).toBeNull();
    expect(chybaDotazu("DELETE FROM knihy;")).not.toBeNull();
    expect(chybaDotazu("SELECT 1; DROP TABLE knihy;")).not.toBeNull();
    expect(chybaDotazu("PRAGMA foreign_keys;")).not.toBeNull();
    expect(dekodujUlohu(zakodujUlohu({ ...u, reference: "UPDATE knihy SET rok = 1;" }))).toBeNull();
    expect(dekodujUlohu(zakodujUlohu({ ...u, soubor: "../cizi.db" }))).toBeNull();
    expect(dekodujUlohu(zakodujUlohu({ ...u, zadani: "   " }))).toBeNull();
    expect(dekodujUlohu("nesmysl")).toBeNull();
    expect(dekodujUlohu(null)).toBeNull();
  });

  it("se kontroluje jako lekce kurzu a řešení neukazuje", () => {
    const lekce = lekceZOdkazu(u);
    const ukol = lekce.ukoly[0];
    expect(ukol.klic).toBe(klicUlohy(u));
    expect(ukol.reseni).toBe("");
    const db = cista(
      // knihovna ze sqlExercise – přes kontrolu, ne přímo
      (lekce.ukoly[0].kontrola as { databaze?: Databaze }).databaze!.schema,
    ) as SqlDbSoubor;
    const zkus = (text: string) => {
      const beh = spust(db, rozdelPrikazy(text));
      if (!beh.ok || !beh.provedene.length) return false;
      const h = vyhodnotDotaz(
        ukol,
        { text, vysledek: beh.vysledek, soubor: KNIHOVNA, menilData: false, konciCtenim: true },
        { cista, ziva: db },
      );
      return !!(h && h.ok);
    };
    expect(zkus(u.reference)).toBe(true);
    expect(zkus("SELECT nazev FROM knihy WHERE autor LIKE 'Karel Č%';")).toBe(true);
    expect(zkus("SELECT 1;")).toBe(false);
    expect(zkus("SELECT nazev FROM knihy;")).toBe(false);
    db.close();
  });

  it("nad procvičováním otevře vlastní soubor", () => {
    const l = lekceZOdkazu({ ...u, soubor: "dilna.db", reference: "SELECT nazev FROM dily;" });
    expect(l.databaze && l.databaze.soubor).toBe("dilna.db");
    expect(l.knihovna).toBe(false);
    expect(l.tabulka).toBe("dily");
  });
});

describe("přehled třídy a pokračování z kódu", () => {
  const kod = (jmeno: string, datum: string, hotove: number[], sede: number[] = [], jine: Partial<Postup> = {}): Postup => ({
    jmeno,
    datum,
    hotove,
    sede,
    navic: 0,
    sady: {},
    ulohy: [],
    klice: [],
    nazvyUloh: {},
    ...jine,
  });

  it("jméno se porovná bez diakritiky, velikosti písmen a pořadí slov", () => {
    expect(normalizujJmeno("Novák  Adam")).toBe(normalizujJmeno("adam novak"));
    expect(normalizujJmeno("Šárka Řeháková")).toBe("rehakova sarka");
  });

  it("kódy téhož žáka se sečtou – domácí úkol nezmizí, zelená přebije šedou", () => {
    const [z] = sloucitPostupy([
      kod("Adam Novák", "2026-09-24", [1, 2, 3, 11, 12, 13], [12]),
      kod("novák adam", "2026-09-25", [1, 2, 3, 4, 14], [3], { navic: 2, sady: { dilna: [5, 16] } }),
      kod("Adam Novák", "2026-09-23", [1], [], { sady: { dilna: [9, 16] }, ulohy: ["u-1"], nazvyUloh: { "u-1": "Čapek" } }),
    ]);
    expect(z.jmeno).toBe("novák adam");
    expect(z.datum).toBe("2026-09-25");
    expect(z.hotove).toEqual([1, 2, 3, 4, 11, 12, 13, 14]);
    // 3 je šedá jen v jednom kódu, v jiném zelená → zelená; 12 je šedá tam, kde je hotová.
    expect(z.sede).toEqual([12]);
    expect(z.navic).toBe(2);
    expect(z.sady).toEqual({ dilna: [9, 16] });
    expect(z.nazvyUloh).toEqual({ "u-1": "Čapek" });
  });

  it("souhrn ukáže, kolik žáků má kterou lekci", () => {
    const zaci = sloucitPostupy([kod("A", "1", [1, 2]), kod("B", "1", [1]), kod("C", "1", [])]);
    expect(souhrnTridy(zaci, [1, 2, 3])).toEqual([2, 1, 0]);
  });

  it("pokračování z kódu odškrtne hotové lekce, šedou nechá šedou a vrátí úlohy navíc", () => {
    const { splneno, opsano } = splnenoZKodu(kod("Eva", "1", [1, 3, 17], [3], { klice: ["3b", "A1"], ulohy: ["u-9"] }));
    const s = new Set(splneno);
    const l = (id: number) => KURZ.filter((x) => x.id === id)[0];
    expect(lekceHotova(l(1), s)).toBe(true);
    expect(lekceHotova(l(3), s)).toBe(true);
    expect(lekceHotova(l(17), s)).toBe(true);
    expect(lekceHotova(l(2), s)).toBe(false);
    expect(opsano).toEqual(["3"]);
    expect(s.has("3b") && s.has("A1") && s.has("u-9")).toBe(true);
    // Klíče navíc nejsou mezi povinnými – jinak by se v kódu posílaly dvakrát.
    expect(POVINNE_KLICE.indexOf("3b")).toBe(-1);
    expect(POVINNE_KLICE.indexOf("17a")).not.toBe(-1);
  });
});
