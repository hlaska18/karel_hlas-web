import { describe, expect, it } from "vitest";
import {
  TOOL_LABEL,
  TOOL_ICON,
  toolLabel,
  countMaterials,
  materialTypeOf,
} from "@/lib/bankLabels";
import type { BankItem } from "@/lib/materials";

function makeItem(overrides: Partial<BankItem> = {}): BankItem {
  return {
    href: "/materialy/x",
    label: { cs: "Soubor", en: "File" },
    ext: "pdf",
    kind: "doc",
    sizeBytes: 0,
    tool: "Word",
    topicNo: 1,
    topicLabel: { cs: "Téma", en: "Topic" },
    audience: "student",
    courseIds: ["1L"],
    coursesLabel: { cs: "", en: "" },
    ...overrides,
  };
}

describe("toolLabel", () => {
  it("returns the Czech label for a known tool", () => {
    expect(toolLabel("Databáze", "cs")).toBe("Databáze");
  });

  it("returns the English label for a known tool", () => {
    expect(toolLabel("Databáze", "en")).toBe("Database");
    expect(toolLabel("Ostatní", "en")).toBe("Other");
  });

  it("falls back to the raw tool name when unknown", () => {
    expect(toolLabel("Neznámý", "cs")).toBe("Neznámý");
    expect(toolLabel("Neznámý", "en")).toBe("Neznámý");
  });

  it("has matching cs/en entries for every mapped tool", () => {
    for (const [tool, labels] of Object.entries(TOOL_LABEL)) {
      expect(toolLabel(tool, "cs")).toBe(labels.cs);
      expect(toolLabel(tool, "en")).toBe(labels.en);
    }
  });
});

describe("TOOL_ICON", () => {
  it("points every icon at an existing glass image path", () => {
    for (const path of Object.values(TOOL_ICON)) {
      expect(path).toMatch(/^\/images\/tools\/glass\/.+\.png$/);
    }
  });

  it("only references tools that also have a label", () => {
    for (const tool of Object.keys(TOOL_ICON)) {
      expect(TOOL_LABEL[tool]).toBeDefined();
    }
  });
});

describe("countMaterials", () => {
  it("uses English singular/plural", () => {
    expect(countMaterials(1, "en")).toBe("1 material");
    expect(countMaterials(0, "en")).toBe("0 materials");
    expect(countMaterials(2, "en")).toBe("2 materials");
    expect(countMaterials(5, "en")).toBe("5 materials");
  });

  it("uses Czech singular form for 1", () => {
    expect(countMaterials(1, "cs")).toBe("1 materiál");
  });

  it("uses Czech paucal form for 2–4", () => {
    expect(countMaterials(2, "cs")).toBe("2 materiály");
    expect(countMaterials(3, "cs")).toBe("3 materiály");
    expect(countMaterials(4, "cs")).toBe("4 materiály");
  });

  it("uses Czech genitive plural for 0 and 5+", () => {
    expect(countMaterials(0, "cs")).toBe("0 materiálů");
    expect(countMaterials(5, "cs")).toBe("5 materiálů");
    expect(countMaterials(11, "cs")).toBe("11 materiálů");
  });
});

describe("materialTypeOf", () => {
  it("detects a test from the file label", () => {
    expect(materialTypeOf(makeItem({ label: { cs: "Test z Pythonu", en: "" } }))).toEqual({
      cs: "Test",
      en: "Test",
    });
  });

  it("detects a solution", () => {
    expect(materialTypeOf(makeItem({ label: { cs: "Řešení úlohy", en: "" } }))).toEqual({
      cs: "Řešení",
      en: "Solution",
    });
  });

  it("matches ascii-only spellings without diacritics", () => {
    expect(materialTypeOf(makeItem({ label: { cs: "reseni bez diakritiky", en: "" } }))).toEqual({
      cs: "Řešení",
      en: "Solution",
    });
  });

  it("returns null when nothing matches", () => {
    expect(materialTypeOf(makeItem({ label: { cs: "Obyčejný soubor", en: "" } }))).toBeNull();
  });

  it("suppresses the badge when the group already conveys the type", () => {
    expect(
      materialTypeOf(
        makeItem({
          group: { cs: "Testy z minulých let", en: "" },
          label: { cs: "Test 2023", en: "" },
        }),
      ),
    ).toBeNull();
  });

  it("respects rule priority (test before exercise)", () => {
    expect(materialTypeOf(makeItem({ label: { cs: "Test k úloze", en: "" } }))).toEqual({
      cs: "Test",
      en: "Test",
    });
  });

  it("tolerates a missing group", () => {
    expect(
      materialTypeOf(makeItem({ group: undefined, label: { cs: "Metodika", en: "" } })),
    ).toEqual({ cs: "Metodika", en: "Teaching notes" });
  });
});
