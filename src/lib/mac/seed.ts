/**
 * Disk, se kterým žák do hodiny nastoupí.
 *
 * NENÍ TO OPIS WINDOWSOVÉHO DISKU. Obsah je vybraný tak, aby na něm šly
 * udělat právě ty úlohy, které ve Windows nemají obdobu – a nic navíc:
 *
 *   `.DS_Store`, `.zshrc`   skrytá položka je tu JMÉNO, ne příznak souboru
 *   `Poznámky.app`          co vypadá jako soubor, je ve skutečnosti složka
 *   `/Volumes/FLASH`        disk se nepřipojí pod písmenem, ale do stromu
 *   `Library/Preferences`   nastavení programu je čitelný soubor, ne registr
 *   `Kalkulačka.dmg`        instalace = přetáhnout, žádný instalátor
 *
 * Konstruktory `slozka`, `soubor` a `binarni` se berou z windowsového seedu.
 * Nejsou na systému nijak závislé – staví uzel stromu ze jména, obsahu a stáří
 * – takže je zbytečné mít je dvakrát. Windowsový disk se tím nijak nemění.
 */

import type { Slozka, Uzel } from "@/lib/win/fs";
import { binarni, slozka, soubor } from "@/lib/win/seed";
import { APLIKACE, DOKUMENTY, OBRAZKY, PLOCHA, STAZENE } from "./cesty";

/** Uvítací soubor na ploše. Otevírá se sám po přihlášení (viz MacOS.tsx). */
export const UVITANI = "Přečti si mě.txt";

const CTI_ME = `Vítej na Macu.

Tohle prostředí vypadá jinak než Windows, ale pod povrchem dělá totéž:
skládá soubory do složek, spouští programy a hlídá, kdo smí co.

Úkoly v panelu vlevo dole jsou schválně jen ty, které ve Windows nemají
obdobu. Nehledej tu podruhé to, co už umíš.
`;

/** Skutečný obsah, který macOS do každé navštívené složky odloží sám. */
const DS_STORE = `Tenhle soubor si tu založil Finder.

Pamatuje si, jak má být složka zobrazená – velikost ikon, řazení, pozici okna.
Nikdo ho nevytvořil schválně a k ničemu dalšímu není.

Proč ho normálně nevidíš: jeho jméno začíná tečkou. Tak se to tady dělá.
Ve Windows je „skrytý" příznak, který se zapíná v nastavení zobrazení; tady
je to prostě jméno. Přejmenuj si vlastní soubor tak, aby začínal tečkou,
a zmizí taky.
`;

const ZSHRC = `# Nastavení příkazového řádku. Načte se při každém spuštění Terminálu.
# Že je soubor skrytý, poznáš podle tečky na začátku jména.

alias ll="ls -la"
`;

const PREFERENCE = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>PosledniSlozka</key>
  <string>~/Documents</string>
  <key>VelikostIkon</key>
  <integer>64</integer>
</dict>
</plist>
`;

const DOPIS = `Dobrý den,

posílám podklady k projektu. Termín je do konce měsíce.

S pozdravem
`;

/**
 * Balíček aplikace. Navenek jedna ikona, uvnitř obyčejný strom složek –
 * přesně tak vypadá každá aplikace na Macu.
 */
function aplikace(jmeno: string, stari: number): Slozka {
  return slozka(
    `${jmeno}.app`,
    [
      slozka(
        "Contents",
        [
          soubor(
            "Info.plist",
            `<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">\n<dict>\n  <key>CFBundleName</key>\n  <string>${jmeno}</string>\n</dict>\n</plist>\n`,
            stari,
          ),
          slozka("MacOS", [binarni(jmeno, 2_400_000, stari)], stari),
          slozka("Resources", [binarni(`${jmeno}.icns`, 180_000, stari)], stari),
        ],
        stari,
      ),
    ],
    stari,
  );
}

export function vytvorDiskMac(): Slozka {
  return slozka(
    "",
    [
      slozka(
        "Applications",
        [
          aplikace("Finder", 400),
          aplikace("Terminál", 400),
          aplikace("Poznámky", 400),
          aplikace("Náhled", 400),
        ],
        400,
        true,
      ),
      slozka("System", [slozka("Library", [], 400, true)], 400, true),
      slozka(
        "Users",
        [
          slozka(
            "zak",
            [
              slozka(
                "Desktop",
                [
                  soubor(UVITANI, CTI_ME, 0),
                  soubor(".DS_Store", DS_STORE, 0),
                ],
                0,
              ),
              slozka(
                "Documents",
                [
                  soubor("Dopis.txt", DOPIS, 4),
                  slozka("Škola", [slozka("Informatika", [], 9)], 9),
                  soubor(".DS_Store", DS_STORE, 2),
                ],
                2,
              ),
              slozka(
                "Downloads",
                [
                  // Instalace na Macu: otevřít obraz a přetáhnout ikonu
                  // do složky Aplikace. Žádný instalátor, žádný registr.
                  binarni("Kalkulačka.dmg", 8_400_000, 1),
                ],
                1,
              ),
              slozka("Pictures", [binarni("Výlet.jpg", 2_100_000, 20)], 20),
              slozka(
                "Library",
                [
                  slozka("Preferences", [soubor("cz.spstabor.finder.plist", PREFERENCE, 3)], 3),
                  slozka("Caches", [], 3),
                ],
                3,
              ),
              // Koš je prázdný a skrytý. Naplní se, až žák něco smaže –
              // a tím se dozví, že „přesunout do koše" je doslova přesun.
              slozka(".Trash", [], 0),
              soubor(".zshrc", ZSHRC, 30),
            ],
            0,
          ),
        ],
        400,
        true,
      ),
      // Připojený disk. Ve Windows by dostal písmeno, tady visí ve stromu.
      slozka("Volumes", [slozka("FLASH", [soubor("Zaloha.txt", "Záloha z minulé hodiny.\n", 7)], 7)], 7),
    ],
    400,
    true,
  );
}

/** Položky postranního panelu Finderu. Cesty včetně kořene – viz `cesty.ts`. */
export const DOMOVSKE_SLOZKY: { jmeno: string; cesta: string[] }[] = [
  { jmeno: "Plocha", cesta: PLOCHA },
  { jmeno: "Dokumenty", cesta: DOKUMENTY },
  { jmeno: "Stažené", cesta: STAZENE },
  { jmeno: "Obrázky", cesta: OBRAZKY },
  { jmeno: "Aplikace", cesta: APLIKACE },
];

export type { Uzel };
