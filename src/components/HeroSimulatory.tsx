"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { ZnakWindows } from "@/components/ZnakWindows";
import { ZnakJablko } from "@/components/ZnakJablko";
import { VEREJNE_KODY } from "@/lib/win/pristup";
import type { Lang } from "@/lib/content";

/**
 * Tlačítka na oba simulátory v pravém sloupci úvodu – nahradila ukázku
 * materiálů (tři náhodné soubory z banky).
 *
 * Vzhled drží stoh článků pod nimi: stejná skleněná karta, čtverec se
 * značkou vlevo, štítek vpravo a natočení, které se při najetí srovná.
 * Značky jsou tytéž jako v patičce a v samotných simulacích.
 *
 * Počet úloh přichází z opravdových seznamů úloh (počítá ho `Site`), ne
 * z věty v textech: číslo napsané ručně v popisu dlaždice se jednou rozjelo
 * se skutečností (34 proti 33). Kód je ten veřejný pro učitele z jiných
 * škol – bez něj by cizí učitel skončil na zamykací obrazovce.
 */

export type PoctyUloh = { windows: number; macos: number };

/** Anglicky „tasks“, ne „exercises“ jako na dlaždici: s dovětkem „in Czech“
 *  a kódem by se řádek v kartě široké 22 rem ořízl zrovna na kódu. */
function pocetUloh(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "task" : "tasks"}`;
  const slovo = n === 1 ? "úloha" : n >= 2 && n <= 4 ? "úlohy" : "úloh";
  return `${n} ${slovo}`;
}

/** Natočení karet – stejný rozhozený stoh jako u článků níž. */
const NATOCENI = ["-rotate-[3deg] translate-x-0", "rotate-[2deg] translate-x-6"];

export function HeroSimulatory({ ulohy }: { ulohy: PoctyUloh }) {
  const { tr, lang } = useLang();

  const simulatory = [
    {
      href: "/windows",
      nazev: tr.hero.simWindows,
      kod: VEREJNE_KODY.windows,
      pocet: ulohy.windows,
      znak: <ZnakWindows className="h-6 w-6" />,
    },
    {
      href: "/macos",
      nazev: tr.hero.simMacos,
      kod: VEREJNE_KODY.macos,
      pocet: ulohy.macos,
      znak: <ZnakJablko className="h-7 w-7" />,
    },
  ];

  return (
    /* Skrytí na mobilu a šířku sloupce řeší obal v Hero.tsx. */
    <div className="group block">
      <p className="mb-4 pl-1 text-xs font-medium uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
        {tr.hero.simulators}
      </p>

      <ul className="space-y-4">
        {simulatory.map((s, i) => {
          const poznamka = tr.hero.simNote
            .replace("{tasks}", pocetUloh(s.pocet, lang))
            .replace("{code}", s.kod);
          return (
            <li key={s.href}>
              {/* Stejná dvě gesta jako u stohu článků: najetí kamkoli do
                  sekce srovná obě karty, karta pod kurzorem se navíc rozsvítí
                  smaragdovým okrajem a září. `dark:hover:` je nutné, jinak
                  `dark:border-*` hover přebije. */}
              <Link
                href={s.href}
                className={`glass group/karta flex items-center gap-3 rounded-karta p-4 transition duration-300 hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-600/30 group-hover:rotate-0 group-hover:translate-x-0 dark:hover:border-accent-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${NATOCENI[i % NATOCENI.length]}`}
              >
                {/* Značka je smaragdová už v klidu: na rozdíl od souborů
                    a článků jsou tohle tlačítka a mají být vidět. */}
                <span className="flex h-11 w-11 shrink-0 items-center justify-center text-accent-700 transition duration-300 group-hover/karta:scale-110 dark:text-accent-400">
                  {s.znak}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{s.nazev}</span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {poznamka}
                  </span>
                </span>

                <span className="shrink-0 rounded-stitek bg-black/[0.05] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-600 transition duration-300 group-hover/karta:bg-accent-500/15 group-hover/karta:text-accent-700 dark:bg-white/10 dark:text-zinc-400 dark:group-hover/karta:text-accent-300">
                  {tr.hero.simOpen}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
