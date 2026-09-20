import { describe, expect, it } from "vitest";
import { vytvorDiskMac } from "./seed";
import { prohledej } from "./hledani";
import { jeSkryte } from "./cesty";

const disk = vytvorDiskMac();

describe("prohledej", () => {
  it("prazdny dotaz nevraci nic", () => {
    expect(prohledej(disk, "")).toEqual([]);
    expect(prohledej(disk, "   ")).toEqual([]);
  });

  it("najde polozku bez ohledu na diakritiku a velikost pismen", () => {
    const nalezy = prohledej(disk, "precti");
    expect(nalezy.length).toBeGreaterThan(0);
    expect(nalezy[0].uzel.jmeno).toContain("řečti");
  });

  it("nevraci polozky s teckou na zacatku", () => {
    // Tečkové soubory na disku jsou (.DS_Store, .zshrc), ale hledání je míjí.
    expect(prohledej(disk, "zshrc")).toEqual([]);
    expect(prohledej(disk, "DS_Store")).toEqual([]);
    expect(prohledej(disk, "a", 200).every((n) => !jeSkryte(n.uzel.jmeno))).toBe(true);
  });

  it("nelze do balicku .app", () => {
    const nalezy = prohledej(disk, "Terminál", 50);
    // Samotný balíček se najít má, ale nic z jeho vnitřku.
    expect(nalezy.some((n) => n.uzel.jmeno === "Terminál.app")).toBe(true);
    expect(nalezy.every((n) => !n.cesta.slice(0, -1).some((c) => c.endsWith(".app")))).toBe(true);
  });

  it("radi napred to, co dotazem zacina", () => {
    const nalezy = prohledej(disk, "do", 50);
    const zacina = nalezy.findIndex((n) => n.uzel.jmeno.toLowerCase().startsWith("do"));
    const neZacina = nalezy.findIndex((n) => !n.uzel.jmeno.toLowerCase().startsWith("do"));
    if (zacina !== -1 && neZacina !== -1) expect(zacina).toBeLessThan(neZacina);
  });

  it("drzi limit", () => {
    expect(prohledej(disk, "a", 3).length).toBeLessThanOrEqual(3);
  });

  it("cesta zacina korenem a konci jmenem polozky", () => {
    // Složky na disku se jmenují anglicky (Documents), česky je jen popisek
    // v postranním panelu Finderu – přesně jako na skutečném Macu.
    const n = prohledej(disk, "Documents")[0];
    expect(n.cesta[0]).toBe("");
    expect(n.cesta[n.cesta.length - 1]).toBe(n.uzel.jmeno);
  });
});
