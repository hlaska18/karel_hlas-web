"use client";

import Image from "next/image";
import { GraduationCap, Briefcase } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { sazba } from "@/lib/sazba";
import { BADGES, SITE } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { CasovaOsa } from "@/components/CasovaOsa";
import { SectionJump } from "@/components/SectionJump";
import { SectionHeader } from "@/components/SectionHeader";

export function About() {
  const { tr, lang } = useLang();
  const a = tr.about;

  return (
    <section id="about" className="sekce">
      <div className="container-page">
        {/* Jeden sloupec. Dřív tu byla mřížka [1.45fr 0.55fr] s časovou osou
            v tom úzkém pravém – jenže na 340 px se jedenáct let vodorovně
            nevejde a sloupce se rozcházely (změřeno 2601 proti 572 px).
            Osa je teď pod fotkou přes celou šířku. */}
        <div>
          <div className="flex flex-col">
            <SectionHeader
              no="04"
              kicker={a.kicker}
              heading={a.heading}
              headingClassName="mt-3 max-w-2xl font-display text-3xl font-bold tracking-nadpis text-balance sm:text-4xl"
            />

            {/* Fotka + bio vedle sebe (na mobilu pod sebou). */}
            <div className="mt-12 flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-10">
              <Reveal delay={0.05} className="shrink-0">
                <Image
                  src={SITE.photo}
                  alt={SITE.fullName}
                  width={733}
                  height={1100}
                  className="h-auto w-56 rounded-karta object-cover shadow-md ring-1 ring-black/5 dark:ring-white/10 sm:w-80"
                />
              </Reveal>
              <Reveal
                delay={0.1}
                className="min-w-0 flex-1 space-y-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg"
              >
                {a.paragraphs.map((p, i) => (
                  <p key={i}>{sazba(p, lang)}</p>
                ))}
              </Reveal>
            </div>

            {/* Časová osa studia a praxe – přes celou šířku pod fotkou a bio. */}
            <Reveal delay={0.12}>
              <CasovaOsa />
            </Reveal>

            {/* Certifikáty a odznaky – přes celou šířku pod fotkou a bio. */}
            {BADGES.length > 0 && (
              <div className="mt-10">
                <Reveal delay={0.1}>
                  <p className="text-sm font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
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
              sizes="72px"
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
        </div>

        <SectionJump href="#contact" label={tr.nav.contact} className="mt-10 flex sm:mt-12" />
      </div>
    </section>
  );
}
