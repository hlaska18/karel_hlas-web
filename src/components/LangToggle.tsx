"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

/** Přepínač jazyka = odkaz mezi / (čeština) a /en (angličtina). */
export function LangToggle() {
  const { lang } = useLang();
  const href = lang === "cs" ? "/en" : "/";

  return (
    <Link
      href={href}
      hrefLang={lang === "cs" ? "en" : "cs"}
      aria-label={lang === "cs" ? "Switch to English" : "Přepnout do češtiny"}
      className="inline-flex h-9 items-center gap-1 rounded-full border border-black/10 bg-white/70 px-3 text-xs font-semibold tracking-wide text-zinc-700 transition hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-accent-400"
    >
      <span className={lang === "cs" ? "text-accent-600 dark:text-accent-400" : "opacity-50"}>CZ</span>
      <span className="opacity-30">/</span>
      <span className={lang === "en" ? "text-accent-600 dark:text-accent-400" : "opacity-50"}>EN</span>
    </Link>
  );
}
