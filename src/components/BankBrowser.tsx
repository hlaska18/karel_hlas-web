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
  FileArchive,
  Presentation,
  ImageIcon,
  ShieldCheck,
  Sparkles,
  Folder,
  FolderOpen,
  BarChart3,
  Database,
  Laptop,
  Files,
  ChevronDown,
  Link2,
  Check,
  Play,
  Loader2,
} from "lucide-react";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import { toolLabel, countMaterials, materialTypeOf, fmtSize } from "@/lib/bankLabels";
import { ToolGlassIcon, hasToolGlassIcon } from "@/components/ToolGlassIcon";

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
    teacherFolder: string;
    studentFolder: string;
    expandFolder: string;
    collapseFolder: string;
    sourceBadge: string;
    sourceNote: string;
    sourceNoteOffline: string;
    openSource: string;
    tryOnline: string;
    tryOnlineCta: string;
    docxLoading: string;
    docxError: string;
    pptxLoading: string;
    pptxError: string;
    pptxNote: string;
    pptxSlide: string;
    pptxNotes: string;
    codeLoading: string;
    codeError: string;
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
    teacherFolder: "Pro učitele",
    studentFolder: "Pro žáky",
    expandFolder: "Otevřít složku",
    collapseFolder: "Zavřít složku",
    sourceBadge: "zdroj",
    sourceNote: "Převzatý materiál – otevři u původního zdroje",
    sourceNoteOffline: "Materiál třetí strany – zde není ke stažení",
    openSource: "Otevřít u zdroje",
    tryOnline: "Projdi si interaktivní kurz SQL přímo v prohlížeči – nic se neinstaluje.",
    tryOnlineCta: "Spustit kurz",
    docxLoading: "Načítám náhled dokumentu…",
    docxError: "Náhled se nepodařilo vykreslit – stáhni si dokument tlačítkem výše.",
    pptxLoading: "Načítám prezentaci…",
    pptxError: "Prezentaci se nepodařilo přečíst – stáhni si ji tlačítkem výše.",
    pptxNote: "Textový přehled snímků. Obrázky a rozvržení uvidíš po stažení.",
    pptxSlide: "Snímek",
    pptxNotes: "Poznámky pro vyučujícího",
    codeLoading: "Načítám náhled kódu…",
    codeError: "Náhled kódu se nepodařilo vykreslit – stáhni si soubor tlačítkem výše.",
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
    teacherFolder: "For teachers",
    studentFolder: "For students",
    expandFolder: "Open folder",
    collapseFolder: "Close folder",
    sourceBadge: "source",
    sourceNote: "Third-party material – open at the original source",
    sourceNoteOffline: "Third-party material – not available here",
    openSource: "Open at source",
    // Kurz je zatím jen česky – ať to anglický návštěvník ví předem, ne až po kliknutí.
    tryOnline:
      "Take the interactive SQL course right in your browser – nothing to install. The course itself is in Czech.",
    tryOnlineCta: "Start the course",
    docxLoading: "Loading document preview…",
    docxError: "Preview failed to render – use the download button above.",
    pptxLoading: "Loading presentation…",
    pptxError: "Could not read the presentation – use the download button above.",
    pptxNote: "Text overview of the slides. Images and layout appear after download.",
    pptxSlide: "Slide",
    pptxNotes: "Speaker notes",
    codeLoading: "Loading code preview…",
    codeError: "Code preview failed to render – use the download button above.",
  },
};

/** Témata s interaktivním cvičením na webu (odkaz se ukáže po otevření dlaždice). */
const TOOL_INTERACTIVE: Record<string, string> = {
  Databáze: "/sql",
};

/** Vezme lokalizované pole {cs,en} (nebo prázdný řetězec, když chybí). */
function L(field: { cs: string; en: string } | undefined, lang: Lang): string {
  return field ? field[lang] : "";
}

/** Typy, které umíme spolehlivě zobrazit přímo (bez cizí služby). */
const IMG = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
/** PDF ukážeme v <iframe> (prohlížeč má vestavěný prohlížeč PDF). */
const PDF = ["pdf"];
/** Prostý text: stáhneme a vypíšeme do <pre> (iframe s text/plain se na mobilu nevykreslí). */
const TEXT = ["txt", "csv"];
/** Word: vykreslujeme client-side přes docx-preview (jen moderní .docx, ne starý .doc). */
const DOCX = ["docx"];
/** Zdrojový kód: obarvíme přes highlight.js (lazy z CDN) a vypíšeme do <pre>. */
const CODE = ["py", "sql", "js", "ts", "tsx", "jsx", "json", "html", "css", "java", "c", "cpp", "sh", "xml"];
/** PowerPoint: vypíšeme text snímků a poznámky (viz `pptxPreview`). */
const PPTX = ["pptx"];
/**
 * Otevře prohlížeč tenhle typ přímo v záložce? U .docx, .pptx nebo .zip ne –
 * jen se stáhnou, takže tlačítko „Otevřít v nové záložce" by dělalo totéž
 * co „Stáhnout" a v hlavičce náhledu by byla dvě tlačítka s jedním účinkem.
 */
function opensInBrowser(ext: string): boolean {
  return PDF.includes(ext) || IMG.includes(ext) || ["txt", "csv", "html"].includes(ext);
}

function canPreview(ext: string): boolean {
  return (
    IMG.includes(ext) ||
    PDF.includes(ext) ||
    TEXT.includes(ext) ||
    DOCX.includes(ext) ||
    PPTX.includes(ext) ||
    CODE.includes(ext)
  );
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
    zip: "Archiv",
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
    zip: "Archive",
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
  else if (ext === "zip") key = "zip";
  else if (["py", "ipynb", "js", "ts", "html", "css", "json", "sql", "java", "c", "cpp"].includes(ext))
    key = "code";
  else if (["mp4", "mov", "webm", "m4v", "avi"].includes(ext)) key = "video";
  else if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) key = "image";
  else if (ext === "accdb") key = "access";
  else if (ext === "txt") key = "text";
  const table = lang === "en" ? en : cs;
  return { key, label: table[key] ?? (ext || (lang === "en" ? "file" : "soubor")).toUpperCase() };
}

/** Ikona ke štítku typu souboru (klíč z `fileType`). */
function typeIcon(key: string) {
  switch (key) {
    case "excel":
      return FileSpreadsheet;
    case "ppt":
      return Presentation;
    case "zip":
      return FileArchive;
    case "code":
      return FileCode2;
    case "image":
      return ImageIcon;
    case "powerbi":
      return BarChart3;
    case "access":
      return Database;
    default:
      return FileText;
  }
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
    case "Internet a bezpečnost":
      return ShieldCheck;
    case "Umělá inteligence":
      return Sparkles;
    default:
      return Files;
  }
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
  // Pozn.: žádný filtr publika (žák/učitel) – u balíčků lekcí by odfiltroval
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

  // Složkový pohled má smysl až od pár souborů a od dvou složek výš; u dvou
  // materiálů ve dvou složkách by přidal jen dvě kliknutí navíc. Při hledání
  // se negrupuje – tam chce člověk vidět všechny shody naráz.
  const showFolders = useMemo(
    () => needle === "" && tool !== null && foldersWorthIt(results),
    [needle, tool, results],
  );

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
            const Icon = toolIcon(t.name);
            return (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => setTool(t.name)}
                  className="glass group flex h-full w-full flex-col items-center gap-2 overflow-hidden rounded-2xl p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15 sm:flex-row sm:items-center sm:gap-3 sm:p-5 sm:text-left"
                >
                  {/* Text: na mobilu pod ikonou (přes celou šířku), na desktopu vlevo */}
                  <span className="order-2 flex min-w-0 flex-col gap-0.5 sm:order-1 sm:flex-1 sm:gap-1">
                    <span className="font-display text-base font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-lg">
                      {toolLabel(t.name, lang)}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                      {countMaterials(t.count, lang)}
                    </span>
                  </span>
                  {/* Velká „plovoucí" ikona: na mobilu nahoře menší, na desktopu vyplní pravou část */}
                  <span className="order-1 flex aspect-square w-20 shrink-0 items-center justify-center sm:order-2 sm:w-[46%] sm:max-w-[9.5rem]">
                    {hasToolGlassIcon(t.name) ? (
                      <ToolGlassIcon tool={t.name} className="h-full w-full object-contain" />
                    ) : (
                      <Icon className="h-12 w-12 text-accent-500 transition group-hover:scale-105 sm:h-14 sm:w-14" />
                    )}
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

          {/* Interaktivní cvičení k tématu (např. Databáze → /sql) */}
          {tool && !needle && TOOL_INTERACTIVE[tool] && (
            <a
              href={TOOL_INTERACTIVE[tool]}
              className="glass-accent group mt-4 flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white shadow-lg shadow-accent-600/30">
                  <Play className="h-5 w-5" />
                </span>
                <span className="font-medium text-zinc-900 dark:text-white">{s.tryOnline}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent-700 dark:text-accent-300">
                {s.tryOnlineCta}
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          )}

          {tool && LESSON_CONFIG[tool] && !needle ? (
            <ToolLessons
              tool={tool}
              items={results}
              lang={lang}
              openLesson={openLesson}
              onPreview={setPreview}
            />
          ) : showFolders ? (
            <ToolFolders items={results} lang={lang} onPreview={setPreview} />
          ) : (
            <ul className="mt-4 space-y-2.5">
              {results.map((it) => (
                <MaterialRow key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}`} it={it} lang={lang} onPreview={setPreview} />
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
  const label = L(it.label, lang);

  // Převzatý materiál se nehostuje. S URL → odkaz na originál; bez URL → jen
  // informační atribuce (materiál třetí strany, nedostupný zde).
  if (it.external) {
    const hasLink = Boolean(it.href);
    const inner = (
      <>
        <span className="flex w-[5.25rem] shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            <ExternalLink className="h-4 w-4 shrink-0" />
            {s.sourceBadge}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-zinc-900 dark:text-white">{label}</span>
          {/* Vlastní vysvětlivka ze `_zdroj.json` má přednost před obecnou větou –
              u dvojice učebnice + cvičné soubory je potřeba říct, že patří k sobě. */}
          <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
            {it.sourceNote
              ? L(it.sourceNote, lang)
              : `${hasLink ? s.sourceNote : s.sourceNoteOffline}${it.group ? ` · ${L(it.group, lang)}` : ""}`}
          </span>
        </span>
        {hasLink && (
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-accent-700 transition group-hover:bg-accent-500/10 dark:text-accent-300">
            {s.openSource}
            <ExternalLink className="h-4 w-4" />
          </span>
        )}
      </>
    );
    const cls =
      "glass flex items-center gap-3 rounded-2xl px-4 py-3 sm:gap-4 sm:py-3.5" +
      (hasLink ? " group transition hover:shadow-lg hover:shadow-accent-600/15" : "");
    return (
      <li>
        {hasLink ? (
          <a href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>
            {inner}
          </a>
        ) : (
          <div className={cls}>{inner}</div>
        )}
      </li>
    );
  }

  const t = fileType(it.ext, lang);
  const previewable = canPreview(it.ext);
  const materialType = materialTypeOf(it);
  const TypeIcon = typeIcon(t.key);
  return (
    <li className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:shadow-lg hover:shadow-accent-600/15 sm:gap-4 sm:py-3.5">
      <span className="flex w-[5.25rem] shrink-0">
        <span
          title={t.label}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300"
        >
          <TypeIcon className="h-4 w-4 shrink-0" />
          {it.ext}
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
      {/* Odznak jen u vyhraněných materiálů. „both" (většina) ho nemá – tvrdit
          u průvodce pro učitele „žáci" nedávalo smysl. */}
      {it.audience !== "both" && (
        <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
          {it.audience === "teacher" ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <GraduationCap className="h-3.5 w-3.5" /> {s.teacherBadge}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-300">
              <Users className="h-3.5 w-3.5" /> {s.studentBadge}
            </span>
          )}
        </span>
      )}
      <span className="hidden w-14 shrink-0 text-right text-xs text-zinc-400 md:block">
        {fmtSize(it.sizeBytes, lang)}
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
  /**
   * Odstín druhého štítku. „teacher" (výchozí) = jantarový, tedy „metodika,
   * nedávej žákům". U balíčků, kde je druhý slot prezentace do hodiny, se
   * hodí neutrální zelená – prezentace není tajná.
   */
  teacherTone?: "teacher" | "neutral";
  /** Učitelské soubory bez podsložky (leží přímo v _ucitel), např. volné plány hodin. */
  teacherNoGroup?: boolean;
  studentLabel: { cs: string; en: string };
  teacherLabel: { cs: string; en: string };
};

const LESSON_CONFIG: Record<string, LessonConfig> = {
  "Digitální gramotnost": {
    studentGroups: ["Pracovní listy"],
    teacherNoGroup: true,
    studentLabel: { cs: "Pracovní list", en: "Worksheet" },
    teacherLabel: { cs: "Plán hodiny", en: "Lesson plan" },
  },
  "Internet a bezpečnost": {
    studentGroups: ["Podklady k aktivitám"],
    teacherGroups: ["Prezentace k hodinám"],
    teacherTone: "neutral",
    studentLabel: { cs: "Podklad", en: "Activity file" },
    teacherLabel: { cs: "Prezentace", en: "Slides" },
  },
  "Umělá inteligence": {
    studentGroups: ["Podklady k aktivitám"],
    teacherGroups: ["Prezentace k hodinám"],
    teacherTone: "neutral",
    studentLabel: { cs: "Podklad", en: "Activity file" },
    teacherLabel: { cs: "Prezentace", en: "Slides" },
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

function SlotTag({
  kind,
  children,
}: {
  kind: "student" | "teacher" | "neutral";
  children: React.ReactNode;
}) {
  const cls =
    kind === "teacher"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "bg-accent-500/10 text-accent-700 dark:text-accent-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${cls}`}>
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
  const { lessons, intro, extras } = useMemo(() => {
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
    // Volné soubory v kořeni tématu (typicky „Začněte zde") patří NAD lekce –
    // je to rozcestník, kterým má člověk začít, ne dodatek na konci.
    return {
      lessons: lessonsArr,
      intro: rest.filter((it) => !it.group && it.audience === "both"),
      extras: rest.filter((it) => it.group || it.audience !== "both"),
    };
  }, [items, cfg]);

  return (
    <div className="mt-4 space-y-2.5">
      {intro.length > 0 && (
        <ul className="space-y-2.5">
          {intro.map((it) => (
            <MaterialRow
              key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}`}
              it={it}
              lang={lang}
              onPreview={onPreview}
            />
          ))}
        </ul>
      )}
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
      {extras.length > 0 &&
        (foldersWorthIt(extras) ? (
          <ToolFolders items={extras} lang={lang} onPreview={onPreview} />
        ) : (
          <ul className="space-y-2.5 pt-1">
            {extras.map((it) => (
              <MaterialRow key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}`} it={it} lang={lang} onPreview={onPreview} />
            ))}
          </ul>
        ))}
    </div>
  );
}

/**
 * Složkový pohled: materiály se v seznamu seskupí podle PODSLOŽEK, ve kterých
 * leží na disku – tedy tak, jak je autor balíčku rozdělil (metodika,
 * prezentace, podklady…). Bez toho je z desítek souborů plochá hromada.
 *
 * Učitelské soubory bez podsložky dostanou virtuální složku „Pro učitele":
 * na disku v takové složce opravdu leží, jen z ní `materials.ts` dělá
 * publikum (odznak), ne skupinu – v seznamu by se jinak válely volně.
 *
 * Volné žákovské soubory (např. „Začněte zde") zůstávají nahoře nad složkami,
 * stejně jako leží v kořeni balíčku.
 */
/** Grupovat do složek má smysl, jakmile je co grupovat (aspoň jedna složka). */
function foldersWorthIt(items: BankItem[]): boolean {
  const names = new Set(
    items.map((it) => it.group?.cs ?? (it.audience === "both" ? "" : `\u0000${it.audience}`)),
  );
  names.delete("");
  return items.length >= 2 && names.size >= 1;
}

function ToolFolders({
  items,
  lang,
  onPreview,
}: {
  items: BankItem[];
  lang: Lang;
  onPreview: (it: BankItem) => void;
}) {
  const s = STR[lang];
  const { loose, folders } = useMemo(() => {
    const map = new Map<string, BankItem[]>();
    const rest: BankItem[] = [];
    for (const it of items) {
      const name = it.group
        ? L(it.group, lang)
        : it.audience === "teacher"
          ? s.teacherFolder
          : it.audience === "student"
            ? s.studentFolder
            : null;
      if (name === null) {
        rest.push(it);
        continue;
      }
      const arr = map.get(name) ?? [];
      arr.push(it);
      map.set(name, arr);
    }
    return {
      loose: rest,
      folders: [...map.entries()].map(([name, its]) => ({
        name,
        items: its,
        author: its.find((i) => i.groupAuthor)?.groupAuthor,
      })),
    };
  }, [items, lang, s.teacherFolder]);

  return (
    <div className="mt-4 space-y-2.5">
      {loose.length > 0 && (
        <ul className="space-y-2.5">
          {loose.map((it) => (
            <MaterialRow
              key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}`}
              it={it}
              lang={lang}
              onPreview={onPreview}
            />
          ))}
        </ul>
      )}
      {folders.map((f) => (
        <FolderCard
          key={f.name}
          name={f.name}
          author={f.author}
          items={f.items}
          lang={lang}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}

function FolderCard({
  name,
  author,
  items,
  lang,
  onPreview,
}: {
  name: string;
  /** Autor celé složky (převzaté materiály) – ukáže se vedle šipky. */
  author?: string;
  items: BankItem[];
  lang: Lang;
  onPreview: (it: BankItem) => void;
}) {
  const s = STR[lang];
  const [open, setOpen] = useState(false);
  const onlyTeacher = items.every((it) => it.audience === "teacher");

  return (
    <div className="glass rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${open ? s.collapseFolder : s.expandFolder}: ${name}`}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            onlyTeacher
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-accent-500/15 text-accent-700 dark:text-accent-300"
          }`}
        >
          {open ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-zinc-900 dark:text-white">{name}</span>
          <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
            {countMaterials(items.length, lang)}
          </span>
        </span>
        {author && (
          <span className="hidden shrink-0 text-sm text-zinc-500 dark:text-zinc-400 sm:block">
            {author}
          </span>
        )}
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="space-y-2 px-3 pb-3">
          {items.map((it) => (
            <MaterialRow
              key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}`}
              it={it}
              lang={lang}
              onPreview={onPreview}
            />
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

  // Otevření ze sdíleného odkazu (?tema=...&lekce=N) – odscroluj k ní jednou po načtení.
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
              {hasTeacher && (
                <SlotTag kind={cfg.teacherTone === "neutral" ? "neutral" : "teacher"}>
                  {L(cfg.teacherLabel, lang)}
                </SlotTag>
              )}
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
            <MaterialRow key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}`} it={it} lang={lang} onPreview={onPreview} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Náhled .docx: vykreslení client-side přes docx-preview (lazy z CDN). */
function DocxView({
  href,
  loadingText,
  errorText,
}: {
  href: string;
  loadingText: string;
  errorText: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    let dispose: (() => void) | undefined;
    setState("loading");
    import("@/lib/docxPreview")
      .then((m) => {
        if (!ref.current) throw new Error("Náhled byl zavřen před dokončením načítání");
        return m.renderDocx(href, ref.current);
      })
      .then((cleanup) => {
        // Náhled se mohl mezitím zavřít – sledování velikosti hned odpojíme.
        if (!alive) cleanup();
        else {
          dispose = cleanup;
          setState("ready");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`Náhled dokumentu se nepodařilo vykreslit (${href}):`, err);
        setState("error");
      });
    return () => {
      alive = false;
      dispose?.();
    };
  }, [href]);

  return (
    <div className="relative h-[78vh] w-full overflow-auto rounded-xl bg-zinc-300 dark:bg-zinc-700">
      {state === "loading" && (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-200">
          <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
        </p>
      )}
      {state === "error" && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-zinc-600 dark:text-zinc-200">
          {errorText}
        </p>
      )}
      <div ref={ref} />
    </div>
  );
}

/**
 * Náhled .pptx – textový přepis snímků. Nevykresluje grafiku (to by znamenalo
 * těžkou knihovnu nebo cizí službu); ukazuje, CO na snímcích je, aby se učitel
 * mohl rozhodnout, jestli si prezentaci stáhne.
 */
function PptxView({
  href,
  lang,
  loadingText,
  errorText,
}: {
  href: string;
  lang: Lang;
  loadingText: string;
  errorText: string;
}) {
  const s = STR[lang];
  const [slides, setSlides] = useState<import("@/lib/pptxPreview").Slide[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    import("@/lib/pptxPreview")
      .then((m) => m.readPptx(href))
      .then((data) => {
        if (!alive) return;
        setSlides(data);
        setState("ready");
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`Prezentaci se nepodařilo přečíst (${href}):`, err);
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [href]);

  if (state === "loading") {
    return (
      <p className="flex items-center gap-2 py-10 text-sm text-zinc-600 dark:text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
      </p>
    );
  }
  if (state === "error" || !slides) {
    return <p className="px-6 py-10 text-center text-sm text-zinc-600 dark:text-zinc-300">{errorText}</p>;
  }

  return (
    <div className="h-[78vh] w-full overflow-auto">
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{s.pptxNote}</p>
      <ol className="space-y-3">
        {slides.map((sl) => (
          <li key={sl.no} className="glass rounded-2xl p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
              {s.pptxSlide} {sl.no}
            </p>
            {sl.title && (
              <p className="mt-1 font-display font-semibold tracking-tight text-zinc-900 dark:text-white">
                {sl.title}
              </p>
            )}
            {sl.body.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {sl.body.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            {sl.notes.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-accent-600 dark:text-zinc-400 dark:hover:text-accent-400">
                  {s.pptxNotes}
                </summary>
                <div className="mt-2 space-y-1 border-l border-black/10 pl-3 text-sm leading-relaxed text-zinc-600 dark:border-white/10 dark:text-zinc-400">
                  {sl.notes.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </details>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Náhled prostého textu (.txt, .csv). Soubor stáhneme a vypíšeme do <pre> –
 * <iframe src=".txt"> se na mobilním Safari kvůli text/plain vůbec nevykreslí.
 */
function TextView({
  href,
  loadingText,
  errorText,
}: {
  href: string;
  loadingText: string;
  errorText: string;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetch(href)
      .then((res) => {
        if (!res.ok) throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
        return res.text();
      })
      .then((t) => {
        if (alive) {
          setText(t);
          setState("ready");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`Náhled textu se nepodařilo načíst (${href}):`, err);
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [href]);

  if (state === "loading")
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-600 dark:text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
      </p>
    );
  if (state === "error")
    return (
      <p className="px-6 py-16 text-center text-sm text-zinc-600 dark:text-zinc-300">{errorText}</p>
    );
  return (
    <div className="h-[78vh] w-full overflow-auto rounded-xl bg-white dark:bg-zinc-900">
      <pre className="whitespace-pre-wrap break-words p-5 font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {text}
      </pre>
    </div>
  );
}

/**
 * Náhled souborů s kódem (.py, .sql, .js…). Text stáhneme fetchem (jako TextView)
 * a obarvíme přes highlight.js (lazy z CDN). Výsledek jde do scrollovatelného
 * monospace <pre>; téma se přepíná světlá/tmavá dle třídy .dark na <html>.
 */
function CodeView({
  href,
  ext,
  loadingText,
  errorText,
}: {
  href: string;
  ext: string;
  loadingText: string;
  errorText: string;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [html, setHtml] = useState("");

  useEffect(() => {
    let alive = true;
    setState("loading");
    (async () => {
      try {
        const res = await fetch(href);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const { highlightCode } = await import("@/lib/codePreview");
        const out = await highlightCode(text, ext);
        if (alive) {
          setHtml(out);
          setState("ready");
        }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [href, ext]);

  if (state === "loading")
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-600 dark:text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
      </p>
    );
  if (state === "error")
    return (
      <p className="px-6 py-16 text-center text-sm text-zinc-600 dark:text-zinc-300">{errorText}</p>
    );
  return (
    <div className="h-[78vh] w-full overflow-auto rounded-xl bg-white dark:bg-zinc-900">
      <pre className="p-5 font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-100 sm:text-sm">
        <code className="hljs bg-transparent" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
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
  const isDocx = DOCX.includes(item.ext);
  const isText = TEXT.includes(item.ext);
  const isCode = CODE.includes(item.ext);
  const isPptx = PPTX.includes(item.ext);
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
          {opensInBrowser(item.ext) && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.openNewTab}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-accent-500/10 hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-400"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
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
          ) : isDocx ? (
            <DocxView href={item.href} loadingText={s.docxLoading} errorText={s.docxError} />
          ) : isText ? (
            <TextView href={item.href} loadingText={s.docxLoading} errorText={s.docxError} />
          ) : isPptx ? (
            <PptxView
              href={item.href}
              lang={lang}
              loadingText={s.pptxLoading}
              errorText={s.pptxError}
            />
          ) : isCode ? (
            <CodeView
              href={item.href}
              ext={item.ext}
              loadingText={s.codeLoading}
              errorText={s.codeError}
            />
          ) : (
            <iframe src={item.href} title={label} className="h-[78vh] w-full rounded-xl border-0 bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}
