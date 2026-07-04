"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Link2,
  Check,
} from "lucide-react";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import Image from "next/image";
import { toolLabel, countMaterials, materialTypeOf, TOOL_ICON } from "@/lib/bankLabels";

/** Rozhraní UI textů banky (CZ/EN). */
const STR: Record<
  Lang,
  {
    searchPlaceholder: string;
    back: string;
    searchResults: string;
    empty: string;
    teacherBadge: string;
    studentBadge: string;
    previewTitle: string;
    downloadTitle: string;
    openNewTab: string;
    close: string;
    lesson: string;
    shareLesson: string;
    expandLesson: string;
    collapseLesson: string;
  }
> = {
  cs: {
    searchPlaceholder: "Hledat materiál, téma, nástroj…",
    back: "Zpět na témata",
    searchResults: "Výsledky hledání: ",
    empty: "Nic neodpovídá. Zkus jiné slovo nebo se vrať na témata.",
    teacherBadge: "učitelé",
    studentBadge: "žáci",
    previewTitle: "Náhled",
    downloadTitle: "Stáhnout",
    openNewTab: "Otevřít v nové záložce",
    close: "Zavřít",
    lesson: "Lekce",
    shareLesson: "Sdílet odkaz na lekci",
    expandLesson: "Rozbalit lekci",
    collapseLesson: "Sbalit lekci",
  },
  en: {
    searchPlaceholder: "Search material, topic, tool…",
    back: "Back to topics",
    searchResults: "Search results: ",
    empty: "Nothing matches. Try another word or go back to topics.",
    teacherBadge: "teachers",
    studentBadge: "students",
    previewTitle: "Preview",
    downloadTitle: "Download",
    openNewTab: "Open in new tab",
    close: "Close",
    lesson: "Lesson",
    shareLesson: "Share lesson link",
    expandLesson: "Expand lesson",
    collapseLesson: "Collapse lesson",
  },
};

/** Vezme lokalizované pole {cs,en} (nebo prázdný řetězec, když chybí). */
function L(field: { cs: string; en: string } | undefined, lang: Lang): string {
  return field ? field[lang] : "";
}

/** Typy, které umíme spolehlivě zobrazit přímo (bez cizí služby). */
const IMG = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const FRAME = ["pdf", "txt", "csv"];
function canPreview(ext: string): boolean {
  return IMG.includes(ext) || FRAME.includes(ext);
}

/** Sloučí přípony do přátelské kategorie (odznak typu u řádku). */
function fileType(ext: string, lang: Lang): { key: string; label: string } {
  const cs: Record<string, string> = {
    word: "Word",
    excel: "Excel",
    pdf: "PDF",
    ppt: "Prezentace",
    powerbi: "Power BI",
    code: "Kód",
    video: "Video",
    image: "Obrázek",
    access: "Access",
    text: "Text",
  };
  const en: Record<string, string> = {
    word: "Word",
    excel: "Excel",
    pdf: "PDF",
    ppt: "Slides",
    powerbi: "Power BI",
    code: "Code",
    video: "Video",
    image: "Image",
    access: "Access",
    text: "Text",
  };
  let key = ext || "other";
  if (["docx", "doc", "odt", "rtf"].includes(ext)) key = "word";
  else if (["xlsx", "xls", "xlsm", "csv"].includes(ext)) key = "excel";
  else if (ext === "pdf") key = "pdf";
  else if (["pptx", "ppt", "odp"].includes(ext)) key = "ppt";
  else if (ext === "pbix") key = "powerbi";
  else if (["py", "ipynb", "js", "ts", "html", "css", "json", "sql", "java", "c", "cpp", "zip"].includes(ext))
    key = "code";
  else if (["mp4", "mov", "webm", "m4v", "avi"].includes(ext)) key = "video";
  else if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) key = "image";
  else if (ext === "accdb") key = "access";
  else if (ext === "txt") key = "text";
  const table = lang === "en" ? en : cs;
  return { key, label: table[key] ?? (ext || (lang === "en" ? "file" : "soubor")).toUpperCase() };
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

export function BankBrowser({ items, lang }: { items: BankItem[]; lang: Lang }) {
  const s = STR[lang];
  const [q, setQ] = useState("");
  const [tool, setTool] = useState<string | null>(null);
  const [openLesson, setOpenLesson] = useState<number | null>(null);
  const [preview, setPreview] = useState<BankItem | null>(null);

  // Proklik z homepage dlaždice: ?tema=Excel rovnou otevře obor.
  // Sdílený odkaz na lekci: ...&lekce=5 navíc tu lekci rovnou rozbalí a odscrolluje k ní.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tema");
      if (t && items.some((it) => it.tool === t)) setTool(t);
      const l = params.get("lekce");
      if (l != null && /^\d+$/.test(l)) setOpenLesson(parseInt(l, 10));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Dlaždice nástrojů + počty. Položky chodí ze serveru seřazené dle TOOL_ORDER,
  // takže pořadí prvního výskytu v Map = správné pořadí dlaždic.
  const tiles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) counts.set(it.tool, (counts.get(it.tool) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [items]);

  // Výsledky podle režimu: hledání > vybraná dlaždice > nic.
  // Pozn.: žádný filtr publika (žák/učitel) — u balíčků lekcí by odfiltroval
  // polovinu páru (list + metodika) a rozbil kartu. Publikum je jen informační
  // odznak u řádku (MaterialRow), učitel chce vidět obojí najednou.
  const needle = stripDia(q.trim());
  const results = useMemo(() => {
    let base = items;
    if (needle) {
      base = base.filter((it) =>
        stripDia(
          [
            it.label.cs,
            it.label.en,
            it.topicLabel.cs,
            it.topicLabel.en,
            it.group?.cs ?? "",
            it.group?.en ?? "",
            it.tool,
            toolLabel(it.tool, lang),
            it.coursesLabel.cs,
            it.coursesLabel.en,
            it.ext,
          ].join(" "),
        ).includes(needle),
      );
    } else if (tool) {
      base = base.filter((it) => it.tool === tool);
    }
    return base;
  }, [items, needle, tool, lang]);

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
          placeholder={s.searchPlaceholder}
          className="glass-soft w-full rounded-2xl py-3.5 pl-12 pr-4 text-base text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 dark:text-zinc-100"
        />
      </div>

      {/* ── Galerie dlaždic (když se nehledá a není vybraná dlaždice) ── */}
      {!showList && (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {tiles.map((t) => {
            const iconSrc = TOOL_ICON[t.name];
            const Icon = toolIcon(t.name);
            return (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => setTool(t.name)}
                  className="glass group flex w-full flex-col items-start gap-3 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15"
                >
                  {iconSrc ? (
                    <Image
                      src={iconSrc}
                      alt=""
                      width={112}
                      height={112}
                      className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/20 transition duration-300 group-hover:scale-105 group-hover:ring-accent-500/40 dark:ring-white/10"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600 transition group-hover:bg-accent-600 group-hover:text-white dark:text-accent-300">
                      <Icon className="h-6 w-6" />
                    </span>
                  )}
                  <span className="font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {toolLabel(t.name, lang)}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {countMaterials(t.count, lang)}
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
                <ArrowLeft className="h-4 w-4" /> {s.back}
              </button>
            )}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {needle ? s.searchResults : tool ? `${toolLabel(tool, lang)}: ` : ""}
              {countMaterials(results.length, lang)}
            </p>
          </div>

          {tool && LESSON_CONFIG[tool] && !needle ? (
            <ToolLessons
              tool={tool}
              items={results}
              lang={lang}
              openLesson={openLesson}
              onPreview={setPreview}
            />
          ) : (
            <ul className="mt-4 space-y-2.5">
              {results.map((it) => (
                <MaterialRow key={it.href} it={it} lang={lang} onPreview={setPreview} />
              ))}
            </ul>
          )}

          {results.length === 0 && (
            <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">{s.empty}</p>
          )}
        </>
      )}

      {preview && <PreviewModal item={preview} lang={lang} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** Jeden řádek materiálu (typ, název, publikum, velikost, náhled, stažení). */
function MaterialRow({
  it,
  lang,
  onPreview,
}: {
  it: BankItem;
  lang: Lang;
  onPreview: (it: BankItem) => void;
}) {
  const s = STR[lang];
  const t = fileType(it.ext, lang);
  const previewable = canPreview(it.ext);
  const label = L(it.label, lang);
  const materialType = materialTypeOf(it);
  return (
    <li className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:shadow-lg hover:shadow-accent-600/15 sm:gap-4 sm:py-3.5">
      <span className="flex w-16 shrink-0 justify-center">
        <span className="rounded-lg bg-accent-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
          {t.label}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-zinc-900 dark:text-white">{label}</span>
        <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">
          {materialType && <span className="text-zinc-400 dark:text-zinc-500">{materialType[lang]} · </span>}
          {L(it.topicLabel, lang)}
          {it.group ? ` · ${L(it.group, lang)}` : ""}
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
        {it.audience === "teacher" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <GraduationCap className="h-3.5 w-3.5" /> {s.teacherBadge}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-300">
            <Users className="h-3.5 w-3.5" /> {s.studentBadge}
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
          title={s.previewTitle}
          aria-label={`${s.previewTitle}: ${label}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400"
        >
          <Eye className="h-5 w-5" />
        </button>
      )}
      <a
        href={it.href}
        download
        title={s.downloadTitle}
        aria-label={`${s.downloadTitle}: ${label}`}
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
  studentLabel: { cs: string; en: string };
  teacherLabel: { cs: string; en: string };
};

const LESSON_CONFIG: Record<string, LessonConfig> = {
  Python: {
    studentGroups: ["Python - pracovní listy"],
    teacherGroups: ["Python - metodické listy"],
    studentLabel: { cs: "Pracovní list", en: "Worksheet" },
    teacherLabel: { cs: "Metodika", en: "Teaching notes" },
  },
  "Digitální gramotnost": {
    studentGroups: ["Pracovní listy"],
    teacherNoGroup: true,
    studentLabel: { cs: "Pracovní list", en: "Worksheet" },
    teacherLabel: { cs: "Plán hodiny", en: "Lesson plan" },
  },
  "Power BI": {
    studentGroups: ["Úlohy"],
    teacherGroups: ["Řešení"],
    studentLabel: { cs: "Úloha", en: "Exercise" },
    teacherLabel: { cs: "Řešení", en: "Solution" },
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
  lang,
  openLesson,
  onPreview,
}: {
  tool: string;
  items: BankItem[];
  lang: Lang;
  openLesson: number | null;
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
        <LessonCard
          key={l.no}
          no={l.no}
          items={l.items}
          cfg={cfg}
          tool={tool}
          lang={lang}
          autoOpen={l.no === openLesson}
          onPreview={onPreview}
        />
      ))}
      {extras.length > 0 && (
        <ul className="space-y-2.5 pt-1">
          {extras.map((it) => (
            <MaterialRow key={it.href} it={it} lang={lang} onPreview={onPreview} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Odstraní kódové prefixy („PracL01 - ", „01_") a slovní přípony (plán hodiny, řešení…). */
function cleanTitle(raw: string): string {
  let s = raw;
  s = s.replace(/\s*[-–]?\s*(plán hodiny|metodika|řešení|reseni|lesson plan|worksheet|solution)\s*$/i, "");
  s = s.replace(/^[A-Za-zÁ-Žá-ž]*\d+\s*[-–_]?\s*/, "");
  s = s.replace(/_/g, " ").replace(/\s{2,}/g, " ").trim();
  return s;
}

/** Vytáhne název lekce z názvů souborů v balíčku (bere nejdelší/nejpopisnější shodu). */
function lessonTitle(items: BankItem[], lang: Lang): string {
  const candidates = items.map((it) => cleanTitle(L(it.label, lang))).filter(Boolean);
  if (!candidates.length) return "";
  candidates.sort((a, b) => b.length - a.length);
  const t = candidates[0];
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function LessonCard({
  no,
  items,
  cfg,
  tool,
  lang,
  autoOpen,
  onPreview,
}: {
  no: number;
  items: BankItem[];
  cfg: LessonConfig;
  tool: string;
  lang: Lang;
  autoOpen: boolean;
  onPreview: (it: BankItem) => void;
}) {
  const s = STR[lang];
  const [open, setOpen] = useState(autoOpen);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasStudent = items.some((it) => isStudentSlot(it, cfg));
  const hasTeacher = items.some((it) => isTeacherSlot(it, cfg));
  const title = lessonTitle(items, lang);
  const num = String(no).padStart(2, "0");

  // Otevření ze sdíleného odkazu (?tema=...&lekce=N) — odscroluj k ní jednou po načtení.
  useEffect(() => {
    if (autoOpen) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tema", tool);
      url.searchParams.set("lekce", String(no));
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard nemusí být dostupný (chybějící oprávnění) */
    }
  };

  return (
    <div ref={ref} className="glass rounded-2xl">
      <div className="flex items-center gap-1 px-2.5 py-2 sm:px-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1.5 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 font-display text-sm font-bold text-accent-700 dark:text-accent-300">
            {num}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-zinc-900 dark:text-white">
              {s.lesson} {num}
              {title ? ` · ${title}` : ""}
            </span>
            <span className="mt-1 flex flex-wrap gap-1.5">
              {hasStudent && <SlotTag kind="student">{L(cfg.studentLabel, lang)}</SlotTag>}
              {hasTeacher && <SlotTag kind="teacher">{L(cfg.teacherLabel, lang)}</SlotTag>}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          title={s.shareLesson}
          aria-label={`${s.shareLesson} ${num}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400"
        >
          {copied ? <Check className="h-4 w-4 text-accent-600 dark:text-accent-400" /> : <Link2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? s.collapseLesson : s.expandLesson}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <ul className="space-y-2 px-3 pb-3">
          {items.map((it) => (
            <MaterialRow key={it.href} it={it} lang={lang} onPreview={onPreview} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PreviewModal({
  item,
  lang,
  onClose,
}: {
  item: BankItem;
  lang: Lang;
  onClose: () => void;
}) {
  const s = STR[lang];
  const isImg = IMG.includes(item.ext);
  const label = L(item.label, lang);

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
      aria-label={`${s.previewTitle}: ${label}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-3.5 dark:border-white/10">
          <p className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-white">{label}</p>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title={s.openNewTab}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-accent-500/10 hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-400"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
          <a
            href={item.href}
            download
            title={s.downloadTitle}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-500"
          >
            <Download className="h-4 w-4" /> {s.downloadTitle}
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label={s.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-white/40 p-3 dark:bg-black/20">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.href} alt={label} className="max-h-[78vh] max-w-full object-contain" />
          ) : (
            <iframe src={item.href} title={label} className="h-[78vh] w-full rounded-xl border-0 bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}
