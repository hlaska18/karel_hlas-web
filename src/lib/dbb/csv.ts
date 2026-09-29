/**
 * Import tabulky z CSV – jako Soubor → Import → Tabulka ze souboru CSV
 * ve skutečném DB Browseru. Karel chtěl nahrávat soubory z opravdového
 * počítače (24. 9. 2026); CSV umí uložit každý Excel, takže si žák nebo
 * učitel přinese vlastní data (známky, docházku, výsledky závodu…).
 *
 * Počítá s tím, co vyrobí Excel na české Windows: oddělovač středník,
 * kódování Windows-1250 a desetinná čárka. Názvy sloupců se upraví bez
 * háčků a mezer, jak je kurz učí psát (jinak by je žák v SQL nenapsal).
 */

export type Oddelovac = ";" | "," | "\t";
export type TypSloupce = "INTEGER" | "REAL" | "TEXT";

/** Text souboru: UTF-8, a když to nejde, Windows-1250 (český Excel). */
export function dekodujText(bajty: Uint8Array): { text: string; kodovani: "UTF-8" | "Windows-1250" } {
  let text: string;
  let kodovani: "UTF-8" | "Windows-1250" = "UTF-8";
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bajty);
  } catch {
    kodovani = "Windows-1250";
    try {
      text = new TextDecoder("windows-1250").decode(bajty);
    } catch {
      // Prohlížeč bez starých kódování: aspoň ASCII projde beze změny.
      text = Array.prototype.map.call(bajty, (b: number) => String.fromCharCode(b)).join("");
    }
  }
  return { text: text.replace(/^\uFEFF/, ""), kodovani };
}

/** Oddělovač podle prvního řádku (mimo uvozovky). */
export function odhadniOddelovac(text: string): Oddelovac {
  const pocty: Record<Oddelovac, number> = { ";": 0, ",": 0, "\t": 0 };
  let vUvozovkach = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') vUvozovkach = !vUvozovkach;
    else if (!vUvozovkach && (c === "\n" || c === "\r")) break;
    else if (!vUvozovkach && (c === ";" || c === "," || c === "\t")) pocty[c]++;
  }
  if (pocty["\t"] > pocty[";"] && pocty["\t"] > pocty[","]) return "\t";
  return pocty[","] > pocty[";"] ? "," : ";";
}

/**
 * Rozdělí CSV na řádky a buňky (uvozovky, zdvojené uvozovky, zalomení v buňce).
 *
 * `maxRadku` a `maxSloupcu` hlídají zlomyslný nebo omylem obří soubor: parsování
 * skončí, jakmile je neprázdných řádků víc než `maxRadku`, a buňky za
 * `maxSloupcu` + 1 se zahodí. Jedna navíc stačí, aby import poznal „moc“ a řekl
 * to – dřív se celá tabulka připravila, než se limit vůbec zkontroloval, a
 * soubor s desetitisíci sloupců zamrazil kartu (Codex 29. 9. 2026).
 */
export function parsujCsv(
  text: string,
  oddelovac: Oddelovac,
  maxRadku = Infinity,
  maxSloupcu = Infinity,
): string[][] {
  const radky: string[][] = [];
  let radek: string[] = [];
  let bunka = "";
  let vUvozovkach = false;
  const pridejBunku = () => {
    if (radek.length <= maxSloupcu) radek.push(bunka);
  };
  const pridejRadek = () => {
    if (radek.some((b) => b.trim() !== "")) radky.push(radek);
  };
  for (let i = 0; i < text.length && radky.length <= maxRadku; i++) {
    const c = text[i];
    if (vUvozovkach) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          bunka += '"';
          i++;
        } else vUvozovkach = false;
      } else bunka += c;
    } else if (c === '"') {
      vUvozovkach = true;
    } else if (c === oddelovac) {
      pridejBunku();
      bunka = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      pridejBunku();
      pridejRadek();
      radek = [];
      bunka = "";
    } else {
      bunka += c;
    }
  }
  if ((bunka !== "" || radek.length) && radky.length <= maxRadku) {
    pridejBunku();
    pridejRadek();
  }
  // Prázdné řádky (i ty z ;;;; na konci Excelu) se nepočítají ani nevracejí.
  return radky;
}

const bezDiakritiky = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Název pro SQL: bez háčků, mezer a zvláštních znaků – „Známka z testu“ → znamka_z_testu. */
export function nazevProSql(text: string, nahradni: string): string {
  let n = bezDiakritiky(text)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!n) n = nahradni;
  if (/^[0-9]/.test(n)) n = `s_${n}`;
  return n.slice(0, 40);
}

const CELE = /^-?\d+$/;
const DESETINNE = /^-?\d+([.,]\d+)?$/;

export type PripravenaTabulka = {
  sloupce: string[];
  typy: TypSloupce[];
  data: (string | number | null)[][];
};

/** Z buněk udělá sloupce, typy a hodnoty připravené k INSERTu. */
export function pripravTabulku(radky: string[][], prvniJeHlavicka: boolean): PripravenaTabulka {
  const sirka = radky.reduce((m, r) => Math.max(m, r.length), 0);
  const hlavicka = prvniJeHlavicka && radky.length ? radky[0] : [];
  const telo = prvniJeHlavicka ? radky.slice(1) : radky;

  const sloupce: string[] = [];
  for (let i = 0; i < sirka; i++) {
    let n = nazevProSql((hlavicka[i] || "").trim(), `sloupec_${i + 1}`);
    let k = 2;
    const zaklad = n;
    while (sloupce.indexOf(n) !== -1) n = `${zaklad}_${k++}`;
    sloupce.push(n);
  }

  const typy: TypSloupce[] = sloupce.map((_, i) => {
    const hodnoty = telo.map((r) => (r[i] || "").trim()).filter((h) => h !== "");
    if (!hodnoty.length) return "TEXT";
    if (hodnoty.every((h) => CELE.test(h))) return "INTEGER";
    if (hodnoty.every((h) => DESETINNE.test(h))) return "REAL";
    return "TEXT";
  });

  const data = telo.map((r) =>
    sloupce.map((_, i) => {
      const h = (r[i] || "").trim();
      if (h === "") return null;
      if (typy[i] === "INTEGER") return Number(h);
      if (typy[i] === "REAL") return Number(h.replace(",", "."));
      return (r[i] || "").trim();
    }),
  );
  return { sloupce, typy, data };
}

const uvoz = (n: string) => `"${n.replace(/"/g, '""')}"`;

export function sqlVytvoreni(nazev: string, t: PripravenaTabulka): string {
  return `CREATE TABLE ${uvoz(nazev)} (${t.sloupce.map((s, i) => `${uvoz(s)} ${t.typy[i]}`).join(", ")});`;
}

export function sqlVlozeni(nazev: string, t: PripravenaTabulka): string {
  return `INSERT INTO ${uvoz(nazev)} (${t.sloupce.map(uvoz).join(", ")}) VALUES (${t.sloupce.map(() => "?").join(", ")});`;
}

/** „1 řádek“, „3 řádky“, „5 řádků“ – do vět o počtu řádků. */
export function radkuCesky(n: number): string {
  return `${n} ${n === 1 ? "řádek" : n >= 2 && n <= 4 ? "řádky" : "řádků"}`;
}

/** Nejvíc řádků z jednoho CSV – víc se do prohlížeče stejně nevejde. */
export const MAX_RADKU_CSV = 5000;

/** Nejvíc sloupců z jednoho CSV – školní tabulka jich má pár, víc je chyba. */
export const MAX_SLOUPCU_CSV = 100;

/* ─────────────────────────────── export ─────────────────────────────── */

export type NastaveniExportu = {
  oddelovac: Oddelovac;
  /** Desetinná čárka místo tečky – český Excel jinak čísla nepozná. */
  desetinnaCarka: boolean;
  /** První řádek s názvy sloupců. */
  hlavicka: boolean;
};

/** Výchozí nastavení pro český Excel: středník, desetinná čárka, hlavička. */
export const EXPORT_PRO_EXCEL: NastaveniExportu = { oddelovac: ";", desetinnaCarka: true, hlavicka: true };

const JAKO_CISLO = /^[-+]?\d+([.,]\d+)?$/;

/**
 * Text, který by Excel po otevření CSV vzal jako vzorec (začíná = + - @,
 * tabulátorem nebo CR), dostane na začátek apostrof – Excel ho pak ukáže jako
 * obyčejný text. Jinak by si žák mohl dát do jména třeba =HYPERLINK(…) a vzorec
 * by se spustil učiteli v přehledu třídy (Codex 29. 9. 2026, OWASP „CSV
 * injection“). Čísla (-5, +420) nechává být, ať zůstanou čísly.
 */
export function bezVzorce(s: string): string {
  if (!/^[=+\-@\t\r]/.test(s) || JAKO_CISLO.test(s)) return s;
  return `'${s}`;
}

/** Tabulka nebo výsledek dotazu jako text CSV (řádky končí CRLF jako z Excelu). */
export function doCsv(sloupce: string[], radky: unknown[][], n: NastaveniExportu): string {
  const bunka = (h: unknown): string => {
    if (h === null || h === undefined || h instanceof Uint8Array) return "";
    const s =
      typeof h === "number"
        ? n.desetinnaCarka && !Number.isInteger(h)
          ? String(h).replace(".", ",")
          : String(h)
        : bezVzorce(String(h));
    const uvozovky = /["\r\n]/.test(s) || s.indexOf(n.oddelovac) !== -1 || /^\s|\s$/.test(s);
    return uvozovky ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const vse: unknown[][] = n.hlavicka ? [sloupce as unknown[]].concat(radky) : radky;
  return vse.map((r) => r.map(bunka).join(n.oddelovac)).join("\r\n") + "\r\n";
}

/** Bajty souboru CSV: UTF-8 s BOM – podle něj Excel pozná češtinu. */
export function csvKeStazeni(text: string): Uint8Array {
  return new TextEncoder().encode(`\uFEFF${text}`);
}
