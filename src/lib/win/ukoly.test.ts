import { describe, expect, it } from "vitest";
import { SKUPINY, UKOLY, postup, vyhodnot } from "@/lib/win/ukoly";
import { vychoziStav, type Stav } from "@/lib/win/stav";
import { existuje, novaSlozka, novySoubor, odeber, rozloz, vloz } from "@/lib/win/fs";
import { zasifruj } from "@/lib/win/virus";

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

describe("delší úlohy", () => {
  const DOMOV = "C:\\Users\\Zak";
  const dokumenty = rozloz(`${DOMOV}\\Documents`);
  const splneno = (stav: Stav, id: string) => vyhodnot(stav).includes(id);

  /** Založí v Dokumentech složku daného názvu. */
  const zaloz = (stav: Stav, nazev: string): Stav => ({
    ...stav,
    disk: vloz(stav.disk, dokumenty, novaSlozka(nazev)),
  });

  it("skrytý pokyn na disku je", () => {
    expect(existuje(cerstvy().disk, rozloz(`${DOMOV}\\Documents\\.pokyn.txt`))).toBe(true);
  });

  it("odpověď na počet fotek uzná jen 436", () => {
    expect(splneno(cerstvy(), "kolik-fotek")).toBe(false);
    // 406 je výsledek s 1000 místo 1024 – tedy právě ta chyba, o kterou jde
    expect(splneno(zaloz(cerstvy(), "406"), "kolik-fotek")).toBe(false);
    expect(splneno(zaloz(cerstvy(), "436"), "kolik-fotek")).toBe(true);
  });

  it("dvojkový zápis roku uzná jen správný", () => {
    expect(splneno(zaloz(cerstvy(), "11111101011"), "dvojkova-2026")).toBe(false);
    expect(splneno(zaloz(cerstvy(), "11111101010"), "dvojkova-2026")).toBe(true);
  });

  it("poslední část IP adresy uzná jen 147", () => {
    expect(splneno(zaloz(cerstvy(), "1"), "ipv4-posledni")).toBe(false);
    expect(splneno(zaloz(cerstvy(), "147"), "ipv4-posledni")).toBe(true);
  });

  it("u komprese uzná text, ne fotku", () => {
    expect(splneno(zaloz(cerstvy(), "fotka"), "komprese-porovnani")).toBe(false);
    expect(splneno(zaloz(cerstvy(), "text"), "komprese-porovnani")).toBe(true);
  });

  it("kolize jmen: dokud jsou soubory ve dvou složkách, není hotovo", () => {
    expect(splneno(cerstvy(), "kolize-jmen")).toBe(false);
  });

  it("kolize jmen: dva různě pojmenované vedle sebe stačí", () => {
    let stav = cerstvy();
    const cil = rozloz(`${DOMOV}\\Documents\\Vzorce`);
    stav = { ...stav, disk: vloz(stav.disk, dokumenty, novaSlozka("Vzorce")) };
    stav = { ...stav, disk: vloz(stav.disk, cil, novySoubor("Vzorce-matematika.txt", "a")) };
    stav = { ...stav, disk: vloz(stav.disk, cil, novySoubor("Vzorce-fyzika.txt", "b")) };
    expect(splneno(stav, "kolize-jmen")).toBe(true);
  });

  it("web o dvou stránkách chce nadpis, tři položky i odkaz", () => {
    const sHtml = (obsah: string, sDruhou: boolean): Stav => {
      let stav = cerstvy();
      stav = { ...stav, disk: vloz(stav.disk, dokumenty, novySoubor("index.html", obsah)) };
      if (sDruhou) {
        stav = { ...stav, disk: vloz(stav.disk, dokumenty, novySoubor("druha.html", "<p>ahoj</p>")) };
      }
      return stav;
    };
    const uplny = '<h1>Můj web</h1><ul><li>a</li><li>b</li><li>c</li></ul><a href="druha.html">dál</a>';

    expect(splneno(sHtml(uplny, false), "web-dve-stranky")).toBe(false); // chybí druhá stránka
    expect(splneno(sHtml("<h1>Jen nadpis</h1>", true), "web-dve-stranky")).toBe(false);
    expect(
      splneno(sHtml('<h1>A</h1><ul><li>a</li><li>b</li></ul><a href="druha.html">d</a>', true), "web-dve-stranky"),
    ).toBe(false); // jen dvě položky
    expect(splneno(sHtml(uplny, true), "web-dve-stranky")).toBe(true);
  });

  it("úklid po viru dává smysl až po jeho spuštění", () => {
    const cisty = cerstvy();
    // nikdo návnadu neotevřel – není co uklízet, a úkol se tedy neodškrtává
    expect(splneno(cisty, "uklid-po-viru")).toBe(false);

    const poSpusteni: Stav = {
      ...cisty,
      disk: zasifruj(cisty.disk),
      virusBezi: true,
      stopy: ["navnada:otevrena"],
    };
    expect(splneno(poSpusteni, "uklid-po-viru")).toBe(false);

    // po úklidu: proces stojí, žádná .zasifrovano, výzva pryč
    const poUklidu: Stav = { ...cisty, virusBezi: false, stopy: ["navnada:otevrena"] };
    expect(splneno(poUklidu, "uklid-po-viru")).toBe(true);
  });
});
