"use client";

/**
 * Terminál Windows – karty s příkazovým řádkem a PowerShellem.
 *
 * Obojí pracuje nad stejným diskem jako Průzkumník. To je celý smysl: žák
 * napíše `md Test`, přepne se do okna vedle a složka tam je. Dokud jsou to
 * dva oddělené světy, zůstane příkazový řádek jen strašákem.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { useOkno, useSystem } from "../system";
import { doplnit, spust, uvitani, vyzva, type Rezim } from "@/lib/win/shell";
import { rozloz, sloz } from "@/lib/win/fs";

interface Karta {
  id: number;
  rezim: Rezim;
  cesta: string[];
  /** Vypsané řádky. Poslední prvek může být rozepsaný příkaz. */
  vystup: string[];
  historie: string[];
}

const DOMOV = ["C:", "Users", "Zak"];

export function Terminal() {
  const { stav, poslat, stopa } = useSystem();
  const { arg, nastavTitul } = useOkno();
  const [karty, nastavKarty] = useState<Karta[]>(() => [
    {
      id: 1,
      rezim: "cmd",
      cesta: arg ? rozloz(arg) : DOMOV,
      vystup: uvitani("cmd"),
      historie: [],
    },
  ]);
  const [aktivni, nastavAktivni] = useState(1);
  const [radek, nastavRadek] = useState("");
  const [vHistorii, nastavVHistorii] = useState(-1);
  const [nabidka, nastavNabidku] = useState(false);
  const konec = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLInputElement>(null);

  const karta = karty.find((k) => k.id === aktivni) ?? karty[0];

  useEffect(() => {
    nastavTitul(`${sloz(karta.cesta)} – ${karta.rezim === "cmd" ? "Příkazový řádek" : "PowerShell"}`);
  }, [karta.cesta, karta.rezim, nastavTitul]);

  useEffect(() => {
    konec.current?.scrollIntoView({ block: "end" });
  }, [karta.vystup]);

  const upravKartu = (uprava: (k: Karta) => Karta) =>
    nastavKarty((s) => s.map((k) => (k.id === aktivni ? uprava(k) : k)));

  const provedPrikaz = () => {
    const prikaz = radek;
    const vyzvaText = vyzva(karta.rezim, karta.cesta);
    const vysledek = spust(prikaz, {
      disk: stav.disk,
      cesta: karta.cesta,
      jmenoUctu: stav.nastaveni.jmenoUctu,
    }, karta.rezim);

    if (vysledek.ukoncit) {
      zavriKartu(karta.id);
      return;
    }
    if (vysledek.disk) poslat({ typ: "disk/nastav", disk: vysledek.disk });
    vysledek.stopy?.forEach(stopa);

    upravKartu((k) => ({
      ...k,
      cesta: vysledek.cesta ?? k.cesta,
      vystup: vysledek.vycistit
        ? []
        : [...k.vystup, `${vyzvaText}${prikaz}`, ...vysledek.vystup],
      historie: prikaz.trim() ? [...k.historie, prikaz] : k.historie,
    }));
    nastavRadek("");
    nastavVHistorii(-1);
  };

  const novaKarta = (rezim: Rezim) => {
    const id = Math.max(0, ...karty.map((k) => k.id)) + 1;
    nastavKarty((s) => [
      ...s,
      { id, rezim, cesta: karta.cesta, vystup: uvitani(rezim), historie: [] },
    ]);
    nastavAktivni(id);
    nastavRadek("");
  };

  const zavriKartu = (id: number) => {
    if (karty.length === 1) {
      // Poslední kartu nezavíráme – terminál by zůstal prázdný a bez cesty ven.
      upravKartu((k) => ({ ...k, vystup: uvitani(k.rezim) }));
      return;
    }
    const zbytek = karty.filter((k) => k.id !== id);
    nastavKarty(zbytek);
    if (aktivni === id) nastavAktivni(zbytek[zbytek.length - 1].id);
  };

  const naKlavesu = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      provedPrikaz();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const index = vHistorii < 0 ? karta.historie.length - 1 : Math.max(0, vHistorii - 1);
      if (karta.historie[index] !== undefined) {
        nastavRadek(karta.historie[index]);
        nastavVHistorii(index);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (vHistorii < 0) return;
      const index = vHistorii + 1;
      if (index >= karta.historie.length) {
        nastavRadek("");
        nastavVHistorii(-1);
      } else {
        nastavRadek(karta.historie[index]);
        nastavVHistorii(index);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const kusy = radek.split(" ");
      const posledni = kusy[kusy.length - 1];
      const navrhy = doplnit(
        { disk: stav.disk, cesta: karta.cesta, jmenoUctu: stav.nastaveni.jmenoUctu },
        posledni,
      );
      if (navrhy.length) {
        kusy[kusy.length - 1] = navrhy[0];
        nastavRadek(kusy.join(" "));
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      upravKartu((k) => ({ ...k, vystup: [] }));
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-[#0c0c0c] text-[#cccccc]"
      onClick={() => pole.current?.focus()}
    >
      {/* Karty */}
      <div className="relative flex h-9 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        {karty.map((k) => (
          <div
            key={k.id}
            className={`group flex h-7 items-center gap-2 rounded px-2.5 text-[12px] ${
              k.id === aktivni ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <button type="button" onClick={() => nastavAktivni(k.id)}>
              {k.rezim === "cmd" ? "Příkazový řádek" : "PowerShell"}
            </button>
            <button
              type="button"
              aria-label="Zavřít kartu"
              onClick={() => zavriKartu(k.id)}
              className="opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          aria-label="Nová karta"
          onClick={() => novaKarta(karta.rezim)}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Vybrat profil"
          onClick={() => nastavNabidku((n) => !n)}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {nabidka && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => nastavNabidku(false)} />
            <div className="win-vyjezd absolute left-2 top-9 z-[200] w-56 rounded-lg border border-white/15 bg-[#1f1f1f] p-1 shadow-lg">
              {(
                [
                  ["cmd", "Příkazový řádek"],
                  ["powershell", "Windows PowerShell"],
                ] as [Rezim, string][]
              ).map(([id, popis]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    novaKarta(id);
                    nastavNabidku(false);
                  }}
                  className="flex h-8 w-full items-center rounded px-2 text-left text-[13px] hover:bg-white/10"
                >
                  {popis}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Výpis */}
      <div className="win-posuv min-h-0 flex-1 overflow-auto p-2 font-mono text-[13px] leading-[1.35]">
        {karta.vystup.map((r, i) => (
          // Řádky výpisu nemají vlastní identitu – index je tu správný klíč.
          <div key={i} className="whitespace-pre-wrap break-words">
            {r || " "}
          </div>
        ))}
        <div className="flex flex-wrap">
          <span className="whitespace-pre text-[#cccccc]">{vyzva(karta.rezim, karta.cesta)}</span>
          <input
            ref={pole}
            autoFocus
            value={radek}
            onChange={(e) => nastavRadek(e.target.value)}
            onKeyDown={naKlavesu}
            spellCheck={false}
            aria-label="Příkaz"
            className="min-w-[8rem] flex-1 bg-transparent font-mono text-[13px] text-[#cccccc] caret-[#cccccc] outline-none"
          />
        </div>
        <div ref={konec} />
      </div>
    </div>
  );
}
