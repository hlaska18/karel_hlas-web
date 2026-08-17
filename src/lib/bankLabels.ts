import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";

/**
 * Dvojjazyčné popisky pro banku materiálů – čistě klientská data (žádné `fs`/`path`),
 * bezpečné importovat do "use client" komponent (na rozdíl od materials.ts).
 */

export const TOOL_LABEL: Record<string, { cs: string; en: string }> = {
  "Digitální gramotnost": { cs: "Digitální gramotnost", en: "Digital literacy" },
  Word: { cs: "Word", en: "Word" },
  Excel: { cs: "Excel", en: "Excel" },
  Python: { cs: "Python", en: "Python" },
  "Grafika a multimédia": { cs: "Grafika a multimédia", en: "Graphics & multimedia" },
  "Internet a bezpečnost": { cs: "Internet a bezpečnost", en: "Internet & online safety" },
  "Umělá inteligence": { cs: "Umělá inteligence", en: "Artificial intelligence" },
  Databáze: { cs: "Databáze", en: "Database" },
  "Power BI": { cs: "Power BI", en: "Power BI" },
  Ostatní: { cs: "Ostatní", en: "Other" },
};

export function toolLabel(tool: string, lang: Lang): string {
  return TOOL_LABEL[tool]?.[lang] ?? tool;
}

/**
 * 3D skleněné ikony témat (Higgsfield, frosted-emerald) s PRŮHLEDNÝM pozadím –
 * „plovoucí" objekt bez rámu. Jedna verze funguje na světlém i tmavém režimu.
 */
export const TOOL_ICON: Record<string, string> = {
  "Digitální gramotnost": "/images/tools/glass/digitalni-gramotnost.png",
  Word: "/images/tools/glass/word.png",
  Excel: "/images/tools/glass/excel.png",
  Python: "/images/tools/glass/python.png",
  "Grafika a multimédia": "/images/tools/glass/grafika-multimedia.png",
  "Internet a bezpečnost": "/images/tools/glass/internet-bezpecnost.png",
  "Umělá inteligence": "/images/tools/glass/umela-inteligence.png",
  Databáze: "/images/tools/glass/databaze.png",
  "Power BI": "/images/tools/glass/powerbi.png",
};

export function countMaterials(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "material" : "materials"}`;
  const word = n === 1 ? "materiál" : n >= 2 && n <= 4 ? "materiály" : "materiálů";
  return `${n} ${word}`;
}

/**
 * Popisek dlaždice, kde nic vlastního není a vede odsud jen odkaz na cizí
 * cvičebnici (Word, Excel, Power BI). Dřív i tyhle dlaždice hlásily
 * „2 materiály“, takže učitel klikl a nenašel nic ke stažení – a součet
 * dlaždic navíc nesouhlasil s číslem v hero, které odkazy nepočítá.
 */
export function countLinks(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "link" : "links"}`;
  const word = n === 1 ? "odkaz" : n >= 2 && n <= 4 ? "odkazy" : "odkazů";
  return `${n} ${word}`;
}

const norm = (s?: string) => (s ?? "").normalize("NFC").toLowerCase();

/**
 * Pravidla v pořadí priority: [regex na obsah, dvojjazyčný štítek].
 *
 * NA POŘADÍ ZÁLEŽÍ. Řešení a klíč musí být NAD testem, jinak dostane
 * „Klíč k testům A a B" štítek „Test" – tedy pravý opak toho, co to je.
 *
 * A pozor na kmeny, které se schovávají uvnitř jiných slov: `/metod/` chytne
 * i „metodou" v názvu „Ověřování zdrojů metodou 5P", což je prezentace pro
 * žáky, ne metodika. Proto se hledá celé slovo.
 */
const TYPE_RULES: [RegExp, { cs: string; en: string }][] = [
  [/řešení|reseni|klíč|klic/, { cs: "Řešení", en: "Solution" }],
  [/test/, { cs: "Test", en: "Test" }],
  [/\bmetodik|\bmetodick/, { cs: "Metodika", en: "Teaching notes" }],
  [/plán hodin|plan hodin/, { cs: "Plán hodiny", en: "Lesson plan" }],
  [/návod|navod/, { cs: "Návod", en: "Guide" }],
  [/pracovní list|pracovni list/, { cs: "Pracovní list", en: "Worksheet" }],
  [/úloh|uloh/, { cs: "Úloha", en: "Exercise" }],
];

/**
 * Typ materiálu odvozený z názvu skupiny/souboru – ale JEN když to skupina
 * (zobrazená vedle názvu) sama neříká už. Cíl: doplnit chybějící kontext
 * (např. test schovaný v obecné složce „Materiály k úlohám"), ne opakovat,
 * co je vidět už v podnadpisu řádku.
 */
export function materialTypeOf(it: BankItem): { cs: string; en: string } | null {
  const g = norm(it.group?.cs);
  const hay = `${g} ${norm(it.label.cs)}`;
  for (const [re, label] of TYPE_RULES) {
    if (re.test(hay)) return re.test(g) ? null : label;
  }
  return null;
}

/**
 * Velikost souboru pro popisek. Česky s desetinnou čárkou („3,2 MB"),
 * anglicky s tečkou. Prázdný řetězec u nulové velikosti.
 */
export function fmtSize(bytes: number, lang: Lang = "cs"): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${lang === "cs" ? mb.replace(".", ",") : mb} MB`;
}
