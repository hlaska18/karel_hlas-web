"use client";

/**
 * Nabídka Start.
 *
 * Uspořádání je jako ve Windows 11: hledání nahoře, mřížka připnutých
 * aplikací, pod ní Doporučené s naposledy změněnými soubory, dole účet
 * a napájení. Doporučené nejsou vymyšlené – jsou to opravdu ty soubory,
 * se kterými žák naposled něco dělal.
 */

import { useMemo, useState } from "react";
import { ChevronRight, Power, Search } from "lucide-react";
import { Ikona, IkonaSouboru } from "./Ikona";
import { useSystem } from "./system";
import { jeSlozka, najdiSlozku, rozloz, sloz, type Uzel } from "@/lib/win/fs";
import { APLIKACE, typSouboru, type AppId } from "@/lib/win/typy";
import { datumCas } from "@/lib/win/format";

const PRIPNUTE: AppId[] = [
  "pruzkumnik",
  "prohlizec",
  "poznamkovy-blok",
  "malovani",
  "kalkulacka",
  "nastaveni",
  "terminal",
  "fotky",
  "spravce-uloh",
];

/** Složky, ze kterých se skládají Doporučené. */
const SLEDOVANE = [
  "C:\\Users\\Zak\\Desktop",
  "C:\\Users\\Zak\\Documents",
  "C:\\Users\\Zak\\Downloads",
  "C:\\Users\\Zak\\Pictures",
];

export function Start({
  zavri,
  onOdhlasit,
}: {
  zavri: () => void;
  onOdhlasit: (co: "odhlasit" | "restart" | "vypnout") => void;
}) {
  const { stav, spust } = useSystem();
  const [dotaz, nastavDotaz] = useState("");
  const [napajeni, nastavNapajeni] = useState(false);

  const doporucene = useMemo(() => {
    const nalezy: { uzel: Uzel; cesta: string }[] = [];
    for (const kde of SLEDOVANE) {
      const slozka = najdiSlozku(stav.disk, rozloz(kde));
      slozka?.deti.forEach((d) => {
        if (!jeSlozka(d) && !d.skryty) nalezy.push({ uzel: d, cesta: sloz([...rozloz(kde), d.jmeno]) });
      });
    }
    return nalezy.sort((a, b) => b.uzel.zmeneno - a.uzel.zmeneno).slice(0, 6);
  }, [stav.disk]);

  const hledane = dotaz.trim().toLowerCase();
  const nalezeneAplikace = (Object.keys(APLIKACE) as AppId[]).filter((id) =>
    APLIKACE[id].nazev.toLowerCase().includes(hledane),
  );

  const otevriSoubor = (cesta: string, jmeno: string) => {
    const typ = typSouboru(jmeno);
    spust(typ.app ?? "pruzkumnik", typ.app ? cesta : sloz(rozloz(cesta).slice(0, -1)));
    zavri();
  };

  return (
    <div
      className="win-sklo win-vyjezd win-bezvyberu absolute bottom-3 left-1/2 z-[500] flex max-h-[74vh] w-[640px] max-w-[94vw] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-win-linka text-win-text shadow-[var(--win-stin-nabidka)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hledání */}
      <div className="shrink-0 px-6 pb-2 pt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-win-slaby" />
          <input
            autoFocus
            value={dotaz}
            onChange={(e) => nastavDotaz(e.target.value)}
            placeholder="Zadejte hledaný text"
            aria-label="Hledat v systému"
            className="h-9 w-full rounded-full border border-win-linka bg-win-povrch pl-10 pr-3 text-[13px] outline-none focus:border-win-akcent"
          />
        </div>
      </div>

      <div className="win-posuv min-h-0 flex-1 overflow-auto px-6 pb-3">
        {/* Připnuté */}
        <div className="mb-2 mt-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">{hledane ? "Nejlepší shoda" : "Připnuto"}</h2>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {(hledane ? nalezeneAplikace : PRIPNUTE).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                spust(id);
                zavri();
              }}
              className="flex flex-col items-center gap-1.5 rounded-md p-2 hover:bg-win-zvyrazneny"
            >
              <Ikona klic={id} velikost={32} />
              <span className="line-clamp-2 text-center text-[11px] leading-tight">
                {APLIKACE[id].nazev}
              </span>
            </button>
          ))}
          {hledane && nalezeneAplikace.length === 0 && (
            <p className="col-span-6 py-6 text-center text-[12px] text-win-slaby">
              Nic se nenašlo. Zkus hledat soubory v Průzkumníku.
            </p>
          )}
        </div>

        {/* Doporučené */}
        {!hledane && (
          <>
            <div className="mb-2 mt-5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">Doporučené</h2>
              <button
                type="button"
                onClick={() => {
                  spust("pruzkumnik", "C:\\Users\\Zak");
                  zavri();
                }}
                className="flex items-center gap-1 rounded px-2 py-1 text-[12px] hover:bg-win-zvyrazneny"
              >
                Další <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {doporucene.map((d) => (
                <button
                  key={d.cesta}
                  type="button"
                  onClick={() => otevriSoubor(d.cesta, d.uzel.jmeno)}
                  className="flex items-center gap-3 rounded-md p-2 text-left hover:bg-win-zvyrazneny"
                >
                  <IkonaSouboru jmeno={d.uzel.jmeno} slozka={false} velikost={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px]">{d.uzel.jmeno}</span>
                    <span className="block truncate text-[11px] text-win-slaby">
                      {datumCas(d.uzel.zmeneno)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Účet a napájení */}
      <div className="relative flex shrink-0 items-center justify-between border-t border-win-linka bg-win-plocha/60 px-6 py-3">
        <button
          type="button"
          onClick={() => {
            spust("nastaveni", "ucty");
            zavri();
          }}
          className="flex items-center gap-2.5 rounded px-2 py-1.5 hover:bg-win-zvyrazneny"
        >
          <Ikona klic="uzivatel" velikost={26} />
          <span className="text-[13px]">{stav.nastaveni.jmenoUctu}</span>
        </button>
        <button
          type="button"
          aria-label="Napájení"
          onClick={() => nastavNapajeni((n) => !n)}
          className="flex h-9 w-9 items-center justify-center rounded hover:bg-win-zvyrazneny"
        >
          <Power className="h-4 w-4" />
        </button>
        {napajeni && (
          <div className="win-vyjezd absolute bottom-14 right-5 w-52 rounded-lg border border-win-linka bg-win-povrch p-1 shadow-[var(--win-stin-nabidka)]">
            {(
              [
                ["odhlasit", "Odhlásit se"],
                ["restart", "Restartovat"],
                ["vypnout", "Vypnout"],
              ] as const
            ).map(([id, popis]) => (
              <button
                key={id}
                type="button"
                onClick={() => onOdhlasit(id)}
                className="flex h-9 w-full items-center rounded px-3 text-left text-[13px] hover:bg-win-zvyrazneny"
              >
                {popis}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
