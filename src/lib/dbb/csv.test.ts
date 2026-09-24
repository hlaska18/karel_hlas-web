/**
 * Import CSV: to, co vyrobí Excel na české Windows (středník, Windows-1250,
 * desetinná čárka), i obyčejné CSV s čárkou a uvozovkami.
 */

import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import {
  dekodujText,
  odhadniOddelovac,
  parsujCsv,
  pripravTabulku,
  nazevProSql,
  sqlVytvoreni,
  sqlVlozeni,
} from "@/lib/dbb/csv";

/** Windows-1250 bajty pro pár českých znaků (kvůli testu bez kodéru). */
const CP1250: Record<string, number> = { "á": 0xe1, "č": 0xe8, "é": 0xe9, "ě": 0xec, "í": 0xed, "ř": 0xf8, "š": 0x9a, "ý": 0xfd, "ž": 0x9e, "Ž": 0x8e, "Š": 0x8a };
const vCp1250 = (s: string) => new Uint8Array(Array.prototype.map.call(s, (c: string) => CP1250[c] || c.charCodeAt(0)) as number[]);

describe("CSV z Excelu", () => {
  it("pozná Windows-1250 i UTF-8 s BOM", () => {
    const cp = dekodujText(vCp1250("Jméno;Známka\nŠárka;1\n"));
    expect(cp.kodovani).toBe("Windows-1250");
    expect(cp.text).toBe("Jméno;Známka\nŠárka;1\n");
    const utf = dekodujText(new TextEncoder().encode("﻿Jméno;Známka"));
    expect(utf).toEqual({ text: "Jméno;Známka", kodovani: "UTF-8" });
  });

  it("odhadne oddělovač z prvního řádku", () => {
    expect(odhadniOddelovac("jmeno;trida;znamka\nA;1.A;1")).toBe(";");
    expect(odhadniOddelovac('nazev,autor\n"Máj, báseň",Mácha')).toBe(",");
    expect(odhadniOddelovac("a\tb\tc")).toBe("\t");
    expect(odhadniOddelovac('"a;b",c,d')).toBe(",");
  });

  it("zvládne uvozovky, zdvojené uvozovky, zalomení v buňce a CRLF", () => {
    const text = 'nazev,popis\r\n"Máj, báseň","Řekl ""ahoj""\na odešel"\r\nKytice,\r\n;;\r\n';
    expect(parsujCsv(text, ",")).toEqual([
      ["nazev", "popis"],
      ["Máj, báseň", 'Řekl "ahoj"\na odešel'],
      ["Kytice", ""],
      [";;"],
    ]);
    // Prázdné řádky z Excelu (;;;) zmizí.
    expect(parsujCsv("a;b\n1;2\n;;\n\n", ";")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("názvy sloupců bez háčků a mezer, typy podle hodnot, desetinná čárka", () => {
    const t = pripravTabulku(
      [
        ["Jméno žáka", "Třída", "Známka", "Průměr", "Známka", ""],
        ["Šárka", "1.A", "1", "1,5", "2", "x"],
        ["Petr", "1.B", "", "2", "3", ""],
      ],
      true,
    );
    expect(t.sloupce).toEqual(["jmeno_zaka", "trida", "znamka", "prumer", "znamka_2", "sloupec_6"]);
    expect(t.typy).toEqual(["TEXT", "TEXT", "INTEGER", "REAL", "INTEGER", "TEXT"]);
    expect(t.data).toEqual([
      ["Šárka", "1.A", 1, 1.5, 2, "x"],
      ["Petr", "1.B", null, 2, 3, null],
    ]);
    expect(nazevProSql("2024 výsledky", "t")).toBe("s_2024_vysledky");
    expect(nazevProSql("!!!", "tabulka")).toBe("tabulka");
  });

  it("bez hlavičky pojmenuje sloupce sloupec_1…", () => {
    const t = pripravTabulku([["a", "1"], ["b", "2"]], false);
    expect(t.sloupce).toEqual(["sloupec_1", "sloupec_2"]);
    expect(t.data.length).toBe(2);
  });

  it("vytvořená tabulka jde naplnit a číst ve skutečném SQLite", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const t = pripravTabulku(parsujCsv("Jméno;Body\nŠárka;12,5\nPetr;8\n", ";"), true);
    db.run(sqlVytvoreni("vysledky", t));
    t.data.forEach((r) => db.run(sqlVlozeni("vysledky", t), r));
    const r = db.exec("SELECT jmeno, body FROM vysledky ORDER BY body DESC");
    expect(r[0].values).toEqual([
      ["Šárka", 12.5],
      ["Petr", 8],
    ]);
    db.close();
  });
});
