import { describe, expect, it } from "vitest";
import { rozdelPrikazy, druhPrikazu, prikazNaPozici, pocetRadku, zakomentujZmeny } from "@/lib/dbb/prikazy";
import { KURZ, hlavniTabulka, lekceHotova, povinne, coSKnihovnou, rozdelSkore } from "@/lib/dbb/kurz";
import { LESSONS } from "@/lib/sqlExercise";
import { naBase64, zBase64, upravNazev, velikost } from "@/lib/dbb/soubory";
import { zvyrazni } from "@/lib/dbb/zvyrazneni";
import { chybaCesky } from "@/lib/dbb/chyby";
import { podminkaFiltru } from "@/components/dbb/KartaData";
import { sqlTabulky } from "@/components/dbb/Dialogy";

describe("rozdelPrikazy", () => {
  it("dělí podle středníků a čísluje řádky od začátku editoru", () => {
    const p = rozdelPrikazy("SELECT 1;\nSELECT 2;\n\n  UPDATE knihy SET rok = 1;");
    expect(p.map((x) => x.text)).toEqual(["SELECT 1;", "SELECT 2;", "UPDATE knihy SET rok = 1;"]);
    expect(p.map((x) => x.radek)).toEqual([1, 2, 4]);
  });

  it("středník v textu ani v komentáři příkaz nekončí", () => {
    const p = rozdelPrikazy("SELECT 'a;b';\n-- komentář; pořád komentář\nSELECT 2 /* ; */;");
    expect(p.map((x) => x.text)).toEqual(["SELECT 'a;b';", "SELECT 2 /* ; */;"]);
    expect(p[1].radek).toBe(3);
  });

  it("zdvojený apostrof text nekončí", () => {
    expect(rozdelPrikazy("SELECT 'Rock''n''roll;'; SELECT 3").length).toBe(2);
  });

  it("prázdný editor nebo samý komentář nedá žádný příkaz", () => {
    expect(rozdelPrikazy("")).toEqual([]);
    expect(rozdelPrikazy("  -- jen poznámka\n")).toEqual([]);
  });

  it("najde příkaz pod kurzorem", () => {
    const text = "SELECT 1;\nSELECT 2;";
    const p = rozdelPrikazy(text);
    expect(prikazNaPozici(p, 2)!.text).toBe("SELECT 1;");
    expect(prikazNaPozici(p, text.length)!.text).toBe("SELECT 2;");
  });
});

describe("druhPrikazu", () => {
  it("rozliší čtení, změnu dat, změnu struktury a transakce", () => {
    expect(druhPrikazu("select * from knihy")).toBe("cteni");
    expect(druhPrikazu("INSERT INTO t VALUES (1)")).toBe("data");
    expect(druhPrikazu("CREATE TABLE t (a)")).toBe("struktura");
    expect(druhPrikazu("COMMIT")).toBe("transakce");
  });
});

describe("pocetRadku", () => {
  it("drží českou shodu", () => {
    expect(pocetRadku(1, "vrácen")).toBe("1 řádek vrácen");
    expect(pocetRadku(3, "vrácen")).toBe("3 řádky vráceny");
    expect(pocetRadku(10, "vrácen")).toBe("10 řádků vráceno");
    expect(pocetRadku(0, "ovlivněn")).toBe("0 řádků ovlivněno");
  });
});

describe("KURZ", () => {
  it("má lekce 1–19 v pořadí a jedinečné klíče úkolů", () => {
    expect(KURZ.map((l) => l.id)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
    const klice = KURZ.reduce<string[]>((a, l) => a.concat(l.ukoly.map((u) => u.klic)), []);
    expect(new Set(klice).size).toBe(klice.length);
  });

  it("každá lekce má aspoň jeden povinný úkol", () => {
    for (const l of KURZ) expect(povinne(l).length).toBeGreaterThan(0);
  });

  it("lekce 1–13 se shodují s kurzem na webu – na něj navazuje pracovní list", () => {
    for (const puvodni of LESSONS) {
      const l = KURZ.find((x) => x.id === puvodni.id)!;
      expect(l.title).toBe(puvodni.title);
      expect(l.ukoly[0].zadani).toBe(puvodni.zadani);
      expect(l.ukoly[0].reseni).toBe(puvodni.reference);
      if (puvodni.bonus) {
        expect(l.ukoly[1].zadani).toBe(puvodni.bonus.zadani);
        expect(l.ukoly[1].navic).toBe(true);
      }
    }
  });

  it("lekce 13 mluví o Vrátit změny, ne o tlačítku webového kurzu", () => {
    const l = KURZ.find((x) => x.id === 13)!;
    expect(l.teach).toContain("Vrátit změny");
    expect(l.teach).not.toContain("tenhle kurz tlačítko");
  });

  it("hotová lekce = všechny povinné úkoly, úloha navíc se nepočítá", () => {
    const l = KURZ.find((x) => x.id === 3)!;
    expect(lekceHotova(l, new Set(["3"]))).toBe(true);
    expect(lekceHotova(l, new Set(["3b"]))).toBe(false);
  });

  it("u lekcí z kurzu pozná tabulku pro náhled", () => {
    expect(hlavniTabulka("SELECT nazev FROM knihy WHERE rok > 1900")).toBe("knihy");
    expect(hlavniTabulka("INSERT INTO ctenari VALUES (1)")).toBe("ctenari");
    expect(hlavniTabulka("UPDATE vypujcky SET x = 1")).toBe("vypujcky");
  });
});

describe("soubory", () => {
  it("base64 převede bajty tam i zpátky beze ztráty", () => {
    const bajty = new Uint8Array(70000);
    for (let i = 0; i < bajty.length; i++) bajty[i] = (i * 7) % 256;
    expect(Array.from(zBase64(naBase64(bajty)))).toEqual(Array.from(bajty));
  });

  it("doplní .db a odmítne znaky, které Windows nedovolí", () => {
    expect(upravNazev("hry")).toEqual({ nazev: "hry.db" });
    expect(upravNazev("moje.sqlite")).toEqual({ nazev: "moje.sqlite" });
    expect("chyba" in upravNazev("a/b")).toBe(true);
    expect("chyba" in upravNazev("   ")).toBe(true);
  });

  it("velikost ukazuje v kB, jako dialog Windows", () => {
    expect(velikost(16384)).toBe("16 kB");
    expect(velikost(10)).toBe("1 kB");
  });
});

describe("zvyrazni", () => {
  it("obarví klíčová slova, text, čísla a komentáře a nic neztratí", () => {
    const sql = "SELECT nazev FROM knihy WHERE rok > 1900 AND zanr = 'román'; -- poznámka";
    const kusy = zvyrazni(sql);
    expect(kusy.map((k) => k.text).join("")).toBe(sql);
    expect(kusy.find((k) => k.text === "SELECT")!.trida).toBe("slovo");
    expect(kusy.find((k) => k.text === "'román'")!.trida).toBe("text");
    expect(kusy.find((k) => k.text === "1900")!.trida).toBe("cislo");
    expect(kusy.find((k) => k.text === "-- poznámka")!.trida).toBe("komentar");
  });

  it("číslo uvnitř názvu sloupce není číslo", () => {
    expect(zvyrazni("rok2").every((k) => k.trida !== "cislo")).toBe(true);
  });
});

describe("chybaCesky", () => {
  it("vyjmenuje tabulky otevřené databáze, ne tři tabulky knihovny", () => {
    expect(chybaCesky("no such table: hry", ["hraci", "turnaje"])).toContain("hraci, turnaje");
  });

  it("u chybějící tabulky hodnoceni pošle zpátky k lekci 17", () => {
    expect(chybaCesky("no such table: hodnoceni", ["ctenari", "knihy", "vypujcky"])).toContain("lekci 17");
  });

  it("u dvakrát spuštěného INSERTu radí Shift+F5, ne jiné id (lekce 11 chce id 11)", () => {
    const text = chybaCesky("UNIQUE constraint failed: knihy.id", []);
    expect(text).toContain("Shift+F5");
    expect(text).not.toContain("jiné id");
  });

  it("u sloupce s háčkem řekne, že názvy jsou bez diakritiky", () => {
    const sloupce = ["id", "nazev", "autor", "rok"];
    expect(chybaCesky("no such column: název", ["knihy"], { sloupce, sql: "SELECT název FROM knihy" })).toContain(
      "napiš nazev místo název",
    );
    expect(chybaCesky("no such column: knihy.název", ["knihy"], { sloupce, sql: "SELECT knihy.název FROM knihy" })).toContain(
      "nazev",
    );
  });

  it("apostrofy radí jen tam, kde má stát hodnota", () => {
    const sloupce = ["id", "nazev", "zanr"];
    expect(chybaCesky("no such column: poezie", ["knihy"], { sloupce, sql: "SELECT nazev FROM knihy WHERE zanr = poezie" })).toContain(
      "apostrof",
    );
    expect(chybaCesky("no such column: nazv", ["knihy"], { sloupce, sql: "SELECT nazv FROM knihy" })).not.toContain("apostrof");
    expect(
      chybaCesky("no such column: Temno", ["knihy"], { sloupce, sql: "INSERT INTO knihy (nazev) VALUES (Temno)" }),
    ).toContain("apostrof");
    expect(chybaCesky("no such column: drama", ["knihy"], { sloupce, sql: "SELECT * FROM knihy WHERE zanr IN ('román', drama)" })).toContain(
      "apostrof",
    );
    // Bez znalosti příkazu zůstává původní rada.
    expect(chybaCesky("no such column: poezie", ["knihy"])).toContain("apostrof");
  });
});

describe("filtr na kartě Prohlížet data", () => {
  it("kus textu hledá obsažený text", () => {
    expect(podminkaFiltru("autor", "Čapek")).toEqual(['"autor" LIKE ?', "%Čapek%"]);
  });

  it("podmínka porovnává, číslo jako číslo", () => {
    expect(podminkaFiltru("rok", ">1900")).toEqual(['"rok" > ?', 1900]);
    expect(podminkaFiltru("rok", "<= 1900")).toEqual(['"rok" <= ?', 1900]);
    expect(podminkaFiltru("zanr", "=drama")).toEqual(['"zanr" = ?', "drama"]);
    expect(podminkaFiltru("rok", "")).toBeNull();
  });
});

describe("sqlTabulky (okno Upravit definici tabulky)", () => {
  it("píše CREATE TABLE jako program, s primárním i cizím klíčem", () => {
    const sql = sqlTabulky("hodnoceni", [
      { nazev: "id", typ: "INTEGER", nn: false, pk: true, ai: false, u: false, vychozi: "", odkaz: "" },
      { nazev: "kniha_id", typ: "INTEGER", nn: false, pk: false, ai: false, u: false, vychozi: "", odkaz: "knihy(id)" },
      { nazev: "hvezdy", typ: "INTEGER", nn: true, pk: false, ai: false, u: false, vychozi: "5", odkaz: "" },
    ]);
    expect(sql).toContain('CREATE TABLE "hodnoceni" (');
    expect(sql).toContain('"hvezdy"\tINTEGER NOT NULL DEFAULT 5');
    expect(sql).toContain('PRIMARY KEY("id")');
    expect(sql).toContain('FOREIGN KEY("kniha_id") REFERENCES "knihy"("id")');
  });
});

describe("vysvětlení k češtině v SQLite", () => {
  it("u LIKE s háčkem vysvětlí, proč 'č%' nenajde Čapka", async () => {
    const { diffMessage } = await import("@/lib/sqlExercise");
    const rows = (v: unknown[][]) => ({ columns: ["a"], values: v });
    const msg = diffMessage(rows([]), rows([[1]]), false, false, {
      zak: "SELECT nazev FROM knihy WHERE autor LIKE 'č%';",
      ref: "SELECT nazev FROM knihy WHERE autor LIKE 'Č%';",
    });
    expect(msg).toContain("bez háčků");
    expect(msg).toContain("skutečný DB Browser");
  });

  it("u řazení s háčky přidá poznámku, bez háčků ne", async () => {
    const { poznamkaKRazeni } = await import("@/lib/dbb/prikazy");
    const s = (v: unknown[][]) => ({ columns: ["autor"], values: v });
    expect(poznamkaKRazeni("SELECT autor FROM knihy ORDER BY autor", s([["Alois"], ["Čapek"]]))).toContain("až za Z");
    expect(poznamkaKRazeni("SELECT autor FROM knihy ORDER BY autor", s([["Alois"], ["Karel"]]))).toBeUndefined();
    expect(poznamkaKRazeni("SELECT autor FROM knihy", s([["Čapek"]]))).toBeUndefined();
  });

  it("tabulkyDotazu najde tabulky za FROM, JOIN, INTO, UPDATE i CREATE TABLE", async () => {
    const { tabulkyDotazu } = await import("@/lib/dbb/prikazy");
    expect(tabulkyDotazu("SELECT * FROM knihy JOIN vypujcky ON 1")).toEqual(["knihy", "vypujcky"]);
    expect(tabulkyDotazu("CREATE TABLE IF NOT EXISTS hodnoceni (id)")).toEqual(["hodnoceni"]);
    expect(tabulkyDotazu("SELECT 1")).toEqual([]);
  });
});

describe("editor při přechodu do jiné lekce", () => {
  it("zakomentuje INSERT, UPDATE i CREATE, SELECT nechá", () => {
    const text = "SELECT * FROM knihy;\nINSERT INTO knihy (id, nazev)\nVALUES (11, 'Bylo nás pět');\nUPDATE knihy SET dostupna = 1 WHERE nazev = 'Kytice';";
    const z = zakomentujZmeny(text);
    expect(z.pocet).toBe(2);
    expect(z.text).toBe(
      "SELECT * FROM knihy;\n-- INSERT INTO knihy (id, nazev)\n-- VALUES (11, 'Bylo nás pět');\n-- UPDATE knihy SET dostupna = 1 WHERE nazev = 'Kytice';",
    );
    // Po zakomentování zbyde jen SELECT – F5 už nic nezmění.
    expect(rozdelPrikazy(z.text).map((p) => p.text)).toEqual(["SELECT * FROM knihy;"]);
  });

  it("bez změn dat text nechá být a znovu nezakomentovává", () => {
    expect(zakomentujZmeny("SELECT 1;\n-- INSERT INTO x VALUES (1);")).toEqual({
      text: "SELECT 1;\n-- INSERT INTO x VALUES (1);",
      pocet: 0,
    });
    const jednou = zakomentujZmeny("CREATE TABLE t (a INTEGER);\n\nDELETE FROM t;").text;
    expect(zakomentujZmeny(jednou).pocet).toBe(0);
    expect(jednou).toBe("-- CREATE TABLE t (a INTEGER);\n\n-- DELETE FROM t;");
  });
});

describe("stav knihovny při vstupu do lekce", () => {
  const zaklad = {
    zmenenaPriNacteni: null,
    vyresenoVRelaci: false,
    odmitnutyOtisk: null,
    temnoVSouboru: "0",
    lekce16Hotova: false,
  };

  it("v lekcích 1–13 se nikdy neptá – i když je knihovna změněná", () => {
    for (let id = 1; id <= 13; id++) expect(coSKnihovnou(id, { ...zaklad, zmenenaPriNacteni: "x" })).toBe("nic");
  });

  it("vlastní změny z téhle relace nevadí, změna z minula ano – jednou", () => {
    expect(coSKnihovnou(14, zaklad)).toBe("nic");
    expect(coSKnihovnou(15, { ...zaklad, zmenenaPriNacteni: "x" })).toBe("zeptat");
    expect(coSKnihovnou(17, { ...zaklad, zmenenaPriNacteni: "x", vyresenoVRelaci: true })).toBe("nic");
    expect(coSKnihovnou(14, { ...zaklad, zmenenaPriNacteni: "x", odmitnutyOtisk: "x" })).toBe("nic");
    expect(coSKnihovnou(18, { ...zaklad, zmenenaPriNacteni: "x" })).toBe("nic");
  });

  it("lekce 16 obnoví potichu, jen když je Temno v souboru dostupné a lekce není hotová", () => {
    expect(coSKnihovnou(16, { ...zaklad, temnoVSouboru: "1" })).toBe("obnovit");
    expect(coSKnihovnou(16, { ...zaklad, temnoVSouboru: "1", lekce16Hotova: true })).toBe("nic");
    expect(coSKnihovnou(16, { ...zaklad, zmenenaPriNacteni: "x" })).toBe("nic");
  });
});

describe("skóre podle hodin", () => {
  it("rozdělí lekce na dotazy 1–13 a program 14–19", () => {
    expect(rozdelSkore([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual({ dotazy: [9, 13], program: [0, 6] });
    expect(rozdelSkore([13, 14, 19, 20])).toEqual({ dotazy: [1, 13], program: [2, 6] });
  });
});
