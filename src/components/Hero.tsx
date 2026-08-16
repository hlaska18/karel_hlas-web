"use client";

import { ArrowDown, Library } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Typewriter } from "@/components/Typewriter";
import { HeroPreview } from "@/components/HeroPreview";
import { Ctenie } from "@/components/Ctenie";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import type { BankItem } from "@/lib/materials";

export function Hero({
  pool = [],
  stats,
}: {
  /** Kandidáti do stohu karet vedle nadpisu (losuje se z nich v prohlížeči). */
  pool?: BankItem[];
  /** Reálná čísla z banky pro důkazní řádek. */
  stats?: { files: number; topics: number };
}) {
  const { tr } = useLang();

  // „{files} souborů · {topics} témat · Word, PDF, Python" → části mezi „·"
  // se vykreslí jako samostatné položky (čísla přijdou z reálné banky).
  const statsParts = stats
    ? tr.hero.stats
        .replace("{files}", String(stats.files))
        .replace("{topics}", String(stats.topics))
        .split("·")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="container-page pb-12 lg:pb-16">
        <div className="flex items-start justify-between gap-14">
          <div className="max-w-3xl">
            {/* Nadpis se vypisuje jako na psacím stroji; `aria-label` nese
                celou větu, takže čtečka ji přečte naráz (animace je aria-hidden). */}
            <h1
              aria-label={tr.hero.headline}
              className="font-display text-5xl font-bold leading-[1.07] tracking-tight sm:text-7xl"
            >
              <Typewriter text={tr.hero.headline} />
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 text-balance">
              {tr.hero.tagline}
            </p>

            {/* Důkaz místo přídavných jmen: kolik toho tu opravdu je. */}
            {statsParts.length > 0 && (
              <ul className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {statsParts.map((part, i) => (
                  <li key={part} className="flex items-center gap-3">
                    {i > 0 && (
                      <span aria-hidden className="h-1 w-1 rounded-full bg-accent-500/60" />
                    )}
                    {part}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8">
              <InteractiveHoverButton
                href="#banka"
                text={tr.hero.ctaLessons}
                icon={<Library className="h-4 w-4" />}
              />
            </div>

            <p className="mt-7 text-sm text-zinc-500 dark:text-zinc-400">{tr.hero.byline}</p>
          </div>

          {/* Pravý sloupec: ukázkové karty a pod nimi odkazy na čtení.
              Na mobilu se celý skrývá – tam se počítá každý pixel nad ohybem
              a tlačítko k materiálům musí zůstat vidět bez scrollování. */}
          <div className="hidden w-[22rem] shrink-0 flex-col gap-6 lg:flex">
            <HeroPreview pool={pool} />
            <Ctenie />
          </div>
        </div>
      </div>

      {/* Scroll indikátor */}
      <a
        href="#banka"
        className="container-page hidden items-center gap-2 pb-10 text-xs font-medium uppercase tracking-widest text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400 dark:hover:text-accent-400 sm:flex"
      >
        <ArrowDown className="h-4 w-4 animate-bounce" />
        {tr.hero.scroll}
      </a>
    </section>
  );
}
