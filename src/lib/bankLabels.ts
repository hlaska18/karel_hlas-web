import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";

/**
 * Dvojjazyčné popisky pro banku materiálů – čistě klientská data (žádné `fs`/`path`),
 * bezpečné importovat do "use client" komponent (na rozdíl od materials.ts).
 */

/**
 * Pořadí dlaždic v galerii. Nedrží se počtu materiálů ani abecedy, ale
 * INFORMATICKÉHO VZDĚLÁVÁNÍ V RVP 78-42-M/01 (Technické lyceum, revize
 * platná od 1. 9. 2024) a pořadí, ve kterém se jeho obsahové okruhy učí.
 *
 * RVP dělí informatiku do čtyř okruhů. Mapování na dlaždice:
 *
 *   Digitální technologie (1. ročník)
 *     – základní pojmy, hardware a software  → Digitální gramotnost
 *     – operační systém, úložiště, zálohování → Operační systémy
 *     – sítě, internet, bezpečnost zařízení a dat → Internet a bezpečnost
 *   Digitální technologie (2. ročník)
 *     – „aplikační software a jeho využití pro odborné činnosti (např.
 *        textový procesor, tabulkový procesor, software pro tvorbu
 *        prezentací, grafický software…)" → Word, Excel, Grafika a multimédia
 *   Data, informace a modelování (2. ročník)
 *     – digitalizace, modely, strojové učení → Umělá inteligence
 *     – vyhledávání a vizualizace dat, trendy → Power BI
 *   Informační systémy (2. a 4. ročník)
 *     – datový záznam, entita, vazba, SQL → Databáze
 *   Tvorba, testování a provoz softwaru (3. ročník)
 *     – algoritmizace a programování → Python
 *
 * Pozor na jednu věc, kdyby se to někdy překopávalo: kancelářské aplikace ani
 * grafika NEJSOU v RVP samostatné okruhy. Spadají pod Digitální technologie
 * jako „aplikační software", proto stojí až za operačním systémem a sítěmi,
 * ne na začátku.
 */
export const TOOL_ORDER = [
  "Digitální gramotnost",
  "Operační systémy",
  "Internet a bezpečnost",
  "Word",
  "Excel",
  "Grafika a multimédia",
  "Umělá inteligence",
  "Power BI",
  "Databáze",
  "Python",
  "Ostatní",
];

export const TOOL_LABEL: Record<string, { cs: string; en: string }> = {
  "Digitální gramotnost": { cs: "Digitální gramotnost", en: "Digital literacy" },
  "Operační systémy": { cs: "Operační systémy", en: "Operating systems" },
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
  "Operační systémy": "/images/tools/glass/operacni-systemy.png",
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

/** Rozpad jednoho tématu na druhy položek – podklad pro podtitulek dlaždice. */
export type TileCounts = {
  /** Hostované soubory ke stažení. Stejná definice jako v heru, viz níž. */
  soubory: number;
  /** Běží tady na webu: `_nastroj.json` a hotové stránky (laboratoře). */
  nastroje: number;
  /** Odkaz na cizí zdroj – nehostuje se. */
  odkazy: number;
  /** Kolik karet lekcí téma po otevření vykreslí. 0 = nemá je. */
  lekce: number;
};

/**
 * Rozpad podle druhu. `lekce` neumí – ty ví až banka, protože je skládá
 * z `LESSON_CONFIG`, které je vázané na jména složek.
 *
 * `soubory` se schválně počítá jako `!external && !interactive`, tedy STEJNĚ
 * jako `getBankStats` v heru. Když se ty dvě definice rozešly, hlásila
 * mřížka jiný součet než číslo nad ní (dřív 161 proti 152, pak 93 proti 87).
 */
export function countByKind(items: BankItem[]): Omit<TileCounts, "lekce"> {
  let soubory = 0;
  let nastroje = 0;
  let odkazy = 0;
  for (const it of items) {
    if (it.external) odkazy += 1;
    else if (it.interactive) nastroje += 1;
    else soubory += 1;
  }
  return { soubory, nastroje, odkazy };
}

function countLessons(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "lesson" : "lessons"}`;
  const word = n === 1 ? "lekce" : n >= 2 && n <= 4 ? "lekce" : "lekcí";
  return `${n} ${word}`;
}

function countTools(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "in-browser tool" : "in-browser tools"}`;
  const word = n === 1 ? "nástroj" : n >= 2 && n <= 4 ? "nástroje" : "nástrojů";
  return `${n} ${word} v prohlížeči`;
}

/**
 * Podtitulek dlaždice tématu.
 *
 * Dřív tu stál jen počet souborů. To je metrika pro autora („kolik práce
 * tam je"), ne pro učitele, který se ptá „co s tím odučím" – a u Operačních
 * systémů to navíc lhalo: „1 materiál" za celé virtuální Windows s 34 úlohami.
 *
 * NIC SE NEDOPOČÍTÁVÁ ODHADEM. Hodinová dotace v datech není, takže tu není
 * ani „~10 hodin"; počet lekcí je skutečný počet karet, které se po otevření
 * vykreslí. Tvrdit o tématu něco, co se nedá spočítat, je totéž, co web
 * odmítá u AI tipů.
 *
 * NEJVÝŠ DVĚ ČÁSTI. Dlaždice má na `sm` pro text okolo 150 px a název už
 * bere dva řádky; třetí část by se nevešla. Nástroje a odkazy jsou vidět
 * hned po otevření, na obal patří to nejsilnější.
 */
export function tileSubtitle(c: TileCounts, lang: Lang): string {
  if (c.lekce > 0) return `${countLessons(c.lekce, lang)} · ${countMaterials(c.soubory, lang)}`;
  if (c.soubory > 0 && c.odkazy > 0) {
    return `${countMaterials(c.soubory, lang)} · ${countLinks(c.odkazy, lang)}`;
  }
  if (c.soubory > 0) return countMaterials(c.soubory, lang);
  if (c.nastroje > 0) return countTools(c.nastroje, lang);
  if (c.odkazy > 0) return countLinks(c.odkazy, lang);
  return "";
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
