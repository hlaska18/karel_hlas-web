"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * GradientMenu – kruhové skleněné ikonky (liquid glass), které se po najetí
 * (i fokusu z klávesnice) rozvinou do pilulky se smaragdovým gradientem
 * a popiskem. Položky jsou <a href="#…"> → plynulý scroll zůstává.
 */

export type GradientMenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Gradient (smaragdová rodina dle palety webu). */
  from: string;
  to: string;
};

export function GradientMenu({ items }: { items: GradientMenuItem[] }) {
  return (
    <ul className="flex items-center gap-2">
      {items.map((it) => (
        <li key={it.href}>
          <a
            href={it.href}
            aria-label={it.label}
            style={{ "--gm-from": it.from, "--gm-to": it.to } as CSSProperties}
            className="group relative flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full glass-soft transition-all duration-500 hover:w-36 hover:shadow-lg hover:shadow-accent-600/30 focus-visible:w-36"
          >
            {/* gradient po najetí / fokusu */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ background: "linear-gradient(45deg, var(--gm-from), var(--gm-to))" }}
            />
            {/* ikona (v klidu) */}
            <span className="relative z-10 text-zinc-600 transition-all duration-500 group-hover:scale-0 group-focus-visible:scale-0 dark:text-zinc-300">
              {it.icon}
            </span>
            {/* popisek (po rozvinutí) */}
            <span className="absolute z-10 scale-0 whitespace-nowrap text-sm font-semibold text-white transition-all delay-100 duration-500 group-hover:scale-100 group-focus-visible:scale-100">
              {it.label}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default GradientMenu;
