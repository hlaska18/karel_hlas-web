/**
 * Test všech 19 lekcí kurzu nad skutečným SQLite (sql.js, stejná verze jako
 * v prohlížeči).
 *
 * Hlídá tři věci, které rada 24. 9. 2026 označila za nejdůležitější:
 *  - řešení každého úkolu projde,
 *  - prázdný dotaz, SELECT 1 ani špatný dotaz neprojdou,
 *  - a totéž platí i nad už změněným „diskem“ (druhý průchod, další žák).
 *
 * Prostředí napodobuje, co dělá komponenta DbBrowser: disk se soubory,
 * otevřenou databázi v paměti, zápis a události programu. Názvy událostí
 * („strom:knihy“, „filtr:knihy“, „upraveno:ctenari“, „zapsano“…) jsou smlouva
 * mezi komponentou a kurzem – když se v jednom přejmenují, test spadne.
 */

import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { KURZ, udalostiPoZnovuotevreni, type Kontext, type UkolKurzu } from "@/lib/dbb/kurz";
import { vyhodnotDotaz } from "@/lib/dbb/kontrola";
import { rozdelPrikazy, spust, druhPrikazu } from "@/lib/dbb/prikazy";
import { SCHEMA } from "@/lib/sqlExercise";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import type { SqlDb, SqlDbSoubor, SqlResult } from "@/lib/sqljs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SQL: any;
beforeAll(async () => {
  SQL = await initSqlJs();
});

const cista = (schema: string = SCHEMA): SqlDb => {
  const db = new SQL.Database();
  db.run(schema);
  return db;
};

function puvodniBajty(): Uint8Array {
  const db = new SQL.Database();
  db.run(SCHEMA);
  const b = db.export();
  db.close();
  return b;
}

const precti = (db: SqlDb, sql: string): SqlResult | null => {
  try {
    const r = db.exec(sql);
    return r.length ? r[r.length - 1] : { columns: [], values: [] };
  } catch {
    return null;
  }
};

/** Napodobenina programu: disk, otevřený soubor, události. */
class Program {
  disk: Record<string, Uint8Array> = {};
  ziva: SqlDbSoubor | null = null;
  otevreny: string | null = null;
  udalosti = new Set<string>();
  prohlizeni: { tabulka: string; id: string[] } | null = null;
  selecty = new Set<string>();

  constructor() {
    this.disk[KNIHOVNA] = puvodniBajty();
    this.otevri(KNIHOVNA);
  }

  otevri(nazev: string) {
    if (this.ziva) this.ziva.close();
    this.ziva = new SQL.Database(this.disk[nazev]);
    this.ziva!.exec("PRAGMA foreign_keys = ON;");
    this.otevreny = nazev;
  }

  /** Nová lekce: události platí jen v ní (jako vyberLekci v komponentě). */
  novaLekce() {
    this.udalosti = new Set();
  }

  spust(text: string) {
    const beh = spust(this.ziva!, rozdelPrikazy(text));
    if (beh.ok && this.otevreny !== KNIHOVNA) {
      beh.provedene.forEach((p) => {
        if (druhPrikazu(p.text) === "cteni" && /\bfrom\b/i.test(p.text)) this.selecty.add(p.text.toLowerCase());
      });
    }
    return beh;
  }

  zapis() {
    this.disk[this.otevreny!] = this.ziva!.export();
    this.ziva!.exec("PRAGMA foreign_keys = ON;");
    this.udalosti.add("zapsano");
  }

  /** Zavřít s „Neukládat“ a znovu otevřít – jako komponenta při zahození. */
  zahodAOtevri() {
    const pred = precti(this.ziva!, "SELECT dostupna FROM knihy WHERE nazev = 'Temno'");
    const nazev = this.otevreny!;
    this.otevri(nazev);
    const po = precti(this.ziva!, "SELECT dostupna FROM knihy WHERE nazev = 'Temno'");
    const hodnota = (r: SqlResult | null) => (r && r.values[0] ? String(r.values[0][0]) : null);
    udalostiPoZnovuotevreni(hodnota(pred), hodnota(po)).forEach((u) => this.udalosti.add(u));
  }

  kontext(): Kontext {
    return {
      otevreny: this.otevreny,
      dotazZive: (sql) => precti(this.ziva!, sql),
      dotazSoubor: (nazev, sql) => {
        const b = this.disk[nazev];
        if (!b) return null;
        const d = new SQL.Database(b);
        try {
          return precti(d, sql);
        } finally {
          d.close();
        }
      },
      soubory: Object.keys(this.disk),
      udalosti: this.udalosti,
      prohlizeni: this.prohlizeni,
      vlastniSelecty: this.selecty.size,
    };
  }

  /** Spustí dotaz a vyhodnotí úkol stejně jako komponenta po F5. */
  zkus(ukol: UkolKurzu, text: string): boolean {
    const beh = this.spust(text);
    if (!beh.ok) return false;
    if (ukol.kontrola.druh === "stav") return ukol.kontrola.test(this.kontext()).ok;
    if (!beh.provedene.length) return false;
    const posledni = beh.provedene[beh.provedene.length - 1];
    const h = vyhodnotDotaz(
      ukol,
      {
        text: beh.provedene.map((p) => p.text).join("\n"),
        vysledek: beh.vysledek,
        soubor: this.otevreny,
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

const lekce = (id: number) => KURZ.find((l) => l.id === id)!;
const ukol = (klic: string) => {
  for (const l of KURZ) for (const u of l.ukoly) if (u.klic === klic) return u;
  throw new Error(`úkol ${klic} není`);
};

/** Knihovna „po minulém žákovi“: změny z lekcí 13–17 jsou zapsané v souboru. */
function zmenenyDisk(): Program {
  const p = new Program();
  p.spust("DELETE FROM knihy WHERE nazev = 'Máj';");
  p.spust("UPDATE knihy SET dostupna = 1 WHERE nazev = 'Temno';");
  p.spust("UPDATE ctenari SET trida = '1.B' WHERE jmeno = 'Eva Marková';");
  p.spust(ukol("17a").reseni);
  p.spust(ukol("17b").reseni);
  p.zapis();
  p.otevri(KNIHOVNA);
  // Žák teď vstupuje do lekce – události z přípravy (i „zapsano“) se smažou.
  p.novaLekce();
  return p;
}

const DOTAZOVE = KURZ.filter((l) => l.id <= 14).reduce<UkolKurzu[]>(
  (a, l) => a.concat(l.ukoly.filter((u) => u.kontrola.druh !== "stav")),
  [],
);

describe("lekce ověřované dotazem (1–14)", () => {
  for (const u of DOTAZOVE) {
    it(`${u.klic}: řešení projde, prázdný dotaz, SELECT 1 ani špatný dotaz ne`, () => {
      expect(new Program().zkus(u, u.reseni)).toBe(true);
      expect(new Program().zkus(u, "")).toBe(false);
      expect(new Program().zkus(u, "SELECT 1;")).toBe(false);
      const tabulka = (u.reseni.match(/\b(?:from|into|update)\s+(\w+)/i) || [])[1];
      expect(new Program().zkus(u, `SELECT * FROM ${tabulka} WHERE 0;`)).toBe(false);
    });

    it(`${u.klic}: řešení projde i nad už změněným diskem a prázdný výsledek pořád ne`, () => {
      expect(zmenenyDisk().zkus(u, u.reseni)).toBe(true);
      const tabulka = (u.reseni.match(/\b(?:from|into|update)\s+(\w+)/i) || [])[1];
      expect(zmenenyDisk().zkus(u, `SELECT * FROM ${tabulka} WHERE 0;`)).toBe(false);
    });
  }
});

describe("lekce 14 a 15 – činy v programu", () => {
  it("14a: odškrtne rozbalení tabulky knihy, nic jiného", () => {
    const p = new Program();
    expect(p.stav(ukol("14a")).ok).toBe(false);
    p.udalosti.add("strom:ctenari");
    expect(p.stav(ukol("14a")).ok).toBe(false);
    p.udalosti.add("strom:knihy");
    expect(p.stav(ukol("14a")).ok).toBe(true);
  });

  it("15a: chce filtr nastavený v lekci, samotný pohled z dřívějška nestačí", () => {
    const p = new Program();
    const id = precti(p.ziva!, "SELECT id FROM knihy WHERE rok > 1900")!.values.map((r) => String(r[0]));
    p.prohlizeni = { tabulka: "knihy", id };
    expect(p.stav(ukol("15a")).ok).toBe(false);
    p.udalosti.add("filtr:knihy");
    expect(p.stav(ukol("15a")).ok).toBe(true);
    p.prohlizeni = { tabulka: "knihy", id: id.slice(1) };
    expect(p.stav(ukol("15a")).ok).toBe(false);
  });

  it("15b: Eva v 1.B z minula ani přes UPDATE úkol nesplní – musí se upravit v mřížce", () => {
    const z = zmenenyDisk();
    expect(z.stav(ukol("15b")).ok).toBe(false);
    const p = new Program();
    p.spust("UPDATE ctenari SET trida = '1.B' WHERE jmeno = 'Eva Marková';");
    expect(p.stav(ukol("15b")).ok).toBe(false);
    p.udalosti.add("upraveno:ctenari");
    expect(p.stav(ukol("15b")).ok).toBe(true);
  });
});

describe("lekce 16 – změny se musí zapsat", () => {
  const zmena = "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Temno';";

  it("16a: nad původní knihovnou změna po Neukládat zmizí a úkol se odškrtne", () => {
    const p = new Program();
    expect(p.stav(ukol("16a")).ok).toBe(false);
    p.spust(zmena);
    p.zahodAOtevri();
    expect(p.stav(ukol("16a")).ok).toBe(true);
  });

  it("16a: když je Temno zapsané z minula, nic nezmizí – úkol se neodškrtne a řekne proč", () => {
    const p = zmenenyDisk();
    p.spust(zmena);
    p.zahodAOtevri();
    const h = p.stav(ukol("16a"));
    expect(h.ok).toBe(false);
    expect(h.proc).toContain("Obnov původní knihovnu");
  });

  it("16a: samotné zavření a otevření bez změny nestačí", () => {
    const p = new Program();
    p.zahodAOtevri();
    expect(p.stav(ukol("16a")).ok).toBe(false);
  });

  it("16b: chce zápis v téhle lekci – Temno zapsané z minula nestačí", () => {
    const z = zmenenyDisk();
    expect(z.stav(ukol("16b")).ok).toBe(false);
    const p = new Program();
    p.spust(zmena);
    expect(p.stav(ukol("16b")).ok).toBe(false);
    expect(p.stav(ukol("16b")).proc).toContain("zapiš");
    p.zapis();
    expect(p.stav(ukol("16b")).ok).toBe(true);
  });

  it("16c: odškrtne až Vrátit změny", () => {
    const p = new Program();
    expect(p.stav(ukol("16c")).ok).toBe(false);
    p.udalosti.add("vraceno");
    expect(p.stav(ukol("16c")).ok).toBe(true);
  });
});

describe("lekce 17 a 18 – vlastní tabulka", () => {
  it("17a–c: řešení projdou postupně, bez zápisu 17c ne", () => {
    const p = new Program();
    expect(p.stav(ukol("17a")).ok).toBe(false);
    p.spust(ukol("17a").reseni);
    expect(p.stav(ukol("17a")).ok).toBe(true);
    expect(p.stav(ukol("17b")).ok).toBe(false);
    p.spust(ukol("17b").reseni);
    expect(p.stav(ukol("17b")).ok).toBe(true);
    expect(p.stav(ukol("17c")).ok).toBe(false);
    p.zapis();
    expect(p.stav(ukol("17c")).ok).toBe(true);
  });

  it("17a: tabulka bez cizího klíče neprojde a řekne proč", () => {
    const p = new Program();
    p.spust("CREATE TABLE hodnoceni (id INTEGER PRIMARY KEY, kniha_id INTEGER, hvezdy INTEGER);");
    const h = p.stav(ukol("17a"));
    expect(h.ok).toBe(false);
    expect(h.proc).toContain("REFERENCES");
  });

  it("18a, 18b: JOIN přes vlastní klíč projde, SELECT 1 ne", () => {
    const p = new Program();
    p.spust(ukol("17a").reseni);
    p.spust(ukol("17b").reseni);
    expect(p.zkus(ukol("18a"), ukol("18a").reseni)).toBe(true);
    expect(p.zkus(ukol("18b"), ukol("18b").reseni)).toBe(true);
    expect(p.zkus(ukol("18a"), "SELECT 1;")).toBe(false);
    expect(p.zkus(ukol("18a"), "SELECT nazev FROM knihy;")).toBe(false);
  });
});

describe("lekce 19 – vlastní databáze", () => {
  it("19a–c: nová databáze, tabulka s 5 záznamy po zápisu, dva vlastní SELECTy", () => {
    const p = new Program();
    expect(p.stav(ukol("19a")).ok).toBe(false);
    p.disk["hry.db"] = new SQL.Database().export();
    p.otevri("hry.db");
    expect(p.stav(ukol("19a")).ok).toBe(true);
    p.spust(ukol("19b").reseni);
    expect(p.stav(ukol("19b")).ok).toBe(false);
    p.zapis();
    expect(p.stav(ukol("19b")).ok).toBe(true);
    p.spust("SELECT 1;");
    expect(p.stav(ukol("19c")).ok).toBe(false);
    p.spust(ukol("19c").reseni);
    expect(p.stav(ukol("19c")).ok).toBe(true);
  });

  it("každé řešení lekce 19, které je SQL, projde bez chyby", () => {
    const p = new Program();
    p.disk["hry.db"] = new SQL.Database().export();
    p.otevri("hry.db");
    for (const k of ["19b", "19c", "19d"]) {
      expect(p.spust(ukol(k).reseni).ok).toBe(true);
    }
  });
});

describe("pokrytí", () => {
  it("test se dotkne každé lekce 1–19", () => {
    const dotcene = new Set<number>(DOTAZOVE.map((u) => Number(u.klic.replace(/\D/g, ""))));
    [14, 15, 16, 17, 18, 19].forEach((id) => dotcene.add(id));
    expect(Array.from(dotcene).sort((a, b) => a - b)).toEqual(KURZ.map((l) => l.id));
    expect(lekce(19).ukoly.length).toBeGreaterThan(0);
  });
});

describe("lekce 19 – smysl návrhu", () => {
  const vlastniDb = () => {
    const p = new Program();
    p.disk["hry.db"] = new SQL.Database().export();
    p.otevri("hry.db");
    return p;
  };

  it("19b: tabulka bez datových typů neprojde a řekne, kterým sloupcům typ chybí", () => {
    const p = vlastniDb();
    p.spust("CREATE TABLE hry (nazev, rok); INSERT INTO hry VALUES ('a',1),('b',2),('c',3),('d',4),('e',5);");
    p.zapis();
    const h = p.stav(ukol("19b"));
    expect(h.ok).toBe(false);
    expect(h.proc).toContain("nazev, rok");
  });

  it("19d: cizí klíč, který nikam nevede, neprojde; spojené řádky ano", () => {
    const p = vlastniDb();
    p.spust(ukol("19b").reseni);
    p.spust("CREATE TABLE body (id INTEGER PRIMARY KEY, hra_id INTEGER REFERENCES hry(id), pocet INTEGER);");
    p.zapis();
    expect(p.stav(ukol("19d")).ok).toBe(false);
    expect(p.stav(ukol("19d")).proc).toContain("nespojí");
    p.ziva!.exec("PRAGMA foreign_keys = OFF;");
    p.spust("INSERT INTO body (hra_id, pocet) VALUES (99, 5);");
    p.zapis();
    expect(p.stav(ukol("19d")).proc).toContain("neexistuje");
    p.spust("DELETE FROM body; INSERT INTO body (hra_id, pocet) VALUES (1, 5);");
    p.zapis();
    expect(p.stav(ukol("19d")).ok).toBe(true);
  });

  it("19e: odškrtne stažení vlastní databáze, knihovna nestačí", () => {
    const p = vlastniDb();
    p.udalosti.add(`stazeno:${KNIHOVNA}`);
    expect(p.stav(ukol("19e")).ok).toBe(false);
    p.udalosti.add("stazeno:hry.db");
    expect(p.stav(ukol("19e")).ok).toBe(true);
  });
});
