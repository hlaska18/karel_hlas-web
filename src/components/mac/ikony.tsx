"use client";

/**
 * Ikony položek, jak je macOS kreslí ve VELKÉM.
 *
 * Bydlí to zvlášť, protože tytéž ikony potřebuje Finder v zobrazení ikon
 * i plocha. Dřív měla plocha vlastní bílé obrysy, takže jeden a týž soubor
 * vypadal na ploše jinak než ve Finderu – a to je přesně ta drobnost, kvůli
 * které prostředí nepůsobí jako skutečný systém.
 *
 * V seznamu Finderu zůstávají obrysové ikony z lucide: jsou 16 px a detail
 * by v nich zanikl.
 */

import { Package } from "lucide-react";
import type { Uzel } from "@/lib/win/fs";
import { jeSlozka } from "@/lib/win/fs";
import { jeBalicek } from "@/lib/mac/cesty";
import type { AppId } from "@/lib/mac/stav";
import { VZHLED_APLIKACI } from "./Dock";

/**
 * Které balíčky v /Applications spouštějí kterou aplikaci. Dvojklik na
 * `Terminál.app` má spustit Terminál – jinak by `.app` nebyl program, ale
 * jen podivná složka.
 */
export const APLIKACE_BALICKU: Record<string, AppId | undefined> = {
  "Finder.app": "finder",
  "Terminál.app": "terminal",
  "TextEdit.app": "poznamky",
};

/**
 * Velká ikona do mřížky.
 *
 * V seznamu jsou ikony obrysové, protože jsou 16 px a detail by v nich
 * zanikl. Tady je na detail místo, a právě on dělá ten macOSový dojem:
 * modrá složka s jazykem nahoře, bílý list s ohnutým rohem – a u balíčku
 * `.app` rovnou ikona té aplikace, úplně stejná jako v Docku. To není
 * ozdoba: přesně tím se na Macu pozná, že `.app` je program.
 */
export function VelkaIkona({ uzel }: { uzel: Uzel }) {
  const app = APLIKACE_BALICKU[uzel.jmeno];
  if (app) {
    const vzhled = VZHLED_APLIKACI[app];
    const Znak = vzhled.znak;
    const Plna = vzhled.plna;
    // Celá ikona, přesně ta z Docku.
    if (Plna) {
      return (
        <Plna
          className="h-10 w-10 shrink-0"
          style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.25))" }}
        />
      );
    }
    return (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center shadow-sm"
        // Stejný „squircle" jako v Docku – 22 % strany.
        style={{ background: vzhled.pozadi, borderRadius: 40 * 0.22 }}
      >
        <Znak className="h-6 w-6" style={{ color: vzhled.barva }} />
      </span>
    );
  }
  if (jeBalicek(uzel.jmeno)) return <Package className="h-10 w-10 shrink-0 text-mac-slaby" />;
  if (jeSlozka(uzel)) return <ZnakSlozky />;
  return <ZnakDokumentu />;
}

/** Modrá složka s jazykem. Barvy jsou pořád stejné, i v tmavém režimu. */
function ZnakSlozky() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="mac-slozka-celo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ED2F8" />
          <stop offset="1" stopColor="#3F97DF" />
        </linearGradient>
      </defs>
      <path
        d="M2 12.5a2 2 0 0 1 2-2h9.4a2 2 0 0 1 1.5.7l2 2.3H36a2 2 0 0 1 2 2v3.5H2z"
        fill="#4A9CDE"
      />
      <rect x="2" y="15" width="36" height="17.5" rx="2.6" fill="url(#mac-slozka-celo)" />
    </svg>
  );
}

/** Bílý list s ohnutým rohem a naznačeným textem. */
function ZnakDokumentu() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
      <path
        d="M9 5a2 2 0 0 1 2-2h12l8 8v24a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z"
        fill="#ffffff"
        stroke="#c6cad0"
        strokeWidth="1.1"
      />
      <path d="M23 3v6a2 2 0 0 0 2 2h6" fill="#e9ecef" stroke="#c6cad0" strokeWidth="1.1" />
      <g stroke="#ced2d8" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14 20h12M14 25h12M14 30h8" />
      </g>
    </svg>
  );
}
