import { describe, expect, it } from "vitest";
import { SKUPINY_MAC, UKOLY_MAC, postupMac, vyhodnotMac } from "@/lib/mac/ukoly";
import { reducerMac } from "@/lib/mac/reducer";
import { PORADI_DOCKU, vychoziStavMac } from "@/lib/mac/stav";

describe("seznam úkolů", () => {
  it("má jedinečná id", () => {
    const ids = UKOLY_MAC.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("každý úkol patří do některé známé skupiny", () => {
    for (const u of UKOLY_MAC) {
      expect(SKUPINY_MAC).toContain(u.skupina as never);
    }
  });

  it("každá skupina má aspoň jeden úkol", () => {
    for (const s of SKUPINY_MAC) {
      expect(UKOLY_MAC.some((u) => u.skupina === s)).toBe(true);
    }
  });

  it("název i popis jsou vyplněné", () => {
    for (const u of UKOLY_MAC) {
      expect(u.nazev.trim().length).toBeGreaterThan(8);
      expect(u.popis.trim().length).toBeGreaterThan(30);
    }
  });

  it("každý úkol má postup aspoň o čtyřech krocích a žádný není odbytý", () => {
    // Test, který mě jednou chytil ve windowsové verzi na kroku „Napiš pár
    // vět." — čtrnáct znaků, které žákovi neřeknou vůbec nic.
    for (const u of UKOLY_MAC) {
      expect(u.kroky.length, u.id).toBeGreaterThanOrEqual(4);
      for (const krok of u.kroky) {
        expect(krok.trim().length, `${u.id}: ${krok}`).toBeGreaterThan(25);
      }
    }
  });

  it("kroky nemluví o klávesách, které žák na své klávesnici nemá", () => {
    // Karlova podmínka: žáci sedí u windowsových strojů. V prostředí jsou
    // namapované jen dvě zkratky a obě jdou přes Ctrl. Kdyby se do kroků
    // vloudilo ⌘ nebo ⌥, poslalo by to žáka mačkat něco, co tam není.
    for (const u of UKOLY_MAC) {
      for (const krok of u.kroky) {
        expect(krok, `${u.id}: ${krok}`).not.toMatch(/[⌘⌥]/);
      }
    }
  });

  it("žádný úkol neučí to, co už žák umí z Windows", () => {
    // Hrubá pojistka na Karlovo zadání „pouze věci navíc oproti Windows".
    // Nechytí všechno, ale chytí, kdyby se sem časem vloudil obyčejný úkol
    // na kopírování nebo hledání souboru.
    const zakazane = [/kopíruj/i, /vyhledej soubor/i, /zapni si přípony/i];
    for (const u of UKOLY_MAC) {
      for (const vzor of zakazane) {
        expect(u.nazev, u.id).not.toMatch(vzor);
      }
    }
  });
});

describe("vyhodnocení", () => {
  it("na čerstvém prostředí není splněno nic", () => {
    expect(vyhodnotMac(vychoziStavMac())).toEqual([]);
  });

  it("Enter ve Finderu odškrtne úkol o přejmenování", () => {
    const stav = reducerMac(vychoziStavMac(), { typ: "stopa", klic: "prejmenoval-enterem" });
    expect(vyhodnotMac(stav)).toContain("enter-prejmenuje");
    expect(vyhodnotMac(stav)).not.toContain("mezernik-nahled");
  });

  it("mezerník ve Finderu odškrtne úkol o Rychlém náhledu", () => {
    const stav = reducerMac(vychoziStavMac(), { typ: "stopa", klic: "nahled-mezernikem" });
    expect(vyhodnotMac(stav)).toContain("mezernik-nahled");
    expect(vyhodnotMac(stav)).not.toContain("enter-prejmenuje");
  });

  it("zavření okna Finderu odškrtne první úkol", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "finder" });
    stav = reducerMac(stav, { typ: "okno/zavri", id: stav.okna[0].id });
    expect(vyhodnotMac(stav)).toContain("zavri-okno-finderu");
  });

  it("úkol na běh bez okna se splní, až když okno zmizí", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky" });
    // Okno je otevřené – to ještě není ono.
    expect(vyhodnotMac(stav)).not.toContain("poznamky-bez-okna");

    stav = reducerMac(stav, { typ: "okno/zavri", id: stav.okna[0].id });
    expect(vyhodnotMac(stav)).toContain("poznamky-bez-okna");
  });

  it("ukončená aplikace úkol na běh bez okna nesplní", () => {
    // Kdyby se test díval jen na „nemá okno", odškrtl by se i tomu, kdo
    // Poznámky rovnou ukončil – a minul by celou pointu.
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "poznamky" });
    stav = reducerMac(stav, { typ: "app/ukonci", app: "poznamky" });
    expect(vyhodnotMac(stav)).not.toContain("poznamky-bez-okna");
  });

  it("vypnutí položek s tečkou úkol neodškrtne", () => {
    // Stopa se zapisuje jen při zapnutí. Kdo přepínač jen našel a hned
    // vrátil, úkol nesplnil.
    const stav = reducerMac(vychoziStavMac(), {
      typ: "nastaveni/zmen",
      zmena: { skrytePolozky: false },
    });
    expect(vyhodnotMac(stav)).not.toContain("zapni-tecky");
  });

  it("zapnutí položek s tečkou úkol odškrtne", () => {
    const stav = reducerMac(vychoziStavMac(), {
      typ: "nastaveni/zmen",
      zmena: { skrytePolozky: true },
    });
    expect(vyhodnotMac(stav)).toContain("zapni-tecky");
  });

  it("návrat okna z Docku odškrtne úkol o žlutém puntíku", () => {
    let stav = reducerMac(vychoziStavMac(), { typ: "okno/otevri", app: "finder" });
    const id = stav.okna[0].id;
    stav = reducerMac(stav, { typ: "okno/minimalizuj", id });
    expect(vyhodnotMac(stav)).not.toContain("zluty-puntik");

    stav = reducerMac(stav, { typ: "okno/obnov", id });
    expect(vyhodnotMac(stav)).toContain("zluty-puntik");
  });
});

describe("postup", () => {
  it("počítá jen známé úkoly", () => {
    const { hotovo, celkem } = postupMac(["zavri-okno-finderu", "vymysleny-ukol"]);
    expect(hotovo).toBe(1);
    expect(celkem).toBe(UKOLY_MAC.length);
  });
});

describe("texty úloh sedí na Dock", () => {
  // Kroky popisují Dock napevno („první ikona zleva“, „pod Terminálem tečka
  // není“). Když se změní pořadí nebo výchozí stav, musí to spadnout tady,
  // ne potichu lhát žákovi (rada 24. 9. 2026).
  const prvni = UKOLY_MAC.find((u) => u.id === "zavri-okno-finderu");

  it("Finder je v Docku první, jak říká úloha 1", () => {
    expect(PORADI_DOCKU[0]).toBe("finder");
    expect(prvni && prvni.kroky.join(" ")).toMatch(/první ikonu zleva/);
  });

  it("Terminál na začátku neběží – úloha 1 ho dává jako ikonu bez tečky", () => {
    expect(prvni && prvni.kroky.join(" ")).toMatch(/Terminál/);
    expect(vychoziStavMac().bezici).not.toContain("terminal");
    expect(vychoziStavMac().bezici).toContain("finder");
  });

  it("výchozí Dock nezvětšuje ikony – jinak by „první ikona zleva“ uhýbala", () => {
    expect(vychoziStavMac().nastaveni.dockZvetseni).toBe(false);
  });
});
