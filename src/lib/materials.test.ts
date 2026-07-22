import { describe, expect, it } from "vitest";
import {
  TOOL_ORDER,
  getBankItems,
  getBankToolCounts,
  type BankItem,
} from "@/lib/materials";

const items = getBankItems();

describe("getBankItems", () => {
  it("returns a non-empty flat list of materials from public/materialy", () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("produces well-formed items", () => {
    for (const it of items) {
      expect(typeof it.href).toBe("string");
      expect(it.href.length).toBeGreaterThan(0);
      expect(it.label.cs.length).toBeGreaterThan(0);
      expect(it.label.en.length).toBeGreaterThan(0);
      expect(it.ext).toBe(it.ext.toLowerCase());
      expect(TOOL_ORDER).toContain(it.tool);
      expect(it.topicNo).toBeGreaterThanOrEqual(1);
      expect(["teacher", "student", "both"]).toContain(it.audience);
      expect(it.courseIds.length).toBeGreaterThan(0);
      expect(it.sizeBytes).toBeGreaterThanOrEqual(0);
    }
  });

  it("URL-encodes hosted file hrefs and never emits raw spaces", () => {
    for (const it of items) {
      if (it.external) continue;
      expect(it.href.startsWith("/materialy/")).toBe(true);
      expect(it.href).not.toContain(" ");
    }
  });

  it("deduplicates identical materials shared across course fields", () => {
    const keyOf = (it: BankItem) =>
      [it.tool, it.audience, it.group?.cs ?? "", it.label.cs, it.ext].join("|").toLowerCase();
    const keys = items.map(keyOf);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("merges shared materials into multiple courseIds without duplicate ids", () => {
    for (const it of items) {
      expect(new Set(it.courseIds).size).toBe(it.courseIds.length);
    }
  });

  it("sorts items by the configured tool order", () => {
    const rank = (t: string) => {
      const i = TOOL_ORDER.indexOf(t);
      return i < 0 ? TOOL_ORDER.length : i;
    };
    for (let i = 1; i < items.length; i++) {
      expect(rank(items[i - 1].tool)).toBeLessThanOrEqual(rank(items[i].tool));
    }
  });

  it("labels items shared by all course fields as covering all fields", () => {
    const allFields = items.filter((it) => it.courseIds.length > 1);
    for (const it of allFields) {
      expect(it.coursesLabel.cs.length).toBeGreaterThan(0);
      expect(it.coursesLabel.en.length).toBeGreaterThan(0);
    }
  });
});

describe("getBankToolCounts", () => {
  const counts = getBankToolCounts();

  it("reports counts only for tools that have materials, in tool order", () => {
    const tools = counts.map((c) => c.tool);
    expect(tools).toEqual(TOOL_ORDER.filter((t) => tools.includes(t)));
  });

  it("matches the number of items grouped by tool", () => {
    const expected = new Map<string, number>();
    for (const it of items) expected.set(it.tool, (expected.get(it.tool) ?? 0) + 1);
    for (const c of counts) {
      expect(c.count).toBe(expected.get(c.tool));
      expect(c.count).toBeGreaterThan(0);
      expect(typeof c.hasTeacher).toBe("boolean");
    }
  });

  it("accounts for every material across all tool buckets", () => {
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(items.length);
  });
});
