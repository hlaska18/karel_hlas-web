import { describe, expect, it } from "vitest";
import { reducerMac } from "@/lib/mac/reducer";
import { vychoziStavMac } from "@/lib/mac/stav";
import { najdi } from "@/lib/win/fs";
import { DOMOV, jeBalicek, jeSkryte, rozlozMac, slozMac, sVlnovkou } from "@/lib/mac/cesty";
import { vytvorDiskMac } from "@/lib/mac/seed";

describe("okno není program", () => {
  it("zavření okna aplikaci nechá běžet", () => {
    // Tohle je celá první úloha simulace. Kdyby to někdo „opravil" na chování
    // Windows, přestane dávat smysl, a tenhle test to zachytí.
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky" });
    expect(stav.bezici).toContain("poznamky");
    const id = stav.okna[0].id;

    stav = reducerMac(stav, { typ: "okno/zavri", id });
    expect(stav.okna).toHaveLength(0);
    expect(stav.bezici).toContain("poznamky");
  });

  it("teprve ukončení aplikaci zastaví", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky" });
    stav = reducerMac(stav, { typ: "app/ukonci", app: "poznamky" });
    expect(stav.bezici).not.toContain("poznamky");
    expect(stav.okna).toHaveLength(0);
  });

  it("Finder ukončit nejde", () => {
    // Není to omezení simulace, je to pravda o macOS.
    const stav = reducerMac(vychoziStavMac(), { typ: "app/ukonci", app: "finder" });
    expect(stav.bezici).toContain("finder");
  });

  it("po ukončení aplikace patří lišta zase Finderu", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "terminal" });
    expect(stav.vpredu).toBe("terminal");
    stav = reducerMac(stav, { typ: "app/ukonci", app: "terminal" });
    expect(stav.vpredu).toBe("finder");
  });
});

describe("cesty", () => {
  it("skládají se lomítky a bez písmene disku", () => {
    expect(slozMac(["", "Users", "zak", "Documents"])).toBe("/Users/zak/Documents");
    expect(slozMac([""])).toBe("/");
  });

  it("domovská složka se píše vlnovkou", () => {
    expect(sVlnovkou([...DOMOV, "Documents"])).toBe("~/Documents");
    expect(sVlnovkou(DOMOV)).toBe("~");
    expect(sVlnovkou(["Applications"])).toBe("/Applications");
  });

  it("skrytá položka se pozná podle tečky, ne podle příznaku", () => {
    expect(jeSkryte(".DS_Store")).toBe(true);
    expect(jeSkryte("Dopis.txt")).toBe(false);
  });

  it("balíček aplikace se pozná podle přípony", () => {
    expect(jeBalicek("Finder.app")).toBe(true);
    expect(jeBalicek("Dopis.txt")).toBe(false);
  });
});

describe("disk", () => {
  const disk = vytvorDiskMac();

  it("má jediný kořen, ne písmeno disku", () => {
    expect(disk.jmeno).toBe("");
    expect(disk.deti.map((d) => d.jmeno)).toContain("Users");
    expect(disk.deti.map((d) => d.jmeno)).toContain("Volumes");
  });

  it("aplikace je ve skutečnosti složka", () => {
    const app = najdi(disk, rozlozMac("/Applications/Finder.app"));
    expect(app?.druh).toBe("slozka");
  });

  it("připojený disk visí ve stromu, ne pod písmenem", () => {
    expect(najdi(disk, rozlozMac("/Volumes/FLASH/Zaloha.txt"))).not.toBeNull();
  });

  it("obsahuje skryté položky, na kterých se dá úloha ukázat", () => {
    expect(najdi(disk, rozlozMac("/Users/zak/.zshrc"))).not.toBeNull();
    expect(najdi(disk, rozlozMac("/Users/zak/Desktop/.DS_Store"))).not.toBeNull();
  });

  it("nastavení programu je čitelný soubor, ne registr", () => {
    const plist = najdi(disk, rozlozMac("/Users/zak/Library/Preferences/cz.spstabor.finder.plist"));
    expect(plist?.druh).toBe("soubor");
  });
});
