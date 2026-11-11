import { describe, expect, it } from "vitest";
import { ZAKAZKY } from "./batoh";
import { PREDPONA_ALGOLAB, dekodujAlgolab, zakodujAlgolab, type PraceAlgolabu } from "./kod";
import { vychoziLekce } from "./lekce";
import { zabal } from "./obal";
import { CISLA_LEKCI, LEKCE } from "./registr";
import { vychoziStav, type StavBatohu } from "./stav";

const prazdneLekce = () => Object.fromEntries(CISLA_LEKCI.map((c) => [c, vychoziLekce(LEKCE[c].faze, LEKCE[c].vychozi)]));
const jen4 = (h4: StavBatohu): PraceAlgolabu => ({ h4, lekce: prazdneLekce() });
const zakoduj4 = (h4: StavBatohu) => zakodujAlgolab(jen4(h4));
const h4z = (text: string) => dekodujAlgolab(text)?.h4 ?? null;
/** Platně podepsaný kód s libovolným obsahem: prověří kontrolu obsahu uvnitř. */
const podepsany = (data: unknown) => "ALG1-" + zabal(JSON.stringify(data), "ALG1");
const holy = (data: unknown) => "ALG1-" + Buffer.from(JSON.stringify(data)).toString("base64url");

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
    const kod = zakoduj4(prace);
    expect(kod.startsWith(PREDPONA_ALGOLAB)).toBe(true);
    expect(dekodujAlgolab(kod)).toEqual(jen4(prace));
  });

  it("nese i změněné zadání a najde kód uprostřed zprávy", () => {
    const upravena = { ...prace, uprava: { kapacita: 12, zakazky: ZAKAZKY.map((z) => ({ ...z, prinos: z.prinos + 1 })) } };
    expect(h4z(`Moje práce: ${zakoduj4(upravena)} díky`)).toEqual(upravena);
  });

  it("nezměněné zadání se nenese, kód je kratší", () => {
    const jinaKapacita = { ...prace, uprava: { kapacita: 9, zakazky: ZAKAZKY } };
    expect(zakoduj4(prace).length).toBeLessThan(zakoduj4(jinaKapacita).length);
  });

  it("cizí, useknutý a podvržený kód odmítne, nesmysly uvnitř zahodí", () => {
    expect(dekodujAlgolab("WIN1-abc")).toBeNull();
    expect(dekodujAlgolab(zakoduj4(prace).slice(0, 30))).toBeNull();
    expect(dekodujAlgolab(podepsany({ v: 2, h4: prace }))).toBeNull();
    const hack = podepsany({ v: 1, h4: { faze: "hack", plan: ["A", "B", "C"], krok: 9999 } });
    expect(h4z(hack)).toEqual(vychoziStav());
  });

  it("kód je zamíchaný: po rozbalení base64 v něm nejsou slova ani hodnoty", () => {
    const kod = zakoduj4(prace).slice(5);
    const rozbaleny = Buffer.from(kod, "base64url").toString("latin1");
    for (const slovo of ["reflexe", "hotovo", "faze", "krok", "123456", "\"v\""]) expect(rozbaleny).not.toContain(slovo);
  });

  it("ručně upravený nebo nepodepsaný kód odmítne", () => {
    // Nepodepsaný obsah, jak by ho žák složil přes web „base64 encode“.
    expect(dekodujAlgolab(holy({ v: 1, h4: prace }))).toBeNull();
    const kod = zakoduj4(prace);
    // Každá změna jednoho znaku kód rozbije.
    for (let i = 5; i < kod.length - 1; i += 7) {
      const jiny = kod[i] === "A" ? "B" : "A";
      expect(dekodujAlgolab(kod.slice(0, i) + jiny + kod.slice(i + 1))).toBeNull();
    }
    // Podepsaný kód hodiny 8 se jako kód postupu nenačte.
    expect(dekodujAlgolab("ALG1-" + zabal(JSON.stringify({ v: 1 }), "ALGZ1"))).toBeNull();
  });

  it("nese ostatní hodiny, nezačaté vynechá", () => {
    const lekce = prazdneLekce();
    lekce[3] = { faze: "experiment", hotovo: ["problem", "pokus"], data: { ...LEKCE[3].vychozi(), reflexe: "Tabulka si pamatuje." } };
    const kod = zakodujAlgolab({ h4: vychoziStav(), lekce });
    expect(dekodujAlgolab(kod)).toEqual({ h4: vychoziStav(), lekce });
    expect(zakodujAlgolab({ h4: vychoziStav(), lekce: prazdneLekce() })).toBe(podepsany({ v: 1 }));
    const hack = podepsany({ v: 1, h3: { faze: "x", data: { krok: "y", reflexe: 5 } } });
    expect(dekodujAlgolab(hack)?.lekce[3]).toEqual(prazdneLekce()[3]);
  });
});
