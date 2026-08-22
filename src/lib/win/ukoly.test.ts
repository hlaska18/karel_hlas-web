import { describe, expect, it } from "vitest";
import { SKUPINY, UKOLY, postup, vyhodnot } from "@/lib/win/ukoly";
import { vychoziStav, type Stav } from "@/lib/win/stav";
import { novaSlozka, odeber, rozloz, vloz } from "@/lib/win/fs";

const cerstvy = (): Stav => vychoziStav();

describe("seznam úkolů", () => {
  it("má jedinečná id", () => {
    const id = UKOLY.map((u) => u.id);
    expect(new Set(id).size).toBe(id.length);
  });

  it("každý úkol patří do některé známé skupiny", () => {
    for (const u of UKOLY) {
      expect(SKUPINY).toContain(u.skupina as (typeof SKUPINY)[number]);
    }
  });

  it("každá skupina má aspoň jeden úkol", () => {
    for (const s of SKUPINY) {
      expect(UKOLY.some((u) => u.skupina === s)).toBe(true);
    }
  });

  it("název i popis jsou vyplněné", () => {
    for (const u of UKOLY) {
      expect(u.nazev.length).toBeGreaterThan(3);
      expect(u.popis.length).toBeGreaterThan(10);
    }
  });
});

describe("vyhodnocení", () => {
  it("na čerstvém prostředí není splněno nic", () => {
    expect(vyhodnot(cerstvy())).toEqual([]);
  });

  it("založení složky Informatika úkol splní", () => {
    const stav = cerstvy();
    stav.disk = vloz(
      stav.disk,
      rozloz("C:\\Users\\Zak\\Documents\\Škola"),
      novaSlozka("Informatika"),
    );
    expect(vyhodnot(stav)).toContain("slozka-informatika");
  });

  it("přesun referátu se počítá až po zmizení originálu", () => {
    const stav = cerstvy();
    const cil = rozloz("C:\\Users\\Zak\\Documents\\Škola\\Informatika");
    stav.disk = vloz(stav.disk, rozloz("C:\\Users\\Zak\\Documents\\Škola"), novaSlozka("Informatika"));
    stav.disk = vloz(stav.disk, cil, {
      druh: "soubor",
      jmeno: "Historie počítačů.txt",
      obsah: "…",
      zmeneno: 0,
    });
    // Dokud leží soubor na obou místech, jde o kopii, ne o přesun.
    expect(vyhodnot(stav)).not.toContain("presun-referat");
    stav.disk = odeber(stav.disk, rozloz("C:\\Users\\Zak\\Documents\\Historie počítačů.txt"));
    expect(vyhodnot(stav)).toContain("presun-referat");
  });

  it("kopie složky vyžaduje, aby originál zůstal", () => {
    const stav = cerstvy();
    stav.disk = vloz(stav.disk, rozloz("C:\\Users\\Zak\\Desktop"), novaSlozka("Škola"));
    expect(vyhodnot(stav)).toContain("kopie-slozky");
    stav.disk = odeber(stav.disk, rozloz("C:\\Users\\Zak\\Documents\\Škola"));
    expect(vyhodnot(stav)).not.toContain("kopie-slozky");
  });

  it("nastavení se pozná podle stavu, ne podle cesty k němu", () => {
    const stav = cerstvy();
    stav.nastaveni = { ...stav.nastaveni, motiv: "tmavy", pripony: true, zarovnaniPanelu: "vlevo" };
    const hotove = vyhodnot(stav);
    expect(hotove).toEqual(expect.arrayContaining(["tmavy", "pripony", "panel"]));
  });

  it("stopa z terminálu splní úkol na příkaz", () => {
    const stav = cerstvy();
    stav.stopy = ["prikaz:dir", "prikaz:ipconfig"];
    const hotove = vyhodnot(stav);
    expect(hotove).toContain("cmd-dir");
    expect(hotove).toContain("cmd-ipconfig");
    expect(hotove).not.toContain("cmd-md");
  });

  it("obrázky, které byly v prostředí od začátku, úkol nesplní", () => {
    // Ve složce Obrázky leží PNG už po prvním spuštění – samotná jejich
    // přítomnost tedy nic nedokazuje, rozhoduje uložení z Malování.
    expect(vyhodnot(cerstvy())).not.toContain("malovani");
    const stav = cerstvy();
    stav.stopy = ["malovani:ulozeno"];
    expect(vyhodnot(stav)).toContain("malovani");
  });
});

describe("postup", () => {
  it("počítá jen známé úkoly", () => {
    expect(postup([])).toEqual({ hotovo: 0, celkem: UKOLY.length });
    expect(postup(["pripony", "neznamy-ukol"]).hotovo).toBe(1);
  });
});
