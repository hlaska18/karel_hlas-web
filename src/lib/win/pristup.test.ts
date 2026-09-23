import { describe, expect, it } from "vitest";
import { kodSedi, type Prostredi } from "./pristup";

/*
 * Přístup do obou simulací. Dřív neměl žádný test, přitom je to jediná věc,
 * která může celou hodinu zastavit u dveří: když kód nesedí, žák se
 * nedostane dál a učitel to zjistí až před třídou.
 */
const OBE: Prostredi[] = ["windows", "macos"];

describe("společný kód", () => {
  it("platí tak, jak je napsaný na tabuli – do obou prostředí", () => {
    for (const p of OBE) {
      expect(kodSedi("spstabor", p)).toBe(true);
      expect(kodSedi("SPSTABOR", p)).toBe(true);
    }
  });

  it("odpouští mezery, pomlčky a velikost písmen", () => {
    expect(kodSedi("sps tabor", "windows")).toBe(true);
    expect(kodSedi("SPS-Tabor", "macos")).toBe(true);
    expect(kodSedi("  spstabor  ", "windows")).toBe(true);
  });

  it("odpouští diakritiku – škola se jmenuje SPŠ Tábor", () => {
    expect(kodSedi("SPŠ Tábor", "macos")).toBe(true);
    expect(kodSedi("spš tábor", "windows")).toBe(true);
    expect(kodSedi("spštábor", "macos")).toBe(true);
  });

  it("dřívější společný kód OS2026 už neplatí nikam", () => {
    for (const p of OBE) expect(kodSedi("OS2026", p)).toBe(false);
  });
});

/*
 * Veřejné kódy pro učitele z jiných škol (od 23. 9. 2026). Každý platí jen
 * do SVÉHO prostředí – a na zamykací obrazovce macOS proto nesmí stát, že
 * jeden kód platí do obou.
 */
describe("veřejné kódy pro cizí učitele", () => {
  it("WIN11 otevře Windows, ne macOS", () => {
    expect(kodSedi("WIN11", "windows")).toBe(true);
    expect(kodSedi("win 11", "windows")).toBe(true);
    expect(kodSedi("WIN11", "macos")).toBe(false);
  });

  it("MACOS otevře macOS, ne Windows", () => {
    expect(kodSedi("MACOS", "macos")).toBe(true);
    expect(kodSedi("macOS", "macos")).toBe(true);
    expect(kodSedi("mac os", "macos")).toBe(true);
    expect(kodSedi("MACOS", "windows")).toBe(false);
  });
});

describe("kódy tříd", () => {
  it("platí dál, do obou prostředí", () => {
    for (const p of OBE) {
      expect(kodSedi("1LA-2026", p)).toBe(true);
      expect(kodSedi("1lb 2026", p)).toBe(true);
      expect(kodSedi("1S-2026", p)).toBe(true);
      expect(kodSedi("1P-2026", p)).toBe(true);
    }
  });
});

describe("nesmysl", () => {
  it("neprojde", () => {
    for (const p of OBE) {
      expect(kodSedi("", p)).toBe(false);
      expect(kodSedi("   ", p)).toBe(false);
      expect(kodSedi("heslo", p)).toBe(false);
      expect(kodSedi("sps", p)).toBe(false);
    }
  });
});
