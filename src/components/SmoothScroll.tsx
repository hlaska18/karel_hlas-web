"use client";

import { useEffect } from "react";

/**
 * Plynulé scrollování na kotvy (#sekce) – ale RYCHLE a bez prodlevy.
 * Nativní `scroll-behavior: smooth` se přes velkou vzdálenost rozjíždí pomalu
 * (působí to jako vteřinová prodleva). Tady řídíme animaci sami:
 * okamžitý start, ~0,48 s, svižné doběhnutí (easeOutCubic).
 */
export function SmoothScroll() {
  useEffect(() => {
    const OFFSET = 80; // odsazení pod lepivou hlavičkou
    const DURATION = 480; // ms
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    function handle(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const id = decodeURIComponent(href.slice(1));
      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();

      const startY = window.scrollY;
      const targetY = Math.max(0, el.getBoundingClientRect().top + startY - OFFSET);
      const distance = targetY - startY;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || Math.abs(distance) < 2) {
        window.scrollTo(0, targetY);
        history.replaceState(null, "", href);
        return;
      }

      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        window.scrollTo(0, startY + distance * easeOutCubic(t));
        if (t < 1) requestAnimationFrame(frame);
        else history.replaceState(null, "", href);
      };
      requestAnimationFrame(frame);
    }

    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, []);

  return null;
}
