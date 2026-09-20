/**
 * Efekt džina: tvar trychtýře, do kterého se okno vsává při schování do Docku.
 *
 * Matematika je převzatá ze shaderu „Genie effect" od Altahy Ansariho
 * (https://www.shadertoy.com/view/flyfRt), viz licenci níž.
 *
 * PROČ TO NEPOTŘEBUJE WebGL. Ten shader vypadá jako deformace obrázku, ale
 * když se do něj člověk zadívá, zjistí, že je celý jen VODOROVNÝ a řádek po
 * řádku: každý vodorovný pruh okna se pouze zúží a posune do strany. Nic se
 * neotáčí a uvnitř pruhu se nic neohýbá. Takový pohyb umí obyčejné CSS
 * `transform`, takže stačí okno rozřezat na pár desítek pruhů a každému dát
 * vlastní posun a zúžení. Odpadá tím celý problém s dostáním živého DOMu do
 * textury, kvůli kterému to napoprvé vypadalo na neřešitelné.
 *
 * ----------------------------------------------------------------------
 * MIT License
 *
 * Copyright (c) 2023, Altaha Ansari
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ----------------------------------------------------------------------
 */

/**
 * Na kolik bodů se obrys trychtýře vzorkuje. Mezi body vede rovná úsečka,
 * takže je to kompromis mezi hladkostí a prací navíc – při 40 je zakřivení
 * na oko plynulé a přepočítat 80 bodů za snímek nic nestojí.
 */
export const VZORKU = 40;

/** Jak dlouho trvá vsátí. Skutečný Mac je kolem této hodnoty. */
export const DOBA_MS = 450;

/** Se Shiftem se to zpomalí. Applovský vtípek z roku 2001, drží dodnes. */
export const ZPOMALENI = 4;

const VYBOULENI = 0.1;
const MOCNINA = 0.9;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Vyboulení krku trychtýře. Nahoře i dole nula, uprostřed maximum – právě
 * tohle dělá to zakřivení, kvůli kterému to vypadá jako džin mizící v lampě,
 * a ne jako obyčejné zmenšení.
 */
export function vyboul(t: number): number {
  return Math.pow(Math.sin(t * Math.PI) * VYBOULENI, MOCNINA);
}

/**
 * Levý a pravý okraj trychtýře ve výšce `t`.
 *
 * `t` je 0 u Docku (úzký konec) a 1 nahoře (plná šířka okna). Souřadnice
 * jsou v podílu šířky okna: 0 je levý okraj okna, 1 pravý. `kam` a `sirkaDole`
 * popisují ve stejné soustavě cílovou ikonu v Docku.
 */
export function okrajeProuzku(
  t: number,
  kam: number,
  sirkaDole: number,
): { levy: number; pravy: number } {
  const b = vyboul(t);
  const levyDole = kam - sirkaDole / 2 + b;
  const pravyDole = kam + sirkaDole / 2 - b;
  return { levy: mix(levyDole, 0, t), pravy: mix(pravyDole, 1, t) };
}

/** Plynulý rozjezd i dojezd. Lineární postup vypadá mechanicky. */
export function nahladce(f: number): number {
  return f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
}

/**
 * O kolik je vršek okna pozadu za spodkem.
 *
 * Bez tohohle se okno scvrkává rovnoměrně jako harmonika a vypadá to jako
 * obyčejné zmenšení. Na Macu se nejdřív vsaje spodní hrana a vršek zůstává
 * nahoře a v plné šířce – teprve tím vznikne ten protažený krk, podle
 * kterého se efekt jmenuje.
 */
export const ZPOZDENI_VRSKU = 0.35;

/**
 * Postup pro daný řez okna. `s` je 0 u horní hrany a 1 u spodní; spodek se
 * rozjede hned, vršek až po `ZPOZDENI_VRSKU`. Oba dorazí na konci společně.
 */
export function postupRezu(postup: number, s: number): number {
  const zacatek = (1 - s) * ZPOZDENI_VRSKU;
  const mistni = (postup - zacatek) / (1 - ZPOZDENI_VRSKU);
  return nahladce(Math.max(0, Math.min(1, mistni)));
}

