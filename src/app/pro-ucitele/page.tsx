import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LanguageProvider } from "@/lib/i18n";
import { SITE } from "@/lib/content";
import { getBankItems } from "@/lib/materials";
import { BankBrowser } from "@/components/BankBrowser";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Banka materiálů pro učitele",
  description:
    "Volně stažitelné materiály do hodin informatiky: pracovní listy, testy, metodika a plány hodin. Procházej podle nástroje (Excel, Word, Python, Power BI) nebo hledej. Bez přihlašování.",
  alternates: { canonical: "/pro-ucitele" },
};

export default function ProUcitelePage() {
  const items = getBankItems();

  return (
    <LanguageProvider lang="cs">
      {/* Samostatná hlavička (banka je vlastní stránka, ne kotvy na home). */}
      <header className="glass-bar fixed inset-x-0 top-0 z-50">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2.5" aria-label={SITE.name}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 font-display text-sm font-bold text-white shadow-sm transition group-hover:bg-accent-500">
              {SITE.initials}
            </span>
            <span className="hidden font-display text-sm font-semibold tracking-tight sm:block">
              {SITE.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-accent-400"
            >
              <ArrowLeft className="h-4 w-4" /> Zpět na web
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="container-page pb-20 pt-28 sm:pt-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
          Banka materiálů
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Materiály do hodin informatiky — ke stažení a úpravě
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Pracovní listy, testy, metodika i plány hodin. Většina v editovatelném Wordu a Excelu —
          stáhni, uprav podle sebe a použij v hodině. Bez přihlašování.
        </p>

        <div className="mt-8">
          <BankBrowser items={items} />
        </div>
      </main>

      <Footer />
    </LanguageProvider>
  );
}
