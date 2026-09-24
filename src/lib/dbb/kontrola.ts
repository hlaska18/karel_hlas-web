/**
 * Kontrola úkolů kurzu po spuštění dotazu – jako v SQLBoltu: žádné tlačítko
 * Zkontrolovat, úkol se odškrtne sám, jakmile výsledek sedí.
 *
 * Lekce 1–13 se kontrolují nad ČISTOU knihovnou: dotaz žáka i referenční
 * dotaz se pustí na čerstvé kopii. Kdyby se porovnávalo nad živou databází,
 * žák, který si předtím smazal všechny knihy a zapsal to, by „splnil“ každý
 * SELECT, protože prázdný výsledek by se rovnal prázdnému. Nové lekce (14+)
 * naopak pracují s tím, co si žák sám vytvořil, tak se kontrolují naživo.
 */

import { SCHEMA, diffMessage, sameResult } from "@/lib/sqlExercise";
import type { SqlDb, SqlResult } from "@/lib/sqljs";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import type { Hodnoceni, UkolKurzu } from "@/lib/dbb/kurz";

export type SpusteniKontroly = {
  /** Úspěšně provedené příkazy, jak šly za sebou. */
  text: string;
  /** Výsledek posledního příkazu, který vracel řádky. */
  vysledek: SqlResult | null;
  /** Soubor, nad kterým dotaz běžel. */
  soubor: string | null;
  /** Byl mezi příkazy INSERT, UPDATE nebo DELETE? */
  menilData: boolean;
  /** Vracel poslední příkaz řádky (SELECT), nebo data měnil? */
  konciCtenim: boolean;
};

export type Prostredky = {
  /** Čerstvá kopie knihovny v paměti (volající ji po použití zavře). */
  cista: () => SqlDb;
  /** Živá databáze, nad kterou žák pracuje. */
  ziva: SqlDb | null;
};

const posledni = (r: SqlResult[]): SqlResult => (r.length ? r[r.length - 1] : { columns: [], values: [] });

/**
 * Vyhodnotí úkol, který se ověřuje dotazem. Vrací null, když tenhle běh
 * k úkolu nepatří (třeba SELECT při úkolu na UPDATE) – pak se žákovi nic
 * nevyčítá, jen se nic neodškrtne.
 */
export function vyhodnotDotaz(ukol: UkolKurzu, beh: SpusteniKontroly, p: Prostredky): Hodnoceni | null {
  const k = ukol.kontrola;
  if (k.druh === "stav") return null;
  if (beh.soubor !== KNIHOVNA) {
    return { ok: false, proc: "Kurz pracuje s databází knihovna.db – otevři ji přes Soubor → Otevřít databázi." };
  }

  if (k.druh === "zmena") {
    if (!beh.menilData) return null;
    const moje = p.cista();
    const vzor = p.cista();
    try {
      moje.exec(beh.text);
      vzor.exec(k.reference);
      const mine = posledni(moje.exec(k.check));
      const ref = posledni(vzor.exec(k.check));
      const ordered = /order\s+by/i.test(k.check);
      if (sameResult(mine, ref, ordered)) return { ok: true };
      return { ok: false, proc: diffMessage(mine, ref, ordered, true, { zak: beh.text, ref: k.reference }) };
    } catch {
      return null;
    } finally {
      moje.close();
      vzor.close();
    }
  }

  // Dotaz: hodnotí se jen běh, který skončil SELECTem.
  if (!beh.konciCtenim) return null;
  const ordered = /order\s+by/i.test(k.reference);
  let mine: SqlResult | null;
  let ref: SqlResult | null;
  if (k.nadCistou) {
    const moje = p.cista();
    const vzor = p.cista();
    try {
      mine = posledni(moje.exec(beh.text));
      ref = posledni(vzor.exec(k.reference));
    } catch {
      return null;
    } finally {
      moje.close();
      vzor.close();
    }
  } else {
    if (!p.ziva) return null;
    try {
      mine = beh.vysledek;
      ref = posledni(p.ziva.exec(k.reference));
    } catch {
      return null;
    }
  }
  if (sameResult(mine, ref, ordered)) {
    // Stejné řádky, ale jiný počet sloupců (SELECT * místo dvou sloupců)
    // sameResult odhalí sám – porovnává celé řádky.
    return { ok: true };
  }
  return { ok: false, proc: diffMessage(mine, ref, ordered, false, { zak: beh.text, ref: k.reference }) };
}

/** Čistá knihovna pro kontrolu – ze stejného schématu jako soubor knihovna.db. */
export const SCHEMA_KNIHOVNY = SCHEMA;
