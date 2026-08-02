"use client";

import { ArrowRight, Info } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";

/**
 * „Nejen do informatiky" – hodiny z banky, které fungují i v jiných předmětech.
 *
 * Sekce schválně NEslibuje nové materiály, které neexistují: ukazuje na hodiny,
 * které v bance opravdu jsou, a říká, kam se hodí. Každá karta vede přímo na
 * rozbalenou lekci v bance (`?tema=…&lekce=…`), ne jen na téma.
 */
export function CrossSubject() {
  const { tr } = useLang();
  const c = tr.cross;

  const lessonHref = (tool: string, lesson?: number) => {
    const q = new URLSearchParams({ tema: tool });
    if (lesson != null) q.set("lekce", String(lesson));
    return `?${q.toString()}#banka`;
  };

  return (
    <section id="jinam" className="py-10 sm:py-14">
      <div className="container-page">
        <SectionHeader no="02" kicker={c.kicker} heading={c.heading} intro={c.intro} />

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {c.items.map((it, i) => (
            <Reveal as="li" key={it.title} delay={0.05 * i} className="flex">
              <a
                href={lessonHref(it.tool, it.lesson)}
                className="glass group flex w-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15 sm:p-6"
              >
                <h3 className="font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {it.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {it.what}
                </p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  {c.subjectsLabel}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {it.subjects.map((s) => (
                    <li
                      key={s}
                      className="rounded-md bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-300"
                    >
                      {s}
                    </li>
                  ))}
                </ul>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 transition group-hover:gap-2.5 dark:text-accent-300">
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            </Reveal>
          ))}
        </ul>

        {/* Poctivá poznámka: neslibujeme, co ještě není. */}
        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {c.note}
        </p>

        <SectionJump href="#about" label={tr.nav.about} />
      </div>
    </section>
  );
}
