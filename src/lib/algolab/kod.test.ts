import { describe, expect, it } from "vitest";
import { ZAKAZKY } from "./batoh";
import { PREDPONA_ALGOLAB, dekodujAlgolab, zakodujAlgolab } from "./kod";
import { vychoziStav } from "./stav";

/*
 * Kód postupu ALG1-: žák si jím přenese práci na jiný počítač. Kódy si budou
 * ukládat do OneNotu, takže dnešní kód musí jít načíst i po dalších úpravách.
 */
describe("kód postupu ALGOLABu", () => {
  const prace = {
    ...vychoziStav(),
    faze: "reflexe" as const,
    plan: ["B", "C"],
    planPotvrzen: true,
    tip: "zaHodinu" as const,
    krok: 55,
    zodpovezene: ["2:5", "3:7"],
    zpet: 5,
    seedVyzvy: 123456,
    vyzva: { bunky: ["11", "24", "7"], vyznam: 1, rozdil: "3", zkontrolovano: true },
    reflexe: "Velký úkol zabral čas dvěma menším. Řeší se to tabulkou – „vzít, nebo nevzít“.",
    vzorOdkryt: true,
    hotovo: ["problem" as const, "pokus" as const, "experiment" as const, "vyzva" as const],
  };

  it("vrátí stejnou práci včetně reflexe s diakritikou", () => {
    const kod = zakodujAlgolab(prace);
    expect(kod.startsWith(PREDPONA_ALGOLAB)).toBe(true);
    expect(dekodujAlgolab(kod)).toEqual(prace);
  });

  it("nese i změněné zadání a najde kód uprostřed zprávy", () => {
    const upravena = { ...prace, uprava: { kapacita: 12, zakazky: ZAKAZKY.map((z) => ({ ...z, prinos: z.prinos + 1 })) } };
    expect(dekodujAlgolab(`Moje práce: ${zakodujAlgolab(upravena)} díky`)).toEqual(upravena);
  });

  it("nezměněné zadání se nenese, kód je kratší", () => {
    const jinaKapacita = { ...prace, uprava: { kapacita: 9, zakazky: ZAKAZKY } };
    expect(zakodujAlgolab(prace).length).toBeLessThan(zakodujAlgolab(jinaKapacita).length);
  });

  it("cizí, useknutý a podvržený kód odmítne, nesmysly uvnitř zahodí", () => {
    expect(dekodujAlgolab("WIN1-abc")).toBeNull();
    expect(dekodujAlgolab(zakodujAlgolab(prace).slice(0, 30))).toBeNull();
    const verze2 = "ALG1-" + Buffer.from(JSON.stringify({ v: 2, h4: prace })).toString("base64url");
    expect(dekodujAlgolab(verze2)).toBeNull();
    const hack = "ALG1-" + Buffer.from(JSON.stringify({ v: 1, h4: { faze: "hack", plan: ["A", "B", "C"], krok: 9999 } })).toString("base64url");
    expect(dekodujAlgolab(hack)).toEqual(vychoziStav());
  });
});
