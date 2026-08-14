"use client";

import { usePathname } from "next/navigation";

/**
 * „Přeskočit na obsah" – první věc, na kterou padne fokus.
 *
 * Proč klientská komponenta: popisek se musí řídit jazykem stránky, ale leží
 * v kořenovém layoutu, který o adrese neví. `usePathname` funguje i při renderu
 * na serveru, takže na /en je v HTML rovnou anglický text — na rozdíl od
 * `<html lang>`, který se v jednom kořenovém layoutu nastavit nedá a dorovnává
 * ho až skript v `layout.tsx`.
 */
export function SkipLink() {
  const pathname = usePathname() ?? "/";
  const en = pathname === "/en" || pathname.startsWith("/en/");

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      {en ? "Skip to content" : "Přeskočit na obsah"}
    </a>
  );
}
