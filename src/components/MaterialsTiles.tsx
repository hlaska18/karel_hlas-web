"use client";

import Link from "next/link";
import { Files, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";
import { toolLabel, countMaterials } from "@/lib/bankLabels";
import { ToolGlassIcon, hasToolGlassIcon } from "@/components/ToolGlassIcon";

/** Dlaždice oborů na homepage = „ochutnávka" banky; proklik rovnou na obor. */
export function MaterialsTiles({
  tiles,
}: {
  tiles: { tool: string; count: number; hasTeacher: boolean }[];
}) {
  const { lang, tr } = useLang();
  const m = tr.materials;
  const bankHref = lang === "en" ? "/en/pro-ucitele" : "/pro-ucitele";
  if (!tiles.length) return null;

  return (
    <section id="banka" className="relative py-10 sm:py-14">
      <div className="container-page">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            {m.kicker}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {m.heading}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {m.sub}
          </p>
        </Reveal>

        <Reveal as="ul" stagger className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {tiles.map((t) => {
            return (
              <li key={t.tool}>
                <Link
                  href={`${bankHref}?tema=${encodeURIComponent(t.tool)}`}
                  className="glass group flex h-full flex-col items-start gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15"
                >
                  {hasToolGlassIcon(t.tool) ? (
                    <ToolGlassIcon tool={t.tool} />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600 transition group-hover:bg-accent-600 group-hover:text-white dark:text-accent-300">
                      <Files className="h-6 w-6" />
                    </span>
                  )}
                  <span className="font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {toolLabel(t.tool, lang)}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {countMaterials(t.count, lang)}
                  </span>
                  {!t.hasTeacher && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {lang === "en" ? "worksheets only" : "zatím bez metodiky"}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </Reveal>

        <Reveal delay={0.1}>
          <Link
            href={bankHref}
            className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 transition hover:text-accent-600 dark:text-accent-300 dark:hover:text-accent-400"
          >
            {m.browseAll}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
