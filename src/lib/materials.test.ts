import { describe, expect, it } from "vitest";
import {
  TOOL_ORDER,
  getBankItems,
  getBankToolCounts,
  type BankItem,
} from "@/lib/materials";
import { countByKind } from "@/lib/bankLabels";
import { getBankStats } from "@/lib/heroPick";

const items = getBankItems();

describe("getBankItems", () => {
  it("returns a non-empty flat list of materials from public/materialy", () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("produces well-formed items", () => {
    for (const it of items) {
      expect(typeof it.href).toBe("string");
      expect(it.href.length).toBeGreaterThan(0);
      expect(it.label.cs.length).toBeGreaterThan(0);
      expect(it.label.en.length).toBeGreaterThan(0);
      expect(it.ext).toBe(it.ext.toLowerCase());
      expect(TOOL_ORDER).toContain(it.tool);
      expect(it.topicNo).toBeGreaterThanOrEqual(1);
      expect(["teacher", "student", "both"]).toContain(it.audience);
      expect(it.courseIds.length).toBeGreaterThan(0);
      expect(it.sizeBytes).toBeGreaterThanOrEqual(0);
    }
  });

  it("URL-encodes hosted file hrefs and never emits raw spaces", () => {
    for (const it of items) {
      // Odkaz na cizí zdroj ani nástroj běžící na webu nejsou hostovaný soubor.
      if (it.external || it.interactive) continue;
      expect(it.href.startsWith("/materialy/")).toBe(true);
      expect(it.href).not.toContain(" ");
    }
  });

  it("nástroj na webu míří dovnitř webu", () => {
    // Kdyby `_nastroj.json` dostal externí URL, tvářil by se odkaz ven jako
    // naše věc – bez atribuce a bez target="_blank". Ta konvence je schválně
    // jen pro vnitřní cesty; na cizí zdroje je `_zdroj.json`.
    for (const it of items.filter((i) => i.interactive)) {
      expect(it.href.startsWith("/")).toBe(true);
      expect(it.external).toBeFalsy();
    }
  });

  it("nástroj z _nastroj.json není soubor", () => {
    // Nástroj bez vlastního souboru (virtuální Windows, kurz SQL) nesmí dostat
    // velikost – hero by ho jinak počítal mezi věci ke stažení.
    for (const it of items.filter((i) => i.interactive && !i.novaKarta)) {
      expect(it.sizeBytes).toBe(0);
    }
  });

  it("HTML se otevírá, nestahuje", () => {
    // Laboratoře ke grafice a podobné hotové stránky. Stažené z prohlížeče
    // jsou k ničemu; musí dostat řádek nástroje a novou kartu.
    const stranky = items.filter((i) => i.ext === "html");
    expect(stranky.length).toBeGreaterThan(0);
    for (const it of stranky) {
      expect(it.interactive).toBe(true);
      expect(it.novaKarta).toBe(true);
      expect(it.href.startsWith("/materialy/")).toBe(true);
    }
  });

  it("ukázky ze složky se `_zdroje.txt` se v bance nevypisují", () => {
    // Osmnáct řádků s `foto_jpeg_q*` byl hlavní důvod, proč byla Grafika
    // nepřehledná. Složka na disku zůstává – pracovní listy na ni odkazují.
    const nazvy = items.map((i) => i.label.cs.toLowerCase());
    expect(nazvy.some((n) => n.startsWith("foto_jpeg_q"))).toBe(false);
    expect(nazvy.some((n) => n.startsWith("hloubka_"))).toBe(false);
    expect(items.some((i) => i.group?.cs.includes("Obrázky"))).toBe(false);
    expect(items.some((i) => i.label.cs.startsWith("_zdroje"))).toBe(false);
  });

  it("deduplicates identical materials shared across course fields", () => {
    const keyOf = (it: BankItem) =>
      [it.tool, it.audience, it.group?.cs ?? "", it.label.cs, it.ext].join("|").toLowerCase();
    const keys = items.map(keyOf);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("merges shared materials into multiple courseIds without duplicate ids", () => {
    for (const it of items) {
      expect(new Set(it.courseIds).size).toBe(it.courseIds.length);
    }
  });

  it("sorts items by the configured tool order", () => {
    const rank = (t: string) => {
      const i = TOOL_ORDER.indexOf(t);
      return i < 0 ? TOOL_ORDER.length : i;
    };
    for (let i = 1; i < items.length; i++) {
      expect(rank(items[i - 1].tool)).toBeLessThanOrEqual(rank(items[i].tool));
    }
  });

  it("labels items shared by all course fields as covering all fields", () => {
    const allFields = items.filter((it) => it.courseIds.length > 1);
    for (const it of allFields) {
      expect(it.coursesLabel.cs.length).toBeGreaterThan(0);
      expect(it.coursesLabel.en.length).toBeGreaterThan(0);
    }
  });
});

describe("getBankToolCounts", () => {
  const counts = getBankToolCounts();

  it("reports counts only for tools that have materials, in tool order", () => {
    const tools = counts.map((c) => c.tool);
    expect(tools).toEqual(TOOL_ORDER.filter((t) => tools.includes(t)));
  });

  it("matches the number of items grouped by tool", () => {
    const expected = new Map<string, number>();
    for (const it of items) expected.set(it.tool, (expected.get(it.tool) ?? 0) + 1);
    for (const c of counts) {
      expect(c.count).toBe(expected.get(c.tool));
      expect(c.count).toBeGreaterThan(0);
      expect(typeof c.hasTeacher).toBe("boolean");
    }
  });

  it("accounts for every material across all tool buckets", () => {
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(items.length);
  });
});

describe("součet dlaždic proti číslu v hlavičce", () => {
  it("dlaždice napočítají stejně souborů jako hero", () => {
    // Tohle se už dvakrát rozešlo: mřížka hlásila 161 proti 152 v heru,
    // po opravě 93 proti 87. Pokaždé proto, že každá strana počítala
    // „soubor" jinak. Test hlídá, že obě definice zůstanou tatáž věc.
    const items = getBankItems();
    const podle = new Map<string, typeof items>();
    for (const it of items) {
      const l = podle.get(it.tool);
      if (l) l.push(it);
      else podle.set(it.tool, [it]);
    }
    let soucet = 0;
    for (const its of podle.values()) soucet += countByKind(its).soubory;

    expect(soucet).toBe(getBankStats(items).files);
  });
});

describe("cvičebnice 100 příkladů pro Office", () => {
  const items = getBankItems();

  it("Word, Excel i Power BI jsou soubory, ne odkazy ven", () => {
    // Cvičebnice se na web nahrávala právě proto, že odkaz ven přestal
    // fungovat. Kdyby se sem nějaký vrátil, je to krok zpátky k té chybě,
    // kterou hlásili kolegové.
    for (const skupina of ["Word", "Excel", "PowerBI"]) {
      // Schválně podle SKUPINY, ne podle dlaždice: v dlaždici Power BI leží
      // i rozcestník Microsoftu, odkud software vzít. To je odkaz, který tam
      // patří – nic se odtud nestahuje a je to jejich vlastní stránka.
      const vsechny = items.filter(
        (it) => it.group?.cs === skupina || it.group?.cs.startsWith(`${skupina} › `),
      );
      expect(vsechny.length, skupina).toBeGreaterThan(5);
      expect(vsechny.filter((it) => it.external), skupina).toHaveLength(0);
    }
  });

  it("každá úloha má svoje zadání jako PDF", () => {
    // Cvičebnice má 73 úloh a ke každé je rozřezaný list ze zadání. Kdyby
    // se rozřezání rozešlo s počtem složek, tenhle test to chytí – bez něj
    // by úloha tiše zůstala bez zadání a poznalo by se to až v hodině.
    const skupiny = new Map<string, Set<string>>();
    for (const it of items) {
      const g = it.group?.cs ?? "";
      if (!/^(Word|Excel|PowerBI) › Úlohy › /.test(g)) continue;
      if (!skupiny.has(g)) skupiny.set(g, new Set());
      skupiny.get(g)!.add(it.label.cs);
    }
    expect(skupiny.size).toBe(73);
    for (const [g, labels] of skupiny) {
      expect(labels.has("Zadání"), g).toBe(true);
    }
  });

  it("pracovní soubor se nejmenuje zadání", () => {
    // Karel na to upozornil: v tom .docx žádné zadání není, je to soubor,
    // ve kterém se podle zadání teprve pracuje. Zadání je ten list z PDF.
    const spatne = items.filter(
      (it) =>
        /^(Word|Excel|PowerBI) › Úlohy › /.test(it.group?.cs ?? "") &&
        it.label.cs.startsWith("Zadání") &&
        it.ext !== "pdf",
    );
    expect(spatne.map((it) => `${it.group?.cs}: ${it.label.cs}.${it.ext}`)).toEqual([]);
  });

  it("soubor patří do dlaždice podle složky, ne podle přípony", () => {
    // Zdroj dat pro hromadnou korespondenci je .xlsx, ale je to podklad
    // k úloze ve Wordu. Kdyby spadl do Excelu, chybí přesně tam, kde ho
    // učitel potřebuje – a to je táž chyba jako ten rozbitý odkaz, kvůli
    // kterému se celá cvičebnice na web nahrávala.
    const zdrojDat = items.find((it) => it.label.cs === "Zdroj dat – výsledky OH");
    expect(zdrojDat).toBeDefined();
    expect(zdrojDat!.tool).toBe("Word");

    // Totéž z druhé strany: databáze k importu dat je .accdb, ale je to
    // podklad k úloze v Excelu.
    const databaze = items.find((it) => it.label.cs === "Zdrojová databáze");
    expect(databaze).toBeDefined();
    expect(databaze!.tool).toBe("Excel");
  });

  it("pravidlo o složce nepřetáhlo do dlaždic nic dalšího", () => {
    // Pojistka k `SLOZKA_NASTROJE`: přepisuje se jen u složek pojmenovaných
    // přesně podle nástroje. Kdyby se to pravidlo rozšířilo, tenhle test
    // upozorní, že se z dlaždic začaly stěhovat i cizí materiály.
    const cizi = items.filter(
      (it) =>
        ["Word", "Excel", "Power BI"].includes(it.tool) &&
        !/^(Word|Excel|PowerBI)(\s›|$)/.test(it.group?.cs ?? ""),
    );
    for (const it of cizi) {
      // Co do těchhle dlaždic patří odjinud, patří tam podle názvu nebo
      // přípony – ne omylem přes složku.
      expect(
        /excel|word|power\s?bi|tabulkov|textov/i.test(
          `${it.group?.cs ?? ""} ${it.topicLabel.cs} ${it.label.cs}`,
        ) || ["xlsx", "xlsm", "xls", "csv", "docx", "docm", "pbix"].includes(it.ext),
        `${it.tool}: ${it.group?.cs} › ${it.label.cs}`,
      ).toBe(true);
    }
  });

  it("materiály platí pro všechny obory, i když leží jen v 1L", () => {
    // Soubory jsou na disku jednou (48 MB), obory 1S a 1P na ně ukazují
    // souborem `_stejne.txt`. Bez toho by u nich svítilo jen „technické
    // lyceum" a kolega ze strojírenství by je přeskočil.
    const zadani = items.find(
      (it) => it.group?.cs === "Excel › Úlohy › 01 – Tabulka" && it.label.cs === "Zadání",
    );
    expect(zadani).toBeDefined();
    expect(zadani!.courseIds).toEqual(expect.arrayContaining(["1L", "1S", "1P"]));
  });

  it("v každé úloze stojí zadání před řešením", () => {
    // Česká abeceda řadí Ř před Z, takže se v každé úloze samo nabídlo
    // nejdřív řešení a teprve pak zadání – přesně naopak, než se učí.
    // Pořadí má být to, ve kterém se soubory otevírají: zadání, pracovní
    // soubor, podklady, řešení.
    const skupiny = new Map<string, string[]>();
    for (const it of items) {
      const g = it.group?.cs ?? "";
      if (!/^(Word|Excel|PowerBI) › /.test(g)) continue;
      if (!skupiny.has(g)) skupiny.set(g, []);
      skupiny.get(g)!.push(it.label.cs);
    }
    expect(skupiny.size).toBeGreaterThan(60);
    for (const [g, labels] of skupiny) {
      const prvniReseni = labels.findIndex((l) => l.startsWith("Řešení"));
      const posledniZadani = labels.map((l) => l.startsWith("Zadání")).lastIndexOf(true);
      const prvniPracovni = labels.findIndex((l) => l.startsWith("Pracovní soubor"));
      if (posledniZadani !== -1 && prvniReseni !== -1) {
        expect(posledniZadani, `${g}: ${labels.join(", ")}`).toBeLessThan(prvniReseni);
      }
      if (posledniZadani !== -1 && prvniPracovni !== -1) {
        expect(posledniZadani, `${g}: ${labels.join(", ")}`).toBeLessThan(prvniPracovni);
      }
      if (prvniPracovni !== -1 && prvniReseni !== -1) {
        expect(prvniPracovni, `${g}: ${labels.join(", ")}`).toBeLessThan(prvniReseni);
      }
    }
  });

  it("adresa souboru s čárkou v názvu není rozbitá", () => {
    // Next u statických souborů nedekóduje `%2C`, takže čárka zakódovaná
    // přes `encodeURIComponent` vedla na 404. Lámalo to i materiály, které
    // tu byly dávno před cvičebnicí („Hodnocení, testy a řešení.docx“).
    for (const it of items) {
      if (it.external || it.interactive) continue;
      expect(it.href, it.label.cs).not.toContain("%2C");
    }
    const sCarkou = items.filter((it) => it.href.includes(","));
    expect(sCarkou.length).toBeGreaterThan(0);
  });

  it("popis z _popis.json se dostane k souboru i ke složce", () => {
    // Popis se PÍŠE, nehádá se z názvu (dřív tu byl štítek, který uměl jen
    // zopakovat, co je vidět nad ním). Když se `_popis.json` rozbije, tenhle
    // test to chytí — jinak by věta tiše zmizela a nikdo by si nevšiml.
    const cvicebnice = items.find(
      (it) => it.group?.cs === "Word" && it.label.cs === "Zadání úloh – cvičebnice",
    );
    expect(cvicebnice?.popis?.cs).toContain("Celá cvičebnice");
    expect(cvicebnice?.popis?.en).toContain("whole workbook");
    expect(cvicebnice?.groupPopis?.cs).toContain("rozbitý dokument");
  });

  it("popis složky se nedědí do úloh", () => {
    // Věta o tom, jak na sebe úlohy navazují, patří k Wordu jako celku.
    // Kdyby se dědila, vyskočila by u každé z 32 úloh zvlášť.
    const vUloze = items.filter((it) => /^Word › Úlohy › /.test(it.group?.cs ?? ""));
    expect(vUloze.length).toBeGreaterThan(30);
    expect(vUloze.filter((it) => it.groupPopis)).toHaveLength(0);
  });

  it("číslo úlohy je vidět v názvu", () => {
    // Úlohy ve Wordu na sebe navazují, takže pořadí je informace. Předpona
    // „01. " by se z popisku strhla, „01 – " zůstane.
    const ulohy = new Set(
      items
        .map((it) => it.group?.cs ?? "")
        .filter((g) => /^Word › Úlohy › /.test(g))
        .map((g) => g.split(" › ")[2]),
    );
    expect(ulohy.size).toBe(32);
    for (const u of ulohy) expect(u, u).toMatch(/^\d{2} – /);
  });

  it("autorem je tým cvičebnice, ne jeden člověk", () => {
    const ukol = items.find((it) => it.group?.cs === "Word › Úlohy › 01 – Formát písma");
    expect(ukol?.groupAuthor).toBe("Tým autorů a tým Microsoft pro školství");
  });

  it("nezůstal odkaz, který vede na přihlášení osobním účtem Microsoft", () => {
    // Přesně tohle kolegům hlásilo chybu: onedrive.live.com přesměruje na
    // login.live.com a školní účet tam neprojde.
    for (const it of items) {
      expect(it.href, it.label.cs).not.toMatch(/onedrive\.live\.com/);
    }
  });
});
