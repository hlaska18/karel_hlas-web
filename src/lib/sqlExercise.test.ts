import { describe, expect, it } from "vitest";
import { SCHEMA, SCHEMA_INFO, LESSONS, diffMessage, radky } from "@/lib/sqlExercise";

const rows = (values: unknown[][]) => ({ columns: [], values });

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

  it("uses SELECT statements for the example and reference queries", () => {
    for (const lesson of LESSONS) {
      expect(lesson.example.trim().toUpperCase()).toMatch(/^SELECT\b/);
      expect(lesson.reference.trim().toUpperCase()).toMatch(/^SELECT\b/);
    }
  });

  it("keeps the hint from being the whole solution", () => {
    // Nápověda má postrčit; celý dotaz patří pod tlačítko „Ukázat řešení“.
    const bare = (s: string) => s.replace(/\s+/g, " ").replace(/;/g, "").trim().toLowerCase();
    for (const lesson of LESSONS) {
      expect(bare(lesson.hint)).not.toContain(bare(lesson.reference));
    }
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

  it("never leaks the expected values", () => {
    const msg = diffMessage(rows([["Máj"]]), rows([["Babička"]]), false);
    expect(msg).not.toContain("Babička");
  });
});
