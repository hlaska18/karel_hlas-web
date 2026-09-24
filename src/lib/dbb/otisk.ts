/**
 * Otisk obsahu databáze – schéma a všechny řádky. Stejný obsah dá stejný
 * otisk, i když se bajty souboru liší (SQLite po zápisu přeskládá stránky).
 *
 * Kurz podle něj pozná, že knihovna.db už není původní – třeba po druhém
 * průchodu nebo po žákovi, který seděl u počítače předtím.
 */

import type { SqlDb } from "@/lib/sqljs";

/** Krátký hash řetězce (djb2) – na porovnání stačí, šifrovat nemusí. */
export function hashRetezce(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${(h >>> 0).toString(36)}-${s.length.toString(36)}`;
}

export function otisk(db: SqlDb): string {
  let text = "";
  const objekty = db.exec(
    "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
  );
  const radky = objekty.length ? objekty[0].values : [];
  for (const [typ, nazev, sql] of radky) {
    text += `${String(sql)}\n`;
    if (typ !== "table") continue;
    const data = db.exec(`SELECT * FROM "${String(nazev).replace(/"/g, '""')}" ORDER BY rowid`);
    if (data.length) text += `${JSON.stringify(data[0].values)}\n`;
  }
  return hashRetezce(text);
}
