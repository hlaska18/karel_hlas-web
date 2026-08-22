import type { Metadata } from "next";
import { VirtualniPocitac } from "@/components/win/VirtualniPocitac";
import { PRISTUPOVY_KOD } from "@/lib/win/pristup";

export const metadata: Metadata = {
  title: "Virtuální Windows 11",
  description:
    "Výuková simulace Windows 11 přímo v prohlížeči: plocha, Průzkumník souborů, Nastavení, Poznámkový blok, Malování, Kalkulačka, příkazový řádek i PowerShell. Pro hodiny informatiky na střední škole – nic se neinstaluje, práce zůstává v prohlížeči žáka.",
  alternates: { canonical: "/windows" },
  openGraph: {
    title: "Virtuální Windows 11 – výuková simulace",
    description:
      "Plocha, Průzkumník, Nastavení a příkazový řádek k procvičování práce se soubory. Vstup na kód od vyučujícího.",
    url: "/windows",
    type: "website",
  },
};

/**
 * Stránka je schválně bez hlavičky webu a bez patičky: simulace má zabrat
 * celou obrazovku, jinak by v ní okna neměla kam růst a iluze by se rozpadla.
 * Cesta zpátky vede z přihlašovací obrazovky a z nabídky Start (Vypnout).
 *
 * Přístupový kód se mění v `src/lib/win/pristup.ts`.
 */
export default function StrankaWindows() {
  return (
    <>
      <main className="h-[100dvh] w-full overflow-hidden">
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
          příkazový řádek a PowerShell. Vstup je na kód od vyučujícího (výchozí kód
          je {PRISTUPOVY_KOD}). Nejde o skutečný operační systém, nic se neinstaluje
          a žádná data se neodesílají – práce zůstává v prohlížeči žáka.
        </p>
      </div>
    </>
  );
}
