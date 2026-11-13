"use client";

/**
 * Sekce pro školní poradenská pracoviště (Karel 13. 11. 2026).
 *
 * Na rozdíl od karet v AI Hubu je tu popis rovnou vidět: Karel chtěl u nástroje
 * napsat, co to je a jak to použít. Nástrojů je zatím málo, takže karta smí být
 * široká. Příkazy v textech jsou mezi zpětnými apostrofy a kreslí se jako kód.
 */

import { Compass, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

import { useLang } from "@/lib/i18n";
import { sazba } from "@/lib/sazba";
import { overenoText, type Lang } from "@/lib/content";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";

/** Text se `zpětnými apostrofy` kolem příkazů → příkazy jako <code>. */
function sKodem(text: string, lang: Lang): ReactNode[] {
  return text.split("`").map((kus, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="whitespace-nowrap rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:bg-white/10 dark:text-zinc-100"
      >
        {kus}
      </code>
    ) : (
      <span key={i}>{sazba(kus, lang)}</span>
    ),
  );
}

function Popisek({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">{children}</p>
  );
}

export function Poradenstvi() {
  const { tr, lang } = useLang();
  const p = tr.poradenstvi;

  return (
    <section id="poradenstvi" className="sekce">
      <div className="container-page">
        <SectionHeader no="04" kicker={p.kicker} heading={p.heading} intro={sazba(p.intro, lang)} />

        <div className="mt-10 space-y-10">
          {p.items.map((kat) => (
            <div key={kat.kategorie}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ovladac bg-black/[0.04] text-accent-700 dark:bg-white/5 dark:text-accent-300">
                  <Compass className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold tracking-podnadpis text-zinc-900 dark:text-zinc-50">
                    {kat.kategorie}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {sazba(kat.what, lang)}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-4">
                {kat.tools.map((n) => (
                  <li key={n.name} className="povrch dlazdice max-w-5xl rounded-karta p-5 sm:p-6">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2"
                    >
                      <span className="font-display text-xl font-semibold tracking-podnadpis text-zinc-900 transition group-hover:text-accent-700 dark:text-zinc-50 dark:group-hover:text-accent-300">
                        {n.name}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-accent-700 dark:group-hover:text-accent-300" />
                    </a>

                    <div className="mt-4">
                      <Popisek>{p.labelCo}</Popisek>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{sazba(n.co, lang)}</p>
                    </div>

                    <div className="mt-5 grid gap-6 lg:grid-cols-2">
                      <div>
                        <Popisek>{p.labelJak}</Popisek>
                        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-700 marker:text-zinc-500 dark:text-zinc-300">
                          {n.kroky.map((k) => (
                            <li key={k} className="break-words">
                              {sKodem(k, lang)}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="space-y-5">
                        <div>
                          <Popisek>{p.labelPouziti}</Popisek>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {sazba(n.pouziti, lang)}
                          </p>
                        </div>
                        <div>
                          <Popisek>{p.labelPozor}</Popisek>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {sazba(n.pozor, lang)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 text-xs text-zinc-500 dark:text-zinc-400">{overenoText(n.overeno, lang)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <SectionJump href="#about" label={tr.nav.about} />
      </div>
    </section>
  );
}
