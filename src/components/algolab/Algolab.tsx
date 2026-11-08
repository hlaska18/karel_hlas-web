"use client";

/**
 * ALGOLAB: společná kostra lekcí (hlavička, seznam osmi hodin, fáze lekce).
 *
 * Koncepce je v `navrhy/ALGOLAB.md`. Hotová je zatím jen hodina 4. Ostatní hodiny
 * se do seznamu přidají jako další fáze se stejnou kostrou.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Grid3x3, Save } from "lucide-react";
import { FAZE, HODINY, KLIC_BATOHU, nactiBatoh, ulozBatoh, zOdlozeneho, type Faze, type StavBatohu } from "@/lib/algolab/stav";
import { Krokovani } from "./Krokovani";
import { MojePrace } from "./Prace";
import { FazePokus, FazeProblem } from "./Pokus";
import { FazeReflexe } from "./Reflexe";
import { Hlaska, Karta, Zjednoduseno, hlavni, tlacitko } from "./spolecne";
import { FazeVyzva } from "./Vyzva";
import { ZmenaZadani } from "./ZmenaZadani";

export function Algolab() {
  // Vykresluje se až v prohlížeči (`JenNaPocitaci`), úložiště se tu smí číst hned.
  const [stav, nastavStav] = useState<StavBatohu>(nactiBatoh);
  const obsah = useRef<HTMLDivElement>(null);
  const [prace, nastavPrace] = useState(false);
  /** Po načtení kódu nebo začátku znovu se fáze vykreslí od nuly (rozepsané odpovědi, počty chyb). */
  const [verze, nastavVerzi] = useState(0);
  /**
   * Novější zápis z jiné karty (Codex 7. 11. 2026). Dokud žák nerozhodne, tahle
   * karta neukládá: jinak by starší stav přepsal práci, kterou udělal vedle.
   */
  const [ziJinde, nastavZiJinde] = useState<string | null>(null);

  useEffect(() => {
    const zmena = (e: StorageEvent) => {
      if (e.key === KLIC_BATOHU && e.newValue !== null) nastavZiJinde(e.newValue);
    };
    window.addEventListener("storage", zmena);
    return () => window.removeEventListener("storage", zmena);
  }, []);

  useEffect(() => {
    if (ziJinde === null) ulozBatoh(stav);
  }, [stav, ziJinde]);

  const nahrad = useCallback((novy: StavBatohu) => {
    nastavStav(novy);
    nastavVerzi((v) => v + 1);
    obsah.current?.scrollTo({ top: 0 });
  }, []);

  /* Po přechodu do jiné fáze se fokus přesune na její nadpis, ať klávesnice ani čtečka neskončí nikde. */
  const prvni = useRef(true);
  useEffect(() => {
    if (prvni.current) {
      prvni.current = false;
      return;
    }
    // V otevřeném panelu Moje práce fokus zůstane (načtení kódu tam hlásí výsledek).
    if (document.activeElement?.closest("[role=dialog]")) return;
    const nadpis = obsah.current?.querySelector("h2");
    if (nadpis) {
      nadpis.setAttribute("tabindex", "-1");
      nadpis.focus({ preventScroll: true });
    }
  }, [stav.faze, verze]);

  const zmen = useCallback((zmena: Partial<StavBatohu>) => nastavStav((s) => ({ ...s, ...zmena })), []);

  const jdiNa = useCallback((faze: Faze, hotovaFaze?: Faze) => {
    nastavStav((s) => ({
      ...s,
      faze,
      hotovo: hotovaFaze && !s.hotovo.includes(hotovaFaze) ? [...s.hotovo, hotovaFaze] : s.hotovo,
    }));
    obsah.current?.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col bg-[#080d0b] text-[#e8f3ef] [&_:focus-visible]:outline [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-[#6fe3c2]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <Grid3x3 className="h-6 w-6 text-[#6fe3c2]" aria-hidden="true" />
          <h1 className="text-[17px] font-semibold">ALGOLAB</h1>
          <span className="text-[13px] text-[#a6bdb4]">algoritmická dílna, výsledky zůstávají v prohlížeči</span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => nastavPrace((p) => !p)} aria-expanded={prace} className={tlacitko}>
            <Save className="h-4 w-4" /> Moje práce
          </button>
          <Link href="/" className="flex items-center gap-1.5 text-[13px] text-[#a6bdb4] hover:text-[#e8f3ef]">
            <ArrowLeft className="h-3.5 w-3.5" /> Zpět na web
          </Link>
        </div>
      </header>
      {prace && <MojePrace stav={stav} nahrad={nahrad} zavri={() => nastavPrace(false)} />}
      {ziJinde !== null && (
        <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-2.5">
          <div className="min-w-0 flex-1">
            <Hlaska druh="tip">
              ALGOLAB máš otevřený i v jiné kartě a práce se tam změnila. Aby se nic nepřepsalo, tahle karta teď neukládá. Vyber, s čím
              chceš pokračovat.
            </Hlaska>
          </div>
          <button
            type="button"
            onClick={() => {
              nahrad(zOdlozeneho(ziJinde));
              nastavZiJinde(null);
            }}
            className={hlavni}
          >
            Načíst práci z druhé karty
          </button>
          <button type="button" onClick={() => nastavZiJinde(null)} className={tlacitko}>
            Pokračovat tady
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Hodiny" className="flex w-[250px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-white/10 px-3 py-4">
          <div className="px-2 pb-1.5 text-[12px] font-semibold tracking-[.06em] text-[#a6bdb4]">OSM HODIN</div>
          {HODINY.map((h) => (
            <div
              key={h.cislo}
              aria-current={h.hotova ? "page" : undefined}
              className={`rounded-lg px-2.5 py-[7px] text-[13px] leading-snug ${h.hotova ? "bg-[#18332b] text-[#e8f3ef]" : "text-[#a6bdb4]"}`}
            >
              <span className="tabular-nums">{h.cislo}.</span> {h.nazev}
              {!h.hotova && <span className="mt-0.5 block text-[11px] opacity-80">připravuje se</span>}
            </div>
          ))}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col">
          <nav aria-label="Fáze lekce" className="flex shrink-0 flex-wrap gap-1 border-b border-white/10 px-5 py-2.5">
            {FAZE.map((f, i) => {
              const aktivni = stav.faze === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-current={aktivni ? "step" : undefined}
                  onClick={() => jdiNa(f.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] ${
                    aktivni ? "bg-[#18332b] font-semibold text-[#e8f3ef]" : "text-[#a6bdb4] hover:bg-[#101c18] hover:text-[#e8f3ef]"
                  }`}
                >
                  {stav.hotovo.includes(f.id) ? <Check className="h-3.5 w-3.5 text-[#6fe3c2]" strokeWidth={2.6} aria-label="hotovo" /> : <span className="tabular-nums">{i + 1}.</span>}
                  {f.nazev}
                  <span className="font-normal opacity-70">{f.minut} min</span>
                </button>
              );
            })}
          </nav>

          <div key={verze} ref={obsah} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {stav.faze === "problem" && <FazeProblem dal={() => jdiNa("pokus", "problem")} />}
            {stav.faze === "pokus" && <FazePokus stav={stav} zmen={zmen} dal={() => jdiNa("experiment", "pokus")} />}
            {stav.faze === "experiment" && <FazeExperiment stav={stav} zmen={zmen} dal={() => jdiNa("vyzva", "experiment")} />}
            {stav.faze === "vyzva" && <FazeVyzva stav={stav} zmen={zmen} dal={() => jdiNa("reflexe")} />}
            {stav.faze === "reflexe" && <FazeReflexe stav={stav} zmen={zmen} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function FazeExperiment({ stav, zmen, dal }: { stav: StavBatohu; zmen: (zmena: Partial<StavBatohu>) => void; dal: () => void }) {
  const cast = stav.castExperimentu;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-semibold">{cast === "tabulka" ? "Tabulka krok za krokem" : "Změň zadání"}</h2>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => zmen({ castExperimentu: "tabulka" })} aria-pressed={cast === "tabulka"} className={`${tlacitko} ${cast === "tabulka" ? "!border-[#6fe3c2]" : ""}`}>
            A. Krokování
          </button>
          <button type="button" onClick={() => zmen({ castExperimentu: "zmena" })} aria-pressed={cast === "zmena"} className={`${tlacitko} ${cast === "zmena" ? "!border-[#6fe3c2]" : ""}`}>
            B. Změň zadání
          </button>
        </div>
      </div>
      {cast === "tabulka" ? (
        <Krokovani stav={stav} zmen={zmen} dal={() => zmen({ castExperimentu: "zmena" })} />
      ) : (
        <ZmenaZadani stav={stav} zmen={zmen} dal={dal} />
      )}
      <Karta>
        <Zjednoduseno>
          Počítáme v celých hodinách. Tabulka potřebuje doby v celých jednotkách: s půlhodinami by měla dvakrát víc sloupců, s minutami
          šedesátkrát víc.
        </Zjednoduseno>
      </Karta>
    </div>
  );
}
