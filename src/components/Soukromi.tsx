"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { LanguageProvider, useLang } from "@/lib/i18n";
import { sazba } from "@/lib/sazba";
import type { Lang } from "@/lib/content";

/**
 * Stránka o zpracování údajů.
 *
 * SAMOSTATNÁ STRÁNKA, i když je web jinak one-page. Sekce homepage se čtou
 * při procházení; tohle se otevírá, když někdo hledá konkrétní odpověď —
 * z patičky nebo ze zamykací obrazovky prostředí. Jako sekce by to buď
 * odsunulo materiály, nebo se schovalo úplně dole, kam nikdo nedojde.
 *
 * ŽÁDNÝ VLASTNÍ DESIGN. Jeden sloupec textu, nadpisy a odstavce. Právní text,
 * který se snaží vypadat zajímavě, působí jako by něco zakrýval; tenhle nemá
 * co skrývat, protože web o návštěvníkovi nic neukládá.
 *
 * Text žije v `content.ts` (klíč `soukromi`), aby prošel stejným překladem
 * i sazbou jako zbytek webu — hlavně `sazba()`, jinak by tu jako na jediné
 * stránce chyběly pevné mezery.
 */

function Obsah() {
  const { tr, lang } = useLang();
  const s = tr.soukromi;

  return (
    <main className="sekce">
      <div className="container-page max-w-[46rem]">
        <Link
          href={lang === "en" ? "/en" : "/"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 transition hover:gap-2 dark:text-accent-300"
        >
          <ArrowLeft className="h-4 w-4" />
          {s.zpet}
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold tracking-nadpis text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {s.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {sazba(s.intro, lang)}
        </p>

        <div className="mt-10 space-y-8">
          {s.sekce.map((sek) => (
            <section key={sek.nadpis}>
              <h2 className="font-display text-lg font-semibold tracking-podnadpis text-zinc-900 dark:text-zinc-50">
                {sek.nadpis}
              </h2>
              <div className="mt-2 space-y-3">
                {sek.odstavce.map((o, i) => (
                  <p key={i} className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {sazba(o, lang)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-black/[0.08] pt-6 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
          {s.updated}
        </p>
      </div>
    </main>
  );
}

export function Soukromi({ lang }: { lang: Lang }) {
  return (
    <LanguageProvider lang={lang}>
      <Obsah />
    </LanguageProvider>
  );
}
