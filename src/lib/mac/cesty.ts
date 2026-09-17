/**
 * Cesty v macOS.
 *
 * PROČ VLASTNÍ SOUBOR A NE VĚTEV VE `win/fs.ts`. Souborový systém sám je na
 * operačním systému nezávislý – `fs.ts` pracuje s POLEM částí cesty
 * (`["Users", "zak", "Documents"]`) a jeho `rozloz()` umí rozdělit text podle
 * obou oddělovačů, `\` i `/`. Windowsácké je jedině SKLÁDÁNÍ cesty zpátky do
 * textu a názvy kořene. Proto se tu nekopíruje žádná logika – jen se dodá
 * druhý způsob, jak tytéž části napsat.
 *
 * Tím se Windows nemusí sahat vůbec. Simulace, která žákům běží tenhle týden
 * v hodině, zůstává nedotčená.
 *
 * ROZDÍL, KTERÝ SE TÍM UČÍ. Ve Windows visí strom pod písmenem disku (`C:\`).
 * Tady visí všechno pod jediným kořenem `/` a připojené disky se objeví
 * ve `/Volumes`. Písmeno disku je vynález Windows, ne zákon přírody – a je to
 * jedna z úloh.
 */

import { rozloz } from "@/lib/win/fs";

/**
 * JEDNA KONVENCE PRO CELÝ MAC: cesta je pole částí a PRVNÍ ČÁST JE KOŘEN,
 * který se jmenuje prázdným řetězcem.
 *
 *     ["", "Users", "zak", "Documents"]   →   /Users/zak/Documents
 *     [""]                                →   /
 *
 * Vypadá to zvláštně, ale je to přesně to, co čeká `najdi()` a spol. ve
 * `win/fs.ts`: „první část cesty je vždy disk". Ve Windows je tím diskem
 * `C:`, tady kořen bez jména. Díky tomu se dá celý souborový systém použít
 * beze změny – a Windows se nemusí sáhnout.
 *
 * Kdyby se kořen vynechával, musela by se dopisovat při každém volání, a to
 * je přesně ten druh nesouladu, který se jednou zapomene a tiše rozbije
 * hledání souboru.
 */
export const KOREN = "";

/** Domovská složka žáka. Malé „zak“ schválně – unixová jména bývají malá. */
export const DOMOV = [KOREN, "Users", "zak"];

/** Složky v domovské složce, které macOS zakládá sám. */
export const PLOCHA = [...DOMOV, "Desktop"];
export const DOKUMENTY = [...DOMOV, "Documents"];
export const STAZENE = [...DOMOV, "Downloads"];
export const OBRAZKY = [...DOMOV, "Pictures"];
export const KNIHOVNA = [...DOMOV, "Library"];

/** Aplikace nebydlí v domovské složce, ale rovnou v kořeni. */
export const APLIKACE = [KOREN, "Applications"];

/** Kam se připojují vyměnitelné disky – místo písmene disku. */
export const SVAZKY = [KOREN, "Volumes"];

/**
 * Rozloží zapsanou cestu na části včetně kořene.
 *
 * `rozloz()` z `fs.ts` prázdné části zahazuje, takže z `/Users/zak` udělá
 * `["Users","zak"]` – bez kořene. Tady se kořen vrací zpátky na začátek.
 */
export function rozlozMac(cesta: string): string[] {
  return [KOREN, ...rozloz(cesta)];
}

/**
 * Složí části do unixového tvaru `/Users/zak/Documents`.
 * Protějšek `sloz()` z `win/fs.ts`, který totéž skládá do `C:\Users\Zak`.
 */
export function slozMac(casti: string[]): string {
  const bezKorene = casti[0] === KOREN ? casti.slice(1) : casti;
  return bezKorene.length === 0 ? "/" : `/${bezKorene.join("/")}`;
}

/**
 * Zkrácený zápis domovské složky vlnovkou, jak ho píše Terminál i Finder:
 * `/Users/zak/Documents` → `~/Documents`.
 */
export function sVlnovkou(casti: string[]): string {
  const jeDoma = casti.length >= DOMOV.length && DOMOV.every((c, i) => casti[i] === c);
  if (!jeDoma) return slozMac(casti);
  const zbytek = casti.slice(DOMOV.length);
  return zbytek.length === 0 ? "~" : `~/${zbytek.join("/")}`;
}

/**
 * Je to skrytá položka?
 *
 * Tady je „skrytý“ JMÉNO, ne vlastnost – cokoli s tečkou na začátku Finder
 * neukáže. Ve Windows je to naproti tomu příznak na souboru, který se přepíná
 * v nastavení zobrazení. Stejné slovo, dva úplně jiné mechanismy, a proto je
 * to jedna z úloh.
 */
export const jeSkryte = (jmeno: string): boolean => jmeno.startsWith(".");

/**
 * Je to balíček aplikace? Ve Finderu vypadá jako jeden soubor, na disku je to
 * složka – druhá z úloh, které jinde nemají obdobu.
 */
export const jeBalicek = (jmeno: string): boolean => jmeno.endsWith(".app");
