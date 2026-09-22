/**
 * Tažení myší – jedna pravidla pro Finder, plochu i Dock.
 *
 * Dřív to uměl jen Finder a jen uvnitř jednoho okna. Z plochy do okna,
 * z okna na plochu nebo na koš v Docku nešlo nic, a přitom je to první věc,
 * kterou žák zkusí. Proto tu jsou pravidla jednou pro všechny.
 *
 * Pravidlo je stejné jako ve Windows a proto z něj NENÍ úloha: po stejném
 * disku se položka PŘESUNE, na jiný disk (tady FLASH) se ZKOPÍRUJE. Na koš
 * se vždycky přesouvá – to je „Přesunout do koše", ne smazání.
 */

import { KOS, jeBalicek, slozMac } from "./cesty";
import {
  jeUvnitr,
  kopie,
  najdi,
  najdiSlozku,
  odeber,
  vloz,
  volneJmeno,
  type Slozka,
} from "@/lib/win/fs";

export type AkceTazeni = "presun" | "kopie";

/** Na kterém disku cesta leží. Připojené disky jsou pod `/Volumes`. */
export const svazek = (c: string[]) =>
  c[1] === "Volumes" && c[2] ? c[2] : "Macintosh HD";

const jeKos = (c: string[]) => slozMac(c) === slozMac(KOS);

/** Co se stane, když se `zdroj` pustí do složky `cil`. `null` = nejde to. */
export function coUdelaTazeni(
  disk: Slozka,
  zdroj: string[],
  cil: string[],
): AkceTazeni | null {
  if (slozMac(zdroj.slice(0, -1)) === slozMac(cil)) return null; // do téže složky
  if (!najdiSlozku(disk, cil) || jeBalicek(cil[cil.length - 1])) return null;
  if (jeUvnitr(zdroj, cil)) return null; // složka sama do sebe
  if (jeKos(cil)) return "presun";
  return svazek(zdroj) === svazek(cil) ? "presun" : "kopie";
}

/**
 * Provede tažení na disku. Vrátí nový disk a jméno, pod kterým položka
 * v cíli skončila – při shodě jmen dostane „ 2" jako ve Finderu.
 */
export function pustTazene(
  disk: Slozka,
  zdroj: string[],
  cil: string[],
): { disk: Slozka; jmeno: string; akce: AkceTazeni } | null {
  const akce = coUdelaTazeni(disk, zdroj, cil);
  if (!akce) return null;
  const uzel = najdi(disk, zdroj);
  const cilova = najdiSlozku(disk, cil);
  if (!uzel || !cilova) return null;
  if (akce === "presun" && uzel.zamceno) return null;
  const jmeno = volneJmeno(cilova, uzel.jmeno);
  let novy = disk;
  if (akce === "presun") novy = odeber(novy, zdroj);
  novy = vloz(novy, cil, { ...kopie(uzel), jmeno });
  return { disk: novy, jmeno, akce };
}

/** Stopa pro úkolovník. Klíče jsou tytéž, jaké psal Finder dřív. */
export function stopaTazeni(cil: string[], akce: AkceTazeni): string {
  if (jeKos(cil)) return "presunul-do-kose";
  return akce === "kopie" ? "zkopiroval-na-jiny-svazek" : "presunul-tazenim";
}

/*
 * Co se právě táhne. Jedna hodnota pro celé prostředí, jako systémová
 * schránka tažení. Musí ležet tady, ne v `dataTransfer`: prohlížeč dovolí
 * data z něj číst až při puštění, a cíl potřebuje vědět, co se nad ním
 * vznáší, už během tažení – aby ukázal zelené plus u kopie, nebo nic.
 */
let tazenaCesta: string[] | null = null;

export const zacniTazeni = (cesta: string[]) => {
  tazenaCesta = cesta;
};
export const skonciTazeni = () => {
  tazenaCesta = null;
};
export const tazenaPolozka = () => tazenaCesta;
