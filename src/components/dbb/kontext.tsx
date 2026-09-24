"use client";

/**
 * Sdílený stav virtuálního DB Browseru – karty, panely a dialogy si z něj
 * berou otevřenou databázi a akce (spustit, zapsat, otevřít…). Samotná logika
 * bydlí v `DbBrowser.tsx`; tady jsou jen typy a háček.
 */

import { createContext, useContext, type RefObject } from "react";
import type { SqlDbSoubor, SqlResult } from "@/lib/sqljs";
import type { Disk } from "@/lib/dbb/soubory";

export type Karta = "struktura" | "data" | "pragma" | "sql";
export type DokKarta = "kurz" | "schema" | "log";

export type ZaznamLogu = { kdo: "uzivatel" | "aplikace"; text: string };

/** Co ukazuje spodní část karty Spustit SQL. */
export type Vystup = {
  vysledek: SqlResult | null;
  /** Řádky zprávy pod výsledkem, jak je píše DB Browser. */
  zprava: string[];
  chyba: boolean;
  /** Vysvětlení chyby po česku. */
  cesky?: string;
  /** Výsledek je jen náhled tabulky lekce, ne dotaz žáka. */
  nahled?: string;
};

export type Dialog =
  | { druh: "ulozit"; nazev: string; potom: () => void }
  | { druh: "otevrit" }
  | { druh: "nova" }
  | { druh: "tabulka" }
  | { druh: "okurzu" }
  | { druh: "oprogramu" }
  | { druh: "potvrdit"; titulek: string; text: string; tlacitko: string; akce: () => void }
  | { druh: "zprava"; titulek: string; text: string };

export type KurzStav = {
  lekceId: number;
  splneno: Set<string>;
  opsano: Set<string>;
  pokusy: Set<string>;
  odezva: { klic: string; text: string } | null;
  vyberLekci: (id: number) => void;
  vlozReseni: (klic: string) => void;
};

export type DbbApi = {
  otevrena: string | null;
  db: () => SqlDbSoubor | null;
  /** Roste po každé změně databáze – karty podle ní načtou data znovu. */
  verze: number;
  zmeneno: boolean;
  disk: Disk;
  karta: Karta;
  nastavKartu: (k: Karta) => void;
  dokKarta: DokKarta;
  nastavDokKartu: (k: DokKarta) => void;
  editor: string;
  nastavEditor: (text: string) => void;
  editorRef: RefObject<HTMLTextAreaElement>;
  vystup: Vystup | null;
  spustit: (rezim: "vse" | "radek") => void;
  log: ZaznamLogu[];
  vymazLog: () => void;
  udalost: (nazev: string) => void;
  hlasProhlizeni: (tabulka: string, id: string[]) => void;
  /** Provede příkaz, který poslal program sám (úprava buňky, nová tabulka…). Vrací chybu po česku. */
  provedAplikaci: (sql: string, params?: unknown[], zaznam?: string) => string | null;
  otevritDialog: (d: Dialog | null) => void;
  status: (text: string) => void;
  zapsat: () => void;
  vratit: () => void;
  kurz: KurzStav;
};

export const DbbKontext = createContext<DbbApi | null>(null);

export function useDbb(): DbbApi {
  const api = useContext(DbbKontext);
  if (!api) throw new Error("useDbb mimo DbBrowser");
  return api;
}

/** Bezpečný dotaz na čtení – při chybě vrátí null místo výjimky. */
export function precti(db: SqlDbSoubor | null, sql: string): SqlResult | null {
  if (!db) return null;
  try {
    const r = db.exec(sql);
    return r.length ? r[r.length - 1] : { columns: [], values: [] };
  } catch {
    return null;
  }
}

/** Identifikátor do uvozovek, jak ho píše DB Browser ("knihy"). */
export const uvoz = (nazev: string) => `"${nazev.replace(/"/g, '""')}"`;
