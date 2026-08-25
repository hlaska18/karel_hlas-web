import { describe, expect, it } from "vitest";
import {
  doSchranky,
  hledej,
  obnovZKose,
  smazDoKose,
  vloz_ze_schranky,
} from "@/lib/win/operace";
import { existuje, najdiSlozku, novaSlozka, rozloz, vloz } from "@/lib/win/fs";
import { vytvorDisk } from "@/lib/win/seed";
import { rozbal } from "@/lib/win/zip";
import { najdi, jeSlozka, velikost } from "@/lib/win/fs";

const PLOCHA = rozloz("C:\\Users\\Zak\\Desktop");
const DOKUMENTY = rozloz("C:\\Users\\Zak\\Documents");

describe("schránka", () => {
  it("kopie zůstane ve schránce, vyjmutí ji vyprázdní", () => {
    const disk = vytvorDisk();
    const kopirovat = doSchranky(disk, [[...PLOCHA, "Poznámky.txt"]], false)!;
    expect(vloz_ze_schranky(disk, kopirovat, DOKUMENTY).schranka).not.toBeNull();
    const vyjmout = doSchranky(disk, [[...PLOCHA, "Poznámky.txt"]], true)!;
    expect(vloz_ze_schranky(disk, vyjmout, DOKUMENTY).schranka).toBeNull();
  });

  it("kopírování nechá originál na místě, vyjmutí ho odstraní", () => {
    const disk = vytvorDisk();
    const kopie = vloz_ze_schranky(
      disk,
      doSchranky(disk, [[...PLOCHA, "Poznámky.txt"]], false)!,
      DOKUMENTY,
    ).disk;
    expect(existuje(kopie, [...PLOCHA, "Poznámky.txt"])).toBe(true);
    expect(existuje(kopie, [...DOKUMENTY, "Poznámky.txt"])).toBe(true);

    const presun = vloz_ze_schranky(
      disk,
      doSchranky(disk, [[...PLOCHA, "Poznámky.txt"]], true)!,
      DOKUMENTY,
    ).disk;
    expect(existuje(presun, [...PLOCHA, "Poznámky.txt"])).toBe(false);
  });

  it("vložení do téže složky vytvoří kopii s pořadovým číslem", () => {
    const disk = vytvorDisk();
    const schranka = doSchranky(disk, [[...PLOCHA, "Poznámky.txt"]], false)!;
    const vysledek = vloz_ze_schranky(disk, schranka, PLOCHA);
    expect(existuje(vysledek.disk, [...PLOCHA, "Poznámky (2).txt"])).toBe(true);
  });

  it("složku nejde zkopírovat samu do sebe", () => {
    const disk = vloz(vytvorDisk(), DOKUMENTY, novaSlozka("Projekt"));
    const schranka = doSchranky(disk, [[...DOKUMENTY, "Projekt"]], false)!;
    const vysledek = vloz_ze_schranky(disk, schranka, [...DOKUMENTY, "Projekt"]);
    expect(vysledek.chyba).toBeTruthy();
    expect(vysledek.disk).toBe(disk);
  });
});

describe("koš", () => {
  it("smazaná položka zmizí z disku a je v koši i s původem", () => {
    const disk = vytvorDisk();
    const vysledek = smazDoKose(disk, [[...PLOCHA, "Poznámky.txt"]]);
    expect(existuje(vysledek.disk, [...PLOCHA, "Poznámky.txt"])).toBe(false);
    expect(vysledek.polozky).toHaveLength(1);
    expect(vysledek.polozky[0].puvod).toEqual(PLOCHA);
  });

  it("systémovou položku smazat nelze", () => {
    const vysledek = smazDoKose(vytvorDisk(), [["C:", "Windows"]]);
    expect(vysledek.odepreno).toContain("Windows");
    expect(existuje(vysledek.disk, ["C:", "Windows"])).toBe(true);
  });

  it("obnovení vrátí položku na původní místo", () => {
    const disk = vytvorDisk();
    const smazano = smazDoKose(disk, [[...PLOCHA, "Poznámky.txt"]]);
    const obnoveno = obnovZKose(smazano.disk, smazano.polozky[0]);
    expect(existuje(obnoveno, [...PLOCHA, "Poznámky.txt"])).toBe(true);
  });

  it("obnovení doplní i mezitím smazanou původní složku", () => {
    const disk = vloz(vytvorDisk(), DOKUMENTY, novaSlozka("Projekt"));
    const sSouborem = vloz(disk, [...DOKUMENTY, "Projekt"], {
      druh: "soubor",
      jmeno: "a.txt",
      obsah: "a",
      zmeneno: 0,
    });
    const smazanySoubor = smazDoKose(sSouborem, [[...DOKUMENTY, "Projekt", "a.txt"]]);
    const bezSlozky = smazDoKose(smazanySoubor.disk, [[...DOKUMENTY, "Projekt"]]).disk;
    const obnoveno = obnovZKose(bezSlozky, smazanySoubor.polozky[0]);
    expect(existuje(obnoveno, [...DOKUMENTY, "Projekt", "a.txt"])).toBe(true);
  });
});

describe("hledání", () => {
  it("najde soubor i v podsložce a je necitlivé na velikost písmen", () => {
    const nalezy = hledej(vytvorDisk(), rozloz("C:\\Users\\Zak"), "vzorce");
    expect(nalezy.length).toBeGreaterThan(0);
    expect(nalezy[0].cesta.join("\\")).toContain("Matematika");
  });

  it("prázdný dotaz nic nevrací", () => {
    expect(hledej(vytvorDisk(), rozloz("C:\\Users\\Zak"), "   ")).toEqual([]);
  });
});

describe("archiv ZIP z výchozího disku", () => {
  it("Zápisky.zip jde otevřít a je menší než jeho obsah", () => {
    const soubor = najdi(vytvorDisk(), [...DOKUMENTY, "Zápisky.zip"]);
    expect(soubor && !jeSlozka(soubor)).toBe(true);
    if (!soubor || jeSlozka(soubor)) return;
    const uvnitr = rozbal(soubor);
    expect(uvnitr?.map((u) => u.jmeno)).toContain("Vzorce.txt");
    // Porovnává se v BAJTECH, ne ve znacích. `obsah.length` je počet znaků
    // v UTF-16 a čeština má diakritiku, takže bajtů je vždy víc – proti
    // znakům vycházel archiv falešně jako „stejně velký".
    expect(soubor.velikost).toBeLessThan(
      (uvnitr ?? []).reduce((s, u) => s + (jeSlozka(u) ? 0 : velikost(u)), 0),
    );
  });

  it("složka Dokumenty ve výchozím disku obsahuje očekávané položky", () => {
    const slozka = najdiSlozku(vytvorDisk(), DOKUMENTY);
    const jmena = slozka!.deti.map((d) => d.jmeno);
    expect(jmena).toEqual(
      expect.arrayContaining(["Škola", "Historie počítačů.txt", "Rozvrh.docx", "Zápisky.zip"]),
    );
  });
});
