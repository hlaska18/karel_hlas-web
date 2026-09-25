/**
 * Stáhne bajty jako soubor do skutečného počítače (složka Stažené soubory).
 * Soubor .db jde pak otevřít ve skutečném programu DB Browser for SQLite.
 */
export function stahni(nazev: string, bajty: Uint8Array, typ = "application/vnd.sqlite3"): void {
  // Od TypeScriptu 5.7 je Uint8Array generický a Blob chce jen ArrayBuffer
  // (ne SharedArrayBuffer). Bajty z sql.js jsou vždy obyčejný ArrayBuffer.
  const blob = new Blob([bajty as BlobPart], { type: typ });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nazev;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
