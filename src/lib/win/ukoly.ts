/**
 * Úkolovník.
 *
 * Prostředí zůstává volné – úkoly nic nezakazují a nikam nenutí. Panel jen
 * ukazuje, co už žák dokázal, a odškrtne se sám ve chvíli, kdy je to na
 * počítači vidět. Kontrola se proto dívá na výsledek (soubor existuje,
 * nastavení je přehozené), ne na cestu, kterou se k němu žák dostal:
 * složku jde založit v Průzkumníku i příkazem `md` a obojí platí.
 *
 * Splněný úkol zůstává splněný. Kdyby se odškrtnutí rušilo pokaždé, když žák
 * pokus uklidí, byl by panel k ničemu – smazat po sobě je správný návyk.
 */

import { existuje, rozloz } from "./fs";
import type { Stav } from "./stav";

export interface Ukol {
  id: string;
  nazev: string;
  /** Doplňující věta pod názvem – co přesně se po žákovi chce. */
  popis: string;
  skupina: string;
  hotovo: (stav: Stav) => boolean;
}

export const SKUPINY = [
  "Soubory a složky",
  "Zobrazení a vlastnosti",
  "Nastavení systému",
  "Příkazový řádek",
  "Aplikace",
] as const;

const cesta = (zapis: string) => rozloz(zapis);

const je = (stav: Stav, zapis: string) => existuje(stav.disk, cesta(zapis));

const stopa = (stav: Stav, klic: string) => stav.stopy.includes(klic);

const DOMOV = "C:\\Users\\Zak";

export const UKOLY: Ukol[] = [
  /* ─────────── Soubory a složky ─────────── */
  {
    id: "slozka-informatika",
    skupina: "Soubory a složky",
    nazev: "Založ složku Informatika",
    popis: "V Dokumentech je složka Škola. Vytvoř v ní další složku s názvem Informatika.",
    hotovo: (s) => je(s, `${DOMOV}\\Documents\\Škola\\Informatika`),
  },
  {
    id: "presun-referat",
    skupina: "Soubory a složky",
    nazev: "Přesuň soubor do správné složky",
    popis:
      "Soubor Historie počítačů.txt leží volně v Dokumentech. Přesuň ho do Dokumenty\\Škola\\Informatika.",
    hotovo: (s) =>
      je(s, `${DOMOV}\\Documents\\Škola\\Informatika\\Historie počítačů.txt`) &&
      !je(s, `${DOMOV}\\Documents\\Historie počítačů.txt`),
  },
  {
    id: "novy-soubor",
    skupina: "Soubory a složky",
    nazev: "Vytvoř na Ploše textový soubor",
    popis:
      "Klikni pravým tlačítkem na plochu, Nový → Textový dokument, a pojmenuj ho Pokus.txt.",
    hotovo: (s) => je(s, `${DOMOV}\\Desktop\\Pokus.txt`),
  },
  {
    id: "kopie-slozky",
    skupina: "Soubory a složky",
    nazev: "Zkopíruj složku, neposouvej ji",
    popis: "Zkopíruj složku Škola na Plochu. V Dokumentech přitom musí zůstat i originál.",
    hotovo: (s) => je(s, `${DOMOV}\\Desktop\\Škola`) && je(s, `${DOMOV}\\Documents\\Škola`),
  },
  {
    id: "archiv",
    skupina: "Soubory a složky",
    nazev: "Zabal soubory do archivu ZIP",
    popis:
      "Označ dva soubory, pravým tlačítkem Komprimovat do souboru ZIP. Porovnej velikost archivu s originály.",
    hotovo: (s) => stopa(s, "zip:vytvoren"),
  },
  {
    id: "kos",
    skupina: "Soubory a složky",
    nazev: "Vrať soubor z Koše",
    popis:
      "Něco smaž, otevři Koš a položku obnov. Smazaný soubor nezmizí hned – to je záchranná brzda.",
    hotovo: (s) => stopa(s, "kos:obnoveno"),
  },
  {
    id: "hledani",
    skupina: "Soubory a složky",
    nazev: "Najdi soubor vyhledáváním",
    popis: "Použij vyhledávací pole vpravo nahoře v Průzkumníku a najdi soubor podle názvu.",
    hotovo: (s) => stopa(s, "pruzkumnik:hledano"),
  },

  /* ─────────── Zobrazení a vlastnosti ─────────── */
  {
    id: "pripony",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Zapni zobrazení přípon",
    popis:
      "Zobrazit → Zobrazit → Přípony názvů souborů. Bez nich nepoznáš, co soubor doopravdy je.",
    hotovo: (s) => s.nastaveni.pripony,
  },
  {
    id: "skryte",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Ukaž skryté položky",
    popis: "Ve stejné nabídce zapni Skryté položky a podívej se, co se objeví.",
    hotovo: (s) => s.nastaveni.skrytePolozky,
  },
  {
    id: "vlastnosti",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Zjisti velikost souboru v bajtech",
    popis:
      "Pravým tlačítkem na Poznámky.txt → Vlastnosti. Kolik má bajtů a kolik kilobajtů?",
    hotovo: (s) => stopa(s, "vlastnosti:Poznámky.txt"),
  },
  {
    id: "neotevre",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Najdi soubor, který nejde otevřít",
    popis:
      "Zkus otevřít Rozvrh.docx. Přečti si, co Windows hlásí, a zamysli se proč.",
    hotovo: (s) => stopa(s, "neotevreno:docx"),
  },

  /* ─────────── Nastavení systému ─────────── */
  {
    id: "tmavy",
    skupina: "Nastavení systému",
    nazev: "Přepni na tmavý režim",
    popis: "Nastavení → Přizpůsobení → Barvy → Zvolte režim.",
    hotovo: (s) => s.nastaveni.motiv === "tmavy",
  },
  {
    id: "tapeta",
    skupina: "Nastavení systému",
    nazev: "Změň tapetu plochy",
    popis: "Nastavení → Přizpůsobení → Pozadí. Nebo pravým tlačítkem na plochu → Přizpůsobit.",
    hotovo: (s) => s.nastaveni.tapeta !== "zavoj",
  },
  {
    id: "akcent",
    skupina: "Nastavení systému",
    nazev: "Změň zvýrazňovací barvu",
    popis: "Nastavení → Přizpůsobení → Barvy → Zvýrazňovací barva.",
    hotovo: (s) => s.nastaveni.akcent !== "modra",
  },
  {
    id: "panel",
    skupina: "Nastavení systému",
    nazev: "Zarovnej hlavní panel doleva",
    popis:
      "Nastavení → Přizpůsobení → Hlavní panel → Chování hlavního panelu. Tak vypadal panel do Windows 10.",
    hotovo: (s) => s.nastaveni.zarovnaniPanelu === "vlevo",
  },
  {
    id: "update",
    skupina: "Nastavení systému",
    nazev: "Zkontroluj aktualizace",
    popis: "Nastavení → Windows Update → Vyhledat aktualizace a nainstaluj je.",
    hotovo: (s) => s.nastaveni.aktualizace,
  },
  {
    id: "o-systemu",
    skupina: "Nastavení systému",
    nazev: "Zjisti parametry počítače",
    popis:
      "Nastavení → Systém → Informace. Kolik má počítač paměti RAM a jaký má procesor?",
    hotovo: (s) => stopa(s, "nastaveni:o-systemu"),
  },

  /* ─────────── Příkazový řádek ─────────── */
  {
    id: "cmd-dir",
    skupina: "Příkazový řádek",
    nazev: "Vypiš obsah složky příkazem",
    popis: "Otevři Terminál a napiš dir. Porovnej výpis s tím, co ukazuje Průzkumník.",
    hotovo: (s) => stopa(s, "prikaz:dir"),
  },
  {
    id: "cmd-cd",
    skupina: "Příkazový řádek",
    nazev: "Přejdi do jiné složky",
    popis:
      "Použij cd Documents a pak cd .. zpět. Všimni si, že složka se jmenuje Documents, i když Průzkumník píše Dokumenty.",
    hotovo: (s) => stopa(s, "prikaz:cd"),
  },
  {
    id: "cmd-md",
    skupina: "Příkazový řádek",
    nazev: "Založ složku příkazem",
    popis: "md Test vytvoří složku. Zkontroluj v Průzkumníku, že tam opravdu je.",
    hotovo: (s) => stopa(s, "prikaz:md"),
  },
  {
    id: "cmd-ipconfig",
    skupina: "Příkazový řádek",
    nazev: "Zjisti IP adresu počítače",
    popis: "Příkaz ipconfig vypíše nastavení sítě. Najdi řádek IPv4.",
    hotovo: (s) => stopa(s, "prikaz:ipconfig"),
  },
  {
    id: "powershell",
    skupina: "Příkazový řádek",
    nazev: "Vyzkoušej PowerShell",
    popis:
      "V Terminálu otevři novou kartu s PowerShellem a napiš Get-ChildItem. Dělá totéž co dir, jinými slovy.",
    hotovo: (s) => stopa(s, "prikaz:get-childitem"),
  },

  /* ─────────── Aplikace ─────────── */
  {
    id: "poznamky",
    skupina: "Aplikace",
    nazev: "Ulož text z Poznámkového bloku",
    popis: "Napiš pár vět a ulož je přes Soubor → Uložit jako do složky Dokumenty.",
    hotovo: (s) => stopa(s, "poznamkovy-blok:ulozeno"),
  },
  {
    id: "malovani",
    skupina: "Aplikace",
    nazev: "Nakresli a ulož obrázek",
    popis: "V Malování něco nakresli a ulož to do složky Obrázky jako PNG.",
    // Jen podle stopy: v Obrázcích jsou obrázky PNG už od začátku, takže
    // pouhá jejich přítomnost nic nedokazuje.
    hotovo: (s) => stopa(s, "malovani:ulozeno"),
  },
  {
    id: "kalkulacka",
    skupina: "Aplikace",
    nazev: "Převeď číslo do dvojkové soustavy",
    popis:
      "Kalkulačka → nabídka vlevo nahoře → Programátorská. Zadej číslo a přečti řádek BIN.",
    hotovo: (s) => stopa(s, "kalkulacka:programatorsky"),
  },
  {
    id: "spravce",
    skupina: "Aplikace",
    nazev: "Podívej se do Správce úloh",
    popis:
      "Ctrl+Shift+Esc nebo pravým tlačítkem na hlavní panel. Kolik procent procesoru se používá?",
    hotovo: (s) => s.stopy.includes("spustil:spravce-uloh"),
  },
];

/** Ids úkolů, které jsou podle aktuálního stavu splněné. */
export function vyhodnot(stav: Stav): string[] {
  return UKOLY.filter((u) => {
    try {
      return u.hotovo(stav);
    } catch {
      // Rozbitá kontrola nesmí shodit celý panel.
      return false;
    }
  }).map((u) => u.id);
}

/** Kolik úkolů je hotovo z kolika. */
export function postup(splneno: string[]): { hotovo: number; celkem: number } {
  return {
    hotovo: UKOLY.filter((u) => splneno.includes(u.id)).length,
    celkem: UKOLY.length,
  };
}
