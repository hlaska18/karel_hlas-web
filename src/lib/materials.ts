import fs from "fs";
import path from "path";
import type { Material, MaterialEntry } from "@/lib/content";

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
    [".pdf", ".doc", ".docx", ".odt", ".txt", ".rtf", ".xls", ".xlsx", ".xlsm", ".csv", ".accdb"].includes(e)
  )
    return "doc";
  return "link";
}

function isHidden(name: string): boolean {
  return name.startsWith(".") || /^_tema|^readme/i.test(name);
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

function fileToMaterial(courseId: string, segments: string[], file: string): Material {
  const parts = [courseId, ...segments, file].map((s) => encodeURIComponent(s));
  const href = "/materialy/" + parts.join("/");
  const label = cleanLabel(file);
  return { label: { cs: label, en: label }, href, kind: kindFromExt(path.extname(file)) };
}

const byName = (a: string, b: string) => a.localeCompare(b, "cs", { numeric: true });

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
          const items = files.map((f) => fileToMaterial(courseId, [topicDir, d.name], f));
          if (items.length) {
            const gl = displayName(d.name);
            entries.push({ label: { cs: gl, en: gl }, items });
          }
        } else if (d.isFile()) {
          entries.push(fileToMaterial(courseId, [topicDir], d.name));
        }
      }

      if (entries.length) {
        out[courseId] = out[courseId] ?? {};
        out[courseId][topicIndex] = entries;
      }
    }
  }

  return out;
}
