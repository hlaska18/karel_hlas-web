/**
 * Problém batohu 0/1 pro lekci ALGOLAB (`/algolab`): stroj má omezený počet
 * volných hodin a žák vybírá výrobní zakázky. Čisté funkce bez Reactu.
 *
 * Řádky tabulky jdou od nejkratší zakázky po nejdelší. Zakázka, která se nevejde,
 * pak opisuje nenulovou hodnotu shora. Kdyby dlouhé zakázky šly první, opisovaly
 * by se samé nuly a žák by si z toho odnesl, že „nevejde se“ znamená nulu.
 */

export interface Zakazka {
  id: string;
  nazev: string;
  /** Doba výroby v celých hodinách. */
  doba: number;
  /** Přínos v tisících Kč. */
  prinos: number;
}

export interface Plan {
  ids: string[];
  doba: number;
  prinos: number;
}

export const KAPACITA = 10;

export const ZAKAZKY: Zakazka[] = [
  { id: "E", nazev: "Držáky", doba: 2, prinos: 11 },
  { id: "D", nazev: "Šrouby", doba: 3, prinos: 13 },
  { id: "B", nazev: "Hřídele", doba: 5, prinos: 26 },
  { id: "C", nazev: "Příruby", doba: 5, prinos: 25 },
  { id: "A", nazev: "Ložisková pouzdra", doba: 7, prinos: 36 },
];

export function planZ(zakazky: Zakazka[], ids: string[]): Plan {
  const vybrane = zakazky.filter((z) => ids.includes(z.id));
  return {
    ids: vybrane.map((z) => z.id),
    doba: vybrane.reduce((s, z) => s + z.doba, 0),
    prinos: vybrane.reduce((s, z) => s + z.prinos, 0),
  };
}

/** `T[i][h]` = nejlepší přínos z prvních `i` zakázek při `h` hodinách. */
export function spoctiTabulku(zakazky: Zakazka[], kapacita: number): number[][] {
  const T = [new Array<number>(kapacita + 1).fill(0)];
  zakazky.forEach((z, i) => {
    const radek = new Array<number>(kapacita + 1).fill(0);
    for (let h = 0; h <= kapacita; h++) {
      const bez = T[i][h];
      radek[h] = z.doba <= h ? Math.max(bez, z.prinos + T[i][h - z.doba]) : bez;
    }
    T.push(radek);
  });
  return T;
}

export interface Krok {
  radek: number;
  sloupec: number;
  zakazka: Zakazka;
  vejdeSe: boolean;
  bez: number;
  /** Přínos se zakázkou, `null` když se nevejde. */
  s: number | null;
  hodnota: number;
  /** Buňky, ze kterých se hodnota počítá: [řádek, sloupec]. */
  zdroje: [number, number][];
}

/** Jeden krok na buňku. Nultý řádek je samé nuly, ten se nepočítá. */
export function krokyTabulky(zakazky: Zakazka[], kapacita: number): Krok[] {
  const T = spoctiTabulku(zakazky, kapacita);
  const kroky: Krok[] = [];
  zakazky.forEach((zakazka, i) => {
    const radek = i + 1;
    for (let sloupec = 0; sloupec <= kapacita; sloupec++) {
      const vejdeSe = zakazka.doba <= sloupec;
      const bez = T[i][sloupec];
      kroky.push({
        radek,
        sloupec,
        zakazka,
        vejdeSe,
        bez,
        s: vejdeSe ? zakazka.prinos + T[i][sloupec - zakazka.doba] : null,
        hodnota: T[radek][sloupec],
        zdroje: vejdeSe
          ? [
              [i, sloupec],
              [i, sloupec - zakazka.doba],
            ]
          : [[i, sloupec]],
      });
    }
  });
  return kroky;
}

export function komentarKroku(k: Krok): string {
  const { nazev, doba, prinos } = k.zakazka;
  if (!k.vejdeSe) {
    return `${nazev} trvají ${doba} h, ale stroj má v tomhle sloupci jen ${k.sloupec} h. Nevejdou se, takže se opíše hodnota shora: ${k.bez}.`;
  }
  const zbytek = k.sloupec - doba;
  const vypocet = `Bez nich: ${k.bez}. S nimi: ${prinos} + ${k.s! - prinos} (nejlepší přínos při zbývajícím čase ${zbytek} h) = ${k.s}.`;
  if (k.s === k.bez) return `${vypocet} Obě možnosti dají stejně: ${k.hodnota}.`;
  return `${vypocet} Větší je ${k.hodnota}.`;
}

export interface KrokZpet {
  radek: number;
  sloupec: number;
  zakazka: Zakazka;
  vzata: boolean;
}

/**
 * Cesta tabulkou odzadu: když se hodnota liší od řádku nad ní, zakázka v plánu
 * je a pokračuje se o její dobu vlevo. U shody se bere plán bez zakázky.
 */
export function zpetnaCesta(zakazky: Zakazka[], kapacita: number): KrokZpet[] {
  const T = spoctiTabulku(zakazky, kapacita);
  const cesta: KrokZpet[] = [];
  let h = kapacita;
  for (let radek = zakazky.length; radek >= 1; radek--) {
    const zakazka = zakazky[radek - 1];
    const vzata = T[radek][h] !== T[radek - 1][h];
    cesta.push({ radek, sloupec: h, zakazka, vzata });
    if (vzata) h -= zakazka.doba;
  }
  return cesta;
}

export function optimalniPlan(zakazky: Zakazka[], kapacita: number): Plan {
  const vzate = zpetnaCesta(zakazky, kapacita).filter((k) => k.vzata);
  return planZ(zakazky, vzate.map((k) => k.zakazka.id));
}

export interface RozhodnutiPravidla {
  zakazka: Zakazka;
  vzata: boolean;
}

export interface VysledekPravidla extends Plan {
  poradi: RozhodnutiPravidla[];
}

function hladovePravidlo(zakazky: Zakazka[], kapacita: number, klic: (z: Zakazka) => number): VysledekPravidla {
  // `slice`, ne `toSorted`: cílový Firefox 111 ho ještě nemá.
  const serazene = zakazky.slice().sort((a, b) => klic(b) - klic(a) || a.doba - b.doba);
  let zbyva = kapacita;
  const poradi = serazene.map((zakazka) => {
    const vzata = zakazka.doba <= zbyva;
    if (vzata) zbyva -= zakazka.doba;
    return { zakazka, vzata };
  });
  return { ...planZ(zakazky, poradi.filter((p) => p.vzata).map((p) => p.zakazka.id)), poradi };
}

export const pravidloNejvynosnejsi = (zakazky: Zakazka[], kapacita: number) =>
  hladovePravidlo(zakazky, kapacita, (z) => z.prinos);

export const pravidloZaHodinu = (zakazky: Zakazka[], kapacita: number) =>
  hladovePravidlo(zakazky, kapacita, (z) => z.prinos / z.doba);

/** Všechny nejlepší plány hrubou silou. Na kontrolu, jen pro málo zakázek. */
export function vsechnaOptima(zakazky: Zakazka[], kapacita: number): Plan[] {
  let nejlepsi: Plan[] = [];
  for (let maska = 0; maska < 1 << zakazky.length; maska++) {
    const plan = planZ(zakazky, zakazky.filter((_, i) => maska & (1 << i)).map((z) => z.id));
    if (plan.doba > kapacita) continue;
    if (!nejlepsi.length || plan.prinos > nejlepsi[0].prinos) nejlepsi = [plan];
    else if (plan.prinos === nejlepsi[0].prinos) nejlepsi.push(plan);
  }
  return nejlepsi;
}

export const pocetKombinaci = (n: number) => 2 ** n;
export const pocetBunek = (n: number, kapacita: number) => n * (kapacita + 1);

/** Od kolika zakázek je kombinací víc než buněk tabulky. */
export function odKolikaSeVyplati(kapacita: number): number {
  let n = 1;
  while (pocetKombinaci(n) <= pocetBunek(n, kapacita)) n++;
  return n;
}
