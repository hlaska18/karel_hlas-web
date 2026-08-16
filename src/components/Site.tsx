import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BankSection } from "@/components/BankSection";
import { CrossSubject } from "@/components/CrossSubject";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import { getBankStats, getHeroPool } from "@/lib/heroPick";
import { t } from "@/lib/content";

/** Celý web na jedné stránce (one-page). Jazyk přichází z adresy (/ nebo /en). */
export function Site({ lang, items = [] }: { lang: Lang; items?: BankItem[] }) {
  // Dlaždice předmětů potřebují jen pár položek (Word, Excel). Filtrujeme tady,
  // v serverové komponentě – jinak by celá banka šla do klienta dvakrát.
  const crossTools = new Set(t[lang].cross.items.map((i) => i.tool).filter(Boolean));

  return (
    <LanguageProvider lang={lang}>
      {/* Jemný tečkovaný vzor za CELÝM webem (fixed = konzistentní při scrollu,
          dřív byl jen v Hero sekci a dál končil). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 text-black/[0.05] bg-dots dark:text-white/[0.07]"
      />
      <Header />
      <main id="main">
        <Hero pool={getHeroPool(items)} stats={getBankStats(items)} />
        <BankSection items={items} />
        <CrossSubject items={items.filter((i) => crossTools.has(i.tool))} />
        <About />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
