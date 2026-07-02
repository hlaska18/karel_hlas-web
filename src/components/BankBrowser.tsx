"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  GraduationCap,
  Users,
  X,
  Eye,
  ExternalLink,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  FileCode2,
  BarChart3,
  Database,
  Laptop,
  Files,
  ChevronDown,
} from "lucide-react";
import type { BankItem } from "@/lib/materials";

/** Typy, které umíme spolehlivě zobrazit přímo (bez cizí služby). */
const IMG = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const FRAME = ["pdf", "txt", "csv"];
function canPreview(ext: string): boolean {
  return IMG.includes(ext) || FRAME.includes(ext);
}

/** Sloučí přípony do přátelské kategorie (odznak typu u řádku). */
function fileType(ext: string): { key: string; label: string } {
  if (["docx", "doc", "odt", "rtf"].includes(ext)) return { key: "word", label: "Word" };
  if (["xlsx", "xls", "xlsm", "csv"].includes(ext)) return { key: "excel", label: "Excel" };
  if (ext === "pdf") return { key: "pdf", label: "PDF" };
  if (["pptx", "ppt", "odp"].includes(ext)) return { key: "ppt", label: "Prezentace" };
  if (ext === "pbix") return { key: "powerbi", label: "Power BI" };
  if (["py", "ipynb", "js", "ts", "html", "css", "json", "sql", "java", "c", "cpp", "zip"].includes(ext))
    return { key: "code", label: "Kód" };
  if (["mp4", "mov", "webm", "m4v", "avi"].includes(ext)) return { key: "video", label: "Video" };
  if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return { key: "image", label: "Obrázek" };
  if (ext === "accdb") return { key: "access", label: "Access" };
  if (ext === "txt") return { key: "text", label: "Text" };
  return { key: ext || "other", label: (ext || "soubor").toUpperCase() };
}

function toolIcon(tool: string) {
  switch (tool) {
    case "Excel":
      return FileSpreadsheet;
    case "Word":
      return FileText;
    case "Python":
      return FileCode2;
    case "Power BI":
      return BarChart3;
    case "Databáze":
      return Database;
    case "Digitální gramotnost":
      return Laptop;
    default:
      return Files;
  }
}

function fmtSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const stripDia = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function BankBrowser({ items }: { items: BankItem[] }) {
  const [q, setQ] = useState("");
  const [tool, setTool] = useState<string | null>(null);
  const [audience, setAudience] = useState<"" | "student" | "teacher">("");
  const [preview, setPreview] = useState<BankItem | null>(null);

  // Proklik z homepage dlaždice: /pro-ucitele?tema=Excel rovnou otevře obor.
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tema");
      if (t && items.some((it) => it.tool === t)) setTool(t);
    } catch {
      /* ignore */
    }
  }, [items]);

  // Filtr publika se aplikuje všude (dlaždice i seznam).
  const byAudience = useMemo(
    () => (audience ? items.filter((it) => it.audience === audience) : items),
    [items, audience],
  );

  // Dlaždice nástrojů + počty. Položky chodí ze serveru seřazené dle TOOL_ORDER,
  // takže pořadí prvního výskytu v Map = správné pořadí dlaždic.
  const tiles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of byAudience) counts.set(it.tool, (counts.get(it.tool) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [byAudience]);

  // Výsledky podle režimu: hledání > vybraná dlaždice > nic.
  const needle = stripDia(q.trim());
  const results = useMemo(() => {
    let base = byAudience;
    if (needle) {
      base = base.filter((it) =>
        stripDia(
          [it.label.cs, it.topicLabel.cs, it.group?.cs ?? "", it.tool, it.coursesLabel.cs, it.ext].join(" "),
        ).includes(needle),
      );
    } else if (tool) {
      base = base.filter((it) => it.tool === tool);
    }
    return base;
  }, [byAudience, needle, tool]);

  const showList = needle !== "" || tool !== null;

  return (
    <div>
      {/* Vyhledávání */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hledat materiál, téma, nástroj…"
          className="glass-soft w-full rounded-2xl py-3.5 pl-12 pr-4 text-base text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 dark:text-zinc-100"
        />
      </div>

      {/* Filtr publika */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full glass-soft text-sm font-medium">
          <AudBtn active={audience === ""} onClick={() => setAudience("")}>
            Vše
          </AudBtn>
          <AudBtn active={audience === "student"} onClick={() => setAudience("student")}>
            <Users className="h-4 w-4" /> Pro žáky
          </AudBtn>
          <AudBtn active={audience === "teacher"} onClick={() => setAudience("teacher")}>
            <GraduationCap className="h-4 w-4" /> Pro učitele
          </AudBtn>
        </div>
      </div>

      {/* ── Galerie dlaždic (když se nehledá a není vybraná dlaždice) ── */}
      {!showList && (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {tiles.map((t) => {
            const Icon = toolIcon(t.name);
            return (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => setTool(t.name)}
                  className="glass group flex w-full flex-col items-start gap-3 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600 transition group-hover:bg-accent-600 group-hover:text-white dark:text-accent-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {t.name}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t.count} {t.count === 1 ? "materiál" : t.count <= 4 ? "materiály" : "materiálů"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Seznam materiálů (hledání nebo vybraná dlaždice) ── */}
      {showList && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {tool && !needle && (
              <button
                type="button"
                onClick={() => setTool(null)}
                className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200 dark:hover:text-accent-400"
              >
                <ArrowLeft className="h-4 w-4" /> Zpět na témata
              </button>
            )}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {needle ? "Výsledky hledání: " : tool ? `${tool}: ` : ""}
              {results.length}{" "}
              {results.length === 1 ? "materiál" : results.length >= 2 && results.length <= 4 ? "materiály" : "materiálů"}
            </p>
          </div>

          {tool && LESSON_CONFIG[tool] && !needle ? (
            <ToolLessons tool={tool} items={results} onPreview={setPreview} />
          ) : (
            <ul className="mt-4 space-y-2.5">
              {results.map((it) => (
                <MaterialRow key={it.href} it={it} onPreview={setPreview} />
              ))}
            </ul>
          )}

          {results.length === 0 && (
            <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">
              Nic neodpovídá. Zkus jiné slovo nebo se vrať na témata.
            </p>
          )}
        </>
      )}

      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** Jeden řádek materiálu (typ, název, publikum, velikost, náhled, stažení). */
function MaterialRow({ it, onPreview }: { it: BankItem; onPreview: (it: BankItem) => void }) {
  const t = fileType(it.ext);
  const previewable = canPreview(it.ext);
  return (
    <li className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:shadow-lg hover:shadow-accent-600/15 sm:gap-4 sm:py-3.5">
      <span className="flex w-16 shrink-0 justify-center">
        <span className="rounded-lg bg-accent-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
          {t.label}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-zinc-900 dark:text-white">{it.label.cs}</span>
        <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">
          {it.topicLabel.cs}
          {it.group ? ` · ${it.group.cs}` : ""}
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
        {it.audience === "teacher" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <GraduationCap className="h-3.5 w-3.5" /> učitelé
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-300">
            <Users className="h-3.5 w-3.5" /> žáci
          </span>
        )}
      </span>
      <span className="hidden w-14 shrink-0 text-right text-xs text-zinc-400 md:block">
        {fmtSize(it.sizeBytes)}
      </span>
      {previewable && (
        <button
          type="button"
          onClick={() => onPreview(it)}
          title="Náhled"
          aria-label={`Náhled: ${it.label.cs}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400"
        >
          <Eye className="h-5 w-5" />
        </button>
      )}
      <a
        href={it.href}
        download
        title="Stáhnout"
        aria-label={`Stáhnout: ${it.label.cs}`}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400"
      >
        <Download className="h-5 w-5" />
      </a>
    </li>
  );
}

// macOS ukládá názvy v NFD (rozložená diakritika); porovnáváme přes NFC.
const norm = (s?: string) => (s ?? "").normalize("NFC");

/** Konfigurace „balíčků lekcí" po oboru: které skupiny tvoří žákovský/učitelský slot. */
type LessonConfig = {
  studentGroups: string[];
  teacherGroups?: string[];
  /** Učitelské soubory bez podsložky (leží přímo v _ucitel), např. volné plány hodin. */
  teacherNoGroup?: boolean;
  studentLabel: string;
  teacherLabel: string;
};

const LESSON_CONFIG: Record<string, LessonConfig> = {
  Python: {
    studentGroups: ["Python - pracovní listy"],
    teacherGroups: ["Python - metodické listy"],
    studentLabel: "Pracovní list",
    teacherLabel: "Metodika",
  },
  "Digitální gramotnost": {
    studentGroups: ["Pracovní listy"],
    teacherNoGroup: true,
    studentLabel: "Pracovní list",
    teacherLabel: "Plán hodiny",
  },
  "Power BI": {
    studentGroups: ["Úlohy"],
    teacherGroups: ["Řešení"],
    studentLabel: "Úloha",
    teacherLabel: "Řešení",
  },
};

function matchesGroup(it: BankItem, names: string[]): boolean {
  const g = norm(it.group?.cs);
  return names.some((n) => g === norm(n));
}
function isStudentSlot(it: BankItem, cfg: LessonConfig): boolean {
  return matchesGroup(it, cfg.studentGroups);
}
function isTeacherSlot(it: BankItem, cfg: LessonConfig): boolean {
  if (cfg.teacherGroups && matchesGroup(it, cfg.teacherGroups)) return true;
  if (cfg.teacherNoGroup && it.audience === "teacher" && !it.group) return true;
  return false;
}

function SlotTag({ kind, children }: { kind: "student" | "teacher"; children: React.ReactNode }) {
  const cls =
    kind === "teacher"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "bg-accent-500/10 text-accent-700 dark:text-accent-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

/** „Balíčky lekcí": materiály oboru seskupené do karet (žákovský list + učitelská část). */
function ToolLessons({
  tool,
  items,
  onPreview,
}: {
  tool: string;
  items: BankItem[];
  onPreview: (it: BankItem) => void;
}) {
  const cfg = LESSON_CONFIG[tool];
  const { lessons, extras } = useMemo(() => {
    const map = new Map<number, BankItem[]>();
    const rest: BankItem[] = [];
    for (const it of items) {
      if ((isStudentSlot(it, cfg) || isTeacherSlot(it, cfg)) && it.lessonNo != null) {
        const arr = map.get(it.lessonNo) ?? [];
        arr.push(it);
        map.set(it.lessonNo, arr);
      } else {
        rest.push(it);
      }
    }
    const lessonsArr = [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([no, its]) => ({ no, items: its }));
    return { lessons: lessonsArr, extras: rest };
  }, [items, cfg]);

  return (
    <div className="mt-4 space-y-2.5">
      {lessons.map((l) => (
        <LessonCard key={l.no} no={l.no} items={l.items} cfg={cfg} onPreview={onPreview} />
      ))}
      {extras.length > 0 && (
        <ul className="space-y-2.5 pt-1">
          {extras.map((it) => (
            <MaterialRow key={it.href} it={it} onPreview={onPreview} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Odstraní kódové prefixy („PracL01 - ", „01_") a slovní přípony (plán hodiny, řešení…). */
function cleanTitle(raw: string): string {
  let s = raw;
  s = s.replace(/\s*[-–]?\s*(plán hodiny|metodika|řešení|reseni)\s*$/i, "");
  s = s.replace(/^[A-Za-zÁ-Žá-ž]*\d+\s*[-–_]?\s*/, "");
  s = s.replace(/_/g, " ").replace(/\s{2,}/g, " ").trim();
  return s;
}

/** Vytáhne název lekce z názvů souborů v balíčku (bere nejdelší/nejpopisnější shodu). */
function lessonTitle(items: BankItem[]): string {
  const candidates = items.map((it) => cleanTitle(it.label.cs)).filter(Boolean);
  if (!candidates.length) return "";
  candidates.sort((a, b) => b.length - a.length);
  const t = candidates[0];
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function LessonCard({
  no,
  items,
  cfg,
  onPreview,
}: {
  no: number;
  items: BankItem[];
  cfg: LessonConfig;
  onPreview: (it: BankItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasStudent = items.some((it) => isStudentSlot(it, cfg));
  const hasTeacher = items.some((it) => isTeacherSlot(it, cfg));
  const title = lessonTitle(items);
  const num = String(no).padStart(2, "0");

  return (
    <div className="glass rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 font-display text-sm font-bold text-accent-700 dark:text-accent-300">
          {num}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-zinc-900 dark:text-white">
            Lekce {num}
            {title ? ` · ${title}` : ""}
          </span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {hasStudent && <SlotTag kind="student">{cfg.studentLabel}</SlotTag>}
            {hasTeacher && <SlotTag kind="teacher">{cfg.teacherLabel}</SlotTag>}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="space-y-2 px-3 pb-3">
          {items.map((it) => (
            <MaterialRow key={it.href} it={it} onPreview={onPreview} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PreviewModal({ item, onClose }: { item: BankItem; onClose: () => void }) {
  const isImg = IMG.includes(item.ext);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Náhled: ${item.label.cs}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-3.5 dark:border-white/10">
          <p className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-white">
            {item.label.cs}
          </p>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title="Otevřít v nové záložce"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-accent-500/10 hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-400"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
          <a
            href={item.href}
            download
            title="Stáhnout"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-500"
          >
            <Download className="h-4 w-4" /> Stáhnout
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-white/40 p-3 dark:bg-black/20">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.href} alt={item.label.cs} className="max-h-[78vh] max-w-full object-contain" />
          ) : (
            <iframe
              src={item.href}
              title={item.label.cs}
              className="h-[78vh] w-full rounded-xl border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AudBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 transition ${
        active
          ? "bg-accent-600 text-white"
          : "text-zinc-600 hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-400"
      }`}
    >
      {children}
    </button>
  );
}
