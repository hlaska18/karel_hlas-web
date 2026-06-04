import fs from "fs";
import path from "path";
import type { Material } from "@/lib/content";

/**
 * Načte materiály ze složek public/materialy/<kurz>/<čísloTématu>/<soubory>.
 * Běží při buildu na serveru (po pushnutí nových souborů Vercel přebuilduje).
 * Díky tomu stačí soubor přetáhnout do správné složky – žádná editace kódu.
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
  if ([".pdf", ".doc", ".docx", ".odt", ".txt", ".rtf", ".xls", ".xlsx", ".csv"].includes(e)) return "doc";
  return "link";
}

export type FolderMaterials = Record<string, Record<number, Material[]>>;

export function getFolderMaterials(): FolderMaterials {
  const out: FolderMaterials = {};

  let courseDirs: string[] = [];
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
    let topicDirs: string[] = [];
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
      const topicIndex = parseInt(m[1], 10) - 1; // složka „4" → index 3
      if (topicIndex < 0) continue;

      const dir = path.join(courseDir, topicDir);
      let files: string[] = [];
      try {
        files = fs
          .readdirSync(dir)
          .filter((f) => !f.startsWith(".") && !/^readme|_tema/i.test(f));
      } catch {
        continue;
      }
      files.sort((a, b) => a.localeCompare(b, "cs"));

      const mats: Material[] = files.map((file) => {
        const ext = path.extname(file);
        const base =
          file.slice(0, file.length - ext.length).replace(/^\d+[\s._-]+/, "").trim() || file;
        const href = `/materialy/${encodeURIComponent(courseId)}/${encodeURIComponent(
          topicDir,
        )}/${encodeURIComponent(file)}`;
        return { label: { cs: base, en: base }, href, kind: kindFromExt(ext) };
      });

      if (mats.length) {
        out[courseId] = out[courseId] ?? {};
        out[courseId][topicIndex] = mats;
      }
    }
  }

  return out;
}
