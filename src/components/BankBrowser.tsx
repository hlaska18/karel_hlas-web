"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, GraduationCap, Users, X, Eye, ExternalLink } from "lucide-react";
import type { BankItem } from "@/lib/materials";

/** Typy, které umíme spolehlivě zobrazit přímo (bez cizí služby). */
const IMG = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
const FRAME = ["pdf", "txt", "csv"];
function canPreview(ext: string): boolean {
  return IMG.includes(ext) || FRAME.includes(ext);
}

/** Sloučí přípony do přátelské kategorie (filtr „Typ"). */
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
  const [course, setCourse] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [audience, setAudience] = useState<"" | "student" | "teacher">("");
  const [preview, setPreview] = useState<BankItem | null>(null);

  // unikátní kurzy a typy z dat (žádné ručně udržované seznamy)
  const courses = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) if (!map.has(it.courseId)) map.set(it.courseId, it.courseLabel.cs);
    return [...map.entries()];
  }, [items]);

  const types = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      const t = fileType(it.ext);
      if (!map.has(t.key)) map.set(t.key, t.label);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "cs"));
  }, [items]);

  const filtered = useMemo(() => {
    const needle = stripDia(q.trim());
    return items.filter((it) => {
      if (course && it.courseId !== course) return false;
      if (type && fileType(it.ext).key !== type) return false;
      if (audience && it.audience !== audience) return false;
      if (needle) {
        const hay = stripDia(
          [it.label.cs, it.topicLabel.cs, it.group?.cs ?? "", it.courseLabel.cs, it.ext].join(" "),
        );
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, q, course, type, audience]);

  const hasFilter = q || course || type || audience;

  return (
    <div>
      {/* Vyhledávání */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hledat materiál, téma, typ…"
          className="glass-soft w-full rounded-2xl py-3.5 pl-12 pr-4 text-base text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 dark:text-zinc-100"
        />
      </div>

      {/* Filtry */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterSelect value={course} onChange={setCourse} allLabel="Všechny ročníky" options={courses} />
        <FilterSelect value={type} onChange={setType} allLabel="Všechny typy" options={types} />
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
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCourse("");
              setType("");
              setAudience("");
            }}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400 dark:hover:text-accent-400"
          >
            <X className="h-4 w-4" /> Zrušit filtry
          </button>
        )}
      </div>

      {/* Počet */}
      <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
        {filtered.length}{" "}
        {filtered.length === 1 ? "materiál" : filtered.length >= 2 && filtered.length <= 4 ? "materiály" : "materiálů"}
        {hasFilter ? ` z ${items.length}` : " celkem"}
      </p>

      {/* Seznam */}
      <ul className="mt-4 space-y-2.5">
        {filtered.map((it) => {
          const t = fileType(it.ext);
          const previewable = canPreview(it.ext);
          return (
            <li
              key={it.href}
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:shadow-lg hover:shadow-accent-600/15 sm:gap-4 sm:py-3.5"
            >
              <span className="flex w-16 shrink-0 justify-center">
                <span className="rounded-lg bg-accent-500/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                  {t.label}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-zinc-900 dark:text-white">
                  {it.label.cs}
                </span>
                <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {it.courseLabel.cs} · {it.topicNo}. {it.topicLabel.cs}
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
                  onClick={() => setPreview(it)}
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
        })}
      </ul>

      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">
          Nic neodpovídá filtru. Zkus jiné slovo nebo zruš filtry.
        </p>
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
        {/* hlavička */}
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

        {/* obsah náhledu */}
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

function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="glass-soft cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent-500/50 dark:text-zinc-200"
    >
      <option value="">{allLabel}</option>
      {options.map(([val, label]) => (
        <option key={val} value={val}>
          {label}
        </option>
      ))}
    </select>
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
