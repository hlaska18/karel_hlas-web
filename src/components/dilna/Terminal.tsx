"use client";

/**
 * Terminál dílny. Výpisy jsou ze stejných funkcí jako v simulátoru Windows
 * (`lib/win/sit.ts`), obálka ve schématu jede podle `lib/dilna/obalka.ts`.
 * Výpis se ukáže, až obálka dojede. Do té doby se nedá psát dál.
 */

import { useEffect, useRef, useState } from "react";
import { ROUTER, ipconfig, jeIpv4, nslookup, ping, tracert, type SitStav } from "@/lib/win/sit";
import { cestaObalky, delkaCesty, type CestaObalky } from "@/lib/dilna/obalka";
import type { Dukaz } from "@/lib/dilna/tipy";
import type { Obalka } from "./Schema";

const VYZVA = "C:\\Users\\Zak>";
const PRIKAZY = { ipconfig, ping, nslookup, tracert };
const UVOD = [
  "Cvičná konzole dílny. Zjednodušeno: umí ipconfig, ping, nslookup, tracert a cls.",
  "",
];
const USEK_MS = 540;

type Radek = { text: string; vstup?: boolean };

/** Co příkaz prokázal: podklad pro tipy ve schématu. */
function dukazy(prikaz: string, kam: string | undefined): Dukaz[] {
  if (prikaz === "ipconfig") return ["ipconfig"];
  if (prikaz === "nslookup") return kam ? ["nslookup"] : [];
  if (!kam) return [];
  if (prikaz === "tracert") return jeIpv4(kam) ? ["tracert-adresa"] : [];
  if (prikaz !== "ping") return [];
  if (kam === ROUTER) return ["ping-router"];
  return [jeIpv4(kam) ? "ping-adresa" : "ping-nazev"];
}

export function Terminal({
  sit,
  onObalka,
  onHotovo,
  aktivni,
}: {
  sit: SitStav;
  onObalka: (o: Obalka | null) => void;
  onHotovo: (stopy: string[], dukazy: string[], cesta: CestaObalky | null, prikaz: string) => void;
  /** Záložka je vidět: kurzor patří do řádku. */
  aktivni: boolean;
}) {
  const [radky, nastavRadky] = useState<Radek[]>(() => UVOD.map((text) => ({ text })));
  const [prikaz, nastavPrikaz] = useState("");
  const [bezi, nastavBezi] = useState(false);
  const historie = useRef<string[]>([]);
  const poloha = useRef(0);
  const casovace = useRef<number[]>([]);
  const vystup = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prvek = vystup.current;
    if (prvek) prvek.scrollTop = prvek.scrollHeight;
  }, [radky]);

  useEffect(() => {
    if (aktivni && !bezi) pole.current?.focus();
  }, [aktivni, bezi]);

  useEffect(() => {
    const seznam = casovace.current;
    return () => seznam.forEach((id) => window.clearTimeout(id));
  }, []);

  const tisk = (nove: string[]) => nastavRadky((r) => [...r, ...nove.map((text) => ({ text }))]);

  const spust = () => {
    const text = prikaz.trim();
    nastavPrikaz("");
    if (!text || bezi) return;
    historie.current = [...historie.current, text].slice(-30);
    poloha.current = historie.current.length;
    nastavRadky((r) => [...r, { text: `${VYZVA}${text}`, vstup: true }]);

    const [slovo, ...argumenty] = text.split(/\s+/);
    const jmeno = slovo.toLowerCase();
    if (jmeno === "cls") {
      nastavRadky([]);
      return;
    }
    if (!(jmeno in PRIKAZY)) {
      tisk([`'${slovo}' není názvem vnitřního ani vnějšího příkazu,`, "spustitelného programu nebo dávkového souboru.", ""]);
      return;
    }

    const vysledek = PRIKAZY[jmeno as keyof typeof PRIKAZY](sit, argumenty);
    const kam = argumenty.find((a) => !a.startsWith("/") && !a.startsWith("-"))?.toLowerCase();
    let stopy = vysledek.stopy ?? [];
    // Ověření opravy DNS: ping se musí podařit na název, ne na adresu.
    if (jmeno === "ping" && kam && !jeIpv4(kam) && stopy.includes("ping:internet:ok")) stopy = [...stopy, "ping:nazev:ok"];
    const cesta = cestaObalky(sit, jmeno, kam, vysledek.vystup);
    const konec = () => {
      tisk(vysledek.vystup);
      onHotovo(stopy, dukazy(jmeno, kam), cesta, jmeno);
    };
    if (!cesta || !cesta.zastavky.length) {
      konec();
      return;
    }

    nastavBezi(true);
    const trvani = delkaCesty(cesta.zastavky) * USEK_MS;
    onObalka({ zastavky: cesta.zastavky, selhala: cesta.selhala, trvani });
    casovace.current.push(
      window.setTimeout(() => {
        onObalka(null);
        nastavBezi(false);
        konec();
      }, trvani),
    );
  };

  const listuj = (smer: number) => {
    const nova = poloha.current + smer;
    if (nova < 0 || nova > historie.current.length) return;
    poloha.current = nova;
    nastavPrikaz(historie.current[nova] ?? "");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#050807]" onClick={() => pole.current?.focus()}>
      <div
        ref={vystup}
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-3.5 py-2.5 font-mono text-[13px] leading-[1.45] text-[#d7e6e0]"
      >
        {radky.map((r, i) => (
          <div key={i} className={`min-h-[18px] ${r.vstup ? "text-[#6fe3c2]" : ""}`}>
            {r.text}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-white/[.08] px-3.5 py-2 font-mono text-[13px]">
        <label htmlFor="dilna-prikaz" className="shrink-0 text-[#6fe3c2]">
          {VYZVA}
        </label>
        <input
          ref={pole}
          id="dilna-prikaz"
          value={prikaz}
          disabled={bezi}
          onChange={(e) => nastavPrikaz(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") spust();
            else if (e.key === "ArrowUp") {
              e.preventDefault();
              listuj(-1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              listuj(1);
            }
          }}
          autoComplete="off"
          spellCheck={false}
          // Řádek konzole má kurzor, rámeček fokusu by z něj dělal formulář.
          style={{ outline: "none" }}
          className="min-w-0 flex-1 border-0 bg-transparent text-[#e8f3ef] disabled:opacity-50"
        />
        <button
          type="button"
          disabled={bezi}
          onClick={spust}
          className="rounded-lg border border-white/[.14] bg-[#18332b] px-3 py-1.5 font-sans text-[13px] text-[#e8f3ef] hover:bg-[#1f4136] disabled:opacity-50"
        >
          Spustit
        </button>
      </div>
    </div>
  );
}
