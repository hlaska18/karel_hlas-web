/**
 * Operace nad soubory, které dělá Průzkumník i plocha.
 *
 * Jsou tady dohromady schválně: plocha je taky jen složka a pravé tlačítko
 * na ní musí umět totéž co v okně. Kdyby si každá komponenta psala vlastní
 * kopírování, hned se rozejdou v drobnostech (co dělá vložení do stejné
 * složky, jestli jde smazat systémová položka) a žák za to zaplatí.
 */

import {
  jeSlozka,
  jeUvnitr,
  kopie,
  najdi,
  najdiSlozku,
  nadrazena,
  odeber,
  rozloz,
  sloz,
  vloz,
  volneJmeno,
  type Slozka,
  type Uzel,
} from "./fs";
import { doKose } from "./reducer";
import type { PolozkaKose, Stav } from "./stav";

export interface Schranka {
  uzly: Uzel[];
  zdroj: string[];
  vyjmout: boolean;
}

/** Připraví obsah schránky. Kopie se dělá hned, aby ji originál nepřepsal. */
export function doSchranky(
  disk: Slozka,
  cesty: string[][],
  vyjmout: boolean,
): Schranka | null {
  const uzly = cesty
    .map((c) => najdi(disk, c))
    .filter((u): u is Uzel => u !== null)
    .map(kopie);
  if (uzly.length === 0) return null;
  return { uzly, zdroj: nadrazena(cesty[0]), vyjmout };
}

export interface VysledekVlozeni {
  disk: Slozka;
  /** Schránka po vložení – po přesunu se vyprázdní, po kopii zůstává. */
  schranka: Schranka | null;
  chyba?: string;
}

/** Vloží obsah schránky do složky. Jméno v kolizi dostane „(2)". */
export function vloz_ze_schranky(
  disk: Slozka,
  schranka: Schranka,
  kam: string[],
): VysledekVlozeni {
  const cil = najdiSlozku(disk, kam);
  if (!cil) return { disk, schranka, chyba: "Cílová složka už neexistuje." };

  let novy = disk;
  for (const uzel of schranka.uzly) {
    const puvodniCesta = [...schranka.zdroj, uzel.jmeno];
    if (jeSlozka(uzel) && jeUvnitr(puvodniCesta, kam)) {
      return {
        disk,
        schranka,
        chyba: `Složku ${uzel.jmeno} nelze zkopírovat sama do sebe.`,
      };
    }
    const aktualni = najdiSlozku(novy, kam);
    if (!aktualni) break;
    const jmeno = volneJmeno(aktualni, uzel.jmeno);
    novy = vloz(novy, kam, { ...kopie(uzel), jmeno, zmeneno: Date.now() });
    if (schranka.vyjmout) novy = odeber(novy, puvodniCesta);
  }
  return { disk: novy, schranka: schranka.vyjmout ? null : schranka };
}

export interface VysledekMazani {
  disk: Slozka;
  polozky: PolozkaKose[];
  /** Položky, které smazat nešly (systémové). */
  odepreno: string[];
}

/** Přesune položky do Koše. Zamčené systémové položky zůstanou. */
export function smazDoKose(disk: Slozka, cesty: string[][]): VysledekMazani {
  const odepreno: string[] = [];
  const smazane: { uzel: Uzel; puvod: string[] }[] = [];
  let novy = disk;
  for (const cesta of cesty) {
    const uzel = najdi(novy, cesta);
    if (!uzel) continue;
    if (uzel.zamceno) {
      odepreno.push(uzel.jmeno);
      continue;
    }
    smazane.push({ uzel: kopie(uzel), puvod: nadrazena(cesta) });
    novy = odeber(novy, cesta);
  }
  const polozky = smazane.flatMap(({ uzel, puvod }) => doKose([uzel], puvod));
  return { disk: novy, polozky, odepreno };
}

/** Vrátí položku z Koše zpět. Když původní složka zmizela, vytvoří se znovu. */
export function obnovZKose(disk: Slozka, polozka: PolozkaKose): Slozka {
  let novy = disk;
  // Chybějící mezisložky doplníme, ať obnovení nikdy neselže potichu.
  for (let i = 2; i <= polozka.puvod.length; i += 1) {
    const cast = polozka.puvod.slice(0, i);
    if (!najdiSlozku(novy, cast)) {
      novy = vloz(novy, cast.slice(0, -1), {
        druh: "slozka",
        jmeno: cast[cast.length - 1],
        deti: [],
        zmeneno: Date.now(),
      });
    }
  }
  const cil = najdiSlozku(novy, polozka.puvod);
  if (!cil) return disk;
  const jmeno = volneJmeno(cil, polozka.uzel.jmeno);
  return vloz(novy, polozka.puvod, { ...polozka.uzel, jmeno });
}

/** Cesty vybraných položek v aktuální složce. */
export const cestyVyberu = (slozka: string[], jmena: string[]): string[][] =>
  jmena.map((j) => [...slozka, j]);

/** Hledání podle názvu – prochází i podsložky, jako vyhledávání v Průzkumníku. */
export interface Nalez {
  uzel: Uzel;
  cesta: string[];
}

export function hledej(disk: Slozka, kde: string[], dotaz: string): Nalez[] {
  const hledane = dotaz.trim().toLowerCase();
  if (!hledane) return [];
  const koren = najdiSlozku(disk, kde);
  if (!koren) return [];
  const nalezy: Nalez[] = [];
  const projdi = (slozka: Slozka, cesta: string[]) => {
    for (const dite of slozka.deti) {
      const cestaDitete = [...cesta, dite.jmeno];
      if (dite.jmeno.toLowerCase().includes(hledane)) {
        nalezy.push({ uzel: dite, cesta: cestaDitete });
      }
      if (jeSlozka(dite) && nalezy.length < 200) projdi(dite, cestaDitete);
    }
  };
  projdi(koren, kde);
  return nalezy;
}

/** Zkratky do postranního panelu Průzkumníku. */
export const RYCHLY_PRISTUP: { nazev: string; cesta: string }[] = [
  { nazev: "Plocha", cesta: "C:\\Users\\Zak\\Desktop" },
  { nazev: "Stažené soubory", cesta: "C:\\Users\\Zak\\Downloads" },
  { nazev: "Dokumenty", cesta: "C:\\Users\\Zak\\Documents" },
  { nazev: "Obrázky", cesta: "C:\\Users\\Zak\\Pictures" },
  { nazev: "Hudba", cesta: "C:\\Users\\Zak\\Music" },
  { nazev: "Videa", cesta: "C:\\Users\\Zak\\Videos" },
];

/** Zvláštní „cesty", které nejsou na disku. */
export const KOS = "::kos";
export const POCITAC = "::pocitac";

export const jeZvlastni = (cesta: string) => cesta.startsWith("::");

/** Bezpečný převod zapsané cesty na části (prázdný vstup = domovská složka). */
export function cestaZTextu(text: string | undefined): string[] {
  if (!text || jeZvlastni(text)) return rozloz("C:\\Users\\Zak");
  const casti = rozloz(text);
  return casti.length ? casti : rozloz("C:");
}

export const textCesty = (casti: string[]) => sloz(casti);
