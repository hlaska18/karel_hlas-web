import { describe, expect, it } from "vitest";
import {
  dekodujOdevzdani,
  najdiOdevzdani,
  prazdneOdpovedi,
  cisloOdpovedi,
  spoctiBody,
  spravneStrategie,
  STRATEGIE,
  vytvorVariantu,
  zakodujOdevzdani,
  zpravaProUcitele,
  type Odevzdani,
} from "./zaverecne";

/**
 * ZMRAZENO: správné odpovědi už odevzdaných prací se nesmí změnit.
 * Když tenhle test spadne po úpravě generátoru (i ve vyzva.ts, vyhledavani.ts,
 * razeni.ts, trasy.ts), zvyš VERZE_GENERATORU a starou cestu nech běžet.
 */
describe("závěrečné ověření: zmrazený generátor verze 1", () => {
  it("varianta pro Jana Nováka a zadání K7M2QX", () => {
    const v = vytvorVariantu("Jan Novák", "K7M2QX");
    const otisk = {
      situace: v.situace.map((s) => s.s),
      dp: { seed: v.dp.seed, kapacita: v.dp.kapacita, bunky: v.dp.bunky.map((b) => b.hodnota), rozdil: v.dp.kapacitaNavic.rozdil },
      porovnani: v.porovnani.map((p) => p.spravne),
    };
    expect(otisk).toMatchInlineSnapshot(`
      {
        "dp": {
          "bunky": [
            23,
            47,
            24,
          ],
          "kapacita": 9,
          "rozdil": 5,
          "seed": 2140196271,
        },
        "porovnani": [
          15,
          210,
          60,
          1024,
          6,
        ],
        "situace": [
          3,
          1,
          5,
          4,
        ],
      }
    `);
  });
});

describe("závěrečné ověření", () => {
  it("varianta závisí na jménu a zadání, ne na velikosti písmen a mezerách", () => {
    const a = vytvorVariantu("Jan Novák", "K7M2QX");
    expect(vytvorVariantu("  jan  novák ", "k7m2qx").porovnani).toEqual(a.porovnani);
    expect(JSON.stringify(vytvorVariantu("Eva Malá", "K7M2QX"))).not.toBe(JSON.stringify(a));
  });

  it("čtyři situace mají různé strategie", () => {
    for (let i = 0; i < 300; i++) {
      const v = vytvorVariantu(`Žák ${i}`, "ABC234");
      expect(new Set(v.situace.map((s) => s.s)).size).toBe(4);
      for (const s of v.situace) expect(s.s).toBeLessThan(STRATEGIE.length);
    }
  });

  it("správné odpovědi dají plný počet automatických bodů, prázdné nulu", () => {
    const v = vytvorVariantu("Jan Novák", "K7M2QX");
    const o = prazdneOdpovedi();
    expect(spoctiBody(v, o).automaticky).toBe(0);
    o.situace = v.situace.map((s) => s.s);
    o.bunky = v.dp.bunky.map((b) => String(b.hodnota));
    o.vyznam = v.dp.vyznam.moznosti.findIndex((m) => m.spravne);
    o.kapacita = String(v.dp.kapacitaNavic.rozdil);
    o.porovnani = v.porovnani.map((p) => p.spravne.toLocaleString("cs-CZ"));
    expect(spoctiBody(v, o).automaticky).toBe(75);
  });

  it("každá z 2000 variant má tři různé buňky, kladný přínos hodiny navíc a jedinou správnou odpověď na význam", () => {
    for (let i = 0; i < 2000; i++) {
      const v = vytvorVariantu(`Žák ${i}`, i % 2 ? "K7M2QX" : "CVICNE");
      const misto = new Set(v.dp.bunky.map((b) => `${b.radek}:${b.sloupec}`));
      expect(misto.size).toBe(3);
      expect(v.dp.kapacitaNavic.rozdil).toBeGreaterThan(0);
      expect(v.dp.vyznam.moznosti.filter((m) => m.spravne)).toHaveLength(1);
      for (const p of v.porovnani) expect(p.spravne).toBeGreaterThan(0);
    }
  });

  it("kód nese odpovědi i texty a najde se ve zprávě z Teams", () => {
    const v = vytvorVariantu("Jan Novák", "K7M2QX");
    const o = prazdneOdpovedi();
    o.situace = [1, 2, -1, 0];
    o.texty = ["Vzal bych tabulku, protože…", "", "Musí být seřazená."];
    const od: Odevzdani = { verze: 1, zadani: "K7M2QX", jmeno: "Jan Novák", datum: "2027-03-15", odpovedi: o };
    const kod = zakodujOdevzdani(od);
    expect(kod.startsWith("ALGZ1-")).toBe(true);
    expect(dekodujOdevzdani(kod)).toEqual(od);
    const zprava = zpravaProUcitele(v, od);
    const vlozeno = `Jan Novák 8:01\n${zprava}\n\nEva Malá 8:02\nnic\n${zprava}`;
    expect(najdiOdevzdani(vlozeno)).toHaveLength(1);
  });

  it("cesta mřížkou: uzná se dynamické programování i Dijkstrův algoritmus", () => {
    let nalezeno = 0;
    for (let i = 0; i < 200 && nalezeno < 5; i++) {
      const v = vytvorVariantu(`Žák ${i}`, "ABC234");
      const k = v.situace.findIndex((s) => s.text.startsWith("Robot jede mřížkou"));
      if (k < 0) continue;
      nalezeno++;
      expect(spravneStrategie(v.situace[k])).toEqual([3, 5]);
      for (const odpoved of [3, 5]) {
        const o = prazdneOdpovedi();
        o.situace[k] = odpoved;
        expect(spoctiBody(v, o).strategie).toBe(5);
      }
      const o = prazdneOdpovedi();
      o.situace[k] = 4;
      expect(spoctiBody(v, o).strategie).toBe(0);
    }
    expect(nalezeno).toBe(5);
    // Ostatní situace mají jedinou správnou odpověď.
    const v = vytvorVariantu("Jan Novák", "K7M2QX");
    for (const s of v.situace) if (!s.text.startsWith("Robot")) expect(spravneStrategie(s)).toEqual([s.s]);
  });

  it("číslo v odpovědi smí být i mocnina", () => {
    expect(cisloOdpovedi("131072")).toBe(131072);
    expect(cisloOdpovedi("131 072")).toBe(131072);
    expect(cisloOdpovedi("2^17")).toBe(131072);
    expect(cisloOdpovedi("2 ** 17")).toBe(131072);
    expect(cisloOdpovedi("2¹⁷")).toBe(131072);
    expect(cisloOdpovedi("131.072")).toBe(131072);
    expect(cisloOdpovedi("131\u00a0072")).toBe(131072);
    expect(cisloOdpovedi("2^17 = 131072")).toBe(131072);
    expect(cisloOdpovedi("2^17 = 131 000")).toBe(131000);
    expect(cisloOdpovedi("= 24")).toBe(24);
    expect(cisloOdpovedi("7,5")).toBe(7.5);
    expect(cisloOdpovedi("1.5")).toBe(1.5);
    expect(Number.isNaN(cisloOdpovedi("asi tisíc"))).toBe(true);
    expect(Number.isNaN(cisloOdpovedi("="))).toBe(true);
    expect(Number.isNaN(cisloOdpovedi("8!/2"))).toBe(true);
    expect(Number.isNaN(cisloOdpovedi(""))).toBe(true);
  });

  it("odmítne useknutý nebo upravený kód", () => {
    const od: Odevzdani = { verze: 1, zadani: "K7M2QX", jmeno: "Jan Novák", datum: "2027-03-15", odpovedi: prazdneOdpovedi() };
    const kod = zakodujOdevzdani(od);
    expect(dekodujOdevzdani(kod.slice(0, 40))).toBeNull();
    expect(dekodujOdevzdani("ALGZ1-nesmysl")).toBeNull();
    const kodZ = kod.slice(6);
    for (let i = 0; i < kodZ.length - 1; i += 9) {
      const jiny = kodZ[i] === "A" ? "B" : "A";
      expect(dekodujOdevzdani("ALGZ1-" + kodZ.slice(0, i) + jiny + kodZ.slice(i + 1))).toBeNull();
    }
    const holy = "ALGZ1-" + Buffer.from(JSON.stringify({ v: 1, g: 1, z: od.zadani, j: od.jmeno, d: od.datum })).toString("base64url");
    expect(dekodujOdevzdani(holy)).toBeNull();
    expect(dekodujOdevzdani(zakodujOdevzdani({ ...od, odpovedi: { ...od.odpovedi, situace: [9, 0, 0, 0] } }))).toBeNull();
  });
});
