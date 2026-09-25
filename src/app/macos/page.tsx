import type { Metadata } from "next";
import Link from "next/link";
import { VirtualniMac } from "@/components/mac/MacOS";

export const metadata: Metadata = {
  title: "Virtuální macOS",
  description:
    "Výuková simulace macOS přímo v prohlížeči: plocha, horní lišta, Dock, Finder, Terminál a Vynutit ukončení. Pro hodiny informatiky na střední škole – ukazuje, čím se Mac liší od Windows. Nic se neinstaluje a práce zůstává v prohlížeči žáka.",
  alternates: { canonical: "/macos" },
  openGraph: {
    title: "Virtuální macOS – výuková simulace",
    description:
      "Finder, Dock a horní lišta k procvičení rozdílů proti Windows. Otevře se rovnou, nic se neinstaluje.",
    url: "/macos",
    type: "website",
  },
};

/**
 * Stránka je stejně jako `/windows` bez hlavičky a patičky webu: simulace má
 * zabrat celou obrazovku, jinak by okna neměla kam růst.
 */
export default function StrankaMacOS() {
  return (
    <>
      {/*
        Na telefonu ani na tabletu se prostředí nepouští – Finder má pevnou
        šířku a horní lišta s Dockem se na úzkou obrazovku nevejdou. Hranice
        je stejná jako u Windows (`lg`, 1024 px), ať si to učitel nemusí
        pamatovat dvakrát.
      */}
      <div className="flex vyska-obrazovky w-full flex-col items-center justify-center gap-4 px-6 text-center lg:hidden">
        <h1 className="font-display text-2xl font-bold tracking-nadpis">Virtuální macOS</h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Tohle prostředí je stavěné na počítač – okno Finderu ani Dock se na
          telefon a tablet nevejdou. Otevři si stránku na notebooku nebo ve
          školní učebně.
        </p>
        <Link
          href="/"
          className="povrch rounded-ovladac px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        >
          Zpět na web
        </Link>
      </div>
      <main className="hidden vyska-obrazovky w-full overflow-hidden lg:block">
        <VirtualniMac />
      </main>
      {/*
        Popis pro vyhledávače a čtečky obrazovky. Simulace sama je pro
        odečítač beztak nepoužitelná – tohle je to, co má člověk i robot
        o stránce vědět, než do ní vstoupí.
      */}
      <div className="sr-only">
        <h1>Virtuální macOS pro výuku informatiky</h1>
        <p>
          Simulace prostředí macOS v prohlížeči. Žáci si tu vyzkoušejí, čím se
          Mac liší od Windows: horní lišta patří aplikaci vpředu, ne oknu;
          červený puntík zavře okno, ale program běží dál a je vidět v Docku;
          cesta k souboru nemá písmeno disku a připojený flash disk se objeví
          ve složce Volumes; skrytá položka se většinou pozná podle tečky na
          začátku jména. K dispozici je Finder, Terminál, TextEdit a okno
          Vynutit ukončení. Nic se neinstaluje a nejde o skutečný operační
          systém. Žák se přihlásí jménem a výsledky předá učiteli kódem postupu.
          Práce zůstává v prohlížeči žáka – na server se neodesílá nic a žádné
          účty se nezakládají. Hodí se jako bonus ke srovnání s Windows
          v hodinách o operačním systému a o příkazovém řádku.
        </p>
      </div>
    </>
  );
}
