"use client";

/**
 * Přihlašovací obrazovka ALGOLABu (Karel 11. 11. 2026): jedno pole na jméno
 * nebo kód postupu, stejně jako ve Windows, na Macu a v NETLABu. Kód nese
 * jméno i celou práci hodin 1–7.
 *
 * Pole je vždycky prázdné: předvyplněné jméno předchozího žáka by nový jen
 * odklepl. Když v prohlížeči zůstala cizí práce, obrazovka se zeptá, čí je –
 * bez výchozího tlačítka, Enter nesmí převzít ani přepsat cizí práci.
 */

import { useState } from "react";
import type { PraceAlgolabu } from "@/lib/algolab/kod";
import { stejneJmeno, vstupAlgolabu, vypadaJakoKod } from "@/lib/algolab/prihlaseni";
import { hlavni, poleTrida, tlacitko } from "./spolecne";

type Dotaz = { druh: "cizi"; jmeno: string } | { druh: "nahradit"; jmeno: string; prace: PraceAlgolabu };

export function PrihlaseniAlgolabu({
  ulozeneJmeno,
  rozdelano,
  onHotovo,
}: {
  /** Jméno, pod kterým je v prohlížeči uložená práce („“ = žádné). */
  ulozeneJmeno: string;
  /** Je v hodinách 1–7 něco rozdělaného? */
  rozdelano: boolean;
  /** `prace`: `undefined` = nechat, co tu je; `null` = začít načisto; práce = nahradit prací z kódu. */
  onHotovo: (jmeno: string, prace: PraceAlgolabu | null | undefined) => void;
}) {
  const [text, nastavText] = useState("");
  const [hlaska, nastavHlasku] = useState("");
  const [dotaz, nastavDotaz] = useState<Dotaz | null>(null);
  const vstup = text.trim() ? vstupAlgolabu(text) : null;
  const ciPrace = ulozeneJmeno ? (
    <>
      pod jménem <b>{ulozeneJmeno}</b>
    </>
  ) : (
    "bez jména"
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-6">
      <h2 className="mb-2 text-[24px] font-semibold">Přihlášení</h2>
      <p className="mb-5 max-w-md text-center text-[14px] leading-normal text-[#c5d6cf]">
        Osm hodin o algoritmech. Úlohu nejdřív zkusíš po svém, pak uvidíš, jak ji řeší algoritmus.
      </p>
      <form
        className="flex w-full max-w-sm flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const v = vstupAlgolabu(text);
          if (v.druh === "chyba") {
            nastavHlasku(v.hlaska);
            return;
          }
          nastavHlasku("");
          if (v.druh === "kod") {
            if (rozdelano) nastavDotaz({ druh: "nahradit", jmeno: v.jmeno, prace: v.prace });
            else onHotovo(v.jmeno, v.prace);
            return;
          }
          if (rozdelano && !(ulozeneJmeno && stejneJmeno(ulozeneJmeno, v.jmeno))) nastavDotaz({ druh: "cizi", jmeno: v.jmeno });
          else onHotovo(v.jmeno, undefined);
        }}
      >
        <label className="block">
          <span className="mb-1 block text-[13px] text-[#a6bdb4]">Jméno a příjmení, nebo kód postupu</span>
          <input
            autoFocus
            value={text}
            onChange={(e) => {
              nastavText(e.target.value);
              nastavHlasku("");
              nastavDotaz(null);
            }}
            autoComplete="off"
            spellCheck={false}
            // Kód postupu je mnohem delší než jméno.
            maxLength={70000}
            aria-describedby="algolab-prihlaseni-napoveda"
            className={`${poleTrida} w-full ${vypadaJakoKod(text) ? "font-mono !text-[12px]" : "!text-[15px]"}`}
          />
        </label>
        <p className={`min-h-[1.4em] text-[13px] ${hlaska ? "text-[#ff9d8a]" : "text-[#6fe3c2]"}`} role={hlaska ? "alert" : "status"}>
          {hlaska || (vstup?.druh === "kod" ? `Pokračuješ z kódu postupu: ${vstup.jmeno}.` : "")}
        </p>
        <button type="submit" disabled={dotaz !== null} className={`${hlavni} justify-center disabled:opacity-40`}>
          Vstoupit
        </button>
      </form>

      {dotaz?.druh === "cizi" && (
        <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-2 rounded-xl bg-[#122019] p-4 text-center">
          <p className="text-[13px] leading-relaxed text-[#c5d6cf]">Na tomhle počítači je rozdělaná práce {ciPrace}. Je tvoje?</p>
          {/* Žádné tlačítko není výchozí: Enter nesmí převzít cizí práci. */}
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => onHotovo(dotaz.jmeno, null)} className={tlacitko}>
              Ne, začít načisto
            </button>
            <button type="button" onClick={() => onHotovo(dotaz.jmeno, undefined)} className={tlacitko}>
              Ano, pokračovat
            </button>
          </div>
        </div>
      )}
      {dotaz?.druh === "nahradit" && (
        <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-2 rounded-xl bg-[#122019] p-4 text-center">
          <p className="text-[13px] leading-relaxed text-[#c5d6cf]">
            Na tomhle počítači je rozdělaná práce {ciPrace}. Práce z kódu ji nahradí.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => nastavDotaz(null)} className={tlacitko}>
              Nechat být
            </button>
            <button type="button" onClick={() => onHotovo(dotaz.jmeno, dotaz.prace)} className={tlacitko}>
              Nahradit prací z kódu
            </button>
          </div>
        </div>
      )}

      <p id="algolab-prihlaseni-napoveda" className="mt-6 max-w-md text-center text-[12px] leading-relaxed text-[#a6bdb4]">
        Jsi tu poprvé? Napiš jméno a příjmení. Pokračuješ z jiného počítače? Vlož místo jména svůj kód postupu, začíná ALG1-. Jméno
        ani práce se nikam neodesílají, zůstávají v tomhle prohlížeči.
      </p>
    </div>
  );
}
