"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { COURSES, type Material, type Lang, type CurriculumItem } from "@/lib/content";
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
                      open ? "rotate-180 text-accent-600 dark:text-accent-400" : "text-zinc-400"
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

        {/* časové osy – plynulé „roztažení" přes CSS grid-rows (bez JS knihovny) */}
        <div>
          {COURSES.map((course) => {
            const open = openId === course.id;
            return (
              <div
                key={course.id}
                id={`osa-${course.id}`}
                className={`grid transition-[grid-template-rows] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <Timeline items={course.items} l={l} lang={lang} />
                </div>
              </div>
            );
          })}
        </div>

        <SectionJump href="#top" label={tr.footer.top} direction="up" />
      </div>
    </section>
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
    <ol className="relative mt-10 ml-1.5 border-l border-black/10 dark:border-white/10">
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
            <p className="mt-2 flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
              <span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                  {l.goalLabel}:
                </span>{" "}
                {item.goal[lang]}
              </span>
            </p>
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
              {item.materials.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {item.materials.map((mat, k) => {
                    const ready = Boolean(mat.href) && mat.href !== "#";
                    return (
                      <li key={k}>
                        {ready ? (
                          <a
                            href={mat.href}
                            target={mat.href.startsWith("http") ? "_blank" : undefined}
                            rel={mat.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="glass-soft group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200 dark:hover:text-accent-400"
                          >
                            <span className="text-accent-500">
                              <MaterialIcon kind={mat.kind} />
                            </span>
                            <span className="flex-1">{mat.label[lang]}</span>
                            <ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                          </a>
                        ) : (
                          <span className="flex items-center gap-3 rounded-xl border border-dashed border-black/10 px-3.5 py-2.5 text-sm text-zinc-400 dark:border-white/10 dark:text-zinc-500">
                            <MaterialIcon kind={mat.kind} />
                            <span className="flex-1">{mat.label[lang]}</span>
                            <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                              {l.soon}
                            </span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-black/10 px-3.5 py-3 text-sm text-zinc-400 dark:border-white/10 dark:text-zinc-500">
                  {l.noMaterials}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
