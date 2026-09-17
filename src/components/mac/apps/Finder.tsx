"use client";

/**
 * Finder.
 *
 * Proti windowsovému Průzkumníkovi tu jsou tři věci jinak, a všechny tři jsou
 * záměr, ne zjednodušení:
 *
 *   1. CESTA NEMÁ PÍSMENO DISKU. Všechno visí pod jediným `/` a připojený
 *      flash disk se objeví ve `/Volumes`. Proto je dole pruh s cestou –
 *      žák má vidět, kde zrovna je, zapsané tak, jak se to na Macu píše.
 *   2. SKRYTÉ JE JMÉNO, ne příznak. Cokoli s tečkou na začátku Finder neukáže.
 *      Přepínač v panelu nástrojů proto říká „položky s tečkou“, ne „skryté
 *      položky“ – ať je poznat, že je to něco jiného než ve Windows.
 *   3. `.app` NENÍ SOUBOR, je to složka. Finder ji ukazuje jako jednu položku
 *      a dovnitř pustí až přes nabídku – a to je jedna z úloh.
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Folder, FileText, HardDrive, Usb } from "lucide-react";
import { useMac, useOknoMac } from "../system";
import {
  DOKUMENTY,
  DOMOV,
  KOREN,
  OBRAZKY,
  PLOCHA,
  STAZENE,
  SVAZKY,
  jeBalicek,
  jeSkryte,
  rozlozMac,
  slozMac,
  sVlnovkou,
} from "@/lib/mac/cesty";
import { jeSlozka, najdiSlozku, velikost, type Uzel } from "@/lib/win/fs";
import { datumCas, velikostSloupec } from "@/lib/win/format";

const MISTA = [
  { jmeno: "Plocha", cesta: PLOCHA },
  { jmeno: "Dokumenty", cesta: DOKUMENTY },
  { jmeno: "Stažené", cesta: STAZENE },
  { jmeno: "Obrázky", cesta: OBRAZKY },
  { jmeno: "zak", cesta: DOMOV },
];

export function Finder() {
  const { stav, poslat } = useMac();
  const { arg, nastavTitul } = useOknoMac();

  /** Historie chození tam a zpět. Index ukazuje, kde v ní právě stojíme. */
  const [historie, nastavHistorii] = useState<string[][]>([
    arg ? rozlozMac(arg) : PLOCHA,
  ]);
  const [kde, nastavKde] = useState(0);
  const [vybrano, nastavVybrano] = useState<string | null>(null);

  const cesta = historie[kde];
  const slozka = najdiSlozku(stav.disk, cesta);

  const jmenoMista = cesta[cesta.length - 1] || "Macintosh HD";
  useEffect(() => {
    nastavTitul(jmenoMista);
  }, [jmenoMista, nastavTitul]);

  const jdi = (nova: string[]) => {
    nastavHistorii((h) => [...h.slice(0, kde + 1), nova]);
    nastavKde((k) => k + 1);
    nastavVybrano(null);
  };

  const polozky = useMemo(() => {
    if (!slozka) return [];
    const vse = stav.nastaveni.skrytePolozky
      ? slozka.deti
      : slozka.deti.filter((d) => !jeSkryte(d.jmeno));
    // Složky napřed, pak podle abecedy – Finder to tak dělá ve výchozím stavu.
    return [...vse].sort((a, b) => {
      const jaSlozka = jeSlozka(a) && !jeBalicek(a.jmeno);
      const jeSlozkaB = jeSlozka(b) && !jeBalicek(b.jmeno);
      if (jaSlozka !== jeSlozkaB) return jaSlozka ? -1 : 1;
      return a.jmeno.localeCompare(b.jmeno, "cs");
    });
  }, [slozka, stav.nastaveni.skrytePolozky]);

  const otevri = (u: Uzel) => {
    // Balíček se chová jako jeden kus. Dovnitř se jde až „Zobrazit obsah
    // balíčku“ – dokud to žák neudělá, nemá poznat, že je to složka.
    if (jeSlozka(u) && !jeBalicek(u.jmeno)) jdi([...cesta, u.jmeno]);
  };

  return (
    <div className="flex h-full bg-mac-povrch text-[13px] text-mac-text mac-bezvyberu">
      <aside className="mac-posuv w-[180px] shrink-0 overflow-y-auto border-r border-mac-linka bg-mac-postranni px-2 py-3">
        <Skupina nazev="Oblíbené" />
        {MISTA.map((m) => (
          <PolozkaBoku
            key={m.jmeno}
            jmeno={m.jmeno}
            znak={<Folder className="h-4 w-4 text-mac-akcent" />}
            aktivni={slozMac(cesta) === slozMac(m.cesta)}
            onClick={() => jdi(m.cesta)}
          />
        ))}
        <Skupina nazev="Umístění" />
        <PolozkaBoku
          jmeno="Macintosh HD"
          znak={<HardDrive className="h-4 w-4 text-mac-slaby" />}
          aktivni={cesta.length === 1}
          onClick={() => jdi([KOREN])}
        />
        <PolozkaBoku
          jmeno="FLASH"
          znak={<Usb className="h-4 w-4 text-mac-slaby" />}
          aktivni={slozMac(cesta) === "/Volumes/FLASH"}
          onClick={() => jdi([...SVAZKY, "FLASH"])}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[40px] shrink-0 items-center gap-2 border-b border-mac-linka bg-mac-panel px-3">
          <button
            type="button"
            aria-label="Zpět"
            disabled={kde === 0}
            onClick={() => {
              nastavKde((k) => k - 1);
              nastavVybrano(null);
            }}
            className="rounded p-1 hover:bg-mac-zvyrazneny disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Vpřed"
            disabled={kde >= historie.length - 1}
            onClick={() => {
              nastavKde((k) => k + 1);
              nastavVybrano(null);
            }}
            className="rounded p-1 hover:bg-mac-zvyrazneny disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-1 font-semibold">{jmenoMista}</span>

          <label className="ml-auto flex cursor-pointer items-center gap-2 text-[12px] text-mac-slaby">
            <input
              type="checkbox"
              checked={stav.nastaveni.skrytePolozky}
              onChange={(e) =>
                poslat({ typ: "nastaveni/zmen", zmena: { skrytePolozky: e.target.checked } })
              }
            />
            Položky s tečkou
          </label>
        </div>

        <div className="mac-posuv min-h-0 flex-1 overflow-y-auto">
          {!slozka ? (
            <p className="p-6 text-mac-slaby">Tahle složka tu není.</p>
          ) : polozky.length === 0 ? (
            <p className="p-6 text-mac-slaby">Složka je prázdná.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-mac-panel text-[11px] uppercase tracking-wide text-mac-slaby">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Název</th>
                  <th className="w-[160px] px-3 py-1.5 text-left font-medium">Datum změny</th>
                  <th className="w-[90px] px-3 py-1.5 text-right font-medium">Velikost</th>
                </tr>
              </thead>
              <tbody>
                {polozky.map((u) => {
                  const vybranaRadka = vybrano === u.jmeno;
                  return (
                    <tr
                      key={u.jmeno}
                      onClick={() => nastavVybrano(u.jmeno)}
                      onDoubleClick={() => otevri(u)}
                      className={`cursor-default ${
                        vybranaRadka
                          ? "bg-mac-akcent text-mac-akcent-text"
                          : "odd:bg-black/[0.02] hover:bg-mac-zvyrazneny"
                      }`}
                    >
                      <td className="flex items-center gap-2 px-3 py-1.5">
                        {jeSlozka(u) && !jeBalicek(u.jmeno) ? (
                          <Folder
                            className={`h-4 w-4 ${vybranaRadka ? "" : "text-mac-akcent"}`}
                          />
                        ) : (
                          <FileText className="h-4 w-4 opacity-70" />
                        )}
                        {/* Tečka na začátku se schválně nezvýrazňuje jinak –
                            žák ji má poznat sám podle jména, protože přesně
                            tak to na Macu funguje. */}
                        <span className="truncate">{u.jmeno}</span>
                      </td>
                      <td className="px-3 py-1.5 tabular-nums opacity-80">
                        {datumCas(u.zmeneno)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums opacity-80">
                        {jeSlozka(u) && !jeBalicek(u.jmeno) ? "--" : velikostSloupec(velikost(u))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pruh s cestou. Ve Windows je adresní řádek nahoře a píše se do něj;
            tady je dole a jen ukazuje – a hlavně ukazuje unixovou cestu. */}
        <div className="flex h-[24px] shrink-0 items-center gap-2 border-t border-mac-linka bg-mac-panel px-3 text-[11px] text-mac-slaby">
          <span className="tabular-nums">{sVlnovkou(cesta)}</span>
          <span className="ml-auto">{polozky.length} položek</span>
        </div>
      </div>
    </div>
  );
}

function Skupina({ nazev }: { nazev: string }) {
  return (
    <div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-mac-slaby">
      {nazev}
    </div>
  );
}

function PolozkaBoku({
  jmeno,
  znak,
  aktivni,
  onClick,
}: {
  jmeno: string;
  znak: React.ReactNode;
  aktivni: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-left ${
        aktivni ? "bg-mac-akcent text-mac-akcent-text" : "hover:bg-black/5"
      }`}
    >
      {znak}
      <span className="truncate">{jmeno}</span>
    </button>
  );
}
