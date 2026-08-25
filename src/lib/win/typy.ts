/**
 * Registr přípon: co soubor je, jakou má ikonu a co ho otevře.
 *
 * Sloupec „Typ" v Průzkumníku i dialog „Jak chcete tento soubor otevřít?"
 * čtou odtud. Přípony bez zapsané aplikace (`app: null`) se schválně otevřít
 * nedají – `.docx` bez nainstalovaného Wordu je přesně ta situace, kterou má
 * žák poznat, ne obcházet.
 */

import { pripona } from "./fs";

/** Klíč kreslené ikony – překlad na SVG je v `components/win/Ikona.tsx`. */
export type IkonaKlic =
  | "slozka"
  | "slozka-otevrena"
  | "text"
  | "obrazek"
  | "pdf"
  | "zip"
  | "word"
  | "excel"
  | "prezentace"
  | "kod"
  | "html"
  | "zvuk"
  | "video"
  | "tabulka"
  | "aplikace"
  | "neznamy";

/** Identifikátory aplikací. Používá je Start, hlavní panel i správa oken. */
export type AppId =
  | "pruzkumnik"
  | "poznamkovy-blok"
  | "malovani"
  | "kalkulacka"
  | "nastaveni"
  | "terminal"
  | "spravce-uloh"
  | "fotky"
  | "prohlizec";

export interface TypSouboru {
  popis: string;
  ikona: IkonaKlic;
  /** Aplikace, která soubor otevře. `null` = v tomto počítači nic takového není. */
  app: AppId | null;
  /** Vysvětlení do dialogu, když soubor otevřít nejde. */
  duvod?: string;
}

const TYPY: Record<string, TypSouboru> = {
  txt: { popis: "Textový dokument", ikona: "text", app: "poznamkovy-blok" },
  md: { popis: "Soubor MD", ikona: "text", app: "poznamkovy-blok" },
  log: { popis: "Textový dokument", ikona: "text", app: "poznamkovy-blok" },
  ini: { popis: "Nastavení konfigurace", ikona: "text", app: "poznamkovy-blok" },
  csv: { popis: "Soubor hodnot oddělených čárkami", ikona: "tabulka", app: "poznamkovy-blok" },
  html: { popis: "Dokument HTML", ikona: "html", app: "prohlizec" },
  css: { popis: "Kaskádový styl", ikona: "kod", app: "poznamkovy-blok" },
  js: { popis: "Soubor JavaScript", ikona: "kod", app: "poznamkovy-blok" },
  py: { popis: "Soubor Python", ikona: "kod", app: "poznamkovy-blok" },
  json: { popis: "Soubor JSON", ikona: "kod", app: "poznamkovy-blok" },
  bat: { popis: "Dávkový soubor systému Windows", ikona: "kod", app: "poznamkovy-blok" },
  png: { popis: "Soubor PNG", ikona: "obrazek", app: "fotky" },
  jpg: { popis: "Soubor JPG", ikona: "obrazek", app: "fotky" },
  jpeg: { popis: "Soubor JPEG", ikona: "obrazek", app: "fotky" },
  gif: { popis: "Soubor GIF", ikona: "obrazek", app: "fotky" },
  bmp: { popis: "Soubor BMP", ikona: "obrazek", app: "fotky" },
  webp: { popis: "Soubor WEBP", ikona: "obrazek", app: "fotky" },
  svg: { popis: "Obrázek SVG", ikona: "obrazek", app: "fotky" },
  pdf: { popis: "Dokument PDF", ikona: "pdf", app: "prohlizec" },
  zip: { popis: "Komprimovaná složka (metoda ZIP)", ikona: "zip", app: "pruzkumnik" },
  docx: {
    popis: "Dokument aplikace Microsoft Word",
    ikona: "word",
    app: null,
    duvod: "V tomto počítači není nainstalovaný Microsoft Word.",
  },
  xlsx: {
    popis: "List aplikace Microsoft Excel",
    ikona: "excel",
    app: null,
    duvod: "V tomto počítači není nainstalovaný Microsoft Excel.",
  },
  pptx: {
    popis: "Prezentace aplikace Microsoft PowerPoint",
    ikona: "prezentace",
    app: null,
    duvod: "V tomto počítači není nainstalovaný Microsoft PowerPoint.",
  },
  mp3: {
    popis: "Soubor MP3",
    ikona: "zvuk",
    app: null,
    duvod: "Přehrávání zvuku není ve výukovém prostředí k dispozici.",
  },
  wav: {
    popis: "Zvuk ve formátu Wave",
    ikona: "zvuk",
    app: null,
    duvod: "Přehrávání zvuku není ve výukovém prostředí k dispozici.",
  },
  mp4: {
    popis: "Videosoubor MP4",
    ikona: "video",
    app: null,
    duvod: "Přehrávání videa není ve výukovém prostředí k dispozici.",
  },
  exe: {
    popis: "Aplikace",
    ikona: "aplikace",
    app: null,
    duvod: "Spouštění programů je ve výukovém prostředí vypnuté.",
  },
};

export const NEZNAMY: TypSouboru = {
  popis: "Soubor",
  ikona: "neznamy",
  app: null,
  duvod: "Windows nemůže tento soubor otevřít, protože pro něj není přiřazená žádná aplikace.",
};

/** Typ podle přípony. Neznámá přípona dostane obecný „Soubor XYZ". */
export function typSouboru(jmeno: string): TypSouboru {
  const p = pripona(jmeno);
  if (!p) return { popis: "Soubor", ikona: "neznamy", app: null, duvod: NEZNAMY.duvod };
  const znamy = TYPY[p];
  if (znamy) return znamy;
  return { ...NEZNAMY, popis: `Soubor ${p.toUpperCase()}` };
}

/**
 * Je přípona v systému zaregistrovaná? Windows skrývá jen přípony známých
 * typů – neznámou příponu ukáže vždycky, i když je skrývání zapnuté.
 */
export function znamaPripona(jmeno: string): boolean {
  const p = pripona(jmeno);
  return p.length > 0 && p in TYPY;
}

/** Přípony, které Fotky umí zobrazit. */
export const OBRAZKY = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];

export const jeObrazek = (jmeno: string) => OBRAZKY.includes(pripona(jmeno));

/** Přípony, které Poznámkový blok otevře jako čitelný text. */
export const TEXTOVE = ["txt", "md", "log", "ini", "csv", "html", "css", "js", "py", "json", "bat"];

export const jeText = (jmeno: string) => TEXTOVE.includes(pripona(jmeno));

/** Jména aplikací tak, jak je vidí žák v Startu, na panelu i v záhlaví okna. */
export const APLIKACE: Record<AppId, { nazev: string; ikona: AppId; popis: string }> = {
  pruzkumnik: {
    nazev: "Průzkumník souborů",
    ikona: "pruzkumnik",
    popis: "Procházení disku, složek a souborů",
  },
  "poznamkovy-blok": {
    nazev: "Poznámkový blok",
    ikona: "poznamkovy-blok",
    popis: "Jednoduchý textový editor",
  },
  malovani: { nazev: "Malování", ikona: "malovani", popis: "Kreslení a úpravy obrázků" },
  kalkulacka: {
    nazev: "Kalkulačka",
    ikona: "kalkulacka",
    popis: "Standardní i programátorský režim",
  },
  nastaveni: { nazev: "Nastavení", ikona: "nastaveni", popis: "Nastavení systému Windows" },
  terminal: {
    nazev: "Terminál",
    ikona: "terminal",
    popis: "Příkazový řádek a PowerShell",
  },
  "spravce-uloh": {
    nazev: "Správce úloh",
    ikona: "spravce-uloh",
    popis: "Běžící procesy a výkon počítače",
  },
  fotky: { nazev: "Fotky", ikona: "fotky", popis: "Prohlížeč obrázků" },
  prohlizec: { nazev: "Microsoft Edge", ikona: "prohlizec", popis: "Webový prohlížeč" },
};
