import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BankSection } from "@/components/BankSection";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Curriculum } from "@/components/Curriculum";
import { Footer } from "@/components/Footer";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";

/** Celý web na jedné stránce (one-page). Jazyk přichází z adresy (/ nebo /en). */
export function Site({ lang, items = [] }: { lang: Lang; items?: BankItem[] }) {
  return (
    <LanguageProvider lang={lang}>
      <Header />
      <main id="main">
        <Hero />
        <BankSection items={items} />
        <Curriculum />
        <About />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
