"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { t, Lang } from "@/lib/content";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  tr: (typeof t)["cs"];
};

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "kh-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("cs");

  // Načtení uložené volby jazyka po připojení na klientovi.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "cs" || saved === "en") {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      /* localStorage nedostupné – ignorujeme */
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  };

  const toggle = () => setLang(lang === "cs" ? "en" : "cs");

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, tr: t[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}
