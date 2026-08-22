/**
 * Příkazový řádek a PowerShell.
 *
 * Obojí sahá na tentýž virtuální disk jako Průzkumník – v tom je celá pointa.
 * Když žák napíše `md Test`, složka se objeví v okně vedle, a když ji tam
 * smaže myší, `dir` ji přestane vypisovat. Bez toho by terminál byl jen
 * ozdobná hračka.
 *
 * `del` schválně nemaže do Koše, stejně jako ve skutečnosti. Je to jedna
 * z mála věcí, kde příkazový řádek trestá tvrději než myš, a stojí za to
 * si ji odnést.
 */

import {
  jeSlozka,
  jeSoubor,
  kopie,
  najdi,
  najdiSlozku,
  nadrazena,
  novaSlozka,
  novySoubor,
  odeber,
  pocetPolozek,
  sloz,
  velikost,
  vloz,
  volneJmeno,
  vyres,
  type Slozka,
  type Uzel,
} from "./fs";
import { cislo, datumCas } from "./format";
import { KAPACITA_DISKU, OBSAZENO_SYSTEMEM } from "./nazvy";

export type Rezim = "cmd" | "powershell";

export interface Kontext {
  disk: Slozka;
  cesta: string[];
  jmenoUctu: string;
}

export interface Vysledek {
  /** Řádky k vypsání. Prázdné pole = příkaz mlčí, což je taky odpověď. */
  vystup: string[];
  disk?: Slozka;
  cesta?: string[];
  vycistit?: boolean;
  ukoncit?: boolean;
  /** Klíče pro úkolovník. */
  stopy?: string[];
}

/* ───────────────────── Rozbor řádku ───────────────────── */

/** Rozdělí řádek na slova, uvozovky drží dohromady. */
export function rozdel(radek: string): string[] {
  const kusy: string[] = [];
  let aktualni = "";
  let vUvozovkach = false;
  for (const znak of radek) {
    if (znak === '"') {
      vUvozovkach = !vUvozovkach;
    } else if (/\s/.test(znak) && !vUvozovkach) {
      if (aktualni) kusy.push(aktualni);
      aktualni = "";
    } else {
      aktualni += znak;
    }
  }
  if (aktualni) kusy.push(aktualni);
  return kusy;
}

const jePrepinac = (s: string) => s.startsWith("/") || s.startsWith("-");

/** Cesta pro chybové hlášky – přesně jak ji uživatel napsal. */
const chybiCesta = (co: string) => `Systém nemůže nalézt uvedenou cestu: ${co}`;

/* ───────────────────── Sdílené operace ───────────────────── */

function volnoNaDisku(disk: Slozka): number {
  return Math.max(0, KAPACITA_DISKU - OBSAZENO_SYSTEMEM - velikost(disk));
}

interface Cil {
  cesta: string[];
  uzel: Uzel | null;
}

function najdiCil(ctx: Kontext, zapis: string): Cil | null {
  const cesta = vyres(ctx.cesta, zapis);
  if (!cesta) return null;
  return { cesta, uzel: najdi(ctx.disk, cesta) };
}

/* ───────────────────── cmd ───────────────────── */

function cmdDir(ctx: Kontext, argumenty: string[]): Vysledek {
  const holy = argumenty.some((a) => a.toLowerCase() === "/b");
  const kam = argumenty.find((a) => !jePrepinac(a));
  const cil = kam ? najdiCil(ctx, kam) : { cesta: ctx.cesta, uzel: najdi(ctx.disk, ctx.cesta) };
  if (!cil || !cil.uzel || !jeSlozka(cil.uzel)) {
    return { vystup: [chybiCesta(kam ?? sloz(ctx.cesta))] };
  }
  const slozka = cil.uzel;
  const deti = [...slozka.deti].sort((a, b) => {
    if (jeSlozka(a) !== jeSlozka(b)) return jeSlozka(a) ? -1 : 1;
    return a.jmeno.localeCompare(b.jmeno, "cs");
  });

  if (holy) {
    return { vystup: deti.map((d) => d.jmeno), stopy: ["prikaz:dir"] };
  }

  const radky = [
    " Svazek v jednotce C nemá popisek.",
    " Číslo svazku je 7A2C-9F31",
    "",
    ` Složka ${sloz(cil.cesta)}`,
    "",
  ];
  const radek = (datum: string, znacka: string, jmeno: string) =>
    `${datum.padEnd(20)}${znacka.padStart(14)} ${jmeno}`;
  if (cil.cesta.length > 1) {
    radky.push(radek(datumCas(slozka.zmeneno), "<DIR>", "."));
    radky.push(radek(datumCas(slozka.zmeneno), "<DIR>", ".."));
  }
  let souboru = 0;
  let bajtu = 0;
  for (const dite of deti) {
    if (jeSlozka(dite)) {
      radky.push(radek(datumCas(dite.zmeneno), "<DIR>", dite.jmeno));
    } else {
      souboru += 1;
      const v = velikost(dite);
      bajtu += v;
      radky.push(radek(datumCas(dite.zmeneno), cislo(v), dite.jmeno));
    }
  }
  const adresaru = deti.filter(jeSlozka).length + (cil.cesta.length > 1 ? 2 : 0);
  radky.push(`${String(souboru).padStart(16)} souborů ${cislo(bajtu).padStart(15)} bajtů`);
  radky.push(
    `${String(adresaru).padStart(16)} adresářů ${cislo(volnoNaDisku(ctx.disk)).padStart(14)} volných bajtů`,
  );
  return { vystup: radky, stopy: ["prikaz:dir"] };
}

function cmdCd(ctx: Kontext, argumenty: string[]): Vysledek {
  const kam = argumenty.find((a) => !jePrepinac(a));
  if (!kam) return { vystup: [sloz(ctx.cesta)] };
  const cil = najdiCil(ctx, kam);
  if (!cil || !cil.uzel) return { vystup: [chybiCesta(kam)], stopy: ["prikaz:cd"] };
  if (!jeSlozka(cil.uzel)) return { vystup: ["Název adresáře je neplatný."] };
  return { vystup: [], cesta: cil.cesta, stopy: ["prikaz:cd"] };
}

function cmdMd(ctx: Kontext, argumenty: string[]): Vysledek {
  const jmeno = argumenty.find((a) => !jePrepinac(a));
  if (!jmeno) return { vystup: ["Chybná syntaxe příkazu."] };
  const cil = najdiCil(ctx, jmeno);
  if (!cil) return { vystup: [chybiCesta(jmeno)] };
  if (cil.uzel) {
    return { vystup: [`Podadresář nebo soubor ${jmeno} již existuje.`], stopy: ["prikaz:md"] };
  }
  const rodic = najdiSlozku(ctx.disk, nadrazena(cil.cesta));
  if (!rodic) return { vystup: [chybiCesta(jmeno)] };
  const disk = vloz(ctx.disk, nadrazena(cil.cesta), novaSlozka(cil.cesta[cil.cesta.length - 1]));
  return { vystup: [], disk, stopy: ["prikaz:md"] };
}

function cmdRd(ctx: Kontext, argumenty: string[]): Vysledek {
  const rekurzivne = argumenty.some((a) => a.toLowerCase() === "/s");
  const jmeno = argumenty.find((a) => !jePrepinac(a));
  if (!jmeno) return { vystup: ["Chybná syntaxe příkazu."] };
  const cil = najdiCil(ctx, jmeno);
  if (!cil || !cil.uzel) return { vystup: [chybiCesta(jmeno)] };
  if (!jeSlozka(cil.uzel)) return { vystup: ["Název adresáře je neplatný."] };
  if (cil.uzel.zamceno) return { vystup: ["Přístup byl odepřen."] };
  if (cil.uzel.deti.length > 0 && !rekurzivne) {
    return { vystup: ["Adresář není prázdný."] };
  }
  return { vystup: [], disk: odeber(ctx.disk, cil.cesta) };
}

function cmdDel(ctx: Kontext, argumenty: string[]): Vysledek {
  const jmeno = argumenty.find((a) => !jePrepinac(a));
  if (!jmeno) return { vystup: ["Chybná syntaxe příkazu."] };
  const cil = najdiCil(ctx, jmeno);
  if (!cil || !cil.uzel) return { vystup: ["Nebyl nalezen soubor."] };
  if (jeSlozka(cil.uzel)) return { vystup: ["Přístup byl odepřen."] };
  if (cil.uzel.zamceno) return { vystup: ["Přístup byl odepřen."] };
  return { vystup: [], disk: odeber(ctx.disk, cil.cesta) };
}

function cmdKopiruj(ctx: Kontext, argumenty: string[], presun: boolean): Vysledek {
  const [zdroj, cil] = argumenty.filter((a) => !jePrepinac(a));
  if (!zdroj || !cil) return { vystup: ["Chybná syntaxe příkazu."] };
  const z = najdiCil(ctx, zdroj);
  if (!z || !z.uzel) return { vystup: ["Systém nemůže nalézt uvedený soubor."] };
  if (!presun && jeSlozka(z.uzel)) {
    return { vystup: ["Přístup byl odepřen.", "        0 souborů zkopírováno"] };
  }
  const c = najdiCil(ctx, cil);
  if (!c) return { vystup: [chybiCesta(cil)] };

  // Cíl může být existující složka (kopíruj dovnitř) nebo nové jméno.
  const doSlozky = c.uzel && jeSlozka(c.uzel);
  const kam = doSlozky ? c.cesta : nadrazena(c.cesta);
  const noveJmeno = doSlozky ? z.uzel.jmeno : c.cesta[c.cesta.length - 1];
  if (!najdiSlozku(ctx.disk, kam)) return { vystup: [chybiCesta(cil)] };

  const polozka: Uzel = { ...kopie(z.uzel), jmeno: noveJmeno, zmeneno: Date.now() };
  let disk = vloz(ctx.disk, kam, polozka);
  if (presun) disk = odeber(disk, z.cesta);
  return {
    vystup: presun ? ["        1 souborů přesunuto"] : ["        1 souborů zkopírováno"],
    disk,
  };
}

function cmdRen(ctx: Kontext, argumenty: string[]): Vysledek {
  const [co, jak] = argumenty.filter((a) => !jePrepinac(a));
  if (!co || !jak) return { vystup: ["Chybná syntaxe příkazu."] };
  const cil = najdiCil(ctx, co);
  if (!cil || !cil.uzel) return { vystup: ["Systém nemůže nalézt uvedený soubor."] };
  if (cil.uzel.zamceno) return { vystup: ["Přístup byl odepřen."] };
  const rodic = najdiSlozku(ctx.disk, nadrazena(cil.cesta));
  if (rodic?.deti.some((d) => d.jmeno.toLowerCase() === jak.toLowerCase())) {
    return { vystup: ["Soubor již existuje."] };
  }
  const disk = vloz(odeber(ctx.disk, cil.cesta), nadrazena(cil.cesta), {
    ...cil.uzel,
    jmeno: jak,
  });
  return { vystup: [], disk };
}

function cmdType(ctx: Kontext, argumenty: string[]): Vysledek {
  const jmeno = argumenty.find((a) => !jePrepinac(a));
  if (!jmeno) return { vystup: ["Chybná syntaxe příkazu."] };
  const cil = najdiCil(ctx, jmeno);
  if (!cil || !cil.uzel) return { vystup: ["Systém nemůže nalézt uvedený soubor."] };
  if (jeSlozka(cil.uzel)) return { vystup: ["Přístup byl odepřen."] };
  if (cil.uzel.obsah.startsWith("data:") || !cil.uzel.obsah) {
    return { vystup: ["  ␀ ␀ ␀   (binární soubor – výpis by byl nečitelný)"] };
  }
  return { vystup: cil.uzel.obsah.split("\n") };
}

function cmdStrom(ctx: Kontext, argumenty: string[]): Vysledek {
  const sSoubory = argumenty.some((a) => a.toLowerCase() === "/f");
  const kam = argumenty.find((a) => !jePrepinac(a));
  const cil = kam ? najdiCil(ctx, kam) : { cesta: ctx.cesta, uzel: najdi(ctx.disk, ctx.cesta) };
  if (!cil || !cil.uzel || !jeSlozka(cil.uzel)) return { vystup: [chybiCesta(kam ?? "")] };

  const radky = [`Výpis struktury složek`, `Sériové číslo svazku je 7A2C-9F31`, sloz(cil.cesta)];
  const projdi = (slozka: Slozka, predpona: string) => {
    const deti = slozka.deti.filter((d) => sSoubory || jeSlozka(d));
    deti.forEach((dite, i) => {
      const posledni = i === deti.length - 1;
      radky.push(`${predpona}${posledni ? "└── " : "├── "}${dite.jmeno}`);
      if (jeSlozka(dite)) projdi(dite, `${predpona}${posledni ? "    " : "│   "}`);
    });
  };
  projdi(cil.uzel, "");
  return { vystup: radky };
}

const IPCONFIG = [
  "",
  "Konfigurace protokolu IP systému Windows",
  "",
  "",
  "Adaptér sítě Ethernet Ethernet:",
  "",
  "   Přípona DNS podle připojení . . . : skola.local",
  "   Místní IPv6 adresa Link-local  . . : fe80::14c2:8b3f:9a21:5d07%12",
  "   Adresa IPv4. . . . . . . . . . . .: 10.20.3.147",
  "   Maska podsítě  . . . . . . . . . .: 255.255.255.0",
  "   Výchozí brána  . . . . . . . . . .: 10.20.3.1",
  "",
];

function systeminfo(ctx: Kontext): string[] {
  const pocet = pocetPolozek(ctx.disk);
  return [
    "",
    "Název hostitele:                          SPST-UCEBNA-14",
    "Název operačního systému:                 Microsoft Windows 11 Education",
    "Verze operačního systému:                 10.0.26100 Build 26100",
    "Výrobce operačního systému:               Microsoft Corporation",
    "Registrovaný vlastník:                    SPŠ Tábor",
    "Typ systému:                              x64-based PC",
    "Procesor(y):                              1 nainstalovaný procesor",
    "                                          Intel(R) Core(TM) i5-13400 @ 2.50GHz",
    "Celková velikost fyzické paměti:          16 384 MB",
    "Dostupná fyzická paměť:                   9 612 MB",
    `Souborů na disku C:                       ${cislo(pocet.souboru)}`,
    `Složek na disku C:                        ${cislo(pocet.slozek)}`,
    "",
  ];
}

const NAPOVEDA_CMD = [
  "Dostupné příkazy v tomto prostředí:",
  "",
  "CD / CHDIR     Změní aktuální složku nebo ji vypíše.",
  "CLS            Vymaže obrazovku.",
  "COPY           Zkopíruje soubor jinam.",
  "DEL / ERASE    Smaže soubor. POZOR: neputuje do Koše, mizí rovnou.",
  "DIR            Vypíše obsah složky. /B = jen jména.",
  "ECHO           Vypíše text.",
  "EXIT           Zavře kartu terminálu.",
  "HELP           Tento výpis.",
  "HOSTNAME       Název počítače.",
  "IPCONFIG       Nastavení sítě.",
  "MD / MKDIR     Vytvoří složku.",
  "MOVE           Přesune soubor nebo složku.",
  "PING           Ověří dostupnost počítače v síti.",
  "RD / RMDIR     Smaže složku. /S i s obsahem.",
  "REN / RENAME   Přejmenuje soubor nebo složku.",
  "SYSTEMINFO     Informace o počítači.",
  "TREE           Vykreslí strom složek. /F i se soubory.",
  "TYPE           Vypíše obsah textového souboru.",
  "VER            Verze systému.",
  "WHOAMI         Přihlášený uživatel.",
  "",
];

/* ───────────────────── PowerShell ───────────────────── */

function psVypis(ctx: Kontext, argumenty: string[]): Vysledek {
  const kam = argumenty.find((a) => !jePrepinac(a));
  const cil = kam ? najdiCil(ctx, kam) : { cesta: ctx.cesta, uzel: najdi(ctx.disk, ctx.cesta) };
  if (!cil || !cil.uzel || !jeSlozka(cil.uzel)) {
    return {
      vystup: [
        `Get-ChildItem : Cesta ${kam ?? ""} neexistuje, protože neexistuje.`,
      ],
      stopy: ["prikaz:get-childitem"],
    };
  }
  const deti = [...cil.uzel.deti].sort((a, b) => {
    if (jeSlozka(a) !== jeSlozka(b)) return jeSlozka(a) ? -1 : 1;
    return a.jmeno.localeCompare(b.jmeno, "cs");
  });
  const radky = [
    "",
    `    Directory: ${sloz(cil.cesta)}`,
    "",
    "Mode                 LastWriteTime         Length Name",
    "----                 -------------         ------ ----",
  ];
  for (const dite of deti) {
    const rezim = jeSlozka(dite) ? "d----" : "-a---";
    const delka = jeSlozka(dite) ? "" : cislo(velikost(dite));
    radky.push(
      `${rezim.padEnd(14)}${datumCas(dite.zmeneno).padStart(19)}${delka.padStart(15)} ${dite.jmeno}`,
    );
  }
  radky.push("");
  return { vystup: radky, stopy: ["prikaz:get-childitem"] };
}

const PROCESY_PS = [
  "",
  " NPM(K)    PM(M)      WS(M)     CPU(s)      Id  SI ProcessName",
  " ------    -----      -----     ------      --  -- -----------",
  "     42    18,52      64,31       3,42    1204   1 explorer",
  "     31    12,04      38,77       1,08    2680   1 msedge",
  "     18     6,41      19,22       0,31    3912   1 notepad",
  "     55    89,13     212,44      12,77    4128   1 System",
  "     22     9,88      27,10       0,52    5340   1 WindowsTerminal",
  "",
];

function psNewItem(ctx: Kontext, argumenty: string[]): Vysledek {
  // -ItemType Directory -Name X  |  -Path X -ItemType File
  let typ = "File";
  let jmeno: string | undefined;
  for (let i = 0; i < argumenty.length; i += 1) {
    const a = argumenty[i].toLowerCase();
    if (a === "-itemtype") typ = argumenty[i + 1] ?? "File";
    else if (a === "-name" || a === "-path") jmeno = argumenty[i + 1];
    else if (!jePrepinac(argumenty[i]) && !jmeno && argumenty[i - 1]?.toLowerCase() !== "-itemtype") {
      jmeno = argumenty[i];
    }
  }
  if (!jmeno) return { vystup: ["New-Item : Chybí povinný parametr -Path."] };
  const cil = najdiCil(ctx, jmeno);
  if (!cil) return { vystup: [chybiCesta(jmeno)] };
  if (cil.uzel) return { vystup: [`New-Item : Položka ${jmeno} už existuje.`] };
  const kratke = cil.cesta[cil.cesta.length - 1];
  const uzel = typ.toLowerCase().startsWith("d") ? novaSlozka(kratke) : novySoubor(kratke);
  const disk = vloz(ctx.disk, nadrazena(cil.cesta), uzel);
  return {
    vystup: [],
    disk,
    stopy: typ.toLowerCase().startsWith("d") ? ["prikaz:md"] : [],
  };
}

/* ───────────────────── Rozcestník ───────────────────── */

/** Uvítání na začátku karty. */
export function uvitani(rezim: Rezim): string[] {
  return rezim === "cmd"
    ? [
        "Microsoft Windows [Verze 10.0.26100.2033]",
        "(c) Microsoft Corporation. Všechna práva vyhrazena.",
        "",
      ]
    : [
        "Windows PowerShell",
        "(C) Microsoft Corporation. Všechna práva vyhrazena.",
        "",
        "Nainstalujte nejnovější PowerShell, kde najdete nové funkce a vylepšení!",
        "",
      ];
}

export function vyzva(rezim: Rezim, cesta: string[]): string {
  return rezim === "cmd" ? `${sloz(cesta)}>` : `PS ${sloz(cesta)}> `;
}

export function spust(radek: string, ctx: Kontext, rezim: Rezim): Vysledek {
  const kusy = rozdel(radek.trim());
  if (kusy.length === 0) return { vystup: [] };
  const prikaz = kusy[0].toLowerCase();
  const argumenty = kusy.slice(1);

  // Příkazy společné oběma prostředím.
  switch (prikaz) {
    case "cls":
    case "clear":
    case "clear-host":
      return { vystup: [], vycistit: true };
    case "exit":
      return { vystup: [], ukoncit: true };
    case "echo":
    case "write-output":
    case "write-host":
      return { vystup: [argumenty.join(" ") || (rezim === "cmd" ? "ECHO je zapnuto." : "")] };
    case "ver":
      return { vystup: ["", "Microsoft Windows [Verze 10.0.26100.2033]", ""] };
    case "hostname":
      return { vystup: ["SPST-UCEBNA-14"] };
    case "whoami":
      return { vystup: [`spst-ucebna-14\\${ctx.jmenoUctu.toLowerCase().replace(/\s+/g, "")}`] };
    case "ipconfig":
      return { vystup: IPCONFIG, stopy: ["prikaz:ipconfig"] };
    case "systeminfo":
      return { vystup: systeminfo(ctx) };
    case "ping": {
      const kam = argumenty.find((a) => !jePrepinac(a)) ?? "";
      if (!kam) return { vystup: ["Chybná syntaxe příkazu."] };
      return {
        vystup: [
          "",
          `Příkaz PING na ${kam} [10.20.3.1] s délkou 32 bajtů:`,
          "Odpověď od 10.20.3.1: bajty=32 čas=2ms TTL=64",
          "Odpověď od 10.20.3.1: bajty=32 čas=1ms TTL=64",
          "Odpověď od 10.20.3.1: bajty=32 čas=2ms TTL=64",
          "Odpověď od 10.20.3.1: bajty=32 čas=1ms TTL=64",
          "",
          `Statistika ping pro ${kam}:`,
          "    Pakety: Odeslané = 4, Přijaté = 4, Ztracené = 0 (0% ztráta),",
          "",
        ],
      };
    }
    default:
      break;
  }

  if (rezim === "cmd") {
    switch (prikaz) {
      case "dir":
        return cmdDir(ctx, argumenty);
      case "cd":
      case "chdir":
        return cmdCd(ctx, argumenty);
      case "md":
      case "mkdir":
        return cmdMd(ctx, argumenty);
      case "rd":
      case "rmdir":
        return cmdRd(ctx, argumenty);
      case "del":
      case "erase":
        return cmdDel(ctx, argumenty);
      case "copy":
        return cmdKopiruj(ctx, argumenty, false);
      case "move":
        return cmdKopiruj(ctx, argumenty, true);
      case "ren":
      case "rename":
        return cmdRen(ctx, argumenty);
      case "type":
        return cmdType(ctx, argumenty);
      case "tree":
        return cmdStrom(ctx, argumenty);
      case "date":
        return { vystup: [`Aktuální datum: ${datumCas(Date.now()).split(" ")[0]}`] };
      case "time":
        return { vystup: [`Aktuální čas: ${datumCas(Date.now()).split(" ")[1]}`] };
      case "help":
        return { vystup: NAPOVEDA_CMD };
      case "title":
        return { vystup: [] };
      default:
        return {
          vystup: [
            `'${kusy[0]}' není názvem vnitřního ani vnějšího příkazu,`,
            "spustitelného programu nebo dávkového souboru.",
          ],
        };
    }
  }

  // PowerShell
  switch (prikaz) {
    case "get-childitem":
    case "gci":
    case "ls":
    case "dir":
      return psVypis(ctx, argumenty);
    case "set-location":
    case "sl":
    case "cd":
      return cmdCd(ctx, argumenty);
    case "get-location":
    case "pwd":
      return { vystup: ["", "Path", "----", sloz(ctx.cesta), ""] };
    case "new-item":
    case "ni":
      return psNewItem(ctx, argumenty);
    case "mkdir":
    case "md":
      return cmdMd(ctx, argumenty);
    case "remove-item":
    case "ri":
    case "rm":
    case "del": {
      const vysledek = cmdDel(ctx, argumenty);
      return vysledek.disk ? vysledek : cmdRd(ctx, [...argumenty, "/s"]);
    }
    case "copy-item":
    case "cp":
    case "copy":
      return cmdKopiruj(ctx, argumenty, false);
    case "move-item":
    case "mv":
    case "move":
      return cmdKopiruj(ctx, argumenty, true);
    case "rename-item":
    case "ren":
      return cmdRen(ctx, argumenty);
    case "get-content":
    case "gc":
    case "cat":
    case "type":
      return cmdType(ctx, argumenty);
    case "get-process":
    case "ps":
      return { vystup: PROCESY_PS };
    case "get-date":
      return { vystup: ["", datumCas(Date.now()), ""] };
    case "tree":
      return cmdStrom(ctx, argumenty);
    case "$psversiontable":
      return {
        vystup: [
          "",
          "Name                           Value",
          "----                           -----",
          "PSVersion                      5.1.26100.2033",
          "PSEdition                      Desktop",
          "CLRVersion                     4.0.30319.42000",
          "",
        ],
      };
    case "help":
    case "get-help":
      return {
        vystup: [
          "",
          "V tomto prostředí fungují tyto rutiny:",
          "",
          "Get-ChildItem (gci, ls, dir)   Vypíše obsah složky.",
          "Set-Location (sl, cd)          Přejde do jiné složky.",
          "Get-Location (pwd)             Vypíše aktuální složku.",
          "New-Item -ItemType Directory   Vytvoří složku.",
          "Remove-Item (rm, del)          Smaže položku.",
          "Copy-Item / Move-Item          Zkopíruje / přesune položku.",
          "Rename-Item                    Přejmenuje položku.",
          "Get-Content (cat, type)        Vypíše obsah souboru.",
          "Get-Process (ps)               Vypíše běžící procesy.",
          "Get-Date                       Datum a čas.",
          "Clear-Host (cls)               Vymaže obrazovku.",
          "",
        ],
      };
    default:
      return {
        vystup: [
          `${kusy[0]} : Termín ${kusy[0]} není rozpoznán jako název rutiny, funkce,`,
          "souboru skriptu nebo spustitelného programu.",
        ],
      };
  }
}

/** Doplnění tabulátorem: názvy položek v aktuální složce podle rozepsaného. */
export function doplnit(ctx: Kontext, rozepsane: string): string[] {
  const slozka = najdiSlozku(ctx.disk, ctx.cesta);
  if (!slozka) return [];
  const zacatek = rozepsane.toLowerCase();
  return slozka.deti
    .filter((d) => d.jmeno.toLowerCase().startsWith(zacatek))
    .map((d) => (d.jmeno.includes(" ") ? `"${d.jmeno}"` : d.jmeno));
}

/** Pomůcka pro Průzkumník: unikátní jméno kopie („Poznámky – kopie.txt"). */
export function jmenoKopie(slozka: Slozka, puvodni: string): string {
  const tecka = puvodni.lastIndexOf(".");
  const navrh =
    tecka > 0
      ? `${puvodni.slice(0, tecka)} – kopie${puvodni.slice(tecka)}`
      : `${puvodni} – kopie`;
  return volneJmeno(slozka, navrh);
}

export { jeSoubor };
