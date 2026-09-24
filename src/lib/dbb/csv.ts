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
  return { text: text.replace(/^﻿/, ""), kodovani };
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

/** Rozdělí CSV na řádky a buňky (uvozovky, zdvojené uvozovky, zalomení v buňce). */
export function parsujCsv(text: string, oddelovac: Oddelovac): string[][] {
  const radky: string[][] = [];
  let radek: string[] = [];
  let bunka = "";
  let vUvozovkach = false;
  for (let i = 0; i < text.length; i++) {
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
      radek.push(bunka);
      bunka = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      radek.push(bunka);
      radky.push(radek);
      radek = [];
      bunka = "";
    } else {
      bunka += c;
    }
  }
  if (bunka !== "" || radek.length) {
    radek.push(bunka);
    radky.push(radek);
  }
  // Prázdné řádky (i ty z ;;;; na konci Excelu) pryč.
  return radky.filter((r) => r.some((b) => b.trim() !== ""));
}

const bezDiakritiky = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

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

/** Nejvíc řádků z jednoho CSV – víc se do prohlížeče stejně nevejde. */
export const MAX_RADKU_CSV = 5000;
