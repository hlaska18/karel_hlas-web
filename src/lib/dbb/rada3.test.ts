/**
 * Třetí kolo rady (24. 9. 2026): česká klávesnice, uvíznutí v lekcích 11,
 * 15 a 17, písemka z Procvičování A/B a přehled pro učitele.
 */

import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { chybaCesky, spatneUvozovky, opravUvozovky } from "@/lib/dbb/chyby";
import { zakoduj, dekoduj, sloucitPostupy, kdeZacit, skoreSadyText, type Postup } from "@/lib/dbb/kodPostupu";
import { varovaniDiakritiky } from "@/lib/dbb/odkazUlohy";
import { spoctiPostup, textKopie } from "@/components/dbb/Vysledky";
import { SADY, KURZ } from "@/lib/dbb/kurz";
import { SCHEMA } from "@/lib/sqlExercise";

type Db = { exec: (sql: string) => unknown; close: () => void };
let novaDb: () => Db;

beforeAll(async () => {
  const SQL = await initSqlJs();
  novaDb = () => {
    const db = new SQL.Database();
    db.run(SCHEMA);
    return db as unknown as Db;
  };
});

/** Chyba, kterou SQLite skutečně vrátí. */
function chyba(sql: string): string {
  const db = novaDb();
  try {
    db.exec(sql);
    return "";
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  } finally {
    db.close();
  }
}

describe("apostrof na české klávesnici", () => {
  const sloupce = ["id", "nazev", "autor", "rok", "zanr", "pocet_stran", "dostupna"];

  it("pozná ´, ’ a „“ mimo řetězec, ale ne uvnitř správného řetězce ani v komentáři", () => {
    expect(spatneUvozovky("SELECT * FROM knihy WHERE nazev = ´Temno´;")).toBe("´");
    expect(spatneUvozovky("SELECT * FROM knihy WHERE nazev = ’Temno’;")).toBe("’");
    expect(spatneUvozovky("SELECT * FROM knihy WHERE nazev = „Temno“;")).toBe("„");
    expect(spatneUvozovky("SELECT * FROM knihy WHERE nazev = 'Babička – „krásná“';")).toBeNull();
    expect(spatneUvozovky("-- „tady“ je komentář\nSELECT * FROM knihy;")).toBeNull();
    expect(spatneUvozovky("SELECT * FROM knihy; /* ´ */")).toBeNull();
  });

  it("každá z těch chyb ve skutečném SQLite dostane radu s apostrofem", () => {
    for (const sql of [
      "SELECT * FROM knihy WHERE nazev = ´Temno´;",
      "SELECT * FROM knihy WHERE nazev = ’Temno’;",
      "SELECT * FROM knihy WHERE nazev = „Temno“;",
      "SELECT * FROM knihy WHERE autor = ‘Karel Čapek’;",
    ]) {
      const raw = chyba(sql);
      expect(raw).not.toBe("");
      const text = chybaCesky(raw, ["knihy"], { sloupce, sql });
      expect(text).toContain("apostrof");
      expect(text).toContain("Shift");
    }
  });

  it("Nahradit apostrofem udělá z dotazu takový, který projde", () => {
    const opraveny = opravUvozovky("SELECT nazev FROM knihy WHERE autor = „Karel Čapek“ AND nazev <> ´Temno´;");
    expect(opraveny).toBe("SELECT nazev FROM knihy WHERE autor = 'Karel Čapek' AND nazev <> 'Temno';");
    expect(chyba(opraveny)).toBe("");
    // Uvozovky uvnitř správného řetězce zůstanou.
    expect(opravUvozovky("SELECT 'řekla „ahoj“', ´x´;")).toBe("SELECT 'řekla „ahoj“', 'x';");
  });
});

describe("hlášky tam, kde žák uvízne", () => {
  it("lekce 11: id 11 z minulého pokusu – poradí Vrátit změny", () => {
    const raw = chyba(
      "INSERT INTO knihy (id, nazev, autor, rok, zanr, pocet_stran, dostupna) VALUES (11, 'Bylo nás pěť', 'Karel Poláček', 1946, 'román', 280, 1);" +
        "INSERT INTO knihy (id, nazev, autor, rok, zanr, pocet_stran, dostupna) VALUES (11, 'Bylo nás pět', 'Karel Poláček', 1946, 'román', 280, 1);",
    );
    expect(raw).toMatch(/UNIQUE constraint failed: knihy\.id/);
    expect(chybaCesky(raw, ["knihy"], { lekce: 11 })).toContain("Vrátit změny");
    // Jinde obecná rada: nový řádek přes Shift+F5, nebo Vrátit změny.
    const obecna = chybaCesky(raw, ["knihy"], { lekce: 12 });
    expect(obecna).toContain("Shift+F5");
    expect(obecna).toContain("Vrátit změny");
  });

  it("lekce 17: u tabulek kurzu nikdy DROP, u vlastní až jako poslední možnost", () => {
    const kurzu = chybaCesky(chyba("CREATE TABLE knihy (id INTEGER);"), ["knihy"]);
    expect(kurzu).not.toContain("DROP");
    expect(kurzu).toContain("CREATE TABLE z editoru smaž");
    const db = novaDb();
    db.exec("CREATE TABLE hodnoceni (id INTEGER PRIMARY KEY)");
    let raw = "";
    try {
      db.exec("CREATE TABLE hodnoceni (id INTEGER PRIMARY KEY)");
    } catch (e) {
      raw = String(e instanceof Error ? e.message : e);
    }
    db.close();
    const vlastni = chybaCesky(raw, ["hodnoceni"]);
    expect(vlastni).toContain("Shift+F5");
    expect(vlastni.indexOf("DROP")).toBeGreaterThan(vlastni.indexOf("Shift+F5"));
  });

  it("chybějící hodnoceni pošle k tlačítku v lekci 18", () => {
    expect(chybaCesky("no such table: hodnoceni", ["knihy"])).toContain("Založit hodnoceni znovu");
  });

  it("17b s víc hodnoceními radí DELETE … WHERE id > 3, ne Vrátit změny", () => {
    const l17 = KURZ.filter((l) => l.id === 17)[0];
    const u = l17.ukoly.filter((x) => x.klic === "17b")[0];
    if (u.kontrola.druh !== "stav") throw new Error("17b je stavový úkol");
    const radky = [
      [1, 5],
      [4, 4],
      [8, 3],
      [1, 5],
    ];
    const h = u.kontrola.test({
      otevreny: "knihovna.db",
      dotazZive: () => ({ columns: ["kniha_id", "hvezdy"], values: radky }),
      dotazSoubor: () => null,
      soubory: [],
      udalosti: new Set(),
      prohlizeni: null,
      vlastniSelecty: 0,
    });
    expect(h.ok).toBe(false);
    expect(h.proc).toContain("DELETE FROM hodnoceni WHERE id > 3");
  });

  it("15a nad knihovnou bez knih po roce 1900 řekne proč", () => {
    const l15 = KURZ.filter((l) => l.id === 15)[0];
    const u = l15.ukoly.filter((x) => x.klic === "15a")[0];
    if (u.kontrola.druh !== "stav") throw new Error("15a je stavový úkol");
    const h = u.kontrola.test({
      otevreny: "knihovna.db",
      dotazZive: () => ({ columns: ["id"], values: [] }),
      dotazSoubor: () => null,
      soubory: [],
      udalosti: new Set(["filtr:knihy"]),
      prohlizeni: { tabulka: "knihy", id: [] },
      vlastniSelecty: 0,
    });
    expect(h.ok).toBe(false);
    expect(h.proc).toContain("Obnovit původní knihovna.db");
  });
});

describe("písemka a procvičování v kódu postupu", () => {
  const dilna = SADY.filter((s) => s.id === "dilna")[0].lekce;

  it("skóre sady nepočítá úlohy splněné po zobrazení řešení", () => {
    const splneno = new Set(dilna.ukoly.slice(0, 5).map((u) => u.klic));
    const opsano = new Set([dilna.ukoly[0].klic, dilna.ukoly[1].klic]);
    const p = spoctiPostup(splneno, opsano, "Eva");
    expect(p.sady && p.sady.dilna).toEqual([3, 16, 2]);
    expect(skoreSadyText([3, 16, 2], "s řešením")).toBe("3/16 (2 s řešením)");
    expect(skoreSadyText([3, 16, 0], "s řešením")).toBe("3/16");
  });

  it("příznak písemky projde kódem a Přehled ji nesečte s kurzem", () => {
    const zaklad: Postup = { jmeno: "Eva Malá", datum: "2026-10-01", hotove: [1, 2], sede: [], navic: 0, sady: {}, ulohy: [], klice: [] };
    const pis = dekoduj(zakoduj({ ...zaklad, hotove: [], sady: { dilna: [12, 16, 0] }, klice: ["A1"], pisemka: "A" }));
    expect(pis && pis.pisemka).toBe("A");
    expect(dekoduj(zakoduj(zaklad))!.pisemka).toBeUndefined();
    const zaci = sloucitPostupy([zaklad, pis as Postup]);
    expect(zaci.length).toBe(2);
    expect(zaci.filter((z) => z.pisemka === "A")[0].sady).toEqual({ dilna: [12, 16, 0] });
    expect(zaci.filter((z) => !z.pisemka)[0].hotove).toEqual([1, 2]);
  });

  it("Kopírovat pošle jméno a skóre před kódem", () => {
    const p: Postup = { jmeno: "Eva", datum: "2026-10-01", hotove: [1, 2, 14], sede: [], navic: 0 };
    expect(textKopie(p, "SQLKURZ1-x")).toBe("Eva · Dotazy 2/13 · Program 1/6 · SQLKURZ1-x");
    expect(textKopie({ ...p, pisemka: "B", sady: { stavebniny: [9, 16, 0] } }, "SQLKURZ1-y")).toBe(
      "Eva · Písemka B 9/16 · SQLKURZ1-y",
    );
  });
});

describe("pro učitele", () => {
  it("příště začni první lekcí, kterou má méně než polovina třídy", () => {
    expect(kdeZacit([10, 10, 6, 4, 1], 10)).toBe(3);
    expect(kdeZacit([10, 5, 4], 10)).toBe(2);
    expect(kdeZacit([10, 10], 10)).toBe(-1);
    expect(kdeZacit([], 0)).toBe(-1);
  });

  it("varuje před LIKE a LOWER s háčky a čárkami", () => {
    expect(varovaniDiakritiky("SELECT nazev FROM knihy WHERE autor LIKE '%Čapek%'")).toBe(true);
    expect(varovaniDiakritiky("SELECT nazev FROM knihy WHERE LOWER(zanr) = 'román'")).toBe(true);
    expect(varovaniDiakritiky("SELECT nazev FROM knihy WHERE autor LIKE '%Capek%'")).toBe(false);
    expect(varovaniDiakritiky("SELECT nazev FROM knihy WHERE autor = 'Karel Čapek'")).toBe(false);
  });
});
