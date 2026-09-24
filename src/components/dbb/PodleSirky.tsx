"use client";

/**
 * Vykreslí obsah jen na počítači (od 1024 px), nebo jen na menší obrazovce.
 *
 * Na stránce /sql jsou obě podoby kurzu – DB Browser pro počítač a webový
 * kurz pro telefon. Samotné CSS (`hidden lg:block`) by je jen schovalo:
 * obě by se připojily a obě by stahovaly SQLite. Tahle obálka pustí jen tu,
 * která je vidět. Hranice je stejná jako u simulátorů Windows a macOS.
 */

import { useEffect, useState, type ReactNode } from "react";

function useJePocitac(): boolean | null {
  const [jePocitac, nastav] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const zmena = () => nastav(mq.matches);
    zmena();
    // addListener kvůli Safari 12 – addEventListener na MediaQueryList umí až 14.
    mq.addListener(zmena);
    return () => mq.removeListener(zmena);
  }, []);
  return jePocitac;
}

export function JenNaPocitaci({ children }: { children: ReactNode }) {
  return useJePocitac() === true ? <>{children}</> : null;
}

export function JenNaMaleObrazovce({ children }: { children: ReactNode }) {
  return useJePocitac() === false ? <>{children}</> : null;
}
