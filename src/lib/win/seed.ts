/**
 * Výchozí obsah virtuálního disku.
 *
 * Staví se až v prohlížeči (ne při načtení modulu), aby data v souborech měla
 * smysluplná data a stránka se přitom vykreslila na serveru stejně jako
 * u klienta. Soubory nejsou náhodná výplň – každý je tu proto, že se o něj
 * dá v hodině opřít: přípona, kterou nic neotevře, obrázek do Fotek, archiv
 * k rozbalení, CSV do Poznámkového bloku.
 */

import { FOTO_GRAF, FOTO_SNIMEK, FOTO_VYLET } from "./obrazky";
import { komprimovanaVelikost } from "./zip";
import { NAVNADA } from "./virus";
import type { Slozka, Soubor, Uzel } from "./fs";

/** Druhé „Vzorce.txt" – kvůli úloze o kolizi jmen. */
const VZORCE_FYZIKA_TXT = `FYZIKA — VZORCE

Rychlost:      v = s / t
Zrychlení:     a = (v - v0) / t
Síla:          F = m * a
Práce:         W = F * s
Výkon:         P = W / t
Hustota:       rho = m / V
`;

const den = 24 * 60 * 60 * 1000;

/** Skrytý soubor v Dokumentech – opora pro jednu z těžších úloh. */
const POKYN_TXT = `SKRYTÉ POLOŽKY

Když tohle čteš, zapnul sis v Průzkumníku zobrazení skrytých položek.
Windows takhle schovává soubory, které nemá běžný uživatel měnit — třeba
desktop.ini, podle kterého se řídí vzhled složky.

Skrytý ale neznamená chráněný. Je to jen příznak, který jde odklikat.
Kdo ti chce něco propašovat do počítače, s tím počítá.

ÚKOL: založ v Dokumentech složku s názvem  Nasel jsem to
`;

/** Vzhled složky – ve skutečném Windows je taky skrytý. */
const DESKTOP_INI = `[.ShellClassInfo]
IconResource=%SystemRoot%\\system32\\imageres.dll,-113
`;

export const slozka = (jmeno: string, deti: Uzel[], stari: number, zamceno = false): Slozka => ({
  druh: "slozka",
  jmeno,
  deti,
  zmeneno: Date.now() - stari * den,
  ...(zamceno ? { zamceno: true } : {}),
});

export const soubor = (
  jmeno: string,
  obsah: string,
  stari: number,
  extra: Partial<Soubor> = {},
): Soubor => ({
  druh: "soubor",
  jmeno,
  obsah,
  zmeneno: Date.now() - stari * den,
  ...extra,
});

/** Soubor, který v prostředí nemá obsah – nese jen deklarovanou velikost. */
export const binarni = (jmeno: string, velikost: number, stari: number): Soubor =>
  soubor(jmeno, "", stari, { velikost });

const UKOLY_TXT = `ÚKOLY DO INFORMATIKY
====================

1) Ve složce Dokumenty si založ složku Škola a v ní složku Informatika.
2) Přesuň do ní soubor Historie počítačů.txt.
3) Zjisti, kolik bajtů má soubor Poznámky.txt (Vlastnosti).
4) Zapni si zobrazování přípon souborů (Zobrazit -> Zobrazit -> Přípony názvů souborů).
5) Zkus otevřít soubor Rozvrh.docx. Proč to nejde?

Hotovo? Otevři panel Úkoly vpravo dole a zkontroluj si postup.
`;

const POZNAMKY_TXT = `Poznámky z hodiny
-----------------

Cesta k souboru:
  absolutní zacina pismenem disku      C:\\Users\\Zak\\Documents\\Referat.txt
  relativní zacina od aktualni slozky  Documents\\Referat.txt

Přípona neurčuje, co v souboru je. Určuje, čím ho Windows zkusí otevřít.
Když příponu změním, obsah zůstane. Změní se jen ta domněnka.

1 kB = 1024 bajtů (tak to počítá Průzkumník)
1 kB = 1000 bajtů (tak to počítá výrobce disku)
`;

const HISTORIE_TXT = `Historie počítačů — poznámky k referátu

1837  Charles Babbage navrhuje analytický stroj. Nikdy ho nedokončí.
1936  Alan Turing popisuje stroj, který umí spočítat cokoli spočitatelného.
1945  ENIAC. Osmnáct tisíc elektronek, třicet tun, program se zapojoval kabely.
1947  Tranzistor v Bellových laboratořích. Elektronky jdou do důchodu.
1971  Intel 4004, první mikroprocesor na jednom čipu.
1981  IBM PC. Otevřená architektura, kterou začnou kopírovat všichni.
1991  Linus Torvalds oznamuje projekt, "nic velkého ani profesionálního".
2007  Chytrý telefon se stává počítačem, který lidé nosí u sebe.

K doplnění: co znamenalo, že IBM nechalo DOS Microsoftu?
`;

const VZORCE_TXT = `Vzorce, které pořád zapomínám

obsah kruhu       S = pi * r^2
obvod kruhu       o = 2 * pi * r
Pythagorova věta  c^2 = a^2 + b^2
objem kvádru      V = a * b * c
`;

const SEZNAM_CSV = `prijmeni;jmeno;trida;body
Dvorak;Adam;1.L;42
Novakova;Bara;1.L;38
Havel;Cyril;1.L;45
Kucerova;Dana;1.L;40
Marek;Emil;1.L;31
Pokorna;Filipa;1.L;47
`;

const CTIME_TXT = `Tento soubor je uvnitř archivu ZIP.

Archiv je jeden soubor, který v sobě nese víc souborů a bývá menší
než ony dohromady. Rozbalením vzniknou soubory zpátky - archiv
přitom nezmizí, zůstane vedle nich.
`;

const README_TXT = `Ke stažení jsi dostal soubor s příponou .exe.

Ve školním prostředí se programy neinstalují. Na svém počítači bys měl
u každého staženého .exe vědět, odkud přesně je - instalátor umí udělat
cokoli, co umí uživatel, který ho spustil.
`;

/** Archiv `Zápisky.zip` – Průzkumník do něj umí nahlédnout. */
function archiv(): Soubor {
  const uvnitr: Uzel[] = [
    soubor("Čti mě.txt", CTIME_TXT, 12),
    soubor("Vzorce.txt", VZORCE_TXT, 12),
  ];
  return soubor("Zápisky.zip", JSON.stringify({ hlavicka: "PK-VYUKA-ZIP-1", polozky: uvnitr }), 12, {
    velikost: komprimovanaVelikost(uvnitr),
  });
}

/** Postaví kompletní výchozí disk C:. */
export function vytvorDisk(): Slozka {
  return slozka(
    "C:",
    [
      slozka(
        "Program Files",
        [
          slozka("Common Files", [], 120, true),
          slozka("Windows NT", [], 120, true),
          slozka("Windows Photo Viewer", [], 120, true),
        ],
        120,
        true,
      ),
      slozka("Program Files (x86)", [slozka("Common Files", [], 120, true)], 120, true),
      slozka(
        "Users",
        [
          slozka("Public", [slozka("Documents", [], 200, true)], 200, true),
          slozka(
            "Zak",
            [
              slozka(
                "Desktop",
                [
                  soubor("Úkoly do informatiky.txt", UKOLY_TXT, 0),
                  soubor("Poznámky.txt", POZNAMKY_TXT, 3),
                  soubor("Fotka z výletu.jpg", FOTO_VYLET, 26, { velikost: 2_458_112 }),
                ],
                0,
              ),
              slozka(
                "Documents",
                [
                  // Dvakrát „Vzorce.txt" ve dvou složkách je schválně: o kolizi jmen se
                  // opírá jedna z těžších úloh. Sloučit je tak, aby oba přežily, jde jen
                  // přejmenováním.
                  slozka(
                    "Škola",
                    [
                      slozka("Matematika", [soubor("Vzorce.txt", VZORCE_TXT, 40)], 40),
                      slozka("Fyzika", [soubor("Vzorce.txt", VZORCE_FYZIKA_TXT, 35)], 35),
                    ],
                    40,
                  ),
                  soubor("Historie počítačů.txt", HISTORIE_TXT, 9),
                  soubor("Seznam žáků.csv", SEZNAM_CSV, 15),
                  // Skryté položky: mechanismus v prostředí existoval, ale na disku nebyla
                  // označená ani jedna, takže úkol „zapni skryté položky" přepnul nastavení
                  // a nic se neobjevilo.
                  soubor(".pokyn.txt", POKYN_TXT, 12, { skryty: true }),
                  binarni("Rozvrh.docx", 24_118, 21),
                  archiv(),
                ],
                9,
              ),
              slozka(
                "Downloads",
                [
                  binarni("instalace-programu.exe", 47_882_240, 5),
                  // Návnada k hodině o bezpečnosti. Dvojitá přípona: při výchozím
                  // skrytí přípon se tváří jako fotka. Nic nespouští – viz virus.ts.
                  binarni(NAVNADA, 1_284_096, 1),
                  soubor("Čti mě.txt", README_TXT, 5),
                  binarni("prezentace.pptx", 3_641_344, 30),
                  binarni("manual.pdf", 1_204_224, 30),
                ],
                5,
              ),
              slozka(
                "Pictures",
                [
                  slozka("Tapety", [], 60),
                  soubor("desktop.ini", DESKTOP_INI, 60, { skryty: true, zamceno: true }),
                  soubor("Snímek obrazovky 2026-08-20 101533.png", FOTO_SNIMEK, 2, {
                    velikost: 184_320,
                  }),
                  soubor("Graf.png", FOTO_GRAF, 18, { velikost: 62_464 }),
                ],
                2,
              ),
              slozka("Music", [binarni("Ukázka.mp3", 3_465_216, 45)], 45),
              slozka("Videos", [binarni("video_1280x720_30fps.mp4", 18_247_680, 45)], 45),
            ],
            0,
          ),
        ],
        200,
        true,
      ),
      slozka(
        "Windows",
        [
          slozka(
            "System32",
            [
              binarni("cmd.exe", 323_584, 200),
              binarni("notepad.exe", 201_216, 200),
              binarni("calc.exe", 27_648, 200),
              slozka("drivers", [], 200, true),
            ],
            200,
            true,
          ),
          slozka("Fonts", [], 200, true),
          slozka("Temp", [], 1),
          soubor("win.ini", "; pro zpetnou kompatibilitu\n[fonts]\n[extensions]\n", 200, {
            zamceno: true,
          }),
        ],
        200,
        true,
      ),
    ],
    200,
    true,
  );
}
