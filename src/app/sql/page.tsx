import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  MonitorDown,
} from "lucide-react";
import { SITE } from "@/lib/content";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mark } from "@/components/Mark";
import { SqlPlayground } from "@/components/SqlPlayground";
import { Proza } from "@/components/Proza";

/** Cesty na soubory v bance (téma 8 – Základy databází). */
const TEMA = "/materialy/1L/8";
const DB = encodeURI(`${TEMA}/4. Databáze knihovny`);
const BROWSER = encodeURI(`${TEMA}/3. Vlastní databáze v DB Browseru`);

export const metadata: Metadata = {
  title: "Kurz SQL v prohlížeči",
  description:
    "Interaktivní kurz základů databází a SQL: 13 lekcí od SELECTu po zápis dat, s výkladem, úkolem a okamžitou kontrolou – přímo v prohlížeči, nic se neinstaluje. Na závěr přechod do praxe v DB Browseru.",
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

      <main id="main" className="container-page py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
          Interaktivní kurz
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Základy databází a SQL – kurz v prohlížeči
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Proza>
            Třináct lekcí od úplného začátku po zápis vlastních dat. Každá lekce tě nejdřív krátce
            naučí nový příkaz, pak ho vyzkoušíš na ukázkové databázi knihovny. Napiš dotaz, klikni na{" "}
            <b>Spustit</b> a hned vidíš výsledek; <b>Zkontrolovat</b> ti řekne, jestli to máš správně.
            Nic se neinstaluje a tvůj postup se pamatuje. Na závěr přejdeš do praxe v opravdovém
            programu.
          </Proza>
        </p>

        {/* Kurz je psaný pro žáka – jediná stránka na webu, která není pro
            učitele. Tenhle blok je proto NAD kurzem: kdo sem přijde vybírat
            materiál do hodiny, potřebuje čísla dřív, než začne scrollovat. */}
        <details className="glass-soft mt-8 max-w-3xl rounded-2xl px-5 py-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-700 marker:content-none dark:text-zinc-200">
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent-600 dark:text-accent-400" />
              Učíš podle toho? Rozklikni, než to zadáš
            </span>
          </summary>
          <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            <p>
              <Proza>
                <b>Kolik hodin.</b> Jedna vyučovací hodina u počítačů. Průměrná třída 1. ročníku dojde
                za 45 minut do lekce 8 až 10. Lekce 11–13 (zápis, změna a mazání dat) jsou dobrý
                domácí úkol. Na druhou hodinu navazuje DB Browser – tam už nejde o nové příkazy, ale
                o práci se souborem a o vlastní tabulku.
              </Proza>
            </p>
            <p>
              <Proza>
                <b>Když nestihnou.</b> Nic se neztratí, postup i rozepsané dotazy se ukládají
                v prohlížeči a žák pokračuje doma tam, kde skončil. Na počítači, kde se maže profil,
                projde hotové lekce znovu za pár minut.
              </Proza>
            </p>
            <p>
              <Proza>
                <b>Jak poznáš, že to umí.</b> Nad kurzem svítí „Hotovo X/13“, stačí obejít třídu. Na
                známku to samo o sobě není: lekce jde splnit i tlačítkem <i>Ukázat řešení</i> – takové
                se v postupu odliší šedou, ale spolehlivější je jedna otázka. „Přečti nahlas, co ten
                tvůj dotaz dělá.“
              </Proza>
            </p>
            <p>
              <Proza>
                <b>Když se zeptají na něco mimo.</b> Klidně řekni „nevím, zkusíme to“. Databáze
                běží v prohlížeči, nejde rozbít a tlačítko <i>Obnovit databázi</i> ji vrátí do
                výchozího stavu – odpověď uvidíte oba za pět sekund.
              </Proza>
            </p>
            <p>
              <Proza>
                Plán hodin, pracovní list, řešení i databáze ke stažení jsou v bance u tématu{" "}
                <Link
                  href="/?tema=Datab%C3%A1ze#banka"
                  className="font-semibold text-accent-700 underline decoration-accent-400/50 underline-offset-2 hover:text-accent-600 dark:text-accent-300"
                >
                  Databáze
                </Link>
                . Začni souborem „Jak toto téma učit“.
              </Proza>
            </p>
          </div>
        </details>

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
            <Proza>
              Zvládáš úlohy v prohlížeči? Stáhni si <b>stejnou databázi</b> a otevři ji v programu{" "}
              <a
                href="https://sqlitebrowser.org/dl/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-700 underline decoration-accent-400/50 underline-offset-2 hover:text-accent-600 dark:text-accent-300"
              >
                DB Browser for SQLite
              </a>{" "}
              (zdarma). Všechny dotazy, které už umíš, fungují beze změny. Nové je prostředí:
              pracuješ se skutečným souborem na disku. A přibude jeden příkaz navíc – v poslední
              úloze si založíš vlastní tabulku pomocí <b>CREATE TABLE</b>. Navazuje na to šest úloh
              v bance.
            </Proza>
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a
              href={`${DB}/knihovna.db`}
              download
              className="inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-500"
            >
              <Download className="h-4 w-4" /> Stáhnout knihovna.db
            </a>
            <a
              href={`${BROWSER}/${encodeURIComponent("Návod - DB Browser.txt")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-soft inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200"
            >
              <MonitorDown className="h-4 w-4" /> Návod na DB Browser
            </a>
            <a
              href={`${BROWSER}/${encodeURIComponent("Úlohy - DB Browser.txt")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-soft inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200"
            >
              <FileText className="h-4 w-4" /> Úlohy do DB Browseru
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
            <Proza>
              <b>SQLBolt</b> je bezplatný kurz, který funguje na stejném principu jako tenhle –
              krátký výklad a hned cvičení v prohlížeči. Jde ale dál: vnořené dotazy, sjednocení
              tabulek, úpravy dat i tvorba vlastních tabulek – 18 lekcí, bez registrace. Je celý{" "}
              <b>anglicky</b>, takže se do něj pouštěj, až budeš mít základ z tohohle kurzu.
            </Proza>
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
