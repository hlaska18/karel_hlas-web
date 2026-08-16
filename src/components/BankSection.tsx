"use client";

import { Info } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import { BankBrowser } from "@/components/BankBrowser";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";

// Slib musí sedět na licenci v patičce (CC BY-NC-SA 4.0), jinak si web
// protiřečí: dřív tu stálo „volně použij“ a dole „všechna práva vyhrazena“.
const STR: Record<Lang, { license: string }> = {
  cs: {
    license:
      "Materiály zde volně použij i uprav pro svou výuku. Platí licence CC BY-NC-SA 4.0: " +
      "uveď autora, nepoužívej komerčně a co z nich vytvoříš, sdílej dál za stejných podmínek. " +
      "Cvičebnice jiných autorů tu nehostuju – vede k nim jen odkaz na původní zdroj.",
  },
  en: {
    license:
      "All materials are currently in Czech. Feel free to use, translate and adapt them for your own " +
      "teaching under CC BY-NC-SA 4.0: credit the author, no commercial use, and share whatever you " +
      "build on the same terms. Workbooks by other authors aren't hosted here – you'll only find " +
      "a link to the original.",
  },
};

/**
 * Plná banka materiálů přímo na homepage (one-page design) – dřív žila na
 * samostatné stránce /pro-ucitele, ta teď jen přesměrovává sem (#banka).
 */
export function BankSection({ items }: { items: BankItem[] }) {
  const { lang, tr } = useLang();
  const m = tr.materials;

  return (
    <section id="banka" className="relative py-10 sm:py-14">
      <div className="container-page">
        <SectionHeader no="01" kicker={m.kicker} heading={m.heading} intro={m.sub} />

        <div className="mt-8">
          <BankBrowser items={items} lang={lang} />
        </div>

        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {STR[lang].license}
        </p>

        <SectionJump href="#jinam" label={tr.cross.kicker} />
      </div>
    </section>
  );
}
