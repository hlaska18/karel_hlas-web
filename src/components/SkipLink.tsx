"use client";

import { useEffect, useState } from "react";
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
  // Kurz SQL je anglicky s `?z=en`. Parametr se čte až v prohlížeči:
  // `useSearchParams` v kořenovém layoutu by stránkám vzal statické
  // vykreslení.
  const [sqlEn, nastavSqlEn] = useState(false);
  useEffect(() => {
    nastavSqlEn(pathname === "/sql" && new URLSearchParams(window.location.search).get("z") === "en");
  }, [pathname]);
  const en = pathname === "/en" || pathname.startsWith("/en/") || sqlEn;

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ovladac focus:bg-accent-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      {en ? "Skip to content" : "Přeskočit na obsah"}
    </a>
  );
}
