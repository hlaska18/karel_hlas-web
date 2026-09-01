"use client";

import { ExternalLink, Images, Info, MessageSquare, Sparkles } from "lucide-react";

import { Reveal } from "@/components/Reveal";
import { SectionJump } from "@/components/SectionJump";
import { useLang } from "@/lib/i18n";

/**
 * Sekce „AI nástroje" – rozcestník po nástrojích, které učitel potká první.
 *
 * PROČ STOJÍ MIMO AI HUB. AI Hub je postavený na tom, že se tam dostane jen
 * to, co jsem sám vyzkoušel a změřil: „tipy na AI, které nikdo nezkusil,
 * najdeš na internetu tisíckrát". Katalog nevyzkoušených nástrojů by ten
 * slib zrušil. Proto je to vlastní sekce a proto začíná přiznáním, čím je
 * a čím není. Až něco z toho projde přípravou, přesune se to o sekci výš
 * i s časem, který to ušetřilo.
 *
 * ŽÁDNÉ HODNOCENÍ ANI POŘADÍ. Nástroje nejsou seřazené podle kvality –
 * kdybych je řadil, tvrdil bych tím něco, co jsem neměřil. Pořadí je od
 * nejnižšího prahu (česky, bez účtu) k nejvyššímu.
 *
 * `note` u každého nástroje drží konvenci celého webu: co člověka čeká po
 * kliknutí – účet, jazyk, limit, cookies. Ať to ví dřív, než klikne.
 */

const IKONY = {
  chat: MessageSquare,
  obraz: Images,
  trida: Sparkles,
} as const;

export function AiNastroje() {
  const { tr } = useLang();
  const c = tr.nastroje;

  return (
    <section id="ai-nastroje" className="sekce">
      <div className="container-page">
        <p className="font-sans text-xs font-semibold uppercase tracking-kicker text-accent-700 dark:text-accent-300">
          {c.kicker}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-nadpis text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {c.heading}
          <span className="glass-accent ml-3 inline-block whitespace-nowrap rounded-full px-3 py-1 align-middle font-sans text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
            {c.badge}
          </span>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {c.intro}
        </p>

        {/* Přiznání stojí NAD nástroji, ne pod nimi: kdo si sekci jen prolétne,
            musí ho vidět dřív, než začne klikat na odkazy. */}
        <p className="povrch mt-6 flex max-w-2xl items-start gap-2.5 rounded-karta p-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-700 dark:text-accent-300" />
          <span>{c.disclaimer}</span>
        </p>

        <div className="mt-10 space-y-10">
          {c.items.map((kat, i) => {
            const Ikona = IKONY[kat.icon];
            return (
              <Reveal key={kat.kategorie} delay={0.05 * i}>
                {/* `items-start`, ne `items-center`: popis kategorie se na úzkém
                    okně zalomí do tří řádků a vystředěná ikona by pak stála
                    u popisu místo u nadpisu, ke kterému patří. */}
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ovladac bg-black/[0.04] text-accent-700 dark:bg-white/5 dark:text-accent-300">
                    <Ikona className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold tracking-podnadpis text-zinc-900 dark:text-zinc-50">
                      {kat.kategorie}
                    </h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {kat.what}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {kat.tools.map((n) => (
                    <li key={n.name} className="flex">
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="povrch group flex w-full flex-col rounded-karta p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-display text-base font-semibold tracking-podnadpis text-zinc-900 dark:text-zinc-50">
                            {n.name}
                          </span>
                          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition group-hover:text-accent-700 dark:group-hover:text-accent-300" />
                        </span>
                        <span className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {n.why}
                        </span>
                        {/* Poznámka je vizuálně oddělená a drobnější – je to
                            varování, ne součást lákadla. */}
                        <span className="mt-3 border-t border-black/[0.06] pt-3 text-xs leading-relaxed text-zinc-500 dark:border-white/10 dark:text-zinc-500">
                          {n.note}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <a
              href={c.creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2 transition hover:text-accent-700 dark:hover:text-accent-300"
            >
              {c.credit}
            </a>
          </span>
        </p>

        <SectionJump href="#about" label={tr.nav.about} />
      </div>
    </section>
  );
}
