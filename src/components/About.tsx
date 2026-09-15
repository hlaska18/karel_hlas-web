"use client";

import Image from "next/image";
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
        {/* Nadpis je NAD mřížkou, ne uvnitř levého sloupce. Karel chce, aby
            osa lícovala s fotkou – a to jde spolehlivě jen tehdy, když oba
            sloupce začínají na stejné výšce a oba si od ní odsadí stejně
            (`mt-12`). Dokud byl nadpis uvnitř levého sloupce, musel by se
            pravý odsazovat o výšku nadpisu, která se mění s jazykem
            i šířkou okna – tedy konstantou, která se dřív nebo později
            rozejde. */}
        <SectionHeader
          no="04"
          kicker={a.kicker}
          heading={a.heading}
          headingClassName="mt-3 max-w-2xl font-display text-3xl font-bold tracking-nadpis text-balance sm:text-4xl"
        />

        <div className="grid gap-12 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="flex flex-col">
            {/* Fotka + bio vedle sebe (na mobilu pod sebou). */}
            <div className="mt-12 flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-10">
              <Reveal delay={0.05} className="shrink-0">
                <Image
                  src={SITE.photo}
                  alt={SITE.fullName}
                  width={733}
                  height={1100}
                  className="foto-o-mne w-56 rounded-karta object-cover shadow-md ring-1 ring-black/5 dark:ring-white/10 sm:w-80"
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

          {/* Časová osa lícuje nahoře s nadpisem. Dole ji NEROZTAHUJEME:
              obsah obou sloupců je různě vysoký, takže vynucené zarovnání
              spodků jen přesune prázdno jinam. Sloupec skončí, kde skončí. */}
          <div className="lg:mt-12">
            <Reveal delay={0.1}>
              <CasovaOsa />
            </Reveal>
          </div>
        </div>

        <SectionJump href="#contact" label={tr.nav.contact} className="mt-10 flex sm:mt-12" />
      </div>
    </section>
  );
}
