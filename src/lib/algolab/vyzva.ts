/**
 * Výzva v lekci o batohu: každý seed dá stejně těžké zadání s jinými čísly.
 *
 * Podmínky: optimum je jediné, obě hladová pravidla ho mine a hodina navíc zlepší
 * výsledek. Bez nich by otázky neměly smysl: žák by neměl co vysvětlovat a
 * otázka na kapacitu +1 by pokaždé končila nulou.
 */

import {
  krokyTabulky,
  optimalniPlan,
  pravidloNejvynosnejsi,
  pravidloZaHodinu,
  spoctiTabulku,
  vsechnaOptima,
  type Krok,
  type Plan,
  type Zakazka,
} from "./batoh";
import { generator, zamichej } from "./nahoda";

export interface Vyzva {
  seed: number;
  zakazky: Zakazka[];
  kapacita: number;
  tabulka: number[][];
  optimum: Plan;
  /** Tři buňky k doplnění: zakázka se vyplatí, nevyplatí a nevejde se. */
  bunky: Krok[];
  vyznam: { radek: number; sloupec: number; moznosti: { text: string; spravne: boolean }[] };
  kapacitaNavic: { prinos: number; rozdil: number; plan: Plan };
}

const NAZVY = ["Konzoly", "Víka", "Pouzdra", "Čepy", "Kryty", "Rámy", "Spojky", "Podložky", "Objímky", "Matice"];
const POCTY = ["", "jednoho", "dvou", "tří", "čtyř", "pěti"];
const POKUSU = 20000;

function vyberBunky(kroky: Krok[], nahoda: () => number): Krok[] | null {
  const uvnitr = kroky.filter((k) => k.radek >= 2 && k.sloupec >= 1);
  const vyplati = uvnitr.filter((k) => k.s !== null && k.s > k.bez && k.s > k.zakazka.prinos);
  const nevyplati = uvnitr.filter((k) => k.s !== null && k.s < k.bez);
  const nevejde = uvnitr.filter((k) => !k.vejdeSe && k.bez > 0);
  if (!vyplati.length || !nevyplati.length || !nevejde.length) return null;

  for (let i = 0; i < 30; i++) {
    const bunky = [vyplati, nevyplati, nevejde].map((skupina) => skupina[Math.floor(nahoda() * skupina.length)]);
    // Zdroj jedné buňky nesmí být jiná skrytá, žák by neměl z čeho počítat.
    const nezavisle = bunky.every((b) =>
      b.zdroje.every(([r, s]) => !bunky.some((jina) => jina.radek === r && jina.sloupec === s)),
    );
    if (nezavisle) return bunky;
  }
  return null;
}

function hledej(seed: number): Vyzva | null {
  const nahoda = generator(seed);
  const cislo = (od: number, po: number) => od + Math.floor(nahoda() * (po - od + 1));

  for (let pokus = 0; pokus < POKUSU; pokus++) {
    const kapacita = cislo(8, 12);
    const nazvy = zamichej(NAZVY, nahoda);
    const zakazky = nazvy
      .slice(0, 5)
      .map((nazev, i) => {
        const doba = cislo(2, 7);
        return { id: String.fromCharCode(65 + i), nazev, doba, prinos: doba * cislo(3, 7) + cislo(0, 4) };
      })
      .sort((a, b) => a.doba - b.doba);

    const optima = vsechnaOptima(zakazky, kapacita);
    if (optima.length !== 1) continue;
    const optimum = optima[0];
    if (pravidloNejvynosnejsi(zakazky, kapacita).prinos >= optimum.prinos) continue;
    if (pravidloZaHodinu(zakazky, kapacita).prinos >= optimum.prinos) continue;
    const navic = optimalniPlan(zakazky, kapacita + 1);
    if (navic.prinos <= optimum.prinos) continue;
    const kroky = krokyTabulky(zakazky, kapacita);
    const bunky = vyberBunky(kroky, nahoda);
    if (!bunky) continue;

    const radek = cislo(2, zakazky.length - 1);
    const sloupec = cislo(Math.ceil(kapacita / 2), kapacita);
    const zakazka = zakazky[radek - 1];
    return {
      seed,
      zakazky,
      kapacita,
      tabulka: spoctiTabulku(zakazky, kapacita),
      optimum,
      bunky,
      vyznam: {
        radek,
        sloupec,
        moznosti: zamichej(
          [
            { text: `Nejlepší přínos, když smíš vybírat jen z prvních ${POCTY[radek]} úkolů a stroj má ${sloupec} h.`, spravne: true },
            { text: `Přínos samotného úkolu ${zakazka.nazev}, když se vyrábí ${sloupec} h.`, spravne: false },
            { text: `Nejlepší přínos ze všech ${POCTY[zakazky.length]} úkolů, když má stroj ${sloupec} h.`, spravne: false },
            { text: `Součet přínosů prvních ${POCTY[radek]} úkolů, pokud se vejdou do ${sloupec} h.`, spravne: false },
          ],
          nahoda,
        ),
      },
      kapacitaNavic: { prinos: navic.prinos, rozdil: navic.prinos - optimum.prinos, plan: navic },
    };
  }
  return null;
}

export function vygenerujVyzvu(seed: number): Vyzva {
  const cisty = seed >>> 0;
  // Seed 1 prověřuje test. Kdyby jiný po všech pokusech nic nenašel, stránka nespadne.
  return hledej(cisty) ?? hledej(1)!;
}
