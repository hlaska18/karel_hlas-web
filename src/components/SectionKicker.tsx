import type { ReactNode } from "react";

/**
 * Kicker sekce s pořadovým číslem a smaragdovou tečkou – podpisový motiv
 * (tečka navazuje na tečku v tlačítkách). Rozbíjí uniformní rytmus sekcí.
 */
export function SectionKicker({ no, children }: { no: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
      <span className="font-display text-base font-bold tracking-normal text-accent-500">
        {no}
      </span>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
      <span>{children}</span>
    </p>
  );
}
