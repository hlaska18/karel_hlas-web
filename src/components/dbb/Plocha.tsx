"use client";

/**
 * Plocha po zavření (nebo minimalizaci) programu. Lekce 16 chce, aby žák
 * program zavřel bez uložení a databázi znovu otevřel – musí mít odkud.
 * Dvojklik na ikonu programu ho spustí prázdný, dvojklik na knihovna.db
 * ho spustí rovnou s databází, jako ve Windows.
 */

import { useState } from "react";
import { Database } from "lucide-react";
import { IkonaProgramu } from "@/components/dbb/Okno";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import { t } from "@/lib/dbb/jazyk";

function Ikona({
  popisek,
  obrazek,
  spustit,
  vybrana,
  vyber,
}: {
  popisek: string;
  obrazek: React.ReactNode;
  spustit: () => void;
  vybrana: boolean;
  vyber: () => void;
}) {
  return (
    <button
      type="button"
      onClick={vyber}
      onDoubleClick={spustit}
      onKeyDown={(e) => {
        if (e.key === "Enter") spustit();
      }}
      className={`mb-3 flex w-[84px] flex-col items-center rounded-[4px] border px-1 py-1.5 text-[12px] text-white ${
        vybrana ? "border-white/40 bg-white/25" : "border-transparent hover:bg-white/10"
      }`}
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
    >
      {obrazek}
      <span className="mt-1 text-center leading-tight">{popisek}</span>
    </button>
  );
}

export function Plocha({
  minimalizovano,
  napovedaLekce16,
  spustit,
  obnovit,
}: {
  minimalizovano: boolean;
  /** V lekci 16 žák program zavře schválně – ukázat mu, kudy zpátky. */
  napovedaLekce16?: boolean;
  spustit: (soubor: string | null) => void;
  obnovit: () => void;
}) {
  const [vybrana, nastavVybranou] = useState<string | null>(null);
  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #3a7bd5 0%, #1c4b8f 45%, #0b2a55 100%)" }}
      onMouseDown={(e) => e.target === e.currentTarget && nastavVybranou(null)}
    >
      <div className="flex flex-1 flex-col items-start p-3">
        <Ikona
          popisek="DB Browser for SQLite"
          obrazek={<IkonaProgramu className="h-10 w-10" />}
          vybrana={vybrana === "program"}
          vyber={() => nastavVybranou("program")}
          spustit={() => (minimalizovano ? obnovit() : spustit(null))}
        />
        <Ikona
          popisek={KNIHOVNA}
          obrazek={
            <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-white/90">
              <Database className="h-6 w-6 text-[#2e75b6]" />
            </span>
          }
          vybrana={vybrana === "soubor"}
          vyber={() => nastavVybranou("soubor")}
          spustit={() => (minimalizovano ? obnovit() : spustit(KNIHOVNA))}
        />
        {napovedaLekce16 && !minimalizovano && (
          <div
            className="pointer-events-none absolute left-[104px] top-[64px] flex items-center text-[14px] font-semibold text-white"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
          >
            <svg viewBox="0 0 40 20" className="mr-2 h-5 w-10" aria-hidden="true">
              <path d="M38 10H6M14 2L4 10l10 8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("Poklepej na knihovna.db – otevře se v DB Browseru", "Double-click knihovna.db – it opens in DB Browser")}
          </div>
        )}
      </div>
      <p
        className="pointer-events-none absolute left-0 right-0 top-6 text-center text-[13px] text-white/90"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
      >
        {minimalizovano
          ? t("DB Browser je jen schovaný – vrátíš ho kliknutím na jeho ikonu na hlavním panelu dole.", "DB Browser is only minimized – bring it back by clicking its icon on the taskbar at the bottom.")
          : t("DB Browser je zavřený. Spusť ho dvojklikem na ikonu programu, nebo rovnou na soubor knihovna.db.", "DB Browser is closed. Start it by double-clicking the program icon, or the knihovna.db file directly.")}
      </p>
      {/* Hlavní panel Windows – jen tolik, aby šel minimalizovaný program vrátit. */}
      <div className="flex h-[40px] shrink-0 items-center justify-center bg-[#f3f3f3]/90">
        <button
          type="button"
          aria-label="DB Browser for SQLite"
          title="DB Browser for SQLite"
          onClick={() => (minimalizovano ? obnovit() : spustit(null))}
          className="relative flex h-[34px] w-[40px] items-center justify-center rounded-[4px] hover:bg-black/[0.06]"
        >
          <IkonaProgramu className="h-6 w-6" />
          {minimalizovano && <span className="absolute bottom-[2px] h-[3px] w-[6px] rounded-full bg-[#5d5d5d]" />}
        </button>
      </div>
    </div>
  );
}
