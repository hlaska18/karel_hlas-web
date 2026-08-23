/**
 * Komprimované složky (.zip).
 *
 * Uvnitř souboru je JSON s celým podstromem – žádná skutečná komprese se
 * neděje. Pro výuku je podstatné chování, ne algoritmus: ZIP se vytvoří,
 * dá se do něj nahlédnout, dá se rozbalit a je vidět, že je menší. Deflate
 * nad textem se v praxi na zhruba dvě pětiny dostane, takže tolik hlásíme.
 */

import { velikost, type Soubor, type Uzel } from "./fs";

const HLAVICKA = "PK-VYUKA-ZIP-1";

interface Balik {
  hlavicka: string;
  polozky: Uzel[];
}

/**
 * Kolik z původní velikosti zbude po zabalení, podle typu souboru.
 *
 * Tohle je jádro jedné z úloh: zabalit text a zabalit fotku nejsou dvě stejné
 * věci. JPEG, PNG, MP3, MP4 i .docx jsou uvnitř samy zabalené, takže ZIP na
 * nich neušetří skoro nic — a je to jedna z věcí, které žáky spolehlivě
 * překvapí.
 */
const POMER: Record<string, number> = {
  // text – deflate se v praxi dostane zhruba na dvě pětiny
  txt: 0.4,
  csv: 0.38,
  html: 0.36,
  htm: 0.36,
  ini: 0.45,
  log: 0.35,
  json: 0.3,
  md: 0.4,
  // formáty, které už komprimované jsou – ZIP z nich nic nedostane
  jpg: 0.98,
  jpeg: 0.98,
  png: 0.97,
  gif: 0.98,
  webp: 0.99,
  mp3: 0.98,
  mp4: 0.99,
  zip: 1,
  docx: 0.97,
  xlsx: 0.97,
  pptx: 0.98,
  pdf: 0.92,
};

/** Nezná-li se přípona, počítá se něco mezi. */
const POMER_VYCHOZI = 0.7;

const pomerUzlu = (u: Uzel): number => {
  if (u.druh === "slozka") {
    // U složky rozhoduje, co je uvnitř – spočítá se vážený průměr.
    const deti = u.deti;
    const celkem = deti.reduce((s, d) => s + velikost(d), 0);
    if (celkem === 0) return POMER_VYCHOZI;
    return deti.reduce((s, d) => s + velikost(d) * pomerUzlu(d), 0) / celkem;
  }
  const tecka = u.jmeno.lastIndexOf(".");
  const pripona = tecka === -1 ? "" : u.jmeno.slice(tecka + 1).toLowerCase();
  return POMER[pripona] ?? POMER_VYCHOZI;
};

/** Odhad velikosti archivu. Text jde stlačit líp než už zabalený obrázek. */
export function komprimovanaVelikost(uzly: Uzel[]): number {
  const obsah = uzly.reduce((s, u) => s + velikost(u) * pomerUzlu(u), 0);
  // 22 bajtů je hlavička prázdného archivu – i prázdný ZIP něco váží.
  return Math.max(22, Math.round(obsah) + 30 * uzly.length);
}

export function zabal(uzly: Uzel[]): Soubor {
  const balik: Balik = { hlavicka: HLAVICKA, polozky: uzly };
  return {
    druh: "soubor",
    jmeno: "Archiv.zip",
    obsah: JSON.stringify(balik),
    velikost: komprimovanaVelikost(uzly),
    zmeneno: Date.now(),
  };
}

/** Vrátí obsah archivu, nebo `null`, když soubor archivem není. */
export function rozbal(soubor: Soubor): Uzel[] | null {
  try {
    const balik = JSON.parse(soubor.obsah) as Balik;
    if (balik?.hlavicka !== HLAVICKA || !Array.isArray(balik.polozky)) return null;
    return balik.polozky;
  } catch {
    return null;
  }
}
