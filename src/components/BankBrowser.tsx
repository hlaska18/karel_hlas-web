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
  ArrowRight,
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
  Info,
} from "lucide-react";
import type { Lang } from "@/lib/content";
import {
  CODE,
  DOCX,
  IMG,
  NAHLED_STR,
  PPTX,
  TEXT,
  canPreview,
  opensInBrowser,
} from "@/lib/nahled";
import type { BankItem } from "@/lib/materials";
import { zaznamenejStazeni } from "@/lib/mereni";
import {
  TOOL_ORDER,
  countByKind,
  countLinks,
  countMaterials,
  fmtSize,
  materialTypeOf,
  tileSubtitle,
  toolLabel,
} from "@/lib/bankLabels";
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
    lesson: string;
    shareLesson: string;
    expandLesson: string;
    collapseLesson: string;
    teacherFolder: string;
    studentFolder: string;
    expandFolder: string;
    collapseFolder: string;
    sourceBadge: string;
    toolBadge: string;
    ukazkyNote: (pocet: number) => string;
    openTool: string;
    sourceNote: string;
    sourceNoteOffline: string;
    openSource: string;
  }
> = {
  cs: {
    searchPlaceholder: "Hledat materiál, téma, nástroj…",
    back: "Zpět na témata",
    searchResults: "Výsledky hledání: ",
    empty: "Nic neodpovídá. Zkus jiné slovo nebo se vrať na témata.",
    teacherBadge: "učitelé",
    studentBadge: "žáci",
    lesson: "Lekce",
    shareLesson: "Sdílet odkaz na lekci",
    expandLesson: "Rozbalit lekci",
    collapseLesson: "Sbalit lekci",
    teacherFolder: "Pro učitele",
    studentFolder: "Pro žáky",
    expandFolder: "Otevřít složku",
    collapseFolder: "Zavřít složku",
    sourceBadge: "zdroj",
    toolBadge: "web",
    openTool: "Spustit",
    ukazkyNote: (p) =>
      `Ukázky do výkladu – ${p} ${p === 1 ? "soubor" : p < 5 ? "soubory" : "souborů"} k porovnání`,
    sourceNote: "Převzatý materiál – otevři u původního zdroje",
    sourceNoteOffline: "Materiál třetí strany – zde není ke stažení",
    openSource: "Otevřít u zdroje",
  },
  en: {
    searchPlaceholder: "Search material, topic, tool…",
    back: "Back to topics",
    searchResults: "Search results: ",
    empty: "Nothing matches. Try another word or go back to topics.",
    teacherBadge: "teachers",
    studentBadge: "students",
    lesson: "Lesson",
    shareLesson: "Share lesson link",
    expandLesson: "Expand lesson",
    collapseLesson: "Collapse lesson",
    teacherFolder: "For teachers",
    studentFolder: "For students",
    expandFolder: "Open folder",
    collapseFolder: "Close folder",
    sourceBadge: "source",
    toolBadge: "web",
    openTool: "Open",
    ukazkyNote: (p) => `Examples for the lesson – ${p} file${p === 1 ? "" : "s"} to compare`,
    sourceNote: "Third-party material – open at the original source",
    sourceNoteOffline: "Third-party material – not available here",
    openSource: "Open at source",
  },
};

/**
 * Poznámka k celému tématu – krátká věta pod počtem materiálů.
 *
 * Je v kódu, ne v souboru na disku, schválně: neříká nic o souborech, ale
 * o STAVU tématu („tohle je nové a ještě se to hýbe"). Až se ustálí, řádek
 * se smaže a nic po něm nezbyde.
 */
const TOOL_POZNAMKA: Record<string, Record<Lang, string>> = {
  "Operační systémy": {
    cs:
      "Virtuální počítač je tu nový a pořád se dolaďuje – když něco nefunguje, jak má, dej vědět. " +
      "Vlastní pracovní listy k němu zatím nejsou; nejblíž má pracovní list \u201eOperační systém\u201c " +
      "v Digitální gramotnosti, který na simulaci odkazuje, ale metodika s ní ještě nepočítá.",
    en:
      "The virtual computer is new here and still being polished – tell me if something misbehaves. " +
      "It has no worksheets of its own yet; the closest is the \u201eOperating system\u201c worksheet under " +
      "Digital literacy, which points at the simulation, though the methodology does not build on it yet.",
  },
};

/**
 * Témata s interaktivním nástrojem na webu – odkaz se ukáže po otevření
 * dlaždice. Popisek je u nástroje, ne ve sdíleném slovníku: dokud tu byl jeden
 * (kurz SQL), stačily dva řetězce v STR, ale u druhého by pruh nad virtuálními
 * Windows sliboval kurz SQL.
 *
 * Anglická verze u obou přiznává, že samotný nástroj je česky – návštěvník to
 * má vědět předem, ne až po kliknutí.
 */
type Interaktivni = {
  cesta: string;
  popis: Record<Lang, string>;
  cta: Record<Lang, string>;
};

const TOOL_INTERACTIVE: Record<string, Interaktivni> = {
  Databáze: {
    cesta: "/sql",
    popis: {
      cs: "Projdi si interaktivní kurz SQL přímo v prohlížeči – nic se neinstaluje.",
      en: "Take the interactive SQL course right in your browser – nothing to install. The course itself is in Czech.",
    },
    cta: { cs: "Spustit kurz", en: "Start the course" },
  },
  "Operační systémy": {
    cesta: "/windows",
    popis: {
      cs: "Vyzkoušej si Windows 11 přímo v prohlížeči – nic se neinstaluje, vejdeš kódem od vyučujícího. Odškrtané úlohy zůstávají v tomhle prohlížeči.",
      en: "Try Windows 11 right in your browser – nothing to install, you enter with a code from your teacher. Completed tasks stay in this browser. The environment is in Czech.",
    },
    cta: { cs: "Spustit prostředí", en: "Start the environment" },
  },
};

/** Kurz je jen česky; z anglické verze se přidá `?z=en`, aby vedl odkaz zpět na /en. */
function interaktivniOdkaz(cesta: string, lang: Lang): string {
  return lang === "en" ? `${cesta}?z=en` : cesta;
}

/** Vezme lokalizované pole {cs,en} (nebo prázdný řetězec, když chybí). */
function L(field: { cs: string; en: string } | undefined, lang: Lang): string {
  return field ? field[lang] : "";
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
  // Vlastní soubory a externí odkazy se počítají zvlášť. Hero hlásí jen vlastní
  // soubory, takže dokud dlaždice počítaly obojí dohromady, součet dlaždic
  // nesouhlasil s číslem nad nimi (161 proti 152).
  const tiles = useMemo(() => {
    // Seskupení na CELÉ položky, ne rovnou na čísla: podtitulek potřebuje
    // rozlišit soubory, nástroje a odkazy, a navíc spočítat lekce.
    const podle = new Map<string, BankItem[]>();
    for (const it of items) {
      const list = podle.get(it.tool);
      if (list) list.push(it);
      else podle.set(it.tool, [it]);
    }

    /**
     * Kolik karet lekcí téma po otevření vykreslí. Počítá se ze stejné
     * konfigurace, podle které se karty skládají – kdyby se to počítalo
     * jinak, dlaždice by slibovala jiné číslo, než co učitel uvidí.
     */
    const pocetLekci = (tool: string, its: BankItem[]) => {
      const cfg = LESSON_CONFIG[tool];
      if (!cfg) return 0;
      const nos = new Set<number>();
      for (const it of its) {
        if ((isStudentSlot(it, cfg) || isTeacherSlot(it, cfg)) && it.lessonNo != null) {
          nos.add(it.lessonNo);
        }
      }
      return nos.size;
    };
    // Řazení podle OSNOVY, ne podle objemu. Dřív šlo první to, čeho je
    // nejvíc – jenže tím mřížka říkala „tady je toho hodně" místo „takhle to
    // jde za sebou", a nové téma s jedním materiálem spadlo na konec bez
    // ohledu na to, kdy se učí. Pořadí drží TOOL_ORDER, které se řídí
    // obsahovými okruhy informatiky v RVP 78-42-M/01 (Technické lyceum).
    //
    // `items` chodí ze serveru už seřazené dle TOOL_ORDER, ale spoléhat se na
    // pořadí vložení do Mapy je křehké – radši se seřadí znovu a explicitně.
    const poradi = (t: string) => {
      const i = TOOL_ORDER.indexOf(t);
      return i < 0 ? TOOL_ORDER.length : i;
    };
    return [...podle.entries()]
      .map(([name, its]) => ({
        name,
        pocty: { ...countByKind(its), lekce: pocetLekci(name, its) },
      }))
      .sort((a, b) => poradi(a.name) - poradi(b.name));
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
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={s.searchPlaceholder}
          placeholder={s.searchPlaceholder}
          className="glass-soft w-full rounded-karta py-3.5 pl-12 pr-4 text-base text-zinc-800 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 dark:text-zinc-100"
        />
      </div>

      {/* ── Galerie dlaždic (když se nehledá a není vybraná dlaždice) ──
          Tři sloupce až od `lg`. Dřív naskakovaly už od `sm`, kde má dlaždice
          212 px: ikona si vezme 78, mezera 12 a na název zbude 80 px – proto
          se „Grafika a multimédia“ lámalo na tři řádky a lepilo se na ikonu.
          Dva sloupce dají textu ~150 px a název se vejde na dva řádky. */}
      {!showList && (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {tiles.map((t) => {
            const Icon = toolIcon(t.name);
            return (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => setTool(t.name)}
                  className="povrch group flex h-full w-full flex-col items-center gap-2 overflow-hidden rounded-karta p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15 sm:flex-row sm:items-center sm:gap-3 sm:p-5 sm:text-left"
                >
                  {/* Text: na mobilu pod ikonou (přes celou šířku), na desktopu vlevo */}
                  <span className="order-2 flex min-w-0 flex-col gap-0.5 sm:order-1 sm:flex-1 sm:gap-1">
                    <span className="font-display text-base font-semibold tracking-podnadpis text-zinc-900 dark:text-white sm:text-lg">
                      {toolLabel(t.name, lang)}
                    </span>
                    {/* Složení tématu, ne jen počet souborů. Učitel se ptá
                        „co s tím odučím", ne „kolik toho tam je" – a u témat
                        bez vlastních souborů to navíc říká rovnou, že tu
                        nic ke stažení není. */}
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
                      {tileSubtitle(t.pocty, lang)}
                    </span>
                  </span>
                  {/* Velká „plovoucí" ikona: na mobilu nahoře menší, na desktopu vyplní pravou část */}
                  <span className="order-1 flex aspect-square w-20 shrink-0 items-center justify-center sm:order-2 sm:w-[46%] sm:max-w-[9.5rem]">
                    {hasToolGlassIcon(t.name) ? (
                      <ToolGlassIcon tool={t.name} className="h-full w-full object-contain" />
                    ) : (
                      <Icon className="h-12 w-12 text-accent-700 dark:text-accent-400 transition group-hover:scale-105 sm:h-14 sm:w-14" />
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
                className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-700 dark:text-accent-400 dark:text-zinc-200 dark:hover:text-accent-400"
              >
                <ArrowLeft className="h-4 w-4" /> {s.back}
              </button>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {needle ? s.searchResults : tool ? `${toolLabel(tool, lang)}: ` : ""}
              {countMaterials(results.length, lang)}
            </p>
          </div>

          {/* Poznámka ke stavu tématu – hned pod počtem, ať ji člověk přečte
              dřív, než se pustí do souborů. */}
          {tool && !needle && TOOL_POZNAMKA[tool] && (
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{TOOL_POZNAMKA[tool][lang]}</span>
            </p>
          )}

          {/* Interaktivní nástroj k tématu (Databáze → /sql, Operační systémy → /windows) */}
          {tool && !needle && TOOL_INTERACTIVE[tool] && (
            <a
              href={interaktivniOdkaz(TOOL_INTERACTIVE[tool].cesta, lang)}
              /* Na úzké obrazovce sloupec, teprve od `sm` vedle sebe. Dokud
                 tu byl jeden řádek pořád, text se na mobilu vmáčkl mezi ikonu
                 a tlačítko a zbyla z něj nudle o třech slovech na řádek. */
              className="glass-accent group mt-4 flex flex-col items-start gap-3 rounded-karta px-5 py-4 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-start gap-3 sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ovladac bg-accent-700 text-white shadow-lg shadow-accent-700/30">
                  <Play className="h-5 w-5" />
                </span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {TOOL_INTERACTIVE[tool].popis[lang]}
                </span>
              </span>
              {/* Odsazení na mobilu srovná tlačítko pod text, ne pod ikonu. */}
              <span className="inline-flex shrink-0 items-center gap-1.5 pl-[3.25rem] text-sm font-semibold text-accent-700 dark:text-accent-300 sm:pl-0">
                {TOOL_INTERACTIVE[tool].cta[lang]}
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
            <p className="mt-10 text-center text-zinc-600 dark:text-zinc-400">{s.empty}</p>
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
  vKarte,
}: {
  it: BankItem;
  lang: Lang;
  onPreview: (it: BankItem) => void;
  /**
   * Řádek stojí uvnitř rozbalovací karty lekce nebo složky. Ta má lekci
   * v hlavičce a téma v nadpisu nad seznamem, takže drobečková cesta pod
   * názvem jen dvakrát opakuje, co je vidět – u dvaceti řádků pod sebou to
   * dělá druhou řádku textu, která nic nenese. Ve výsledcích hledání
   * a v plochých seznamech je naopak jediné, podle čeho se materiál zařadí.
   */
  vKarte?: boolean;
}) {
  const s = STR[lang];
  const n = NAHLED_STR[lang];
  const label = L(it.label, lang);

  // Nástroj, který běží tady na webu. Vlastní řádek proto, že řádek pro soubor
  // by mu dal odznak s příponou „link", velikost a tlačítko Stáhnout – nic
  // z toho nedává smysl. A řádek pro převzatý zdroj by tvrdil, že je to cizí
  // materiál a otevíral ho do nové karty.
  if (it.interactive) {
    return (
      <li>
        <a
          // Stejný odkaz jako v pruhu nad seznamem, včetně `?z=en` – jinak by
          // jeden z těch dvou vrátil anglického návštěvníka na českou úvodní.
          // Hotová stránka z `public/` (laboratoř) na `?z=en` nereaguje a jde
          // do nové karty, ať učiteli zůstane rozescrollovaný seznam.
          href={it.novaKarta ? it.href : interaktivniOdkaz(it.href, lang)}
          {...(it.novaKarta ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="povrch group flex items-start gap-3 rounded-karta px-4 py-3 transition hover:shadow-lg hover:shadow-accent-600/15 sm:items-center sm:gap-4 sm:py-3.5"
        >
          <span className="flex shrink-0 sm:w-[5.25rem]">
            <span className="inline-flex items-center gap-1.5 rounded-stitek bg-accent-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
              <Play className="h-4 w-4 shrink-0" />
              {s.toolBadge}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-zinc-900 dark:text-white">{label}</span>
            {it.sourceNote && (
              <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">
                {L(it.sourceNote, lang)}
              </span>
            )}
          </span>
          <span className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-medium text-accent-700 transition group-hover:bg-accent-500/10 sm:h-9 sm:px-3 dark:text-accent-300">
            <span className="hidden sm:inline">{s.openTool}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>
      </li>
    );
  }

  // Převzatý materiál se nehostuje. S URL → odkaz na originál; bez URL → jen
  // informační atribuce (materiál třetí strany, nedostupný zde).
  if (it.external) {
    const hasLink = Boolean(it.href);
    const inner = (
      <>
        {/* Odznak má pevnou šířku až od sm – na mobilu by spolu s textem
            tlačítka nechal na název pár pixelů („P..“). */}
        <span className="flex shrink-0 sm:w-[5.25rem]">
          <span className="inline-flex items-center gap-1.5 rounded-stitek bg-zinc-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            <ExternalLink className="h-4 w-4 shrink-0" />
            {s.sourceBadge}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-zinc-900 dark:text-white">{label}</span>
          {/* Vlastní vysvětlivka ze `_zdroj.json` má přednost před obecnou větou –
              u dvojice učebnice + cvičné soubory je potřeba říct, že patří k sobě. */}
          <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">
            {it.sourceNote
              ? L(it.sourceNote, lang)
              : `${hasLink ? s.sourceNote : s.sourceNoteOffline}${it.group ? ` · ${L(it.group, lang)}` : ""}`}
          </span>
        </span>
        {hasLink && (
          <span className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 sm:h-9 text-sm font-medium text-accent-700 transition group-hover:bg-accent-500/10 sm:px-3 dark:text-accent-300">
            {/* Na mobilu jen ikona – celý popisek by ukrojil půlku řádku. */}
            <span className="hidden sm:inline">{s.openSource}</span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </span>
        )}
      </>
    );
    const cls =
      "povrch flex items-start gap-3 rounded-karta px-4 py-3 sm:items-center sm:gap-4 sm:py-3.5" +
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
    /* Náhled otevře KLIK KAMKOLI do řádku, ne jen ikona oka. Karlova kolegyně
       klikla pro náhled rovnou na buňku – když řádek vypadá jako karta, člověk
       na něj klikne. Vpravo proto zůstalo jen stahování.

       `role="button"` na `<li>`, ne `<button>` kolem: uvnitř je odkaz ke
       stažení a odkaz uvnitř tlačítka je neplatné HTML.

       Nepreviewovatelné typy zůstávají obyčejným řádkem – ani kurzor, ani
       zvýraznění, ani štítek. Slibovat náhled tam, kde není, je horší než
       nenabízet nic. */
    <li
      {...(previewable
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `${n.previewTitle}: ${label}`,
            onClick: () => onPreview(it),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPreview(it);
              }
            },
          }
        : {})}
      className={`povrch group/radek flex flex-wrap items-center gap-x-3 gap-y-1 rounded-karta px-4 py-3 transition hover:shadow-lg hover:shadow-accent-600/15 sm:flex-nowrap sm:gap-4 sm:py-3.5 ${
        previewable ? "cursor-pointer hover:border-accent-500/40 dark:hover:border-accent-500/40" : ""
      }`}
    >
      <span className="flex shrink-0 sm:w-[5.25rem]">
        <span
          title={t.label}
          className="inline-flex items-center gap-1.5 rounded-stitek bg-accent-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300"
        >
          <TypeIcon className="h-4 w-4 shrink-0" />
          {it.ext}
        </span>
      </span>
      {/* Na mobilu si text vezme skoro celý řádek, takže tlačítka spadnou pod něj.
          Jinak by dva dotykové cíle po 44 px ukrojily z názvu skoro všechno. */}
      <span className="min-w-0 flex-1 basis-[calc(100%-5rem)] sm:basis-auto">
        <span className="block truncate font-medium text-zinc-900 dark:text-white">{label}</span>
        {/* Popisek ukázek se schválně zalamuje místo ořezávání: na 375 px
            zbývá 204 px a celý se nevejde, takže by se uřízl přesně na počtu
            souborů („Ukázky do výkladu – 5 soubo…"). Drobečky se ořezávat
            smějí – tam je uříznutý konec cesty pořád k něčemu. */}
        {(materialType || it.ukazky || !vKarte) && (
          <span
            className={`mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400 ${
              it.ukazky ? "" : "truncate"
            }`}
          >
            {/* Balík ukázek je jediný řádek, který sám o sobě neřekne, co je
                uvnitř – „ZIP · Obrázky · 1,5 MB" může být cokoli. Popisek
                proto zůstává i v kartě lekce, kde se drobečky schovávají. */}
            {it.ukazky ? <span>{s.ukazkyNote(it.ukazky)}</span> : null}
            {materialType && (
              <span className="text-zinc-600 dark:text-zinc-400">
                {materialType[lang]}
                {vKarte ? "" : " · "}
              </span>
            )}
            {!vKarte && (
              <>
                {L(it.topicLabel, lang)}
                {it.group ? ` · ${L(it.group, lang)}` : ""}
              </>
            )}
          </span>
        )}
      </span>
      {/* Odznak jen u vyhraněných materiálů. „both" (většina) ho nemá – tvrdit
          u průvodce pro učitele „žáci" nedávalo smysl. */}
      {/* Odznak se ukazuje i na mobilu. Dřív měl `hidden sm:inline-flex`, takže
          pod 640 px zmizel – a „Klíč k testům" pak vypadal stejně jako pracovní
          list. Odkazy do skupin se přitom otevírají hlavně na telefonu. */}
      {it.audience !== "both" && (
        <span className="inline-flex shrink-0 items-center gap-1.5">
          {it.audience === "teacher" ? (
            <span className="inline-flex items-center gap-1 rounded-stitek bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <GraduationCap className="h-3.5 w-3.5" /> {s.teacherBadge}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-stitek bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-300">
              <Users className="h-3.5 w-3.5" /> {s.studentBadge}
            </span>
          )}
        </span>
      )}
      <span className="hidden w-14 shrink-0 text-right text-xs text-zinc-600 md:block">
        {fmtSize(it.sizeBytes, lang)}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-0">
        {/* Popisek „Náhled" tu býval jako náznak, že řádek něco umí. Odebrán:
            při najetí se dějí tři jiné věci naráz – kurzor je ruka, řádek se
            nadzvedne stínem a orámování zezelená. Čtvrtý signál k témuž byl
            navíc. Pro odečítač obrazovky ani na mobilu stejně nikdy nebyl
            (`aria-hidden`, `hidden sm:inline-flex`); přístupnost drží
            `aria-label` na řádku. */}
        <a
          href={it.href}
          download
          onClick={(e) => {
            e.stopPropagation();
            zaznamenejStazeni(it);
          }}
          title={n.downloadTitle}
          aria-label={`${n.downloadTitle}: ${label}`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 text-zinc-600 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-400"
        >
          <Download className="h-5 w-5" />
        </a>
      </span>
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
  "Grafika a multimédia": {
    studentGroups: ["Podklady k aktivitám"],
    teacherGroups: ["Prezentace k hodinám"],
    teacherTone: "neutral",
    studentLabel: { cs: "Podklad", en: "Activity file" },
    teacherLabel: { cs: "Prezentace", en: "Slides" },
  },
  // Power BI tu mělo skupiny „Úlohy" a „Řešení", které na disku neexistují –
  // reálné jsou „PowerBI" a „Microsoft 365 pro školy". Konfigurace tedy nikdy
  // nevytvořila jedinou kartu lekce a jen mátla. Téma dnes vede na cizí
  // cvičebnici, karty lekcí by neměl z čeho postavit.
  //
  // Grafika a multimédia tu není schválně: balíček je rozdělený rovnou do
  // složek hodin, takže si karty lekcí nemá z čeho stavět a nepotřebuje je –
  // složka hodiny dělá totéž a nese i média, která hodina používá.
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
    <span className={`inline-flex items-center gap-1 rounded-stitek px-2 py-0.5 text-[11px] font-medium ${cls}`}>
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
    // Volné soubory v kořeni tématu (typicky „Začni zde") patří NAD lekce –
    // je to rozcestník, kterým má člověk začít, ne dodatek na konci.
    //
    // Podmínka na `it.rozcestnik` tu musí být zvlášť: `isRozcestnik()` dává
    // těmhle souborům odznak „učitelé", takže na `audience === "both"` neprošly
    // a padaly mezi extras úplně dolů – přesně naopak, než co říká komentář
    // nad tím. V tématech Internet a bezpečnost i Umělá inteligence stálo
    // „Začni zde" jako poslední položka.
    return {
      lessons: lessonsArr,
      intro: rest.filter((it) => it.rozcestnik || (!it.group && it.audience === "both")),
      extras: rest.filter((it) => !it.rozcestnik && (it.group || it.audience !== "both")),
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
 * Volné žákovské soubory (např. „Začni zde") zůstávají nahoře nad složkami,
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
  const { rozcestniky, loose, folders } = useMemo(() => {
    // Klíč nese i publikum. Na disku má `_ucitel/` podsložky pojmenované stejně
    // jako žákovské (téma Databáze: „2. Kurz SQL v prohlížeči" je v obou), a
    // dokud se grupovalo jen podle názvu, slily se do jedné karty – vedle
    // pracovního listu tak ležela i řešení a karta nebyla ani jantarová.
    //
    // Klíčem je navíc CESTA (`groupSort`), ne jen zobrazovaný název: podle ní
    // se pozná, že „Obrázky" patří dovnitř své lekce, a ne vedle ní.
    type Uzel = {
      cesta: string;
      name: string;
      ucitelska: boolean;
      items: BankItem[];
      deti: Uzel[];
    };
    const map = new Map<string, Uzel>();
    const rest: BankItem[] = [];
    const start: BankItem[] = [];
    for (const it of items) {
      if (it.rozcestnik) {
        start.push(it);
        continue;
      }
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
      const ucitelska = it.audience === "teacher";
      const cesta = it.groupSort ?? name;
      const klic = `${cesta} ${ucitelska ? "u" : "z"}`;
      const zaznam = map.get(klic) ?? { cesta, name, ucitelska, items: [], deti: [] };
      zaznam.items.push(it);
      map.set(klic, zaznam);
    }

    // Vnoření: „1. Rastrová grafika/Obrázky" je dítě „1. Rastrová grafika".
    // Bez toho měla grafika devatenáct karet – každou lekci dvakrát, jednou ji
    // samotnou a jednou její přílohy – a největší kartou v celém tématu byla
    // složka s osmnácti obrázky ke kompresi.
    const korenove: Uzel[] = [];
    for (const u of map.values()) {
      const lom = u.cesta.lastIndexOf("/");
      const rodic =
        lom > 0 ? map.get(`${u.cesta.slice(0, lom)} ${u.ucitelska ? "u" : "z"}`) : undefined;
      if (rodic) {
        // Uvnitř stačí název samotné podsložky – nadřazenou lekci má člověk
        // před očima v hlavičce karty, ve které ten řádek stojí.
        rodic.deti.push({ ...u, name: u.name.split(" › ").pop() ?? u.name });
      } else {
        korenove.push(u);
      }
    }

    // Rozlišující popisek se přidá JEN při skutečné kolizi. Složka, která je
    // celá učitelská (např. „Python – řešení testů"), ho nepotřebuje – že je
    // učitelská, je vidět z jantarové karty.
    const kolize = new Set<string>();
    for (const a of korenove)
      for (const b of korenove)
        if (a.name === b.name && a.ucitelska !== b.ucitelska) kolize.add(a.name);

    const autor = (u: Uzel) => u.items.find((i) => i.groupAuthor)?.groupAuthor;

    return {
      rozcestniky: start,
      loose: rest,
      folders: korenove.map((f) => ({
        name: kolize.has(f.name) && f.ucitelska ? `${f.name} · ${s.teacherFolder}` : f.name,
        items: f.items,
        deti: f.deti.map((d) => ({ name: d.name, items: d.items, author: autor(d) })),
        author: autor(f),
      })),
    };
  }, [items, lang, s.teacherFolder, s.studentFolder]);

  return (
    <div className="mt-4 space-y-2.5">
      {/* Rozcestník tématu jde první. Je psaný vyučujícímu, takže si nechává
          jantarový odznak – ale schovávat ho na konec do složky „Pro učitele"
          bylo přesně naopak, než k čemu je: má to být první, co člověk otevře. */}
      {rozcestniky.length > 0 && (
        <ul className="space-y-2.5">
          {rozcestniky.map((it) => (
            <MaterialRow
              key={`${it.href}|${it.audience}|rozcestnik`}
              it={it}
              lang={lang}
              onPreview={onPreview}
            />
          ))}
        </ul>
      )}
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
          deti={f.deti}
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
  deti = [],
  lang,
  onPreview,
}: {
  name: string;
  /** Autor celé složky (převzaté materiály) – ukáže se vedle šipky. */
  author?: string;
  items: BankItem[];
  /** Podsložky – vykreslí se uvnitř, pod soubory samotné složky. */
  deti?: { name: string; items: BankItem[]; author?: string }[];
  lang: Lang;
  onPreview: (it: BankItem) => void;
}) {
  const s = STR[lang];
  const [open, setOpen] = useState(false);
  const onlyTeacher = items.every((it) => it.audience === "teacher");

  return (
    <div className="povrch rounded-karta">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${open ? s.collapseFolder : s.expandFolder}: ${name}`}
        className="transition active:scale-[0.99] active:duration-100 flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-ovladac ${
            onlyTeacher
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-accent-500/15 text-accent-700 dark:text-accent-300"
          }`}
        >
          {open ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-zinc-900 dark:text-white">{name}</span>
          <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">
            {/* Počet včetně podsložek – karta se tváří jako jeden celek,
                takže by lhala, kdyby své přílohy nepočítala. */}
            {countMaterials(items.length + deti.reduce((n, d) => n + d.items.length, 0), lang)}
          </span>
        </span>
        {author && (
          <span className="hidden shrink-0 text-sm text-zinc-600 dark:text-zinc-400 sm:block">
            {author}
          </span>
        )}
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* Výška se animuje přes grid-template-rows, obsah zůstává v DOM –
          jde to zavřít v půlce otevírání, na rozdíl od {open && …}. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2 px-3 pb-3">
            {items.map((it) => (
              <MaterialRow
                key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}|${it.label.cs}`}
                it={it}
                lang={lang}
                vKarte
                onPreview={onPreview}
              />
            ))}
            {/* Podsložka (Obrázky, Média, Výstupy) jako sbalený řádek uvnitř
                lekce, ne jako karta vedle ní. */}
            {deti.map((d) => (
              <li key={d.name}>
                <FolderCard
                  name={d.name}
                  author={d.author}
                  items={d.items}
                  lang={lang}
                  onPreview={onPreview}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
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

/**
 * Název lekce. Bere se z PREZENTACE k hodině, ne z nejdelšího názvu souboru.
 *
 * Dřív rozhodovala délka a v ostatních tématech to vycházelo, protože
 * prezentace tam nese celé téma a je nejdelší. V Grafice ne: v hodinách
 * 3 a 6 je „Laboratoř – komprese a formáty" delší než „Formáty obrázků
 * a komprese", takže by se karta jmenovala po laboratoři místo po tématu.
 *
 * Prezentace je plán té hodiny, takže je to i významově správně. Nejdelší
 * název zůstává jako záloha pro balíčky, které prezentaci nemají.
 */
function lessonTitle(items: BankItem[], lang: Lang, cfg: LessonConfig): string {
  const zPrezentace = items
    .filter((it) => isTeacherSlot(it, cfg))
    .map((it) => cleanTitle(L(it.label, lang)))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const candidates = zPrezentace.length
    ? zPrezentace
    : items
        .map((it) => cleanTitle(L(it.label, lang)))
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

  if (!candidates.length) return "";
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
  const title = lessonTitle(items, lang, cfg);
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
    <div ref={ref} className="povrch rounded-karta">
      <div className="flex items-center gap-1 px-2.5 py-2 sm:px-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-ovladac px-1.5 py-1.5 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ovladac bg-accent-500/15 font-display text-sm font-bold text-accent-700 dark:text-accent-300">
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
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 text-zinc-600 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-400"
        >
          {copied ? <Check className="h-4 w-4 text-accent-700 dark:text-accent-400" /> : <Link2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? s.collapseLesson : s.expandLesson}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 text-zinc-600 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-400"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2 px-3 pb-3">
            {items.map((it) => (
              <MaterialRow
                key={`${it.href}|${it.audience}|${it.group?.cs ?? ""}|${it.label.cs}`}
                it={it}
                lang={lang}
                vKarte
                onPreview={onPreview}
              />
            ))}
          </ul>
        </div>
      </div>
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
    <div className="relative h-[78vh] w-full overflow-auto rounded-ovladac bg-zinc-300 dark:bg-zinc-700">
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
  const n = NAHLED_STR[lang];
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
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">{n.pptxNote}</p>
      <ol className="space-y-3">
        {slides.map((sl) => (
          <li key={sl.no} className="povrch rounded-karta p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-accent-700 dark:text-accent-400">
              {n.pptxSlide} {sl.no}
            </p>
            {sl.title && (
              <p className="mt-1 font-display font-semibold tracking-podnadpis text-zinc-900 dark:text-white">
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
                <summary className="cursor-pointer text-xs font-medium text-zinc-600 hover:text-accent-700 dark:text-accent-400 dark:text-zinc-400 dark:hover:text-accent-400">
                  {n.pptxNotes}
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
    <div className="h-[78vh] w-full overflow-auto rounded-ovladac bg-white dark:bg-zinc-900">
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
    <div className="h-[78vh] w-full overflow-auto rounded-ovladac bg-white dark:bg-zinc-900">
      <pre className="p-5 font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-100 sm:text-sm">
        <code className="hljs bg-transparent" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

/**
 * Modální náhled materiálu.
 *
 * Exportovaný, protože ho otevírá i stoh ukázek v hlavičce webu
 * (`HeroPreview`) – aby karta v hlavičce ukázala materiál na místě
 * a neposílala učitele o tři obrazovky níž do banky.
 */
export function PreviewModal({
  item,
  lang,
  onClose,
}: {
  item: BankItem;
  lang: Lang;
  onClose: () => void;
}) {
  const s = STR[lang];
  const n = NAHLED_STR[lang];
  const isImg = IMG.includes(item.ext);
  const isDocx = DOCX.includes(item.ext);
  const isText = TEXT.includes(item.ext);
  const isCode = CODE.includes(item.ext);
  const isPptx = PPTX.includes(item.ext);
  const label = L(item.label, lang);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fokus musí zůstat uvnitř náhledu. Bez toho se Tabem propadne do
    // seznamu POD překryvem a po zavření začíná procházení od hlavičky.
    const vratitNa = document.activeElement as HTMLElement | null;
    const ohnisko = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const prvky = ohnisko();
      if (!prvky.length) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const prvni = prvky[0];
      const posledni = prvky[prvky.length - 1];
      const kde = document.activeElement;
      if (e.shiftKey && (kde === prvni || kde === panelRef.current)) {
        e.preventDefault();
        posledni.focus();
      } else if (!e.shiftKey && kde === posledni) {
        e.preventDefault();
        prvni.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      // Fokus zpátky na tlačítko, ze kterého se náhled otevřel.
      vratitNa?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${n.previewTitle}: ${label}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-panel outline-none"
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-3.5 dark:border-white/10">
          <p className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-white">{label}</p>
          {opensInBrowser(item.ext) && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={n.openNewTab}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-accent-400 dark:text-zinc-300 dark:hover:text-accent-400"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
          <a
            href={item.href}
            download
            onClick={() => zaznamenejStazeni(item)}
            title={n.downloadTitle}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-800"
          >
            <Download className="h-4 w-4" /> {n.downloadTitle}
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label={n.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-white/40 p-3 dark:bg-black/20">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.href} alt={label} className="max-h-[78vh] max-w-full object-contain" />
          ) : isDocx ? (
            <DocxView href={item.href} loadingText={n.docxLoading} errorText={n.docxError} />
          ) : isText ? (
            <TextView href={item.href} loadingText={n.docxLoading} errorText={n.docxError} />
          ) : isPptx ? (
            <PptxView
              href={item.href}
              lang={lang}
              loadingText={n.pptxLoading}
              errorText={n.pptxError}
            />
          ) : isCode ? (
            <CodeView
              href={item.href}
              ext={item.ext}
              loadingText={n.codeLoading}
              errorText={n.codeError}
            />
          ) : (
            <iframe src={item.href} title={label} className="h-[78vh] w-full rounded-ovladac border-0 bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}
