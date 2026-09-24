/**
 * Jazyk virtuálního DB Browseru: čeština, nebo angličtina (`/sql?z=en`).
 *
 * `?z=en` odjakživa znamenalo „přišel z anglické verze webu“ – odkaz zpět
 * vede na /en. Teď s ním přijde i anglický program: nabídky jako ve
 * skutečném DB Browseru, lekce a hlášky anglicky. Data zůstávají česká
 * (tabulky knihy, ctenari…), k nim je v panelu kurzu slovníček.
 *
 * Jazyk se za běhu nemění – přepnutí je nové načtení stránky s jiným `?z`.
 * Proto stačí obyčejná proměnná a `t()` jde volat všude, v komponentách
 * i v datech kurzu.
 */

export type Jazyk = "cs" | "en";

function zjisti(): Jazyk {
  // Testy si angličtinu zapnou takhle – v Node žádná adresa není.
  const g = globalThis as { DBB_JAZYK?: Jazyk };
  if (g.DBB_JAZYK) return g.DBB_JAZYK;
  if (typeof window === "undefined") return "cs";
  try {
    return new URLSearchParams(window.location.search).get("z") === "en" ? "en" : "cs";
  } catch {
    return "cs";
  }
}

const jazyk: Jazyk = zjisti();

export const jeAnglicky = () => jazyk === "en";

/** Text v aktuálním jazyce: t("Zapsat změny", "Write Changes"). */
export const t = (cs: string, en: string): string => (jazyk === "en" ? en : cs);

/** Adresa téže stránky v druhém jazyce (zachová ostatní parametry, třeba úlohu). */
export function adresaVJazyce(novy: Jazyk): string {
  const p = new URLSearchParams(window.location.search);
  if (novy === "en") p.set("z", "en");
  else p.delete("z");
  const q = p.toString();
  return `${window.location.pathname}${q ? `?${q}` : ""}`;
}
