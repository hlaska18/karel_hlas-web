"use client";

/**
 * Panel „Moje práce“: kód postupu ke zkopírování, pokračování z kódu a začátek
 * celé lekce znovu (rada a Codex 7. 11. 2026: na sdíleném počítači by další žák
 * jinak sedl do cizí práce).
 */

import { useEffect, useRef, useState } from "react";
import { Check, Copy, RotateCcw, X } from "lucide-react";
import { dekodujAlgolab, zakodujAlgolab } from "@/lib/algolab/kod";
import { vychoziStav, type StavBatohu } from "@/lib/algolab/stav";
import { Hlaska, hlavni, poleTrida, tlacitko } from "./spolecne";

/** Je v lekci něco rozdělané? Jen tehdy se před přepsáním ptá. */
const neniPrazdna = (s: StavBatohu) => JSON.stringify(s) !== JSON.stringify(vychoziStav());

function kopiruj(text: string, hotovo: () => void, nejde: () => void) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(hotovo, nejde);
  } else {
    nejde();
  }
}

export function MojePrace({
  stav,
  nahrad,
  zavri,
}: {
  stav: StavBatohu;
  /** Nahradí celou práci (načtení z kódu, začátek znovu). */
  nahrad: (novy: StavBatohu) => void;
  zavri: () => void;
}) {
  const kod = zakodujAlgolab(stav);
  const [zkopirovano, nastavZkopirovano] = useState(false);
  const [rucne, nastavRucne] = useState(false);
  const [vlozeny, nastavVlozeny] = useState("");
  const [hlaska, nastavHlasku] = useState<{ ok: boolean; text: string } | null>(null);
  /** Kód je platný a čeká na potvrzení, že smí přepsat rozdělanou práci. */
  const [nacist, nastavNacist] = useState<StavBatohu | null>(null);
  const [ptaSeNaSmazani, nastavPtaSeNaSmazani] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const kodPole = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && zavri();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [zavri]);

  const nactiKod = () => {
    const novy = dekodujAlgolab(vlozeny);
    if (!novy) {
      nastavHlasku({ ok: false, text: "Tohle není kód postupu ALGOLABu. Vlož ho celý, začíná ALG1-." });
      return;
    }
    if (neniPrazdna(stav)) {
      nastavNacist(novy);
      return;
    }
    potvrdNacteni(novy);
  };

  const potvrdNacteni = (novy: StavBatohu) => {
    nahrad(novy);
    nastavNacist(null);
    nastavVlozeny("");
    nastavHlasku({ ok: true, text: "Načteno. Pokračuješ tam, kde jsi skončil(a)." });
  };

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
        v Teams a na druhém počítači ho vlož níž. Kód nese i tvoji odpověď v reflexi.
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

      <div>
        <label htmlFor="algolab-vlozeny-kod" className="mb-1 block text-[13px] font-semibold">
          Pokračovat z kódu
        </label>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            nactiKod();
          }}
        >
          <input
            id="algolab-vlozeny-kod"
            value={vlozeny}
            onChange={(e) => {
              nastavVlozeny(e.target.value);
              nastavHlasku(null);
              nastavNacist(null);
            }}
            placeholder="ALG1-…"
            spellCheck={false}
            autoComplete="off"
            aria-describedby={hlaska ? "algolab-hlaska-kodu" : undefined}
            aria-invalid={hlaska?.ok === false || undefined}
            className={`${poleTrida} min-w-0 flex-1 font-mono !text-[12px]`}
          />
          <button type="submit" disabled={!vlozeny.trim()} className={tlacitko}>
            Načíst
          </button>
        </form>
        {nacist && (
          <div className="mt-2 flex flex-col gap-2">
            <Hlaska druh="tip">Načtení nahradí práci, kterou máš teď v tomhle prohlížeči. Pokračovat?</Hlaska>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => nastavNacist(null)} className={tlacitko}>
                Nechat být
              </button>
              <button type="button" onClick={() => potvrdNacteni(nacist)} className={hlavni}>
                Nahradit prací z kódu
              </button>
            </div>
          </div>
        )}
        {hlaska && (
          <p id="algolab-hlaska-kodu" role="status" className={`mt-1.5 text-[13px] ${hlaska.ok ? "text-[#6fe3c2]" : "text-[#ff9d8a]"}`}>
            {hlaska.text}
          </p>
        )}
      </div>

      <div className="border-t border-white/10 pt-3">
        {!ptaSeNaSmazani ? (
          <button type="button" onClick={() => nastavPtaSeNaSmazani(true)} className={tlacitko}>
            <RotateCcw className="h-4 w-4" /> Začít celou lekci znovu
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <Hlaska druh="tip">
              Smaže se plán, odpovědi i reflexe v tomhle prohlížeči. Jestli se k práci chceš vrátit, zkopíruj si nejdřív kód postupu.
            </Hlaska>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => nastavPtaSeNaSmazani(false)} className={tlacitko}>
                Nechat být
              </button>
              <button
                type="button"
                onClick={() => {
                  nahrad(vychoziStav());
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
