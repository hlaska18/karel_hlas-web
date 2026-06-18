import fs from "fs";
import path from "path";
import { COURSES } from "@/lib/content";
import type { Material, Audience } from "@/lib/content";

/**
 * Načte materiály ze složek public/materialy/<kurz>/<čísloTématu>/…
 *  - soubor přímo ve složce tématu  → jednotlivý odkaz
 *  - PODSLOŽKA ve složce tématu      → rozbalovací skupina (název = název složky)
 * Běží při buildu na serveru (po pushnutí nových souborů Vercel přebuilduje).
 */

const ROOT = path.join(process.cwd(), "public", "materialy");

function kindFromExt(ext: string): Material["kind"] {
  const e = ext.toLowerCase();
  if ([".ppt", ".pptx", ".odp", ".key"].includes(e)) return "slides";
  if ([".mp4", ".mov", ".webm", ".m4v", ".avi"].includes(e)) return "video";
  if (
    [".py", ".js", ".ts", ".tsx", ".ipynb", ".html", ".css", ".json", ".zip", ".java", ".c", ".cpp", ".sql"].includes(e)
  )
    return "code";
  if (
    [".pdf", ".doc", ".docx", ".odt", ".txt", ".rtf", ".xls", ".xlsx", ".xlsm", ".csv", ".accdb", ".pbix"].includes(e)
  )
    return "doc";
  return "link";
}

function isHidden(name: string): boolean {
  return name.startsWith(".") || /^_tema|^readme/i.test(name);
}

/** Učitelská podsložka – její obsah se ukáže jen v učitelském pohledu. Konvence: „_ucitel". */
function isTeacherDir(name: string): boolean {
  return /^_?(u[čc]itel|pro[ _]u[čc]itel)/i.test(name);
}

/** Žákovská podsložka – odznak „Pro žáky" (vidí všichni). Konvence: „_zaci". */
function isStudentDir(name: string): boolean {
  return /^_(zaci|zaky|žáci|žáky|zak|student)/i.test(name);
}

/**
 * Zobrazovaný název. Řadicí prefix „1. " / „2) " na začátku se NEzobrazí
 * (slouží jen k pořadí). Podtržítka → mezery. Vnitřní čísla úloh („01_…",
 * „PracL01…") zůstávají, protože nemají tečku/závorku za číslem.
 */
function displayName(name: string): string {
  return name
    .replace(/^\d+[.)]\s+/, "")
    .replace(/_/g, " ")
    .trim();
}

function cleanLabel(file: string): string {
  const ext = path.extname(file);
  return displayName(file.slice(0, file.length - ext.length)) || file;
}

/**
 * Anglické názvy viditelných materiálů/složek (klíč = český zobrazovaný název).
 * Soubory zůstávají pojmenované česky; když název v tabulce není, použije se čeština.
 * Nový materiál → sem doplnit anglický název (jinak se v EN zobrazí česky).
 */
const NAME_EN: Record<string, string> = {
  "Úlohy v Excelu": "Excel exercises",
  "Úlohy ve Wordu": "Word exercises",
  "Excel - materiály k úlohám": "Excel – exercise materials",
  "Word - materiály k úlohám": "Word – exercise materials",
  "Návod na stažení Microsoft365 aplikací": "How to install Microsoft 365 apps",
  PowerBI: "Power BI",
  "Pracovní listy": "Worksheets",
  "Plány hodin": "Lesson plans",
  "Python - pracovní listy": "Python worksheets",
  "Python - metodické listy": "Python teaching notes",
  "Python - testy z minulých let": "Python past tests",
  "Žákovský list": "Student worksheet",
  Metodika: "Teaching methodology",
  "Plán hodiny": "Lesson plan",
};

/** Anglický popisek z tabulky (NFC kvůli macOS NFD názvům); fallback = čeština. */
function enLabel(cs: string): string {
  return NAME_EN[cs.normalize("NFC")] ?? cs;
}

const byName = (a: string, b: string) => a.localeCompare(b, "cs", { numeric: true });

/* ─────────────────────────── BANKA MATERIÁLŮ ───────────────────────────
 * Plochý seznam VŠECH souborů napříč kurzy/tématy + metadata (kurz, téma,
 * typ, velikost, publikum). Slouží stránce /pro-ucitele (vyhledávání + filtry).
 * Běží při buildu na serveru (čte filesystem). */

/** Pořadí „nástrojových" dlaždic v galerii. */
export const TOOL_ORDER = ["Excel", "Word", "Python", "Power BI", "Plány hodin", "Ostatní"];

export type BankItem = {
  href: string;
  label: { cs: string; en: string };
  /** Přípona bez tečky, malými písmeny (např. "docx"). */
  ext: string;
  kind: Material["kind"];
  sizeBytes: number;
  /** Nástroj/dovednost = dlaždice galerie (Excel, Word, Python, Power BI…). */
  tool: string;
  /** Pořadové číslo tématu (1-based) reprezentativního výskytu. */
  topicNo: number;
  /** Název tématu z plánu (COURSES); fallback „Téma N". */
  topicLabel: { cs: string; en: string };
  /** „teacher" = metodika/plány (složka _ucitel); „student" = pro žáky. */
  audience: Audience;
  /** Název podsložky, pokud soubor leží ve skupině. */
  group?: { cs: string; en: string };
  /** Obory 1. ročníku, kde se materiál vyskytuje (po sloučení duplicit). */
  courseIds: string[];
  /** Lidsky čitelný rozsah oborů, např. „1. ročník · všechny obory". */
  coursesLabel: { cs: string; en: string };
};

function topicLabelOf(courseId: string, topicIndex: number): { cs: string; en: string } {
  const item = COURSES.find((x) => x.id === courseId)?.items[topicIndex];
  if (item) return { cs: item.title.cs, en: item.title.en };
  return { cs: `Téma ${topicIndex + 1}`, en: `Topic ${topicIndex + 1}` };
}

/** Odvodí nástroj/dovednost z názvu skupiny + tématu + souboru + přípony. */
function toolOf(hay: string, ext: string): string {
  const h = hay.toLowerCase();
  if (/power\s?bi/.test(h) || ext === "pbix") return "Power BI";
  if (/excel/.test(h) || ["xlsx", "xlsm", "xls", "csv"].includes(ext)) return "Excel";
  if (/word/.test(h) || ["docx", "doc", "odt", "rtf"].includes(ext)) return "Word";
  if (/python/.test(h) || ["py", "ipynb"].includes(ext)) return "Python";
  if (/pl[áa]n/.test(h)) return "Plány hodin";
  return "Ostatní";
}

function coursesLabelOf(courseIds: string[], total: number): { cs: string; en: string } {
  if (total > 0 && courseIds.length >= total) {
    return { cs: "1. ročník · všechny obory", en: "Year 1 · all fields" };
  }
  const cs = courseIds.map((id) => COURSES.find((c) => c.id === id)?.field.cs ?? id).join(", ");
  const en = courseIds.map((id) => COURSES.find((c) => c.id === id)?.field.en ?? id).join(", ");
  return { cs: `1. ročník · ${cs}`, en: `Year 1 · ${en}` };
}

export function getBankItems(): BankItem[] {
  // Sloučení duplicit napříč obory (1L/1S/1P): klíč = nástroj+skupina+název+typ,
  // NE číslo tématu (Excel je v 1L téma 4, v 1S/1P téma 3). Soubory jsou
  // ve sdílených složkách byte-shodné, takže reprezentant = první výskyt.
  const seen = new Map<string, BankItem>();

  let courseDirs: string[];
  try {
    courseDirs = fs
      .readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
  const totalCourses = courseDirs.length;

  for (const courseId of courseDirs) {
    const courseDir = path.join(ROOT, courseId);
    let topicDirs: string[];
    try {
      topicDirs = fs
        .readdirSync(courseDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      continue;
    }

    for (const topicDir of topicDirs) {
      const m = topicDir.match(/^(\d+)/);
      if (!m) continue;
      const topicIndex = parseInt(m[1], 10) - 1;
      if (topicIndex < 0) continue;

      const topicLabel = topicLabelOf(courseId, topicIndex);

      // Rekurzivně projde téma; sleduje publikum (_ucitel → teacher) a skupinu.
      const walk = (
        absDir: string,
        segs: string[],
        audience: Audience,
        group?: { cs: string; en: string },
      ) => {
        let ents: fs.Dirent[] = [];
        try {
          ents = fs.readdirSync(absDir, { withFileTypes: true }).filter((x) => !isHidden(x.name));
        } catch {
          return;
        }
        ents.sort((a, b) => byName(a.name, b.name));
        for (const e of ents) {
          if (e.isDirectory()) {
            let aud = audience;
            let grp = group;
            if (isTeacherDir(e.name)) aud = "teacher";
            else if (isStudentDir(e.name)) aud = "student";
            else {
              const gl = displayName(e.name);
              grp = { cs: gl, en: enLabel(gl) };
            }
            walk(path.join(absDir, e.name), [...segs, e.name], aud, grp);
          } else if (e.isFile()) {
            const file = e.name;
            const ext = path.extname(file).slice(1).toLowerCase();
            const label = cleanLabel(file);
            const tool = toolOf(`${group?.cs ?? ""} ${topicLabel.cs} ${label}`, ext);
            const key = [tool, audience, group?.cs ?? "", label, ext]
              .join("|")
              .normalize("NFC")
              .toLowerCase();

            const existing = seen.get(key);
            if (existing) {
              if (!existing.courseIds.includes(courseId)) existing.courseIds.push(courseId);
              continue;
            }

            const parts = [courseId, ...segs, file].map((s) => encodeURIComponent(s));
            let sizeBytes = 0;
            try {
              sizeBytes = fs.statSync(path.join(absDir, file)).size;
            } catch {
              /* ignore */
            }
            seen.set(key, {
              href: "/materialy/" + parts.join("/"),
              label: { cs: label, en: enLabel(label) },
              ext,
              kind: kindFromExt(path.extname(file)),
              sizeBytes,
              tool,
              topicNo: topicIndex + 1,
              topicLabel,
              audience,
              group,
              courseIds: [courseId],
              coursesLabel: { cs: "", en: "" },
            });
          }
        }
      };

      walk(path.join(courseDir, topicDir), [topicDir], "student");
    }
  }

  const items = [...seen.values()];
  for (const it of items) it.coursesLabel = coursesLabelOf(it.courseIds, totalCourses);

  const order = (t: string) => {
    const i = TOOL_ORDER.indexOf(t);
    return i < 0 ? 99 : i;
  };
  items.sort(
    (a, b) =>
      order(a.tool) - order(b.tool) ||
      a.audience.localeCompare(b.audience) ||
      a.topicNo - b.topicNo ||
      byName(a.label.cs, b.label.cs),
  );
  return items;
}
