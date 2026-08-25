import type { Metadata } from "next";
import { OdkazNaWeb, VirtualniPocitac } from "@/components/win/VirtualniPocitac";

export const metadata: Metadata = {
  title: "Virtuální Windows 11",
  description:
    "Výuková simulace Windows 11 přímo v prohlížeči: plocha, Průzkumník souborů, Nastavení, Poznámkový blok, Malování, Kalkulačka, příkazový řádek i PowerShell. Pro hodiny informatiky na střední škole – nic se neinstaluje a práce zůstává v prohlížeči žáka.",
  alternates: { canonical: "/windows" },
  openGraph: {
    title: "Virtuální Windows 11 – výuková simulace",
    description:
      "Plocha, Průzkumník, Nastavení a příkazový řádek k procvičování práce se soubory. Otevře se rovnou, nic se neinstaluje.",
    url: "/windows",
    type: "website",
  },
};

/**
 * Stránka je schválně bez hlavičky webu a bez patičky: simulace má zabrat
 * celou obrazovku, jinak by v ní okna neměla kam růst a iluze by se rozpadla.
 * Cesta zpátky vede z přihlašovací obrazovky a z nabídky Start (Vypnout).
 */
export default function StrankaWindows() {
  return (
    <>
      {/*
        Na telefonu ani na tabletu se prostředí nepouští. Okna mají pevné
        rozměry (Nastavení 1000 px), takže z nich na uzsi obrazovce zbude
        kus – a na tabletu to klame nejvic, protože tam to na první pohled
        vypadá, že se to vejde. Hranice je proto na `lg` (1024 px), ne na
        `sm`: až od ní má okno Nastavení kam růst.

        Radši to říct rovnou, než aby si učitel otevřel odkaz na tabletu
        a odnesl si dojem, že je něco rozbité.
      */}
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 px-6 text-center lg:hidden">
        <h1 className="font-display text-2xl font-bold tracking-nadpis">Virtuální Windows 11</h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Tohle prostředí je stavěné na počítač – okna Průzkumníka a Nastavení se na
          telefon ani na tablet nevejdou. Otevři si stránku na notebooku nebo ve
          školní učebně.
        </p>
        <OdkazNaWeb className="povrch rounded-ovladac px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
          Zpět na web
        </OdkazNaWeb>
      </div>
      <main className="hidden h-[100dvh] w-full overflow-hidden lg:block">
        <VirtualniPocitac />
      </main>
      {/*
        Popis pro vyhledávače a čtečky obrazovky. Simulace sama je pro
        odečítač obrazovky beztak nepoužitelná – tohle je to, co má člověk
        i robot o stránce vědět, než do ní vstoupí.
      */}
      <div className="sr-only">
        <h1>Virtuální Windows 11 pro výuku informatiky</h1>
        <p>
          Simulace prostředí Windows 11 v prohlížeči. Žáci si tu vyzkoušejí práci se
          soubory a složkami v Průzkumníku, přípony a vlastnosti souborů, nastavení
          systému, Poznámkový blok, Malování, Kalkulačku v programátorském režimu,
          příkazový řádek a PowerShell. Otevře se rovnou, bez kódu i bez
          instalace – nejde o skutečný operační systém. Práce zůstává
          v prohlížeči žáka; kdo si založí účet, odešle se o něm jen přezdívka
          a seznam splněných úloh.
        </p>
      </div>
    </>
  );
}
