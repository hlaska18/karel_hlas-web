import fs from "fs";
import path from "path";
import type { Material, MaterialEntry, Audience } from "@/lib/content";

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

function fileToMaterial(courseId: string, segments: string[], file: string): Material {
  const parts = [courseId, ...segments, file].map((s) => encodeURIComponent(s));
  const href = "/materialy/" + parts.join("/");
  const label = cleanLabel(file);
  return { label: { cs: label, en: enLabel(label) }, href, kind: kindFromExt(path.extname(file)) };
}

const byName = (a: string, b: string) => a.localeCompare(b, "cs", { numeric: true });

/** Rozbalí obsah značkové podsložky (_ucitel/_zaci): soubory → položky, podsložky → skupiny. */
function expandMarkerDir(
  courseId: string,
  topicDir: string,
  markerName: string,
  subDir: string,
  opts: { teacherOnly?: boolean; audience: Audience },
): MaterialEntry[] {
  const result: MaterialEntry[] = [];
  let tents: fs.Dirent[] = [];
  try {
    tents = fs.readdirSync(subDir, { withFileTypes: true }).filter((x) => !isHidden(x.name));
  } catch {
    return result;
  }
  tents.sort((a, b) => byName(a.name, b.name));
  const tag = opts.teacherOnly
    ? { audience: opts.audience, teacherOnly: true }
    : { audience: opts.audience };
  for (const t of tents) {
    if (t.isDirectory()) {
      let gf: string[] = [];
      try {
        gf = fs.readdirSync(path.join(subDir, t.name)).filter((f) => !isHidden(f));
      } catch {
        /* ignore */
      }
      gf.sort(byName);
      const items = gf.map((f) => fileToMaterial(courseId, [topicDir, markerName, t.name], f));
      if (items.length) {
        const gl = displayName(t.name);
        result.push({ label: { cs: gl, en: enLabel(gl) }, items, ...tag });
      }
    } else if (t.isFile()) {
      result.push({ ...fileToMaterial(courseId, [topicDir, markerName], t.name), ...tag });
    }
  }
  return result;
}

export type FolderMaterials = Record<string, Record<number, MaterialEntry[]>>;

export function getFolderMaterials(): FolderMaterials {
  const out: FolderMaterials = {};

  let courseDirs: string[];
  try {
    courseDirs = fs
      .readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return out;
  }

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

      const dir = path.join(courseDir, topicDir);
      let dirents: fs.Dirent[];
      try {
        dirents = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }

      const entries: MaterialEntry[] = [];
      const teacherEntries: MaterialEntry[] = [];
      const sorted = dirents.filter((d) => !isHidden(d.name)).sort((a, b) => byName(a.name, b.name));

      for (const d of sorted) {
        if (d.isDirectory()) {
          const subDir = path.join(dir, d.name);
          let files: string[] = [];
          try {
            files = fs.readdirSync(subDir).filter((f) => !isHidden(f));
          } catch {
            /* ignore */
          }
          files.sort(byName);

          if (isTeacherDir(d.name)) {
            // Učitelská podsložka (jen v učitelském pohledu, odznak „Pro učitele").
            teacherEntries.push(
              ...expandMarkerDir(courseId, topicDir, d.name, subDir, {
                teacherOnly: true,
                audience: "teacher",
              }),
            );
            continue;
          }
          if (isStudentDir(d.name)) {
            // Žákovská podsložka (vidí všichni, odznak „Pro žáky").
            entries.push(
              ...expandMarkerDir(courseId, topicDir, d.name, subDir, { audience: "student" }),
            );
            continue;
          }

          const items = files.map((f) => fileToMaterial(courseId, [topicDir, d.name], f));
          if (items.length) {
            const gl = displayName(d.name);
            entries.push({ label: { cs: gl, en: enLabel(gl) }, items });
          }
        } else if (d.isFile()) {
          entries.push(fileToMaterial(courseId, [topicDir], d.name));
        }
      }

      // Učitelské materiály vždy až za žákovskými.
      const all = [...entries, ...teacherEntries];
      if (all.length) {
        out[courseId] = out[courseId] ?? {};
        out[courseId][topicIndex] = all;
      }
    }
  }

  return out;
}
