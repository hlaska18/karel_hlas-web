/**
 * Písemka z Procvičování A/B: /sql?pisemka=A nebo /sql?pisemka=B
 * (rada 24. 9. 2026, Karel zvolil „fajfky bez nápověd“).
 *
 * Žák vidí, že úloha sedí (fajfka), ale nápověda, řešení, „Ještě ne: …“
 * ani vysvětlení chyb po česku nedostane. Pokračovat z kódu nejde a postup
 * i soubory se ukládají zvlášť, takže písemka se nesmíchá s kurzem ani
 * s druhou variantou. Kód postupu nese příznak písemky a Přehled třídy ho
 * ukáže zvlášť.
 *
 * Jako jazyk se za běhu nemění – přepnutí je nové načtení stránky.
 */

export type Varianta = "A" | "B";

/** Lekce kurzu, ze které písemka je. */
export const LEKCE_PISEMKY: Record<Varianta, number> = { A: 21, B: 22 };

function zjisti(): Varianta | null {
  // Testy si písemku zapnou takhle – v Node žádná adresa není.
  const g = globalThis as { DBB_PISEMKA?: string };
  if (g.DBB_PISEMKA === "A" || g.DBB_PISEMKA === "B") return g.DBB_PISEMKA;
  if (typeof window === "undefined") return null;
  try {
    const v = (new URLSearchParams(window.location.search).get("pisemka") || "").toUpperCase();
    return v === "A" || v === "B" ? v : null;
  } catch {
    return null;
  }
}

const varianta: Varianta | null = zjisti();

/** Varianta písemky, nebo null mimo písemku. */
export const pisemka = (): Varianta | null => varianta;

/** Lekce, kterou písemka otevře, nebo null mimo písemku. */
export const lekcePisemky = (): number | null => (varianta ? LEKCE_PISEMKY[varianta] : null);

/** Adresa písemky pro učitele (do Teams). */
export const adresaPisemky = (v: Varianta, puvod: string): string => `${puvod}/sql?pisemka=${v}`;
