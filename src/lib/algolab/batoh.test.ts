import { describe, expect, it } from "vitest";
import {
  KAPACITA,
  ZAKAZKY,
  komentarKroku,
  krokyTabulky,
  odKolikaSeVyplati,
  optimalniPlan,
  planZ,
  pocetBunek,
  pocetKombinaci,
  pravidloNejvynosnejsi,
  pravidloZaHodinu,
  spoctiTabulku,
  vsechnaOptima,
  zpetnaCesta,
} from "./batoh";
import { vychoziStav, zOdlozeneho } from "./stav";
import { vygenerujVyzvu } from "./vyzva";

describe("zadání lekce", () => {
  it("nejvýnosnější první dá 49, přínos za hodinu 50 a optimum 51", () => {
    expect(pravidloNejvynosnejsi(ZAKAZKY, KAPACITA).prinos).toBe(49);
    expect(pravidloZaHodinu(ZAKAZKY, KAPACITA).prinos).toBe(50);
    expect(optimalniPlan(ZAKAZKY, KAPACITA).prinos).toBe(51);
  });

  it("optimum Hřídele + Příruby je jediné a sedí s hrubou silou", () => {
    const optima = vsechnaOptima(ZAKAZKY, KAPACITA);
    expect(optima).toHaveLength(1);
    expect(optima[0].ids.sort()).toEqual(["B", "C"]);
    expect(optima[0].doba).toBe(10);
    expect(optimalniPlan(ZAKAZKY, KAPACITA).ids.sort()).toEqual(["B", "C"]);
  });

  it("Tabulka se shoduje s hrubou silou pro každou kapacitu", () => {
    const T = spoctiTabulku(ZAKAZKY, 20);
    for (let h = 0; h <= 20; h++) {
      expect(T[ZAKAZKY.length][h]).toBe(vsechnaOptima(ZAKAZKY, h)[0].prinos);
    }
  });

  it("zakázka, která se nevejde, opisuje i nenulovou hodnotu", () => {
    const k = krokyTabulky(ZAKAZKY, KAPACITA).find((x) => x.zakazka.id === "A" && x.sloupec === 6)!;
    expect(k.vejdeSe).toBe(false);
    expect(k.hodnota).toBe(k.bez);
    expect(k.hodnota).toBeGreaterThan(0);
    expect(komentarKroku(k)).toContain("Nevejdou se");
  });

  it("komentář buňky ukáže výpočet a větší hodnotu", () => {
    const k = krokyTabulky(ZAKAZKY, KAPACITA).find((x) => x.zakazka.id === "C" && x.sloupec === 10)!;
    expect(k.hodnota).toBe(51);
    expect(komentarKroku(k)).toBe("Bez nich: 50. S nimi: 25 + 26 (nejlepší přínos při zbývajícím čase 5 h) = 51. Větší je 51.");
  });

  it("buněk je n × (K + 1) a u pěti zakázek je jich víc než kombinací", () => {
    expect(krokyTabulky(ZAKAZKY, KAPACITA)).toHaveLength(pocetBunek(5, KAPACITA));
    expect(pocetBunek(5, KAPACITA)).toBe(55);
    expect(pocetKombinaci(5)).toBe(32);
    expect(odKolikaSeVyplati(KAPACITA)).toBe(7);
  });

  it("cesta odzadu najde přesně plán z tabulky", () => {
    const vzate = zpetnaCesta(ZAKAZKY, KAPACITA).filter((k) => k.vzata).map((k) => k.zakazka.id);
    expect(vzate.sort()).toEqual(["B", "C"]);
    expect(planZ(ZAKAZKY, vzate).prinos).toBe(51);
  });
});

describe("generátor výzvy", () => {
  it("stejný seed dá stejné zadání", () => {
    expect(vygenerujVyzvu(1234)).toEqual(vygenerujVyzvu(1234));
    expect(vygenerujVyzvu(1234).zakazky).not.toEqual(vygenerujVyzvu(1235).zakazky);
  });

  it("každý z 5000 seedů splní podmínky úlohy", () => {
    for (let seed = 0; seed < 5000; seed++) {
      const v = vygenerujVyzvu(seed);
      const optima = vsechnaOptima(v.zakazky, v.kapacita);
      expect(optima).toHaveLength(1);
      expect(optima[0].prinos).toBe(v.tabulka[v.zakazky.length][v.kapacita]);
      expect(pravidloNejvynosnejsi(v.zakazky, v.kapacita).prinos).toBeLessThan(optima[0].prinos);
      expect(pravidloZaHodinu(v.zakazky, v.kapacita).prinos).toBeLessThan(optima[0].prinos);
      expect(v.kapacitaNavic.rozdil).toBeGreaterThan(0);

      const [vyplati, nevyplati, nevejde] = v.bunky;
      expect(vyplati.s!).toBeGreaterThan(vyplati.bez);
      expect(nevyplati.s!).toBeLessThan(nevyplati.bez);
      expect(nevejde.vejdeSe).toBe(false);
      expect(nevejde.bez).toBeGreaterThan(0);
      for (const b of v.bunky) {
        for (const [r, s] of b.zdroje) {
          expect(v.bunky.some((jina) => jina.radek === r && jina.sloupec === s)).toBe(false);
        }
      }

      expect(v.vyznam.moznosti.filter((m) => m.spravne)).toHaveLength(1);
      expect(v.vyznam.radek).toBeLessThan(v.zakazky.length);
      expect(new Set(v.zakazky.map((z) => z.nazev)).size).toBe(5);
    }
  }, 60000);

  it("záložní seed 1 zadání opravdu najde", () => {
    expect(vygenerujVyzvu(1).seed).toBe(1);
  });
});

describe("uložený stav", () => {
  it("rozbitý zápis vrátí výchozí stav", () => {
    expect(zOdlozeneho(null)).toEqual(vychoziStav());
    expect(zOdlozeneho("{nesmysl")).toEqual(vychoziStav());
    expect(zOdlozeneho("null")).toEqual(vychoziStav());
    expect(zOdlozeneho('{"faze":"hack","krok":9999,"plan":["A","B","C"],"uprava":{"kapacita":-1}}')).toEqual(vychoziStav());
  });

  it("plný stav přežije uložení a načtení", () => {
    const stav = { ...vychoziStav(), faze: "vyzva" as const, plan: ["E"], planPotvrzen: true, krok: 12, seedVyzvy: 77, reflexe: "text", hotovo: ["pokus" as const] };
    expect(zOdlozeneho(JSON.stringify(stav))).toEqual(stav);
  });
});
