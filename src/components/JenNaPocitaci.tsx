"use client";

/**
 * Simulátory (Windows, macOS, kurz SQL) jen na počítači – na telefonu ani na
 * tabletu se nespouštějí (Karel 29. 9. 2026). Počítač = obrazovka aspoň
 * 1024 px a myš (`pointer: fine`). Samotná šířka nestačila: iPad na šířku má
 * 1180 px, dostal celé prostředí a okna se prstem nedala ani přetáhnout.
 *
 * Rozhoduje se jednou po načtení, ne podle okna: přichycené okno (Win+←) nebo
 * zvětšená stránka na projektoru z počítače tablet neudělají.
 */

import { useEffect, useState, type ReactNode } from "react";

/** Zvládne zařízení simulátor? Obrazovka aspoň 1024 px a myš. */
export function jePocitac(): boolean {
  if (typeof window === "undefined") return false;
  const obrazovka = Math.max(window.screen.width, window.screen.height) >= 1024 && window.screen.width >= 1024;
  const mys = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: fine)").matches : true;
  return obrazovka && mys;
}

/**
 * Na počítači vykreslí `children`, jinde `jinak` (vysvětlení). Než se rozhodne
 * (vykreslení na serveru), neukáže nic – simulátor se na tabletu nesmí ani
 * na okamžik připojit a vysvětlení nemá na počítači probliknout.
 */
export function JenNaPocitaci({ children, jinak }: { children: ReactNode; jinak: ReactNode }) {
  const [pocitac, nastav] = useState<boolean | null>(null);
  useEffect(() => nastav(jePocitac()), []);
  if (pocitac === null) return null;
  return <>{pocitac ? children : jinak}</>;
}
