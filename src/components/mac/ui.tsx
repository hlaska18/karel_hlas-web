"use client";

/**
 * Sdílené ovládací prvky macOS prostředí.
 *
 * Schválně vlastní, ne windowsové z `win/ui.tsx`: kontextová nabídka i okno
 * Informace mají na Macu jiný tvar a hlavně jiný obsah. Kdyby se sdílely,
 * každá úprava jedné simulace by sahala do druhé.
 */

import { useEffect, useRef, type ReactNode } from "react";

export interface PolozkaNabidky {
  text: string;
  akce?: () => void;
  /** Vodorovná čára pod položkou. */
  oddelovac?: boolean;
  /**
   * Značka vlevo před textem. Dock ji dává k seznamu oken: ✓ u okna vpředu,
   * ◆ u okna schovaného v Docku – přesně tak to kreslí macOS.
   */
  znak?: string;
}

/**
 * Místní (kontextová) nabídka po kliknutí pravým tlačítkem.
 *
 * Na Macu se do ní schovávají věci, které jinde bývají v pruhu nástrojů –
 * a je tam i „Zobrazit obsah balíčku", tedy jediná cesta dovnitř `.app`.
 * Žák ji musí najít, a to je záměr: kdyby byla na tlačítku, přestal by být
 * balíček balíčkem.
 */
export function NabidkaMistni({
  x,
  y,
  polozky,
  zavri,
  nad,
}: {
  x: number;
  y: number;
  polozky: PolozkaNabidky[];
  zavri: () => void;
  /**
   * Nabídka z Docku neroste od kurzoru dolů, ale stojí NAD ikonou, vystředěná
   * na ní. `x` je pak střed ikony a `y` její horní hrana.
   */
  nad?: boolean;
}) {
  const ram = useRef<HTMLDivElement>(null);
  /** Když má značku aspoň jedna položka, odsadí se všechny, ať texty lícují. */
  const sloupecZnaku = polozky.some((p) => p.znak);

  useEffect(() => {
    const venku = (e: MouseEvent) => {
      if (!ram.current?.contains(e.target as Node)) zavri();
    };
    const klavesa = (e: KeyboardEvent) => {
      if (e.key === "Escape") zavri();
    };
    // `mousedown` s malým zpožděním: bez něj by nabídku zavřela tatáž
    // událost, která ji otevřela.
    const id = window.setTimeout(() => {
      window.addEventListener("mousedown", venku);
      window.addEventListener("keydown", klavesa);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("mousedown", venku);
      window.removeEventListener("keydown", klavesa);
    };
  }, [zavri]);

  return (
    <div
      ref={ram}
      role="menu"
      // `pointer-events-auto`: Dock má `pointer-events-none` (myš jím
      // prochází mimo ikony) a nabídka, která v něm leží, by to zdědila –
      // otevřela by se, ale nešlo by na nic kliknout. Ve třídě se to stalo.
      className="mac-nabidka pointer-events-auto fixed z-[950] min-w-[220px] rounded-lg border border-black/10 bg-mac-panel/95 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl"
      style={
        nad
          ? {
              left: x,
              bottom: window.innerHeight - y + 10,
              transform: "translateX(-50%)",
            }
          : { left: x, top: y }
      }
    >
      {polozky.map((p, i) => (
        <div key={`${p.text}-${i}`}>
          <button
            type="button"
            role="menuitem"
            disabled={!p.akce}
            onClick={() => {
              p.akce?.();
              zavri();
            }}
            className={`w-full rounded px-3 py-[5px] text-left text-[13px] ${
              p.akce
                ? "text-mac-text hover:bg-mac-akcent hover:text-mac-akcent-text"
                : "cursor-default text-mac-slaby/60"
            }`}
          >
            {sloupecZnaku ? (
              <span className="inline-block w-4 text-[11px]">{p.znak}</span>
            ) : null}
            {p.text}
          </button>
          {p.oddelovac && <div className="my-1 h-px bg-mac-linka" />}
        </div>
      ))}
    </div>
  );
}

/**
 * Okno Informace (na Macu ⌘I).
 *
 * Protějšek windowsových Vlastností, ale ukazuje jiné věci – a právě ty jsou
 * důvod, proč tu je: druh položky (u `.app` „balíček aplikace", ne „soubor"),
 * plnou cestu psanou lomítky a bez písmene disku, a u složky počet položek.
 *
 * Je to plovoucí panel, ne okno aplikace: na Macu má Informace vlastní
 * malé okénko, které nepatří do Docku a nezasahuje do toho, co běží.
 */
export function PanelInformace({
  nadpis,
  radky,
  zavri,
}: {
  nadpis: string;
  radky: { popisek: string; hodnota: ReactNode }[];
  zavri: () => void;
}) {
  useEffect(() => {
    const klavesa = (e: KeyboardEvent) => {
      if (e.key === "Escape") zavri();
    };
    window.addEventListener("keydown", klavesa);
    return () => window.removeEventListener("keydown", klavesa);
  }, [zavri]);

  return (
    <div className="absolute inset-0 z-[860] flex items-center justify-center bg-black/20">
      <div className="mac-vjezd w-[340px] overflow-hidden rounded-xl bg-mac-povrch shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-2 border-b border-mac-linka bg-mac-panel px-3 py-2">
          <button
            type="button"
            aria-label="Zavřít"
            onClick={zavri}
            className="h-[12px] w-[12px] rounded-full"
            style={{ backgroundColor: "#ff5f57" }}
          />
          <span className="flex-1 truncate text-center text-[13px] font-semibold text-mac-text">
            {nadpis}
          </span>
          <span className="w-[12px]" />
        </div>
        <dl className="divide-y divide-mac-linka">
          {radky.map((r) => (
            <div key={r.popisek} className="flex gap-3 px-4 py-2 text-[12px]">
              <dt className="w-[92px] shrink-0 text-mac-slaby">{r.popisek}</dt>
              <dd className="min-w-0 flex-1 break-words text-mac-text">
                {r.hodnota}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
