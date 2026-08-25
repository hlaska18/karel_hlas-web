"use client";

/**
 * Měření stažení materiálu.
 *
 * Vercel Analytics počítá zobrazení stránek, jenže stažení souboru žádnou
 * stránku nenačte – klikne se na odkaz a prohlížeč si vezme soubor. Bez
 * vlastní události se tedy nedá zjistit ani to, jestli si někdo materiál
 * vůbec vzal, natož který.
 *
 * Na jednom místě schválně: odkazy ke stažení jsou v bance tři (řádek
 * materiálu, tlačítko v náhledu a seznam v mezipředmětových vazbách) a kdyby
 * si každý pojmenoval událost po svém, vznikly by tři poloviční statistiky
 * místo jedné celé.
 *
 * POZOR: vlastní události jsou na Vercelu funkce placeného tarifu. Na Hobby
 * se `track()` zavolá a nic se nestane – stránku to nerozbije, jen se nic
 * nenaměří. Pozná se to tak, že se v Analytics po několika staženích pořád
 * neukáže nic.
 *
 * Posílá se jen popis materiálu. Nic o návštěvníkovi.
 */

import { track } from "@vercel/analytics";

export type StazenyMaterial = {
  label: { cs: string; en: string };
  ext: string;
  tool: string;
};

export function zaznamenejStazeni(it: StazenyMaterial): void {
  try {
    track("stazeni", {
      // Vždycky český název, i když si stránku prohlíží Angličan – jinak by
      // se tentýž materiál v přehledu rozpadl na dva různé řádky.
      material: it.label.cs,
      tema: it.tool,
      pripona: it.ext,
    });
  } catch {
    // Měření nesmí stát v cestě stažení. Když se cokoli pokazí, soubor se
    // stáhne dál a nikdo si ničeho nevšimne.
  }
}
