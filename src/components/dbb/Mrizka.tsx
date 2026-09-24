"use client";

/**
 * Mřížka s daty – výsledek dotazu na kartě Spustit SQL i tabulka na kartě
 * Prohlížet data. Jako v programu: čísla řádků vlevo, NULL šedě kurzívou,
 * čísla zarovnaná doprava. Na Prohlížet data navíc řazení kliknutím na
 * záhlaví, řádek filtrů a úprava buňky dvojklikem.
 */

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/dbb/jazyk";

export type Razeni = { sloupec: number; smer: "asc" | "desc" } | null;

export function Mrizka({
  sloupce,
  radky,
  filtry,
  nastavFiltr,
  razeni,
  kliknutiZahlavi,
  ulozBunku,
  vybrany,
  vyber,
}: {
  sloupce: string[];
  radky: unknown[][];
  filtry?: string[];
  nastavFiltr?: (sloupec: number, text: string) => void;
  razeni?: Razeni;
  kliknutiZahlavi?: (sloupec: number) => void;
  /** Uloží upravenou buňku; vrátí chybu, nebo null. */
  ulozBunku?: (radek: number, sloupec: number, hodnota: string) => string | null;
  vybrany?: { r: number; s: number } | null;
  vyber?: (r: number, s: number) => void;
}) {
  const [upravuje, nastavUpravuje] = useState<{ r: number; s: number; hodnota: string } | null>(null);
  const [chyba, nastavChybu] = useState<string | null>(null);
  const vstupRef = useRef<HTMLInputElement>(null);
  /** Escape úpravu zahodí; uložení i zrušení jdou jedinou cestou přes blur. */
  const zrusenoRef = useRef(false);

  useEffect(() => {
    if (upravuje && vstupRef.current) {
      vstupRef.current.focus();
      vstupRef.current.select();
    }
  }, [upravuje]);

  const potvrd = () => {
    if (!upravuje || !ulozBunku) return;
    const vysledek = ulozBunku(upravuje.r, upravuje.s, upravuje.hodnota);
    nastavUpravuje(null);
    nastavChybu(vysledek);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="dbb-posuv relative min-h-0 flex-1 overflow-auto bg-dbb-povrch">
        <table className="border-separate text-[12px]" style={{ borderSpacing: 0 }}>
          {/* sticky na buňkách, ne na <thead>: to Chrome umí až od verze 91. */}
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-[4] h-[22px] min-w-[34px] border-b border-r border-dbb-mrizka bg-dbb-hlavicka" />
              {sloupce.map((s, i) => (
                <th
                  key={i}
                  onClick={kliknutiZahlavi ? () => kliknutiZahlavi(i) : undefined}
                  className={`sticky top-0 z-[2] h-[22px] whitespace-nowrap border-b border-r border-dbb-mrizka bg-dbb-hlavicka px-2 text-left font-normal ${
                    kliknutiZahlavi ? "cursor-pointer hover:bg-dbb-hover" : ""
                  }`}
                >
                  {s}
                  {razeni && razeni.sloupec === i && (
                    <span className="ml-1 text-[9px] text-dbb-slaby">{razeni.smer === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
            {filtry && nastavFiltr && (
              <tr>
                <th className="sticky left-0 top-[22px] z-[4] border-b border-r border-dbb-mrizka bg-dbb-hlavicka" />
                {sloupce.map((s, i) => (
                  <th key={i} className="sticky top-[22px] z-[2] border-b border-r border-dbb-mrizka bg-dbb-povrch p-[2px] font-normal">
                    <input
                      value={filtry[i] || ""}
                      onChange={(e) => nastavFiltr(i, e.target.value)}
                      placeholder={t("Filtr", "Filter")}
                      aria-label={`${t("Filtr sloupce", "Filter column")} ${s}`}
                      spellCheck={false}
                      className="h-[18px] w-full min-w-[60px] border border-dbb-linka px-1 text-[12px] placeholder:text-dbb-slaby/70 focus:border-dbb-akcent"
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {radky.map((radek, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-[1] h-[20px] border-b border-r border-dbb-mrizka bg-dbb-hlavicka px-1.5 text-center text-dbb-slaby">
                  {r + 1}
                </td>
                {radek.map((bunka, s) => {
                  const vybrana = vybrany && vybrany.r === r && vybrany.s === s;
                  const edituje = upravuje && upravuje.r === r && upravuje.s === s;
                  const cislo = typeof bunka === "number";
                  return (
                    <td
                      key={s}
                      onMouseDown={() => vyber && vyber(r, s)}
                      onDoubleClick={
                        ulozBunku
                          ? () => nastavUpravuje({ r, s, hodnota: bunka === null ? "" : String(bunka) })
                          : undefined
                      }
                      className={`relative h-[20px] max-w-[340px] truncate whitespace-nowrap border-b border-r border-dbb-mrizka px-2 ${
                        cislo ? "text-right" : ""
                      } ${vybrana ? "bg-dbb-vyber" : ""}`}
                    >
                      {edituje && upravuje ? (
                        <input
                          ref={vstupRef}
                          value={upravuje.hodnota}
                          onChange={(e) => nastavUpravuje({ r, s, hodnota: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") {
                              e.preventDefault();
                              zrusenoRef.current = e.key === "Escape";
                              e.currentTarget.blur();
                            }
                          }}
                          onBlur={() => {
                            if (zrusenoRef.current) {
                              zrusenoRef.current = false;
                              nastavUpravuje(null);
                            } else potvrd();
                          }}
                          spellCheck={false}
                          aria-label={t("Upravit hodnotu buňky", "Edit cell value")}
                          className="absolute left-0 top-0 h-full w-full min-w-[80px] border border-dbb-akcent bg-dbb-povrch px-1.5 text-[12px]"
                        />
                      ) : bunka === null ? (
                        <span className="italic text-dbb-slaby/80">NULL</span>
                      ) : (
                        String(bunka)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chyba && (
        <div role="alert" className="flex shrink-0 items-start border-t border-dbb-linka bg-[#fdf3f2] px-2 py-1.5 text-[12px] text-[#a4262c]">
          <span className="flex-1">{t("Hodnotu se nepodařilo uložit:", "The value could not be saved:")} {chyba}</span>
          <button type="button" onClick={() => nastavChybu(null)} className="ml-3 underline">
            {t("Zavřít", "Close")}
          </button>
        </div>
      )}
    </div>
  );
}
