"use client";

/**
 * Kontext virtuálního počítače: jeden stav, jedno místo pro jeho změnu.
 *
 * Aplikace uvnitř si nedrží vlastní kopii disku – všechny čtou odtud. Kdyby
 * si Průzkumník držel svůj strom a terminál svůj, hned první `md` by je
 * rozešel a prostředí by přestalo dávat smysl.
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
import { reducer, type Akce } from "@/lib/win/reducer";
import { nacti, nastavUcetUloziste, uloz, vychoziStav, type Obdelnik, type Stav } from "@/lib/win/stav";
import { vyhodnot } from "@/lib/win/ukoly";
import { ulozPostup } from "@/lib/postup/klient";
import type { AppId } from "@/lib/win/typy";

interface Kontext {
  stav: Stav;
  poslat: Dispatch<Akce>;
  /** Rozměry plochy (obrazovka bez hlavního panelu) – pro pokládání oken. */
  plocha: Obdelnik;
  nastavPlochu: (o: Obdelnik) => void;
  /** Zkratka: spustí aplikaci na volném místě plochy. */
  spust: (app: AppId, arg?: string, titul?: string) => void;
  /** Zapíše doklad o tom, co žák udělal (pro úkolovník). */
  stopa: (klic: string) => void;
  /** Přihlášení k účtu s postupem; `null` = pokračovat jen lokálně. */
  prihlasUcet: (ucet: { prezdivka: string; splneno: string[] } | null) => void;
}

const SystemContext = createContext<Kontext | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [stav, poslat] = useReducer(reducer, null, vychoziStav);
  const [plocha, nastavPlochu] = useState<Obdelnik>({ x: 0, y: 0, w: 1280, h: 720 });
  // Než se přečte uložený stav, nemá cenu ho hned přepsat výchozím.
  const nacteno = useRef(false);
  /** Přihlášený žák i s postupem ze serveru; `null` = jede se jen lokálně. */
  const [ucet, nastavUcet] = useState<{ prezdivka: string; splneno: string[] } | null>(null);

  /**
   * Načtení stavu z místního úložiště. Běží i při PŘEPNUTÍ ÚČTU, ne jen při
   * startu: klíč nese přezdívku, takže se u přihlášení musí přečíst znovu
   * z jiného místa. Bez toho by se stav načtený před přihlášením uložil pod
   * cizí účet a dva žáci na jednom počítači by si míchali disk.
   *
   * Postup ze serveru se přimíchá PŘÍMO SEM, do jediného `system/nacti`.
   * Napoprvé se posílal zvlášť přes `setTimeout(0)` s tím, že doběhne až po
   * načtení – jenže je to naopak: efekt běží po vykreslení, takže `system/nacti`
   * dorazilo později a serverový postup přepsalo. Žák se přihlásil na druhém
   * počítači a viděl nula splněných úloh. Jedno dispatchnutí past ruší.
   */
  useEffect(() => {
    nastavUcetUloziste(ucet?.prezdivka ?? null);
    const ulozeny = nacti() ?? vychoziStav();
    const splneno = ucet
      ? [...new Set([...ulozeny.splneno, ...ucet.splneno])]
      : ulozeny.splneno;
    poslat({ typ: "system/nacti", stav: { ...ulozeny, splneno } });
    nacteno.current = true;
  }, [ucet]);

  useEffect(() => {
    if (!nacteno.current) return;
    uloz(stav);
  }, [stav]);

  // Úkoly se vyhodnocují po každé změně stavu. Jednou splněné zůstávají.
  useEffect(() => {
    const hotove = vyhodnot(stav);
    const nove = hotove.filter((id) => !stav.splneno.includes(id));
    if (nove.length) poslat({ typ: "ukoly/splneno", ids: nove });
  }, [stav]);

  /**
   * Odeslání postupu na server. Nezávazně: když synchronizace neběží nebo
   * spadne síť, prostředí jede dál a postup zůstane v prohlížeči.
   *
   * Server vrátí SLOUČENÝ seznam, takže se rovnou doplní i to, co žák udělal
   * na jiném počítači.
   */
  useEffect(() => {
    if (!ucet || !stav.splneno.length) return;
    let zahozeno = false;
    void ulozPostup(stav.splneno).then((sloucene) => {
      if (zahozeno || !sloucene) return;
      const chybejici = sloucene.filter((id) => !stav.splneno.includes(id));
      if (chybejici.length) poslat({ typ: "ukoly/splneno", ids: chybejici });
    });
    return () => {
      zahozeno = true;
    };
  }, [ucet, stav.splneno]);

  /** Zavolá přihlašovací obrazovka, až žák projde účtem. */
  const prihlasUcet = useCallback((novy: { prezdivka: string; splneno: string[] } | null) => {
    if (novy) nastavUcet(novy);
  }, []);

  const spust = useCallback(
    (app: AppId, arg?: string, titul?: string) => {
      poslat({ typ: "okno/otevri", app, arg, titul, plocha });
    },
    [plocha],
  );

  const stopa = useCallback((klic: string) => poslat({ typ: "stopa", klic }), []);

  const hodnota = useMemo<Kontext>(
    () => ({ stav, poslat, plocha, nastavPlochu, spust, stopa, prihlasUcet }),
    [stav, plocha, spust, stopa, prihlasUcet],
  );

  return <SystemContext.Provider value={hodnota}>{children}</SystemContext.Provider>;
}

export function useSystem(): Kontext {
  const kontext = useContext(SystemContext);
  if (!kontext) throw new Error("useSystem lze volat jen uvnitř SystemProvider.");
  return kontext;
}

/* ───────── kontext jednoho okna ───────── */

interface KontextOkna {
  id: number;
  /** Parametr, se kterým bylo okno spuštěno (cesta, soubor, stránka). */
  arg?: string;
  /** Přepíše text v záhlaví okna i popisek na hlavním panelu. */
  nastavTitul: (titul: string, arg?: string) => void;
  zavri: () => void;
  /** Je tohle okno právě navrchu? */
  aktivni: boolean;
  /**
   * Prvek v záhlaví okna. Aplikace si do něj portálem vykreslí vlastní pruh
   * (karty Průzkumníku). Dokud se nevykreslí okno, je `null`.
   */
  slotZahlavi: HTMLDivElement | null;
}

const OknoContext = createContext<KontextOkna | null>(null);

export const OknoProvider = OknoContext.Provider;

export function useOkno(): KontextOkna {
  const kontext = useContext(OknoContext);
  if (!kontext) throw new Error("useOkno lze volat jen uvnitř okna.");
  return kontext;
}
