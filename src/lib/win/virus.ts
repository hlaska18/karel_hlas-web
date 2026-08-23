/**
 * Simulovaný škodlivý program pro hodinu o bezpečnosti.
 *
 * NIC SE NESPOUŠTÍ. „Vir" je naskriptovaná změna stavu simulace – přejmenuje
 * několik připravených souborů a položí na plochu výzvu k výkupnému. Žádný
 * skutečný soubor se nedotkne, nic se nikam neodesílá a vypnutím prostředí
 * se všechno vrátí. Cílem je naučit rozpoznat návnadu a zareagovat na
 * následek, ne cokoli vyrábět.
 *
 * Výukový oblouk:
 *   1. návnada má dvojitou příponu a při výchozím nastavení Windows vypadá
 *      jako obrázek – pravda je vidět až po zapnutí přípon,
 *   2. spuštění se ptá dialogem s neznámým vydavatelem,
 *   3. následek je vidět: soubory mají jinou příponu a nejdou otevřít,
 *   4. ve Správci úloh běží proces, který jde ukončit,
 *   5. kdo si předtím udělal zálohu do ZIPu, vrátí si soubory.
 *
 * Zasažené jsou schválně JEN soubory, které na disku byly od začátku. Co si
 * žák za hodinu vytvořil, zůstane – lekce o záloze platí i tak a nikdo
 * nepřijde o půlhodinu práce.
 */

import { jeSlozka, najdiSlozku, prejmenuj, rozloz, sloz, vloz } from "./fs";
import type { Slozka } from "./fs";

/** Přípona, kterou „vir" připíše zasaženým souborům. */
export const PRIPONA_ZASIFROVANO = "zasifrovano";

/** Název návnady. Dvojitá přípona je celý vtip. */
export const NAVNADA = "Fotky_z_vyletu.jpg.exe";

/** Jméno procesu ve Správci úloh. Překlep proti skutečnému `svchost.exe` je záměr. */
export const PROCES = "svhost.exe";

/** Soubor s výzvou k výkupnému, který se objeví na ploše. */
export const VYZVA = "!!! PRECTI SI ME !!!.txt";

const DOMOV = "C:\\Users\\Zak";

/**
 * Soubory, které „vir" zasáhne. Jsou to položky ze seedu – schválně žádná
 * složka a schválně ne `.pokyn.txt`, o který se opírá úloha se skrytými
 * položkami.
 */
const ZASAZENE: string[] = [
  `${DOMOV}\\Documents\\Historie počítačů.txt`,
  `${DOMOV}\\Documents\\Seznam žáků.csv`,
  `${DOMOV}\\Documents\\Rozvrh.docx`,
  `${DOMOV}\\Documents\\Škola\\Matematika\\Vzorce.txt`,
  `${DOMOV}\\Desktop\\Poznámky.txt`,
  `${DOMOV}\\Desktop\\Fotka z výletu.jpg`,
];

export const VYZVA_TEXT = `TVOJE SOUBORY MAJÍ JINOU PŘÍPONU

Tohle je cvičný škodlivý program z výukového prostředí. Nic skutečného se
nestalo — běží to jen v prohlížeči a vypnutím se všechno vrátí.

CO SE PRÁVĚ STALO
Spustil jsi soubor, který vypadal jako fotka. Ve skutečnosti měl příponu
.exe, tedy program. Ten program udělal to, co smíš ty: sáhl na tvoje
soubory. Nepotřeboval k tomu žádné zvláštní oprávnění.

CO SI Z TOHO ODNÉST
1. Přípona říká, co soubor JE. Když je schovaná, nevidíš to.
   Zapni si zobrazení přípon a podívej se na název ještě jednou.
2. Program umí všechno, co umíš ty. Antivirus není záruka.
3. Záloha je jediná věc, která tohle vrátí zpátky.

CO TEĎ
- Ve Správci úloh (Ctrl+Shift+Esc) najdi proces ${PROCES} a ukonči ho.
  Všimni si, jak se jmenuje — skutečný systémový proces je svchost.exe.
- Pokud sis Dokumenty zazálohoval do archivu ZIP, rozbal ho a soubory máš.
- Pokud ne, tak sis to zapamatoval líp než z jakéhokoli výkladu.

OTÁZKA DO SEŠITU
V kterém okamžiku se to dalo zastavit? Vypiš všechna místa, kde jsi mohl
poznat, že něco nehraje.
`;

/** Pozná návnadu podle dvojité přípony `.jpg.exe`, `.pdf.exe` a podobně. */
export function jeNavnada(jmeno: string): boolean {
  return /\.(jpg|jpeg|png|pdf|docx?|xlsx?)\.exe$/i.test(jmeno);
}

/**
 * Přejmenuje zasažené soubory a položí na plochu výzvu.
 * Vrací nový disk; když nic k zasažení nezbylo, vrátí ten původní beze změny.
 */
export function zasifruj(disk: Slozka): Slozka {
  let vysledek = disk;

  for (const zapis of ZASAZENE) {
    const casti = rozloz(zapis);
    const jmeno = casti[casti.length - 1];
    const rodic = najdiSlozku(vysledek, casti.slice(0, -1));
    if (!rodic) continue;
    const uzel = rodic.deti.find((d) => d.jmeno === jmeno);
    if (!uzel || jeSlozka(uzel)) continue;

    const novy = prejmenuj(vysledek, casti, `${jmeno}.${PRIPONA_ZASIFROVANO}`);
    if (novy) vysledek = novy;
  }

  const plocha = rozloz(`${DOMOV}\\Desktop`);
  const uz = najdiSlozku(vysledek, plocha)?.deti.some((d) => d.jmeno === VYZVA);
  if (!uz) {
    vysledek = vloz(vysledek, plocha, {
      druh: "soubor",
      jmeno: VYZVA,
      obsah: VYZVA_TEXT,
      zmeneno: Date.now(),
    });
  }

  return vysledek;
}

/** Kolik zasažených souborů na disku ještě je – pro kontrolu úkolů. */
export function pocetZasazenych(disk: Slozka): number {
  return ZASAZENE.filter((zapis) => {
    const casti = rozloz(`${zapis}.${PRIPONA_ZASIFROVANO}`);
    const rodic = najdiSlozku(disk, casti.slice(0, -1));
    return Boolean(rodic?.deti.some((d) => d.jmeno === casti[casti.length - 1]));
  }).length;
}

/** Cesty, které vir zasahuje – ať se v testech nemusí opisovat. */
export const zasazeneCesty = (): string[] => [...ZASAZENE];

/** Kde má návnada ležet po stažení. */
export const CESTA_NAVNADY = sloz(rozloz(`${DOMOV}\\Downloads\\${NAVNADA}`));
