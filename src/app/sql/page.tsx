import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE } from "@/lib/content";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SqlPlayground } from "@/components/SqlPlayground";

export const metadata: Metadata = {
  title: "Procvič si SQL v prohlížeči — Karel Hlas",
  description:
    "Interaktivní cvičení na základy databází a SQL. Napiš dotaz, klikni Spustit a hned vidíš výsledek — přímo v prohlížeči, nic se neinstaluje.",
  alternates: { canonical: "/sql" },
};

export default function SqlPage() {
  return (
    <LanguageProvider lang="cs">
      <header className="glass-bar sticky top-0 z-40">
        <nav className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2.5" aria-label={SITE.name}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 font-display text-sm font-bold text-white">
              {SITE.initials}
            </span>
            <span className="hidden font-display text-sm font-semibold tracking-tight sm:block">
              {SITE.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/#banka"
              className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" /> Zpět na web
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="container-page py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
          Interaktivní cvičení
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Procvič si SQL přímo v prohlížeči
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Pracuješ s ukázkovou databází knihovny (knihy, čtenáři, výpůjčky). Napiš SQL dotaz,
          klikni <b>Spustit</b> a hned vidíš výsledek. Tlačítkem <b>Zkontrolovat</b> zjistíš, jestli
          řešíš zadání správně. Nic se neinstaluje — vše běží u tebe v prohlížeči.
        </p>

        <div className="mt-8 max-w-3xl">
          <SqlPlayground />
        </div>
      </main>
    </LanguageProvider>
  );
}
