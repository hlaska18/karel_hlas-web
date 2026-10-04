/**
 * Načítání knihoven pro náhledy v bance (Word, Excel, PowerPoint, kód).
 *
 * Nejdřív z vlastní kopie na tomhle webu (public/vendor/<balík>@<verze>/),
 * CDN je jen záloha – školní filtr může cdn.jsdelivr.net blokovat (audit
 * 4. 10. 2026; stejně to dělá kurz SQL v `sqljs.ts`). Obě cesty mají stejný
 * otisk SRI: kopie je bajt po bajtu stejná jako soubor na CDN. Kopie vyrábí
 * scripts/nahledy-kopie.mjs, shodu hlídá knihovny.test.ts.
 *
 * Dřív měl každý náhled vlastní loader a JSZip se načítal třemi různými
 * implementacemi. Teď je jeden a JSZip se stáhne jednou pro všechny.
 */

import seznam from "@/lib/knihovny.json";

export type Knihovna = {
  id: string;
  balik: string;
  verze: string;
  /** Cesta souboru uvnitř balíku. */
  soubor: string;
  sri: string;
  /** Globální proměnná, kterou skript vystaví (JSZip, docx, …). */
  globalni: string;
  licence: string;
};

export type IdKnihovny = "jszip" | "docx" | "pptx" | "ssf" | "hljs";

export const KNIHOVNY = seznam as Knihovna[];

function knihovna(id: IdKnihovny): Knihovna {
  const k = KNIHOVNY.find((x) => x.id === id);
  if (!k) throw new Error(`Neznámá knihovna ${id}`);
  return k;
}

/** Adresa vlastní kopie, např. /vendor/jszip@3.10.1/dist/jszip.min.js. */
export function vlastniAdresa(k: Knihovna): string {
  return `/vendor/${k.balik}@${k.verze}/${k.soubor}`;
}

export function cdnAdresa(k: Knihovna): string {
  return `https://cdn.jsdelivr.net/npm/${k.balik}@${k.verze}/${k.soubor}`;
}

function vlozSkript(src: string, k: Knihovna): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.integrity = k.sri;
    s.crossOrigin = "anonymous";
    s.onload = () =>
      (window as unknown as Record<string, unknown>)[k.globalni]
        ? resolve()
        : reject(new Error(`${k.balik} se nenačetl`));
    s.onerror = () => {
      s.remove();
      reject(new Error(`Nepodařilo se načíst ${src}`));
    };
    document.head.appendChild(s);
  });
}

const cache = new Map<IdKnihovny, Promise<void>>();

/**
 * Načte knihovnu (jednou za stránku). Neúspěch se nekešuje – další pokus,
 * třeba po obnovení sítě, to zkusí znovu.
 */
export function nactiKnihovnu(id: IdKnihovny): Promise<void> {
  const k = knihovna(id);
  if ((window as unknown as Record<string, unknown>)[k.globalni]) return Promise.resolve();
  const hotovo = cache.get(id);
  if (hotovo) return hotovo;
  const p = vlozSkript(vlastniAdresa(k), k).catch(() => vlozSkript(cdnAdresa(k), k));
  cache.set(id, p);
  p.catch(() => cache.delete(id));
  return p;
}
