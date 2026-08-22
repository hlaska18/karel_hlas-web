"use client";

/**
 * Panel úkolů.
 *
 * Není to test a nic neblokuje – prostředí zůstává celou dobu volné. Panel
 * jen ukazuje, co se povedlo, a odškrtne se sám ve chvíli, kdy je výsledek
 * na počítači vidět. Dá se zabalit do proužku, aby nepřekážel, a rozbalit
 * zpátky, když žák neví, co dál.
 */

import { useMemo, useState } from "react";
import { Check, ChevronDown, ListChecks, X } from "lucide-react";
import { useSystem } from "./system";
import { SKUPINY, UKOLY, postup } from "@/lib/win/ukoly";

export function PanelUkolu() {
  const { stav } = useSystem();
  const [otevreny, nastavOtevreny] = useState(false);
  const [skryty, nastavSkryty] = useState(false);
  const [rozbaleneSkupiny, nastavSkupiny] = useState<string[]>([SKUPINY[0]]);

  const { hotovo, celkem } = postup(stav.splneno);
  const podleSkupin = useMemo(
    () =>
      SKUPINY.map((skupina) => ({
        skupina,
        ukoly: UKOLY.filter((u) => u.skupina === skupina),
      })),
    [],
  );

  if (skryty) return null;

  if (!otevreny) {
    return (
      <button
        type="button"
        onClick={() => nastavOtevreny(true)}
        className="win-bezvyberu absolute bottom-4 right-4 z-[550] flex items-center gap-2.5 rounded-full border border-win-linka bg-win-povrch px-4 py-2 text-[12px] text-win-text shadow-[var(--win-stin)] hover:bg-win-zvyrazneny"
      >
        <ListChecks className="h-4 w-4 text-win-akcent" />
        Úkoly
        <span className="rounded-full bg-win-akcent px-2 py-0.5 text-[11px] font-semibold text-win-akcent-text">
          {hotovo} / {celkem}
        </span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Úkoly"
      className="win-bezvyberu absolute bottom-4 right-4 z-[550] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-win-linka bg-win-povrch text-win-text shadow-[var(--win-stin)]"
    >
      <header className="shrink-0 border-b border-win-linka px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <ListChecks className="h-4 w-4 text-win-akcent" /> Úkoly
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Zabalit"
              onClick={() => nastavOtevreny(false)}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-win-zvyrazneny"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Skrýt úkoly do konce hodiny"
              title="Skrýt do obnovení stránky"
              onClick={() => nastavSkryty(true)}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-win-zvyrazneny"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-win-linka">
            <div
              className="h-full rounded-full bg-win-akcent transition-all"
              style={{ width: `${(hotovo / celkem) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] text-win-slaby">
            {hotovo} / {celkem}
          </span>
        </div>
      </header>

      <div className="win-posuv min-h-0 flex-1 overflow-auto p-2">
        {podleSkupin.map(({ skupina, ukoly }) => {
          const hotoveVeSkupine = ukoly.filter((u) => stav.splneno.includes(u.id)).length;
          const rozbalena = rozbaleneSkupiny.includes(skupina);
          return (
            <section key={skupina} className="mb-1">
              <button
                type="button"
                onClick={() =>
                  nastavSkupiny((s) =>
                    s.includes(skupina) ? s.filter((x) => x !== skupina) : [...s, skupina],
                  )
                }
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] font-semibold hover:bg-win-zvyrazneny"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    rozbalena ? "" : "-rotate-90"
                  }`}
                />
                <span className="flex-1 truncate">{skupina}</span>
                <span className="shrink-0 text-[11px] font-normal text-win-slaby">
                  {hotoveVeSkupine}/{ukoly.length}
                </span>
              </button>
              {rozbalena &&
                ukoly.map((u) => {
                  const splneno = stav.splneno.includes(u.id);
                  return (
                    <div key={u.id} className="flex gap-2.5 rounded px-2 py-1.5 pl-7">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          splneno
                            ? "border-win-akcent bg-win-akcent"
                            : "border-win-slaby"
                        }`}
                      >
                        {splneno && (
                          <Check className="h-2.5 w-2.5 text-win-akcent-text" strokeWidth={4} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div
                          className={`text-[12px] leading-snug ${
                            splneno ? "text-win-slaby line-through" : ""
                          }`}
                        >
                          {u.nazev}
                        </div>
                        {!splneno && (
                          <div className="mt-0.5 text-[11px] leading-snug text-win-slaby">
                            {u.popis}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </section>
          );
        })}
      </div>

      <footer className="shrink-0 border-t border-win-linka px-4 py-2 text-[11px] text-win-slaby">
        Úkoly se odškrtávají samy podle toho, co je v počítači vidět.
      </footer>
    </aside>
  );
}
