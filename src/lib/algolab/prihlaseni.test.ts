import { describe, expect, it } from "vitest";
import { dekodujAlgolab, jePrazdna, zakodujAlgolab, type PraceAlgolabu } from "./kod";
import { vychoziLekce } from "./lekce";
import { vstupAlgolabu, vypadaJakoKod } from "./prihlaseni";
import { CISLA_LEKCI, LEKCE } from "./registr";
import { vychoziStav } from "./stav";

const prazdna = (): PraceAlgolabu => ({
  h4: vychoziStav(),
  lekce: Object.fromEntries(CISLA_LEKCI.map((c) => [c, vychoziLekce(LEKCE[c].faze, LEKCE[c].vychozi)])),
});
const rozdelana = (): PraceAlgolabu => ({ ...prazdna(), h4: { ...vychoziStav(), plan: ["B", "C"], planPotvrzen: true } });

/*
 * Přihlášení do ALGOLABu (Karel 11. 11. 2026): do jednoho pole jméno, nebo kód
 * postupu. Kód proto nese i jméno.
 */
describe("přihlášení do ALGOLABu", () => {
  it("kód postupu nese jméno, starší kód beze jména se dál rozbalí", () => {
    const kod = zakodujAlgolab({ ...rozdelana(), jmeno: "  Šárka Řeháková " });
    expect(dekodujAlgolab(kod)).toEqual({ ...rozdelana(), jmeno: "Šárka Řeháková" });
    const bezJmena = dekodujAlgolab(zakodujAlgolab(rozdelana()));
    expect(bezJmena).toEqual(rozdelana());
    expect(bezJmena && "jmeno" in bezJmena).toBe(false);
  });

  it("jméno se pozná jako jméno", () => {
    expect(vstupAlgolabu("  Jan   Novák ")).toEqual({ druh: "jmeno", jmeno: "Jan Novák" });
    expect(vypadaJakoKod("Jan Novák")).toBe(false);
    for (const spatne of ["", " ", "J", "Žák", "zak"]) expect(vstupAlgolabu(spatne)).toMatchObject({ druh: "chyba" });
  });

  it("kód vložený místo jména dá jméno i práci, i uprostřed zprávy", () => {
    const kod = zakodujAlgolab({ ...rozdelana(), jmeno: "Jan Novák" });
    const v = vstupAlgolabu(`můj kód: ${kod}`);
    expect(v).toEqual({ druh: "kod", jmeno: "Jan Novák", prace: { ...rozdelana(), jmeno: "Jan Novák" } });
    expect(vypadaJakoKod(kod)).toBe(true);
  });

  it("useknutý kód, kód beze jména a kód odjinud odmítne s vysvětlením", () => {
    const kod = zakodujAlgolab({ ...rozdelana(), jmeno: "Jan Novák" });
    expect(vstupAlgolabu(kod.slice(0, kod.length - 10))).toMatchObject({ druh: "chyba", hlaska: expect.stringContaining("není celý kód") });
    expect(vstupAlgolabu(zakodujAlgolab(rozdelana()))).toMatchObject({ druh: "chyba", hlaska: expect.stringContaining("nenese jméno") });
    expect(vstupAlgolabu(zakodujAlgolab({ ...rozdelana(), jmeno: "Žák" }))).toMatchObject({ druh: "chyba" });
    for (const [cizi, odkud] of [
      ["WIN1-abc", "Windows"],
      ["MAC1-abc", "macOS"],
      ["WSIT1-abc", "NETLAB"],
      ["SQLKURZ1-abc", "SQL"],
      ["ALGZ1-abc", "závěrečného ověření"],
    ]) {
      expect(vstupAlgolabu(`Jan Novák · ${cizi}`)).toMatchObject({ druh: "chyba", hlaska: expect.stringContaining(odkud) });
    }
  });

  it("pozná prázdnou a rozdělanou práci (podle toho se ptá, čí je)", () => {
    expect(jePrazdna(prazdna())).toBe(true);
    expect(jePrazdna({ ...prazdna(), jmeno: "Jan Novák" })).toBe(true);
    expect(jePrazdna(rozdelana())).toBe(false);
  });
});
