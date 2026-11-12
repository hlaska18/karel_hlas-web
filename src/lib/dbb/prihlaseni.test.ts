import { describe, expect, it } from "vitest";
import { zakoduj, type Postup } from "./kodPostupu";
import { vstupPrihlaseni, vypadaJakoKod } from "./prihlaseni";

const postup: Postup = { jmeno: "Adam Novák", datum: "2026-11-11", hotove: [1, 2, 3], sede: [2], navic: 1 };

/* Přihlášení do kurzu SQL (Karel 11. 11. 2026): jméno, nebo kód postupu místo jména. */
describe("přihlášení do kurzu SQL", () => {
  it("jméno se pozná jako jméno a zkrátí se na 40 znaků", () => {
    expect(vstupPrihlaseni("  Adam   Novák ", false)).toEqual({ druh: "jmeno", jmeno: "Adam Novák" });
    const dlouhe = vstupPrihlaseni("A".repeat(80), false);
    expect(dlouhe.druh === "jmeno" && dlouhe.jmeno.length).toBe(40);
    expect(vypadaJakoKod("Adam Novák")).toBe(false);
    for (const spatne of ["", "A", "Žák"]) expect(vstupPrihlaseni(spatne, false)).toMatchObject({ druh: "chyba" });
  });

  it("kód místo jména dá jméno i postup, i s celým řádkem z Teams", () => {
    const radek = `Adam Novák · Dotazy 3/13 · Program 0/6 · ${zakoduj(postup)}`;
    expect(vstupPrihlaseni(radek, false)).toMatchObject({ druh: "kod", jmeno: "Adam Novák", postup });
    expect(vypadaJakoKod(radek)).toBe(true);
  });

  it("v písemce se kód nenačte, jméno ano", () => {
    expect(vstupPrihlaseni(zakoduj(postup), true)).toMatchObject({ druh: "chyba", cs: expect.stringContaining("V písemce") });
    expect(vstupPrihlaseni("Adam Novák", true)).toEqual({ druh: "jmeno", jmeno: "Adam Novák" });
  });

  it("useknutý kód, kód beze jména a kód odjinud odmítne česky i anglicky", () => {
    expect(vstupPrihlaseni("SQLKURZ1-###", false)).toMatchObject({ druh: "chyba", cs: expect.stringContaining("není celý kód") });
    expect(vstupPrihlaseni(zakoduj({ ...postup, jmeno: "" }), false)).toMatchObject({ druh: "chyba", cs: expect.stringContaining("chybí jméno") });
    for (const cizi of ["WIN1-abc", "MAC1-abc", "WSIT1-abc", "ALG1-abc", "ALGZ1-abc"]) {
      const v = vstupPrihlaseni(cizi, false);
      expect(v).toMatchObject({ druh: "chyba", cs: expect.stringContaining("tady je DBLAB") });
      expect(v.druh === "chyba" && v.en.length).toBeGreaterThan(10);
    }
  });
});
