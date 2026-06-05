"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { t, Lang } from "@/lib/content";

type Ctx = {
  lang: Lang;
  tr: (typeof t)["cs"];
};

const LanguageContext = createContext<Ctx | null>(null);

/**
 * Jazyk se nově bere z adresy (/ = cs, /en = en) a předává sem jako prop,
 * takže se obsah renderuje na serveru ve správném jazyce (dobré pro SEO).
 */
export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LanguageContext.Provider value={{ lang, tr: t[lang] }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}
