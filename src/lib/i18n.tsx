"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import type { t, Lang } from "@/lib/content";

type Ctx = {
  lang: Lang;
  tr: (typeof t)["cs"];
};

const LanguageContext = createContext<Ctx | null>(null);

/**
 * Jazyk se nově bere z adresy (/ = cs, /en = en) a předává sem jako prop,
 * takže se obsah renderuje na serveru ve správném jazyce (dobré pro SEO).
 *
 * Texty přicházejí jako prop ze serveru (`tr={t[lang]}`), ne importem: import by
 * do JavaScriptu každé stránky přibalil oba jazyky. Druhý jazyk se načte až
 * s přechodem na jeho adresu.
 */
export function LanguageProvider({
  lang,
  tr,
  children,
}: {
  lang: Lang;
  tr: Ctx["tr"];
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LanguageContext.Provider value={{ lang, tr }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}
