/**
 * Komprimované složky (.zip).
 *
 * Uvnitř archivu je JSON s celým podstromem – jako kontejner je to atrapa.
 * VELIKOST ale atrapa NENÍ: soubory, které mají skutečné bajty, se opravdu
 * proženou deflatem (`fflate`), takže hlášené číslo je změřené, ne odhadnuté.
 *
 * Dřív se všechno počítalo z tabulky poměrů, a to dělalo z úlohy „Co se
 * zabalením zmenší víc" pokus s předepsaným výsledkem: žák dostal odpověď,
 * kterou mu někdo napsal dopředu, a doma na vlastním textu mu vyšlo něco
 * jiného. Teď se text měří doopravdy, včetně toho, který si žák sám napíše –
 * a to je přesně ta půlka pokusu, se kterou může hýbat.
 *
 * Co změřit NEJDE: soubory, které v simulaci existují jen jako číslo
 * (`Fotka z výletu.jpg` je uzel s `velikost: 2458112` a prázdným obsahem).
 * Ty žádné bajty nemají, takže u nich zůstává odhad z tabulky níž. Lekce
 * „text se zmenší, fotka ne" tím ale nepřichází o nic: text spadne měřením
 * a fotka se nehne odhadem.
 */

import { deflateSync, strToU8 } from "fflate";

import { velikost, type Soubor, type Uzel } from "./fs";

const HLAVICKA = "PK-VYUKA-ZIP-1";

interface Balik {
  hlavicka: string;
  polozky: Uzel[];
}

/**
 * ZÁLOŽNÍ odhad pro soubory, které existují jen jako velikost a nemají obsah.
 * Co obsah má, se měří doopravdy (viz `zmerDeflate`) a sem vůbec nedojde.
 *
 * Textové přípony tu zůstávají schválně, i když k nim dnes cesta nevede:
 * kdyby někdy vznikl textový soubor jako pouhý placeholder, ať dostane
 * rozumné číslo, a ne obecných sedmdesát procent.
 *
 * Pořád platí, proč se to vůbec liší podle typu: JPEG, PNG, MP3, MP4 i .docx
 * jsou uvnitř samy zabalené, takže ZIP na nich neušetří skoro nic — a je to
 * jedna z věcí, které žáky spolehlivě překvapí.
 */
const POMER: Record<string, number> = {
  // text – deflate se v praxi dostane zhruba na dvě pětiny
  txt: 0.4,
  csv: 0.38,
  html: 0.36,
  htm: 0.36,
  ini: 0.45,
  log: 0.35,
  json: 0.3,
  md: 0.4,
  // formáty, které už komprimované jsou – ZIP z nich nic nedostane
  jpg: 0.98,
  jpeg: 0.98,
  png: 0.97,
  gif: 0.98,
  webp: 0.99,
  mp3: 0.98,
  mp4: 0.99,
  zip: 1,
  docx: 0.97,
  xlsx: 0.97,
  pptx: 0.98,
  pdf: 0.92,
};

/** Nezná-li se přípona, počítá se něco mezi. */
const POMER_VYCHOZI = 0.7;

const pomerSouboru = (jmeno: string): number => {
  const tecka = jmeno.lastIndexOf(".");
  const pripona = tecka === -1 ? "" : jmeno.slice(tecka + 1).toLowerCase();
  return POMER[pripona] ?? POMER_VYCHOZI;
};

/**
 * Skutečná velikost po deflate, nebo `null`, když soubor nemá co komprimovat.
 *
 * `null` se vrací i při jakékoli chybě: špatně tvarovaná `data:` adresa nesmí
 * shodit zabalení, jen se u ní spadne zpátky na odhad.
 */
function zmerDeflate(u: Soubor): number | null {
  // Placeholder: v simulaci má jen číslo, ne bajty. Není co měřit.
  if (typeof u.velikost === "number") return null;
  try {
    if (u.obsah.startsWith("data:")) {
      // Obrázek vložený v adrese. Měří se AŽ ROZKÓDOVANÉ bajty – deflate nad
      // base64 by měřil to kódování, ne obrázek, a vyšel by nesmysl (base64
      // se stlačí skoro o čtvrtinu, samotný JPEG uvnitř skoro vůbec).
      const zaCarkou = u.obsah.slice(u.obsah.indexOf(",") + 1);
      const binarni = atob(zaCarkou);
      const bajty = new Uint8Array(binarni.length);
      for (let i = 0; i < binarni.length; i++) bajty[i] = binarni.charCodeAt(i);
      return deflateSync(bajty).length;
    }
    return deflateSync(strToU8(u.obsah)).length;
  } catch {
    return null;
  }
}

/** Velikost jednoho uzlu po zabalení – změřená, kde to jde, jinak odhadnutá. */
function zabalenyUzel(u: Uzel): number {
  if (u.druh === "slozka") return u.deti.reduce((s, d) => s + zabalenyUzel(d), 0);
  return zmerDeflate(u) ?? Math.round(velikost(u) * pomerSouboru(u.jmeno));
}

/** Kolik položek archiv ponese – každá si v něm nese kus hlavičky. */
function pocetZaznamu(uzly: Uzel[]): number {
  return uzly.reduce((s, u) => s + 1 + (u.druh === "slozka" ? pocetZaznamu(u.deti) : 0), 0);
}

/** Velikost archivu. */
export function komprimovanaVelikost(uzly: Uzel[]): number {
  const obsah = uzly.reduce((s, u) => s + zabalenyUzel(u), 0);
  // 22 bajtů je hlavička prázdného archivu – i prázdný ZIP něco váží. Ke
  // každé položce se přičítá režie jejího záznamu, včetně vnořených.
  return Math.max(22, obsah + 30 * pocetZaznamu(uzly));
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
