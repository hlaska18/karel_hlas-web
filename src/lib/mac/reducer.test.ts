import { describe, expect, it } from "vitest";
import { reducerMac } from "@/lib/mac/reducer";
import { obnovSystemoveSlozky, vychoziStavMac } from "@/lib/mac/stav";
import { najdi, novaSlozka, vloz } from "@/lib/win/fs";
import { DOMOV, KOS, jeBalicek, jeSkryte, rozlozMac, slozMac, sVlnovkou } from "@/lib/mac/cesty";
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

  it("žlutý puntík okno schová, ale nezruší", () => {
    // Rozdíl proti červenému puntíku je celá druhá půlka lekce. Kdyby se
    // minimalizace „zjednodušila" na zavření, obě tlačítka by dělala totéž.
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky" });
    const id = stav.okna[0].id;

    stav = reducerMac(stav, { typ: "okno/minimalizuj", id });
    expect(stav.okna).toHaveLength(1);
    expect(stav.okna[0].minimalizovane).toBe(true);

    stav = reducerMac(stav, { typ: "okno/obnov", id });
    expect(stav.okna[0].minimalizovane).toBe(false);
    expect(stav.vpredu).toBe("poznamky");
  });

  it("obnovení z Docku vytáhne okno nad ostatní", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky" });
    const prvni = stav.okna[0].id;
    stav = reducerMac(stav, { typ: "okno/minimalizuj", id: prvni });
    stav = reducerMac(stav, { typ: "okno/otevri", app: "terminal" });

    stav = reducerMac(stav, { typ: "okno/obnov", id: prvni });
    const obnovene = stav.okna.find((o) => o.id === prvni)!;
    const ostatni = stav.okna.filter((o) => o.id !== prvni);
    expect(ostatni.every((o) => o.z < obnovene.z)).toBe(true);
  });

  it("zelený puntík přepíná zvětšení tam a zpět", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "terminal" });
    const id = stav.okna[0].id;
    stav = reducerMac(stav, { typ: "okno/zvetsi", id });
    expect(stav.okna[0].zvetsene).toBe(true);
    stav = reducerMac(stav, { typ: "okno/zvetsi", id });
    expect(stav.okna[0].zvetsene).toBe(false);
  });

  it("nabídka Otevřít (Go) přepne otevřené okno, neotevře nové", () => {
    // Na Macu „Otevřít → Domov" nepřidá okno, jen pošle to současné jinam.
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "finder" });
    const id = stav.okna[0].id;
    stav = reducerMac(stav, { typ: "okno/minimalizuj", id });

    stav = reducerMac(stav, { typ: "okno/arg", id, arg: "/Users/zak/Documents" });
    expect(stav.okna).toHaveLength(1);
    expect(stav.okna[0].arg).toBe("/Users/zak/Documents");
    // a zaroven se vrati z Docku dopredu, jinak by to nikam nevedlo
    expect(stav.okna[0].minimalizovane).toBe(false);
  });

  it("po ukončení aplikace patří lišta zase Finderu", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "terminal" });
    expect(stav.vpredu).toBe("terminal");
    stav = reducerMac(stav, { typ: "app/ukonci", app: "terminal" });
    expect(stav.vpredu).toBe("finder");
  });
});

describe("koš", () => {
  it("koš je skrytá složka v domovské složce", () => {
    // Není to zvláštní místo v systému, ale obyčejná složka s tečkou –
    // a právě proto se dá otevřít ve Finderu jako každá jiná.
    expect(slozMac(KOS)).toBe("/Users/zak/.Trash");
    expect(jeSkryte(".Trash")).toBe(true);
    expect(najdi(vytvorDiskMac(), KOS)).not.toBeNull();
  });

  it("na čerstvém disku je koš prázdný", () => {
    const kos = najdi(vytvorDiskMac(), KOS);
    expect(kos && "deti" in kos ? kos.deti : null).toEqual([]);
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
    const app = najdi(disk, rozlozMac("/Applications/TextEdit.app"));
    expect(app?.druh).toBe("slozka");
  });

  it("aplikace leží tam, kde na skutečném Macu", () => {
    // Finder v /Applications není (je v CoreServices), Terminál je v Utilities.
    expect(najdi(disk, rozlozMac("/Applications/Finder.app"))).toBeNull();
    expect(najdi(disk, rozlozMac("/System/Library/CoreServices/Finder.app"))).not.toBeNull();
    expect(najdi(disk, rozlozMac("/Applications/Utilities/Terminál.app"))).not.toBeNull();
  });

  it("starý uložený disk dostane nové systémové složky, žákovy soubory zůstanou", () => {
    const stary = {
      ...disk,
      deti: disk.deti.map((d) =>
        d.jmeno === "Applications" ? { ...novaSlozka("Applications"), deti: [novaSlozka("Poznámky.app")] } : d,
      ),
    };
    const s = vloz(stary, rozlozMac("/Users/zak/Documents"), novaSlozka("Moje"));
    const obnoveny = obnovSystemoveSlozky(s);
    expect(najdi(obnoveny, rozlozMac("/Applications/Poznámky.app"))).toBeNull();
    expect(najdi(obnoveny, rozlozMac("/Applications/TextEdit.app"))).not.toBeNull();
    expect(najdi(obnoveny, rozlozMac("/Users/zak/Documents/Moje"))).not.toBeNull();
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

describe("uvítání po přihlášení", () => {
  it("okno otevřené systémem nezapíše stopu o spuštění", () => {
    // Úloha „Lišta se mění" chce, aby žák Poznámky spustil SÁM. Kdyby
    // uvítací okno zapsalo `spustil:poznamky`, dostal by půlku úlohy zadarmo.
    const stav = reducerMac(vychoziStavMac(), {
      typ: "okno/otevri",
      app: "poznamky",
      arg: "/Users/zak/Desktop/Přečti si mě.txt",
      samo: true,
    });
    expect(stav.stopy).not.toContain("spustil:poznamky");
    // Okno ale opravdu je a aplikace běží vpředu.
    expect(stav.okna.some((o) => o.app === "poznamky")).toBe(true);
    expect(stav.bezici).toContain("poznamky");
    expect(stav.vpredu).toBe("poznamky");
  });

  it("okno otevřené žákem stopu zapíše", () => {
    const stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky" });
    expect(stav.stopy).toContain("spustil:poznamky");
  });

  it("na čerstvém prostředí uvítání ještě neproběhlo", () => {
    expect(vychoziStavMac().uvitano).toBe(false);
  });

  it("po ukázání si prostředí zapamatuje, že uvítání už bylo", () => {
    const stav = reducerMac(vychoziStavMac(), { typ: "uvitani/ukazano" });
    expect(stav.uvitano).toBe(true);
  });

  it("měkký reset si uvítání pamatuje – žák tu není poprvé", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "uvitani/ukazano" });
    stav = reducerMac(stav, { typ: "system/reset" });
    expect(stav.uvitano).toBe(true);
  });

  it("zavřením uvítacího okna Poznámky běží dál bez okna", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky", samo: true });
    stav = reducerMac(stav, { typ: "okno/zavri", id: stav.okna[0].id });
    expect(stav.bezici).toContain("poznamky");
    expect(stav.okna.some((o) => o.app === "poznamky")).toBe(false);
  });
});

describe("restart a vypnutí", () => {
  it("zavře okna a ukončí programy, soubory a postup nechá", () => {
    let s = vychoziStavMac();
    s = reducerMac(s, { typ: "okno/otevri", app: "terminal" });
    s = reducerMac(s, { typ: "okno/otevri", app: "poznamky" });
    s = { ...s, splneno: ["terminal-pwd"] };
    const disk = s.disk;
    const po = reducerMac(s, { typ: "system/vypni" });
    expect(po.okna).toEqual([]);
    expect(po.bezici).toEqual(["finder"]);
    expect(po.splneno).toEqual(["terminal-pwd"]);
    expect(po.disk).toBe(disk);
  });
});
