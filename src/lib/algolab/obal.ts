/**
 * Obal kódů ALGOLABu (ALG1- a ALGZ1-, Karel 10. 11. 2026): obsah se podepíše
 * a zamíchá, aby žákovi kód nedával smysl a ruční úprava ho rozbila.
 *
 * Postup: z obsahu a tajného klíče se spočítá podpis (6 bajtů), z podpisu
 * proud pseudonáhodných bajtů a ten se s obsahem smíchá (XOR). Kód je
 * podpis + zamíchaný obsah v base64url. Při čtení se obsah odmíchá
 * a podpis spočítá znovu; když nesedí, kód se odmítne.
 *
 * Není to šifra proti někomu, kdo čte kód stránky – klíč v něm je. Proti
 * přepsání kódu na webu „base64 decode“ to stačí: po rozbalení jsou jen
 * nesmyslné bajty a změna jediného znaku podpis rozbije.
 *
 * POZOR: změna klíče nebo postupu zneplatní všechny vydané kódy.
 */

import { generator } from "./nahoda";

const KLIC = "aLg0lab|7tQx-Vm2K-pR9w|SPS-Tabor";
const DELKA_PODPISU = 6;

const kodovac = new TextEncoder();

/** cyrb53: dvě 32bitová čísla, stabilní ve všech prohlížečích. */
function otisk(casti: Uint8Array[]): [number, number] {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (const cast of casti) {
    for (let i = 0; i < cast.length; i++) {
      h1 = Math.imul(h1 ^ cast[i], 2654435761);
      h2 = Math.imul(h2 ^ cast[i], 1597334677);
    }
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return [h1 >>> 0, h2 >>> 0];
}

function podpis(ucel: string, obsah: Uint8Array): Uint8Array {
  const [a, b] = otisk([kodovac.encode(`${KLIC}|${ucel}|`), obsah]);
  return new Uint8Array([a >>> 24, a >>> 16, a >>> 8, a, b >>> 8, b].map((x) => x & 255));
}

/** XOR s proudem bajtů odvozeným z podpisu. Stejná funkce míchá i odmíchává. */
function zamichej(ucel: string, sig: Uint8Array, data: Uint8Array): Uint8Array {
  const [seed] = otisk([kodovac.encode(`${ucel}|proud|${KLIC}|`), sig]);
  const nahoda = generator(seed);
  const vysledek = new Uint8Array(data.length);
  let slovo = 0;
  for (let i = 0; i < data.length; i++) {
    if (i % 4 === 0) slovo = Math.floor(nahoda() * 4294967296);
    vysledek[i] = data[i] ^ ((slovo >>> ((i % 4) * 8)) & 255);
  }
  return vysledek;
}

function doBase64Url(bajty: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bajty.length; i++) s += String.fromCharCode(bajty[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function zBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
  let b = text.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  try {
    const s = atob(b);
    const bajty = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bajty[i] = s.charCodeAt(i);
    return bajty;
  } catch {
    return null;
  }
}

/** Text (JSON) → podepsaný a zamíchaný řetězec bez předpony. */
export function zabal(text: string, ucel: string): string {
  const obsah = kodovac.encode(text);
  const sig = podpis(ucel, obsah);
  const zamichane = zamichej(ucel, sig, obsah);
  const vse = new Uint8Array(sig.length + zamichane.length);
  vse.set(sig);
  vse.set(zamichane, sig.length);
  return doBase64Url(vse);
}

/** Opak `zabal`. Upravený, useknutý nebo cizí kód vrátí jako null. */
export function rozbal(kod: string, ucel: string): string | null {
  const vse = zBase64Url(kod);
  if (!vse || vse.length <= DELKA_PODPISU) return null;
  const sig = vse.subarray(0, DELKA_PODPISU);
  const obsah = zamichej(ucel, sig, vse.subarray(DELKA_PODPISU));
  const znovu = podpis(ucel, obsah);
  for (let i = 0; i < DELKA_PODPISU; i++) if (znovu[i] !== sig[i]) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(obsah);
  } catch {
    return null;
  }
}

/* ───────────── Heslo zadání (hodina 8) ───────────── */

/** Znaky bez zaměnitelných (0/O, 1/I). Stejné jako u id zadání. */
export const ZNAKY = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const normalizujHeslo = (heslo: string) => heslo.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * Id zadání se odvodí z hesla vyučujícího. Žák zná jen id a heslo z něj
 * zpátky nezjistí, takže bez hesla nevidí správné odpovědi. Varianta otázek
 * vzniká z id jako dřív, generátor se tím nemění.
 */
export function zadaniZHesla(heslo: string): string {
  const [a, b] = otisk([kodovac.encode(`${KLIC}|zadani|`), kodovac.encode(normalizujHeslo(heslo))]);
  let id = "";
  for (let i = 0; i < 6; i++) id += ZNAKY[((i < 3 ? a : b) >>> ((i % 3) * 5)) & 31];
  return id;
}

/** Nové heslo vyučujícího: 12 znaků ve třech skupinách, ~60 bitů náhody. */
export function noveHeslo(): string {
  const cisla = new Uint32Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(cisla);
  else for (let i = 0; i < 12; i++) cisla[i] = Math.floor(Math.random() * 4294967296);
  let h = "";
  for (let i = 0; i < 12; i++) h += (i && i % 4 === 0 ? "-" : "") + ZNAKY[cisla[i] % ZNAKY.length];
  return h;
}
