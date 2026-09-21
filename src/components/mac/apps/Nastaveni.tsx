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
import { TAPETY_MAC } from "@/lib/mac/stav";

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

      <h2 className="text-[15px] font-semibold">Pozadí plochy</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-mac-slaby">
        Tapeta platí pro celé prostředí. Na Macu se k ní dostaneš i pravým
        tlačítkem rovnou na ploše – „Změnit pozadí plochy…“.
      </p>
      <div className="mt-3 flex gap-3">
        {TAPETY_MAC.map((t) => {
          const vybrana = stav.nastaveni.tapeta === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => poslat({ typ: "nastaveni/zmen", zmena: { tapeta: t.id } })}
              className={`flex-1 rounded-lg border p-1.5 text-left transition ${
                vybrana
                  ? "border-mac-akcent bg-mac-akcent/10"
                  : "border-mac-linka hover:bg-mac-zvyrazneny"
              }`}
            >
              {/* Náhled je tatáž třída jako plocha, takže ukazuje doopravdy
                  to, co se zapne – ne domalovaný obrázek vedle. */}
              <span
                className="mac-tapeta block h-14 w-full rounded-md"
                data-tapeta={t.id}
                aria-hidden="true"
              />
              <span className="mt-1.5 flex items-center gap-1 px-0.5 text-[12px]">
                {t.nazev}
                {vybrana && <span className="ml-auto text-[11px] text-mac-akcent">zapnuto</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="my-6 h-px bg-mac-linka" />

      <h2 className="text-[15px] font-semibold">Dock</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-mac-slaby">
        Velikost Docku se mění tažením za svislou čárku v něm, hned vedle koše.
        Zvětšení nafoukne ikonu pod kurzorem – na skutečném Macu je vypnuté,
        tady zapnuté, protože je to nejnápadnější věc, kterou hlavní panel
        Windows nedělá.
      </p>
      <button
        type="button"
        onClick={() =>
          poslat({
            typ: "nastaveni/zmen",
            zmena: { dockZvetseni: !stav.nastaveni.dockZvetseni },
          })
        }
        className="mt-3 flex w-full items-center gap-3 rounded-lg border border-mac-linka bg-mac-povrch px-4 py-3 text-left text-[13px] hover:bg-mac-zvyrazneny"
      >
        Zvětšení ikon v Docku
        <span
          className={`ml-auto text-[11px] ${
            stav.nastaveni.dockZvetseni ? "text-mac-akcent" : "text-mac-slaby"
          }`}
        >
          {stav.nastaveni.dockZvetseni ? "zapnuto" : "vypnuto"}
        </span>
      </button>

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
