"use client";

import { SITE } from "@/lib/content";

/**
 * Portrét s elegantním fallbackem.
 * Monogram „KH" je vždy vykreslen vzadu; fotka /public/images/karel.jpg
 * ho překryje, jakmile ji vložíš. Když fotka chybí, zůstane monogram.
 */
export function Portrait({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label={SITE.name}
      className={`relative overflow-hidden rounded-[2rem] border border-black/5 shadow-2xl shadow-accent-900/10 ring-1 ring-black/5 dark:border-white/10 dark:ring-white/10 ${className}`}
    >
      {/* Monogram – vždy vzadu */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700">
        <span className="font-display text-7xl font-bold tracking-tight text-white/90 sm:text-8xl">
          {SITE.initials}
        </span>
      </div>

      {/* Fotka – překryje monogram; při chybě se schová */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SITE.photo}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="relative h-full w-full object-cover"
        loading="eager"
      />
    </div>
  );
}
