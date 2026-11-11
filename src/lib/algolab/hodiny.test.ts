import { describe, expect, it } from "vitest";
import { binarniKroky, binarniNejvic, cilNeserazene, linearniPocet, NESERAZENA, POKUS_INDEX, SKLAD, vyzvaHledani } from "./vyhledavani";
import { bubbleKroky, bubblePorovnani, KARTY, mergeNejvic, mergeSort, slij, urovneDeleni, urovniDeleni, vyzvaRazeni } from "./razeni";
import { cenaCesty, HALA, hladovaCesta, krokyMrizky, nejlepsiCesta, spoctiMrizku, vsechnyCesty, vyzvaMrizky } from "./mrizka";
import { delkaTrasy, dvaOpt, krizeni, MISTA, nejblizsiSoused, nejkratsiTrasa, pocetTras, vyzvaTras } from "./trasy";
import { CESTY, CIL, dijkstra, cestaDo, HALY, kritickaCesta, nazevCesty, nejlepsiZalohy, porovnejZalohy, simuluj, START } from "./grafy";
import { batohHrubaSila, batohTabulka, bubblePocitej, cislo, cisloZOdhadu, mergePocitej, mer, nahodneZakazky, odhadSedi, ULOHY } from "./laborator";
import { podleVzoru, zDatLekce, FAZE_LEKCE } from "./lekce";
import { generator } from "./nahoda";

describe("hodina 1: vyhledávání", () => {
  it("sklad je seřazený a pokus potřebuje 5 binárních kroků a 23 lineárních", () => {
    expect(SKLAD.slice().sort((a, b) => a - b)).toEqual(SKLAD);
    const cil = SKLAD[POKUS_INDEX];
    expect(binarniKroky(SKLAD, cil)).toHaveLength(5);
    expect(linearniPocet(SKLAD, cil)).toBe(23);
  });

  it("vzorec pro nejvíc kroků sedí s hrubou silou", () => {
    for (let n = 1; n <= 300; n++) {
      const pole = Array.from({ length: n }, (_, i) => i * 2);
      const nej = Math.max(...pole.map((c) => binarniKroky(pole, c).length));
      expect(binarniNejvic(n)).toBe(nej);
    }
    expect(binarniNejvic(1e9)).toBe(30);
  });

  it("v neseřazeném skladu binární hledání aspoň jeden díl mine", () => {
    const cil = cilNeserazene();
    expect(NESERAZENA).toContain(cil);
    const kroky = binarniKroky(NESERAZENA, cil);
    expect(kroky[kroky.length - 1].vysledek).not.toBe("nalezeno");
  });

  it("výzva má cíl mimo střed a sedí počet kroků", () => {
    for (let s = 0; s < 500; s++) {
      const v = vyzvaHledani(s);
      expect(v.pole).toHaveLength(15);
      expect(v.pole.indexOf(v.cil)).not.toBe(7);
      expect(v.kroky.length).toBeGreaterThan(1);
      expect(v.kroky[v.kroky.length - 1].hodnota).toBe(v.cil);
    }
  });
});

describe("hodina 2: řazení", () => {
  it("Bubble Sort seřadí a udělá n(n−1)/2 porovnání", () => {
    const kroky = bubbleKroky(KARTY);
    expect(kroky).toHaveLength(bubblePorovnani(KARTY.length));
    expect(kroky[kroky.length - 1].pole).toEqual(KARTY.slice().sort((a, b) => a - b));
  });

  it("Merge Sort seřadí a vzorec pro nejvíc porovnání sedí s rekurencí", () => {
    expect(mergeSort(KARTY).serazene).toEqual(KARTY.slice().sort((a, b) => a - b));
    // W(n) = W(⌊n/2⌋) + W(⌈n/2⌉) + n − 1
    const W: number[] = [0, 0];
    for (let n = 2; n <= 2000; n++) W[n] = W[Math.floor(n / 2)] + W[Math.ceil(n / 2)] + n - 1;
    for (let n = 1; n <= 2000; n++) expect(mergeNejvic(n)).toBe(W[n]);
  });

  it("vzorec pro nejvíc porovnání Merge Sortu je u malých n opravdu dosažen", () => {
    const permutace = (p: number[]): number[][] =>
      p.length <= 1 ? [p] : p.flatMap((x, i) => permutace([...p.slice(0, i), ...p.slice(i + 1)]).map((r) => [x, ...r]));
    for (let n = 1; n <= 7; n++) {
      const vsechny = permutace(Array.from({ length: n }, (_, i) => i));
      const nej = Math.max(...vsechny.map((p) => mergeSort(p).slevani.reduce((s, x) => s + x.porovnani, 0)));
      expect(nej).toBe(mergeNejvic(n));
    }
  });

  it("úrovně dělení odpovídají ⌈log2 n⌉", () => {
    for (let n = 1; n <= 70; n++) expect(urovneDeleni(Array.from({ length: n }, (_, i) => i)).length - 1).toBe(urovniDeleni(n));
  });

  it("slévání je stabilní a výzva má aspoň 3 přechody a 6 porovnání", () => {
    expect(slij([1, 3], [3, 4]).kroky.map((k) => k.odkud)).toEqual(["L", "L", "P", "P"]);
    for (let s = 0; s < 500; s++) {
      const v = vyzvaRazeni(s);
      const prechody = v.slevani.kroky.filter((k, i) => i > 0 && k.odkud !== v.slevani.kroky[i - 1].odkud).length;
      expect(prechody).toBeGreaterThanOrEqual(3);
      expect(v.slevani.porovnani).toBeGreaterThanOrEqual(6);
      expect(new Set(v.bubbleVstup).size).toBe(6);
      expect(Math.max(...v.bubbleVstup)).toBe(v.poPrvnimPruchodu[5]);
    }
  });
});

describe("hodina 3: mřížka", () => {
  it("hala: nejlepší 28 s, hladová 45 s, nejlepší cesta je jediná", () => {
    const t = spoctiMrizku(HALA);
    expect(t[4][4]).toBe(28);
    expect(cenaCesty(HALA, nejlepsiCesta(HALA))).toBe(28);
    expect(cenaCesty(HALA, hladovaCesta(HALA))).toBe(45);
    const ceny = vsechnyCesty(HALA).map((c) => cenaCesty(HALA, c));
    expect(ceny.filter((c) => c === 28)).toHaveLength(1);
    expect(Math.min(...ceny)).toBe(28);
  });

  it("v hale není shoda ani v tabulce, ani v hladovém rozhodování", () => {
    for (const k of krokyMrizky(HALA)) if (k.nad !== null && k.vlevo !== null) expect(k.nad).not.toBe(k.vlevo);
    const cesta = hladovaCesta(HALA);
    for (const [r, s] of cesta) if (r < 4 && s < 4) expect(HALA[r][s + 1]).not.toBe(HALA[r + 1][s]);
  });

  it("výzva: jediné optimum, hladová horší aspoň o 3, buňky nezávislé", () => {
    for (let s = 0; s < 300; s++) {
      const v = vyzvaMrizky(s);
      const ceny = vsechnyCesty(v.hala).map((c) => cenaCesty(v.hala, c));
      expect(ceny.filter((c) => c === v.nejlepsi)).toHaveLength(1);
      expect(v.hladova - v.nejlepsi).toBeGreaterThanOrEqual(3);
      expect(new Set(v.bunky.map((b) => `${b.r}:${b.s}`)).size).toBe(3);
      for (const b of v.bunky) {
        expect(v.bunky.some((x) => (x.r === b.r - 1 && x.s === b.s) || (x.r === b.r && x.s === b.s - 1))).toBe(false);
      }
      expect(v.vyznam.moznosti.filter((m) => m.spravne)).toHaveLength(1);
    }
  });

  it("výzva: buňka pro otázku na význam není žádná ze skrytých (otázka její číslo vypisuje)", () => {
    for (let s = 0; s < 2000; s++) {
      const v = vyzvaMrizky(s);
      expect(v.bunky.some((b) => b.r === v.vyznam.r && b.s === v.vyznam.s)).toBe(false);
    }
  });
});

describe("hodina 5: trasy", () => {
  it("nejbližší soused 313,6 km, optimum 253,6 km, 2-opt ho najde ve dvou krocích", () => {
    const soused = nejblizsiSoused(MISTA).trasa;
    expect(delkaTrasy(MISTA, soused)).toBeCloseTo(313.6, 1);
    const opt = nejkratsiTrasa(MISTA);
    expect(opt.delka).toBeCloseTo(253.6, 1);
    expect(opt.zkouseno).toBe(pocetTras(7));
    const kroky = dvaOpt(MISTA, soused);
    expect(kroky).toHaveLength(2);
    expect(delkaTrasy(MISTA, kroky[1].po)).toBeCloseTo(opt.delka, 6);
    expect(krizeni(MISTA, soused).length).toBeGreaterThan(0);
  });

  it("počet tras k!/2", () => {
    expect(pocetTras(3)).toBe(3);
    expect(pocetTras(7)).toBe(2520);
    for (let k = 3; k <= 7; k++) expect(nejkratsiTrasa(MISTA.slice(0, k + 1)).zkouseno).toBe(pocetTras(k));
  });

  it("výzva: místa daleko od sebe, bez těsných shod, s křížením", () => {
    for (let s = 0; s < 200; s++) {
      const v = vyzvaTras(s);
      expect(v.mista).toHaveLength(6);
      expect(v.krizeni.length).toBeGreaterThan(0);
      expect(new Set(v.mista.map((m) => m.nazev)).size).toBe(6);
      for (const k of nejblizsiSoused(v.mista).kroky) {
        if (k.kandidati.length > 1) expect(k.kandidati[1].d - k.kandidati[0].d).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("hodina 6: grafy", () => {
  it("Dijkstra uzavírá haly v daném pořadí a nejrychlejší cesta je 16 min", () => {
    const d = dijkstra(HALY, CESTY, START);
    expect(d.kroky.map((k) => k.uzavrena)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(d.kroky.map((k) => k.cas)).toEqual([0, 4, 6, 7, 12, 13, 16]);
    expect(cestaDo(d.predchozi, CIL).map((i) => HALY[i].nazev)).toEqual(["Sklad", "Lisovna", "Svařovna", "Kontrola", "Montáž"]);
    const casy = d.kroky.map((k) => k.cas);
    expect(new Set(casy).size).toBe(casy.length);
  });

  it("kritická cesta je jediná: Sklad – Lisovna", () => {
    const k = kritickaCesta(HALY, CESTY);
    expect(nazevCesty(HALY, CESTY[k.hrana])).toBe("Sklad – Lisovna");
    expect(k.cas).toBe(18);
  });

  it("interpretace (10 %, sada 2026): texty v lekci sedí s výpočtem", () => {
    // Hodina6.tsx o tom píše natvrdo: nejlepší záloha je Kontrola – Montáž, cest bez opakování haly je 28.
    const sim = simuluj(HALY, CESTY, 10, 2026);
    expect(sim.nedojelo).toBeGreaterThan(0);
    const zalohy = nejlepsiZalohy(porovnejZalohy(HALY, CESTY, 10, 2026));
    expect(zalohy.map((i) => nazevCesty(HALY, CESTY[i]))).toEqual(["Kontrola – Montáž"]);
    const sousede = (u: number) => CESTY.flatMap((h) => (h.a === u ? [h.b] : h.b === u ? [h.a] : []));
    const pocet = (u: number, byl: Set<number>): number =>
      u === CIL ? 1 : sousede(u).filter((v) => !byl.has(v)).reduce((s, v) => s + pocet(v, new Set([...byl, v])), 0);
    expect(pocet(START, new Set([START]))).toBe(28);
  });

  it("simulace je opakovatelná a záloha neposune náhodu ostatním", () => {
    const a = simuluj(HALY, CESTY, 10, 2026);
    expect(simuluj(HALY, CESTY, 10, 2026)).toEqual(a);
    expect(a.dny).toHaveLength(200);
    const b = simuluj(HALY, CESTY, 10, 2026, 0);
    // Se zálohou nemůže žádný den dopadnout hůř.
    b.dny.forEach((c, i) => {
      const bez = a.dny[i];
      if (bez !== null) expect(c).not.toBeNull();
      if (bez !== null && c !== null) expect(c).toBeLessThanOrEqual(bez);
    });
  });
});

describe("hodina 7: laboratoř", () => {
  it("tabulka DP dá totéž co hrubá síla", () => {
    for (let s = 0; s < 60; s++) {
      const { zakazky, kapacita } = nahodneZakazky(2 + (s % 10), generator(s));
      expect(batohTabulka(zakazky, kapacita).prinos).toBe(batohHrubaSila(zakazky, kapacita).prinos);
    }
  });

  it("počítadla sedí se vzorci", () => {
    const n = 200;
    const vstup = Array.from({ length: n }, (_, i) => (i * 7919) % 1000);
    expect(bubblePocitej(vstup)).toBe(ULOHY[1].odhadA(n));
    expect(mergePocitej(vstup)).toBeLessThanOrEqual(ULOHY[1].odhadB(n));
    expect(mer("batoh", 10, 1).a).toBe(1024);
    const h = mer("hledani", 1000, 3);
    expect(h.b).toBeLessThanOrEqual(binarniNejvicHelper(1000));
    const t = mer("trasy", 6, 2);
    expect(t.a).toBe(pocetTras(6));
    expect(t.delkaB!).toBeGreaterThanOrEqual(t.delkaA! - 1e-9);
  });

  it("nad limitem se jen odhaduje", () => {
    const m = mer("razeni", 100000, 1);
    expect(m.odhadA).toBe(true);
    expect(m.a).toBe(bubblePorovnani(100000));
    expect(mer("batoh", 40, 1).odhadA).toBe(true);
  });

  it("čte čísla v různých zápisech", () => {
    expect(cisloZOdhadu("1,2 mil.")).toBe(1.2e6);
    expect(cisloZOdhadu("2^40")).toBe(2 ** 40);
    expect(cisloZOdhadu("50 000 000")).toBe(5e7);
    expect(cisloZOdhadu("1,1 bilionu")).toBeCloseTo(1.1e12);
    expect(cisloZOdhadu("30")).toBe(30);
    expect(Number.isNaN(cisloZOdhadu("hodně"))).toBe(true);
    expect(odhadSedi(1.1e12, 2 ** 40)).toBe(true);
    expect(odhadSedi(1e9, 2 ** 40)).toBe(false);
  });

  it("obří čísla se píšou mocninou deseti a žádná nabízená velikost nedá nekonečno", () => {
    const mezera = (t: string) => t.replace(/\s/g, " ");
    expect(mezera(cislo(1234))).toBe("1 234");
    expect(cislo(1.1e12)).toBe("1,1 bil.");
    expect(cislo(1.3262642990609552e32)).toBe("1,3 · 10³²");
    expect(cislo(1e15)).toBe("10¹⁵");
    expect(cislo(9.99e20)).toBe("10²¹");
    for (const u of ULOHY) {
      for (const n of [...u.navrhy, u.max]) {
        expect(Number.isFinite(u.odhadA(n))).toBe(true);
        expect(cislo(u.odhadA(n)).length).toBeLessThan(16);
      }
    }
  });
});

function binarniNejvicHelper(n: number) {
  return Math.floor(Math.log2(n)) + 1;
}

describe("společný stav hodin", () => {
  const vzor = () => ({ cislo: 3, text: "a", ano: false, seznam: [] as number[], radky: [[0]], pod: { x: 1 } });

  it("podleVzoru nahradí, co nesedí typem", () => {
    expect(podleVzoru(vzor(), { cislo: "x", text: 5, ano: true, seznam: [1, "b", null, {}], radky: [[1, "q"]], pod: { x: Infinity } })).toEqual({
      cislo: 3,
      text: "a",
      ano: true,
      seznam: [1, "b"],
      radky: [[1, 0]],
      pod: { x: 1 },
    });
    expect(podleVzoru(vzor(), null)).toEqual(vzor());
    expect(podleVzoru("", "x".repeat(5000))).toHaveLength(3000);
  });

  it("zDatLekce odmítne neznámou fázi a srovná hotové fáze", () => {
    const s = zDatLekce({ faze: "nic", hotovo: ["reflexe", "x", "problem"], data: {} }, FAZE_LEKCE, vzor);
    expect(s.faze).toBe("problem");
    expect(s.hotovo).toEqual(["problem", "reflexe"]);
    expect(s.data).toEqual(vzor());
  });
});
