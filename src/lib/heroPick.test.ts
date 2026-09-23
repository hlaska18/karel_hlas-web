import { describe, expect, it } from "vitest";
import { getBankStats } from "@/lib/heroPick";
import type { BankItem } from "@/lib/materials";

/** Minimální položka banky – testy zajímá jen nástroj, přípona a publikum. */
function item(partial: Partial<BankItem> & { href: string; tool: string; ext: string }): BankItem {
  return {
    label: { cs: partial.href, en: partial.href },
    kind: "doc",
    sizeBytes: 1000,
    topicNo: 1,
    topicLabel: { cs: "Téma", en: "Topic" },
    audience: "student",
    courseIds: ["1L"],
    coursesLabel: { cs: "1. ročník", en: "Year 1" },
    ...partial,
  } as BankItem;
}

const POOL: BankItem[] = [
  item({ href: "a.docx", tool: "Digitální gramotnost", ext: "docx" }),
  item({ href: "b.docx", tool: "Digitální gramotnost", ext: "docx" }),
  item({ href: "c.pdf", tool: "Word", ext: "pdf" }),
  item({ href: "d.pdf", tool: "Excel", ext: "pdf" }),
  item({ href: "e.py", tool: "Python", ext: "py" }),
  item({ href: "f.sql", tool: "Databáze", ext: "sql" }),
];

describe("getBankStats", () => {
  it("počítá jen hostované soubory, ale všechna témata z galerie", () => {
    // Téma, které má jen odkaz na cizí zdroj (dnes Word, Excel, Power BI),
    // v galerii dlaždici má – hero ho tedy musí započítat, jinak slíbí míň
    // témat, než kolik jich je na obrazovce vidět.
    const stats = getBankStats([...POOL, item({ href: "x", tool: "Ostatní", ext: "link", external: true })]);
    expect(stats).toEqual({ files: 6, topics: 6 });
  });
});
