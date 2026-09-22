/**
 * Stav macOS simulace.
 *
 * VLASTNÍ, NE SDÍLENÝ S WINDOWS. Windowsový `stav.ts` zná pojmy, které tu
 * nedávají smysl (hlavní panel a jeho zarovnání, nabídka Start), a naopak mu
 * chybí to, co potřebuje Mac – která aplikace vlastní horní lištu. Slepit obojí
 * do jednoho typu by znamenalo, že polovina polí je vždycky k ničemu, a hlavně
 * by každá změna sahala do simulace, která žákům běží v hodině.
 *
 * Sdílí se jen souborový systém (`win/fs.ts`), protože ten na operačním
 * systému opravdu nezávisí – pracuje s polem částí cesty.
 *
 * Ukládá se pod VLASTNÍM klíčem, takže Windows a Mac se navzájem nepřepíšou
 * a žák může mít rozdělanou práci v obou.
 */

import type { Slozka } from "@/lib/win/fs";
import { vytvorDiskMac } from "./seed";

export const KLIC_ULOZISTE = "macos-vyuka-stav";
export const VERZE_ULOZISTE = 1;

/** Aplikace, které prostředí zná. Schválně málo – viz `ukoly.ts`. */
export type AppId = "finder" | "terminal" | "poznamky" | "nastaveni";

export const APLIKACE: Record<AppId, { nazev: string; popis: string }> = {
  finder: { nazev: "Finder", popis: "Procházení souborů a složek" },
  terminal: { nazev: "Terminál", popis: "Příkazový řádek" },
  poznamky: { nazev: "Poznámky", popis: "Jednoduchý textový editor" },
  nastaveni: { nazev: "Nastavení systému", popis: "Vzhled a obnovení" },
};

export interface Obdelnik {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Okno {
  id: number;
  app: AppId;
  titul: string;
  /** Parametr, se kterým se okno otevřelo – u Finderu cesta, u Poznámek soubor. */
  arg?: string;
  ram: Obdelnik;
  z: number;
  /**
   * Schované do Docku žlutým puntíkem. Okno pořád existuje, jen není vidět.
   *
   * Vedle zavření červeným puntíkem je to ta DRUHÁ půlka lekce: žlutá schová
   * okno (aplikace běží, okno je), červená okno zruší (aplikace běží, okno
   * není). Dokud žák neuvidí oba stavy vedle sebe, splývají mu.
   */
  minimalizovane?: boolean;
  /** Zvětšené zeleným puntíkem přes celou plochu. */
  zvetsene?: boolean;
}

export interface NastaveniMac {
  /** Zobrazovat položky s tečkou na začátku? Na Macu se to přepíná zvlášť. */
  skrytePolozky: boolean;
  motiv: "svetly" | "tmavy";
  tapeta: string;
  /** Strana ikony v Docku v pixelech. Mění se tažením za čárku v Docku. */
  dockVelikost: number;
  /** Zvětšovat ikonu pod kurzorem? macOS tomu říká Zvětšení. */
  dockZvetseni: boolean;
  /**
   * Nouzová brzda na slabý počítač: bez džina, bez zvětšování Docku, bez
   * animací oken a nabídek a bez průhledného skla. Na Macu jsou to dva
   * přepínače ve Zpřístupnění – Omezit pohyb a Omezit průhlednost.
   */
  omezitEfekty: boolean;
  /**
   * Jas displeje z Ovládacího centra, 0,35 až 1. Tma se kreslí průhlednou
   * černou vrstvou přes celou obrazovku; úplná tma by žáka ztratila, proto
   * dolní mez.
   */
  jas: number;
  /** Night Shift z Ovládacího centra: teplejší barvy obrazovky. */
  nocniRezim: boolean;
  /**
   * Čím se okno schovává do Docku. Na Macu je to v Nastavení → Plocha
   * a Dock → Minimalizovat okna pomocí: džin, nebo prosté zmenšení.
   */
  efektMinimalizace: "dzin" | "zmenseni";
}

/** Meze velikosti Docku. Skutečný Mac má podobné – menší už není vidět,
 *  větší zabere půl obrazovky. */
export const DOCK_MIN = 34;

/** Nejnižší jas. Pod tím už obrazovka splývá s vypnutou. */
export const JAS_MIN = 0.35;
export const DOCK_MAX = 82;

/**
 * Tapety. Windows mají obrázky poskládané v SVG, tady jsou to dvě fotky
 * a jeden přechod v CSS. Fotky jsou JPEG schválně, ne WebP: cíl prohlížečů
 * (`.browserslistrc`) sahá na Safari 12, které WebP ještě neumí, a tapeta,
 * která se části třídy nenačte, je horší než o kus větší soubor.
 *
 * `id` je zároveň hodnota `data-tapeta` na ploše, podle které si CSS vybere
 * pozadí.
 */
export const TAPETY_MAC = [
  /* Jediná se dvěma verzemi, světlou a tmavou, a přepíná se s motivem
     sama – jako dynamické tapety na Macu. Vygenerovaná v Higgsfieldu
     (Seedream 4.5, zvětšeno na 4K), Karel ji vybral z šesti návrhů. */
  { id: "hory", nazev: "Hory v mlze" },
  { id: "stuhy", nazev: "Stuhy" },
  { id: "zare", nazev: "Záře" },
  { id: "vrstvy", nazev: "Vrstvy" },
] as const;

export const VYCHOZI_NASTAVENI: NastaveniMac = {
  skrytePolozky: false,
  motiv: "svetly",
  tapeta: "hory",
  dockVelikost: 58,
  /*
   * Skutečný Mac má Zvětšení ve výchozím stavu VYPNUTÉ. Tady je zapnuté
   * schválně: je to nejnápadnější věc, kterou Dock dělá a hlavní panel
   * Windows ne, a funkce, kterou nikdo nezapne, nenaučí nic. Vypnout jde
   * v Nastavení, stejně jako na Macu.
   */
  dockZvetseni: true,
  omezitEfekty: false,
  jas: 1,
  nocniRezim: false,
  efektMinimalizace: "dzin",
};

/** Nejvyšší zvětšení ikony pod kurzorem a dosah, na který ještě působí. */
export const DOCK_ZVETSENI_MAX = 1.6;
export const DOCK_ZVETSENI_DOSAH = 2.2;

export interface StavMac {
  verze: number;
  disk: Slozka;
  okna: Okno[];
  /**
   * Aplikace, které BĚŽÍ – i když nemají otevřené okno. Přesně tenhle rozdíl
   * proti Windows je první a nejdůležitější úloha celé simulace.
   */
  bezici: AppId[];
  /** Které aplikaci patří horní lišta. */
  vpredu: AppId | null;
  citac: number;
  nastaveni: NastaveniMac;
  stopy: string[];
  splneno: string[];
  /**
   * Už se po přihlášení ukázalo uvítání (Přečti si mě.txt)? Jen při ÚVODNÍM
   * přihlášení, ne pokaždé. Ukládá se a přežije i měkký reset; smaže ho
   * jen úplné „Začít načisto", což je skutečně nový začátek.
   */
  uvitano: boolean;
  /**
   * Kam žák ikony na ploše přetáhl. Klíčem je jméno položky, hodnota je levý
   * horní roh ikony jako ZLOMEK šířky a výšky plochy – ikona tak zůstane na
   * svém místě i po přepnutí na celou obrazovku nebo na menším monitoru.
   * Co tu není, stojí v mřížce od pravého horního rohu jako dřív.
   */
  pozicePlochy: Record<string, PoziceIkony>;
}

export interface PoziceIkony {
  x: number;
  y: number;
}

export const VYCHOZI_OKNO: Record<AppId, { w: number; h: number }> = {
  finder: { w: 940, h: 580 },
  terminal: { w: 760, h: 460 },
  poznamky: { w: 640, h: 500 },
  nastaveni: { w: 720, h: 480 },
};

export function vychoziStavMac(): StavMac {
  return {
    verze: VERZE_ULOZISTE,
    disk: vytvorDiskMac(),
    okna: [],
    // Finder běží vždycky. Na Macu ho nejde ukončit a je to tak i ve
    // skutečnosti – proto v nabídce nemá „Ukončit“, jen „Ukončit vynuceně“.
    bezici: ["finder"],
    vpredu: "finder",
    citac: 1,
    nastaveni: { ...VYCHOZI_NASTAVENI },
    stopy: [],
    splneno: [],
    uvitano: false,
    pozicePlochy: {},
  };
}

/* ───────────────────── Ukládání ───────────────────── */

// `uvitano` je volitelné: stav uložený před jeho zavedením ho nemá.
type Ulozeny = Pick<
  StavMac,
  "verze" | "disk" | "nastaveni" | "stopy" | "splneno"
> & {
  uvitano?: boolean;
  pozicePlochy?: Record<string, PoziceIkony>;
};

/**
 * Stuhy byly výchozí tapeta, než přišly Hory v mlze. Uložený stav je má
 * zapsané, i když si je nikdo nevybral – ukládá se celé nastavení. Kdo by
 * přišel se starým stavem, novou tapetu by neuviděl, dokud nezačne načisto.
 *
 * Stav uložený před výměnou se pozná podle toho, že nezná `jas` (přišel ve
 * stejné verzi). U něj se Stuhy berou jako výchozí a vymění se. Kdo si
 * Stuhy vybere teď, má `jas` zapsaný a volba mu zůstane.
 */
function staraVychoziTapeta(
  nastaveni: Partial<NastaveniMac> | undefined,
): Partial<NastaveniMac> {
  if (nastaveni?.tapeta === "stuhy" && nastaveni.jas === undefined)
    return { tapeta: VYCHOZI_NASTAVENI.tapeta };
  return {};
}

export function nactiMac(): StavMac | null {
  if (typeof window === "undefined") return null;
  try {
    const syrove = window.localStorage.getItem(KLIC_ULOZISTE);
    if (!syrove) return null;
    const ulozeny = JSON.parse(syrove) as Ulozeny;
    if (ulozeny?.verze !== VERZE_ULOZISTE || !ulozeny.disk) return null;
    return {
      ...vychoziStavMac(),
      disk: ulozeny.disk,
      nastaveni: {
        ...VYCHOZI_NASTAVENI,
        ...ulozeny.nastaveni,
        ...staraVychoziTapeta(ulozeny.nastaveni),
      },
      stopy: ulozeny.stopy ?? [],
      splneno: ulozeny.splneno ?? [],
      uvitano: ulozeny.uvitano ?? false,
      pozicePlochy: ulozeny.pozicePlochy ?? {},
    };
  } catch {
    return null;
  }
}

export function ulozMac(stav: StavMac): void {
  if (typeof window === "undefined") return;
  try {
    const ulozeny: Ulozeny = {
      verze: stav.verze,
      disk: stav.disk,
      nastaveni: stav.nastaveni,
      stopy: stav.stopy,
      splneno: stav.splneno,
      uvitano: stav.uvitano,
      pozicePlochy: stav.pozicePlochy,
    };
    window.localStorage.setItem(KLIC_ULOZISTE, JSON.stringify(ulozeny));
  } catch {
    // Zakázané úložiště nevadí – prostředí běží dál, jen se nic nezachová.
  }
}

export function zapomenMac(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KLIC_ULOZISTE);
  } catch {
    /* nevadí */
  }
}
