import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { LanguageProvider } from "@/lib/i18n";
import { SITE, type Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import { BankBrowser } from "@/components/BankBrowser";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

const STR: Record<
  Lang,
  { kicker: string; heading: string; intro: string; back: string; license: string }
> = {
  cs: {
    kicker: "Banka materiálů",
    heading: "Materiály do hodin informatiky — ke stažení a úpravě",
    intro:
      "Pracovní listy, testy, metodika i plány hodin. Většina v editovatelném Wordu a Excelu — stáhni, uprav podle sebe a použij v hodině. Bez přihlašování.",
    back: "Zpět na web",
    license:
      "Materiály zde volně použij i uprav pro svou výuku. Neručím ale za to, že všechny převzaté prvky (obrázky, testové úlohy) mají 100% vyřešená práva třetích stran — před šířením mimo výuku si je prosím ověř.",
  },
  en: {
    kicker: "Material bank",
    heading: "Materials for Computer Science lessons — download & edit",
    intro:
      "Worksheets, tests, teaching notes and lesson plans. Most in editable Word and Excel — download, adapt to your needs and use in class. No login required.",
    back: "Back to site",
    license:
      "Feel free to use and adapt these materials for your own teaching. I can't guarantee every third-party element (images, test items) is fully rights-cleared — please double-check before sharing them outside the classroom.",
  },
};

/** Stránka banky materiálů (/pro-ucitele, /en/pro-ucitele) – sdílená kostra pro oba jazyky. */
export function BankPage({ lang, items }: { lang: Lang; items: BankItem[] }) {
  const s = STR[lang];
  const homeHref = lang === "en" ? "/en" : "/";

  return (
    <LanguageProvider lang={lang}>
      {/* Samostatná hlavička (banka je vlastní stránka, ne kotvy na home). */}
      <header className="glass-bar fixed inset-x-0 top-0 z-50">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href={homeHref} className="group flex items-center gap-2.5" aria-label={SITE.name}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 font-display text-sm font-bold text-white shadow-sm transition group-hover:bg-accent-500">
              {SITE.initials}
            </span>
            <span className="hidden font-display text-sm font-semibold tracking-tight sm:block">
              {SITE.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-accent-400"
            >
              <ArrowLeft className="h-4 w-4" /> {s.back}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="container-page pb-20 pt-28 sm:pt-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
          {s.kicker}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {s.heading}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          {s.intro}
        </p>

        <div className="mt-8">
          <BankBrowser items={items} lang={lang} />
        </div>

        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {s.license}
        </p>
      </main>

      <Footer />
    </LanguageProvider>
  );
}
