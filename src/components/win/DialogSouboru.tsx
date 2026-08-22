"use client";

/**
 * Dialog Otevřít / Uložit jako.
 *
 * Používá ho Poznámkový blok i Malování. Je to zmenšený Průzkumník – a to
 * schválně: žák má poznat, že „uložit jako" znamená vybrat složku na tomtéž
 * disku, ne odložit soubor někam do aplikace.
 */

import { useMemo, useState } from "react";
import { ArrowUp, ChevronRight } from "lucide-react";
import { Ikona, IkonaSouboru } from "./Ikona";
import { Dialog, Pole, Tlacitko } from "./ui";
import { useSystem } from "./system";
import {
  jeSlozka,
  jmenoJeVporadku,
  najdiSlozku,
  nadrazena,
  pripona,
  rozloz,
  sloz,
} from "@/lib/win/fs";
import { zobrazeneJmeno } from "@/lib/win/nazvy";
import { RYCHLY_PRISTUP } from "@/lib/win/operace";

export function DialogSouboru({
  rezim,
  vychoziNazev = "",
  vychoziSlozka = "C:\\Users\\Zak\\Documents",
  filtr,
  popisFiltru,
  onZavrit,
  onPotvrdit,
}: {
  rezim: "otevrit" | "ulozit";
  vychoziNazev?: string;
  vychoziSlozka?: string;
  /** Přípony, které se nabízejí. Prázdné = všechny. */
  filtr?: string[];
  popisFiltru?: string;
  onZavrit: () => void;
  onPotvrdit: (cesta: string[]) => void;
}) {
  const { stav } = useSystem();
  const [kde, nastavKde] = useState(() => rozloz(vychoziSlozka));
  const [nazev, nastavNazev] = useState(vychoziNazev);
  const [chyba, nastavChybu] = useState<string | null>(null);

  const slozka = najdiSlozku(stav.disk, kde);
  const polozky = useMemo(() => {
    if (!slozka) return [];
    return [...slozka.deti]
      .filter((d) => jeSlozka(d) || !filtr?.length || filtr.includes(pripona(d.jmeno)))
      .filter((d) => !d.skryty)
      .sort((a, b) => {
        if (jeSlozka(a) !== jeSlozka(b)) return jeSlozka(a) ? -1 : 1;
        return a.jmeno.localeCompare(b.jmeno, "cs");
      });
  }, [slozka, filtr]);

  const potvrd = () => {
    const orezany = nazev.trim();
    if (!orezany) {
      nastavChybu("Zadejte název souboru.");
      return;
    }
    const problem = jmenoJeVporadku(orezany);
    if (problem) {
      nastavChybu(problem);
      return;
    }
    // Chybějící příponu doplníme podle filtru, jak to dělá i Windows.
    const doplneny =
      filtr?.length && !pripona(orezany) ? `${orezany}.${filtr[0]}` : orezany;
    if (rezim === "otevrit" && !slozka?.deti.some((d) => d.jmeno === doplneny)) {
      nastavChybu(`Soubor ${doplneny} v této složce není.`);
      return;
    }
    onPotvrdit([...kde, doplneny]);
  };

  return (
    <Dialog
      nadpis={rezim === "ulozit" ? "Uložit jako" : "Otevřít"}
      onZavrit={onZavrit}
      sirka="max-w-2xl"
      tlacitka={
        <>
          <Tlacitko vzhled="akcent" onClick={potvrd}>
            {rezim === "ulozit" ? "Uložit" : "Otevřít"}
          </Tlacitko>
          <Tlacitko onClick={onZavrit}>Zrušit</Tlacitko>
        </>
      }
    >
      <div className="flex h-64 overflow-hidden rounded border border-win-linka">
        <div className="win-posuv w-44 shrink-0 overflow-auto border-r border-win-linka bg-win-plocha p-1.5">
          {RYCHLY_PRISTUP.map((z) => (
            <button
              key={z.cesta}
              type="button"
              onClick={() => nastavKde(rozloz(z.cesta))}
              className={`flex h-8 w-full items-center gap-2 rounded px-2 text-left text-[12px] ${
                sloz(kde) === z.cesta ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
              }`}
            >
              <Ikona klic="slozka" velikost={16} /> {z.nazev}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-win-povrch">
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-win-linka px-2">
            <button
              type="button"
              aria-label="Nahoru"
              disabled={kde.length <= 1}
              onClick={() => nastavKde(nadrazena(kde))}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-win-zvyrazneny disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center gap-0.5 text-[12px] text-win-slaby">
              {kde.map((cast, i) => (
                <span key={`${cast}-${i}`} className="flex min-w-0 items-center">
                  {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => nastavKde(kde.slice(0, i + 1))}
                    className="truncate rounded px-1 hover:bg-win-zvyrazneny"
                  >
                    {zobrazeneJmeno(kde.slice(0, i + 1))}
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="win-posuv min-h-0 flex-1 overflow-auto p-1">
            {polozky.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-win-slaby">
                V této složce nic vhodného není.
              </div>
            ) : (
              polozky.map((p) => (
                <button
                  key={p.jmeno}
                  type="button"
                  onDoubleClick={() => {
                    if (jeSlozka(p)) nastavKde([...kde, p.jmeno]);
                    else onPotvrdit([...kde, p.jmeno]);
                  }}
                  onClick={() => {
                    if (jeSlozka(p)) nastavKde([...kde, p.jmeno]);
                    else nastavNazev(p.jmeno);
                  }}
                  className="flex h-8 w-full items-center gap-2.5 rounded px-2 text-left text-[12px] hover:bg-win-zvyrazneny"
                >
                  <IkonaSouboru jmeno={p.jmeno} slozka={jeSlozka(p)} velikost={18} />
                  <span className="truncate">
                    {jeSlozka(p) ? zobrazeneJmeno([...kde, p.jmeno]) : p.jmeno}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="w-24 shrink-0 text-[12px] text-win-slaby" htmlFor="nazev-souboru">
          Název souboru
        </label>
        <Pole
          id="nazev-souboru"
          value={nazev}
          onChange={(e) => {
            nastavNazev(e.target.value);
            nastavChybu(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && potvrd()}
          className="flex-1"
        />
      </div>
      {popisFiltru && (
        <div className="mt-2 flex items-center gap-3">
          <span className="w-24 shrink-0 text-[12px] text-win-slaby">Typ souboru</span>
          <span className="text-[12px]">{popisFiltru}</span>
        </div>
      )}
      {chyba && <p className="mt-2 text-[12px] text-[#c42b1c]">{chyba}</p>}
    </Dialog>
  );
}
