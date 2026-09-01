import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BankSection } from "@/components/BankSection";
import { CrossSubject } from "@/components/CrossSubject";
import { AiHub } from "@/components/AiHub";
import { AiNastroje } from "@/components/AiNastroje";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import type { Vystup } from "@/lib/aihubLabels";
import { getBankStats, getHeroPool } from "@/lib/heroPick";
import { t } from "@/lib/content";

/** Celý web na jedné stránce (one-page). Jazyk přichází z adresy (/ nebo /en). */
export function Site({
  lang,
  items = [],
  vystupy = [],
}: {
  lang: Lang;
  items?: BankItem[];
  /** Ověřené výstupy do AI Hubu. Prázdné pole je normální stav – viz `aihub.ts`. */
  vystupy?: Vystup[];
}) {
  // Dlaždice předmětů potřebují jen pár položek (Word, Excel). Filtrujeme tady,
  // v serverové komponentě – jinak by celá banka šla do klienta dvakrát.
  const crossTools = new Set(t[lang].cross.items.map((i) => i.tool).filter(Boolean));

  return (
    <LanguageProvider lang={lang}>
      {/* Jemný tečkovaný vzor za CELÝM webem (fixed = konzistentní při scrollu,
          dřív byl jen v Hero sekci a dál končil).
          Po odstranění filmového zrna zůstal jedinou texturou, tak je ztlumený
          na náznak – z 0,05 na 0,03. Úplně vypnout ho jde smazáním tohohle
          bloku; nic jiného na něm nevisí. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-dots text-black/[0.03] dark:text-white/[0.045]"
      />
      <Header />
      <main id="main">
        <Hero pool={getHeroPool(items)} stats={getBankStats(items)} />
        <BankSection items={items} />
        <CrossSubject items={items.filter((i) => crossTools.has(i.tool))} />
        <AiHub vystupy={vystupy} />
        <AiNastroje />
        <About />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
