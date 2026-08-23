import { describe, expect, it } from "vitest";
import {
  NAVNADA,
  PRIPONA_ZASIFROVANO,
  VYZVA,
  jeNavnada,
  pocetZasazenych,
  zasazeneCesty,
  zasifruj,
} from "@/lib/win/virus";
import { vychoziStav } from "@/lib/win/stav";
import { existuje, najdiSlozku, novySoubor, rozloz, vloz } from "@/lib/win/fs";

const DOMOV = "C:\\Users\\Zak";
const disk = () => vychoziStav().disk;

describe("rozpoznání návnady", () => {
  it("pozná dvojitou příponu", () => {
    expect(jeNavnada("Fotky_z_vyletu.jpg.exe")).toBe(true);
    expect(jeNavnada("faktura.pdf.exe")).toBe(true);
    expect(jeNavnada("tabulka.XLSX.EXE")).toBe(true);
  });

  it("běžný program za návnadu nepovažuje", () => {
    // Tohle je důležité: v System32 leží cmd.exe a notepad.exe a ty se
    // nesmějí chovat jako škodlivý soubor.
    expect(jeNavnada("cmd.exe")).toBe(false);
    expect(jeNavnada("instalace-programu.exe")).toBe(false);
    expect(jeNavnada("Fotka z výletu.jpg")).toBe(false);
  });

  it("návnada v seedu je jako návnada rozpoznaná", () => {
    expect(jeNavnada(NAVNADA)).toBe(true);
  });
});

describe("následek spuštění", () => {
  it("návnada leží ve Stažených souborech", () => {
    expect(existuje(disk(), rozloz(`${DOMOV}\\Downloads\\${NAVNADA}`))).toBe(true);
  });

  it("připraveným souborům změní příponu", () => {
    const po = zasifruj(disk());
    for (const cesta of zasazeneCesty()) {
      expect(existuje(po, rozloz(cesta))).toBe(false);
      expect(existuje(po, rozloz(`${cesta}.${PRIPONA_ZASIFROVANO}`))).toBe(true);
    }
  });

  it("položí na plochu výzvu k výkupnému", () => {
    const po = zasifruj(disk());
    expect(existuje(po, rozloz(`${DOMOV}\\Desktop\\${VYZVA}`))).toBe(true);
  });

  it("NESAHÁ na soubory, které si vytvořil žák", () => {
    // Karlovo rozhodnutí: lekce o záloze platí, ale nikdo nepřijde o vlastní
    // práci z hodiny. Tohle je ta nejdůležitější podmínka celého viru.
    const cesta = rozloz(`${DOMOV}\\Documents`);
    const sVlastnim = vloz(disk(), cesta, novySoubor("Moje práce.txt", "půl hodiny psaní"));
    const po = zasifruj(sVlastnim);

    expect(existuje(po, rozloz(`${DOMOV}\\Documents\\Moje práce.txt`))).toBe(true);
    expect(
      existuje(po, rozloz(`${DOMOV}\\Documents\\Moje práce.txt.${PRIPONA_ZASIFROVANO}`)),
    ).toBe(false);
  });

  it("nechá na pokoji skrytý pokyn i systémové soubory", () => {
    const po = zasifruj(disk());
    expect(existuje(po, rozloz(`${DOMOV}\\Documents\\.pokyn.txt`))).toBe(true);
    expect(existuje(po, rozloz("C:\\Windows\\System32\\cmd.exe"))).toBe(true);
  });

  it("dvojí spuštění nenapáchá víc škody", () => {
    const jednou = zasifruj(disk());
    const dvakrat = zasifruj(jednou);
    expect(pocetZasazenych(dvakrat)).toBe(pocetZasazenych(jednou));
    // a výzva na ploše zůstane jedna
    const plocha = najdiSlozku(dvakrat, rozloz(`${DOMOV}\\Desktop`));
    expect(plocha?.deti.filter((d) => d.jmeno === VYZVA)).toHaveLength(1);
  });

  it("počítadlo zasažených sedí", () => {
    expect(pocetZasazenych(disk())).toBe(0);
    expect(pocetZasazenych(zasifruj(disk()))).toBe(zasazeneCesty().length);
  });
});
