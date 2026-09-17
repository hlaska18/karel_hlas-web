"use client";

/**
 * Panel úkolů.
 *
 * Není to test a nic neblokuje – prostředí zůstává celou dobu volné. Panel
 * jen ukazuje, co se povedlo, a odškrtne se sám ve chvíli, kdy je výsledek
 * na obrazovce vidět.
 *
 * ZABALIT SE DÁ, ZAVŘÍT NE. Ve windowsové verzi tu kdysi vedle šipky býval
 * křížek, který panel schoval do konce hodiny – a byla to past: žáci ho
 * mačkali v dobré víře a pak neměli jak úkoly vrátit. Tady proto žádný
 * křížek není od začátku; jediné ovládání panel vždycky jen zabalí do
 * proužku, ze kterého se vrátí jedním kliknutím.
 *
 * KROKY JSOU SCHOVANÉ. Návod se rozbalí až po kliknutí na úkol. Kdyby byly
 * kroky vidět pořád, je z panelu zeď textu – a rozhled po tom, co všechno
 * jde zkusit, je to hlavní, co má panel dávat.
 *
 * Panel sedí VLEVO DOLE, ne vpravo jako ve Windows: vpravo nahoře jsou ikony
 * plochy a vpravo dole by se pral s Dockem, který je uprostřed a roste do
 * stran.
 */

import { useMemo, useState } from "react";
import { Check, ChevronDown, ListChecks } from "lucide-react";
import { useMac } from "./system";
import { SKUPINY_MAC, UKOLY_MAC, postupMac } from "@/lib/mac/ukoly";

export function PanelUkoluMac() {
  const { stav } = useMac();
  const [otevreny, nastavOtevreny] = useState(false);
  const [rozbaleneSkupiny, nastavSkupiny] = useState<string[]>([SKUPINY_MAC[0]]);
  const [rozbaleneUkoly, nastavUkoly] = useState<string[]>([]);

  const { hotovo, celkem } = postupMac(stav.splneno);
  const podleSkupin = useMemo(
    () =>
      SKUPINY_MAC.map((skupina) => ({
        skupina,
        ukoly: UKOLY_MAC.filter((u) => u.skupina === skupina),
      })),
    [],
  );

  const prepni = (
    klic: string,
    seznam: string[],
    nastav: (s: string[]) => void,
  ) => nastav(seznam.includes(klic) ? seznam.filter((k) => k !== klic) : [...seznam, klic]);

  if (!otevreny) {
    return (
      <button
        type="button"
        onClick={() => nastavOtevreny(true)}
        className="mac-bezvyberu absolute bottom-4 left-4 z-[550] flex items-center gap-2.5 rounded-full bg-mac-povrch px-4 py-2 text-[12px] text-mac-text shadow-[var(--mac-stin)] hover:bg-mac-zvyrazneny"
      >
        <ListChecks className="h-4 w-4 text-mac-akcent" />
        Úkoly
        <span className="rounded-full bg-mac-akcent px-2 py-0.5 text-[11px] font-semibold text-mac-akcent-text tabular-nums">
          {hotovo} / {celkem}
        </span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Úkoly"
      className="mac-bezvyberu absolute bottom-4 left-4 z-[550] flex max-h-[72vh] w-[330px] flex-col overflow-hidden rounded-xl bg-mac-povrch text-mac-text shadow-[var(--mac-stin)]"
    >
      <header className="shrink-0 border-b border-mac-linka px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <ListChecks className="h-4 w-4 text-mac-akcent" /> Úkoly
          </h2>
          <button
            type="button"
            onClick={() => nastavOtevreny(false)}
            aria-label="Zabalit úkoly"
            className="rounded p-1 hover:bg-mac-zvyrazneny"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-mac-slaby">
          {/* Řekne se rovnou, proč jsou úkoly zrovna tyhle. Bez té věty vypadá
              seznam neúplně – chybí v něm všechno, co žák zná z Windows. */}
          Jenom věci, které ve Windows nejsou. Co už umíš odtamtud, se tu
          neopakuje.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mac-zvyrazneny">
            <div
              className="h-full rounded-full bg-mac-akcent transition-[width]"
              style={{ width: `${celkem ? (hotovo / celkem) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-mac-slaby">
            {hotovo} / {celkem}
          </span>
        </div>
      </header>

      <div className="mac-posuv min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {podleSkupin.map(({ skupina, ukoly }) => {
          const rozbalena = rozbaleneSkupiny.includes(skupina);
          const hotovychVeSkupine = ukoly.filter((u) => stav.splneno.includes(u.id)).length;
          return (
            <section key={skupina} className="mb-1">
              <button
                type="button"
                onClick={() => prepni(skupina, rozbaleneSkupiny, nastavSkupiny)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-mac-zvyrazneny"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-mac-slaby transition-transform ${
                    rozbalena ? "" : "-rotate-90"
                  }`}
                />
                <span className="flex-1 text-[12px] font-semibold">{skupina}</span>
                <span className="text-[11px] tabular-nums text-mac-slaby">
                  {hotovychVeSkupine} / {ukoly.length}
                </span>
              </button>

              {rozbalena &&
                ukoly.map((u) => {
                  const splneno = stav.splneno.includes(u.id);
                  const rozbaleny = rozbaleneUkoly.includes(u.id);
                  return (
                    <div key={u.id} className="ml-2">
                      <button
                        type="button"
                        onClick={() => prepni(u.id, rozbaleneUkoly, nastavUkoly)}
                        className="flex w-full gap-2 rounded-md px-2 py-1.5 text-left hover:bg-mac-zvyrazneny"
                      >
                        <span
                          className={`mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            splneno
                              ? "border-mac-akcent bg-mac-akcent text-mac-akcent-text"
                              : "border-mac-linka"
                          }`}
                        >
                          {splneno && <Check className="h-3 w-3" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-[12px] leading-snug ${
                              splneno ? "text-mac-slaby line-through" : ""
                            }`}
                          >
                            {u.nazev}
                          </span>
                          {rozbaleny && (
                            <span className="mt-1 block text-[11px] leading-relaxed text-mac-slaby">
                              {u.popis}
                            </span>
                          )}
                        </span>
                      </button>

                      {rozbaleny && (
                        <ol className="mb-2 ml-8 mr-2 list-decimal space-y-1 text-[11px] leading-relaxed text-mac-slaby marker:text-mac-akcent">
                          {u.kroky.map((krok, i) => (
                            <li key={i}>{krok}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
