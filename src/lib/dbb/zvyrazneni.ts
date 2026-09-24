/**
 * Obarvení SQL v editoru – klíčová slova, texty v apostrofech, čísla,
 * komentáře a funkce. Skutečný DB Browser SQL barví taky a žákovi to pomáhá
 * víc než vzhled: neukončený apostrof obarví zbytek řádku jako text.
 */

export type Kus = { text: string; trida?: "slovo" | "text" | "cislo" | "komentar" | "funkce" };

const SLOVA = new Set(
  (
    "SELECT FROM WHERE AND OR NOT LIKE IN IS NULL BETWEEN ORDER BY GROUP HAVING ASC DESC LIMIT OFFSET " +
    "DISTINCT AS JOIN INNER LEFT RIGHT OUTER CROSS ON USING UNION ALL EXCEPT INTERSECT CASE WHEN THEN ELSE END " +
    "INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DROP ALTER ADD COLUMN RENAME TO PRIMARY KEY FOREIGN " +
    "REFERENCES UNIQUE CHECK DEFAULT CONSTRAINT INDEX VIEW TRIGGER IF EXISTS INTEGER TEXT REAL BLOB NUMERIC " +
    "AUTOINCREMENT COLLATE NOCASE PRAGMA WITH REPLACE BEGIN COMMIT ROLLBACK TRANSACTION"
  ).split(" "),
);

const FUNKCE = new Set(
  "COUNT SUM AVG MIN MAX ROUND LENGTH UPPER LOWER SUBSTR TRIM ABS COALESCE IFNULL DATE TIME DATETIME STRFTIME RANDOM TOTAL".split(" "),
);

export function zvyrazni(sql: string): Kus[] {
  const kusy: Kus[] = [];
  let i = 0;
  const n = sql.length;
  let obycejny = "";
  const vyprazdni = () => {
    if (obycejny) kusy.push({ text: obycejny });
    obycejny = "";
  };

  while (i < n) {
    const c = sql[i];
    if (c === "-" && sql[i + 1] === "-") {
      vyprazdni();
      const konec = sql.indexOf("\n", i);
      const j = konec === -1 ? n : konec;
      kusy.push({ text: sql.slice(i, j), trida: "komentar" });
      i = j;
    } else if (c === "/" && sql[i + 1] === "*") {
      vyprazdni();
      const konec = sql.indexOf("*/", i + 2);
      const j = konec === -1 ? n : konec + 2;
      kusy.push({ text: sql.slice(i, j), trida: "komentar" });
      i = j;
    } else if (c === "'") {
      vyprazdni();
      let j = i + 1;
      while (j < n) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") j += 2;
          else {
            j++;
            break;
          }
        } else j++;
      }
      kusy.push({ text: sql.slice(i, j), trida: "text" });
      i = j;
    } else if (/[0-9]/.test(c) && !/[A-Za-z0-9_]/.test(sql[i - 1] || "")) {
      vyprazdni();
      let j = i;
      while (j < n && /[0-9.]/.test(sql[j])) j++;
      kusy.push({ text: sql.slice(i, j), trida: "cislo" });
      i = j;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(sql[j])) j++;
      const slovo = sql.slice(i, j);
      const velke = slovo.toUpperCase();
      if (SLOVA.has(velke)) {
        vyprazdni();
        kusy.push({ text: slovo, trida: "slovo" });
      } else if (FUNKCE.has(velke) && sql[j] === "(") {
        vyprazdni();
        kusy.push({ text: slovo, trida: "funkce" });
      } else {
        obycejny += slovo;
      }
      i = j;
    } else {
      obycejny += c;
      i++;
    }
  }
  vyprazdni();
  return kusy;
}
