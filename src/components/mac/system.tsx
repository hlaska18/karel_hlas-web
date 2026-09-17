"use client";

/**
 * Kontext macOS simulace: jeden stav, jedno místo pro jeho změnu.
 *
 * Stejný tvar jako windowsový `win/system.tsx`, ale VLASTNÍ – sdílí se jen
 * souborový systém. Kdyby obě prostředí visela na jednom kontextu, každá
 * úprava Macu by sahala do simulace, která žákům běží v hodině.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { reducerMac, type AkceMac } from "@/lib/mac/reducer";
import { vyhodnotMac } from "@/lib/mac/ukoly";
import {
  nactiMac,
  ulozMac,
  vychoziStavMac,
  type AppId,
  type Obdelnik,
  type StavMac,
} from "@/lib/mac/stav";

interface Kontext {
  stav: StavMac;
  poslat: Dispatch<AkceMac>;
  /** Rozměry plochy (obrazovka bez horní lišty) – pro pokládání oken. */
  plocha: Obdelnik;
  nastavPlochu: (o: Obdelnik) => void;
  /** Spustí aplikaci. Když už běží a má okno, jen ho vytáhne dopředu. */
  spust: (app: AppId, arg?: string, titul?: string) => void;
  /** Zapíše doklad o tom, co žák udělal (pro úkolovník). */
  stopa: (klic: string) => void;
}

const MacContext = createContext<Kontext | null>(null);

export function MacProvider({ children }: { children: ReactNode }) {
  // Lazy inicializace přes šipku: `useReducer` by jinak předal `vychoziStavMac`
  // druhý argument (`null`) jako parametr.
  const [stav, poslat] = useReducer(reducerMac, null, () => vychoziStavMac());
  const [plocha, nastavPlochu] = useState<Obdelnik>({ x: 0, y: 0, w: 1280, h: 720 });

  /**
   * Stav, který jsme poslali z načtení. Ukládat se smí AŽ od chvíle, kdy se
   * propíše do `stav` – viz ukládací efekt níž.
   */
  const cekaSeNa = useRef<StavMac | null>(null);
  const nacteno = useRef(false);

  useEffect(() => {
    const ulozeny = nactiMac() ?? vychoziStavMac();
    cekaSeNa.current = ulozeny;
    poslat({ typ: "system/nacti", stav: ulozeny });
  }, []);

  /**
   * Ukládání. Past, na kterou jsem ve windowsové verzi naletěl a která by se
   * tady zopakovala jedna k jedné:
   *
   * Tenhle efekt běží ve STEJNÉM commitu jako načítací výš, jenže `stav` v něm
   * je pořád ten výchozí – dispatch se ještě nestihl propsat. Kdyby se ukládalo
   * hned, zapsal by se prázdný výchozí stav PŘES načtený postup. Ve vývoji to
   * navíc nezhojí další commit, protože StrictMode spouští efekty dvakrát
   * a druhé načtení už čte přepsané úložiště.
   *
   * Proto se ukládá až od chvíle, kdy TENHLE efekt uvidí přesně ten stav,
   * který načítací efekt poslal.
   */
  useEffect(() => {
    if (!nacteno.current) {
      if (cekaSeNa.current !== null && stav === cekaSeNa.current) nacteno.current = true;
      return;
    }
    ulozMac(stav);
  }, [stav]);

  // Úkoly se vyhodnocují po každé změně stavu. Jednou splněné zůstávají.
  useEffect(() => {
    const hotove = vyhodnotMac(stav);
    const nove = hotove.filter((id) => !stav.splneno.includes(id));
    if (nove.length) poslat({ typ: "ukoly/splneno", ids: nove });
  }, [stav]);

  const spust = useCallback(
    (app: AppId, arg?: string, titul?: string) => {
      poslat({ typ: "okno/otevri", app, arg, titul });
    },
    [],
  );

  const stopa = useCallback((klic: string) => poslat({ typ: "stopa", klic }), []);

  const hodnota = useMemo<Kontext>(
    () => ({ stav, poslat, plocha, nastavPlochu, spust, stopa }),
    [stav, plocha, spust, stopa],
  );

  return <MacContext.Provider value={hodnota}>{children}</MacContext.Provider>;
}

export function useMac(): Kontext {
  const kontext = useContext(MacContext);
  if (!kontext) throw new Error("useMac lze volat jen uvnitř MacProvider.");
  return kontext;
}

/* ───────── kontext jednoho okna ───────── */

interface KontextOkna {
  id: number;
  /** Parametr, se kterým se okno otevřelo (cesta, soubor). */
  arg?: string;
  /** Přepíše text uprostřed záhlaví. */
  nastavTitul: (titul: string, arg?: string) => void;
  zavri: () => void;
  aktivni: boolean;
  /**
   * Prvek v záhlaví okna. Aplikace si do něj portálem vykreslí vlastní
   * ovládání – na Macu sedí šipky, přepínání pohledů i hledání v TÉMŽE pruhu
   * jako semafor a název, ne v druhém proužku pod ním.
   */
  slotZahlavi: HTMLDivElement | null;
}

const OknoContext = createContext<KontextOkna | null>(null);

export const OknoMacProvider = OknoContext.Provider;

export function useOknoMac(): KontextOkna {
  const kontext = useContext(OknoContext);
  if (!kontext) throw new Error("useOknoMac lze volat jen uvnitř okna.");
  return kontext;
}
