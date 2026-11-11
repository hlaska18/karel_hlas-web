import { describe, expect, it } from "vitest";
import { ALGORITMY, textKarty, vetyObrazem, type Algoritmus } from "./JakFunguje";
import {
  HRUBY_BATOH,
  HRUBY_HODIN,
  MAPA_2OPT,
  MAPA_HRUBA,
  MAPA_SOUSED,
  SIM_DNU,
  SIT_HRANY,
  SIT_UZLY,
  TRASA_2OPT,
  okruhyHrube,
  simulaceMala,
} from "./Obrazem";
import { KAPACITA, spoctiTabulku } from "@/lib/algolab/batoh";
import { CESTY, dijkstra } from "@/lib/algolab/grafy";
import { spoctiMrizku } from "@/lib/algolab/mrizka";
import { bubbleKroky, slij } from "@/lib/algolab/razeni";
import { delkaTrasy, dvaOpt, krizeni, nejblizsiSoused, nejkratsiTrasa, pocetTras } from "@/lib/algolab/trasy";
import { binarniKroky, linearniPocet } from "@/lib/algolab/vyhledavani";

/**
 * Čísla v kartách „Jak to funguje“ jsou napsaná ručně (rada 9. 11. 2026).
 * Tady se přepočítají stejným kódem, jaký běží v hodinách, ať karta po změně
 * dat nebo textu nelže.
 */
const text = (a: Algoritmus) => textKarty(a).replace(/\s+/g, " ");
const cz = (n: number) => n.toLocaleString("cs-CZ").replace(/\s+/g, " ");

describe("karty Jak to funguje: čísla sedí s daty a kódem hodin", () => {
  it("každá karta má text", () => {
    for (const a of ALGORITMY) expect(text(a).length).toBeGreaterThan(200);
  });

  it("lineární hledání: 9 v řadě 4, 7, 9, 2 najde ve třetím kroku", () => {
    expect(linearniPocet([4, 7, 9, 2], 9)).toBe(3);
    expect(text("linearni")).toContain("Stačily tři kroky");
  });

  it("binární hledání: příklad prochází 20, 31, 25", () => {
    const kroky = binarniKroky([3, 8, 12, 20, 25, 31, 40], 25);
    expect(kroky.map((k) => k.hodnota)).toEqual([20, 31, 25]);
    expect(text("binarni")).toContain("Uprostřed je 20");
    expect(text("binarni")).toContain("Uprostřed je 31");
    expect(text("binarni")).toContain("Stačily tři kroky");
  });

  it("Bubble Sort: každé pořadí v příkladu odpovídá krokům z hodiny", () => {
    const kroky = bubbleKroky([5, 1, 4, 2]);
    expect(kroky).toHaveLength(6);
    for (const k of kroky.filter((x) => x.prohodit)) expect(text("bubble")).toContain(`(${k.pole.join(", ")})`);
    expect(kroky[kroky.length - 1].pole).toEqual([1, 2, 4, 5]);
  });

  it("Merge Sort: slévání 2, 7 a 3, 5 dá 2, 3, 5, 7", () => {
    expect(slij([2, 7], [3, 5]).vysledek).toEqual([2, 3, 5, 7]);
    expect(text("merge")).toContain("2, 3, 5, 7");
  });

  it("mřížka: hala 2 × 2 trvá 7 sekund", () => {
    expect(spoctiMrizku([[1, 2], [3, 4]])[1][1]).toBe(7);
    expect(text("mrizka")).toContain("trvá 7 sekund");
  });

  it("batoh: stroj má tolik hodin jako v hodině 4, příklad dá 5", () => {
    expect(text("batoh")).toContain(`stroj s ${KAPACITA} hodinami`);
    const t = spoctiTabulku(
      [
        { id: "1", nazev: "1", doba: 2, prinos: 3 },
        { id: "2", nazev: "2", doba: 1, prinos: 2 },
      ],
      3,
    );
    expect(t[1]).toEqual([0, 0, 3, 3]);
    expect(t[2][3]).toBe(5);
    expect(text("batoh")).toContain("2 + 3 = 5");
  });

  it("hrubá síla: počty výběrů a okruhů", () => {
    expect(2 ** 3).toBe(8);
    expect(2 ** 30).toBeGreaterThan(1e9);
    expect(text("hrubabatoh")).toContain("U 30 zakázek by ale výběrů bylo přes miliardu");
    expect(pocetTras(3)).toBe(3);
    expect(text("hrubatrasy")).toContain("různých okruhů jsou jen 3");
    expect(text("hrubatrasy")).toContain(`Pro 8 zákazníků je okruhů ${cz(pocetTras(8))}`);
    expect(pocetTras(15)).toBeGreaterThan(650e9);
    expect(pocetTras(15)).toBeLessThan(660e9);
  });

  it("Dijkstra: přes A je to do B 5 minut", () => {
    const uzly = [0, 1, 2].map((i) => ({ nazev: String(i), x: 0, y: 0 }));
    const v = dijkstra(uzly, [
      { a: 0, b: 1, minut: 4 },
      { a: 0, b: 2, minut: 6 },
      { a: 1, b: 2, minut: 1 },
    ], 0);
    expect(v.casy).toEqual([0, 4, 5]);
    expect(v.predchozi[2]).toBe(1);
    expect(text("dijkstra")).toContain("4 + 1 = 5");
  });

  it("simulace: počet cest a možností podle sítě z hodiny 6", () => {
    const n = CESTY.length;
    expect(text("simulace")).toContain(`Při ${n} cestách`);
    expect(text("simulace")).toContain(`${n} · 0,1 = ${cz(n * 0.1)}`);
    expect(text("simulace")).toContain(`${n} cest může být otevřených a zavřených ${cz(2 ** n)} způsoby`);
  });
});

describe("karty Jak to funguje: neprozradí tip", () => {
  it("nejbližší soused neříká, jestli najde nejkratší trasu", () => {
    expect(text("soused")).not.toMatch(/nezaručuje|nejkratší/);
  });

  it("binární hledání neříká, kolik otevření přidá dvojnásobek krabic", () => {
    expect(text("binarni")).not.toMatch(/dvojnásob|navíc/);
  });

  it("Merge Sort neříká, kolik porovnání potřebuje", () => {
    expect(text("merge")).not.toMatch(/log|n · n|úrovn/);
  });
});

describe("krokovače obrazem (Karel 9. 11. 2026)", () => {
  it("každý algoritmus má aspoň tři snímky a v žádné větě není díra", () => {
    for (const a of ALGORITMY) {
      const vety = vetyObrazem(a);
      expect(vety.length).toBeGreaterThanOrEqual(3);
      for (const v of vety) {
        expect(v.trim().length).toBeGreaterThan(5);
        expect(v).not.toMatch(/undefined|NaN|Infinity|null/);
      }
    }
  });

  it("Dijkstra na malé síti: Montáž za 10 minut přes A, B, C", () => {
    const v = dijkstra(SIT_UZLY, SIT_HRANY, 0);
    expect(v.casy).toEqual([0, 4, 5, 8, 10]);
    const vety = vetyObrazem("dijkstra");
    expect(vety.join(" ")).toContain("do B za 4 + 1 = 5 místo 6");
    expect(vety[vety.length - 1]).toContain("Sklad → A → B → C → Montáž");
  });

  it("nejbližší soused: trasa v obrázku se nekříží a věty neříkají její délku", () => {
    const { trasa } = nejblizsiSoused(MAPA_SOUSED);
    expect(krizeni(MAPA_SOUSED, trasa)).toHaveLength(0);
    expect(vetyObrazem("soused").join(" ")).not.toMatch(/celkem|dohromady|nejkratší/);
  });

  it("2-opt: jedna výměna rozplete křížení a trasu zkrátí, věty neříkají o kolik", () => {
    const kroky = dvaOpt(MAPA_2OPT, TRASA_2OPT);
    expect(kroky).toHaveLength(1);
    expect(krizeni(MAPA_2OPT, TRASA_2OPT).length).toBeGreaterThan(0);
    expect(krizeni(MAPA_2OPT, kroky[0].po)).toHaveLength(0);
    expect(delkaTrasy(MAPA_2OPT, kroky[0].po)).toBeLessThan(delkaTrasy(MAPA_2OPT, TRASA_2OPT));
    expect(vetyObrazem("dvaopt").join(" ")).not.toMatch(/km|ušetří/);
  });

  it("Merge Sort: věty nepočítají porovnání", () => {
    expect(vetyObrazem("merge").join(" ")).not.toMatch(/\d+ porovnání|porovnáš \d/);
  });

  it("hrubá síla u trasy: 3 okruhy a nejkratší je stejný jako z hodiny 5", () => {
    const { poradi, okruhy } = okruhyHrube();
    expect(poradi).toHaveLength(6);
    expect(okruhy).toHaveLength(pocetTras(3));
    expect(Math.min(...okruhy.map((o) => o.delka))).toBeCloseTo(nejkratsiTrasa(MAPA_HRUBA).delka, 9);
  });

  it("hrubá síla u batohu najde totéž co tabulka", () => {
    const z = HRUBY_BATOH.map((x, i) => ({ ...x, id: String(i) }));
    const t = spoctiTabulku(z, HRUBY_HODIN);
    expect(vetyObrazem("hrubabatoh").join(" ")).toContain(`přínos ${t[z.length][HRUBY_HODIN]}.`);
  });

  it("simulace: dny ve větě dávají dohromady všechny dny", () => {
    expect(simulaceMala()).toHaveLength(SIM_DNU);
    const veta = vetyObrazem("simulace").slice(-1)[0];
    const cisla = [...veta.matchAll(/(\d+) (?:dní|dny|den)(?=[ ,.])/g)].map((m) => Number(m[1]));
    expect(cisla[0]).toBe(SIM_DNU);
    expect(cisla.slice(1).reduce((a, b) => a + b, 0)).toBe(SIM_DNU);
  });
});
