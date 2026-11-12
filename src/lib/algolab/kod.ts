/**
 * Kód postupu ALGOLABu (`ALG1-…`, Karel 7. 11. 2026). Je pro žáka: zkopíruje si
 * ho do OneNotu nebo Teams a na jiném počítači v lekci pokračuje. Nese celou
 * práci včetně vlastní odpovědi v reflexi.
 *
 * Jeden kód na celý blok: hodiny se do něj přidávají pod vlastním klíčem
 * (`h4` = batoh, `h1` …), takže kód z dřívější hodiny zůstane platný i po přidání
 * dalších. `v` je verze formátu – měnit jen s převodem starých kódů, žáci je
 * budou mít uložené. Hodina 8 má vlastní kód ALGZ1- (`zaverecne.ts`).
 *
 * Obsah je podepsaný a zamíchaný (`obal.ts`, Karel 10. 11. 2026): žákovi kód
 * nedává smysl a upravený se nenačte. Vzniká ale v prohlížeči, takže při
 * načtení se celý obsah stejně prověří jako zápis z úložiště (`zOdlozeneho`).
 */

import { KAPACITA, ZAKAZKY } from "./batoh";
import { rozbal, zabal } from "./obal";
import { jeVychozi, zDatLekce, type StavLekce } from "./lekce";
import { CISLA_LEKCI, LEKCE } from "./registr";
import { vychoziStav, zOdlozeneho, type StavBatohu } from "./stav";

export const PREDPONA_ALGOLAB = "ALG1-";
const MAX_DELKA = 60000;

/** Celá práce bloku: hodina 4 ve starším formátu, ostatní hodiny 1–7 společně. */
export interface PraceAlgolabu {
  h4: StavBatohu;
  lekce: Record<number, StavLekce<object>>;
  /**
   * Jméno žáka (Karel 11. 11. 2026): kód se vkládá místo jména při přihlášení.
   * Kódy z doby před přihlašováním ho nemají.
   */
  jmeno?: string;
}

const MAX_JMENO = 60;

/** Je v práci aspoň něco rozdělaného? */
export const jePrazdna = (p: PraceAlgolabu) =>
  JSON.stringify(p.h4) === JSON.stringify(vychoziStav()) &&
  CISLA_LEKCI.every((c) => !p.lekce[c] || jeVychozi(p.lekce[c], LEKCE[c].faze, LEKCE[c].vychozi));

const puvodniUprava = (u: StavBatohu["uprava"]) =>
  u.kapacita === KAPACITA && u.zakazky.every((z, i) => z.doba === ZAKAZKY[i].doba && z.prinos === ZAKAZKY[i].prinos);

/** Nezačaté hodiny se nenesou, kód je pak kratší. */
export function zakodujAlgolab(prace: PraceAlgolabu): string {
  const data: Record<string, unknown> = { v: 1 };
  const jmeno = (prace.jmeno ?? "").trim().slice(0, MAX_JMENO);
  if (jmeno) data.j = jmeno;
  if (JSON.stringify(prace.h4) !== JSON.stringify(vychoziStav())) {
    // Nezměněné zadání v „Změň zadání“ se nenese, kód je pak skoro o polovinu kratší.
    const { uprava, ...zbytek } = prace.h4;
    data.h4 = puvodniUprava(uprava) ? zbytek : prace.h4;
  }
  for (const c of CISLA_LEKCI) {
    const l = prace.lekce[c];
    if (l && !jeVychozi(l, LEKCE[c].faze, LEKCE[c].vychozi)) data[`h${c}`] = l;
  }
  return PREDPONA_ALGOLAB + zabal(JSON.stringify(data), "ALG1");
}

/** Najde kód ve vloženém textu (třeba v celé zprávě z Teams). Cizí nebo poškozený text vrátí jako null. */
export function dekodujAlgolab(text: string): PraceAlgolabu | null {
  const m = /ALG1-([A-Za-z0-9_-]+)/.exec(text);
  if (!m || m[1].length > MAX_DELKA) return null;
  try {
    const text = rozbal(m[1], "ALG1");
    if (text === null) return null;
    const d = JSON.parse(text) as Record<string, unknown>;
    if (!d || d.v !== 1) return null;
    const h4 = d.h4 && typeof d.h4 === "object" ? zOdlozeneho(JSON.stringify(d.h4)) : vychoziStav();
    const lekce: Record<number, StavLekce<object>> = {};
    for (const c of CISLA_LEKCI) lekce[c] = zDatLekce(d[`h${c}`], LEKCE[c].faze, LEKCE[c].vychozi);
    const jmeno = typeof d.j === "string" ? d.j.trim().slice(0, MAX_JMENO) : "";
    return jmeno ? { h4, lekce, jmeno } : { h4, lekce };
  } catch {
    return null;
  }
}
