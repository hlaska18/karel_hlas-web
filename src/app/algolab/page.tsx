import type { Metadata } from "next";
import Link from "next/link";
import { Algolab } from "@/components/algolab/Algolab";
import { JenNaPocitaci } from "@/components/JenNaPocitaci";
import { sdileni } from "@/lib/sdileni";

const POPIS = "Algoritmická dílna pro střední školy v osmi hodinách: vyhledávání, řazení, dynamické programování, heuristiky, grafy a závěrečné ověření s přehledem pro učitele.";

export const metadata: Metadata = {
  title: "ALGOLAB",
  description: POPIS,
  alternates: { canonical: "/algolab" },
  // Rozpracované: zatím bez odkazu z webu a mimo vyhledávače.
  robots: { index: false, follow: false },
  ...sdileni({ title: "ALGOLAB – algoritmická dílna", description: POPIS, url: "/algolab" }),
};

/** Stejně jako simulátory a Síťová dílna: bez hlavičky webu, celá obrazovka, jen na počítači. */
export default function StrankaAlgolab() {
  return (
    <JenNaPocitaci
      jinak={
        <main
          id="main"
          tabIndex={-1}
          className="flex vyska-obrazovky w-full flex-col items-center justify-center gap-4 px-6 text-center focus:outline-none"
        >
          <h1 className="font-display text-2xl font-bold tracking-nadpis">ALGOLAB</h1>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Dílna běží jen na počítači s myší, na telefonu ani na tabletu se nespouští. Otevři si stránku na notebooku nebo ve školní učebně.
          </p>
          <Link href="/" className="povrch rounded-ovladac px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
            Zpět na web
          </Link>
        </main>
      }
    >
      <div id="main" tabIndex={-1} className="vyska-obrazovky w-full overflow-hidden focus:outline-none">
        <Algolab />
      </div>
    </JenNaPocitaci>
  );
}
