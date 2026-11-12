"use client";

/**
 * Panel „Moje práce“: kód postupu ke zkopírování, odhlášení a začátek znovu
 * (rada a Codex 7. 11. 2026: na sdíleném počítači by další žák jinak sedl
 * do cizí práce). Kód nese jméno a všechny hodiny 1–7 najednou.
 *
 * Pokračování z kódu tu od 11. 11. 2026 není (Karel): kód se vkládá místo
 * jména při přihlášení.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Copy, LogOut, RotateCcw, X } from "lucide-react";
import { zakodujAlgolab, type PraceAlgolabu } from "@/lib/algolab/kod";
import { Hlaska, hlavni, poleTrida, tlacitko } from "./spolecne";

function kopiruj(text: string, hotovo: () => void, nejde: () => void) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(hotovo, nejde);
  } else {
    nejde();
  }
}

export function MojePrace({
  prace,
  hodina,
  nahrad,
  smazHodinu,
  odhlas,
  zavri,
}: {
  prace: PraceAlgolabu;
  /** Hodina, která je právě otevřená (8 = závěrečné ověření, to kód nenese). */
  hodina: number;
  /** Nahradí celou práci (null = smazání všeho). */
  nahrad: (novy: PraceAlgolabu | null) => void;
  smazHodinu: (cislo: number) => void;
  /** Zpět na přihlašovací obrazovku; práce v prohlížeči zůstane. */
  odhlas: () => void;
  zavri: () => void;
}) {
  const kod = zakodujAlgolab(prace);
  const [zkopirovano, nastavZkopirovano] = useState(false);
  const [rucne, nastavRucne] = useState(false);
  const [ptaSeNaSmazani, nastavPtaSeNaSmazani] = useState<"hodina" | "vse" | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const kodPole = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && zavri();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [zavri]);

  return (
    <div
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="moje-prace-nadpis"
      className="absolute right-4 top-[60px] z-30 flex w-[440px] max-w-[calc(100%-2rem)] flex-col gap-3 rounded-xl border border-white/[.14] bg-[#0d1714] p-4 shadow-2xl focus:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="moje-prace-nadpis" className="text-[17px] font-semibold">
          Moje práce
        </h2>
        <button type="button" onClick={zavri} aria-label="Zavřít" className="rounded p-1 text-[#a6bdb4] hover:text-[#e8f3ef]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[13px] leading-relaxed text-[#c5d6cf]">
        Práce se ukládá jen v tomhle prohlížeči. Chceš pokračovat jinde? Zkopíruj si kód postupu, ulož ho do OneNotu nebo si ho pošli
        v Teams. Na druhém počítači ho vlož místo jména při přihlášení. Kód nese tvoje jméno, všechny hodiny 1–7 i odpovědi v reflexi.
      </p>

      <div>
        <div className="mb-1 text-[13px] font-semibold">Kód postupu</div>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 select-all truncate rounded-lg border border-[#6f8a80] bg-[#080d0b] px-2 py-1.5 font-mono text-[11px]">
            {kod}
          </code>
          <button
            type="button"
            onClick={() =>
              kopiruj(
                kod,
                () => {
                  nastavZkopirovano(true);
                  nastavRucne(false);
                },
                () => {
                  nastavRucne(true);
                  window.setTimeout(() => kodPole.current?.select(), 0);
                },
              )
            }
            className={hlavni}
          >
            {zkopirovano ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {zkopirovano ? "Zkopírováno" : "Zkopírovat"}
          </button>
        </div>
        {rucne && (
          <div className="mt-2">
            <p className="mb-1 text-[12px] text-[#a6bdb4]">Kopírování se nepovedlo. Kód je označený, zkopíruj ho Ctrl+C.</p>
            <textarea
              ref={kodPole}
              readOnly
              value={kod}
              rows={3}
              aria-label="Kód postupu k ručnímu zkopírování"
              className={`${poleTrida} w-full font-mono !text-[11px]`}
            />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-3">
        {ptaSeNaSmazani === null ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={odhlas} className={tlacitko}>
              <LogOut className="h-4 w-4" /> Odhlásit se
            </button>
            {hodina !== 8 && (
              <button type="button" onClick={() => nastavPtaSeNaSmazani("hodina")} className={tlacitko}>
                <RotateCcw className="h-4 w-4" /> Začít hodinu {hodina} znovu
              </button>
            )}
            <button type="button" onClick={() => nastavPtaSeNaSmazani("vse")} className={tlacitko}>
              <RotateCcw className="h-4 w-4" /> Smazat všechny hodiny
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Hlaska druh="tip">
              {ptaSeNaSmazani === "hodina"
                ? `Smaže se tvoje práce v hodině ${hodina} v tomhle prohlížeči, ostatní hodiny zůstanou.`
                : "Smaže se tvoje práce ve všech hodinách 1–7 v tomhle prohlížeči."}{" "}
              Jestli se k ní chceš vrátit, zkopíruj si nejdřív kód postupu.
            </Hlaska>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => nastavPtaSeNaSmazani(null)} className={tlacitko}>
                Nechat být
              </button>
              <button
                type="button"
                onClick={() => {
                  if (ptaSeNaSmazani === "hodina") smazHodinu(hodina);
                  else nahrad(null);
                  zavri();
                }}
                className={hlavni}
              >
                Smazat a začít znovu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
