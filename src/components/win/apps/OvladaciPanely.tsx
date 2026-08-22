"use client";

/**
 * Ovládací panely.
 *
 * Ve Windows 11 pořád existují, ale většina položek už jen odkáže do nových
 * Nastavení. Přesně tak se chovají i tady – a je to jedna z mála věcí, kde
 * simulace nemusí nic zjednodušovat, protože skutečnost je taky taková.
 */

import { ChevronRight } from "lucide-react";
import { Ikona } from "../Ikona";
import { useSystem } from "../system";

const POLOZKY: { nazev: string; popis: string; stranka: string }[] = [
  { nazev: "Systém a zabezpečení", popis: "Zkontrolovat stav počítače", stranka: "system" },
  { nazev: "Uživatelské účty", popis: "Změnit typ účtu", stranka: "ucty" },
  { nazev: "Vzhled a přizpůsobení", popis: "Změnit motiv a pozadí plochy", stranka: "prizpusobeni" },
  { nazev: "Hodiny a oblast", popis: "Změnit formát data a času", stranka: "cas" },
  { nazev: "Síť a internet", popis: "Zobrazit stav sítě a úlohy", stranka: "sit" },
  { nazev: "Programy", popis: "Odinstalovat program", stranka: "aplikace" },
];

export function OvladaciPanely() {
  const { spust } = useSystem();
  return (
    <div className="win-posuv h-full overflow-auto bg-win-povrch p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-win-linka pb-4">
        <Ikona klic="ovladaci-panely" velikost={40} />
        <div>
          <h1 className="text-[17px]">Všechny položky Ovládacích panelů</h1>
          <p className="text-[12px] text-win-slaby">
            Většina nastavení se přesunula do aplikace Nastavení. Tyto položky tam vedou.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {POLOZKY.map((p) => (
          <button
            key={p.nazev}
            type="button"
            onClick={() => spust("nastaveni", p.stranka)}
            className="flex items-center gap-3 rounded-md border border-win-linka bg-win-plocha p-3 text-left hover:bg-win-zvyrazneny"
          >
            <Ikona klic="nastaveni" velikost={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-win-akcent">{p.nazev}</span>
              <span className="block truncate text-[12px] text-win-slaby">{p.popis}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-win-slaby" />
          </button>
        ))}
      </div>
    </div>
  );
}
