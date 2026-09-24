"use client";

/**
 * Kterou podobu kurzu SQL ukázat: program DB Browser, nebo webový kurz.
 *
 * Rozhoduje se JEDNOU při načtení podle obrazovky (ne okna) a podle toho, jestli
 * má zařízení myš. Za běhu se nepřepíná: dřív stačilo přichytit okno k polovině
 * obrazovky (Win+←), zvětšit stránku kvůli projektoru nebo promítat v 1024×768
 * a kurz se uprostřed hodiny proměnil v jiný. Tablet s dotykem dostane webovou
 * podobu, i když má na šířku 1024 px – program stojí na dvojkliku a klávesách.
 *
 * Žák (nebo učitel) si podobu může přepnout ručně a volba se pamatuje.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Podoba = "program" | "web";

const KLIC = "sql-podoba";

/** Zvládne zařízení program? Obrazovka aspoň 1024 px a myš. */
export function zvladneProgram(): boolean {
  if (typeof window === "undefined") return false;
  const obrazovka = Math.max(window.screen.width, window.screen.height) >= 1024 && window.screen.width >= 1024;
  const mys = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: fine)").matches : true;
  return obrazovka && mys;
}

/** Otevřel žák odkaz s úlohou od učitele (/sql?ukol=…) nebo písemku (/sql?pisemka=A)? */
function maUlohu(): boolean {
  try {
    const p = new URLSearchParams(window.location.search);
    return !!p.get("ukol") || !!p.get("pisemka");
  } catch {
    return false;
  }
}

function jePisemka(): boolean {
  try {
    return !!new URLSearchParams(window.location.search).get("pisemka");
  } catch {
    return false;
  }
}

function vychozi(): Podoba {
  // Úloha od učitele a písemka běží jen v programu – kdo ho zvládne, dostane
  // ho i přes uloženou volbu webové podoby (volba se tím nepřepíše).
  if (maUlohu() && zvladneProgram()) return "program";
  try {
    const ulozena = localStorage.getItem(KLIC);
    if (ulozena === "program" || ulozena === "web") return ulozena;
  } catch {
    /* bez úložiště rozhodne zařízení */
  }
  return zvladneProgram() ? "program" : "web";
}

const PodobaKontext = createContext<{ podoba: Podoba | null; prepni: (p: Podoba) => void }>({
  podoba: null,
  prepni: () => undefined,
});

export function usePodoba() {
  return useContext(PodobaKontext);
}

export function PodobaKurzu({ children }: { children: ReactNode }) {
  const [podoba, nastav] = useState<Podoba | null>(null);
  useEffect(() => nastav(vychozi()), []);
  const prepni = (p: Podoba) => {
    try {
      localStorage.setItem(KLIC, p);
    } catch {
      /* volba platí aspoň do zavření stránky */
    }
    nastav(p);
    window.scrollTo(0, 0);
  };
  return <PodobaKontext.Provider value={{ podoba, prepni }}>{children}</PodobaKontext.Provider>;
}

/**
 * Obal programu. Než se rozhodne (vykreslení na serveru), řídí se šířkou jako
 * dřív, ať první obraz na počítači nebliká webovým kurzem.
 */
export function ObalProgramu({ children }: { children: ReactNode }) {
  const { podoba } = usePodoba();
  const trida =
    podoba === null
      ? "hidden vyska-obrazovky w-full overflow-hidden lg:block"
      : podoba === "program"
        ? "vyska-obrazovky w-full overflow-hidden"
        : "hidden";
  return <div className={trida}>{podoba === "program" ? children : null}</div>;
}

/** Obal webové podoby. Obsah je v HTML vždycky – kvůli vyhledávačům. */
export function ObalWebu({ children }: { children: ReactNode }) {
  const { podoba } = usePodoba();
  const trida = podoba === null ? "lg:hidden" : podoba === "web" ? "" : "hidden";
  return <div className={trida}>{children}</div>;
}

/** Připojí obsah jen ve webové podobě (webový kurz si jinak stahuje SQLite zbytečně). */
export function JenVeWebu({ children }: { children: ReactNode }) {
  const { podoba } = usePodoba();
  return podoba === "web" ? <>{children}</> : null;
}

/** Tlačítko z webové podoby do programu – jen na zařízení, které program zvládne. */
export function TlacitkoDoProgramu() {
  const { podoba, prepni } = usePodoba();
  const [muze, nastavMuze] = useState(false);
  useEffect(() => nastavMuze(zvladneProgram()), []);
  if (podoba !== "web" || !muze) return null;
  return (
    <button
      type="button"
      onClick={() => prepni("program")}
      className="mt-5 inline-flex items-center rounded-full bg-accent-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-800"
    >
      Otevřít kurz v programu DB Browser (lekce 1–19)
    </button>
  );
}

/** Ve webové podobě: odkaz s úlohou od učitele nebo písemka se otevře jen v programu. */
export function UlohaVeWebu() {
  const { podoba, prepni } = usePodoba();
  const [stav, nastavStav] = useState<"ne" | "muze" | "nemuze">("ne");
  const [pisemka, nastavPisemku] = useState(false);
  useEffect(() => {
    nastavStav(maUlohu() ? (zvladneProgram() ? "muze" : "nemuze") : "ne");
    nastavPisemku(jePisemka());
  }, []);
  if (podoba !== "web" || stav === "ne") return null;
  return (
    <div className="povrch mt-6 max-w-2xl rounded-karta border-l-4 border-accent-600 px-5 py-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
      <b>{pisemka ? "Tohle je odkaz na písemku." : "Máš úlohu od učitele."}</b>{" "}
      {stav === "muze"
        ? "Otevře se v programu DB Browser – přepni do něj."
        : pisemka
          ? "Písemka běží jen v programu DB Browser na počítači s myší – na telefonu ani tabletu ji psát nejde. Otevři stejný odkaz na počítači."
          : "Otevře se jen v programu DB Browser na počítači s myší. Otevři stejný odkaz na počítači; tady mezitím můžeš procvičovat lekce kurzu."}
      {stav === "muze" && (
        <button
          type="button"
          onClick={() => prepni("program")}
          className="ml-2 inline-flex items-center rounded-full bg-accent-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-800"
        >
          {pisemka ? "Otevřít písemku v programu" : "Otevřít úlohu v programu"}
        </button>
      )}
    </div>
  );
}
