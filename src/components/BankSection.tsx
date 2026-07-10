"use client";

import { Info } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import { BankBrowser } from "@/components/BankBrowser";
import { Reveal } from "@/components/Reveal";
import { SectionKicker } from "@/components/SectionKicker";

const STR: Record<Lang, { license: string }> = {
  cs: {
    license: "Materiály zde volně použij i uprav pro svou výuku.",
  },
  en: {
    license: "Feel free to use and adapt these materials for your own teaching.",
  },
};

/**
 * Plná banka materiálů přímo na homepage (one-page design) — dřív žila na
 * samostatné stránce /pro-ucitele, ta teď jen přesměrovává sem (#banka).
 */
export function BankSection({ items }: { items: BankItem[] }) {
  const { lang, tr } = useLang();
  const m = tr.materials;

  return (
    <section id="banka" className="relative py-10 sm:py-14">
      <div className="container-page">
        <Reveal>
          <SectionKicker no="01">{m.kicker}</SectionKicker>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {m.heading}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {m.sub}
          </p>
        </Reveal>

        <div className="mt-8">
          <BankBrowser items={items} lang={lang} />
        </div>

        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {STR[lang].license}
        </p>
      </div>
    </section>
  );
}
