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
      "Otevři okno Finderu: v Docku dole klikni na první ikonu zleva – modrý obličej s bílým profilem. Když na ni najedeš myší, ukáže se nad ní Finder.",
      "V okně Finderu jsou vlevo nahoře tři puntíky: červený, žlutý, zelený.",
      "Najeď na ně myší – teprve tehdy se v nich ukážou značky.",
      "Klikni na červený. Okno zmizí.",
      "Teď se podívej nahoru na lištu úplně u horního okraje obrazovky. Pořád tam stojí Finder.",
      "Podívej se i dolů do Docku pod ikonu Finderu: je pod ní malá tečka. Porovnej to s Terminálem (černá obrazovka se znaky >_) – ten neběží, a tak pod ním tečka není.",
      "Tečka pod ikonou znamená, že program běží. Zavřel jsi okno, ne program.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => stopa(s, "zavrel-okno:finder"),
  },
  {
    id: "poznamky-bez-okna",
    nazev: "Nech TextEdit běžet bez jediného okna",
    popis:
      "Na Finderu to nejde pořádně ukázat, protože ten běží vždycky. Zkus to tedy s programem, který jsi spustil sám.",
    kroky: [
      "V Docku klikni na ikonu TextEditu – bílý list papíru s perem. Když už je okno TextEditu na obrazovce (třeba uvítací Přečti si mě.txt), jen se vytáhne dopředu.",
      "Podívej se nahoru na lištu: vedle jablka stojí TextEdit. Lišta patří programu, který je vpředu.",
      "Napiš do okna pár slov a v horní liště vyber Soubor a v něm Uložit.",
      "Zavři okno červeným puntíkem.",
      "Na obrazovce po TextEditu není ani stopa – a přesto pod jeho ikonou v Docku tečka zůstala, stejná jako pod Finderem.",
      "Program běží dál a drží si tvůj text. Tomu se říká, že aplikace běží bez okna.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => beziBezOkna(s, "poznamky"),
  },
  {
    id: "vynutit-ukonceni",
    nazev: "Podívej se do seznamu běžících programů",
    popis:
      "Na Macu se tomu okénku říká Vynutit ukončení a ukončuje se v něm program, který se zasekl – podobně jako ve Windows ve Správci úloh. (Úplnou obdobou Správce úloh je na Macu Monitor činnosti.) Uvidíš v něm i programy, které nemají žádné okno.",
    kroky: [
      "Vlevo nahoře v liště je jablko. Klikni na něj.",
      "Vyber Vynutit ukončení. (Na skutečném Macu to jde zkratkou Cmd+Option+Esc, tady Ctrl+Alt+Esc.)",
      "V seznamu jsou všechny běžící programy – i ty, po kterých na obrazovce není žádné okno. Porovnej seznam s tím, co vidíš na ploše.",
      "Klikni na Finder. Tlačítko dole se změní na Znovu spustit: Finder na Macu ukončit nejde, systém ho potřebuje pořád. Dá se jen znovu spustit.",
      "Zavři okénko tlačítkem Zrušit.",
    ],
    skupina: "Okno není program",
    hotovo: (s) => stopa(s, "otevrel-vynuceni"),
  },
  {
    id: "ukonci-doopravdy",
    nazev: "Ukonči TextEdit doopravdy",
    popis:
      "Teď, když víš, že zavřít okno nestačí, ukonči program tak, aby zmizel i ze seznamu a tečka pod ikonou zhasla.",
    kroky: [
      "Klikni v Docku na TextEdit, aby lišta nahoře patřila jemu.",
      "V liště klikni na jejich jméno – hned vedle jablka je napsané tučně.",
      "V rozbalené nabídce vyber úplně dole Ukončit TextEdit.",
      "Podívej se do Docku: pod TextEditem už tečka není. Pod Finderem zůstala, ten běží pořád.",
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
      "Spusť z Docku TextEdit a hned potom Terminál. Máš dvě okna.",
      "Klikni do okna TextEditu a přečti si, co je nahoře v liště: jablko, TextEdit, Soubor…",
      "Teď klikni do okna Terminálu. Podívej se nahoru znovu – místo TextEditu tam stojí Terminál a místo Soubor je Shell.",
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
      "Spusť z Docku Terminál (černá obrazovka se znaky >_).",
      "Kurzor v řádku už bliká, rovnou piš.",
      "Napiš pwd a stiskni Enter. Zkratka znamená print working directory.",
      "Vypíše se /Users/zak — tvoje domovská složka.",
      "Žádné C:, žádné zpětné lomítko. Cesta začíná jediným lomítkem – to je kořen celého disku.",
      "Zkus pro zajímavost napsat dir. Terminál odpoví command not found – takový příkaz nezná. Simulace ti pod to napíše, jak se jmenuje jeho macOS obdoba.",
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
      "Podívej se na pruh úplně dole v okně – simulace v něm ukazuje cestu. (Na skutečném Macu si ho musíš zapnout: Zobrazení → Zobrazit pruh s cestou.)",
      "Stojí tam /Volumes/FLASH – tak, jak by cestu vypsal i Terminál. Nikde ani písmeno disku.",
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
      "Ve Windows se soubor schová hlavně zaškrtnutím Skrytý ve vlastnostech. Mac má podobný příznak taky, ale většina skrytých souborů je schovaná jinak: jejich JMÉNO začíná tečkou.",
    kroky: [
      "Otevři okno Finderu a v postranním panelu klikni na zak. To je tvoje domovská složka.",
      "Stiskni Ctrl+Shift+tečka. (Na skutečném Macu Cmd+Shift+tečka. V nabídkách Finderu to zapnout nejde.)",
      "Objevil se soubor .zshrc, který tam předtím nebyl.",
      "Není nijak zvlášť označený ani zamčený. Schovává ho jen tečka na začátku jména.",
      "Skrytý tu tedy neznamená chráněný, jenom „nepleť se do cesty“.",
      "Stiskni zkratku ještě jednou a soubor zase zmizí.",
    ],
    skupina: "Skrytý je tečka na začátku",
    hotovo: (s) => stopa(s, "zapnul-tecky"),
  },
  {
    id: "zaloz-teckovou",
    nazev: "Založ složku, kterou Finder sám neukáže",
    popis:
      "Když skrývá jméno, jde schovat i to, co si vytvoříš sám. Finder ti ale název s tečkou nedovolí – zkus to a pak to udělej v Terminálu.",
    kroky: [
      "V okně Finderu klikni v postranním panelu na Dokumenty, pak pravým tlačítkem do prázdného místa a vyber Nová složka.",
      "Napiš název, který ZAČÍNÁ TEČKOU, třeba .pokus, a stiskni Enter. Finder odmítne – názvy s tečkou jsou vyhrazené pro systém.",
      "Spusť z Docku Terminál, napiš cd Documents a stiskni Enter.",
      "Napiš mkdir .pokus a Enter. Terminál složku založí bez řečí.",
      "Napiš ls a Enter. Složka ve výpisu není. Teď napiš ls -a – a je tam.",
      "Ve Finderu ji uvidíš, jen když zapneš položky s tečkou (Ctrl+Shift+tečka). Složka nikam nezmizela, jen ji Finder neukazuje.",
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
      "Dvakrát klikni na složku Applications. (Česká verze macOS ji ve Finderu ukazuje jako Aplikace, v cestě je ale vždycky /Applications.) Pozor, ikona Aplikace v Docku je něco jiného: programy z ní jen spouštíš, složka s nimi je tady.",
      "Je v ní TextEdit.app, Náhled.app a složka Utilities, ve které je Terminál. Zkus na TextEdit.app dvakrát kliknout – spustí se, jako by to byl jeden soubor.",
      "Klikni na TextEdit.app pravým tlačítkem a vyber Zobrazit obsah balíčku.",
      "Jsi uvnitř. Je tam složka Contents a v ní MacOS se spustitelným souborem a Resources s ikonou.",
      "Proto se hodně programů na Macu instaluje přetažením jedné ikony do Aplikací a odinstaluje přesunutím do koše.",
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
      "Ve Windows se do souboru podíváš tak, že ho otevřeš, nebo si v Průzkumníku zapneš podokno náhledu (Alt+P). Na Macu stačí mezerník – ukáže obsah a nic nespustí.",
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
