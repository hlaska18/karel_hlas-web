/**
 * Kód postupu ALGOLABu (`ALG1-…`, Karel 7. 11. 2026). Je pro žáka: zkopíruje si
 * ho do OneNotu nebo Teams a na jiném počítači v lekci pokračuje. Nese celou
 * práci včetně vlastní odpovědi v reflexi.
 *
 * Jeden kód na celý blok: hodiny se do něj přidávají pod vlastním klíčem
 * (`h4` = batoh), takže kód z dřívější hodiny zůstane platný i po přidání
 * dalších. `v` je verze formátu – měnit jen s převodem starých kódů, žáci je
 * budou mít uložené. Hodina 8 sem později přidá jméno.
 *
 * Je to shrnutí, ne důkaz: vzniká v prohlížeči a dá se upravit. Při načtení se
 * proto celý obsah prověří stejně jako zápis z úložiště (`zOdlozeneho`).
 */

import { KAPACITA, ZAKAZKY } from "./batoh";
import { zOdlozeneho, type StavBatohu } from "./stav";

export const PREDPONA_ALGOLAB = "ALG1-";
const MAX_DELKA = 20000;

function doBase64Url(text: string): string {
  return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function zBase64Url(text: string): string {
  let b = text.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return decodeURIComponent(escape(atob(b)));
}

const puvodniUprava = (u: StavBatohu["uprava"]) =>
  u.kapacita === KAPACITA && u.zakazky.every((z, i) => z.doba === ZAKAZKY[i].doba && z.prinos === ZAKAZKY[i].prinos);

export function zakodujAlgolab(batoh: StavBatohu): string {
  // Nezměněné zadání v „Změň zadání“ se nenese, kód je pak skoro o polovinu kratší.
  const { uprava, ...zbytek } = batoh;
  const h4 = puvodniUprava(uprava) ? zbytek : batoh;
  return PREDPONA_ALGOLAB + doBase64Url(JSON.stringify({ v: 1, h4 }));
}

/** Najde kód ve vloženém textu (třeba v celé zprávě z Teams). Cizí nebo poškozený text vrátí jako null. */
export function dekodujAlgolab(text: string): StavBatohu | null {
  const m = /ALG1-([A-Za-z0-9_-]+)/.exec(text);
  if (!m || m[1].length > MAX_DELKA) return null;
  try {
    const d = JSON.parse(zBase64Url(m[1])) as { v?: unknown; h4?: unknown };
    if (!d || d.v !== 1 || !d.h4 || typeof d.h4 !== "object") return null;
    return zOdlozeneho(JSON.stringify(d.h4));
  } catch {
    return null;
  }
}
