import { describe, expect, it } from "vitest";
import { datumMenuMac, polozekSlovy } from "@/lib/mac/text";

describe("datum v horní liště", () => {
  it("píše den zkratkou malým písmenem, jako český macOS", () => {
    expect(datumMenuMac(new Date(2026, 8, 24))).toBe("čt 24. 9.");
    expect(datumMenuMac(new Date(2026, 8, 27))).toBe("ne 27. 9.");
  });
});

describe("počet položek", () => {
  it("skloňuje po číslovce", () => {
    expect(polozekSlovy(1)).toBe("1 položka");
    expect(polozekSlovy(3)).toBe("3 položky");
    expect(polozekSlovy(5)).toBe("5 položek");
  });
});
