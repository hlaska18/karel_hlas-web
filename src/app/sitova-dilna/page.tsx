import type { Metadata } from "next";
import Link from "next/link";
import { SitovaDilna } from "@/components/dilna/SitovaDilna";
import { JenNaPocitaci } from "@/components/JenNaPocitaci";
import { sdileni } from "@/lib/sdileni";

export const metadata: Metadata = {
  title: "NETLAB",
  description:
    "Cvičná domácí síť v prohlížeči pro hodiny informatiky: oprav porouchaný internet, zapoj nový router a vyžeň cizí zařízení z Wi-Fi. Příkazy ipconfig, ping, nslookup a tracert, nic se neinstaluje a práce zůstává v prohlížeči žáka.",
  alternates: { canonical: "/sitova-dilna" },
  ...sdileni({
    title: "NETLAB – síťová dílna v prohlížeči",
    description: "Oprav porouchaný internet, zapoj nový router a vyžeň cizí zařízení z Wi-Fi. Otevře se rovnou, nic se neinstaluje.",
    url: "/sitova-dilna",
  }),
};

/** Stejně jako simulátory: bez hlavičky webu, celá obrazovka, jen na počítači. */
export default function StrankaDilny() {
  return (
    <>
      <JenNaPocitaci
        jinak={
          <main
            id="main"
            tabIndex={-1}
            className="flex vyska-obrazovky w-full flex-col items-center justify-center gap-4 px-6 text-center focus:outline-none"
          >
            <h1 className="font-display text-2xl font-bold tracking-nadpis">NETLAB</h1>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Dílna běží jen na počítači s myší, na telefonu ani na tabletu se nespouští. Otevři si stránku na notebooku nebo ve školní učebně.
            </p>
            <Link href="/" className="povrch rounded-ovladac px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
              Zpět na web
            </Link>
          </main>
        }
      >
        <main id="main" tabIndex={-1} className="vyska-obrazovky w-full overflow-hidden focus:outline-none">
          <SitovaDilna />
        </main>
      </JenNaPocitaci>
      <div className="sr-only">
        <h1>NETLAB – síťová dílna pro výuku informatiky</h1>
        <p>
          Cvičná domácí síť v prohlížeči. Žáci zjišťují adresu, bránu a DNS příkazy ipconfig, ping, nslookup a tracert,
          zapojují nový router, hledají pět poruch a zabezpečují Wi-Fi. Nic se neinstaluje a žádné účty se nezakládají.
          Žák se přihlásí jménem a výsledky předá učiteli kódem postupu. Práce zůstává v prohlížeči žáka.
        </p>
      </div>
    </>
  );
}
