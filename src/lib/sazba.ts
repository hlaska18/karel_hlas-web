import type { Lang } from "@/lib/content";

/**
 * Česká sazba: jednopísmenné předložky a spojky nesmí zůstat viset na konci
 * řádku. Dřív byly nezlomitelné mezery vepsané ručně přímo do `content.ts`,
 * jenže jen na jedenácti místech ze šesti set – takže to působilo jako
 * nedodělek (hero je nemělo, věta pod bankou ano). Tohle to dělá na jednom
 * místě a při vykreslení.
 *
 * Pouští se jen na souvislou prózu, ne na názvy souborů a popisky: v „01.
 * Laboratoř grafiky.html" nemá nezlomitelná mezera co dělat.
 */

const PREDLOZKA = /([KkSsVvZzOoUuAaIi]) /gu;
const ODDELOVAC = /[\s(„"'–—-]/u;

const NBSP = " ";

export function sazba(text: string, lang: Lang): string {
  // Anglicky se jednopísmenná slova takhle nesvazují – „a dog" na konci řádku
  // je v pořádku, takže se pro `en` nesmí sáhnout na nic.
  if (lang !== "cs") return text;

  // Předchozí znak se schválně NEspotřebovává. `replace` pokračuje až za
  // náhradou, takže kdyby byl oddělovač součástí vzoru, druhá předložka v řadě
  // („a v hodině") by svůj oddělovač už nenašla – ověřeno testem. Lookbehind by
  // to řešil taky, ale na starším Safari shodí parsování celého balíku, proto
  // se předchozí znak kontroluje přes pozici.
  return text.replace(PREDLOZKA, (cely, pismeno: string, pozice: number, vstup: string) => {
    const naZacatku = pozice === 0 || ODDELOVAC.test(vstup[pozice - 1]);
    return naZacatku ? pismeno + NBSP : cely;
  });
}
