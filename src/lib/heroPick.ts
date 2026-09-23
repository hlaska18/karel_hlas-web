/* ─────────────────────── Podklady pro úvodní sekci (hero) ───────────────────────
 * Hero má ukázat DŮKAZ (kolik toho tu je), ne dekoraci. Počítá se to
 * z reálné banky, takže to nezestárne.
 *
 * Dřív tu bylo i losování tří souborů do ukázky vedle nadpisu. Ukázku
 * nahradila tlačítka na simulátory (`HeroSimulatory`) a losování je pryč. */

import type { BankItem } from "@/lib/materials";

/** Kolik souborů a v kolika tématech – čísla do hera. Odkazy se nepočítají. */
export function getBankStats(items: BankItem[]): { files: number; topics: number } {
  // Soubory počítáme jen vlastní (odkaz na cizí zdroj není soubor ke stažení
  // a nástroj, který běží v prohlížeči, taky ne), ale témat je tolik, kolik
  // jich je v galerii – jinak by hero hlásil 5 témat nad mřížkou s osmi
  // dlaždicemi. Word, Excel a Power BI jsou dnes jen odkazy.
  const own = items.filter((i) => !i.external && !i.interactive);
  return { files: own.length, topics: new Set(items.map((i) => i.tool)).size };
}
