"use client";

/**
 * Nastavení systému.
 *
 * Na Macu je to aplikace jako každá jiná – má okno, běží v Docku a dá se
 * ukončit. To samo o sobě je rozdíl proti Windows, kde je Nastavení zvláštní
 * druh okna. Je tu schválně málo věcí: jen ty, které v prostředí opravdu
 * něco přepnou. Přepínač, po kterém se nic nestane, je horší než žádný.
 */

import { useEffect } from "react";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { useMac, useOknoMac } from "../system";

export function Nastaveni({ onZacitZnovu }: { onZacitZnovu: () => void }) {
  const { stav, poslat } = useMac();
  const { nastavTitul } = useOknoMac();
  const tmavy = stav.nastaveni.motiv === "tmavy";

  useEffect(() => {
    nastavTitul("Nastavení systému");
  }, [nastavTitul]);

  return (
    <div className="mac-posuv h-full overflow-y-auto bg-mac-povrch px-6 py-5 text-mac-text">
      <h2 className="text-[15px] font-semibold">Vzhled</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-mac-slaby">
        Světlý a tmavý režim mění celé prostředí, ne jen jedno okno. Na Macu se
        tomu říká vzhled a platí pro všechny aplikace naráz.
      </p>
      <div className="mt-3 flex gap-3">
        {([
          ["svetly", "Světlý", Sun],
          ["tmavy", "Tmavý", Moon],
        ] as const).map(([id, popis, Znak]) => {
          const vybrany = stav.nastaveni.motiv === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => poslat({ typ: "nastaveni/zmen", zmena: { motiv: id } })}
              className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13px] transition ${
                vybrany
                  ? "border-mac-akcent bg-mac-akcent/10 text-mac-text"
                  : "border-mac-linka bg-mac-povrch text-mac-slaby hover:bg-mac-zvyrazneny"
              }`}
            >
              <Znak className="h-5 w-5" />
              {popis}
              {vybrany && <span className="ml-auto text-[11px] text-mac-akcent">zapnuto</span>}
            </button>
          );
        })}
      </div>

      <div className="my-6 h-px bg-mac-linka" />

      <h2 className="text-[15px] font-semibold">Obnovení</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-mac-slaby">
        Vrátí prostředí do stavu, ve kterém jsi ho dostal. Smažou se soubory,
        které sis vytvořil, vrátí se nastavení a vynulují se odškrtnuté úlohy.
        Budeš se muset znovu přihlásit kódem od vyučujícího.
      </p>
      <button
        type="button"
        onClick={onZacitZnovu}
        className="mt-3 flex items-center gap-2 rounded-lg border border-mac-linka bg-mac-povrch px-4 py-2.5 text-[13px] text-mac-text hover:bg-mac-zvyrazneny"
      >
        <RotateCcw className="h-4 w-4" />
        Začít úplně od začátku…
      </button>
      {/* Řečeno nahlas i tady, ne jen v potvrzení: tohle je jediná věc
          v prostředí, která se nedá vzít zpět. */}
      <p className="mt-2 text-[11px] text-mac-slaby">Tohle se nedá vzít zpět.</p>
    </div>
  );
}
