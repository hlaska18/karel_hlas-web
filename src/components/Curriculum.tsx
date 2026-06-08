"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Presentation,
  Youtube,
  Code2,
  Link as LinkIcon,
  ArrowUpRight,
  Target,
  GraduationCap,
  ChevronDown,
  Folder,
  ClipboardList,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  COURSES,
  type Material,
  type MaterialGroup,
  type MaterialEntry,
  type Lang,
  type CurriculumItem,
  type Course,
  type Audience,
} from "@/lib/content";
import type { FolderMaterials } from "@/lib/materials";
import { Reveal } from "@/components/Reveal";
import { SectionJump } from "@/components/SectionJump";

function MaterialIcon({ kind }: { kind?: Material["kind"] }) {
  const cls = "h-4 w-4 shrink-0";
  switch (kind) {
    case "doc":
      return <FileText className={cls} />;
    case "slides":
      return <Presentation className={cls} />;
    case "video":
      return <Youtube className={cls} />;
    case "code":
      return <Code2 className={cls} />;
    default:
      return <LinkIcon className={cls} />;
  }
}

export function Curriculum({
  folderMaterials = {},
}: {
  folderMaterials?: FolderMaterials;
}) {
  const { lang, tr } = useLang();
  const l = tr.lessons;
  const [openId, setOpenId] = useState<string | null>(null);
  const [teacherView, setTeacherView] = useState(false);

  // Učitelský pohled lze otevřít odkazem (?ucitel=1) i si ho zapamatovat.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("ucitel") === "1") {
        setTeacherView(true);
        return;
      }
      if (localStorage.getItem("kh-view") === "teacher") setTeacherView(true);
    } catch {
      /* localStorage nemusí být dostupné */
    }
  }, []);

  const changeView = (teacher: boolean) => {
    setTeacherView(teacher);
    try {
      localStorage.setItem("kh-view", teacher ? "teacher" : "student");
      const url = new URL(window.location.href);
      if (teacher) url.searchParams.set("ucitel", "1");
      else url.searchParams.delete("ucitel");
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* ignore */
    }
  };

  return (
    <section id="vyuka" className="relative py-10 sm:py-14">
      {/* dekorativní pozadí pro sklo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-6%] top-24 h-72 w-72 rounded-full bg-accent-400/15 blur-[120px] dark:bg-accent-600/20" />
        <div className="absolute right-[-6%] bottom-24 h-80 w-80 rounded-full bg-accent-300/15 blur-[130px] dark:bg-accent-700/15" />
      </div>

      <div className="container-page">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            {l.kicker}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {l.heading}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {l.intro}
          </p>

          {/* přepínač Žák / Učitel (metodické poznámky nejsou tajné, jen se schovají) */}
          <div
            role="group"
            aria-label={`${l.viewStudent} / ${l.viewTeacher}`}
            className="glass-soft mt-6 inline-flex items-center gap-1 rounded-full p-1 text-sm"
          >
            <button
              type="button"
              onClick={() => changeView(false)}
              aria-pressed={!teacherView}
              className={`rounded-full px-4 py-1.5 font-medium transition ${
                !teacherView
                  ? "bg-accent-600 text-white shadow-md shadow-accent-600/30"
                  : "text-zinc-600 hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-400"
              }`}
            >
              {l.viewStudent}
            </button>
            <button
              type="button"
              onClick={() => changeView(true)}
              aria-pressed={teacherView}
              className={`rounded-full px-4 py-1.5 font-medium transition ${
                teacherView
                  ? "bg-accent-600 text-white shadow-md shadow-accent-600/30"
                  : "text-zinc-600 hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-400"
              }`}
            >
              {l.viewTeacher}
            </button>
          </div>
        </Reveal>

        {/* výběr ročníku */}
        <Reveal delay={0.05}>
          <div className="mt-10 flex flex-wrap gap-4">
            {COURSES.map((course) => {
              const open = openId === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setOpenId(open ? null : course.id)}
                  aria-expanded={open}
                  aria-controls={`osa-${course.id}`}
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition duration-300 hover:-translate-y-0.5 ${
                    open ? "glass-accent" : "glass"
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white shadow-lg shadow-accent-600/30">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                      {course.year[lang]} – {course.field[lang]}
                    </span>
                    <span className="block text-xs text-zinc-600 dark:text-zinc-300/80">
                      {l.subject} · {course.schoolYear}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                      open ? "rotate-180 text-accent-600 dark:text-accent-400" : "text-zinc-500"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {!openId && (
            <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              {l.pick}
            </p>
          )}
        </Reveal>

        {/* časové osy – obsah se renderuje až po otevření (menší HTML = rychlejší načtení) */}
        <div>
          {COURSES.map((course) => (
            <CourseTimeline
              key={course.id}
              course={course}
              open={openId === course.id}
              l={l}
              lang={lang}
              courseMaterials={folderMaterials[course.id]}
              teacherView={teacherView}
            />
          ))}
        </div>

        <SectionJump href="#top" label={tr.footer.top} direction="up" />
      </div>
    </section>
  );
}

function CourseTimeline({
  course,
  open,
  l,
  lang,
  courseMaterials,
  teacherView,
}: {
  course: Course;
  open: boolean;
  l: ReturnType<typeof useLang>["tr"]["lessons"];
  lang: Lang;
  courseMaterials?: Record<number, MaterialEntry[]>;
  teacherView: boolean;
}) {
  // Obsah se připojí až po otevření (menší výchozí HTML). Rozbalení je plynulé
  // díky CSS grid-rows: po připojení obsahu přepneme na 1fr v dalším snímku.
  const [mounted, setMounted] = useState(false);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
      return () => cancelAnimationFrame(r);
    }
    setGrown(false);
    const t = setTimeout(() => setMounted(false), 850);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div
      id={`osa-${course.id}`}
      className={`grid transition-[grid-template-rows] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        grown ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        {mounted && (
          <Timeline
            items={course.items}
            l={l}
            lang={lang}
            courseMaterials={courseMaterials}
            teacherView={teacherView}
          />
        )}
      </div>
    </div>
  );
}

function Timeline({
  items,
  l,
  lang,
  courseMaterials,
  teacherView,
}: {
  items: CurriculumItem[];
  l: ReturnType<typeof useLang>["tr"]["lessons"];
  lang: Lang;
  courseMaterials?: Record<number, MaterialEntry[]>;
  teacherView: boolean;
}) {
  return (
    <ol className="relative mt-10 ml-1.5 border-l border-black/10 dark:border-white/10">
      {items.map((item, i) => {
        const mats = [...item.materials, ...(courseMaterials?.[i] ?? [])].filter(
          (m) => teacherView || !m.teacherOnly,
        );
        return (
        <li key={i} className="relative pb-12 pl-8 last:pb-0 sm:pl-12">
          <span
            aria-hidden
            className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full bg-accent-500 ring-4 ring-[var(--bg)]"
          />

          <span className="inline-block rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-700 dark:bg-accent-400/10 dark:text-accent-300">
            {item.month[lang]}
          </span>

          <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
            {item.title[lang]}
          </h3>

          {item.goal[lang] && (
            <p className="mt-2 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
              <span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                  {l.goalLabel}:
                </span>{" "}
                {item.goal[lang]}
              </span>
            </p>
          )}

          {teacherView && item.teacherNote && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border-l-4 border-accent-500 bg-accent-50/70 px-4 py-3 dark:bg-accent-400/10">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-700 dark:text-accent-300">
                  {l.teacherNoteLabel}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {item.teacherNote[lang]}
                </p>
              </div>
            </div>
          )}

          <div className="glass mt-5 grid gap-6 rounded-3xl p-5 sm:p-6 lg:grid-cols-2">
            {item.topics[lang].length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {l.topicsLabel}
                </p>
                <ul className="mt-3 space-y-2">
                  {item.topics[lang].map((topic, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={item.topics[lang].length === 0 ? "lg:col-span-2" : ""}>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {l.materialsLabel}
              </p>
              {mats.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {mats.map((entry, k) =>
                    "items" in entry ? (
                      <MaterialGroupItem key={k} group={entry} l={l} lang={lang} teacherView={teacherView} />
                    ) : (
                      <MaterialLink key={k} mat={entry} l={l} lang={lang} teacherView={teacherView} />
                    ),
                  )}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-black/10 px-3.5 py-3 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  {l.noMaterials}
                </p>
              )}
            </div>
          </div>
        </li>
        );
      })}
    </ol>
  );
}

type Lessons = ReturnType<typeof useLang>["tr"]["lessons"];

/** Komu je materiál určený: vynucené `audience` → učitelské (_ucitel) → odhad z názvu → oba. */
function audienceOf(entry: Material | MaterialGroup): Audience {
  if (entry.audience) return entry.audience;
  if (entry.teacherOnly) return "teacher";
  // NFC kvůli macOS názvům souborů v rozloženém Unicode (NFD) – jinak „í/á" nesedí.
  const name = `${entry.label.cs} ${entry.label.en}`.normalize("NFC").toLowerCase();
  if (/(žák|zák|pracovn[íi] list|úloh|uloh|cvi[čc]en)/.test(name)) return "student";
  return "both";
}

const AUDIENCE_STYLE: Record<Audience, string> = {
  teacher: "bg-accent-600 text-white",
  student: "bg-accent-100 text-accent-700 dark:bg-accent-400/15 dark:text-accent-300",
  both: "bg-zinc-200/70 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
};

function AudienceBadge({ audience, l }: { audience: Audience; l: Lessons }) {
  const text =
    audience === "teacher"
      ? l.audienceTeacher
      : audience === "student"
        ? l.audienceStudent
        : l.audienceBoth;
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${AUDIENCE_STYLE[audience]}`}
    >
      {text}
    </span>
  );
}

function MaterialLink({
  mat,
  l,
  lang,
  teacherView,
}: {
  mat: Material;
  l: Lessons;
  lang: Lang;
  teacherView: boolean;
}) {
  const ready = Boolean(mat.href) && mat.href !== "#";
  if (!ready) {
    return (
      <li>
        <span className="flex items-center gap-3 rounded-xl border border-dashed border-black/10 px-3.5 py-2.5 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          <MaterialIcon kind={mat.kind} />
          <span className="flex-1">{mat.label[lang]}</span>
          <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
            {l.soon}
          </span>
        </span>
      </li>
    );
  }
  return (
    <li>
      <a
        href={mat.href}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-soft group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200 dark:hover:text-accent-400"
      >
        <span className="text-accent-500">
          <MaterialIcon kind={mat.kind} />
        </span>
        <span className="flex-1">{mat.label[lang]}</span>
        {teacherView && <AudienceBadge audience={audienceOf(mat)} l={l} />}
        <ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
      </a>
    </li>
  );
}

function MaterialGroupItem({
  group,
  l,
  lang,
  teacherView,
}: {
  group: MaterialGroup;
  l: Lessons;
  lang: Lang;
  teacherView: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="glass-soft flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200 dark:hover:text-accent-400"
      >
        <span className="text-accent-500">
          <Folder className="h-4 w-4 shrink-0" />
        </span>
        <span className="flex-1 text-left">{group.label[lang]}</span>
        {teacherView && <AudienceBadge audience={audienceOf(group)} l={l} />}
        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
          {group.items.length}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-accent-600 dark:text-accent-400" : ""
          }`}
        />
      </button>

      {open && (
        <ul className="ml-3 mt-1.5 flex flex-col gap-1 border-l border-black/10 pl-3 dark:border-white/10">
          {group.items.map((m, k) => (
            <li key={k}>
              <a
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-600 transition hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-400"
              >
                <span className="text-accent-500">
                  <MaterialIcon kind={m.kind} />
                </span>
                <span className="flex-1">{m.label[lang]}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
