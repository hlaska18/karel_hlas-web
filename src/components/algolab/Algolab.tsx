"use client";

/**
 * ALGOLAB: obal všech osmi hodin (hlavička, seznam hodin, Moje práce, hlídání
 * druhé karty). Koncepce je v `navrhy/ALGOLAB.md`.
 *
 * Každá hodina si stav ukládá sama pod vlastním klíčem, ale vždycky přes `uloz`
 * z obalu: ten si drží poslední zápis i v paměti (kód postupu pak funguje i bez
 * úložiště) a zastaví ukládání, když práci mezitím změnila jiná karta.
 */

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { ArrowLeft, Grid3x3, Save } from "lucide-react";
import { jePrazdna, type PraceAlgolabu } from "@/lib/algolab/kod";
import { KLIC_JMENA, ctiJmeno, jeVSezeni, jmenoPlatne, zapamatujSezeni } from "@/lib/algolab/prihlaseni";
import { klicHodiny, vychoziLekce, zDatLekce } from "@/lib/algolab/lekce";
import { CISLA_LEKCI, LEKCE } from "@/lib/algolab/registr";
import { HODINY, KLIC_BATOHU, zOdlozeneho } from "@/lib/algolab/stav";
import { ulozDoProhlizece } from "@/lib/ulozeni";
import { Hodina1 } from "./Hodina1";
import { Hodina2 } from "./Hodina2";
import { Hodina3 } from "./Hodina3";
import { Hodina4 } from "./Hodina4";
import { Hodina5 } from "./Hodina5";
import { Hodina6 } from "./Hodina6";
import { Hodina7 } from "./Hodina7";
import { UkladaniAlgolabu } from "./Kostra";
import { MojePrace } from "./Prace";
import { PrihlaseniAlgolabu } from "./Prihlaseni";
import { Hlaska, hlavni, tlacitko } from "./spolecne";
import { Zaverecne } from "./Zaverecne";

const KLIC_HODINY = "algolab-hodina";
/** Klíče, které patří práci žáka v hodinách 1–7 (hlídá je druhá karta). */
const KLICE_PRACE = [KLIC_BATOHU, ...CISLA_LEKCI.map(klicHodiny)];

const KOMPONENTY: Record<number, ComponentType> = { 1: Hodina1, 2: Hodina2, 3: Hodina3, 4: Hodina4, 5: Hodina5, 6: Hodina6, 7: Hodina7 };

function cti(klic: string): string | null {
  try {
    return window.localStorage.getItem(klic);
  } catch {
    return null;
  }
}

/** Úvodní hodina: z adresy (?hodina=3, ?zaverecne=ID), jinak naposledy otevřená. */
function uvodniHodina(): { hodina: number; zadani: string | null } {
  const p = new URLSearchParams(window.location.search);
  const zadani = p.get("zaverecne");
  if (zadani && /^[A-Za-z0-9]{3,12}$/.test(zadani)) return { hodina: 8, zadani: zadani.toUpperCase() };
  const z = Number(p.get("hodina") ?? cti(KLIC_HODINY));
  return { hodina: Number.isInteger(z) && z >= 1 && z <= 8 ? z : 1, zadani: null };
}

export function Algolab() {
  // Vykresluje se až v prohlížeči (`JenNaPocitaci`), adresa i úložiště se tu smí číst hned.
  const [uvod] = useState(uvodniHodina);
  const [hodina, nastavHodinu] = useState(uvod.hodina);
  const [prace, nastavPrace] = useState(false);
  /** Jméno žáka a jestli se v téhle kartě už přihlásil (Karel 11. 11. 2026). */
  const [jmeno, nastavJmeno] = useState(ctiJmeno);
  const [prihlasen, nastavPrihlasen] = useState(() => jeVSezeni() && jmenoPlatne(ctiJmeno()));
  /** Po načtení kódu nebo smazání se hodina vykreslí od nuly. */
  const [verze, nastavVerzi] = useState(0);
  /** Poslední zápis každého klíče v téhle kartě. */
  const pamet = useRef<Record<string, string>>({});
  /**
   * Novější zápis z jiné karty (Codex 7. 11. 2026). Dokud žák nerozhodne, tahle
   * karta neukládá: jinak by starší stav přepsal práci, kterou udělal vedle.
   */
  const [ziJinde, nastavZiJinde] = useState(false);
  const blokovano = useRef(false);

  useEffect(() => {
    const zmena = (e: StorageEvent) => {
      // I smazání vedle je změna: jinak by ho tahle karta dalším uložením vrátila.
      // `key === null` je smazání celého úložiště (localStorage.clear()).
      if (e.key === null || KLICE_PRACE.includes(e.key)) {
        blokovano.current = true;
        nastavZiJinde(true);
      }
    };
    window.addEventListener("storage", zmena);
    return () => window.removeEventListener("storage", zmena);
  }, []);

  const uloz = useCallback((klic: string, hodnota: string) => {
    pamet.current[klic] = hodnota;
    if (!blokovano.current) ulozDoProhlizece(klic, hodnota);
  }, []);

  const otevri = (cislo: number) => {
    nastavHodinu(cislo);
    try {
      window.localStorage.setItem(KLIC_HODINY, String(cislo));
    } catch {
      /* Naposledy otevřená hodina je jen pohodlí. */
    }
  };

  const aktualniPrace = (): PraceAlgolabu => {
    const text = (klic: string) => pamet.current[klic] ?? cti(klic);
    const lekce: PraceAlgolabu["lekce"] = {};
    for (const c of CISLA_LEKCI) {
      let data: unknown = null;
      try {
        data = JSON.parse(text(klicHodiny(c)) ?? "null");
      } catch {
        /* Rozbitý zápis = prázdná hodina. */
      }
      lekce[c] = zDatLekce(data, LEKCE[c].faze, LEKCE[c].vychozi);
    }
    return { h4: zOdlozeneho(text(KLIC_BATOHU)), lekce, ...(jmeno ? { jmeno } : {}) };
  };

  /** Přepíše práci ve všech hodinách 1–7 (null = smazat). */
  const nahrad = (nova: PraceAlgolabu | null) => {
    blokovano.current = false;
    nastavZiJinde(false);
    pamet.current = {};
    const zapis = (klic: string, hodnota: string | null) => {
      if (hodnota === null) {
        try {
          window.localStorage.removeItem(klic);
        } catch {
          /* Nic k smazání. */
        }
      } else uloz(klic, hodnota);
    };
    zapis(KLIC_BATOHU, nova ? JSON.stringify(nova.h4) : null);
    for (const c of CISLA_LEKCI) zapis(klicHodiny(c), nova ? JSON.stringify(nova.lekce[c]) : null);
    nastavVerzi((v) => v + 1);
  };

  const smazHodinu = (cislo: number) => {
    const klic = cislo === 4 ? KLIC_BATOHU : klicHodiny(cislo);
    if (cislo === 4) uloz(klic, JSON.stringify(zOdlozeneho(null)));
    else if (LEKCE[cislo]) uloz(klic, JSON.stringify(vychoziLekce(LEKCE[cislo].faze, LEKCE[cislo].vychozi)));
    nastavVerzi((v) => v + 1);
  };

  /** Přihlášení jménem (práce zůstane, nebo se začne načisto) nebo kódem postupu (práce z kódu). */
  const prihlas = (nove: string, nova: PraceAlgolabu | null | undefined) => {
    if (nova !== undefined) nahrad(nova);
    ulozDoProhlizece(KLIC_JMENA, nove);
    nastavJmeno(nove);
    zapamatujSezeni(true);
    nastavPrihlasen(true);
  };

  const odhlas = () => {
    zapamatujSezeni(false);
    nastavPrace(false);
    nastavPrihlasen(false);
  };

  const Hodina = KOMPONENTY[hodina];

  return (
    <UkladaniAlgolabu.Provider value={uloz}>
      <div className="relative flex h-full w-full flex-col bg-[#080d0b] text-[#e8f3ef] [&_:focus-visible]:outline [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-[#6fe3c2]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <Grid3x3 className="h-6 w-6 text-[#6fe3c2]" aria-hidden="true" />
            <h1 className="text-[17px] font-semibold">ALGOLAB</h1>
            <span className="text-[13px] text-[#a6bdb4]">algoritmická dílna, výsledky zůstávají v prohlížeči</span>
          </div>
          <div className="flex items-center gap-4">
            {prihlasen && (
              <>
                <span className="max-w-[220px] truncate text-[13px] text-[#c5d6cf]">{jmeno}</span>
                <button type="button" onClick={() => nastavPrace((p) => !p)} aria-expanded={prace} className={tlacitko}>
                  <Save className="h-4 w-4" /> Moje práce
                </button>
              </>
            )}
            <Link href="/" className="flex items-center gap-1.5 text-[13px] text-[#a6bdb4] hover:text-[#e8f3ef]">
              <ArrowLeft className="h-3.5 w-3.5" /> Zpět na web
            </Link>
          </div>
        </header>
        {prihlasen && prace && (
          <MojePrace prace={aktualniPrace()} hodina={hodina} nahrad={nahrad} smazHodinu={smazHodinu} odhlas={odhlas} zavri={() => nastavPrace(false)} />
        )}
        {!prihlasen && <PrihlaseniAlgolabu ulozeneJmeno={jmeno} rozdelano={!jePrazdna(aktualniPrace())} onHotovo={prihlas} />}
        {prihlasen && ziJinde && (
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
                pamet.current = {};
                blokovano.current = false;
                nastavZiJinde(false);
                nastavVerzi((v) => v + 1);
              }}
              className={hlavni}
            >
              Načíst práci z druhé karty
            </button>
            <button
              type="button"
              onClick={() => {
                blokovano.current = false;
                nastavZiJinde(false);
                for (const [klic, hodnota] of Object.entries(pamet.current)) ulozDoProhlizece(klic, hodnota);
              }}
              className={tlacitko}
            >
              Pokračovat tady
            </button>
          </div>
        )}

        {prihlasen && (
        <div className="flex min-h-0 flex-1">
          <nav aria-label="Hodiny" className="flex w-[250px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-white/10 px-3 py-4">
            <div className="px-2 pb-1.5 text-[12px] font-semibold tracking-[.06em] text-[#a6bdb4]">OSM HODIN</div>
            {HODINY.map((h) => (
              <button
                key={h.cislo}
                type="button"
                onClick={() => otevri(h.cislo)}
                aria-current={h.cislo === hodina ? "page" : undefined}
                className={`rounded-lg px-2.5 py-[7px] text-left text-[13px] leading-snug ${
                  h.cislo === hodina ? "bg-[#18332b] text-[#e8f3ef]" : "text-[#a6bdb4] hover:bg-[#101c18] hover:text-[#e8f3ef]"
                }`}
              >
                <span className="tabular-nums">{h.cislo}.</span> {h.nazev}
                {h.cislo === 8 && <span className="mt-0.5 block text-[11px] opacity-80">jediná se známkou</span>}
              </button>
            ))}
          </nav>

          {hodina === 8 ? <Zaverecne key={`8-${verze}`} zadaniZAdresy={uvod.zadani} jmeno={jmeno} /> : <Hodina key={`${hodina}-${verze}`} />}
        </div>
        )}
      </div>
    </UkladaniAlgolabu.Provider>
  );
}
