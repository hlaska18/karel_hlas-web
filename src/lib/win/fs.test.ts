import { describe, expect, it } from "vitest";
import {
  existuje,
  jeSlozka,
  jeUvnitr,
  kopie,
  najdi,
  najdiSlozku,
  novaSlozka,
  novySoubor,
  odeber,
  pocetPolozek,
  prejmenuj,
  pripona,
  rozloz,
  sloz,
  velikost,
  vloz,
  volneJmeno,
  vyres,
  zaklad,
  jmenoJeVporadku,
  type Slozka,
} from "@/lib/win/fs";
import { vytvorDisk } from "@/lib/win/seed";

const disk = (): Slozka => vytvorDisk();
const DOMOV = ["C:", "Users", "Zak"];

describe("cesty", () => {
  it("rozloží zpětná i dopředná lomítka", () => {
    expect(rozloz("C:\\Users\\Zak")).toEqual(["C:", "Users", "Zak"]);
    expect(rozloz("C:/Users/Zak/")).toEqual(["C:", "Users", "Zak"]);
  });

  it("složí kořen s lomítkem, hlubší cestu bez něj", () => {
    expect(sloz(["C:"])).toBe("C:\\");
    expect(sloz(["C:", "Users"])).toBe("C:\\Users");
  });

  it("vyřeší relativní cestu proti aktuální složce", () => {
    expect(vyres(DOMOV, "Documents")).toEqual([...DOMOV, "Documents"]);
    expect(vyres(DOMOV, "..")).toEqual(["C:", "Users"]);
    expect(vyres(DOMOV, "C:\\Windows")).toEqual(["C:", "Windows"]);
  });

  it("nepustí nad kořen disku", () => {
    expect(vyres(["C:"], "..")).toBeNull();
  });
});

describe("jména", () => {
  it("odděluje příponu od základu", () => {
    expect(pripona("Referát.TXT")).toBe("txt");
    expect(zaklad("Referát.txt")).toBe("Referát");
    expect(pripona("Nová složka")).toBe("");
  });

  it("odmítne znaky, které Windows nedovolí", () => {
    expect(jmenoJeVporadku("normální.txt")).toBeNull();
    expect(jmenoJeVporadku("a/b.txt")).not.toBeNull();
    expect(jmenoJeVporadku("konec.")).not.toBeNull();
    expect(jmenoJeVporadku("   ")).not.toBeNull();
  });

  it("hledá volné jméno ve stylu Windows", () => {
    const slozka: Slozka = {
      druh: "slozka",
      jmeno: "X",
      zmeneno: 0,
      deti: [novaSlozka("Nová složka"), novaSlozka("Nová složka (2)")],
    };
    expect(volneJmeno(slozka, "Nová složka")).toBe("Nová složka (3)");
    expect(volneJmeno(slozka, "Text.txt")).toBe("Text.txt");
  });
});

describe("čtení a zápis", () => {
  it("najde uzel na cestě bez ohledu na velikost písmen", () => {
    const d = disk();
    expect(najdi(d, ["C:", "users", "zak"])).not.toBeNull();
    expect(najdi(d, ["C:", "Neexistuje"])).toBeNull();
  });

  it("vloží a odebere položku, aniž by změnil původní strom", () => {
    const puvodni = disk();
    const s = vloz(puvodni, DOMOV, novaSlozka("Pokus"));
    expect(existuje(s, [...DOMOV, "Pokus"])).toBe(true);
    expect(existuje(puvodni, [...DOMOV, "Pokus"])).toBe(false);
    expect(existuje(odeber(s, [...DOMOV, "Pokus"]), [...DOMOV, "Pokus"])).toBe(false);
  });

  it("přejmenuje jen tehdy, když nové jméno nekoliduje", () => {
    const d = vloz(vloz(disk(), DOMOV, novaSlozka("A")), DOMOV, novaSlozka("B"));
    expect(prejmenuj(d, [...DOMOV, "A"], "C")).not.toBeNull();
    expect(prejmenuj(d, [...DOMOV, "A"], "B")).toBeNull();
  });

  it("nepřejmenuje zamčenou systémovou položku", () => {
    expect(prejmenuj(disk(), ["C:", "Windows"], "Okna")).toBeNull();
  });

  it("spočítá velikost textu v bajtech i s diakritikou", () => {
    // „ě" je v UTF-8 dvoubajtové – proto pět znaků, šest bajtů.
    expect(velikost(novySoubor("a.txt", "těst"))).toBe(5);
    expect(velikost(novySoubor("prazdny.txt", ""))).toBe(0);
  });

  it("sečte velikost celého podstromu složky", () => {
    const slozka: Slozka = {
      druh: "slozka",
      jmeno: "X",
      zmeneno: 0,
      deti: [novySoubor("a.txt", "abc"), novySoubor("b.txt", "de")],
    };
    expect(velikost(slozka)).toBe(5);
  });

  it("spočítá položky rekurzivně", () => {
    const vnitrek: Slozka = {
      druh: "slozka",
      jmeno: "Vnitřek",
      zmeneno: 0,
      deti: [novySoubor("a.txt", "a")],
    };
    const slozka: Slozka = {
      druh: "slozka",
      jmeno: "X",
      zmeneno: 0,
      deti: [vnitrek, novySoubor("b.txt", "b")],
    };
    expect(pocetPolozek(slozka)).toEqual({ souboru: 2, slozek: 1 });
  });
});

describe("kopie a vnoření", () => {
  it("kopie je nezávislá na originálu", () => {
    const original = novaSlozka("A");
    original.deti.push(novySoubor("x.txt", "1"));
    const k = kopie(original);
    if (!jeSlozka(k)) throw new Error("kopie složky má být složka");
    k.deti.push(novySoubor("y.txt", "2"));
    expect(original.deti).toHaveLength(1);
  });

  it("pozná, že cíl leží uvnitř zdroje", () => {
    expect(jeUvnitr(["C:", "A"], ["C:", "A", "B"])).toBe(true);
    expect(jeUvnitr(["C:", "A"], ["C:", "B"])).toBe(false);
  });
});

describe("výchozí disk", () => {
  it("obsahuje domovské složky žáka", () => {
    const d = disk();
    for (const jmeno of ["Desktop", "Documents", "Downloads", "Pictures", "Music", "Videos"]) {
      expect(najdiSlozku(d, [...DOMOV, jmeno])).not.toBeNull();
    }
  });

  it("má systémové složky zamčené proti smazání", () => {
    expect(najdi(disk(), ["C:", "Windows"])?.zamceno).toBe(true);
  });
});
