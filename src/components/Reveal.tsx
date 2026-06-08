"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Odhalení při scrollu (fade + jemně zdola), spustí se JEN POPRVÉ.
 *  - Nad ohybem (už viditelné při načtení) se NESCHOVÁVÁ → žádné blikání,
 *    bezpečné pro výkon (obsah je vždy hned vidět; animace je jen nadstavba).
 *  - `stagger` = postupně odhalí přímé potomky (nadpis, karty, položky…).
 *  - Bez JS / reduced-motion → obsah zůstává viditelný.
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
  const [phase, setPhase] = useState<"idle" | "hidden" | "show">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return; // bez podpory → necháme viditelné
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const vh = window.innerHeight;
    // 0-viewport (atypické prostředí) nebo už nad ohybem → necháme hned viditelné.
    if (!vh || el.getBoundingClientRect().top < vh * 0.88) return;

    setPhase("hidden");
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setPhase("show");
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

  const classes = [className];
  let style: CSSProperties | undefined;

  if (stagger) {
    if (phase !== "idle") classes.push("reveal-stagger");
    if (phase === "show") classes.push("is-in");
  } else if (phase === "hidden") {
    classes.push("reveal-init");
  } else if (phase === "show") {
    classes.push("reveal-in");
    if (delay) style = { transitionDelay: `${delay}s` };
  }

  return (
    <Tag ref={ref} className={classes.join(" ").trim()} style={style}>
      {children}
    </Tag>
  );
}
