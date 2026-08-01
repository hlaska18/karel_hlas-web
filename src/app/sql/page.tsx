import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, FileText, MonitorDown } from "lucide-react";
import { SITE } from "@/lib/content";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mark } from "@/components/Mark";
import { SqlPlayground } from "@/components/SqlPlayground";

/** Cesty na soubory v bance (téma 8 – Základy databází). */
const MAT = encodeURI("/materialy/1L/8/SQL - základy databází");

export const metadata: Metadata = {
  title: "Kurz SQL v prohlížeči",
  description:
    "Interaktivní kurz základů databází a SQL: 8 lekcí s výkladem, úkolem a okamžitou kontrolou – přímo v prohlížeči, nic se neinstaluje. Na závěr přechod do praxe v DB Browseru.",
  alternates: { canonical: "/sql" },
};

export default function SqlPage() {
  return (
    <LanguageProvider lang="cs">
      <header className="glass-bar sticky top-0 z-40">
        <nav className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2.5" aria-label={SITE.name}>
            <Mark />
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
          Interaktivní kurz
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Základy databází a SQL – kurz v prohlížeči
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Osm lekcí od úplného začátku po propojení tabulek. Každá lekce tě nejdřív krátce naučí
          nový příkaz, pak ho vyzkoušíš na ukázkové databázi knihovny – napiš dotaz, klikni{" "}
          <b>Spustit</b> a hned vidíš výsledek, <b>Zkontrolovat</b> ti řekne, jestli to máš správně.
          Nic se neinstaluje a tvůj postup se pamatuje. Na závěr přejdeš do praxe v opravdovém
          programu.
        </p>

        <div className="mt-8 max-w-3xl">
          <SqlPlayground />
        </div>

        {/* Závěrečná lekce kurzu: stejná databáze, opravdový program (DB Browser). */}
        <section id="praxe" className="glass mt-14 max-w-3xl scroll-mt-24 rounded-3xl p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            Závěrečná lekce – do praxe
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            Stejná databáze, opravdový program
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Zvládáš úlohy v prohlížeči? Stáhni si <b>tu samou databázi</b> a otevři ji v programu{" "}
            <a
              href="https://sqlitebrowser.org/dl/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-700 underline decoration-accent-400/50 underline-offset-2 hover:text-accent-600 dark:text-accent-300"
            >
              DB Browser for SQLite
            </a>{" "}
            (zdarma). Všechny dotazy, které už umíš, fungují beze změny – a navíc můžeš data
            upravovat, přidávat záznamy a tvořit vlastní tabulky. Přesně na to navazuje 5 úloh
            v bance.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a
              href={`${MAT}/knihovna.db`}
              download
              className="inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-500"
            >
              <Download className="h-4 w-4" /> Stáhnout knihovna.db
            </a>
            <a
              href={`${MAT}/${encodeURIComponent("Návod - DB Browser.txt")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-soft inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200"
            >
              <MonitorDown className="h-4 w-4" /> Návod na DB Browser
            </a>
            <a
              href={`${MAT}/${encodeURIComponent("Úlohy - DB Browser.txt")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-soft inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200"
            >
              <FileText className="h-4 w-4" /> Úlohy 1–5 + bonus
            </a>
          </div>
        </section>

        {/* Volitelné pokračování. Schválně AŽ ZA závěrečnou lekcí a decentně:
            je to cizí kurz a je anglicky, takže patří na konec cesty, ne na
            začátek – tenhle kurz zůstává hlavní. */}
        <section className="glass-soft mt-8 max-w-3xl rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Chceš toho ještě víc?
          </h2>
          <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
            <b>SQLBolt</b> je bezplatný kurz, který funguje na stejném principu jako tenhle –
            krátký výklad a hned cvičení v prohlížeči. Jde ale dál: vnořené dotazy, sjednocení
            tabulek, úpravy dat i tvorba vlastních tabulek – 18 lekcí, bez registrace. Je celý{" "}
            <b>anglicky</b>, takže se do něj pouštěj až potom, co máš základ z tohohle kurzu.
          </p>
          <a
            href="https://sqlbolt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-accent-700 transition hover:bg-accent-500/10 dark:text-accent-300"
          >
            Otevřít SQLBolt <ExternalLink className="h-4 w-4" />
          </a>
        </section>
      </main>
    </LanguageProvider>
  );
}
