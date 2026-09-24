/**
 * Anglická verze (/sql?z=en): každá lekce a každý úkol má překlad a po
 * zapnutí angličtiny je program opravdu anglicky – lekce, hlášky kontroly
 * i výpis výsledku.
 */

import { afterAll, describe, expect, it, vi } from "vitest";
import { KURZ, SADY } from "@/lib/dbb/kurz";
import { EN_LEKCE, EN_UKOLY, SLOVNICEK } from "@/lib/dbb/anglicky";

const LEKCE = KURZ.concat(SADY.map((s) => s.lekce));

describe("překlad je úplný", () => {
  for (const l of LEKCE) {
    it(`lekce ${l.id} má anglický název, výklad a všechny úkoly`, () => {
      expect(EN_LEKCE[l.id], `lekce ${l.id}`).toBeDefined();
      for (const u of l.ukoly) {
        const en = EN_UKOLY[u.klic];
        expect(en, `úkol ${u.klic}`).toBeDefined();
        // Co je česky u úkolu navíc, musí mít i anglickou podobu.
        if (u.ceka) expect(en.ceka, `čeká se u ${u.klic}`).toBeTruthy();
        if (!u.reseniJeSql) expect(en.reseni, `postup u ${u.klic}`).toBeTruthy();
      }
    });
  }

  it("žádný přebytečný překlad (překlep v klíči by zůstal tiše česky)", () => {
    const klice = new Set(LEKCE.reduce<string[]>((a, l) => a.concat(l.ukoly.map((u) => u.klic)), []));
    expect(Object.keys(EN_UKOLY).filter((k) => !klice.has(k))).toEqual([]);
  });

  it("každá databáze kurzu má slovníček", () => {
    const soubory = ["knihovna.db"].concat(SADY.map((s) => s.lekce.databaze!.soubor));
    for (const s of soubory) expect(SLOVNICEK[s], s).toBeDefined();
  });
});

describe("s ?z=en je program anglicky", () => {
  afterAll(() => {
    delete (globalThis as { DBB_JAZYK?: string }).DBB_JAZYK;
    vi.resetModules();
  });

  it("lekce, hlášky kontroly i výpis výsledku", async () => {
    (globalThis as { DBB_JAZYK?: string }).DBB_JAZYK = "en";
    vi.resetModules();
    const kurz = await import("@/lib/dbb/kurz");
    const prikazy = await import("@/lib/dbb/prikazy");
    const chyby = await import("@/lib/dbb/chyby");
    const { diffMessage } = await import("@/lib/sqlExercise");

    expect(kurz.KURZ[0].title).toBe("What a database is, and SELECT");
    expect(kurz.KURZ[0].ukoly[0].zadani).toBe("List all the books (all columns).");
    expect(kurz.SADY[0].kratce).toBe("Detective");
    expect(kurz.SADY[0].lekce.title).toMatch(/Who took Krakatit/);
    // Referenční dotazy a kontrola zůstávají – data jsou pořád česká.
    expect(kurz.KURZ[0].ukoly[0].reseni).toBe("SELECT * FROM knihy;");

    expect(prikazy.pocetRadku(3, "vrácen")).toBe("3 rows returned");
    expect(prikazy.pocetRadku(1, "vrácen")).toBe("1 row returned");
    expect(prikazy.pocetRadku(1, "ovlivněn")).toBe("1 rows affected");
    expect(chyby.chybaCesky("no such column: poezie", ["knihy"])).toMatch(/^There is no column/);
    expect(chyby.chybaCesky("near \"FORM\": syntax error", ["knihy"])).toMatch(/typo/);

    const moje = { columns: ["nazev"], values: [["A"]] };
    const ref = { columns: ["nazev"], values: [["A"], ["B"]] };
    expect(diffMessage(moje, ref, false, false, { zak: "SELECT nazev FROM knihy WHERE rok > 1", ref: "x WHERE y" }, true)).toMatch(
      /^You returned 1 row; it should be 2/,
    );
  });
});
