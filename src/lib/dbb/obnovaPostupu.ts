/**
 * Pokračovat z kódu: postup z kódu SQLKURZ1-… zpátky do kurzu. Postup žije
 * v prohlížeči jednoho počítače; druhá hodina začne jinde nebo se smazaným
 * profilem, a jediné, co přežije, je kód v Teams (rada 24. 9. 2026).
 *
 * Obnoví se hotové lekce (všechny jejich povinné úkoly), šedá u lekcí
 * splněných s pomocí řešení, úlohy navíc, detektivka, procvičování a úlohy
 * od učitele. Rozpracované lekce kód nenese – ty se udělají znovu.
 */

import { KURZ, povinne } from "@/lib/dbb/kurz";
import type { Postup } from "@/lib/dbb/kodPostupu";

/** Začátky zadání úloh od učitele podle klíče „u-…“ – do kódu postupu a Přehledu třídy. */
export const KLIC_NAZVY_ULOH = "dbb-ulohy";

/** Klíče povinných úkolů kurzu – co je mimo ně, patří do `klice` v kódu. */
export const POVINNE_KLICE = KURZ.reduce<string[]>((a, l) => a.concat(povinne(l).map((u) => u.klic)), []);

/** Klíče úkolů Procvičování A a B (A1…A16, B1…B16). */
const JE_UKOL_SADY_AB = /^[AB]\d+$/;

export function splnenoZKodu(p: Postup): { splneno: string[]; opsano: string[] } {
  const splneno: string[] = [];
  const opsano: string[] = [];
  KURZ.forEach((l) => {
    if (p.hotove.indexOf(l.id) === -1) return;
    const ukoly = povinne(l);
    ukoly.forEach((u) => splneno.push(u.klic));
    // Šedá lekce: stačí jeden úkol splněný vloženým řešením.
    if (p.sede.indexOf(l.id) !== -1 && ukoly[0]) opsano.push(ukoly[0].klic);
  });
  // Procvičování A a B se z kódu neobnovuje: slouží jako písemka a sousedův
  // kód by jinak přenesl i jeho body (rada 24. 9. 2026).
  (p.klice || []).forEach((k) => !JE_UKOL_SADY_AB.test(k) && splneno.indexOf(k) === -1 && splneno.push(k));
  (p.ulohy || []).forEach((k) => splneno.indexOf(k) === -1 && splneno.push(k));
  return { splneno, opsano };
}
