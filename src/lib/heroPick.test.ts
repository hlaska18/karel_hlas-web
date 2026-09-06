import { describe, expect, it } from "vitest";
import { getBankStats, getHeroPool, pickHeroHighlights } from "@/lib/heroPick";
import { canPreview } from "@/lib/nahled";
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

describe("getHeroPool", () => {
  it("vynechá metodiky, externí odkazy i binárky", () => {
    const pool = getHeroPool([
      ...POOL,
      item({ href: "g.docx", tool: "Word", ext: "docx", audience: "teacher" }),
      item({ href: "h", tool: "Excel", ext: "link", external: true }),
      item({ href: "i.db", tool: "Databáze", ext: "db" }),
    ]);
    expect(pool.map((i) => i.href)).toEqual(POOL.map((i) => i.href));
  });

  it("radši ukáže i méně názorné typy – ale jen ty, které umí náhled", () => {
    // Dřív tenhle test tvrdil, že samotná `.db` se ukáže, než aby bylo
    // prázdno. Od chvíle, kdy karta otevírá náhled, je to naopak: karta,
    // po jejímž kliknutí se nic nestane, je horší než žádná karta.
    expect(getHeroPool([item({ href: "x.db", tool: "Databáze", ext: "db" })])).toHaveLength(0);

    // Uvolňuje se jen preference typu: `.png` není v SHOWCASE_EXT, ale
    // náhled ho umí, takže projde.
    const png = item({ href: "x.png", tool: "Grafika a multimédia", ext: "png" });
    expect(getHeroPool([png, item({ href: "y.db", tool: "Databáze", ext: "db" })])).toEqual([png]);
  });

  it("nenabídne nic, co náhled neumí otevřít", () => {
    const pool = getHeroPool([
      ...POOL,
      item({ href: "t.xlsx", tool: "Excel", ext: "xlsx" }),
      item({ href: "u.pbix", tool: "Power BI", ext: "pbix" }),
      item({ href: "v.zip", tool: "Grafika a multimédia", ext: "zip" }),
      item({ href: "/windows", tool: "Operační systémy", ext: "link", interactive: true }),
      // Laboratoř: `canPreview("html")` je true, ale je to hotová stránka
      // ke spuštění, ne zdroják ke čtení – vyřadit ji musí `!interactive`.
      item({ href: "lab.html", tool: "Grafika a multimédia", ext: "html", interactive: true }),
    ]);
    expect(pool.map((i) => i.href)).toEqual(POOL.map((i) => i.href));
  });

  it("každá nabídnutá položka projde náhledem", () => {
    // Invariant místo výčtu přípon: kdyby někdo přidal do SHOWCASE_EXT typ,
    // který náhled neumí, spadne tohle, ne až karta v prohlížeči.
    for (const it of getHeroPool(POOL)) expect(canPreview(it.ext)).toBe(true);
  });
});

describe("pickHeroHighlights", () => {
  it("vrátí požadovaný počet", () => {
    expect(pickHeroHighlights(POOL, 3)).toHaveLength(3);
  });

  it("nikdy nedá dva materiály ze stejného tématu", () => {
    for (let seed = 0; seed < 50; seed++) {
      const tools = pickHeroHighlights(POOL, 3, () => seed / 50).map((i) => i.tool);
      expect(new Set(tools).size).toBe(tools.length);
    }
  });

  it("preferuje různé typy souborů", () => {
    const exts = pickHeroHighlights(POOL, 3, Math.random).map((i) => i.ext);
    expect(new Set(exts).size).toBe(3);
  });

  it("bez zdroje náhody vrací pokaždé stejnou trojici (kvůli hydrataci)", () => {
    expect(pickHeroHighlights(POOL, 3)).toEqual(pickHeroHighlights(POOL, 3));
  });

  it("s náhodou se výběr napříč načteními mění", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 25; i++) {
      seen.add(
        pickHeroHighlights(POOL, 3, Math.random)
          .map((x) => x.href)
          .join(),
      );
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("nespadne na prázdné bance", () => {
    expect(pickHeroHighlights([], 3)).toEqual([]);
  });
});

describe("getBankStats", () => {
  it("počítá jen hostované soubory, ale všechna témata z galerie", () => {
    // Téma, které má jen odkaz na cizí zdroj (dnes Word, Excel, Power BI),
    // v galerii dlaždici má – hero ho tedy musí započítat, jinak slíbí míň
    // témat, než kolik jich je na obrazovce vidět.
    const stats = getBankStats([...POOL, item({ href: "x", tool: "Ostatní", ext: "link", external: true })]);
    expect(stats).toEqual({ files: 6, topics: 6 });
  });
});
