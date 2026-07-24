"use client";

import { useEffect, useState } from "react";

/**
 * Efekt psacího stroje pro nadpis. Text se vypisuje po znacích a za ním
 * bliká kurzor.
 *
 * Tři věci, na kterých záleží:
 *  - Layout neposkakuje: plný text je vykreslený neviditelně ve stejné
 *    mřížkové buňce, takže drží výšku (jinak by nadpis při zalomení skákal).
 *  - Přístupnost + SEO: plný text je v DOM a nadpis nese `aria-label`,
 *    animovaná vrstva je `aria-hidden` (čtečka přečte celou větu naráz).
 *  - Omezený pohyb: při `prefers-reduced-motion` se text ukáže rovnou celý.
 */
export function Typewriter({
  text,
  // Rychle schválně: nadpis nese hlavní sdělení, takže se nesmí „louskat".
  // Celý se dopíše zhruba do 1,3 s – pohyb zaujme, ale čtení nezdržuje.
  speedMs = 40,
  startDelayMs = 150,
  className = "",
}: {
  text: string;
  /** Prodleva mezi znaky. */
  speedMs?: number;
  /** Pauza, než se začne psát (ať to nezačne dřív, než stránka dosedne). */
  startDelayMs?: number;
  className?: string;
}) {
  // Na serveru i před hydratací vykreslíme prázdno; plný text drží místo.
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setShown(text);
      setDone(true);
      return;
    }

    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) {
        timer = setTimeout(tick, speedMs);
      } else {
        setDone(true);
      }
    };
    timer = setTimeout(tick, startDelayMs);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [text, speedMs, startDelayMs]);

  return (
    <span aria-hidden className={`grid ${className}`}>
      {/* Drží rozměr (i po zalomení), takže se nadpis při psaní nehýbe.
          `select-none` = při označení nadpisu se text nezkopíruje dvakrát. */}
      <span className="invisible col-start-1 row-start-1 select-none">{text}</span>
      <span className="col-start-1 row-start-1">
        {shown}
        <span
          className={`tw-caret text-accent-500 ${done ? "" : "tw-caret--typing"}`}
        >
          _
        </span>
      </span>
    </span>
  );
}
