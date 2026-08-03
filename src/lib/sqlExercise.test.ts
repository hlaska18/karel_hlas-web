import { describe, expect, it } from "vitest";
import {
  SCHEMA,
  SCHEMA_INFO,
  LESSONS,
  diffMessage,
  radky,
  sqlErrorCs,
  type SqlTask,
} from "@/lib/sqlExercise";

const rows = (values: unknown[][], columns: string[] = []) => ({ columns, values });

/** Hlavní úkoly i úlohy navíc – pravidla platí pro obojí stejně. */
const TASKS: { lekce: number; navic: boolean; task: SqlTask }[] = LESSONS.flatMap((l) => [
  { lekce: l.id, navic: false, task: l as SqlTask },
  ...(l.bonus ? [{ lekce: l.id, navic: true, task: l.bonus }] : []),
]);

describe("SCHEMA", () => {
  it("creates the three tables referenced by the lessons", () => {
    for (const table of ["knihy", "ctenari", "vypujcky"]) {
      expect(SCHEMA).toContain(`CREATE TABLE ${table}`);
    }
  });

  it("seeds every table with rows", () => {
    for (const table of ["knihy", "ctenari", "vypujcky"]) {
      expect(SCHEMA).toContain(`INSERT INTO ${table} VALUES`);
    }
  });
});

describe("SCHEMA_INFO", () => {
  it("documents exactly the tables created in SCHEMA", () => {
    const tables = SCHEMA_INFO.map((t) => t.table);
    expect(tables).toEqual(["knihy", "ctenari", "vypujcky"]);
  });

  it("lists non-empty column descriptions for each table", () => {
    for (const info of SCHEMA_INFO) {
      expect(SCHEMA).toContain(`CREATE TABLE ${info.table}`);
      expect(info.columns.length).toBeGreaterThan(0);
    }
  });
});

describe("LESSONS", () => {
  it("is a non-empty ordered course with sequential ids", () => {
    expect(LESSONS.length).toBeGreaterThan(0);
    LESSONS.forEach((lesson, i) => {
      expect(lesson.id).toBe(i + 1);
    });
  });

  it("has unique lesson ids", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fills in every required field for each lesson", () => {
    for (const lesson of LESSONS) {
      for (const field of ["title", "teach", "example", "zadani", "reference", "hint"] as const) {
        expect(typeof lesson[field]).toBe("string");
        expect(lesson[field].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the example and the reference in the same statement family", () => {
    for (const lesson of LESSONS) {
      const kind = (q: string) => q.trim().toUpperCase().split(/\s+/)[0];
      expect(kind(lesson.example)).toBe(kind(lesson.reference));
      expect(["SELECT", "INSERT", "UPDATE", "DELETE"]).toContain(kind(lesson.reference));
    }
  });

  it("gives every data-changing task a check query and no other one", () => {
    // INSERT/UPDATE/DELETE nic nevrací, takže se musí ověřovat stav tabulky.
    for (const { lekce, navic, task } of TASKS) {
      const kde = `lekce ${lekce}${navic ? " (navíc)" : ""}`;
      const changes = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(task.reference);
      expect(Boolean(task.check), kde).toBe(changes);
      if (task.check) {
        expect(task.check.trim().toUpperCase(), kde).toMatch(/^SELECT\b/);
        // Bez ORDER BY by porovnání záviselo na náhodném pořadí řádků.
        expect(task.check.toUpperCase(), kde).toContain("ORDER BY");
        // id se u kontroly nevybírá – záleží na obsahu, ne na číslování.
        expect(task.check, kde).not.toMatch(/\bid\b/);
      }
    }
  });

  it("guards UPDATE and DELETE with a WHERE clause", () => {
    for (const { lekce, task } of TASKS) {
      if (/^\s*(UPDATE|DELETE)\b/i.test(task.reference)) {
        expect(task.reference.toUpperCase(), `lekce ${lekce}`).toContain("WHERE");
      }
    }
  });

  it("keeps every hint from being the whole solution", () => {
    // Nápověda má postrčit; celý dotaz patří pod tlačítko „Ukázat řešení“.
    const bare = (s: string) => s.replace(/\s+/g, " ").replace(/;/g, "").trim().toLowerCase();
    for (const { lekce, navic, task } of TASKS) {
      expect(bare(task.hint), `lekce ${lekce}${navic ? " (navíc)" : ""}`).not.toContain(
        bare(task.reference),
      );
    }
  });

  it("fills in every required field of every extra task", () => {
    for (const { lekce, task } of TASKS) {
      for (const field of ["zadani", "reference", "hint"] as const) {
        expect(typeof task[field], `lekce ${lekce} / ${field}`).toBe("string");
        expect(task[field].trim().length, `lekce ${lekce} / ${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("puts extra tasks only where the pattern actually changes", () => {
    // Rada zamítla druhou úlohu ke každé lekci: u úvodních je to čisté zdržení.
    const s = LESSONS.filter((l) => l.bonus).map((l) => l.id);
    expect(s.length).toBeGreaterThanOrEqual(4);
    for (const id of [1, 2, 6, 7]) expect(s).not.toContain(id);
  });

  it("references only tables that exist in the schema", () => {
    const tables = ["knihy", "ctenari", "vypujcky"];
    for (const lesson of LESSONS) {
      const referenced = lesson.reference.match(/(?:FROM|JOIN)\s+(\w+)/gi) ?? [];
      for (const clause of referenced) {
        const table = clause.split(/\s+/)[1];
        expect(tables).toContain(table);
      }
    }
  });
});

describe("radky", () => {
  it("declines the Czech noun by count", () => {
    expect(radky(1)).toBe("řádek");
    expect(radky(3)).toBe("řádky");
    expect(radky(0)).toBe("řádků");
    expect(radky(10)).toBe("řádků");
  });
});

describe("diffMessage", () => {
  it("names the row counts when the student returns too many", () => {
    const msg = diffMessage(rows([[1], [2], [3]]), rows([[1]]), false);
    expect(msg).toContain("3 řádky");
    expect(msg).toContain("je 1");
    expect(msg).toContain("zúží");
  });

  it("points at an over-strict condition when nothing came back", () => {
    const msg = diffMessage(rows([]), rows([[1], [2]]), false);
    expect(msg).toContain("nevrátil žádný řádek");
    expect(msg).toContain("WHERE");
  });

  it("points at SELECT when only the column count differs", () => {
    const msg = diffMessage(rows([["a", 1]]), rows([["a"]]), false);
    expect(msg).toContain("2 sloupce místo 1");
    expect(msg).toContain("SELECT");
  });

  it("points at ORDER BY when the rows are right but shuffled", () => {
    const mine = rows([["b"], ["a"]]);
    const ref = rows([["a"], ["b"]]);
    expect(diffMessage(mine, ref, true)).toContain("ORDER BY");
  });

  it("stays generic about ordering when the task does not order", () => {
    const msg = diffMessage(rows([["b"], ["a"]]), rows([["a"], ["b"]]), false);
    expect(msg).not.toContain("ORDER BY");
    expect(msg).toContain("hodnoty ne");
  });

  it("blames the missing WHERE when a mutation emptied the table", () => {
    const msg = diffMessage(rows([]), rows([[1], [2]]), false, true);
    expect(msg).toContain("tabulka prázdná");
    expect(msg).toContain("chybí WHERE");
    // Opačná diagnóza než u SELECTu – tady podmínka nechybí kvůli přísnosti.
    expect(msg).not.toContain("moc přísná");
  });

  it("does not guess the direction of a mutation mistake", () => {
    // U INSERTu znamená „míň řádků" nepřidal, u DELETu smazal moc – neuhodneme.
    const chybi = diffMessage(rows([[1]]), rows([[1], [2]]), false, true);
    const prebyva = diffMessage(rows([[1], [2], [3]]), rows([[1], [2]]), false, true);
    for (const msg of [chybi, prebyva]) {
      expect(msg).toContain("zasáhl jiné řádky");
      expect(msg).not.toMatch(/chybí ti podmínka|odfiltrovala/);
    }
  });

  it("names swapped columns instead of blaming the values", () => {
    const mine = rows([["Babička", 1855]], ["nazev", "rok"]);
    const ref = rows([[1855, "Babička"]], ["rok", "nazev"]);
    const msg = diffMessage(mine, ref, false);
    expect(msg).toContain("prohozené");
    expect(msg).not.toContain("hodnoty ne");
  });

  it("never leaks the expected values", () => {
    const msg = diffMessage(rows([["Máj"]]), rows([["Babička"]]), false);
    expect(msg).not.toContain("Babička");
  });
});

describe("sqlErrorCs", () => {
  it("reads a missing column as forgotten apostrophes", () => {
    // Nejčastější chyba začátečníka: WHERE zanr = poezie (bez apostrofů).
    const msg = sqlErrorCs("no such column: poezie");
    expect(msg).toContain("apostrof");
    expect(msg).toContain("'poezie'");
    expect(msg).not.toMatch(/no such column/i);
  });

  it("turns a duplicate key into the reset instruction", () => {
    const msg = sqlErrorCs("UNIQUE constraint failed: knihy.id");
    expect(msg).toContain("Obnovit databázi");
  });

  it("tells the student to qualify an ambiguous column", () => {
    const msg = sqlErrorCs("ambiguous column name: nazev");
    expect(msg).toContain("knihy.nazev");
  });

  it("points at the spot of a syntax error", () => {
    expect(sqlErrorCs('near "FRM": syntax error')).toContain("FRM");
  });

  it("names the three real tables when one is missing", () => {
    const msg = sqlErrorCs("no such table: knihovna");
    expect(msg).toContain("knihy");
    expect(msg).toContain("vypujcky");
  });

  it("passes through anything it does not recognise", () => {
    expect(sqlErrorCs("something entirely new")).toBe("something entirely new");
  });
});
