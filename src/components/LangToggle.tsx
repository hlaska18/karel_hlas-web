"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { ICON_BUTTON } from "@/lib/styles";

/**
 * Přepínač jazyka – kolečko (stejná velikost jako přepínač motivu).
 * Ukazuje AKTUÁLNÍ jazyk stránky (CZ/EN); klik přepne stránku i jazyk.
 * Výchozí cíl je / ↔ /en (homepage); stránky s vlastním jazykovým
 * protějškem (banka) předají `counterpartPath`. Query string (?tema=,
 * &lekce=) se při přepnutí zachová, takže zůstaneš na stejném místě.
 */
export function LangToggle({ counterpartPath }: { counterpartPath?: string }) {
  const { lang } = useLang();
  const href = counterpartPath ?? (lang === "cs" ? "/en" : "/");
  const current = lang === "cs" ? "CZ" : "EN";
  const label = lang === "cs" ? "Switch to English" : "Přepnout do češtiny";

  return (
    <Link
      href={href}
      hrefLang={lang === "cs" ? "en" : "cs"}
      aria-label={label}
      title={label}
      onClick={(e) => {
        // zachovej ?tema=&lekce= při přepnutí jazyka (Link má href bez query)
        try {
          const qs = window.location.search;
          if (qs) {
            e.preventDefault();
            window.location.assign(href + qs);
          }
        } catch {
          /* bez JS pojede prostý odkaz */
        }
      }}
      className={`${ICON_BUTTON} text-xs font-bold tracking-wide`}
    >
      {current}
    </Link>
  );
}
