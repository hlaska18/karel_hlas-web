import { describe, expect, it } from "vitest";
import { prazdneOdpovedi } from "./zaverecne";
import { jmenaPraci, klicPrace, MAX_PRACI, otiskPrace, praceBez, praceDoTextu, praceZTextu, type PraceZaka } from "./praceH8";

const DNES = "2027-03-15";
const prace = (jmeno: string, zadani = "K7M2QX", zmeny: Partial<PraceZaka> = {}): PraceZaka => ({
  zadani,
  jmeno,
  odpovedi: prazdneOdpovedi(),
  odevzdano: false,
  datum: DNES,
  ...zmeny,
});

describe("hodina 8: uložené práce podle zadání a jména", () => {
  it("klíč nezávisí na diakritice, velikosti písmen, mezerách ani pořadí slov", () => {
    const k = klicPrace("K7M2QX", "Jan Novák");
    expect(klicPrace("k7m2qx", "  novak   JAN ")).toBe(k);
    expect(klicPrace("K7M2QX", "Eva Malá")).not.toBe(k);
    expect(klicPrace("CVICNE", "Jan Novák")).not.toBe(k);
  });

  it("cvičné ověření nepřepíše ostré a druhý žák nepřepíše prvního", () => {
    let text = praceDoTextu({}, prace("Jan Novák", "K7M2QX", { odpovedi: { ...prazdneOdpovedi(), kapacita: "5" } }), 1);
    text = praceDoTextu(praceZTextu(text, DNES), prace("Jan Novák", "CVICNE"), 2);
    text = praceDoTextu(praceZTextu(text, DNES), prace("Eva Malá"), 3);
    const sklad = praceZTextu(text, DNES);
    expect(Object.keys(sklad)).toHaveLength(3);
    expect(sklad[klicPrace("K7M2QX", "Jan Novák")].odpovedi.kapacita).toBe("5");
    expect(sklad[klicPrace("CVICNE", "Jan Novák")].odpovedi.kapacita).toBe("");
    expect(jmenaPraci(sklad, "K7M2QX").sort()).toEqual(["Eva Malá", "Jan Novák"]);
    expect(jmenaPraci(sklad, "CVICNE")).toEqual(["Jan Novák"]);
  });

  it("stejné jméno napsané jinak pokračuje ve stejné práci", () => {
    const text = praceDoTextu({}, prace("Jan Novák", "K7M2QX", { odevzdano: true }), 1);
    const nalezena = praceZTextu(text, DNES)[klicPrace("K7M2QX", "novak jan")];
    expect(nalezena.jmeno).toBe("Jan Novák");
    expect(nalezena.odevzdano).toBe(true);
  });

  it("starší podobu s jedinou prací převede a rozbitý zápis zahodí", () => {
    const stara = JSON.stringify(prace("Jan Novák"));
    expect(Object.keys(praceZTextu(stara, DNES))).toEqual([klicPrace("K7M2QX", "Jan Novák")]);
    expect(praceZTextu(null, DNES)).toEqual({});
    expect(praceZTextu("{nesmysl", DNES)).toEqual({});
    expect(praceZTextu('{"zadani":"K7M2QX","jmeno":"X Y","odpovedi":null}', DNES)).toEqual({});
    expect(praceZTextu('{"v":2,"prace":{"a":{"zadani":"K7M2QX","jmeno":"Jan Novák","odpovedi":{"situace":[9]}},"b":5}}', DNES)).toEqual({});
  });

  it("smazání jedné práce nechá ostatní", () => {
    let text = praceDoTextu({}, prace("Jan Novák", "CVICNE"), 1);
    text = praceDoTextu(praceZTextu(text, DNES), prace("Eva Malá", "CVICNE"), 2);
    const sklad = praceZTextu(praceBez(praceZTextu(text, DNES), klicPrace("CVICNE", "Jan Novák")), DNES);
    expect(jmenaPraci(sklad, "CVICNE")).toEqual(["Eva Malá"]);
  });

  it("plný sklad vyřadí nejdéle neměněnou práci, nikdy tu právě ukládanou", () => {
    let sklad = {};
    for (let i = 0; i < MAX_PRACI; i++) sklad = praceZTextu(praceDoTextu(sklad, prace(`Žák Číslo${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + Math.floor(i / 26))}`), 100 + i), DNES);
    expect(Object.keys(sklad)).toHaveLength(MAX_PRACI);
    const nejstarsi = Object.keys(sklad).find((k) => (sklad as Record<string, { zmena: number }>)[k].zmena === 100)!;
    sklad = praceZTextu(praceDoTextu(sklad, prace("Nový Žák"), 5), DNES);
    expect(Object.keys(sklad)).toHaveLength(MAX_PRACI);
    expect(Object.keys(sklad)).not.toContain(nejstarsi);
    expect(Object.keys(sklad)).toContain(klicPrace("K7M2QX", "Nový Žák"));
  });

  it("otisk se změní s odpovědí i s odevzdáním", () => {
    const a = prace("Jan Novák");
    expect(otiskPrace(a)).toBe(otiskPrace(prace("Jan Novák")));
    expect(otiskPrace({ ...a, odevzdano: true })).not.toBe(otiskPrace(a));
    expect(otiskPrace({ ...a, odpovedi: { ...a.odpovedi, kapacita: "7" } })).not.toBe(otiskPrace(a));
    // Po průchodu úložištěm je otisk stejný (dvě karty se jinak hlásily zbytečně).
    const zpet = praceZTextu(praceDoTextu({}, a, 1), DNES)[klicPrace(a.zadani, a.jmeno)];
    expect(otiskPrace(zpet)).toBe(otiskPrace(a));
  });
});
