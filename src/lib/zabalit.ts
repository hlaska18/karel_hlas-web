"use client";

import { useEffect, useRef } from "react";

/**
 * „Zabalit vše“ – klik na logo v hlavičce vrátí stránku do výchozího stavu:
 * zavřou se rozbalené složky, lekce i dlaždice předmětů a banka se vrátí
 * na přehled témat (Karel 28. 9. 2026). Každá rozbalovací část si svůj stav
 * drží sama, proto logo nic nezavírá přímo – jen vyšle událost a části
 * na ni reagují přes `useZabalit`.
 */
const UDALOST = "web:zabalit-vse";

export function zabalitVse(): void {
  window.dispatchEvent(new Event(UDALOST));
}

/** Zavolá `zabal`, když někdo klikne na logo. */
export function useZabalit(zabal: () => void): void {
  const ref = useRef(zabal);
  ref.current = zabal;
  useEffect(() => {
    const h = () => ref.current();
    window.addEventListener(UDALOST, h);
    return () => window.removeEventListener(UDALOST, h);
  }, []);
}
