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

import { existuje, jeSlozka, jeSoubor, najdiSlozku, najdiSoubor, rozloz } from "./fs";
import type { Uzel } from "./fs";
import { PRIPONA_ZASIFROVANO, VYZVA } from "./virus";
import type { Stav } from "./stav";

export interface Ukol {
  id: string;
  nazev: string;
  /** Doplňující věta pod názvem – co přesně se po žákovi chce. */
  popis: string;
  /**
   * Postup po krocích. Rozbalí se až po kliknutí na úkol, takže panel
   * zůstává přehledný a návod je po ruce jen tomu, kdo ho chce.
   *
   * U „Delších úloh" kroky schválně vedou METODOU, ne k výsledku: řeknou,
   * kde se velikost souboru zjistí a čím se dělí, ale číslo neprozradí.
   * Jinak by z úlohy, která má donutit přemýšlet, byl další návod
   * k proklikání.
   */
  kroky: string[];
  skupina: string;
  hotovo: (stav: Stav) => boolean;
}

export const SKUPINY = [
  /* Na prvním místě schválně. Panel otevírá první skupinu sám, takže tohle
     je to, co žák uvidí hned – a je to zároveň to jediné, co mu v tu chvíli
     brání v práci. */
  "Když něco nejde zavřít",
  "Soubory a složky",
  "Zobrazení a vlastnosti",
  "Nastavení systému",
  "Příkazový řádek",
  "Aplikace",
  "Delší úlohy",
] as const;

const cesta = (zapis: string) => rozloz(zapis);

const je = (stav: Stav, zapis: string) => existuje(stav.disk, cesta(zapis));

const stopa = (stav: Stav, klic: string) => stav.stopy.includes(klic);

const DOMOV = "C:\\Users\\Zak";

/** Je někde v Dokumentech složka s tímhle názvem? Porovnává bez ohledu na velikost písmen. */
const slozkaSNazvem = (stav: Stav, nazev: string): boolean => {
  const dok = najdiSlozku(stav.disk, rozloz(`${DOMOV}\\Documents`));
  return Boolean(
    dok?.deti.some(
      (d) => d.druh === "slozka" && d.jmeno.trim().toLowerCase() === nazev.toLowerCase(),
    ),
  );
};

/** Obsah souboru, nebo prázdný řetězec. */
const obsah = (stav: Stav, zapis: string): string =>
  najdiSoubor(stav.disk, rozloz(zapis))?.obsah ?? "";

/** Kolik souborů v celém stromu má daný název (bez ohledu na velikost písmen). */
const kolikSouboru = (stav: Stav, test: (jmeno: string) => boolean): number => {
  let n = 0;
  const projdi = (uzel: { druh: string; jmeno: string; deti?: unknown[] }) => {
    if (uzel.druh === "slozka") {
      for (const d of (uzel.deti ?? []) as typeof uzel[]) projdi(d);
    } else if (test(uzel.jmeno)) n += 1;
  };
  projdi(stav.disk as never);
  return n;
};

export const UKOLY: Ukol[] = [
  /* ─────────── Když něco nejde zavřít ───────────
     Vtíravé okno je ve výchozím scénáři, takže tenhle úkol platí pro prosté
     `/windows`. Ve scénářích `uklid` a `poviru` se okno neotevře a úkol se
     neodškrtne, protože chybí stopa. */
  {
    id: "vtirave-okno",
    skupina: "Když něco nejde zavřít",
    nazev: "Zbav se okna, které nejde zavřít",
    popis:
      "Hned po přihlášení vyskočilo okno, které se po zavření vrací. Zavřít ho nestačí – najdi a ukonči jeho proces.",
    kroky: [
      "Zkus okno zavřít křížkem. Za chvíli se vrátí – a to je celá lekce: křížek zavírá OKNO, ne program, který ho otevírá.",
      "Klikni pravým tlačítkem na hlavní panel dole a vyber Správce úloh.",
      "V seznamu procesů hledej něco, co tam nepatří. Nápověda: klikni na záhlaví sloupce Procesor – tenhle program si ho bere hodně, takže vyskočí nahoru.",
      "Označ proces WinOptimizer.exe a klikni na Ukončit úlohu.",
      "Teď okno zavři křížkem. Už se nevrátí.",
      "Všimni si taky obou tlačítek v tom okně: ani jedno nic neudělá. S takovým oknem se nedá vyjednávat, dá se jen zastavit program, který ho otevírá.",
    ],
    // `spustil:reklama` zakládá samo otevření okna (viz `okno/otevri`
    // v reduceru). Bez té podmínky by se úkol odškrtl každému, kdo si pustil
    // simulaci BEZ tohohle scénáře: ptá se totiž, jestli proces UŽ NEBĚŽÍ,
    // a jinde neběžel nikdy.
    hotovo: (s) => s.stopy.includes("spustil:reklama") && !s.reklamaBezi,
  },

  /* ─────────── Soubory a složky ─────────── */
  {
    id: "slozka-informatika",
    skupina: "Soubory a složky",
    nazev: "Založ složku Informatika",
    popis: "V Dokumentech je složka Škola. Vytvoř v ní další složku s názvem Informatika.",
    kroky: [
      "Na hlavním panelu dole klikni na ikonu složky – otevře se Průzkumník souborů.",
      "V levém sloupci klikni na Dokumenty.",
      "Dvojklikem otevři složku Škola.",
      "Klikni pravým tlačítkem do prázdného místa a vyber Nový → Složka.",
      "Přepiš název na Informatika a potvrď Enterem.",
    ],
    hotovo: (s) => je(s, `${DOMOV}\\Documents\\Škola\\Informatika`),
  },
  {
    id: "presun-referat",
    skupina: "Soubory a složky",
    nazev: "Přesuň soubor do správné složky",
    popis:
      "Soubor Historie počítačů.txt leží volně v Dokumentech. Přesuň ho do Dokumenty\\Škola\\Informatika.",
    kroky: [
      "V Dokumentech najdi soubor Historie počítačů.txt.",
      "Klikni na něj pravým tlačítkem a vyber Vyjmout (nebo Ctrl+X).",
      "Otevři Škola → Informatika.",
      "Klikni pravým tlačítkem do prázdna a vyber Vložit (nebo Ctrl+V).",
      "Vrať se do Dokumentů a zkontroluj, že tam soubor UŽ NENÍ. Tím se pozná přesun od kopie – kdybys použil Kopírovat, zůstal by na obou místech.",
    ],
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
    kroky: [
      "Klikni pravým tlačítkem na volné místo na ploše.",
      "Vyber Nový → Textový dokument.",
      "Název přepiš na Pokus a potvrď Enterem.",
      "Máš-li zapnuté přípony, piš celé Pokus.txt. Bez nich stačí Pokus a Windows si .txt doplní samy.",
    ],
    hotovo: (s) => je(s, `${DOMOV}\\Desktop\\Pokus.txt`),
  },
  {
    id: "kopie-slozky",
    skupina: "Soubory a složky",
    nazev: "Zkopíruj složku, neposouvej ji",
    popis: "Zkopíruj složku Škola na Plochu. V Dokumentech přitom musí zůstat i originál.",
    kroky: [
      "V Dokumentech klikni pravým tlačítkem na složku Škola a vyber Kopírovat (Ctrl+C).",
      "Přejdi na Plochu – v levém sloupci Průzkumníka, nebo si zmenši okno.",
      "Klikni pravým tlačítkem do prázdna a vyber Vložit (Ctrl+V).",
      "Zkontroluj, že Škola je teď na DVOU místech. Kdyby v Dokumentech zmizela, použil jsi Vyjmout místo Kopírovat.",
    ],
    hotovo: (s) => je(s, `${DOMOV}\\Desktop\\Škola`) && je(s, `${DOMOV}\\Documents\\Škola`),
  },
  {
    id: "archiv",
    skupina: "Soubory a složky",
    nazev: "Zabal soubory do archivu ZIP",
    popis:
      "Označ dva soubory, pravým tlačítkem Komprimovat do souboru ZIP. Porovnej velikost archivu s originály.",
    kroky: [
      "V Průzkumníku klikni na první soubor.",
      "Drž klávesu Ctrl a klikni na druhý – označí se oba najednou.",
      "Klikni pravým tlačítkem a vyber Komprimovat do souboru ZIP.",
      "U archivu i u původních souborů se podívej přes pravé tlačítko → Vlastnosti na velikost.",
      "Porovnej čísla: o kolik se to zmenšilo?",
    ],
    hotovo: (s) => stopa(s, "zip:vytvoren"),
  },
  {
    id: "kos",
    skupina: "Soubory a složky",
    nazev: "Vrať soubor z Koše",
    popis:
      "Něco smaž, otevři Koš a položku obnov. Smazaný soubor nezmizí hned – to je záchranná brzda.",
    kroky: [
      "Označ nějaký soubor, který ti nebude chybět, a zmáčkni Delete.",
      "Na ploše najdi ikonu Koš a otevři ji dvojklikem.",
      "Klikni na smazanou položku pravým tlačítkem a vyber Obnovit.",
      "Zkontroluj, že je zpátky tam, odkud zmizela. Koš je záchranná brzda – smazané se nezahodí hned.",
    ],
    hotovo: (s) => stopa(s, "kos:obnoveno"),
  },
  {
    id: "hledani",
    skupina: "Soubory a složky",
    nazev: "Najdi soubor vyhledáváním",
    popis: "Použij vyhledávací pole vpravo nahoře v Průzkumníku a najdi soubor podle názvu.",
    kroky: [
      "Otevři Průzkumník souborů.",
      "Klikni do vyhledávacího pole vpravo nahoře.",
      "Napiš část názvu, který hledáš – třeba vzorce.",
      "Prohlédni si výsledky. Hledá se i ve vnořených složkách, takže najdeš i to, co je zanořené hluboko.",
    ],
    hotovo: (s) => stopa(s, "pruzkumnik:hledano"),
  },

  /* ─────────── Zobrazení a vlastnosti ─────────── */
  {
    id: "pripony",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Zapni zobrazení přípon",
    popis:
      "Zobrazit → Zobrazit → Přípony názvů souborů. Bez nich nepoznáš, co soubor doopravdy je.",
    kroky: [
      "V Průzkumníku klikni nahoře na tlačítko Zobrazit.",
      "V rozbalené nabídce najdi oddíl Zobrazit.",
      "Klikni na Přípony názvů souborů.",
      "Podívej se, jak se názvy změnily – u každého souboru přibyla tečka a pár písmen navíc.",
      "Přípona říká, co soubor JE. Bez ní se dá snadno splést .txt s .exe, a právě toho zneužívají podvodníci.",
    ],
    hotovo: (s) => s.nastaveni.pripony,
  },
  {
    id: "skryte",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Ukaž skryté položky",
    popis: "Ve stejné nabídce zapni Skryté položky a podívej se, co se objeví.",
    kroky: [
      "V Průzkumníku klikni na Zobrazit a v oddílu Zobrazit vyber Skryté položky.",
      "Vrať se do Dokumentů a porovnej, co přibylo.",
      "Skryté položky poznáš podle bledší ikony.",
      "Skrytí není zabezpečení – kdokoli si je takhle zobrazí za dvě kliknutí.",
    ],
    hotovo: (s) => s.nastaveni.skrytePolozky,
  },
  {
    id: "vlastnosti",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Zjisti velikost souboru v bajtech",
    popis:
      "Pravým tlačítkem na Poznámky.txt → Vlastnosti. Kolik má bajtů a kolik kilobajtů?",
    kroky: [
      "V Dokumentech najdi soubor Poznámky.txt.",
      "Klikni na něj pravým tlačítkem a vyber Vlastnosti.",
      "Přečti řádek Velikost. Číslo v závorce je PŘESNÝ počet bajtů.",
      "Vyděl ten počet 1024 a máš velikost v kilobajtech.",
    ],
    hotovo: (s) => stopa(s, "vlastnosti:Poznámky.txt"),
  },
  {
    id: "neotevre",
    skupina: "Zobrazení a vlastnosti",
    nazev: "Najdi soubor, který nejde otevřít",
    popis:
      "Zkus otevřít Rozvrh.docx. Přečti si, co Windows hlásí, a zamysli se proč.",
    kroky: [
      "V Dokumentech dvojklikni na soubor Rozvrh.docx.",
      "Přečti si, co Windows hlásí.",
      "Zamysli se proč: .docx je formát Wordu a ten v tomhle počítači není nainstalovaný.",
      "Soubor je v pořádku – chybí program, který by ho uměl otevřít. To jsou dvě různé věci.",
    ],
    hotovo: (s) => stopa(s, "neotevreno:docx"),
  },

  /* ─────────── Nastavení systému ─────────── */
  /* Tmavý režim, tapeta a zvýrazňovací barva bývaly tři úkoly. Byly to tři
     řádky v panelu za dvě minuty klikání a žádný z nich nenesl pojem, který
     by si žák odnesl – přizpůsobit si telefon umí každý z nich dávno.
     Zůstala z nich jedna položka; ubraly se dvě, aby v hodině zbylo místo na
     věci, které něco učí. */
  {
    id: "prizpusobeni",
    skupina: "Nastavení systému",
    nazev: "Nastav si počítač po svém",
    popis:
      "V Nastavení → Přizpůsobení přepni tmavý režim, vyměň tapetu a změň zvýrazňovací barvu.",
    kroky: [
      "Otevři Start a klikni na Nastavení.",
      "V levém sloupci vyber Přizpůsobení.",
      "V oddílu Barvy přepni Zvolte režim na Tmavý.",
      "Tamtéž níž vyber jinou Zvýrazňovací barvu než modrou a všimni si, kde všude se projeví – tlačítka, označené položky i hlavní panel.",
      "Vrať se zpět a v oddílu Pozadí vyber jinou tapetu. (Rychlejší cesta k témuž: pravým tlačítkem na plochu → Přizpůsobit.)",
    ],
    hotovo: (s) =>
      s.nastaveni.motiv === "tmavy" &&
      s.nastaveni.tapeta !== "zavoj" &&
      s.nastaveni.akcent !== "modra",
  },
  {
    id: "panel",
    skupina: "Nastavení systému",
    nazev: "Zarovnej hlavní panel doleva",
    popis:
      "Nastavení → Přizpůsobení → Hlavní panel → Chování hlavního panelu. Tak vypadal panel do Windows 10.",
    kroky: [
      "Nastavení → Přizpůsobení → Hlavní panel.",
      "Rozbal oddíl Chování hlavního panelu.",
      "U položky Zarovnání hlavního panelu vyber Vlevo.",
      "Takhle vypadal panel ve Windows 10 a starších. Windows 11 ho jako první daly doprostřed.",
    ],
    hotovo: (s) => s.nastaveni.zarovnaniPanelu === "vlevo",
  },
  {
    id: "update",
    skupina: "Nastavení systému",
    nazev: "Zkontroluj aktualizace",
    popis: "Nastavení → Windows Update → Vyhledat aktualizace a nainstaluj je.",
    kroky: [
      "Nastavení → Windows Update.",
      "Klikni na Vyhledat aktualizace.",
      "Počkej, až se aktualizace najdou, a spusť instalaci.",
      "Aktualizace nejsou otrava navíc – zavírají díry, kterými se do počítače dostávají útočníci.",
    ],
    hotovo: (s) => s.nastaveni.aktualizace,
  },
  {
    id: "o-systemu",
    skupina: "Nastavení systému",
    nazev: "Zjisti parametry počítače",
    popis:
      "Nastavení → Systém → Informace. Kolik má počítač paměti RAM a jaký má procesor?",
    kroky: [
      "Nastavení → Systém → Informace.",
      "Najdi řádek s nainstalovanou pamětí RAM.",
      "Najdi řádek s procesorem.",
      "Tyhle dva údaje se hodí vždycky, když někomu popisuješ, co má za počítač.",
    ],
    hotovo: (s) => stopa(s, "nastaveni:o-systemu"),
  },

  /* ─────────── Příkazový řádek ─────────── */
  {
    id: "cmd-dir",
    skupina: "Příkazový řádek",
    nazev: "Vypiš obsah složky příkazem",
    popis: "Otevři Terminál a napiš dir. Porovnej výpis s tím, co ukazuje Průzkumník.",
    kroky: [
      "Otevři Start a spusť Terminál.",
      "Napiš dir a zmáčkni Enter.",
      "Ve výpisu znamená <DIR> složku. Číslo u souboru je jeho velikost v bajtech.",
      "Otevři vedle Průzkumník a porovnej – je to totéž, jen jinak zobrazené.",
    ],
    hotovo: (s) => stopa(s, "prikaz:dir"),
  },
  {
    id: "cmd-cd",
    skupina: "Příkazový řádek",
    nazev: "Přejdi do jiné složky",
    popis:
      "Použij cd Documents a pak cd .. zpět. Všimni si, že složka se jmenuje Documents, i když Průzkumník píše Dokumenty.",
    kroky: [
      "V Terminálu napiš cd Documents a zmáčkni Enter.",
      "Napiš dir a podívej se, co v té složce je.",
      "Napiš cd .. a Enter – dostaneš se o úroveň výš. Dvě tečky znamenají nadřazenou složku.",
      "Pozor: složka se OPRAVDU jmenuje Documents. Dokumenty je jen český popisek, který ukazuje Průzkumník, a cd Dokumenty proto neprojde.",
    ],
    hotovo: (s) => stopa(s, "prikaz:cd"),
  },
  {
    id: "cmd-md",
    skupina: "Příkazový řádek",
    nazev: "Založ složku příkazem",
    popis: "md Test vytvoří složku. Zkontroluj v Průzkumníku, že tam opravdu je.",
    kroky: [
      "V Terminálu napiš md Test a zmáčkni Enter.",
      "Napiš dir a zkontroluj, že složka Test přibyla.",
      "Otevři Průzkumník a najdi ji i tam – je to jedna a tatáž složka.",
      "md je zkratka anglického make directory, tedy vytvoř složku.",
    ],
    hotovo: (s) => stopa(s, "prikaz:md"),
  },
  {
    id: "cmd-ipconfig",
    skupina: "Příkazový řádek",
    nazev: "Zjisti IP adresu počítače",
    popis: "Příkaz ipconfig vypíše nastavení sítě. Najdi řádek IPv4.",
    kroky: [
      "V Terminálu napiš ipconfig a zmáčkni Enter.",
      "Ve výpisu najdi řádek, který začíná IPv4.",
      "Adresa má čtyři čísla oddělená tečkami – tak se tenhle počítač jmenuje v síti.",
    ],
    hotovo: (s) => stopa(s, "prikaz:ipconfig"),
  },
  {
    id: "powershell",
    skupina: "Příkazový řádek",
    nazev: "Vyzkoušej PowerShell",
    popis:
      "V Terminálu otevři novou kartu s PowerShellem a napiš Get-ChildItem. Dělá totéž co dir, jinými slovy.",
    kroky: [
      "V Terminálu klikni nahoře na šipku vedle karty a vyber Windows PowerShell.",
      "Otevře se nová karta s jiným příkazovým řádkem.",
      "Napiš Get-ChildItem a zmáčkni Enter.",
      "Porovnej výpis s tím, co dělá dir. Je to totéž, jen jiným jazykem – PowerShell je novější a umí toho víc.",
    ],
    hotovo: (s) => stopa(s, "prikaz:get-childitem"),
  },

  /* ─────────── Aplikace ─────────── */
  {
    id: "poznamky",
    skupina: "Aplikace",
    nazev: "Ulož text z Poznámkového bloku",
    popis: "Napiš pár vět a ulož je přes Soubor → Uložit jako do složky Dokumenty.",
    kroky: [
      "Otevři Start a spusť Poznámkový blok.",
      "Napiš pár vět – třeba co jsi dnes dělal v hodině.",
      "V nabídce vyber Soubor → Uložit jako…",
      "V dialogu vyber složku Dokumenty, vymysli název a ulož.",
    ],
    hotovo: (s) => stopa(s, "poznamkovy-blok:ulozeno"),
  },
  {
    id: "malovani",
    skupina: "Aplikace",
    nazev: "Nakresli a ulož obrázek",
    popis: "V Malování něco nakresli a ulož to do složky Obrázky jako PNG.",
    // Jen podle stopy: v Obrázcích jsou obrázky PNG už od začátku, takže
    // pouhá jejich přítomnost nic nedokazuje.
    kroky: [
      "Otevři Start a spusť Malování.",
      "Vyber si nástroj a barvu a něco nakresli.",
      "V nabídce klikni na Uložit jako.",
      "Ulož obrázek do složky Obrázky jako PNG.",
    ],
    hotovo: (s) => stopa(s, "malovani:ulozeno"),
  },
  {
    id: "kalkulacka",
    skupina: "Aplikace",
    nazev: "Převeď číslo do dvojkové soustavy",
    popis:
      "Kalkulačka → nabídka vlevo nahoře → Programátorská. Zadej číslo a přečti řádek BIN.",
    kroky: [
      "Otevři Start a spusť Kalkulačku.",
      "Vlevo nahoře klikni na nabídku (tři čárky).",
      "V nabídce vyber režim Programátorská.",
      "Zadej číslo a přečti si řádek BIN – to je zápis ve dvojkové soustavě, kterému rozumí počítač.",
    ],
    hotovo: (s) => stopa(s, "kalkulacka:programatorsky"),
  },
  {
    id: "spravce",
    skupina: "Aplikace",
    nazev: "Podívej se do Správce úloh",
    popis:
      "Otevři ho pravým tlačítkem na hlavní panel. Kolik procent procesoru se používá?",
    kroky: [
      "Klikni pravým tlačítkem na hlavní panel dole a vyber Správce úloh.",
      "Prohlédni si seznam běžících programů.",
      "Najdi sloupec Procesor a přečti, kolik procent se zrovna používá.",
      "Ve skutečných Windows ho otevře i zkratka Ctrl+Shift+Esc – tady ji ale nezkoušej. Tuhle zkratku si zabere skutečný systém dřív, než se klávesa dostane do prohlížeče, takže by ti vyskočil správce tvého VLASTNÍHO počítače.",
      "Tady se dá ukončit program, který přestal reagovat – a taky tady poznáš, co běží na pozadí, aniž bys to spustil.",
    ],
    hotovo: (s) => s.stopy.includes("spustil:spravce-uloh"),
  },

  /* ─────────── Delší úlohy ───────────
     Tyhle nejde proklikat podle návodu. Odpověď se zapisuje názvem složky,
     takže kontrola ověřuje, jestli žák došel ke správnému číslu — ne jestli
     prošel správnou cestu. Kdo se splete, složka se neodškrtne. */
  {
    id: "skryta-zprava",
    skupina: "Delší úlohy",
    nazev: "Najdi skrytou zprávu",
    popis:
      "V Dokumentech je soubor, který normálně není vidět. Najdi ho, přečti si ho a udělej, co v něm stojí.",
    kroky: [
      "Nejdřív si v Průzkumníku zapni Skryté položky (Zobrazit → Zobrazit → Skryté položky).",
      "Projdi Dokumenty a najdi soubor, který tam předtím vidět nebyl.",
      "Otevři ho a přečti si, co v něm stojí.",
      "Udělej přesně to, co po tobě text chce.",
    ],
    hotovo: (s) => slozkaSNazvem(s, "Nasel jsem to"),
  },
  {
    id: "kolik-fotek",
    skupina: "Delší úlohy",
    nazev: "Kolik fotek se vejde na 1 GB",
    popis:
      "Zjisti ve Vlastnostech přesnou velikost souboru Fotka z výletu.jpg v bajtech. V Kalkulačce spočítej, kolik se jich vejde do 1 GB, když 1 kB = 1024 B. Zaokrouhli dolů a založ v Dokumentech složku s tím číslem.",
    kroky: [
      "Najdi soubor Fotka z výletu.jpg a otevři jeho Vlastnosti.",
      "Opiš si PŘESNÝ počet bajtů – číslo v závorce, ne zaokrouhlenou hodnotu nahoře.",
      "Spočítej si, kolik bajtů má 1 GB: 1024 × 1024 × 1024.",
      "V Kalkulačce vyděl gigabajt velikostí fotky.",
      "Výsledek zaokrouhli DOLŮ (rozdělaná fotka se nepočítá) a založ v Dokumentech složku pojmenovanou tím číslem.",
    ],
    hotovo: (s) => slozkaSNazvem(s, "436"),
  },
  {
    id: "komprese-porovnani",
    skupina: "Delší úlohy",
    nazev: "Co se zabalením zmenší víc",
    popis:
      "Zabal zvlášť textový soubor a zvlášť fotku. Porovnej velikost archivu s originálem. Podle toho, co se zmenšilo víc, založ v Dokumentech složku s názvem text nebo fotka.",
    kroky: [
      "Označ samotný textový soubor a přes pravé tlačítko ho zabal do ZIPu.",
      "Totéž udělej zvlášť s fotkou – druhý archiv jen z ní.",
      "U obou archivů i u obou originálů si přečti velikost ve Vlastnostech.",
      "Spočítej, o kolik procent se každý zmenšil.",
      "Podle toho, co se zmenšilo víc, založ v Dokumentech složku s názvem text, nebo fotka.",
    ],
    hotovo: (s) => slozkaSNazvem(s, "text"),
  },
  {
    id: "dvojkova-2026",
    skupina: "Delší úlohy",
    nazev: "Zapiš rok dvojkově",
    popis:
      "V Kalkulačce přepni na Programátorskou a převeď číslo 2026 do dvojkové soustavy. Založ v Dokumentech složku, která se bude jmenovat přesně tím výsledkem.",
    kroky: [
      "Kalkulačka → nabídka vlevo nahoře → Programátorská.",
      "Zkontroluj, že je vybraná soustava DEC, a zadej 2026.",
      "Přečti si řádek BIN pod displejem.",
      "Založ v Dokumentech složku pojmenovanou přesně tím zápisem – jen nuly a jedničky, žádné mezery.",
    ],
    hotovo: (s) => slozkaSNazvem(s, "11111101010"),
  },
  {
    id: "ipv4-posledni",
    skupina: "Delší úlohy",
    nazev: "Přečti adresu počítače",
    popis:
      "V Terminálu spusť ipconfig a najdi adresu IPv4. Založ v Dokumentech složku pojmenovanou poslední částí té adresy, tedy číslem za poslední tečkou.",
    kroky: [
      "V Terminálu spusť ipconfig.",
      "Ve výpisu najdi řádek, který začíná IPv4.",
      "Adresa má čtyři části oddělené tečkami – potřebuješ tu poslední, za poslední tečkou.",
      "Založ v Dokumentech složku pojmenovanou tím číslem.",
    ],
    hotovo: (s) => slozkaSNazvem(s, "147"),
  },
  {
    id: "kolize-jmen",
    skupina: "Delší úlohy",
    nazev: "Sluč složky se stejným jménem",
    popis:
      "Ve složce Škola jsou Matematika i Fyzika a v obou leží Vzorce.txt. Dostaň oba soubory do jedné složky tak, aby ani jeden nezmizel. Dva stejné názvy vedle sebe Windows nedovolí — poraď si.",
    kroky: [
      "Otevři Škola → Matematika a podívej se na soubor Vzorce.txt.",
      "Totéž ve složce Fyzika – soubor se jmenuje úplně stejně.",
      "Zkus jeden z nich zkopírovat k tomu druhému. Windows tě upozorní, že takový název už tam je.",
      "Rozmysli si, jak je dostat do jedné složky, aby ani jeden nepřepsal ten druhý.",
      "Nápověda: přejmenovat se dá před kopírováním i po něm – a z názvu by mělo být poznat, odkud který je.",
    ],
    hotovo: (s) => {
      if (kolikSouboru(s, (j) => /^vzorce.*\.txt$/i.test(j)) < 2) return false;
      const projdi = (uzel: Uzel): boolean => {
        if (!jeSlozka(uzel)) return false;
        const vzorce = uzel.deti.filter(
          (d) => jeSoubor(d) && /^vzorce.*\.txt$/i.test(d.jmeno),
        );
        if (vzorce.length >= 2) return true;
        return uzel.deti.some(projdi);
      };
      return projdi(s.disk);
    },
  },
  {
    id: "web-dve-stranky",
    skupina: "Delší úlohy",
    nazev: "Postav web o dvou stránkách",
    popis:
      "V Poznámkovém bloku napiš index.html s nadpisem, seznamem tří položek a odkazem na druha.html. Druhou stránku taky vytvoř. Obě ulož do Dokumentů a projdi je v Edge.",
    kroky: [
      "Otevři Poznámkový blok (Start → Poznámkový blok).",
      "Napiš kostru stránky: <html> na začátek, </html> na konec, a mezi ně <body> a </body>. Do body přijde všechno, co má být vidět.",
      "Dovnitř body napiš nadpis: <h1>Můj web</h1>",
      "Pod něj seznam. Začni <ul>, pak tři řádky ve tvaru <li>první položka</li>, a ukonči </ul>.",
      "Nakonec odkaz: <a href=\"druha.html\">Druhá stránka</a>",
      "Soubor → Uložit jako…, vyber Dokumenty a jako název napiš index.html – s příponou .html, ne .txt!",
      "Soubor → Nový, napiš druhou stránku (stačí <html><body><h1>Druhá stránka</h1></body></html>) a ulož ji do Dokumentů jako druha.html.",
      "V Průzkumníku dvojklikni na index.html – otevře se v Edge.",
      "Klikni na odkaz a ověř, že tě přenese na druhou stránku. Když nefunguje, zkontroluj, že se soubor jmenuje přesně druha.html.",
    ],
    hotovo: (s) => {
      const index = obsah(s, `${DOMOV}\\Documents\\index.html`).toLowerCase();
      const druha = existuje(s.disk, rozloz(`${DOMOV}\\Documents\\druha.html`));
      return (
        druha &&
        /<h1[\s>]/.test(index) &&
        (index.match(/<li[\s>]/g) ?? []).length >= 3 &&
        /href\s*=\s*["']?[^"'>]*druha\.html/.test(index)
      );
    },
  },
  {
    id: "uklid-po-viru",
    skupina: "Delší úlohy",
    nazev: "Ukliď po škodlivém programu",
    popis:
      "Když jsi spustil ten podezřelý soubor: ukonči jeho proces ve Správci úloh, vrať souborům původní příponu a smaž výzvu k výkupnému i samotnou návnadu.",
    kroky: [
      "Pravým tlačítkem na hlavní panel → Správce úloh. Ukonči proces toho podezřelého programu – dokud běží, šifruje dál.",
      "V Průzkumníku najdi soubory, kterým na konci názvu přibyla cizí přípona.",
      "Každý přejmenuj tak, že tu přidanou příponu smažeš a necháš původní název.",
      "Smaž z plochy soubor s výzvou k výkupnému.",
      "Smaž i samotnou návnadu, ať ji někdo nespustí znovu.",
      "Pro příště: tenhle program se tvářil jako něco neškodného. Proto se vyplatí mít zapnuté přípony a dívat se, co soubor doopravdy je.",
    ],
    hotovo: (s) =>
      // Dává smysl až po spuštění – kdo návnadu neotevřel, nemá co uklízet.
      s.stopy.includes("navnada:otevrena") &&
      !s.virusBezi &&
      kolikSouboru(s, (j) => j.toLowerCase().endsWith(`.${PRIPONA_ZASIFROVANO}`)) === 0 &&
      !existuje(s.disk, rozloz(`${DOMOV}\\Desktop\\${VYZVA}`)),
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
