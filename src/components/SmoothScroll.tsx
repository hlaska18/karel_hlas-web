"use client";

import { useEffect } from "react";

/**
 * Plynulé scrollování na kotvy (#sekce) – ale RYCHLE a bez prodlevy.
 * Nativní `scroll-behavior: smooth` se přes velkou vzdálenost rozjíždí pomalu
 * (působí to jako vteřinová prodleva). Tady řídíme animaci sami:
 * okamžitý start, ~0,48 s, svižné doběhnutí (easeOutCubic).
 *
 * Dvě věci navíc (Codex 27. 9. 2026):
 *  - Po doskoku se na cíl přesune i FOKUS. Jinak klávesnice zůstala na
 *    odkazu v menu nebo na „Přeskočit na obsah“ a další Tab vedl zpátky
 *    nahoru. Cíl bez vlastního fokusu dostane `tabindex="-1"`.
 *  - S „omezit pohyb“ (ve škole zapnuté) se skočí hned, bez animace – CSS
 *    `scroll-behavior` tuhle ruční animaci nezastaví.
 */
export function SmoothScroll() {
  useEffect(() => {
    const OFFSET = 80; // odsazení pod lepivou hlavičkou
    const DURATION = 480; // ms
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const omezitPohyb = () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // Fokus na cíl, ale bez dalšího posunu – stránka už stojí, kde má.
    function zamer(el: HTMLElement) {
      if (!el.hasAttribute("tabindex") && !el.matches("a[href], button, input, select, textarea")) {
        el.setAttribute("tabindex", "-1");
      }
      el.focus({ preventScroll: true });
    }

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

      if (Math.abs(distance) < 2 || omezitPohyb()) {
        window.scrollTo(0, targetY);
        history.replaceState(null, "", href);
        zamer(el);
        return;
      }

      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        window.scrollTo(0, startY + distance * easeOutCubic(t));
        if (t < 1) requestAnimationFrame(frame);
        else {
          history.replaceState(null, "", href);
          zamer(el);
        }
      };
      requestAnimationFrame(frame);
    }

    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, []);

  return null;
}
