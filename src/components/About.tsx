"use client";

import Image from "next/image";
import { GraduationCap, Briefcase } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { BADGES, SITE } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionJump } from "@/components/SectionJump";
import { CurriculumBody } from "@/components/Curriculum";

export function About() {
  const { tr } = useLang();
  const a = tr.about;

  return (
    <section id="about" className="relative py-10 sm:py-14">
      {/* dekorativní pozadí pro sklo (dřív u samostatné sekce Výuka) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-6%] top-24 h-72 w-72 rounded-full bg-accent-400/15 blur-[120px] dark:bg-accent-600/20" />
        <div className="absolute right-[-6%] bottom-24 h-80 w-80 rounded-full bg-accent-300/15 blur-[130px] dark:bg-accent-700/15" />
      </div>

      <div className="container-page">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            {a.kicker}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {a.heading}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.45fr_0.55fr]">
          {/* Text */}
          <div className="flex flex-col">
            {/* Fotka + (text a odznaky) vedle sebe (na mobilu pod sebou). */}
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-10">
              <Reveal delay={0.05} className="shrink-0">
                <Image
                  src={SITE.photo}
                  alt={SITE.fullName}
                  width={733}
                  height={1100}
                  className="h-auto w-52 rounded-2xl object-cover shadow-md ring-1 ring-black/5 dark:ring-white/10 sm:w-72"
                />
              </Reveal>
              <div className="min-w-0 flex-1">
                <Reveal
                  delay={0.1}
                  className="space-y-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg"
                >
                  {a.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </Reveal>

                {/* Odznaky pod textem vedle fotky (menší, 2 řádky) – vyplní blok do výšky fotky. */}
                {BADGES.length > 0 && (
                  <div className="mt-7">
                    <Reveal delay={0.1}>
                      <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        {a.badgesTitle}
                      </p>
                    </Reveal>
                    <Reveal as="ul" stagger className="mt-3 flex flex-wrap items-center gap-3">
                      {BADGES.map((b) => {
                        const img = (
                          <Image
                            src={b.src}
                            alt={b.alt}
                            width={72}
                            height={72}
                            className={`h-12 w-12 sm:h-14 sm:w-14 ${
                              b.circle ? "rounded-full object-cover" : "object-contain"
                            } drop-shadow-sm`}
                          />
                        );
                        return (
                          <li key={b.src} className="transition hover:-translate-y-1">
                            {b.href ? (
                              <a
                                href={b.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={b.alt}
                                className="block cursor-pointer"
                              >
                                {img}
                              </a>
                            ) : (
                              <span title={b.alt} className="block">
                                {img}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </Reveal>
                  </div>
                )}
              </div>
            </div>

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

        {/* Ověřeno ve výuce – dřív samostatná sekce, teď součást „O mně" (jeden
            důvěryhodnostní blok: kdo jsem → co reálně učím), viz council. */}
        <div className="mt-16 border-t border-black/10 pt-12 dark:border-white/10 sm:mt-20 sm:pt-14">
          <CurriculumBody />
        </div>

        <SectionJump href="#contact" label={tr.nav.contact} className="mt-10 flex sm:mt-12" />
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
