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

/** Odhad velikosti archivu. Text jde stlačit líp než už zabalený obrázek. */
export function komprimovanaVelikost(uzly: Uzel[]): number {
  const puvodni = uzly.reduce((s, u) => s + velikost(u), 0);
  // 22 bajtů je hlavička prázdného archivu – i prázdný ZIP něco váží.
  return Math.max(22, Math.round(puvodni * 0.41) + 30 * uzly.length);
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
