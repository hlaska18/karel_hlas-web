"use client";

import { ArrowDown, ArrowRight, Library } from "lucide-react";
import { useLang } from "@/lib/i18n";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

export function Hero() {
  const { lang, tr } = useLang();
  const bankHref = lang === "en" ? "/en/pro-ucitele" : "/pro-ucitele";

  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      {/* Dekorativní pozadí (čistě CSS) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-accent-400/20 blur-[120px] dark:bg-accent-500/20" />
        <div className="absolute right-[-5%] top-[30%] h-[320px] w-[320px] rounded-full bg-accent-300/20 blur-[110px] dark:bg-accent-700/20" />
        <div className="absolute inset-0 text-black/[0.04] bg-dots dark:text-white/[0.05]" />
      </div>

      <div className="container-page pb-12 lg:pb-16">
        <div className="max-w-3xl">
          <span className="glass-soft inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-accent-700 dark:text-accent-300">
            <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-accent-500" />
            {tr.hero.badge}
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.07] tracking-tight text-balance sm:text-6xl">
            {tr.hero.headline}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 text-balance">
            {tr.hero.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InteractiveHoverButton
              href={bankHref}
              text={tr.hero.ctaLessons}
              icon={<Library className="h-4 w-4" />}
            />
            <InteractiveHoverButton
              href="#about"
              text={tr.hero.ctaContact}
              icon={<ArrowRight className="h-4 w-4" />}
            />
          </div>

          <p className="mt-7 text-sm text-zinc-500 dark:text-zinc-400">{tr.hero.byline}</p>
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
