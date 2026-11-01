import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BankSection } from "@/components/BankSection";
import { CrossSubject } from "@/components/CrossSubject";
import { AiHub } from "@/components/AiHub";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import type { Vystup } from "@/lib/aihubLabels";
import { getBankStats } from "@/lib/heroPick";
import { UKOLY } from "@/lib/win/ukoly";
import { UKOLY_MAC } from "@/lib/mac/ukoly";
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
      <Header />
      <main id="main">
        {/* Počty úloh se berou ze skutečných seznamů úloh tady na serveru,
            ať se do prohlížeče nemusí posílat celé simulace. */}
        <Hero
          ulohy={{ windows: UKOLY.length, macos: UKOLY_MAC.length }}
          stats={getBankStats(items)}
        />
        <BankSection items={items} />
        <CrossSubject items={items.filter((i) => crossTools.has(i.tool))} />
        <AiHub vystupy={vystupy} />
        <About />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
