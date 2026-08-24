"use client";

/**
 * Strana prohlížeče: přihlášení k postupu a jeho ukládání.
 *
 * VŠECHNO JE NEZÁVAZNÉ. Když server neodpoví nebo synchronizace není
 * nastavená, prostředí běží dál a postup se drží jen v prohlížeči — přesně
 * jako předtím, než tahle vrstva vznikla. Žádné volání odsud nesmí zdržet
 * ani shodit simulaci.
 */

/** Lístek žije v `sessionStorage`, stejně jako odemčení třídním kódem. */
const KLIC_LISTKU = "win11-vyuka-listek";
const KLIC_UCTU = "win11-vyuka-ucet";

export type Prihlaseni =
  | { stav: "ok"; prezdivka: string; splneno: string[]; novy: boolean }
  | { stav: "nesedi" }
  | { stav: "nenastaveno" }
  | { stav: "chyba" };

export async function prihlas(prezdivka: string, heslo: string): Promise<Prihlaseni> {
  let odpoved: Response;
  try {
    odpoved = await fetch("/api/postup/prihlaseni", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prezdivka, heslo }),
    });
  } catch {
    // Bez sítě se nedá dělat nic jiného než pustit žáka dál lokálně.
    return { stav: "chyba" };
  }

  if (odpoved.status === 503) return { stav: "nenastaveno" };
  if (odpoved.status === 401) return { stav: "nesedi" };
  if (!odpoved.ok) return { stav: "chyba" };

  const data = (await odpoved.json()) as { listek: string; splneno: string[]; novy: boolean };
  const ucet = prezdivka.normalize("NFC").trim().toLowerCase();
  try {
    window.sessionStorage.setItem(KLIC_LISTKU, data.listek);
    window.sessionStorage.setItem(KLIC_UCTU, ucet);
  } catch {
    // Zakázané úložiště (anonymní okno s přísným nastavením) – přihlášení
    // platí pro tuhle kartu, po obnovení se zadá znovu.
  }
  return { stav: "ok", prezdivka: ucet, splneno: data.splneno ?? [], novy: data.novy };
}

export function nactiListek(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KLIC_LISTKU);
  } catch {
    return null;
  }
}

export function nactiUcet(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KLIC_UCTU);
  } catch {
    return null;
  }
}

export function zapomenUcet(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KLIC_LISTKU);
    window.sessionStorage.removeItem(KLIC_UCTU);
  } catch {
    /* nevadí */
  }
}

/**
 * Pošle postup na server a vrátí sloučený seznam, nebo `null`, když se to
 * nepovedlo. Volající si podle toho může doplnit, co mu chybí — ale nesmí na
 * tom stavět: běžný stav je, že synchronizace neběží vůbec.
 */
export async function ulozPostup(splneno: string[]): Promise<string[] | null> {
  const listek = nactiListek();
  if (!listek) return null;
  try {
    const odpoved = await fetch("/api/postup/uloz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listek, splneno }),
    });
    if (!odpoved.ok) return null;
    const data = (await odpoved.json()) as { splneno: string[] };
    return data.splneno ?? null;
  } catch {
    return null;
  }
}

/** Smaže postup uložený na serveru. Vrací, jestli se to povedlo. */
export async function smazPostup(): Promise<boolean> {
  const listek = nactiListek();
  if (!listek) return false;
  try {
    const odpoved = await fetch(`/api/postup/uloz?listek=${encodeURIComponent(listek)}`, {
      method: "DELETE",
    });
    return odpoved.ok;
  } catch {
    return false;
  }
}
