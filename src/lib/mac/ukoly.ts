/**
 * Úkolovník macOS.
 *
 * JEDNO PRAVIDLO NAD VŠEMI OSTATNÍMI: každý úkol tu učí něco, co ve Windows
 * NENÍ. Zakládání složek, přejmenování, kopírování a hledání souborů umí žák
 * z virtuálních Windows a opakovat mu to tady by byla ztráta hodiny. Zbylo
 * proto pět věcí, na kterých se Mac od Windows opravdu liší – a všechny jsou
 * takové, že je žák uvidí na obrazovce, ne jen přečte.
 *
 * KLÁVESNICE. Kroky počítají s tím, že žák sedí u windowsové klávesnice, kde
 * ⌘ ani ⌥ nejsou. Píše se proto, na co má kliknout, a zkratka se zmíní jen
 * tam, kde je v prostředí opravdu namapovaná (Ctrl+Alt+Esc a Ctrl+Shift+.).
 *
 * Kontrola se dívá na VÝSLEDEK, ne na cestu k němu: složku s tečkou jde
 * založit ve Finderu a stejně tak by šla v Terminálu, a obojí platí. Splněný
 * úkol zůstává splněný – uklidit po sobě je správný návyk, ne důvod přijít
 * o odškrtnutí.
 */

import type { StavMac } from "./stav";

export interface UkolMac {
  id: string;
  nazev: string;
  /** Doplňující věta pod názvem – co přesně se po žákovi chce a proč. */
  popis: string;
  /** Postup po krocích. Rozbalí se až po kliknutí na úkol. */
  kroky: string[];
  skupina: string;
  hotovo: (stav: StavMac) => boolean;
}

export const SKUPINY_MAC = [
  /* Na prvním místě schválně. Panel otevírá první skupinu sám, takže tohle
     žák uvidí hned – a je to zároveň ta jediná věc, kterou si z celé hodiny
     má odnést, i kdyby na nic dalšího nedošlo. */
  "Okno není program",
  "Nabídka patří programu",
  "Cesta bez písmene disku",
  "Skrytý je tečka na začátku",
  "Aplikace je složka",
  /* Dvě klávesy, které žák mačká ze zvyku a na Macu dělají něco jiného.
     Obě jsou bez ⌘, takže je žák na windowsové klávesnici doopravdy má. */
  "Klávesy dělají něco jiného",
] as const;

const stopa = (stav: StavMac, klic: string) => stav.stopy.includes(klic);

/** Běží aplikace, a přitom po ní na obrazovce není jediné okno? */
const beziBezOkna = (stav: StavMac, app: string) =>
  stav.bezici.includes(app as never) && !stav.okna.some((o) => o.app === app);

export const UKOLY_MAC: UkolMac[] = [
  /* ─────────── Okno není program ─────────── */
  {
    id: "zavri-okno-finderu",
    nazev: "Zavři okno Finderu červeným puntíkem",
    popis:
      "Ve Windows zavřením posledního okna program většinou skončí. Tady ne. Zavři okno a dívej se přitom nahoru na lištu.",
    kroky: [
      "Otevři okno Finderu: v Docku dole klikni na druhou ikonu zleva, hned za mřížkou Launchpadu. Když na ni najedeš myší, ukáže se nad ní Finder.",
      "V okně Finderu jsou vlevo nahoře tři puntíky: červený, žlutý, zelený.",
      "Najeď na ně myší – teprve tehdy se v nich ukážou značky.",
      "Klikni na červený. Okno zmizí.",
      "Teď se podívej nahoru na lištu úplně u horního okraje obrazovky. Pořád tam stojí Finder.",
      "Podívej se i dolů do Docku pod ikonu Finderu. Je pod ní tečka.",
      "Ta tečka znamená, že program běží. Zavřel jsi okno, ne program.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => stopa(s, "zavrel-okno:finder"),
  },
  {
    id: "poznamky-bez-okna",
    nazev: "Nech Poznámky běžet bez jediného okna",
    popis:
      "Na Finderu to nejde pořádně ukázat, protože ten běží vždycky. Zkus to tedy s programem, který jsi spustil sám.",
    kroky: [
      "V Docku klikni na žlutou ikonu Poznámek. Otevře se okno.",
      "Všimni si, že se nahoře v liště změnil název z Finder na Poznámky.",
      "Napiš do okna pár slov a v horní liště vyber Soubor a v něm Uložit.",
      "Zavři okno červeným puntíkem.",
      "Na obrazovce po Poznámkách není ani stopa – a přesto pod jejich ikonou v Docku tečka zůstala.",
      "Program běží dál a drží si tvůj text. Tomu se říká, že aplikace běží bez okna.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => beziBezOkna(s, "poznamky"),
  },
  {
    id: "vynutit-ukonceni",
    nazev: "Podívej se do seznamu běžících programů",
    popis:
      "Na Macu se tomu okénku říká Vynutit ukončení. Je to obdoba Správce úloh, jenom mnohem menší – a je to místo, kde program bez okna uvidíš pojmenovaný.",
    kroky: [
      "Vlevo nahoře v liště je jablko. Klikni na něj.",
      "Vyber Vynutit ukončení. (Na klávesnici, kterou máš, to jde i přes Ctrl+Alt+Esc.)",
      "V seznamu jsou všechny běžící programy. U těch, které nemají okno, stojí vpravo bez okna.",
      "Všimni si, že u Finderu tlačítko nejde zmáčknout. Finder na Macu ukončit nejde – systém ho potřebuje pořád.",
      "Zavři okénko tlačítkem Zrušit.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => stopa(s, "otevrel-vynuceni"),
  },
  {
    id: "ukonci-doopravdy",
    nazev: "Ukonči Poznámky doopravdy",
    popis:
      "Teď, když víš, že zavřít okno nestačí, ukonči program tak, aby zmizel i ze seznamu a tečka pod ikonou zhasla.",
    kroky: [
      "Klikni v Docku na Poznámky, aby patřily lišta nahoře jim.",
      "V liště klikni na jejich jméno – hned vedle jablka je napsané tučně.",
      "V rozbalené nabídce vyber úplně dole Ukončit Poznámky.",
      "Podívej se do Docku: tečka pod ikonou zhasla.",
      "Nahoře v liště je zase Finder, protože ten běží vždycky.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => stopa(s, "ukoncil:poznamky"),
  },
  {
    id: "zluty-puntik",
    nazev: "Zjisti, čím se liší žlutý puntík od červeného",
    popis:
      "Oba okno z obrazovky odklidí, ale každý jinak. Rozdíl uvidíš v Docku – zkus si oba a porovnej je.",
    kroky: [
      "Otevři si nějaké okno, třeba Finder z Docku.",
      "Klikni na ŽLUTÝ puntík. Okno zmizí.",
      "Podívej se do Docku: vpravo za svislou čárkou přibyla nová malá ikona. To je tvoje okno.",
      "Klikni na ni. Okno se vrátí přesně takové, jaké bylo.",
      "Teď totéž s ČERVENÝM puntíkem. Okno zmizí taky – ale v Docku se nic nového neobjeví.",
      "Rozdíl: žlutý okno schová, červený ho zruší. Program běží v obou případech.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => s.stopy.some((k) => k.startsWith("vratil-z-docku:")),
  },

  /* ─────────── Nabídka patří programu ─────────── */
  {
    id: "lista-se-meni",
    nazev: "Přepínej mezi dvěma programy a dívej se nahoru",
    popis:
      "Ve Windows má nabídky každé okno svoje, uvnitř sebe. Na Macu je nabídka jedna jediná, úplně nahoře, a patří tomu programu, který je zrovna vpředu.",
    kroky: [
      "Spusť z Docku Poznámky a hned potom Terminál. Máš dvě okna.",
      "Klikni do okna Poznámek a přečti si, co je nahoře v liště: jablko, Poznámky, Soubor, Okno.",
      "Teď klikni do okna Terminálu. Podívej se nahoru znovu – místo Poznámky tam přibyl Terminál a místo Soubor je Shell.",
      "Lišta se nepřestěhovala. Vyměnil se její obsah, protože se vyměnil program vpředu.",
      "Ve Windows bys tohle hledal uvnitř každého okna zvlášť. Na Macu je jedno místo pro všechno.",
    ],
    skupina: "Nabídka patří programu",
    hotovo: (s) => stopa(s, "spustil:poznamky") && stopa(s, "spustil:terminal"),
  },

  /* ─────────── Cesta bez písmene disku ─────────── */
  {
    id: "terminal-pwd",
    nazev: "Zjisti, ve které složce právě jsi",
    popis:
      "Ve Windows každá cesta začíná písmenem disku, třeba C:\\. Na Macu žádná písmena nejsou. Podívej se, jak cesta vypadá tady.",
    kroky: [
      "Spusť z Docku Terminál (černá ikona).",
      "Kurzor v řádku už bliká, rovnou piš.",
      "Napiš pwd a stiskni Enter. Zkratka znamená print working directory.",
      "Vypíše se /Users/zak — tvoje domovská složka.",
      "Žádné C:, žádné zpětné lomítko. Cesta začíná jediným lomítkem – to je kořen celého disku.",
      "Zkus pro zajímavost napsat dir. Ten příkaz tu není a terminál ti rovnou napíše, jak se jmenuje jeho macOS obdoba.",
    ],
    skupina: "Cesta bez písmene disku",
    hotovo: (s) => stopa(s, "terminal:pwd"),
  },
  {
    id: "najdi-flash",
    nazev: "Najdi připojený flash disk",
    popis:
      "Ve Windows dostane flash disk písmeno, třeba D:. Tady žádné písmeno nedostane – musí se někam pověsit do téhož stromu. Zjisti kam.",
    kroky: [
      "Otevři okno Finderu (ikona v Docku vlevo).",
      "V postranním panelu dole, pod nadpisem Umístění, je FLASH. Klikni na něj.",
      "Podívej se na pruh úplně dole v okně – tam je napsaná cesta.",
      "Stojí tam /Volumes/FLASH — a nikde ani písmeno disku.",
      "Volumes znamená svazky. Každý připojený disk se objeví jako složka v ní.",
      "Proto na Macu nikdy neuslyšíš otázku „jaké má písmeno“. Písmena disků jsou vynález Windows.",
    ],
    skupina: "Cesta bez písmene disku",
    hotovo: (s) => stopa(s, "nasel-flash"),
  },
  {
    id: "terminal-open",
    nazev: "Otevři složku z Terminálu ve Finderu",
    popis:
      "Terminál a Finder se dívají na týž disk. Příkaz open je most mezi nimi – napíšeš cestu a otevře se okno.",
    kroky: [
      "V Terminálu napiš cd /Volumes/FLASH a stiskni Enter.",
      "Všimni si, že se změnil text před kurzorem i název okna nahoře – ukazují, kde jsi.",
      "Napiš ls a Enter. Vypíše se, co na disku je.",
      "Teď napiš open . a stiskni Enter. Ta tečka znamená „tady, kde zrovna jsem“.",
      "Otevře se okno Finderu přesně v té složce.",
      "Jsou to dva pohledy na totéž. Co uděláš v jednom, uvidíš ve druhém.",
    ],
    skupina: "Cesta bez písmene disku",
    hotovo: (s) => stopa(s, "terminal:open"),
  },

  /* ─────────── Skrytý je tečka na začátku ─────────── */
  {
    id: "zapni-tecky",
    nazev: "Ukaž si položky, které mají na začátku tečku",
    popis:
      "Ve Windows je skrytý soubor ten, který má zapnutý příznak skrytý – ten se dá odkliknout ve vlastnostech. Na Macu nic takového není. Rozhoduje JMÉNO.",
    kroky: [
      "Nahoře v liště klikni na Zobrazení a vyber Zobrazit položky s tečkou. (Jde to i zkratkou Ctrl+Shift+tečka.)",
      "V postranním panelu klikni na zak. To je tvoje domovská složka.",
      "Objevil se soubor .zshrc, který tam předtím nebyl.",
      "Klikni na něj pravým tlačítkem a vyber Informace. U Druhu je napsané, proč se běžně neukazuje.",
      "Není na něm zapnutý žádný příznak. Prostě se jmenuje tečkou.",
      "Skrytý tu tedy neznamená chráněný, jenom „nepleť se do cesty“.",
    ],
    skupina: "Skrytý je tečka na začátku",
    hotovo: (s) => stopa(s, "zapnul-tecky"),
  },
  {
    id: "zaloz-teckovou",
    nazev: "Založ složku, kterou Finder sám neukáže",
    popis:
      "Když je skrytost jenom jméno, musí jít schovat cokoli – i to, co si sám vytvoříš. Vyzkoušej to.",
    kroky: [
      "V okně Finderu klikni v postranním panelu na Dokumenty.",
      "Klikni pravým tlačítkem do prázdného místa pod seznamem souborů.",
      "Vyber Nová složka. Objeví se s rozsvíceným názvem, který jde hned přepsat.",
      "Napiš název, který ZAČÍNÁ TEČKOU, třeba .pokus, a stiskni Enter.",
      "Dokud máš zapnuté zobrazení položek s tečkou, složku vidíš.",
      "V nabídce Zobrazení to zase vypni. Složka zmizela – a přitom nikam nezmizela, jen ji Finder neukazuje.",
      "Zapni to zpátky a složka je zase vidět.",
    ],
    skupina: "Skrytý je tečka na začátku",
    hotovo: (s) => stopa(s, "zalozil-teckovou"),
  },

  /* ─────────── Aplikace je složka ─────────── */
  {
    id: "obsah-balicku",
    nazev: "Dostaň se dovnitř aplikace",
    popis:
      "Ve Windows je program soubor .exe a vedle něj celá složka s knihovnami. Na Macu je program jedna ikona – a ta ikona je ve skutečnosti složka, která v sobě nese všechno.",
    kroky: [
      "V okně Finderu klikni v postranním panelu na Macintosh HD.",
      "Dvakrát klikni na složku Applications.",
      "Je v ní Finder.app, Terminál.app a další. Zkus na Terminál.app dvakrát kliknout – spustí se, jako by to byl jeden soubor.",
      "Klikni na Finder.app pravým tlačítkem a vyber Informace. U Druhu stojí, že je to balíček aplikace.",
      "Zavři Informace a klikni na Finder.app pravým tlačítkem znovu. Tentokrát vyber Zobrazit obsah balíčku.",
      "Jsi uvnitř. Je tam složka Contents a v ní MacOS se spustitelným souborem a Resources s ikonou.",
      "Přesně proto se program na Macu instaluje přetažením jedné ikony a odinstaluje přesunutím do koše.",
    ],
    skupina: "Aplikace je složka",
    hotovo: (s) => stopa(s, "balicek:otevrel"),
  },

  /* ─────────── Klávesy dělají něco jiného ─────────── */
  {
    id: "enter-prejmenuje",
    nazev: "Stiskni Enter a sleduj, co se stane",
    popis:
      "Ve Windows Enter vybraný soubor otevře. Na Macu ho přejmenuje – a přesně na tohle po přechodu narazí skoro každý.",
    kroky: [
      "Otevři okno Finderu a v postranním panelu klikni na Plocha.",
      "Klikni jednou na soubor Přečti si mě.txt, ať je vybraný – jméno zmodrá.",
      "Stiskni Enter. Ve Windows by se teď soubor otevřel.",
      "Tady se jméno změnilo v pole, do kterého se dá psát. Enter na Macu přejmenovává.",
      "Stiskni Escape, ať jméno zůstane, jak bylo. Otevírá se tu dvojklikem.",
    ],
    skupina: "Klávesy dělají něco jiného",
    hotovo: (s) => stopa(s, "prejmenoval-enterem"),
  },
  {
    id: "mezernik-nahled",
    nazev: "Podívej se do souboru, aniž bys ho otevřel",
    popis:
      "Ve Windows se do souboru podíváš jedině tak, že ho otevřeš v nějakém programu. Na Macu stačí mezerník – ukáže obsah a nic nespustí.",
    kroky: [
      "V postranním panelu Finderu klikni na Plocha.",
      "Klikni jednou na soubor Přečti si mě.txt, ať je vybraný.",
      "Stiskni mezerník. Vyskočí okénko s obsahem souboru – tomu se říká Rychlý náhled.",
      "Podívej se nahoru na lištu: pořád tam stojí Finder. Žádný program se nespustil.",
      "Stiskni mezerník ještě jednou a náhled zase zmizí.",
    ],
    skupina: "Klávesy dělají něco jiného",
    hotovo: (s) => stopa(s, "nahled-mezernikem"),
  },
];

/** Které úkoly jsou právě splněné. Volá se po každé změně stavu. */
export function vyhodnotMac(stav: StavMac): string[] {
  return UKOLY_MAC.filter((u) => u.hotovo(stav)).map((u) => u.id);
}

export function postupMac(splneno: string[]): {
  hotovo: number;
  celkem: number;
} {
  const platne = new Set(UKOLY_MAC.map((u) => u.id));
  return {
    hotovo: splneno.filter((id) => platne.has(id)).length,
    celkem: UKOLY_MAC.length,
  };
}
