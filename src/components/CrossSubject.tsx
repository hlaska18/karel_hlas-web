"use client";

import Image from "next/image";
import { ArrowRight, Info, Plus } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SITE } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";

/**
 * „Nejen do informatiky" – dlaždice PŘEDMĚTŮ, ne témat informatiky.
 *
 * Proč dlaždice a ne popisné karty: oba cíloví učitelé v councilu shodně
 * řekli, že nadpis „Word – práce s textem" čtou jako název programu, kdežto
 * „ČEŠTINA" na dlaždici je věta „někdo myslel na mě".
 *
 * Vědomé odchylky od dlaždic v bance (aby to nečetli jako její pokračování):
 *  - menší ikona a užší dlaždice,
 *  - MÍSTO počtu materiálů jeden řádek „co v tom je" – nad touhle sekcí svítí
 *    „33 materiálů", takže „2 materiály" by fungovaly jako rozsudek,
 *  - poslední dlaždice je výzva ke sdílení, takže mřížka nezeje prázdnotou.
 */
export function CrossSubject() {
  const { tr } = useLang();
  const c = tr.cross;

  return (
    <section id="jinam" className="py-10 sm:py-14">
      <div className="container-page">
        <SectionHeader
          no="02"
          kicker={c.kicker}
          intro={c.intro}
          heading={
            <>
              {c.heading}
              {/* Přiznaný stav rovnou u nadpisu, ne poznámkou pod čarou –
                  „nová sekce" se čte jako živá, mlčení jako zanedbaná. */}
              <span className="glass-accent ml-3 inline-block whitespace-nowrap rounded-full px-3 py-1 align-middle font-sans text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                {c.badge}
              </span>
            </>
          }
        />

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((it, i) => (
            <Reveal as="li" key={it.subject} delay={0.05 * i} className="flex">
              <a
                href={`?tema=${encodeURIComponent(it.tool)}#banka`}
                className="glass group flex w-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center">
                    <Image
                      src={`/images/subjects/${it.icon}.png`}
                      alt=""
                      width={224}
                      height={224}
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {it.subject}
                  </span>
                </span>

                <span className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {it.what}
                </span>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 transition group-hover:gap-2.5 dark:text-accent-300">
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            </Reveal>
          ))}

          {/* Výzva jako plnohodnotná dlaždice: mřížka je celá a sběr od kolegů
              je vidět tam, kde se člověk rozhoduje. */}
          <Reveal as="li" delay={0.05 * c.items.length} className="flex">
            <a
              href={`mailto:${SITE.email}`}
              className="glass-soft group flex w-full flex-col rounded-2xl border border-dashed border-black/10 p-5 transition hover:-translate-y-0.5 dark:border-white/15"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-zinc-400 dark:bg-white/5 dark:text-zinc-500">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="font-display text-lg font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
                  {c.inviteTitle}
                </span>
              </span>
              <span className="mt-3 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {c.inviteText}
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition group-hover:gap-2.5 group-hover:text-accent-700 dark:text-zinc-300 dark:group-hover:text-accent-300">
                {SITE.email} <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>
        </ul>

        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {c.note}
        </p>

        <SectionJump href="#about" label={tr.nav.about} />
      </div>
    </section>
  );
}
