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
import { nacti, uloz, vychoziStav, type Obdelnik, type Stav } from "@/lib/win/stav";
import { scenarZAdresy } from "@/lib/win/scenare";
import { vyhodnot } from "@/lib/win/ukoly";
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
}

const SystemContext = createContext<Kontext | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  // Lazy inicializace přes šipku, ne `vychoziStav` přímo: `useReducer` by mu
  // předal druhý argument (`null`) jako scénář.
  const [stav, poslat] = useReducer(reducer, null, () => vychoziStav());
  const [plocha, nastavPlochu] = useState<Obdelnik>({ x: 0, y: 0, w: 1280, h: 720 });
  /**
   * Stav, který jsme poslali z načtení. Ukládat se smí AŽ od chvíle, kdy se
   * tenhle stav opravdu propíše do `stav` – viz ukládací efekt níž.
   */
  const cekaSeNa = useRef<Stav | null>(null);
  const nacteno = useRef(false);

  /**
   * Načtení stavu z místního úložiště. Postup nikam neodchází – účty žáků
   * na serveru byly zrušené, takže tohle je jediné místo, kde práce žije.
   */
  useEffect(() => {
    // Který scénář si žádá adresa (`?scenar=uklid`). Když má žák uložený
    // jiný, `nacti` mu postaví nový disk a odškrtané úlohy nechá.
    const scenar = scenarZAdresy();
    const ulozeny = nacti(scenar) ?? vychoziStav(scenar);
    cekaSeNa.current = ulozeny;
    poslat({ typ: "system/nacti", stav: ulozeny });
  }, []);

  /**
   * Ukládání. Pozor na pořadí – je v něm past, na kterou se dá snadno
   * naletět podruhé:
   *
   * Tenhle efekt běží ve STEJNÉM commitu jako ten načítací výš, jenže `stav`
   * v něm je pořád ten výchozí – dispatch se ještě nestihl propsat. Dokud se
   * příznak nastavoval rovnou v načítacím efektu, uložil se tedy prázdný
   * výchozí stav PŘES načtený postup. V produkci to samo od sebe zahojil
   * další commit, který zapsal načtený stav zpátky; ve vývoji ne, protože
   * React StrictMode efekty spouští dvakrát a druhé načtení už četlo
   * přepsané úložiště. Změřeno: `splneno` se po obnovení stránky vyprázdnilo.
   *
   * Proto se ukládá až od chvíle, kdy TENHLE efekt uvidí přesně ten stav,
   * který načítací efekt poslal. Do té doby se nezapisuje nic – a to je
   * správně i mimo StrictMode: zavřít kartu v tom okamžiku znamenalo přijít
   * o hodinu práce.
   */
  /*
   * Hlídač dvou karet, stejný jako v kurzu SQL a v macOS (audit 4. 10.
   * 2026). Žák otevře Windows podruhé (třeba odkazem z Teams) a obě karty by
   * ukládaly svou kopii disku – pozdější zápis by potichu přepsal práci
   * z té druhé. Nejnovější karta vyhrává, starší se zastaví a nic neukládá.
   * Přes localStorage a událost `storage` – BroadcastChannel starší Safari
   * neumí.
   */
  const kartaId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [jinaKarta, nastavJinouKartu] = useState(false);
  const jinaKartaRef = useRef(false);
  useEffect(() => {
    const k = "win11-vyuka-karta";
    try {
      localStorage.setItem(k, kartaId.current);
    } catch {
      /* bez úložiště se nic neukládá, takže není co hlídat */
    }
    const posluchac = (e: StorageEvent) => {
      if (e.key === k && e.newValue && e.newValue !== kartaId.current) {
        jinaKartaRef.current = true;
        nastavJinouKartu(true);
      }
    };
    window.addEventListener("storage", posluchac);
    return () => window.removeEventListener("storage", posluchac);
  }, []);

  useEffect(() => {
    if (!nacteno.current) {
      if (cekaSeNa.current !== null && stav === cekaSeNa.current) nacteno.current = true;
      return;
    }
    if (jinaKartaRef.current) return;
    uloz(stav);
  }, [stav]);

  // Úkoly se vyhodnocují po každé změně stavu. Jednou splněné zůstávají.
  useEffect(() => {
    const hotove = vyhodnot(stav);
    const nove = hotove.filter((id) => !stav.splneno.includes(id));
    if (nove.length) poslat({ typ: "ukoly/splneno", ids: nove });
  }, [stav]);

  const spust = useCallback(
    (app: AppId, arg?: string, titul?: string) => {
      poslat({ typ: "okno/otevri", app, arg, titul, plocha });
    },
    [plocha],
  );

  const stopa = useCallback((klic: string) => poslat({ typ: "stopa", klic }), []);

  const hodnota = useMemo<Kontext>(
    () => ({ stav, poslat, plocha, nastavPlochu, spust, stopa }),
    [stav, plocha, spust, stopa],
  );

  return (
    <SystemContext.Provider value={hodnota}>
      {children}
      {jinaKarta && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 p-6">
          <div
            role="alertdialog"
            aria-labelledby="win-jina-karta"
            className="max-w-[440px] rounded-lg bg-white px-5 py-4 text-[13px] leading-relaxed text-zinc-900 shadow-2xl"
          >
            <p id="win-jina-karta" className="text-[14px] font-semibold">
              Windows máš otevřené v jiné kartě
            </p>
            <p className="mt-2">
              Aby se ti práce nepřepsala, tahle karta se zastavila a nic neukládá. Pracuj v té
              novější – tuhle můžeš zavřít.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-md bg-[#005fb8] px-3 py-1.5 text-[12px] font-medium text-white hover:brightness-110"
            >
              Pokračovat tady (načte Windows znovu)
            </button>
          </div>
        </div>
      )}
    </SystemContext.Provider>
  );
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
