import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MaterialsTiles } from "@/components/MaterialsTiles";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Curriculum } from "@/components/Curriculum";
import { Footer } from "@/components/Footer";
import type { Lang } from "@/lib/content";

/** Celý web v daném jazyce. Jazyk přichází z adresy (/ nebo /en). */
export function Site({
  lang,
  toolCounts = [],
}: {
  lang: Lang;
  toolCounts?: { tool: string; count: number }[];
}) {
  return (
    <LanguageProvider lang={lang}>
      <Header />
      <main id="main">
        <Hero />
        <MaterialsTiles tiles={toolCounts} />
        <Curriculum />
        <About />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
