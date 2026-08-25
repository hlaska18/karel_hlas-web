/**
 * Scénáře disku — s jakým počítačem žák do hodiny nastoupí.
 *
 * Simulace umí dvě věci, které skutečný školní počítač ne: dá se resetovat
 * a dá se PŘEDEM ROZBÍT. Dokud stavěl `seed.ts` jediný uklizený disk, byla
 * ta druhá schopnost nevyužitá — a přitom je to ta zajímavější. Úklid po
 * někom jiném nebo nástup do už napáchané škody se na uklizeném disku
 * nasimulovat nedá.
 *
 * Scénář výchozí disk NEOPISUJE, jen ho UPRAVUJE. Je to schválně: úlohy se
 * dívají na konkrétní cesty (`C:\Users\Zak\Documents\…`) a kdyby si každý
 * scénář stavěl strom po svém, dřív nebo později by některý zapomněl na
 * složku, o kterou se opírá úkol, a ten by se tiše přestal odškrtávat.
 * Takhle je kostra vždycky celá a scénář k ní jen přidává nepořádek.
 *
 * Volí se adresou: `/windows?scenar=uklid`. Učitel rozešle odkaz a žák nic
 * nenastavuje.
 */

import { vloz, rozloz, type Slozka, type Uzel } from "./fs";
import { FOTO_GRAF, FOTO_SNIMEK, FOTO_VYLET } from "./obrazky";
import { binarni, slozka, soubor, vytvorDisk } from "./seed";
import { zasifruj } from "./virus";

const DOMOV = "C:\\Users\\Zak";

export type Scenar = {
  id: string;
  nazev: string;
  /** Jedna věta pro učitele: na co je tahle hodina. */
  popis: string;
  uprav: (disk: Slozka) => Slozka;
};

export const VYCHOZI_SCENAR = "vychozi";

/** Přidá uzly do složky. `vloz` vrací nový strom, proto `reduce`. */
function pridej(disk: Slozka, kam: string, uzly: Uzel[]): Slozka {
  const cesta = rozloz(kam);
  return uzly.reduce<Slozka>((d, u) => vloz(d, cesta, u), disk);
}

/* ─────────────────── Úklid po spolužákovi ─────────────────── */

const FOTKY = [FOTO_VYLET, FOTO_SNIMEK, FOTO_GRAF];

/**
 * Plocha zavalená fotkami. Jsou to skutečné (byť kreslené) obrázky, ne prázdné
 * placeholdery — kdo některou otevře ve Fotkách, musí něco uvidět, jinak to
 * vypadá jako rozbité prostředí.
 *
 * Čísla souborů schválně nejdou po sobě a data se liší: seřadit podle jména
 * dá jiné pořadí než podle data, a to je půlka toho, co si má žák zkusit.
 */
function fotky(): Uzel[] {
  const uzly: Uzel[] = [];
  for (let i = 0; i < 48; i++) {
    const cislo = 1000 + i * 7 + (i % 3);
    uzly.push(
      soubor(`IMG_${cislo}.jpg`, FOTKY[i % FOTKY.length], (i * 13) % 60, {
        velikost: 900_000 + ((i * 37_123) % 2_400_000),
      }),
    );
  }
  return uzly;
}

const DUPLIKAT = `Referát — pracovní verze

Tenhle text je ve třech skoro stejných souborech. Který je poslední?
`;

const OMYL_TXT = `Tenhle soubor se jmenuje .jpg, ale je to text.

Přípona není vlastnost obsahu — je to jen konec názvu. Když ji někdo změní,
soubor se nezmění, jen ho přestane otevírat správný program.
`;

/* ─────────────────────── Seznam ─────────────────────── */

export const SCENARE: Scenar[] = [
  {
    id: VYCHOZI_SCENAR,
    nazev: "Výchozí",
    popis: "Uklizený počítač. Pro běžnou hodinu o souborech, nastavení a příkazovém řádku.",
    uprav: (disk) => disk,
  },
  {
    id: "uklid",
    nazev: "Úklid po spolužákovi",
    popis:
      "Plocha zavalená 48 fotkami, prázdné „Nové složky“, tři skoro stejné referáty a soubor s podvrženou příponou. Na třídění, hromadný výběr a řazení podle data.",
    uprav: (disk) => {
      let d = pridej(disk, `${DOMOV}\\Desktop`, [
        ...fotky(),
        slozka("Nová složka", [], 20),
        slozka("Nová složka (2)", [], 18),
        slozka("Nová složka (3)", [], 3),
        // Tři skoro stejné soubory: rozhodnout, který je poslední, jde jen
        // podle data — názvy k tomu neřeknou nic.
        soubor("referat.txt", DUPLIKAT, 14),
        soubor("referat (1).txt", DUPLIKAT, 9),
        soubor("referat - kopie.txt", DUPLIKAT, 2),
        // Textový soubor s příponou obrázku. Ve Fotkách se neotevře, v
        // Poznámkovém bloku ano.
        soubor("Zaloha.jpg", OMYL_TXT, 11),
      ]);
      d = pridej(d, `${DOMOV}\\Downloads`, [
        binarni("setup (1).exe", 12_582_912, 8),
        binarni("setup (2).exe", 12_582_912, 8),
        binarni("nevim_co_to_je.tmp", 402_653, 30),
      ]);
      return d;
    },
  },
  {
    id: "poviru",
    nazev: "Po útoku",
    popis:
      "Škodlivý program už proběhl: soubory mají cizí příponu a na ploše leží výzva k výkupnému. Žák nastupuje do následku, ne do prevence.",
    // Používá se přesně ta funkce, kterou spouští cvičný vir za běhu, takže
    // se dopad nemůže rozejít podle toho, kudy k němu žák přišel.
    uprav: (disk) => zasifruj(disk),
  },
];

export function scenarPodleId(id: string | null | undefined): Scenar {
  return SCENARE.find((s) => s.id === id) ?? SCENARE[0];
}

/** Postaví disk pro daný scénář. Neznámé `id` spadne na výchozí. */
export function diskProScenar(id: string | null | undefined): Slozka {
  return scenarPodleId(id).uprav(vytvorDisk());
}

/**
 * Který scénář si říká adresa. Čte se z `window.location`, ne přes
 * `useSearchParams` — ten by si vyžádal `<Suspense>` kolem celého prostředí
 * a stránka by přestala být staticky vygenerovaná.
 */
export function scenarZAdresy(): string {
  if (typeof window === "undefined") return VYCHOZI_SCENAR;
  try {
    const id = new URL(window.location.href).searchParams.get("scenar");
    return scenarPodleId(id).id;
  } catch {
    return VYCHOZI_SCENAR;
  }
}
