"use client";

/**
 * Sdílený stav virtuálního DB Browseru – karty, panely a dialogy si z něj
 * berou otevřenou databázi a akce (spustit, zapsat, otevřít…). Samotná logika
 * bydlí v `DbBrowser.tsx`; tady jsou jen typy a háček.
 */

import { createContext, useContext, type RefObject } from "react";
import type { SqlDbSoubor, SqlResult } from "@/lib/sqljs";
import type { Disk } from "@/lib/dbb/soubory";
import type { Databaze, LekceKurzu } from "@/lib/dbb/kurz";
import type { PripravenaTabulka } from "@/lib/dbb/csv";
import type { Postup } from "@/lib/dbb/kodPostupu";

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
  /** Poznámka k výsledku, který vypadá divně, ale je správně (řazení Č za Z). */
  poznamka?: string;
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
  | { druh: "vysledky" }
  | { druh: "prehled" }
  | { druh: "uloha" }
  /** Tabulka z CSV ze skutečného počítače. */
  | { druh: "importCsv"; soubor: string; bajty: Uint8Array }
  /** Databáze ze souboru SQL ze skutečného počítače. */
  | { druh: "importSql"; soubor: string; text: string }
  /** Export tabulky nebo výsledku posledního dotazu do CSV. */
  | { druh: "exportCsv"; zdroj?: string }
  | {
      druh: "potvrdit";
      titulek: string;
      text: string;
      tlacitko: string;
      akce: () => void;
      /** Popisek druhého tlačítka (výchozí „Zrušit“) a co udělá. */
      zrusit?: string;
      priZruseni?: () => void;
    }
  | { druh: "zprava"; titulek: string; text: string }
  /** Zápis do úložiště prohlížeče se nepovedl – nabídne stažení souboru. */
  | { druh: "chybaZapisu"; nazev: string; bajty: Uint8Array };

export type KurzStav = {
  lekceId: number;
  /** Všechny lekce: kurz, procvičování a případně úloha z odkazu. */
  lekce: LekceKurzu[];
  splneno: Set<string>;
  opsano: Set<string>;
  pokusy: Set<string>;
  odezva: { klic: string; text: string } | null;
  vyberLekci: (id: number) => void;
  vlozReseni: (klic: string) => void;
  novyZak: () => void;
  /** Vrátí databázi procvičování nebo detektivky do původního stavu. */
  obnovDatabazi: (d: Databaze, otevritPotom: boolean) => void;
  /** Pokračovat z kódu: přidá postup z kódu SQLKURZ1-… k tomu, co je v prohlížeči. */
  obnovZKodu: (p: Postup) => void;
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
  /** Soubor ze skutečného počítače: databáze .db, tabulka z CSV, databáze ze SQL. */
  vyberSoubor: (ucel: "db" | "csv" | "sql") => void;
  /** Vytvoří v otevřené databázi tabulku z CSV. Vrací chybu, nebo null. */
  importujTabulku: (nazev: string, tabulka: PripravenaTabulka) => string | null;
  /** Založí novou databázi ze skriptu SQL a otevře ji. Vrací chybu, nebo null. */
  importujSql: (nazevDb: string, text: string) => string | null;
  /** Stáhne otevřenou databázi jako skript SQL. */
  exportujSql: () => void;
  /** Režim předvádění pro projektor: postup zvlášť, program zvětšený, řešení bez pokusu. */
  predvadeni: boolean;
  /** Zvětšení programu v režimu předvádění (1 = bez zvětšení). */
  meritko: number;
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
