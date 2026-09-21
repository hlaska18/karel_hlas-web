import { describe, expect, it } from "vitest";
import { kodSedi } from "./pristup";

/*
 * Přístup do obou simulací. Dřív neměl žádný test, přitom je to jediná věc,
 * která může celou hodinu zastavit u dveří: když kód nesedí, žák se
 * nedostane dál a učitel to zjistí až před třídou.
 */
describe("společný kód", () => {
  it("platí tak, jak je napsaný na tabuli", () => {
    expect(kodSedi("spstabor")).toBe(true);
    expect(kodSedi("SPSTABOR")).toBe(true);
  });

  it("odpouští mezery, pomlčky a velikost písmen", () => {
    expect(kodSedi("sps tabor")).toBe(true);
    expect(kodSedi("SPS-Tabor")).toBe(true);
    expect(kodSedi("  spstabor  ")).toBe(true);
  });

  it("odpouští diakritiku – škola se jmenuje SPŠ Tábor", () => {
    expect(kodSedi("SPŠ Tábor")).toBe(true);
    expect(kodSedi("spš tábor")).toBe(true);
    expect(kodSedi("spštábor")).toBe(true);
  });

  it("dřívější společné kódy už neplatí", () => {
    expect(kodSedi("WIN11")).toBe(false);
    expect(kodSedi("win 11")).toBe(false);
    expect(kodSedi("OS2026")).toBe(false);
  });
});

describe("kódy tříd", () => {
  it("platí dál", () => {
    expect(kodSedi("1LA-2026")).toBe(true);
    expect(kodSedi("1lb 2026")).toBe(true);
    expect(kodSedi("1S-2026")).toBe(true);
    expect(kodSedi("1P-2026")).toBe(true);
  });
});

describe("nesmysl", () => {
  it("neprojde", () => {
    expect(kodSedi("")).toBe(false);
    expect(kodSedi("   ")).toBe(false);
    expect(kodSedi("heslo")).toBe(false);
    expect(kodSedi("sps")).toBe(false);
  });
});
