import { describe, expect, it } from "vitest";
import { komprimovanaVelikost, rozbal, zabal } from "@/lib/win/zip";
import { velikost, type Soubor, type Uzel } from "@/lib/win/fs";

/**
 * Velikost archivu se u souborů se skutečným obsahem MĚŘÍ, ne odhaduje.
 * Dřív se všechno bralo z tabulky poměrů a úloha „Co se zabalením zmenší víc"
 * byla pokus s předepsaným výsledkem. Tyhle testy hlídají, že se to nevrátí.
 */

const textovy = (jmeno: string, obsah: string): Soubor => ({
  druh: "soubor",
  jmeno,
  obsah,
  zmeneno: 0,
});

/** Soubor, který v simulaci existuje jen jako číslo – žádné bajty nemá. */
const placeholder = (jmeno: string, bajtu: number): Soubor => ({
  druh: "soubor",
  jmeno,
  obsah: "",
  velikost: bajtu,
  zmeneno: 0,
});

describe("velikost archivu", () => {
  it("text se komprimuje doopravdy, ne podle tabulky", () => {
    // Tisíc opakování téhož slova nemá skoro žádnou entropii. Odhad z tabulky
    // by u .txt řekl 40 % původní velikosti; skutečný deflate zvládne řádově
    // víc, a právě tenhle rozdíl je důkaz, že se opravdu měří.
    const opakovany = textovy("Opakovani.txt", "ahoj ".repeat(1000));
    const zabaleny = komprimovanaVelikost([opakovany]);
    expect(zabaleny).toBeLessThan(velikost(opakovany) * 0.1);
  });

  it("stejný vstup dá vždy stejné číslo", () => {
    // Kdyby velikost mezi dvěma výpočty poskočila, žák by v Průzkumníku viděl
    // jinou hodnotu při každém obnovení a nevěřil by ani jedné.
    const s = textovy("Zapisky.txt", "Poznámky z hodiny.\nDruhý řádek.\n".repeat(30));
    expect(komprimovanaVelikost([s])).toBe(komprimovanaVelikost([s]));
  });

  it("opakující se text se zmenší víc než nahodilý", () => {
    // Jádro lekce: nekomprimuje se „text", komprimuje se OPAKOVÁNÍ.
    const pravidelny = textovy("Pravidelny.txt", "abcabcabc".repeat(400));
    let nahodny = "";
    let x = 7;
    for (let i = 0; i < 3600; i++) {
      x = (x * 1103515245 + 12345) % 2147483648;
      nahodny += String.fromCharCode(33 + (x % 90));
    }
    const nahodilyS = textovy("Nahodny.txt", nahodny);
    expect(velikost(pravidelny)).toBe(velikost(nahodilyS));
    expect(komprimovanaVelikost([pravidelny])).toBeLessThan(komprimovanaVelikost([nahodilyS]));
  });

  it("fotka se nezmenší skoro vůbec, text ano", () => {
    // Tohle je přesně to, co má úloha ukázat, a co dřív říkala jen tabulka.
    const text = textovy("Text.txt", "Věta, která se pořád opakuje. ".repeat(200));
    const fotka = placeholder("Fotka.jpg", velikost(text));
    const pomerTextu = komprimovanaVelikost([text]) / velikost(text);
    const pomerFotky = komprimovanaVelikost([fotka]) / velikost(fotka);
    expect(pomerTextu).toBeLessThan(0.5);
    expect(pomerFotky).toBeGreaterThan(0.9);
  });

  it("soubor bez obsahu spadne zpátky na odhad a nespadne", () => {
    // Placeholder nemá co měřit; nesmí to skončit výjimkou uprostřed balení.
    const p = placeholder("Video.mp4", 5_000_000);
    const v = komprimovanaVelikost([p]);
    expect(v).toBeGreaterThan(4_000_000);
    expect(Number.isFinite(v)).toBe(true);
  });

  it("prázdný archiv pořád něco váží", () => {
    expect(komprimovanaVelikost([])).toBe(22);
  });

  it("do složky se počítá i to, co je uvnitř", () => {
    const uvnitr: Uzel = {
      druh: "slozka",
      jmeno: "Texty",
      zamceno: false,
      zmeneno: 0,
      deti: [textovy("A.txt", "aaaa".repeat(500)), textovy("B.txt", "bbbb".repeat(500))],
    };
    expect(komprimovanaVelikost([uvnitr])).toBeLessThan(velikost(uvnitr));
  });
});

describe("zabalení a rozbalení", () => {
  it("co se zabalí, to se rozbalí", () => {
    const puvodni = [textovy("Jedna.txt", "první"), textovy("Dva.txt", "druhý")];
    const rozbalene = rozbal(zabal(puvodni));
    expect(rozbalene?.map((u) => u.jmeno)).toEqual(["Jedna.txt", "Dva.txt"]);
  });

  it("obyčejný soubor archivem není", () => {
    expect(rozbal(textovy("Poznamka.txt", "jen text"))).toBeNull();
  });
});
