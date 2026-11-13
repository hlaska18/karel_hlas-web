/**
 * Opravy po testu DBLABu na ostrém webu 13. 11. 2026 – rady u chyb a výsledků,
 * kontrola, která šla obejít opsaným výsledkem, a useknuté kódy v Přehledu.
 * Nad skutečným SQLite (sql.js), hlášky jsou z něj, ne vymyšlené.
 */

import { beforeAll, describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { SCHEMA, diffMessage, opisujeVysledek, sqlErrorCs } from "@/lib/sqlExercise";
import { chybaCesky, radaKPoradi, tabulkyVDotazu } from "@/lib/dbb/chyby";
import { DETEKTIVKA, DILNA } from "@/lib/dbb/sady";
import { vyhodnotDotaz } from "@/lib/dbb/kontrola";
import { KURZ, SADY, type UkolKurzu } from "@/lib/dbb/kurz";
import { zakoduj, najdiKody, nenacteneKody, type Postup } from "@/lib/dbb/kodPostupu";
import { poznamkaKNicNezmenil, rozdelPrikazy, spust } from "@/lib/dbb/prikazy";
import type { SqlDb, SqlDbSoubor, SqlResult } from "@/lib/sqljs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SQL: any;
beforeAll(async () => {
  SQL = await initSqlJs();
});

const cista = (schema: string): SqlDb => {
  const db = new SQL.Database();
  db.run(schema);
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
};

/** Hláška SQLite pro příkaz nad databází. */
const chyba = (db: SqlDb, sql: string): string => {
  try {
    db.exec(sql);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error(`Příkaz prošel: ${sql}`);
};

const posledni = (db: SqlDb, sql: string): SqlResult => {
  const r = db.exec(sql);
  return r.length ? r[r.length - 1] : { columns: [], values: [] };
};

/** Rada k dotazu žáka proti referenci nad čistou databází. */
const rada = (schema: string, zak: string, ref: string) => {
  const a = cista(schema);
  const b = cista(schema);
  try {
    return diffMessage(posledni(a, zak), posledni(b, ref), /order\s+by/i.test(ref), false, { zak, ref });
  } finally {
    a.close();
    b.close();
  }
};

describe("české hlášky u chyb", () => {
  it("desetinná čárka v INSERTu", () => {
    const db = cista(DILNA.schema);
    const sql = "INSERT INTO dily (id, nazev, material, hmotnost_kg, cena, skladem) VALUES (11, 'Pružina', 'ocel', 0,05, 12, 200);";
    const raw = chyba(db, sql);
    expect(raw).toMatch(/7 values for 6 columns/);
    expect(chybaCesky(raw, [], { sql })).toMatch(/s tečkou: 0\.05/);
    // Bez seznamu sloupců hlásí SQLite jinou větu.
    const raw2 = chyba(db, "INSERT INTO dily VALUES (11, 'Pružina', 'ocel', 0,05, 12, 200);");
    expect(chybaCesky(raw2, [], { sql: "INSERT INTO dily VALUES (11, 'Pružina', 'ocel', 0,05, 12, 200);" })).toMatch(/s tečkou/);
    // Čárka v textu („Novák, Jan“) není desetinná – jen obecná rada o počtu.
    const sql3 = "INSERT INTO dodavatele (id, nazev) VALUES (9, 'Novák, Jan', 'navíc');";
    const raw3 = chyba(db, sql3);
    expect(chybaCesky(raw3, [], { sql: sql3 })).toMatch(/Ke každému sloupci patří právě jedna hodnota/);
    expect(sqlErrorCs(raw)).not.toBe(raw);
    db.close();
  });

  it("DELETE, na který odkazuje cizí klíč (lekce 13)", () => {
    const db = cista(SCHEMA);
    const priklad = "DELETE FROM ctenari WHERE trida = '1.B';";
    expect(chybaCesky(chyba(db, priklad), [], { sql: priklad })).toMatch(/odkazuje tabulka vypujcky/);
    const vse = "DELETE FROM knihy;";
    const text = chybaCesky(chyba(db, vse), [], { sql: vse });
    expect(text).toMatch(/Bez WHERE bys smazal\(a\) celou tabulku knihy/);
    expect(text).toMatch(/nesmazala nic/);
    db.close();
  });

  it("foreign key mismatch", () => {
    const db = cista("CREATE TABLE studia (id INTEGER PRIMARY KEY, nazev TEXT); CREATE TABLE tituly (id INTEGER PRIMARY KEY, studio TEXT REFERENCES studia(nazev));");
    const sql = "INSERT INTO tituly VALUES (1, 'Pixar');";
    const raw = chyba(db, sql);
    expect(raw).toMatch(/foreign key mismatch/);
    const text = chybaCesky(raw, [], { sql });
    expect(text).toMatch(/v tabulce tituly ukazuje do tabulky studia/);
    expect(text).toMatch(/REFERENCES studia\(id\)/);
    db.close();
  });

  it("pořadí částí dotazu a druhé WHERE", () => {
    const db = cista(SCHEMA);
    const poradi = "SELECT nazev FROM knihy ORDER BY rok WHERE rok > 1900;";
    expect(chybaCesky(chyba(db, poradi), [], { sql: poradi })).toMatch(/^WHERE patří před ORDER BY/);
    const dve = "SELECT nazev FROM knihy WHERE rok > 1900 WHERE zanr = 'román';";
    expect(chybaCesky(chyba(db, dve), [], { sql: dve })).toMatch(/jen jedno WHERE/);
    const skupina = "SELECT zanr, COUNT(*) FROM knihy ORDER BY zanr GROUP BY zanr;";
    expect(chybaCesky(chyba(db, skupina), [], { sql: skupina })).toMatch(/^GROUP BY patří před ORDER BY/);
    // Jiný překlep zůstává u obecné rady.
    expect(radaKPoradi("FORM", "SELECT * FORM knihy")).toBeNull();
    db.close();
  });

  it("nejednoznačný sloupec radí tabulkou z dotazu, ne knihami", () => {
    const db = cista(DETEKTIVKA.schema);
    const sql = "SELECT jmeno, cas FROM osoby JOIN pruchody ON pruchody.cip = osoby.cip WHERE cip = 'C08';";
    const text = chybaCesky(chyba(db, sql), [], { sql });
    expect(text).toMatch(/například osoby\.cip/);
    expect(tabulkyVDotazu("SELECT 'from x' FROM a JOIN b ON 1")).toEqual(["a", "b"]);
    db.close();
  });
});

describe("rady u výsledku", () => {
  it("GROUP BY podle jiného sloupce a chybějící GROUP BY", () => {
    const ref = "SELECT zanr, COUNT(*) FROM knihy GROUP BY zanr;";
    expect(rada(SCHEMA, "SELECT autor, COUNT(*) FROM knihy GROUP BY autor;", ref)).toMatch(/Seskupuješ podle jiného sloupce/);
    expect(rada(SCHEMA, "SELECT zanr, COUNT(*) FROM knihy;", ref)).toMatch(/chybí ti GROUP BY/);
  });

  it("JOIN přes špatný klíč", () => {
    const ref = "SELECT ctenari.jmeno, vypujcky.datum_vypujcky FROM vypujcky JOIN ctenari ON vypujcky.ctenar_id = ctenari.id;";
    const zak = "SELECT ctenari.jmeno, vypujcky.datum_vypujcky FROM vypujcky JOIN ctenari ON vypujcky.id = ctenari.id;";
    expect(rada(SCHEMA, zak, ref)).toMatch(/podmínku za ON/);
    // Aliasy a prohozené strany jsou v pořádku – rada o ON se neukáže.
    const a = DILNA.schema;
    const refA = "SELECT objednavky.datum, dily.nazev FROM objednavky JOIN dily ON dily.id = objednavky.dil_id;";
    expect(rada(a, "SELECT o.datum, d.nazev FROM objednavky o JOIN dily d ON o.dil_id = d.id WHERE d.id > 3;", refA)).not.toMatch(/podmínku za ON/);
  });

  it("háčky a čárky, LIKE bez %, datum a velká písmena", () => {
    expect(rada(SCHEMA, "SELECT nazev FROM knihy WHERE zanr = 'roman';", "SELECT nazev FROM knihy WHERE zanr = 'román';")).toMatch(/háčky a čárky: 'roman'/);
    expect(rada(SCHEMA, "SELECT nazev FROM knihy WHERE autor LIKE 'Karel';", "SELECT nazev FROM knihy WHERE autor LIKE 'Karel%';")).toMatch(/LIKE bez % hledá přesnou shodu/);
    expect(rada(SCHEMA, "SELECT * FROM vypujcky WHERE datum_vypujcky = '5. 9. 2026';", "SELECT * FROM vypujcky WHERE datum_vypujcky = '2026-09-05';")).toMatch(/rok-měsíc-den/);
    expect(rada(SCHEMA, "SELECT nazev FROM knihy WHERE zanr = 'Román';", "SELECT nazev FROM knihy WHERE zanr = 'román';")).toMatch(/velká písmena – 'Román'/);
    const d = DETEKTIVKA.schema;
    expect(
      rada(d, "SELECT * FROM pruchody WHERE dvere = 'vychod';", "SELECT * FROM pruchody WHERE dvere = 'východ';"),
    ).toMatch(/háčky a čárky/);
  });

  it("počet řádků bez rodu a UPDATE bez WHERE", () => {
    expect(rada(SCHEMA, "SELECT nazev FROM knihy WHERE rok > 1800;", "SELECT nazev FROM knihy WHERE rok > 1900;")).toMatch(/^Tvůj dotaz vrátil/);
    const a = cista(SCHEMA);
    const b = cista(SCHEMA);
    a.exec("UPDATE knihy SET dostupna = 1;");
    b.exec("UPDATE knihy SET dostupna = 1 WHERE nazev = 'Kytice';");
    const check = "SELECT nazev, dostupna FROM knihy ORDER BY nazev;";
    const text = diffMessage(posledni(a, check), posledni(b, check), true, true, {
      zak: "UPDATE knihy SET dostupna = 1;",
      ref: "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Kytice';",
    });
    expect(text).toMatch(/UPDATE nemá WHERE/);
    a.close();
    b.close();
  });

  it("UPDATE, který nezasáhl žádný řádek, dostane poznámku", () => {
    const db = cista(DILNA.schema);
    const sql = "UPDATE dily SET cena = 690 WHERE nazev = 'Priruba';";
    const beh = spust(db as SqlDbSoubor, rozdelPrikazy(sql));
    expect(beh.ok).toBe(true);
    expect(poznamkaKNicNezmenil(sql, beh.zmenenoRadku)).toMatch(/nezměnil ani jeden řádek/);
    expect(poznamkaKNicNezmenil("UPDATE dily SET cena = 1;", 0)).toBeUndefined();
    db.close();
  });
});

describe("výsledek opsaný bez tabulky se nepočítá", () => {
  const zkus = (ukol: UkolKurzu, schema: string, soubor: string, text: string) => {
    const db = cista(schema);
    const beh = spust(db as SqlDbSoubor, rozdelPrikazy(text));
    const h = vyhodnotDotaz(
      ukol,
      { text, vysledek: beh.vysledek, soubor, menilData: false, konciCtenim: true },
      { cista, ziva: db },
    );
    db.close();
    return h;
  };

  it("SELECT 10; v lekci 6 a jméno pachatele v detektivce", () => {
    const u6 = KURZ.find((l) => l.id === 6)!.ukoly[0];
    expect(zkus(u6, SCHEMA, "knihovna.db", "SELECT COUNT(*) FROM knihy;")!.ok).toBe(true);
    const h = zkus(u6, SCHEMA, "knihovna.db", "SELECT 10;");
    expect(h!.ok).toBe(false);
    expect(h!.proc).toMatch(/nečte z tabulky/);

    const det = SADY.map((s) => s.lekce).find((l) => l.databaze === DETEKTIVKA)!;
    const posledniUkol = det.ukoly[det.ukoly.length - 1];
    const vrah = zkus(posledniUkol, DETEKTIVKA.schema, DETEKTIVKA.soubor, posledniUkol.reseni!);
    expect(vrah!.ok).toBe(true);
    const jmeno = String(
      posledni(cista(DETEKTIVKA.schema), posledniUkol.reseni!).values[0][0],
    );
    expect(zkus(posledniUkol, DETEKTIVKA.schema, DETEKTIVKA.soubor, `SELECT '${jmeno}';`)!.ok).toBe(false);
    expect(opisujeVysledek("SELECT 'from' AS x;", "SELECT 1 FROM knihy")).toBe(true);
  });
});

describe("useknutý kód v Přehledu třídy", () => {
  it("najde ho a řekne jméno ze zprávy", () => {
    const p: Postup = { jmeno: "Eva Malá", datum: "2026-11-13", hotove: [1, 2], sede: [], navic: 0 } as Postup;
    const kod = zakoduj(p);
    const useknuty = kod.slice(0, Math.floor(kod.length / 2));
    const vlakno = [
      `Eva Malá · Dotazy 2/13 · Program 0/6 · ${kod}`,
      `Petr Novák · Dotazy 5/13 · Program 0/6 · ${useknuty}`,
      "Bez jména:",
      "SQLKURZ1-",
    ].join("\n");
    expect(najdiKody(vlakno)).toHaveLength(1);
    expect(nenacteneKody(vlakno)).toEqual(["Petr Novák", ""]);
    expect(nenacteneKody(`Eva Malá · ${kod}`)).toEqual([]);
  });
});
