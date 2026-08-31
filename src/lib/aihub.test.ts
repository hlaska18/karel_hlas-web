import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * AI Hub čte výstupy ze souborů, takže testy si postaví vlastní dočasnou
 * složku a podstrčí ji přes `process.cwd()`. Tím se ověří i to, co je na celé
 * věci nejdůležitější: NEÚPLNÝ VÝSTUP SE NESMÍ ZVEŘEJNIT.
 */

let docasna: string;

const UPLNY = {
  nazev: "Zadání slohu s AI protivníkem",
  autor: "Jana Nováková",
  predmet: "Český jazyk",
  cilovaSkupina: "2. ročník SŠ",
  cil: "Naučit žáky obhájit vlastní tvrzení proti protiargumentu.",
  nastroj: "ChatGPT jako oponent, prompt v příloze.",
  overeni: "Odučeno 14. 3. 2027 ve 2. B, dvě vyučovací hodiny.",
  reflexe: "Fungovalo u silnějších žáků; slabší se nechali argumentem zastavit.",
  doporuceni: "Zadat předem tři povolené protiargumenty.",
  faze: "po",
  vysledek: "vyplatilo",
  uspora: "Z hodiny a půl na dvacet minut.",
  publikovano: "2027-03-14",
  prilohy: [{ nazev: "Pracovní list", soubor: "list.docx" }],
};

function poloz(slozka: string, data: unknown) {
  const kam = path.join(docasna, "public", "ai-hub", slozka);
  fs.mkdirSync(kam, { recursive: true });
  fs.writeFileSync(path.join(kam, "vystup.json"), JSON.stringify(data), "utf8");
}

async function nactiVystupy() {
  vi.resetModules();
  const modul = await import("@/lib/aihub");
  return modul.getVystupy();
}

beforeEach(() => {
  docasna = fs.mkdtempSync(path.join(os.tmpdir(), "aihub-"));
  vi.spyOn(process, "cwd").mockReturnValue(docasna);
  // Varování o neúplných výstupech jsou v testech očekávaná, ať neruší výpis.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(docasna, { recursive: true, force: true });
});

describe("čtení výstupů", () => {
  it("bez složky vrací prázdno a nespadne", async () => {
    // Do ledna 2027 je tohle normální stav, ne chyba.
    expect(await nactiVystupy()).toEqual([]);
  });

  it("úplný výstup přečte i s přílohami", async () => {
    poloz("sloh-s-ai", UPLNY);
    const v = await nactiVystupy();
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ id: "sloh-s-ai", nazev: UPLNY.nazev, faze: "po" });
    expect(v[0].href).toBe("/ai-hub/sloh-s-ai");
    expect(v[0].prilohy).toHaveLength(1);
  });

  it.each([
    ["reflexe", "reflexe"],
    ["overeni", "overeni"],
    ["doporuceni", "doporuceni"],
    ["autor", "autor"],
    ["faze", "faze"],
    ["uspora", "uspora"],
    ["vysledek", "vysledek"],
  ])("výstup bez pole „%s“ se nezveřejní", async (_n, pole) => {
    // Jádro věci: karta bez reflexe nebo bez ověření by vypadala jako hotový
    // výstup a přitom by nedokládala nic. Radši ji neukázat vůbec.
    poloz("neuplny", { ...UPLNY, [pole]: "" });
    expect(await nactiVystupy()).toEqual([]);
  });

  it("prázdné znaky se neberou jako vyplněné pole", async () => {
    poloz("mezery", { ...UPLNY, reflexe: "   \n  " });
    expect(await nactiVystupy()).toEqual([]);
  });

  it("neznámá fáze výstup zastaví", async () => {
    poloz("spatna-faze", { ...UPLNY, faze: "kdykoli" });
    expect(await nactiVystupy()).toEqual([]);
  });

  it("fáze v hodině už neexistuje", async () => {
    // AI Hub je o učitelově vlastní práci, ne o tom, co dělá se třídou.
    poloz("behem", { ...UPLNY, faze: "behem" });
    expect(await nactiVystupy()).toEqual([]);
  });

  it("neznámý výsledek výstup zastaví", async () => {
    // Bez výsledku by neúspěšný pokus vypadal jako doporučení.
    poloz("spatny-vysledek", { ...UPLNY, vysledek: "mozna" });
    expect(await nactiVystupy()).toEqual([]);
  });

  it("výstup BEZ milníku projde", async () => {
    // Milník je nepovinný: M1–M6 jsou milníky projektu, a dokud žádný neběží,
    // označit jím materiál by byla nepravda.
    const v = await (async () => {
      poloz("bez-milniku", UPLNY);
      return nactiVystupy();
    })();
    expect(v).toHaveLength(1);
    expect(v[0].milnik).toBeUndefined();
  });

  it("ale nesmyslný milník výstup zastaví", async () => {
    // Nepovinný neznamená „cokoli projde" – překlep by se tiše ukázal na kartě.
    poloz("spatny-milnik", { ...UPLNY, milnik: "M9" });
    expect(await nactiVystupy()).toEqual([]);
  });

  it("platný milník se přečte", async () => {
    poloz("s-milnikem", { ...UPLNY, milnik: "M3" });
    expect((await nactiVystupy())[0].milnik).toBe("M3");
  });

  it("poškozený JSON neshodí celou sekci", async () => {
    const kam = path.join(docasna, "public", "ai-hub", "rozbity");
    fs.mkdirSync(kam, { recursive: true });
    fs.writeFileSync(path.join(kam, "vystup.json"), "{tohle není JSON", "utf8");
    poloz("v-poradku", UPLNY);
    const v = await nactiVystupy();
    expect(v.map((x) => x.id)).toEqual(["v-poradku"]);
  });

  it("řadí od nejnovějšího", async () => {
    poloz("stary", { ...UPLNY, publikovano: "2027-01-05" });
    poloz("novy", { ...UPLNY, publikovano: "2028-06-30" });
    poloz("prostredni", { ...UPLNY, publikovano: "2027-09-01" });
    expect((await nactiVystupy()).map((v) => v.id)).toEqual(["novy", "prostredni", "stary"]);
  });

  it("složky s podtržítkem se přeskočí", async () => {
    // `_JAK-PRIDAT-VYSTUP.txt` a podobné pomůcky nejsou výstupy.
    poloz("_sablona", UPLNY);
    poloz("skutecny", UPLNY);
    expect((await nactiVystupy()).map((v) => v.id)).toEqual(["skutecny"]);
  });

  it("chybějící přílohy nevadí", async () => {
    const { prilohy: _, ...bezPriloh } = UPLNY;
    poloz("bez-priloh", bezPriloh);
    const v = await nactiVystupy();
    expect(v).toHaveLength(1);
    expect(v[0].prilohy).toEqual([]);
  });
});
