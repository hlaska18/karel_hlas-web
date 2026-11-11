/**
 * Hodiny 1–3 a 5–7 se společným formátem stavu (`lekce.ts`). Hodina 4 má starší
 * vlastní stav (`stav.ts`), hodina 8 je závěrečné ověření s vlastním kódem.
 */

import { FAZE_LEKCE, type FazeLekce } from "./lekce";
import { vychoziH1 } from "./vyhledavani";
import { vychoziH2 } from "./razeni";
import { vychoziH3 } from "./mrizka";
import { vychoziH5 } from "./trasy";
import { FAZE_H6, vychoziH6 } from "./grafy";
import { FAZE_H7, vychoziH7 } from "./laborator";

export interface DefiniceLekce {
  faze: FazeLekce[];
  vychozi: () => object;
}

export const LEKCE: Record<number, DefiniceLekce> = {
  1: { faze: FAZE_LEKCE, vychozi: vychoziH1 },
  2: { faze: FAZE_LEKCE, vychozi: vychoziH2 },
  3: { faze: FAZE_LEKCE, vychozi: vychoziH3 },
  5: { faze: FAZE_LEKCE, vychozi: vychoziH5 },
  6: { faze: FAZE_H6, vychozi: vychoziH6 },
  7: { faze: FAZE_H7, vychozi: vychoziH7 },
};

export const CISLA_LEKCI = [1, 2, 3, 5, 6, 7];
