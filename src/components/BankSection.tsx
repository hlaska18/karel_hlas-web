"use client";

import { Info } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { sazba } from "@/lib/sazba";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import { BankBrowser } from "@/components/BankBrowser";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";

// Slib musí sedět na licenci v patičce (CC BY-NC-SA 4.0), jinak si web
// protiřečí: dřív tu stálo „volně použij“ a dole „všechna práva vyhrazena“.
//
// A musí sedět i na tom, co tu doopravdy leží. Věta „cizí cvičebnice tu
// nehostuju“ dřív platila jen zpola: zdrojový balíček AI Fluency hostovaný byl.
// Po jeho odstranění (téma AI je nově jen odkaz na kurz Elements of AI) už tu
// není žádné cizí dílo – výjimka z věty tedy zmizela i z textu.
const STR: Record<Lang, { license: string }> = {
  cs: {
    license:
      "Materiály zde volně použij i uprav pro svou výuku. Platí licence CC BY-NC-SA 4.0: " +
      "uveď autora, nepoužívej komerčně a co z nich vytvoříš, sdílej dál za stejných podmínek. " +
      "Cizí materiály tu nehostuju, vede k nim jen odkaz na původní zdroj a jeho autory.",
  },
  en: {
    license:
      "All materials are currently in Czech. Feel free to use, translate and adapt them for your own " +
      "teaching under CC BY-NC-SA 4.0: credit the author, no commercial use, and share whatever you " +
      "build on the same terms. Material by other authors is only linked, never hosted here – the link " +
      "goes to the original source and its authors.",
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
    <section id="banka" className="sekce relative">
      <div className="container-page">
        <SectionHeader no="01" kicker={m.kicker} heading={m.heading} intro={sazba(m.sub, lang)} />

        <div className="mt-8">
          <BankBrowser items={items} lang={lang} />
        </div>

        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {sazba(STR[lang].license, lang)}
        </p>

        <SectionJump href="#jinam" label={tr.cross.kicker} />
      </div>
    </section>
  );
}
