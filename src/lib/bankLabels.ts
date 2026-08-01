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
  "Internet a bezpečnost": { cs: "Internet a bezpečnost", en: "Internet & online safety" },
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
  "Internet a bezpečnost": "/images/tools/glass/internet-bezpecnost.png",
  Databáze: "/images/tools/glass/databaze.png",
  "Power BI": "/images/tools/glass/powerbi.png",
};

export function countMaterials(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "material" : "materials"}`;
  const word = n === 1 ? "materiál" : n >= 2 && n <= 4 ? "materiály" : "materiálů";
  return `${n} ${word}`;
}

const norm = (s?: string) => (s ?? "").normalize("NFC").toLowerCase();

/** Pravidla v pořadí priority: [regex na obsah, dvojjazyčný štítek]. */
const TYPE_RULES: [RegExp, { cs: string; en: string }][] = [
  [/test/, { cs: "Test", en: "Test" }],
  [/řešení|reseni/, { cs: "Řešení", en: "Solution" }],
  [/metod/, { cs: "Metodika", en: "Teaching notes" }],
  [/plán hodiny|plan hodiny/, { cs: "Plán hodiny", en: "Lesson plan" }],
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
