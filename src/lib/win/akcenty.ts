/**
 * Zvýrazňovací barvy, jak je nabízí Nastavení → Přizpůsobení → Barvy.
 *
 * Každá barva má dva odstíny. Ve světlém motivu se používá tmavší (bílý text
 * na něm má dost kontrastu), v tmavém světlejší. Windows to dělá stejně –
 * proto vypadá „stejná" barva v obou režimech jinak.
 */

export interface Akcent {
  id: string;
  nazev: string;
  /** Kanály RGB oddělené mezerou – tak je potřebuje CSS proměnná `--win-akcent`. */
  svetly: string;
  tmavy: string;
}

export const AKCENTY: Akcent[] = [
  { id: "modra", nazev: "Modrá", svetly: "0 103 192", tmavy: "76 194 255" },
  { id: "tyrkysova", nazev: "Tyrkysová", svetly: "3 120 111", tmavy: "65 196 180" },
  { id: "zelena", nazev: "Zelená", svetly: "16 124 65", tmavy: "77 194 107" },
  { id: "olivova", nazev: "Olivová", svetly: "94 111 47", tmavy: "168 195 74" },
  { id: "zluta", nazev: "Zlatá", svetly: "138 97 0", tmavy: "242 186 60" },
  { id: "oranzova", nazev: "Oranžová", svetly: "180 80 14", tmavy: "255 140 66" },
  { id: "cervena", nazev: "Červená", svetly: "192 43 43", tmavy: "255 107 107" },
  { id: "ruzova", nazev: "Růžová", svetly: "191 61 107", tmavy: "255 134 176" },
  { id: "fialova", nazev: "Fialová", svetly: "122 63 184", tmavy: "189 140 245" },
  { id: "svetlemodra", nazev: "Nebeská", svetly: "15 108 189", tmavy: "108 184 255" },
  { id: "namornicka", nazev: "Námořnická", svetly: "42 76 143", tmavy: "127 159 224" },
  { id: "seda", nazev: "Grafitová", svetly: "74 79 85", tmavy: "169 177 187" },
];

export const vybranyAkcent = (id: string): Akcent =>
  AKCENTY.find((a) => a.id === id) ?? AKCENTY[0];

/** Barva akcentu k přímému použití v CSS (vzorky v Nastavení, náhledy). */
export const barvaAkcentu = (akcent: Akcent, tmavy: boolean): string =>
  `rgb(${tmavy ? akcent.tmavy : akcent.svetly})`;
