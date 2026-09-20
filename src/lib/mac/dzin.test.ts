import { describe, expect, it } from "vitest";
import { nahladce, okrajeProuzku, postupRezu, vyboul } from "./dzin";

describe("vyboul", () => {
  it("je nulove na obou koncich, aby trychtyr nikde neodskocil", () => {
    expect(vyboul(0)).toBeCloseTo(0, 5);
    expect(vyboul(1)).toBeCloseTo(0, 5);
  });

  it("ma maximum uprostred – to je ten zakriveny krk", () => {
    const stred = vyboul(0.5);
    expect(stred).toBeGreaterThan(vyboul(0.2));
    expect(stred).toBeGreaterThan(vyboul(0.8));
    // Mocnina 0.9 hodnotu proti holemu sinu mirne zvedne: 0,1^0,9 = 0,126.
    expect(stred).toBeCloseTo(0.1259, 3);
  });
});

describe("okrajeProuzku", () => {
  const kam = 0.5;
  const sirkaDole = 0.06;

  it("nahore je okno v plne sirce", () => {
    const o = okrajeProuzku(1, kam, sirkaDole);
    expect(o.levy).toBeCloseTo(0, 5);
    expect(o.pravy).toBeCloseTo(1, 5);
  });

  it("dole sedi na cilove ikone", () => {
    const o = okrajeProuzku(0, kam, sirkaDole);
    expect(o.levy).toBeCloseTo(kam - sirkaDole / 2, 5);
    expect(o.pravy).toBeCloseTo(kam + sirkaDole / 2, 5);
  });

  it("uprostred je uzsi, nez kdyby slo o rovny kuzel", () => {
    const t = 0.5;
    const s = okrajeProuzku(t, kam, sirkaDole);
    const sirka = s.pravy - s.levy;
    // Rovný kužel by měl ve středu průměr obou konců.
    const rovny = ((kam + sirkaDole / 2 - (kam - sirkaDole / 2)) + 1) / 2;
    expect(sirka).toBeLessThan(rovny);
  });

  it("pruh se nikdy neprevrati naruby", () => {
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const o = okrajeProuzku(t, kam, sirkaDole);
      expect(o.pravy).toBeGreaterThanOrEqual(o.levy);
    }
  });

  it("trychtyr se smerem dolu zuzuje", () => {
    const sirka = (t: number) => {
      const o = okrajeProuzku(t, kam, sirkaDole);
      return o.pravy - o.levy;
    };
    expect(sirka(1)).toBeGreaterThan(sirka(0.5));
    expect(sirka(0.5)).toBeGreaterThan(sirka(0));
  });

  it("umi cil i mimo sirku okna", () => {
    // Dock bývá uprostřed obrazovky, okno klidně stranou – `kam` pak vyjde
    // záporné nebo nad jedničku a nesmí to rozbít tvar.
    const o = okrajeProuzku(0, -0.4, 0.06);
    expect(o.pravy).toBeGreaterThanOrEqual(o.levy);
    expect(Number.isFinite(o.levy)).toBe(true);
  });
});

describe("nahladce", () => {
  it("zacina v nule a konci v jednicce", () => {
    expect(nahladce(0)).toBeCloseTo(0, 5);
    expect(nahladce(1)).toBeCloseTo(1, 5);
  });

  it("je rostouci", () => {
    let predchozi = -1;
    for (let i = 0; i <= 50; i++) {
      const v = nahladce(i / 50);
      expect(v).toBeGreaterThanOrEqual(predchozi);
      predchozi = v;
    }
  });
});

describe("postupRezu", () => {
  it("spodek se rozjede hned, vrsek az pozdeji", () => {
    // Na začátku animace se spodní hrana (s = 1) už hýbe, horní (s = 0) ne.
    expect(postupRezu(0.1, 1)).toBeGreaterThan(0);
    expect(postupRezu(0.1, 0)).toBe(0);
  });

  it("oba konce dorazi na konci soucasne", () => {
    expect(postupRezu(1, 0)).toBeCloseTo(1, 5);
    expect(postupRezu(1, 1)).toBeCloseTo(1, 5);
  });

  it("nizsi rez je vzdy dal nez vyssi", () => {
    for (let i = 1; i < 10; i++) {
      const p = i / 10;
      expect(postupRezu(p, 1)).toBeGreaterThanOrEqual(postupRezu(p, 0.5));
      expect(postupRezu(p, 0.5)).toBeGreaterThanOrEqual(postupRezu(p, 0));
    }
  });

  it("nevyleze z rozsahu 0 az 1", () => {
    for (let i = -2; i <= 12; i++) {
      for (const s of [0, 0.5, 1]) {
        const v = postupRezu(i / 10, s);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
