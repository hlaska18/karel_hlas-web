/**
 * Stav celého virtuálního počítače na jednom místě.
 *
 * Aplikace samy nic neukládají – všechny sáhnou do téhle jediné hlavy přes
 * `useSystem()`. Díky tomu vidí Průzkumník i terminál tentýž disk a úkolovník
 * pozná, že žák něco udělal, ať to udělal kdekoli.
 *
 * Ukládá se do `localStorage` prohlížeče, nikam se nic neodesílá. Práce tedy
 * přežije obnovení stránky i přestávku na tomtéž počítači, ale na jiném stroji
 * ani v anonymním okně po ní nic nezbyde. Pro hodinu informatiky to stačí
 * a odpadá tím celá otázka osobních údajů žáků.
 */

import type { Slozka, Uzel } from "./fs";
import { vytvorDisk } from "./seed";
import type { AppId } from "./typy";

export const KLIC_ULOZISTE = "win11-vyuka-stav";
/** Zvedni při nekompatibilní změně tvaru dat – starý stav se pak zahodí. */
export const VERZE_ULOZISTE = 1;

export type Motiv = "svetly" | "tmavy";

export interface Nastaveni {
  motiv: Motiv;
  /** Id zvýrazňovací barvy z `AKCENTY`. */
  akcent: string;
  /** Id tapety z `TAPETY`. */
  tapeta: string;
  zarovnaniPanelu: "stred" | "vlevo";
  jmenoUctu: string;
  /** Zobrazovat přípony názvů souborů (výchozí stav Windows je „ne"). */
  pripony: boolean;
  skrytePolozky: boolean;
  efektyPruhlednosti: boolean;
  animace: boolean;
  hlasitost: number;
  jas: number;
  wifi: boolean;
  bluetooth: boolean;
  rezimVLetadle: boolean;
  nocniRezim: boolean;
  /** Nainstalované aktualizace – Windows Update si to pamatuje. */
  aktualizace: boolean;
}

export const VYCHOZI_NASTAVENI: Nastaveni = {
  motiv: "svetly",
  akcent: "modra",
  tapeta: "zavoj",
  zarovnaniPanelu: "stred",
  jmenoUctu: "Žák",
  pripony: false,
  skrytePolozky: false,
  efektyPruhlednosti: true,
  animace: true,
  hlasitost: 42,
  jas: 80,
  wifi: true,
  bluetooth: false,
  rezimVLetadle: false,
  nocniRezim: false,
  aktualizace: false,
};

export interface Obdelnik {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StavOkna = "normalni" | "maximalizovane" | "minimalizovane";

/**
 * Kam je okno přichycené rozvržením (Snap). Ukládá se jako pojmenované místo,
 * ne jako souřadnice – půlka obrazovky má zůstat půlkou i po zvětšení okna
 * prohlížeče nebo po otočení tabletu.
 */
export type Prichyceni =
  | "vlevo"
  | "vpravo"
  | "levo-nahore"
  | "pravo-nahore"
  | "levo-dole"
  | "pravo-dole"
  | null;

export interface Okno extends Obdelnik {
  id: number;
  app: AppId;
  titul: string;
  z: number;
  stav: StavOkna;
  /** Poloha před maximalizací nebo přichycením – kam se okno vrátí. */
  puvodni?: Obdelnik;
  prichyceni?: Prichyceni;
  /**
   * Parametr aplikace: cesta pro Průzkumník, soubor pro Poznámkový blok,
   * adresa pro prohlížeč, stránka pro Nastavení.
   */
  arg?: string;
}

/** Položka v koši si pamatuje, odkud přišla, aby šla vrátit. */
export interface PolozkaKose {
  id: string;
  uzel: Uzel;
  /** Původní složka bez názvu samotné položky. */
  puvod: string[];
  smazano: number;
}

export interface Stav {
  verze: number;
  /** Kořen disku C:. */
  disk: Slozka;
  kos: PolozkaKose[];
  okna: Okno[];
  /** Nejvyšší dosud přidělený z-index i id – roste, nikdy neklesá. */
  citac: number;
  nastaveni: Nastaveni;
  /** Doklady o tom, co žák udělal (otevřel Správce úloh, spustil ipconfig…). */
  stopy: string[];
  /** Splněné úkoly. Jednou splněný úkol zůstává splněný. */
  splneno: string[];
  /** Schránka Průzkumníku: co a jestli se má po vložení smazat. */
  schranka: { uzly: Uzel[]; zdroj: string[]; vyjmout: boolean } | null;
}

/** Výchozí velikost a poloha okna podle aplikace. */
export const VYCHOZI_OKNO: Record<AppId, { w: number; h: number }> = {
  pruzkumnik: { w: 1020, h: 640 },
  "poznamkovy-blok": { w: 760, h: 560 },
  malovani: { w: 940, h: 640 },
  kalkulacka: { w: 360, h: 560 },
  nastaveni: { w: 1000, h: 660 },
  terminal: { w: 840, h: 520 },
  "spravce-uloh": { w: 900, h: 600 },
  fotky: { w: 880, h: 620 },
  prohlizec: { w: 1060, h: 680 },
  "ovladaci-panely": { w: 860, h: 560 },
};

export function vychoziStav(): Stav {
  return {
    verze: VERZE_ULOZISTE,
    disk: vytvorDisk(),
    kos: [],
    okna: [],
    citac: 1,
    nastaveni: { ...VYCHOZI_NASTAVENI },
    stopy: [],
    splneno: [],
    schranka: null,
  };
}

/* ───────────────────── Ukládání ───────────────────── */

/** Co se ukládá. Otevřená okna schválně ne – po obnovení se startuje na ploše. */
type Ulozeny = Pick<Stav, "verze" | "disk" | "kos" | "nastaveni" | "stopy" | "splneno">;

export function nacti(): Stav | null {
  if (typeof window === "undefined") return null;
  try {
    const syrove = window.localStorage.getItem(KLIC_ULOZISTE);
    if (!syrove) return null;
    const ulozeny = JSON.parse(syrove) as Ulozeny;
    if (ulozeny?.verze !== VERZE_ULOZISTE || !ulozeny.disk) return null;
    return {
      ...vychoziStav(),
      disk: ulozeny.disk,
      kos: ulozeny.kos ?? [],
      nastaveni: { ...VYCHOZI_NASTAVENI, ...ulozeny.nastaveni },
      stopy: ulozeny.stopy ?? [],
      splneno: ulozeny.splneno ?? [],
    };
  } catch {
    // Rozbitý nebo cizí obsah v úložišti nesmí shodit celé prostředí.
    return null;
  }
}

export function uloz(stav: Stav): void {
  if (typeof window === "undefined") return;
  const ulozeny: Ulozeny = {
    verze: stav.verze,
    disk: stav.disk,
    kos: stav.kos,
    nastaveni: stav.nastaveni,
    stopy: stav.stopy,
    splneno: stav.splneno,
  };
  try {
    window.localStorage.setItem(KLIC_ULOZISTE, JSON.stringify(ulozeny));
  } catch {
    // Plné nebo zakázané úložiště (anonymní okno) – prostředí běží dál,
    // jen se po zavření karty nic nezachová.
  }
}

export function zapomen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KLIC_ULOZISTE);
  } catch {
    /* nevadí */
  }
}
