"use client";

import { useEffect, useState } from "react";
import { BarChart3, Database, Files, FileCode2, FileSpreadsheet, FileText, Laptop } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { toolLabel } from "@/lib/bankLabels";
import { pickHeroHighlights } from "@/lib/heroPick";
import type { BankItem } from "@/lib/materials";

/**
 * Stoh karet se SKUTEČNÝMI materiály z banky vedle nadpisu.
 *
 * Záměrně to není dekorativní obrázek: karty nesou reálné názvy souborů,
 * takže je to zároveň ukázka i důkaz („tohle si fakt odnesu"). Drží skleněný
 * jazyk webu, ale nesoupeří s ikonami témat níž – ukazuje soubory, ne témata.
 *
 * Při každém načtení se losuje jiná trojice, takže banka působí živě
 * (a stálý návštěvník uvidí i materiály, na které by jinak nenarazil).
 *
 * Na mobilu se neukazuje: tam se počítá každý pixel nad ohybem a tlačítko
 * musí zůstat vidět bez scrollování.
 */

function toolIcon(tool: string) {
  switch (tool) {
    case "Excel":
      return FileSpreadsheet;
    case "Word":
      return FileText;
    case "Python":
      return FileCode2;
    case "Power BI":
      return BarChart3;
    case "Databáze":
      return Database;
    case "Digitální gramotnost":
      return Laptop;
    default:
      return Files;
  }
}

/** Náklon a odsazení jednotlivých karet – shora dolů, jako rozhozený stoh. */
const LAYOUT = [
  "-rotate-[5deg] translate-x-0",
  "rotate-[2.5deg] translate-x-8",
  "-rotate-[1.5deg] translate-x-3",
];

export function HeroPreview({ pool }: { pool: BankItem[] }) {
  const { lang, tr } = useLang();

  // Server i první vykreslení musí dát stejnou trojici (jinak neshoda při
  // hydrataci); teprve po připojení se losuje doopravdy.
  const [items, setItems] = useState(() => pickHeroHighlights(pool));
  useEffect(() => {
    setItems(pickHeroHighlights(pool, 3, Math.random));
  }, [pool]);

  if (items.length === 0) return null;

  return (
    <a
      href="#banka"
      /* Vlastní popisek: bez něj by čtečka předčítala všechny karty a duplikovala
         tak seznam z banky níž; zároveň se neplete s hlavním tlačítkem. */
      aria-label={tr.hero.sample}
      className="group hidden w-[22rem] shrink-0 lg:block"
    >
      <p className="mb-4 pl-1 text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {tr.hero.sample}
      </p>

      <div className="space-y-4">
        {items.map((it, i) => {
          const Icon = toolIcon(it.tool);
          return (
            <div
              key={it.href}
              className={`glass flex items-center gap-3 rounded-2xl p-4 transition duration-300 group-hover:rotate-0 group-hover:translate-x-0 ${LAYOUT[i % LAYOUT.length]}`}
            >
              <span className="glass-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <Icon className="h-5 w-5 text-accent-700 dark:text-accent-300" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {lang === "en" ? it.label.en : it.label.cs}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {toolLabel(it.tool, lang)}
                </span>
              </span>

              <span className="shrink-0 rounded-lg bg-accent-500/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                {it.ext}
              </span>
            </div>
          );
        })}
      </div>
    </a>
  );
}
