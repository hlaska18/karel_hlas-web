"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

/**
 * Přepínač jazyka – kolečko (stejná velikost jako přepínač motivu).
 * Ukazuje AKTUÁLNÍ jazyk stránky (CZ/EN); klik přepne stránku i jazyk
 * (odkaz / ↔ /en), takže funguje i bez JS.
 */
export function LangToggle() {
  const { lang } = useLang();
  const href = lang === "cs" ? "/en" : "/";
  const current = lang === "cs" ? "CZ" : "EN";
  const label = lang === "cs" ? "Switch to English" : "Přepnout do češtiny";

  return (
    <Link
      href={href}
      hrefLang={lang === "cs" ? "en" : "cs"}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-xs font-bold tracking-wide text-zinc-700 transition hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-accent-400"
    >
      {current}
    </Link>
  );
}
