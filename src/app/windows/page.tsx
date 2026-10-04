import type { Metadata } from "next";
import { OdkazNaWeb, VirtualniPocitac } from "@/components/win/VirtualniPocitac";
import { JenNaPocitaci } from "@/components/JenNaPocitaci";
import { sdileni } from "@/lib/sdileni";

export const metadata: Metadata = {
  title: "Virtuální Windows 11",
  description:
    "Výuková simulace Windows 11 přímo v prohlížeči: plocha, Průzkumník souborů, Nastavení, Poznámkový blok, Malování, Kalkulačka, příkazový řádek i PowerShell. Pro hodiny informatiky na střední škole – nic se neinstaluje a práce zůstává v prohlížeči žáka.",
  alternates: { canonical: "/windows" },
  ...sdileni({
    title: "Virtuální Windows 11 – výuková simulace",
    description:
      "Plocha, Průzkumník, Nastavení a příkazový řádek k procvičování práce se soubory. Otevře se rovnou, nic se neinstaluje.",
    url: "/windows",
  }),
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
        Na telefonu ani na tabletu se prostředí nepouští (Karel 29. 9. 2026).
        Okna mají pevné rozměry (Nastavení 1000 px) a ovládají se myší a
        klávesami. Dřív rozhodovala jen šířka `lg` (1024 px), takže iPad na
        šířku dostal celé prostředí, které se prstem ovládat nedalo. Teď
        rozhoduje `JenNaPocitaci`: obrazovka aspoň 1024 px a myš.

        Radši to říct rovnou, než aby si učitel otevřel odkaz na tabletu
        a odnesl si dojem, že je něco rozbité.
      */}
      <JenNaPocitaci
        jinak={
          <main
            id="main"
            tabIndex={-1}
            className="flex vyska-obrazovky w-full flex-col items-center justify-center gap-4 px-6 text-center focus:outline-none"
          >
            <h1 className="font-display text-2xl font-bold tracking-nadpis">Virtuální Windows 11</h1>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Tohle prostředí běží jen na počítači s myší – na telefonu ani na tabletu se
              nespouští. Otevři si stránku na notebooku nebo ve školní učebně.
            </p>
            <OdkazNaWeb className="povrch rounded-ovladac px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
              Zpět na web
            </OdkazNaWeb>
          </main>
        }
      >
        {/* `id="main"`: cíl odkazu „Přeskočit na obsah“ z kořenového layoutu
            (audit 4. 10. 2026 – dřív tu chyběl a odkaz nikam nevedl). */}
        <main id="main" tabIndex={-1} className="vyska-obrazovky w-full overflow-hidden focus:outline-none">
          <VirtualniPocitac />
        </main>
      </JenNaPocitaci>
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
          příkazový řádek a PowerShell. Nic se neinstaluje a nejde o skutečný
          operační systém. Žák se přihlásí jménem a výsledky předá učiteli
          kódem postupu. Práce zůstává
          v prohlížeči žáka – na server se neodesílá nic a žádné účty se
          nezakládají.
        </p>
      </div>
    </>
  );
}
