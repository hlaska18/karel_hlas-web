/**
 * Export databáze do souboru SQL – jako Soubor → Export → Databáze do
 * souboru SQL ve skutečném DB Browseru. Skript jde zpátky nahrát přes
 * Importovat databázi ze SQL, nebo otevřít ve skutečném programu.
 */

import type { SqlDb } from "@/lib/sqljs";

const uvoz = (n: string) => `"${n.replace(/"/g, '""')}"`;

function hodnota(h: unknown): string {
  if (h === null || h === undefined) return "NULL";
  if (typeof h === "number") return String(h);
  if (h instanceof Uint8Array) {
    let hex = "";
    for (let i = 0; i < h.length; i++) hex += (h[i] < 16 ? "0" : "") + h[i].toString(16);
    return `X'${hex}'`;
  }
  return `'${String(h).replace(/'/g, "''")}'`;
}

/** Celá databáze jako skript SQL: tabulky s daty, pak indexy, pohledy a spouštěče. */
export function sqlSkript(db: SqlDb): string {
  const radky = ["PRAGMA foreign_keys = OFF;", "BEGIN TRANSACTION;"];
  const objekty = db.exec(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' " +
      "ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 WHEN 'view' THEN 2 ELSE 3 END, rowid",
  );
  (objekty.length ? objekty[0].values : []).forEach(([typ, nazev, sql]) => {
    radky.push(`${String(sql)};`);
    if (typ !== "table") return;
    const data = db.exec(`SELECT * FROM ${uvoz(String(nazev))}`);
    (data.length ? data[0].values : []).forEach((r) => {
      radky.push(`INSERT INTO ${uvoz(String(nazev))} VALUES (${r.map(hodnota).join(", ")});`);
    });
  });
  radky.push("COMMIT;");
  return `${radky.join("\n")}\n`;
}
