"use client";

/**
 * Vtíravé okno „WinOptimizer Pro".
 *
 * Napodobuje žánr, na který žáci narazí doopravdy: nabídka opravy něčeho, co
 * není rozbité, velké číslo, které si program vymyslel, a dvě tlačítka, kde
 * odmítavé je naschvál napsané tak, aby se ho člověk styděl zmáčknout.
 *
 * OBĚ TLAČÍTKA NEDĚLAJÍ NIC. To je ta pointa – ne že by byla škodlivá, ale že
 * s tímhle oknem se nedá vyjednávat. Nezbaví se ho ten, kdo správně klikne,
 * ale ten, kdo ukončí proces. Zavírání křížkem obstarává `VirtualniPocitac`,
 * kde se okno po chvíli zase otevře.
 */

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Tlacitko } from "../ui";
import { HLASKA } from "@/lib/win/reklama";

export function Reklama() {
  const [kliknuto, nastavKliknuto] = useState(false);
  const [pracuje, nastavPracuje] = useState(false);

  const zkus = () => {
    // Chvilka „práce" je schválně: bez ní je hned poznat, že tlačítko nic
    // nedělá, a žák to přestane zkoušet dřív, než ho napadne Správce úloh.
    nastavPracuje(true);
    window.setTimeout(() => {
      nastavPracuje(false);
      nastavKliknuto(true);
    }, 900);
  };

  return (
    <div className="flex h-full flex-col justify-between bg-win-povrch p-5 text-win-text">
      <div>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold leading-snug">{HLASKA.nadpis}</h2>
            <p className="mt-1 text-[12px] leading-snug text-win-slaby">{HLASKA.podnadpis}</p>
          </div>
        </div>

        {kliknuto && (
          <p className="mt-4 rounded border border-win-linka bg-win-zvyrazneny px-3 py-2 text-[12px] leading-snug text-win-slaby">
            {HLASKA.poKliknuti}
          </p>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Tlacitko onClick={zkus} disabled={pracuje}>
            {pracuje ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Kontroluji…
              </span>
            ) : (
              HLASKA.tlacitkoAno
            )}
          </Tlacitko>
          <button
            type="button"
            onClick={zkus}
            disabled={pracuje}
            className="text-[11px] text-win-slaby underline decoration-dotted underline-offset-2 hover:text-win-text disabled:opacity-50"
          >
            {HLASKA.tlacitkoNe}
          </button>
        </div>

        <p className="mt-4 border-t border-win-linka pt-2 text-[10px] uppercase tracking-wide text-win-slaby">
          {HLASKA.patka}
        </p>
      </div>
    </div>
  );
}
