"use client";

import { useState } from "react";
import { Target, GraduationCap, ChevronDown, ClipboardList, Library } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { COURSES, type Lang, type CurriculumItem, type Course } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionJump } from "@/components/SectionJump";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

export function Curriculum() {
  const { lang, tr } = useLang();
  const l = tr.lessons;
  const [openId, setOpenId] = useState<string | null>(null);

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
        </Reveal>

        {/* Odkaz na banku materiálů (materiály už nejsou vložené v plánu). */}
        <Reveal delay={0.05}>
          <div className="glass-accent mt-6 flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white shadow-lg shadow-accent-600/30">
              <Library className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                {l.bankTitle}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {l.bankDesc}
              </span>
            </span>
            <InteractiveHoverButton
              href="/pro-ucitele"
              text={l.bankCta}
              className="shrink-0 self-start sm:self-auto"
            />
          </div>
        </Reveal>

        {/* výběr ročníku */}
        <Reveal as="div" stagger className="mt-10 flex flex-wrap gap-4">
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
}: {
  course: Course;
  open: boolean;
  l: ReturnType<typeof useLang>["tr"]["lessons"];
  lang: Lang;
}) {
  // Kontejner se ukáže ihned (bez výškové animace = žádný skok). Samotná témata
  // pak plynule „naběhnou" jedno po druhém (CSS .timeline-in na <ol>).
  if (!open) return <div id={`osa-${course.id}`} />;

  return (
    <div id={`osa-${course.id}`}>
      <Timeline items={course.items} l={l} lang={lang} />
    </div>
  );
}

function Timeline({
  items,
  l,
  lang,
}: {
  items: CurriculumItem[];
  l: ReturnType<typeof useLang>["tr"]["lessons"];
  lang: Lang;
}) {
  return (
    <ol className="timeline-in relative mt-10 ml-1.5 border-l border-black/10 dark:border-white/10">
      {items.map((item, i) => (
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

          {item.teacherNote && (
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

          {item.topics[lang].length > 0 && (
            <div className="glass mt-5 rounded-3xl p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {l.topicsLabel}
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
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
        </li>
      ))}
    </ol>
  );
}
