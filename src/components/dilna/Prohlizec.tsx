"use client";

/**
 * Prohlížeč dílny. Weby jsou jen tři (`lib/dilna/stranky.ts`) a správa routeru.
 * Jestli se otevřou, záleží na stavu sítě.
 *
 * Stránky běží v rámu se zakázanými skripty. Odkaz v takovém rámu by se otevřel
 * v něm a skončil chybou, proto jsou z nich tučná slova a chodí se adresním
 * řádkem a tlačítky pod ním.
 */

import { useEffect, useMemo, useState } from "react";
import { ROUTER, type Router, type SitStav } from "@/lib/win/sit";
import { DOMOVSKA_SIT, STRANKY_SIT, strankaSit } from "@/lib/dilna/stranky";
import { SpravaRouteru } from "./SpravaRouteru";

const bezOdkazu = (html: string) => html.replace(/<a [^>]*>(.*?)<\/a>/g, "<strong>$1</strong>");

export function Prohlizec({
  sit,
  aktivni,
  onStopa,
  onZmenaRouteru,
}: {
  sit: SitStav;
  /** Záložka je vidět. Stránka otevřená na pozadí nic neověřuje. */
  aktivni: boolean;
  onStopa: (stopa: string) => void;
  onZmenaRouteru: (zmena: Partial<Router>) => void;
}) {
  const [adresa, nastavAdresu] = useState(DOMOVSKA_SIT);
  const [radek, nastavRadek] = useState(adresa);
  const obsah = useMemo(() => strankaSit(adresa, sit), [adresa, sit]);

  const otevrena = obsah.adresa;
  useEffect(() => {
    if (otevrena && aktivni) onStopa(`web:${otevrena}`);
  }, [otevrena, aktivni, onStopa]);

  const jdi = (kam: string) => {
    const cil = kam.trim();
    if (!cil) return;
    nastavAdresu(cil);
    nastavRadek(cil);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form
        className="flex shrink-0 items-center gap-2 border-b border-white/[.08] px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          jdi(radek);
        }}
      >
        <label htmlFor="dilna-adresa" className="text-[13px] text-[#a6bdb4]">
          Adresa
        </label>
        <input
          id="dilna-adresa"
          value={radek}
          onChange={(e) => nastavRadek(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-white/[.18] bg-[#0d1714] px-2.5 py-1.5 text-[14px] text-[#e8f3ef]"
        />
        <button type="submit" className="rounded-lg border border-white/[.14] bg-[#18332b] px-3 py-1.5 text-[13px] text-[#e8f3ef] hover:bg-[#1f4136]">
          Otevřít
        </button>
      </form>

      <div className="min-h-0 flex-1 bg-white" style={{ colorScheme: "light" }}>
        {obsah.router ? (
          <SpravaRouteru sit={sit} onStopa={onStopa} onZmena={onZmenaRouteru} />
        ) : (
          <iframe
            key={`${adresa}-${obsah.titulek}`}
            title={obsah.titulek}
            srcDoc={bezOdkazu(obsah.html)}
            // Prázdný sandbox = žádné skripty a cizí původ.
            sandbox=""
            className="h-full w-full border-0"
          />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-t border-white/[.08] px-3 py-1.5 text-[12px] text-[#a6bdb4]">
        <span className="mr-1">Stránky:</span>
        {[...STRANKY_SIT.map((s) => s.adresa), ROUTER].map((a) => (
          <button key={a} type="button" onClick={() => jdi(a)} className="rounded px-1.5 py-0.5 hover:bg-[#18332b] hover:text-[#e8f3ef]">
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
