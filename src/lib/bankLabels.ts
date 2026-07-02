import type { Lang } from "@/lib/content";

/**
 * Dvojjazyčné popisky pro banku materiálů – čistě klientská data (žádné `fs`/`path`),
 * bezpečné importovat do "use client" komponent (na rozdíl od materials.ts).
 */

export const TOOL_LABEL: Record<string, { cs: string; en: string }> = {
  "Digitální gramotnost": { cs: "Digitální gramotnost", en: "Digital literacy" },
  Word: { cs: "Word", en: "Word" },
  Excel: { cs: "Excel", en: "Excel" },
  Python: { cs: "Python", en: "Python" },
  Databáze: { cs: "Databáze", en: "Database" },
  "Power BI": { cs: "Power BI", en: "Power BI" },
  Ostatní: { cs: "Ostatní", en: "Other" },
};

export function toolLabel(tool: string, lang: Lang): string {
  return TOOL_LABEL[tool]?.[lang] ?? tool;
}

export function countMaterials(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "material" : "materials"}`;
  const word = n === 1 ? "materiál" : n >= 2 && n <= 4 ? "materiály" : "materiálů";
  return `${n} ${word}`;
}
