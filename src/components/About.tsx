"use client";

import { GraduationCap, Briefcase } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";
import { SectionJump } from "@/components/SectionJump";

export function About() {
  const { tr } = useLang();
  const a = tr.about;

  return (
    <section id="about" className="relative py-10 sm:py-14">
      <div className="container-page">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            {a.kicker}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {a.heading}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Text */}
          <div className="flex flex-col">
            <Reveal
              delay={0.05}
              className="space-y-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg"
            >
              {a.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Reveal>

            <div className="mt-8">
              <Reveal delay={0.1}>
                <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {a.interestsTitle}
                </p>
              </Reveal>
              <Reveal as="ul" stagger className="mt-4 flex flex-wrap gap-2.5">
                {a.interests.map((tag) => (
                  <li
                    key={tag}
                    className="glass-soft rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200 dark:hover:text-accent-400"
                  >
                    {tag}
                  </li>
                ))}
              </Reveal>
            </div>

            {/* KONTAKT zarovnaný na spodek (desktop) – levý sloupec se roztáhne
                na výšku pravého, takže spodní hrana = spodek boxu Praxe. */}
            <SectionJump
              href="#contact"
              label={tr.nav.contact}
              className="mt-auto hidden pt-12 lg:flex"
            />
          </div>

          {/* Timeline */}
          <div className="space-y-8">
            <Reveal delay={0.1}>
              <TimelineGroup
                icon={<GraduationCap className="h-5 w-5" />}
                title={a.eduTitle}
                items={a.education}
              />
            </Reveal>
            <Reveal delay={0.18}>
              <TimelineGroup
                icon={<Briefcase className="h-5 w-5" />}
                title={a.expTitle}
                items={a.experience}
              />
            </Reveal>
          </div>
        </div>
        {/* mobil: KONTAKT až pod vším */}
        <SectionJump
          href="#contact"
          label={tr.nav.contact}
          className="mt-10 flex sm:mt-12 lg:hidden"
        />
      </div>
    </section>
  );
}

function TimelineGroup({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: { period: string; place: string; detail: string }[];
}) {
  return (
    <div className="glass rounded-3xl p-6 sm:p-7">
      <div className="flex items-center gap-2.5 text-accent-600 dark:text-accent-400">
        {icon}
        <h3 className="font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h3>
      </div>
      <ol className="mt-5 space-y-5 border-l border-black/10 pl-5 dark:border-white/10">
        {items.map((it, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent-500 ring-4 ring-[var(--bg-soft)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-600 dark:text-accent-400">
              {it.period}
            </p>
            <p className="mt-0.5 font-medium text-zinc-900 dark:text-white">{it.place}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{it.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
