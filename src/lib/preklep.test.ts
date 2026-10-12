import { describe, expect, it } from "vitest";
import { odhadniSimulator } from "./preklep";

describe("odhadniSimulator", () => {
  it("pozná překlepy z Analytics (5.–12. 10. 2026)", () => {
    for (const adresa of [
      "/windovs",
      "/windous",
      "/wimdows",
      "/windws",
      "/windows)",
      "/windows/users",
      "/windows/dokumenty",
      "/windowsD%C3%9A:%20dokon%C4%8Dit%20%C3%BAkol",
      "/Windows",
      "/en/windovs",
    ]) {
      expect(odhadniSimulator(adresa), adresa).toBe("windows");
    }
  });

  it("macOS a SQL", () => {
    expect(odhadniSimulator("/mac")).toBe("macos");
    expect(odhadniSimulator("/macso")).toBe("macos");
    expect(odhadniSimulator("/makos")).toBe("macos");
    expect(odhadniSimulator("/sqll")).toBe("sql");
  });

  it("jiné adresy nechá být", () => {
    for (const adresa of ["/", "/druha.html", "/linux", "/soukromi", "/en", "/%E0%A4%A", "/pro-ucitele/xyz"]) {
      expect(odhadniSimulator(adresa), adresa).toBeNull();
    }
  });
});
