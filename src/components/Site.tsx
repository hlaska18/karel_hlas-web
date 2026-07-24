import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BankSection } from "@/components/BankSection";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import type { Lang } from "@/lib/content";
import { getBankStats, getHeroHighlights, type BankItem } from "@/lib/materials";

/** Celý web na jedné stránce (one-page). Jazyk přichází z adresy (/ nebo /en). */
export function Site({ lang, items = [] }: { lang: Lang; items?: BankItem[] }) {
  return (
    <LanguageProvider lang={lang}>
      {/* Jemný tečkovaný vzor za CELÝM webem (fixed = konzistentní při scrollu,
          dřív byl jen v Hero sekci a dál končil). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 text-black/[0.04] bg-dots dark:text-white/[0.05]"
      />
      <Header />
      <main id="main">
        <Hero highlights={getHeroHighlights(items)} stats={getBankStats(items)} />
        <BankSection items={items} />
        <About />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
