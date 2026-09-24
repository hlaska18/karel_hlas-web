import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { SITE } from "@/lib/content";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mark } from "@/components/Mark";
import { SqlPlayground } from "@/components/SqlPlayground";
import { Proza } from "@/components/Proza";
import { VirtualniDbBrowser } from "@/components/dbb/DbBrowser";
import {
  PodobaKurzu,
  ObalProgramu,
  ObalWebu,
  JenVeWebu,
  TlacitkoDoProgramu,
  UlohaVeWebu,
} from "@/components/dbb/PodleSirky";

export const metadata: Metadata = {
  title: "Kurz SQL ve virtuálním DB Browseru",
  description:
    "Interaktivní kurz základů databází a SQL uvnitř napodobeniny programu DB Browser for SQLite: 13 lekcí od SELECTu po zápis dat, 6 lekcí o práci s programem – soubor, zápis změn, vlastní tabulka – a navíc detektivka a procvičování na jiných datech. Úkoly se kontrolují samy, přímo v prohlížeči, nic se neinstaluje.",
  alternates: { canonical: "/sql" },
};

/**
 * Na počítači (od 1024 px) se kurz otevře ve virtuálním DB Browseru přes
 * celou obrazovku, jako simulátory Windows a macOS. Na telefonu a tabletu se
 * program nevejde, tak tam zůstává webová podoba kurzu (lekce 1–13) – obě
 * ukládají postup do stejných klíčů, takže se sčítá. Webová podoba zůstává
 * v HTML i na počítači (jen skrytá), aby stránku našly vyhledávače.
 *
 * `?z=en` (odkaz z anglické verze webu): program DB Browser i jeho lekce
 * jsou anglicky (`lib/dbb/jazyk`), odkaz zpět i značka míří na /en. Data
 * zůstávají česká se slovníčkem. Webová podoba pro telefony je jen česky.
 */
export default function SqlPage({
  searchParams,
}: {
  searchParams?: { z?: string };
}) {
  const zEn = searchParams?.z === "en";
  const domu = zEn ? "/en" : "/";
  return (
    <LanguageProvider lang="cs">
      <PodobaKurzu>
      <ObalProgramu>
        <VirtualniDbBrowser domu={domu} />
      </ObalProgramu>
      <ObalWebu>
      <header className="glass-bar sticky top-0 z-40">
        <nav className="container-page flex h-16 items-center justify-between gap-4">
          <Link href={domu} className="group flex items-center gap-2.5" aria-label={SITE.name}>
            <Mark />
            <span className="hidden font-display text-sm font-semibold tracking-podnadpis sm:block">
              {SITE.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`${domu}#banka`}
              className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-700 dark:text-accent-400 dark:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" /> {zEn ? "Back to the site" : "Zpět na web"}
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main id="main" className="container-page py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-700 dark:text-accent-400">
          Interaktivní kurz
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-nadpis text-balance sm:text-4xl">
          Základy databází a SQL – kurz v prohlížeči
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Proza>
            Třináct lekcí od úplného začátku po zápis vlastních dat. Každá lekce tě nejdřív krátce
            naučí nový příkaz, pak ho vyzkoušíš na ukázkové databázi knihovny. Napiš dotaz, klikni na{" "}
            <b>Spustit</b> a hned vidíš výsledek; <b>Zkontrolovat</b> ti řekne, jestli to máš správně.
            Nic se neinstaluje a tvůj postup se pamatuje. Na počítači se kurz otevře rovnou ve
            virtuálním programu DB Browser – se šesti lekcemi navíc o práci se souborem a vlastní
            tabulce.
          </Proza>
        </p>
        <TlacitkoDoProgramu />
        <UlohaVeWebu />

        {/* Kurz je psaný pro žáka – jediná stránka na webu, která není pro
            učitele. Tenhle blok je proto NAD kurzem: kdo sem přijde vybírat
            materiál do hodiny, potřebuje čísla dřív, než začne scrollovat. */}
        <details className="povrch mt-8 max-w-3xl rounded-karta px-5 py-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-700 marker:content-none dark:text-zinc-200">
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent-700 dark:text-accent-400" />
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
                  className="font-semibold text-accent-700 underline decoration-accent-400/50 underline-offset-2 hover:text-accent-700 dark:text-accent-300"
                >
                  Databáze
                </Link>
                . Začni souborem „Jak toto téma učit“.
              </Proza>
            </p>
          </div>
        </details>

        <div className="mt-8 max-w-3xl">
          <JenVeWebu>
            <SqlPlayground />
          </JenVeWebu>
        </div>

        {/* Volitelné pokračování. Schválně až na konci a decentně: je to cizí
            kurz a je anglicky, takže patří na konec cesty, ne na začátek –
            tenhle kurz zůstává hlavní. */}
        <section className="povrch mt-14 max-w-3xl rounded-karta p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-podnadpis">
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
      </ObalWebu>
      </PodobaKurzu>
    </LanguageProvider>
  );
}
