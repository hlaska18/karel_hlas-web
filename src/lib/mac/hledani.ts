/**
 * Hledání pro Spotlight.
 *
 * Dvě věci jsou tu schválně a obě kopírují skutečný Mac:
 *
 *   1. DO BALÍČKŮ `.app` SE NELEZE. Finder je ukazuje jako jednu položku,
 *      takže by bylo matoucí, kdyby Spotlight vysypal jejich vnitřek.
 *   2. POLOŽKY S TEČKOU SE NEHLEDAJÍ. Skutečný Spotlight je taky neindexuje
 *      – a hlavně by to podrazilo celou úlohu o skrytých souborech: žák se
 *      má naučit, že tečka na začátku položku schová, ne že ji schová
 *      všude kromě hledání.
 */

import type { Slozka, Uzel } from "@/lib/win/fs";
import { jeSlozka } from "@/lib/win/fs";
import { KOREN, jeBalicek, jeSkryte } from "./cesty";

export interface Nalez {
  uzel: Uzel;
  /** Celá cesta včetně kořene a jména samotné položky. */
  cesta: string[];
}

/** Bez diakritiky a bez ohledu na velikost písmen – píše se na české klávesnici. */
export const bezDiakritiky = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Najde položky, jejichž jméno obsahuje dotaz. Nejdřív ty, co jím začínají –
 * kdo píše „pozn", chce Poznámky, ne soubor, který to má někde uprostřed.
 */
export function prohledej(koren: Slozka, dotaz: string, limit = 8): Nalez[] {
  const hledane = bezDiakritiky(dotaz.trim());
  if (!hledane) return [];

  const nalezy: Nalez[] = [];

  const projdi = (slozka: Slozka, kde: string[]) => {
    for (const dite of slozka.deti) {
      if (jeSkryte(dite.jmeno)) continue;
      const cesta = [...kde, dite.jmeno];
      if (bezDiakritiky(dite.jmeno).includes(hledane)) nalezy.push({ uzel: dite, cesta });
      if (jeSlozka(dite) && !jeBalicek(dite.jmeno)) projdi(dite, cesta);
    }
  };
  projdi(koren, [KOREN]);

  const zacinaNa = (n: Nalez) => (bezDiakritiky(n.uzel.jmeno).startsWith(hledane) ? 0 : 1);
  nalezy.sort(
    (a, b) =>
      zacinaNa(a) - zacinaNa(b) ||
      a.uzel.jmeno.localeCompare(b.uzel.jmeno, "cs") ||
      a.cesta.length - b.cesta.length,
  );
  return nalezy.slice(0, limit);
}
