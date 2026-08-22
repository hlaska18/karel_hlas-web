/**
 * Překlad názvů systémových složek.
 *
 * Ve skutečném Windows se složka na disku jmenuje `Desktop`, ale Průzkumník
 * ji ukazuje jako `Plocha`. Není to chyba ani nedodělek – je to `desktop.ini`
 * a je to jedna z nejužitečnějších věcí, které si žák může odnést: co vidím
 * v okně, nemusí být to, co napíšu do cesty. Terminál proto ukazuje pravdu,
 * Průzkumník překlad.
 */

const PREKLAD: Record<string, string> = {
  Users: "Uživatelé",
  Desktop: "Plocha",
  Documents: "Dokumenty",
  Downloads: "Stažené soubory",
  Pictures: "Obrázky",
  Music: "Hudba",
  Videos: "Videa",
  "Program Files": "Program Files",
};

/** Cesty, u kterých překlad platí – jinde by se přeložilo i jméno souboru. */
const PREKLADANE_CESTY = new Set([
  "C:\\Users",
  "C:\\Users\\Zak\\Desktop",
  "C:\\Users\\Zak\\Documents",
  "C:\\Users\\Zak\\Downloads",
  "C:\\Users\\Zak\\Pictures",
  "C:\\Users\\Zak\\Music",
  "C:\\Users\\Zak\\Videos",
]);

/** Jak se složka na dané cestě jmenuje v Průzkumníku. */
export function zobrazeneJmeno(casti: string[]): string {
  const cesta = casti.join("\\");
  if (PREKLADANE_CESTY.has(cesta)) {
    return PREKLAD[casti[casti.length - 1]] ?? casti[casti.length - 1];
  }
  if (casti.length === 1) return "Místní disk (C:)";
  return casti[casti.length - 1];
}

/** Popisek disku v „Tento počítač" a v adresním řádku. */
export const NAZEV_DISKU = "Místní disk (C:)";
export const NAZEV_POCITACE = "Tento počítač";

/** Deklarovaná kapacita systémového disku v bajtech (238 GB, jak hlásí Windows). */
export const KAPACITA_DISKU = 255_000_000_000;

/** Kolik zabírá systém a předinstalované programy, než žák cokoli udělá. */
export const OBSAZENO_SYSTEMEM = 71_400_000_000;
