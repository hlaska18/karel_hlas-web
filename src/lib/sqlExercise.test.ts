import { describe, expect, it } from "vitest";
import { SCHEMA, SCHEMA_INFO, LESSONS } from "@/lib/sqlExercise";

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
