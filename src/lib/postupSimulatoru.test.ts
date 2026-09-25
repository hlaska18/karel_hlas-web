import { describe, expect, it } from "vitest";
import {
  dekodujSimulator,
  jmenoPlatne,
  najdiKodySimulatoru,
  sloucitSimulatory,
  stejneJmeno,
  textKopieSimulatoru,
  zakodujSimulator,
  type PostupSimulatoru,
} from "./postupSimulatoru";

/*
 * Kód postupu ze simulátorů Windows a macOS (od 25. 9. 2026 místo vstupních
 * kódů). Na něm stojí, že učitel uvidí práci žáka jinde než na jeho počítači
 * a že žák může pokračovat doma.
 */
const zak = (jine: Partial<PostupSimulatoru> = {}): PostupSimulatoru => ({
  simulator: "macos",
  jmeno: "Šárka Řeháková",
  datum: "2026-09-25",
  splneno: ["zavri-okno-finderu", "poznamky-bez-okna"],
  celkem: 14,
  ...jine,
});

describe("kód postupu simulátorů", () => {
  it("se přečte zpátky i s diakritikou a pozná simulátor podle předpony", () => {
    const kod = zakodujSimulator(zak());
    expect(kod.indexOf("MAC1-")).toBe(0);
    expect(dekodujSimulator(kod)).toEqual(zak());
    const win = zakodujSimulator(zak({ simulator: "windows", splneno: ["pripony"] }));
    expect(win.indexOf("WIN1-")).toBe(0);
    expect(dekodujSimulator(win)?.simulator).toBe("windows");
  });

  it("najde kódy v celém vlákně z Teams a cizí text přeskočí", () => {
    const text = `Ahoj, posílám: Šárka · macOS 2/14 · ${zakodujSimulator(zak())}\nA tady Windows ${zakodujSimulator(
      zak({ simulator: "windows", jmeno: "Petr" }),
    )} a SQLKURZ1-xyz a WIN1-!!!`;
    const kody = najdiKodySimulatoru(text);
    expect(kody.map((k) => k.simulator)).toEqual(["macos", "windows"]);
    expect(dekodujSimulator("WIN1-nesmysl")).toBeNull();
  });

  it("sečte kódy téhož žáka z domu i ze školy, ale Windows a macOS drží zvlášť", () => {
    const slouceno = sloucitSimulatory([
      zak({ datum: "2026-09-24", splneno: ["a", "b"] }),
      zak({ jmeno: "rehakova sarka", datum: "2026-09-25", splneno: ["b", "c"], celkem: 15 }),
      zak({ simulator: "windows", splneno: ["x"] }),
    ]);
    expect(slouceno.length).toBe(2);
    const mac = slouceno.filter((z) => z.simulator === "macos")[0];
    expect(mac.splneno).toEqual(["a", "b", "c"]);
    expect(mac.datum).toBe("2026-09-25");
    expect(mac.celkem).toBe(15);
    expect(sloucitSimulatory([zak(), zak({ simulator: "windows" })]).length).toBe(2);
  });

  it("do Teams jde jméno a skóre před kódem", () => {
    expect(textKopieSimulatoru(zak(), "MAC1-abc", 2, 14)).toBe("Šárka Řeháková · macOS 2/14 · MAC1-abc");
  });
});

describe("přihlášení jménem", () => {
  it("chce aspoň dvě písmena a ne výchozí Žák", () => {
    expect(jmenoPlatne("Eva Malá")).toBe(true);
    expect(jmenoPlatne("  ")).toBe(false);
    expect(jmenoPlatne("E")).toBe(false);
    expect(jmenoPlatne("žák")).toBe(false);
  });

  it("pozná stejného žáka bez ohledu na diakritiku, velikost písmen a pořadí slov", () => {
    expect(stejneJmeno("Novák Adam", "adam novak")).toBe(true);
    expect(stejneJmeno("Adam Novák", "Eva Nováková")).toBe(false);
  });
});
