"use client";

import { ArrowDown, Mail } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SITE } from "@/lib/content";
import { Portrait } from "@/components/Portrait";

export function Hero() {
  const { tr } = useLang();

  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      {/* Dekorativní pozadí (čistě CSS – naběhne okamžitě) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-accent-400/20 blur-[120px] dark:bg-accent-500/20" />
        <div className="absolute right-[-5%] top-[30%] h-[320px] w-[320px] rounded-full bg-accent-300/20 blur-[110px] dark:bg-accent-700/20" />
        <div className="absolute inset-0 text-black/[0.04] bg-dots dark:text-white/[0.05]" />
      </div>

      <div className="container-page grid items-center gap-12 pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:pb-14">
        <div>
          <span className="animate-fade-up glass-soft inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-accent-700 dark:text-accent-300">
            <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-accent-500" />
            {tr.hero.badge}
          </span>

          <h1
            className="animate-fade-up mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl"
            style={{ animationDelay: "0.06s" }}
          >
            {SITE.name}
          </h1>

          <p
            className="animate-fade-up mt-4 text-xl font-medium text-accent-700 dark:text-accent-400"
            style={{ animationDelay: "0.12s" }}
          >
            {tr.hero.role}
          </p>

          <p
            className="animate-fade-up mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 text-balance"
            style={{ animationDelay: "0.18s" }}
          >
            {tr.hero.tagline}
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "0.24s" }}
          >
            <a
              href="#vyuka"
              className="group inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-600/20 transition hover:bg-accent-500 hover:shadow-accent-500/30"
            >
              {tr.hero.ctaLessons}
              <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:text-zinc-100 dark:hover:text-accent-400"
            >
              <Mail className="h-4 w-4" />
              {tr.hero.ctaContact}
            </a>
          </div>
        </div>

        {/* Portrét */}
        <div
          className="animate-fade-up relative mx-auto w-full max-w-sm lg:max-w-md"
          style={{ animationDelay: "0.1s" }}
        >
          <Portrait className="aspect-[3/4] w-full" />
          <div
            aria-hidden
            className="absolute -bottom-4 -left-4 -z-10 h-40 w-40 rounded-3xl border border-accent-500/30"
          />
        </div>
      </div>

      {/* Scroll indikátor */}
      <a
        href="#about"
        className="container-page hidden items-center gap-2 pb-10 text-xs font-medium uppercase tracking-widest text-zinc-400 transition hover:text-accent-600 dark:hover:text-accent-400 sm:flex"
      >
        <ArrowDown className="h-4 w-4 animate-bounce" />
        {tr.hero.scroll}
      </a>
    </section>
  );
}
