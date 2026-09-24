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
  spustit,
  obnovit,
}: {
  minimalizovano: boolean;
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
      </div>
      <p
        className="pointer-events-none absolute left-0 right-0 top-6 text-center text-[13px] text-white/90"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
      >
        {minimalizovano
          ? "DB Browser je jen schovaný – vrátíš ho kliknutím na jeho ikonu na hlavním panelu dole."
          : "DB Browser je zavřený. Spusť ho dvojklikem na ikonu programu, nebo rovnou na soubor knihovna.db."}
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
