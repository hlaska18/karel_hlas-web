"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Odhalení při scrollu (fade + jemně zdola), spustí se JEN POPRVÉ.
 *  - Skrytí řídí CSS (`html.js-reveal …`), které platí jen když je JS +
 *    IntersectionObserver → žádné měření pozice v JS (spolehlivé i v Safari),
 *    žádné blikání (skryto už před prvním vykreslením).
 *  - Bez JS / bez IO / reduced-motion → obsah zůstává viditelný.
 *  - `stagger` = postupně odhalí přímé potomky.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  /** Zpoždění startu (s) – jen pro jednoduchý reveal (ne stagger). */
  delay?: number;
  /** HTML element wrapperu (div, ul, ol…). Výchozí div. */
  as?: ElementType;
  /** Postupné odhalení přímých potomků. */
  stagger?: boolean;
  /** ponecháno kvůli zpětné kompatibilitě (nepoužívá se) */
  y?: number;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = stagger ? "reveal-stagger" : "reveal-anim";
  const cls = `${className} ${base}${shown ? " is-in" : ""}`.trim();
  const style: CSSProperties | undefined =
    !stagger && delay && shown ? { transitionDelay: `${delay}s` } : undefined;

  return (
    <Tag ref={ref} className={cls} style={style}>
      {children}
    </Tag>
  );
}
