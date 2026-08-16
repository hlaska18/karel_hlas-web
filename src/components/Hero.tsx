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
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-32">
      {/* Malachitový nádech za úvodem. Bez něj byla první obrazovka plochá –
          v tmavém tématu skoro černá – a barva webu se objevila až u tlačítka.
          Stránka 404 tenhle prvek má a odkazuje se na „hlavní stránku“, takže
          se tím zároveň srovnává rozpor.
          `isolate` na sekci je nutné: bez vlastního stohovacího kontextu by
          `-z-10` propadlo pod pozadí stránky a záře by nebyla vidět. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-22%] h-[460px] w-[460px] rounded-full bg-accent-300/20 blur-[120px] dark:bg-accent-500/[0.10]" />
        <div className="absolute right-[-8%] top-[6%] h-[380px] w-[380px] rounded-full bg-accent-200/25 blur-[110px] dark:bg-accent-600/[0.09]" />
      </div>

      {/* Menší mezera pod sloupci = šipka „Materiály" sedí blíž obsahu.
          S vyšším pravým sloupcem se odsunula moc nízko. */}
      <div className="container-page pb-6 lg:pb-8">
        {/* Svisle na střed, ne k hornímu okraji: pravý sloupec s kartami
            a články je o víc než 200 px vyšší než text vlevo, takže při
            zarovnání nahoru zůstávala pod bylinou díra. Takhle se prázdno
            rozdělí nad a pod text a čte se jako vzduch, ne jako chybějící
            obsah. Na mobilu je pravý sloupec skrytý, tam se nic nemění. */}
        <div className="flex items-center justify-between gap-14">
          <div className="max-w-3xl">
            {/* Nadpis se vypisuje jako na psacím stroji; `aria-label` nese
                celou větu, takže čtečka ji přečte naráz (animace je aria-hidden). */}
            <h1
              aria-label={tr.hero.headline}
              className="font-display text-5xl font-bold leading-[1.07] tracking-tight sm:text-7xl"
            >
              <Typewriter text={tr.hero.headline} />
            </h1>

            {/* Hlavní věta úvodu snese víc než popisková šeď: v tmavém tématu
                zinc-300 místo zinc-400 (kontrast 7,6 → 12 : 1). Menší řádky
                pod ní zůstávají tlumené, ať hierarchie drží. */}
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 text-balance">
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
          <div className="hidden w-[22rem] shrink-0 flex-col gap-5 lg:flex">
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
