/**
 * Opravy po bezpečnostní kontrole Codexem (29. 9. 2026): vzorce v exportu do
 * Excelu, limity při načítání CSV a jméno „__proto__“ v kódu postupu.
 */

import { describe, expect, it } from "vitest";
import { bezVzorce, doCsv, EXPORT_PRO_EXCEL, parsujCsv, MAX_SLOUPCU_CSV } from "@/lib/dbb/csv";
import { sloucitPostupy, type Postup } from "@/lib/dbb/kodPostupu";

describe("export do Excelu bez vzorců", () => {
  it("text, který by Excel vzal jako vzorec, dostane apostrof", () => {
    expect(bezVzorce("=1+1")).toBe("'=1+1");
    expect(bezVzorce('=HYPERLINK("http://example.com";"klikni")')).toBe('\'=HYPERLINK("http://example.com";"klikni")');
    expect(bezVzorce("+ahoj")).toBe("'+ahoj");
    expect(bezVzorce("-ahoj")).toBe("'-ahoj");
    expect(bezVzorce("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(bezVzorce("\t=1")).toBe("'\t=1");
  });

  it("čísla a obyčejný text nechá být", () => {
    expect(bezVzorce("-5")).toBe("-5");
    expect(bezVzorce("+420")).toBe("+420");
    expect(bezVzorce("-18,5")).toBe("-18,5");
    expect(bezVzorce("Eva Nováková")).toBe("Eva Nováková");
    expect(bezVzorce("12/16")).toBe("12/16");
  });

  it("doCsv chrání text, ale číslo zůstane číslem", () => {
    const text = doCsv(["jmeno", "body"], [["=1+1", -5], ["Eva", 2.5]], EXPORT_PRO_EXCEL);
    expect(text).toBe("jmeno;body\r\n'=1+1;-5\r\nEva;2,5\r\n");
  });
});

describe("limity při načítání CSV", () => {
  it("skončí po řádku navíc, víc řádků nepřipraví", () => {
    const text = Array.from({ length: 50 }, (_, i) => `r${i};${i}`).join("\n");
    const r = parsujCsv(text, ";", 10);
    expect(r.length).toBe(11);
    expect(r[10]).toEqual(["r10", "10"]);
  });

  it("buňky za limitem sloupců zahodí, jednu navíc nechá, ať jde poznat „moc“", () => {
    const radek = Array.from({ length: 10000 }, (_, i) => `s${i}`).join(";");
    const r = parsujCsv(radek, ";", Infinity, MAX_SLOUPCU_CSV);
    expect(r[0].length).toBe(MAX_SLOUPCU_CSV + 1);
  });

  it("prázdné řádky se nepočítají do limitu", () => {
    const r = parsujCsv("a;b\n;;\n\n1;2\n", ";", 1);
    expect(r).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("přehled třídy a zvláštní jména", () => {
  it("jméno __proto__ ani constructor přehled neshodí", () => {
    const zaklad: Postup = { jmeno: "Eva", datum: "2026-10-01", hotove: [1], sede: [], navic: 0 };
    const zaci = sloucitPostupy([
      zaklad,
      { ...zaklad, jmeno: "__proto__" },
      // Z dekódovaného kódu (JSON.parse) je „__proto__“ vlastní klíč, ne prototyp.
      { ...zaklad, jmeno: "constructor", sady: JSON.parse('{"__proto__":[1,2,0]}') as Postup["sady"] },
    ]);
    expect(zaci.map((z) => z.jmeno).sort()).toEqual(["Eva", "__proto__", "constructor"].sort());
  });
});
