"use client";

/** Hodina 4: problém batohu. Má starší vlastní stav (`stav.ts`), kostru sdílí s ostatními hodinami. */

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { FAZE, KLIC_BATOHU, nactiBatoh, type Faze, type StavBatohu } from "@/lib/algolab/stav";
import { Krokovani } from "./Krokovani";
import { KostraLekce, UkladaniAlgolabu } from "./Kostra";
import { FazePokus, FazeProblem } from "./Pokus";
import { FazeReflexe } from "./Reflexe";
import { Karta, Zjednoduseno, tlacitko } from "./spolecne";
import { FazeVyzva } from "./Vyzva";
import { ZmenaZadani } from "./ZmenaZadani";

const FAZE_H4 = FAZE.map((f) => ({ ...f }));

export function Hodina4() {
  const uloz = useContext(UkladaniAlgolabu);
  const [stav, nastavStav] = useState<StavBatohu>(nactiBatoh);
  const prvni = useRef(true);
  useEffect(() => {
    if (prvni.current) {
      prvni.current = false;
      return;
    }
    uloz(KLIC_BATOHU, JSON.stringify(stav));
  }, [stav, uloz]);

  const zmen = useCallback((zmena: Partial<StavBatohu>) => nastavStav((s) => ({ ...s, ...zmena })), []);
  const jdiNa = useCallback((faze: Faze, hotovaFaze?: Faze) => {
    nastavStav((s) => ({
      ...s,
      faze,
      hotovo: hotovaFaze && !s.hotovo.includes(hotovaFaze) ? [...s.hotovo, hotovaFaze] : s.hotovo,
    }));
  }, []);

  return (
    <KostraLekce faze={FAZE_H4} aktualni={stav.faze} hotovo={stav.hotovo} jdiNa={(f) => jdiNa(f as Faze)}>
      {stav.faze === "problem" && <FazeProblem dal={() => jdiNa("pokus", "problem")} />}
      {stav.faze === "pokus" && <FazePokus stav={stav} zmen={zmen} dal={() => jdiNa("experiment", "pokus")} />}
      {stav.faze === "experiment" && <FazeExperiment stav={stav} zmen={zmen} dal={() => jdiNa("vyzva", "experiment")} />}
      {stav.faze === "vyzva" && <FazeVyzva stav={stav} zmen={zmen} dal={() => jdiNa("reflexe")} />}
      {stav.faze === "reflexe" && <FazeReflexe stav={stav} zmen={zmen} />}
    </KostraLekce>
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
