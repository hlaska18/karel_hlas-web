"use client";

import Image from "next/image";
import { GraduationCap, Briefcase } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { BADGES, SITE } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionJump } from "@/components/SectionJump";
import { SectionHeader } from "@/components/SectionHeader";

export function About() {
  const { tr } = useLang();
  const a = tr.about;

  return (
    <section id="about" className="py-10 sm:py-14">
      <div className="container-page">
        {/* Nadpis je uvnitř levého sloupce, aby pravý sloupec mohl začít nahoře
            u nadpisu a skončit dole u odznaků. Kdyby byl nad mřížkou, časová
            osa by začínala až pod ním a na široké obrazovce by „ujížděla". */}
        <div className="grid gap-12 lg:grid-cols-[1.45fr_0.55fr]">
          {/* Text */}
          <div className="flex flex-col">
            <SectionHeader
              no="02"
              kicker={a.kicker}
              heading={a.heading}
              headingClassName="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl"
            />

            {/* Fotka + bio vedle sebe (na mobilu pod sebou). */}
            <div className="mt-12 flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-10">
              <Reveal delay={0.05} className="shrink-0">
                <Image
                  src={SITE.photo}
                  alt={SITE.fullName}
                  width={733}
                  height={1100}
                  className="h-auto w-56 rounded-2xl object-cover shadow-md ring-1 ring-black/5 dark:ring-white/10 sm:w-80"
                />
              </Reveal>
              <Reveal
                delay={0.1}
                className="min-w-0 flex-1 space-y-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg"
              >
                {a.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Reveal>
            </div>

            {/* Certifikáty a odznaky – přes celou šířku pod fotkou a bio. */}
            {BADGES.length > 0 && (
              <div className="mt-10">
                <Reveal delay={0.1}>
                  <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    {a.badgesTitle}
                  </p>
                </Reveal>
                <Reveal as="ul" stagger className="mt-4 flex flex-wrap items-center gap-4">
                  {BADGES.map((b) => {
                    const img = (
                      <Image
                        src={b.src}
                        alt={b.alt}
                        width={72}
                        height={72}
                        className={`h-14 w-14 sm:h-16 sm:w-16 ${
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

          {/* Časová osa lícuje nahoře s nadpisem. Dole ji NEROZTAHUJEME:
              obsah obou sloupců je různě vysoký, takže vynucené zarovnání
              spodků jen přesune prázdno jinam – buď do mezery mezi karty,
              nebo dovnitř karty. Sloupec prostě skončí, kde skončí. */}
          <div className="flex flex-col gap-6 lg:mt-9">
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
