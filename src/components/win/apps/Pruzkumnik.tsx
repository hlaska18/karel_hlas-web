"use client";

/**
 * Průzkumník souborů.
 *
 * Nejdůležitější aplikace celého prostředí – většina učiva o souborech se
 * odehraje tady. Proto se drží věrně předlohy včetně věcí, které vypadají
 * jako detail: skryté přípony u známých typů, česká jména systémových složek
 * proti anglickým na disku, velikost v kB vždy zaokrouhlená nahoru, koš jako
 * zvláštní místo mimo disk.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpFromLine,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Copy,
  FolderPlus,
  Info,
  LayoutGrid,
  List,
  PackageOpen,
  Pencil,
  Plus,
  RotateCw,
  Scissors,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Ikona, IkonaSouboru } from "../Ikona";
import { Dialog, IkonoveTlacitko, KontextovaNabidka, Tlacitko, useNabidka } from "../ui";
import { useOkno, useSystem } from "../system";
import {
  jeSlozka,
  jmenoJeVporadku,
  najdi,
  najdiSlozku,
  nadrazena,
  novaSlozka,
  novySoubor,
  odeber,
  pripona,
  rozloz,
  sloz,
  velikost,
  vloz,
  volneJmeno,
  zaklad,
  type Slozka,
  type Uzel,
} from "@/lib/win/fs";
import {
  datumCas,
  datumDlouhy,
  velikostPodrobne,
  velikostSloupec,
  velikostText,
} from "@/lib/win/format";
import { NAZEV_DISKU, NAZEV_POCITACE, zobrazeneJmeno, KAPACITA_DISKU, OBSAZENO_SYSTEMEM } from "@/lib/win/nazvy";
import { typSouboru, znamaPripona } from "@/lib/win/typy";
import { komprimovanaVelikost, rozbal } from "@/lib/win/zip";
import {
  KOS,
  POCITAC,
  RYCHLY_PRISTUP,
  cestaZTextu,
  doSchranky,
  hledej,
  jeZvlastni,
  obnovZKose,
  smazDoKose,
  vloz_ze_schranky,
} from "@/lib/win/operace";

type Zobrazeni = "podrobnosti" | "ikony" | "dlazdice";
type Razeni = "nazev" | "datum" | "typ" | "velikost";

interface Karta {
  id: number;
  historie: string[];
  index: number;
}

const DOMOV = "C:\\Users\\Zak";

/** Položka připravená k vykreslení – sjednocuje disk, koš i archiv. */
interface Radek {
  uzel: Uzel;
  /** Cesta k položce; u koše a archivu jen pro popis. */
  cesta: string[];
  /** Doplňkový sloupec (původní umístění v koši). */
  navic?: string;
  /** Jen ke čtení – uvnitř archivu a v koši se nepřejmenovává. */
  jenCist?: boolean;
}

export function Pruzkumnik() {
  const { stav, poslat, spust, stopa } = useSystem();
  const { arg, nastavTitul, slotZahlavi } = useOkno();
  const { disk, nastaveni, schranka } = stav;

  const [karty, nastavKarty] = useState<Karta[]>(() => [
    { id: 1, historie: [arg && !jeZvlastni(arg) ? arg : (arg ?? DOMOV)], index: 0 },
  ]);
  const [aktivniKarta, nastavAktivni] = useState(1);
  const [vyber, nastavVyber] = useState<string[]>([]);
  const [zobrazeni, nastavZobrazeni] = useState<Zobrazeni>("podrobnosti");
  const [razeni, nastavRazeni] = useState<Razeni>("nazev");
  const [vzestupne, nastavSmer] = useState(true);
  const [dotaz, nastavDotaz] = useState("");
  const [prejmenovava, nastavPrejmenovava] = useState<string | null>(null);
  const [navrhJmena, nastavNavrh] = useState("");
  const [vlastnostiPro, nastavVlastnosti] = useState<string | null>(null);
  const [nelzeOtevrit, nastavNelze] = useState<{ jmeno: string; duvod: string } | null>(null);
  const [chyba, nastavChybu] = useState<string | null>(null);
  const nabidka = useNabidka();
  const obal = useRef<HTMLDivElement>(null);
  const poleJmena = useRef<HTMLInputElement>(null);

  const karta = karty.find((k) => k.id === aktivniKarta) ?? karty[0];
  const kde = karta.historie[karta.index];
  const casti = useMemo(() => rozloz(kde), [kde]);

  /* ───────── obsah aktuálního místa ───────── */

  /** Archiv v cestě: `C:\…\Archiv.zip\Podsložka`. Uvnitř se jen čte. */
  const vArchivu = useMemo(
    () => casti.findIndex((c) => pripona(c) === "zip"),
    [casti],
  );

  const radky: Radek[] | null = useMemo(() => {
    if (kde === KOS) {
      return stav.kos.map((p) => ({
        uzel: p.uzel,
        cesta: [...p.puvod, p.uzel.jmeno],
        navic: sloz(p.puvod),
        jenCist: true,
      }));
    }
    if (kde === POCITAC) return [];
    if (vArchivu !== -1) {
      const soubor = najdi(disk, casti.slice(0, vArchivu + 1));
      if (!soubor || jeSlozka(soubor)) return null;
      let uzly: Uzel[] | null = rozbal(soubor);
      if (!uzly) return null;
      for (const cast of casti.slice(vArchivu + 1)) {
        const dalsi: Uzel | undefined = uzly.find(
          (u) => u.jmeno.toLowerCase() === cast.toLowerCase(),
        );
        if (!dalsi || !jeSlozka(dalsi)) return null;
        uzly = dalsi.deti;
      }
      return uzly.map((u) => ({ uzel: u, cesta: [...casti, u.jmeno], jenCist: true }));
    }
    const slozka = najdiSlozku(disk, casti);
    if (!slozka) return null;
    return slozka.deti.map((u) => ({ uzel: u, cesta: [...casti, u.jmeno] }));
  }, [kde, casti, disk, stav.kos, vArchivu]);

  const nalezy = useMemo(
    () => (dotaz.trim() && !jeZvlastni(kde) ? hledej(disk, casti, dotaz) : null),
    [dotaz, disk, casti, kde],
  );

  const viditelne = useMemo(() => {
    const zaklad: Radek[] = nalezy
      ? nalezy.map((n) => ({ uzel: n.uzel, cesta: n.cesta, navic: sloz(nadrazena(n.cesta)) }))
      : (radky ?? []);
    const filtrovane = nastaveni.skrytePolozky
      ? zaklad
      : zaklad.filter((r) => !r.uzel.skryty);
    const smer = vzestupne ? 1 : -1;
    return [...filtrovane].sort((a, b) => {
      // Složky jsou vždycky první, bez ohledu na zvolené řazení.
      if (jeSlozka(a.uzel) !== jeSlozka(b.uzel)) return jeSlozka(a.uzel) ? -1 : 1;
      switch (razeni) {
        case "datum":
          return (a.uzel.zmeneno - b.uzel.zmeneno) * smer;
        case "typ":
          return (
            typSouboru(a.uzel.jmeno).popis.localeCompare(typSouboru(b.uzel.jmeno).popis, "cs") *
            smer
          );
        case "velikost":
          return (velikost(a.uzel) - velikost(b.uzel)) * smer;
        default:
          return a.uzel.jmeno.localeCompare(b.uzel.jmeno, "cs") * smer;
      }
    });
  }, [radky, nalezy, nastaveni.skrytePolozky, razeni, vzestupne]);

  /* ───────── navigace ───────── */

  const jdi = useCallback(
    (kam: string) => {
      nastavKarty((staré) =>
        staré.map((k) =>
          k.id === aktivniKarta
            ? { ...k, historie: [...k.historie.slice(0, k.index + 1), kam], index: k.index + 1 }
            : k,
        ),
      );
      nastavVyber([]);
      nastavDotaz("");
      nastavPrejmenovava(null);
    },
    [aktivniKarta],
  );

  const nazevMista = useCallback(
    (misto: string) =>
      misto === KOS ? "Koš" : misto === POCITAC ? NAZEV_POCITACE : zobrazeneJmeno(rozloz(misto)),
    [],
  );

  useEffect(() => {
    nastavTitul(nazevMista(kde), kde);
  }, [kde, nastavTitul, nazevMista]);

  const zpet = () => {
    if (karta.index > 0) {
      nastavKarty((s) => s.map((k) => (k.id === karta.id ? { ...k, index: k.index - 1 } : k)));
      nastavVyber([]);
    }
  };
  const vpred = () => {
    if (karta.index < karta.historie.length - 1) {
      nastavKarty((s) => s.map((k) => (k.id === karta.id ? { ...k, index: k.index + 1 } : k)));
      nastavVyber([]);
    }
  };
  const nahoru = () => {
    if (jeZvlastni(kde)) return jdi(DOMOV);
    if (casti.length > 1) jdi(sloz(nadrazena(casti)));
    else jdi(POCITAC);
  };

  /* ───────── otevírání ───────── */

  function otevri(radek: Radek) {
    if (jeSlozka(radek.uzel)) {
      jdi(kde === KOS ? sloz(radek.cesta) : sloz([...casti, radek.uzel.jmeno]));
      return;
    }
    if (kde === KOS) {
      nastavChybu(
        "Položku v Koši nelze otevřít. Nejdřív ji obnov na původní místo, nebo ji odtud přesuň.",
      );
      return;
    }
    if (pripona(radek.uzel.jmeno) === "zip" && rozbal(radek.uzel as never)) {
      jdi(sloz([...casti, radek.uzel.jmeno]));
      return;
    }
    const typ = typSouboru(radek.uzel.jmeno);
    if (!typ.app) {
      stopa(`neotevreno:${pripona(radek.uzel.jmeno)}`);
      nastavNelze({
        jmeno: radek.uzel.jmeno,
        duvod: typ.duvod ?? "Pro tento typ souboru není přiřazená žádná aplikace.",
      });
      return;
    }
    spust(typ.app, sloz(radek.cesta));
  }

  /* ───────── operace ───────── */

  const vybraneCesty = () => vyber.map((j) => [...casti, j]);

  const kopiruj = (vyjmout: boolean) => {
    if (vArchivu !== -1 || kde === KOS || vyber.length === 0) return;
    const s = doSchranky(disk, vybraneCesty(), vyjmout);
    if (s) poslat({ typ: "schranka/nastav", schranka: s });
  };

  const vlozSem = () => {
    if (!schranka || vArchivu !== -1 || jeZvlastni(kde)) return;
    const vysledek = vloz_ze_schranky(disk, schranka, casti);
    if (vysledek.chyba) {
      nastavChybu(vysledek.chyba);
      return;
    }
    poslat({ typ: "disk/nastav", disk: vysledek.disk });
    poslat({ typ: "schranka/nastav", schranka: vysledek.schranka });
  };

  const smaz = () => {
    if (kde === KOS) {
      vyber.forEach((jmeno) => {
        const polozka = stav.kos.find((p) => p.uzel.jmeno === jmeno);
        if (polozka) poslat({ typ: "kos/odeber", id: polozka.id });
      });
      nastavVyber([]);
      return;
    }
    if (vArchivu !== -1 || vyber.length === 0) return;
    const vysledek = smazDoKose(disk, vybraneCesty());
    poslat({ typ: "disk/nastav", disk: vysledek.disk });
    poslat({ typ: "kos/vloz", polozky: vysledek.polozky });
    if (vysledek.odepreno.length) {
      nastavChybu(
        `Položku ${vysledek.odepreno[0]} nelze odstranit – je součástí systému a je chráněná.`,
      );
    }
    nastavVyber([]);
  };

  const obnovZKoseVyber = () => {
    // Obnovuje se po jedné, ale do stavu se pošle až výsledek – jinak by se
    // druhá položka vracela do disku, který o té první ještě neví.
    let novy = disk;
    const obnovene = stav.kos.filter((p) => vyber.includes(p.uzel.jmeno));
    obnovene.forEach((p) => {
      novy = obnovZKose(novy, p);
    });
    if (obnovene.length === 0) return;
    poslat({ typ: "disk/nastav", disk: novy });
    obnovene.forEach((p) => poslat({ typ: "kos/odeber", id: p.id }));
    stopa("kos:obnoveno");
    nastavVyber([]);
  };

  const zacniPrejmenovat = (jmeno: string) => {
    nastavPrejmenovava(jmeno);
    // Když jsou přípony schované, upravuje se jen jméno – přípona zůstává.
    const skryta = !nastaveni.pripony && znamaPripona(jmeno);
    nastavNavrh(skryta ? zaklad(jmeno) : jmeno);
    window.setTimeout(() => poleJmena.current?.select(), 20);
  };

  const dokonciPrejmenovani = () => {
    const stare = prejmenovava;
    nastavPrejmenovava(null);
    if (!stare) return;
    const skryta = !nastaveni.pripony && znamaPripona(stare);
    const nove = skryta ? `${navrhJmena}.${pripona(stare)}` : navrhJmena;
    if (!nove || nove === stare) return;
    const problem = jmenoJeVporadku(nove);
    if (problem) {
      nastavChybu(problem);
      return;
    }
    const slozka = najdiSlozku(disk, casti);
    if (slozka?.deti.some((d) => d.jmeno.toLowerCase() === nove.toLowerCase())) {
      nastavChybu(`V této složce už soubor nebo složka s názvem ${nove} existuje.`);
      return;
    }
    const uzel = najdi(disk, [...casti, stare]);
    if (!uzel) return;
    if (uzel.zamceno) {
      nastavChybu("Tuto položku nelze přejmenovat – je součástí systému.");
      return;
    }
    poslat({
      typ: "disk/nastav",
      disk: vloz(odeber(disk, [...casti, stare]), casti, {
        ...uzel,
        jmeno: nove,
        zmeneno: Date.now(),
      }),
    });
    nastavVyber([nove]);
    // Změna přípony je poučná chvíle – ať si žák všimne, co tím způsobil.
    if (pripona(stare) !== pripona(nove) && !skryta) stopa("pripona:zmenena");
  };

  const novaPolozka = (typ: "slozka" | "text") => {
    if (jeZvlastni(kde) || vArchivu !== -1) return;
    const slozka = najdiSlozku(disk, casti);
    if (!slozka) return;
    const jmeno =
      typ === "slozka"
        ? volneJmeno(slozka, "Nová složka")
        : volneJmeno(slozka, "Nový textový dokument.txt");
    poslat({
      typ: "disk/nastav",
      disk: vloz(disk, casti, typ === "slozka" ? novaSlozka(jmeno) : novySoubor(jmeno)),
    });
    nastavVyber([jmeno]);
    window.setTimeout(() => zacniPrejmenovat(jmeno), 30);
  };

  const zabalVyber = () => {
    if (vyber.length === 0 || jeZvlastni(kde) || vArchivu !== -1) return;
    const slozka = najdiSlozku(disk, casti);
    if (!slozka) return;
    const uzly = vyber
      .map((j) => najdi(disk, [...casti, j]))
      .filter((u): u is Uzel => u !== null);
    const jmeno = volneJmeno(
      slozka,
      `${vyber.length === 1 ? zaklad(vyber[0]) : zobrazeneJmeno(casti)}.zip`,
    );
    poslat({
      typ: "disk/nastav",
      disk: vloz(disk, casti, {
        druh: "soubor",
        jmeno,
        obsah: JSON.stringify({ hlavicka: "PK-VYUKA-ZIP-1", polozky: uzly }),
        velikost: komprimovanaVelikost(uzly),
        zmeneno: Date.now(),
      }),
    });
    stopa("zip:vytvoren");
    nastavVyber([jmeno]);
  };

  const rozbalArchiv = (jmenoArchivu: string) => {
    const soubor = najdi(disk, [...casti, jmenoArchivu]);
    if (!soubor || jeSlozka(soubor)) return;
    const uzly = rozbal(soubor);
    if (!uzly) return;
    const slozka = najdiSlozku(disk, casti);
    if (!slozka) return;
    const cilJmeno = volneJmeno(slozka, zaklad(jmenoArchivu));
    let novy = vloz(disk, casti, { ...novaSlozka(cilJmeno), deti: uzly });
    poslat({ typ: "disk/nastav", disk: novy });
    nastavVyber([cilJmeno]);
  };

  /* ───────── klávesnice ───────── */

  useEffect(() => {
    const naKlavesu = (e: KeyboardEvent) => {
      const cil = e.target as HTMLElement;
      if (cil.tagName === "INPUT" || cil.tagName === "TEXTAREA") return;
      if (!obal.current?.contains(document.activeElement) && document.activeElement !== document.body)
        return;
      if (e.key === "F2" && vyber.length === 1) {
        e.preventDefault();
        zacniPrejmenovat(vyber[0]);
      } else if (e.key === "Delete") {
        e.preventDefault();
        smaz();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        nahoru();
      } else if (e.ctrlKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        nastavVyber(viditelne.map((r) => r.uzel.jmeno));
      } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
        kopiruj(false);
      } else if (e.ctrlKey && e.key.toLowerCase() === "x") {
        kopiruj(true);
      } else if (e.ctrlKey && e.key.toLowerCase() === "v") {
        vlozSem();
      } else if (e.key === "Enter" && vyber.length === 1) {
        const radek = viditelne.find((r) => r.uzel.jmeno === vyber[0]);
        if (radek) otevri(radek);
      }
    };
    window.addEventListener("keydown", naKlavesu);
    return () => window.removeEventListener("keydown", naKlavesu);
  });

  useEffect(() => {
    if (dotaz.trim().length >= 2) stopa("pruzkumnik:hledano");
  }, [dotaz, stopa]);

  /* ───────── výběr ───────── */

  const klikNaPolozku = (e: React.MouseEvent, jmeno: string) => {
    if (e.ctrlKey) {
      nastavVyber((v) => (v.includes(jmeno) ? v.filter((j) => j !== jmeno) : [...v, jmeno]));
    } else if (e.shiftKey && vyber.length) {
      const jmena = viditelne.map((r) => r.uzel.jmeno);
      const od = jmena.indexOf(vyber[vyber.length - 1]);
      const do_ = jmena.indexOf(jmeno);
      const [a, b] = od < do_ ? [od, do_] : [do_, od];
      nastavVyber(jmena.slice(a, b + 1));
    } else {
      nastavVyber([jmeno]);
    }
  };

  /* ───────── nabídky ───────── */

  const nabidkaPolozky = (radek: Radek) => {
    const jeArchiv = pripona(radek.uzel.jmeno) === "zip";
    if (kde === KOS) {
      return [
        { id: "obnov", nazev: "Obnovit", ikona: <RotateCw className="h-4 w-4" />, akce: obnovZKoseVyber },
        { id: "c1", cara: true },
        { id: "smaz", nazev: "Odstranit", ikona: <Trash2 className="h-4 w-4" />, akce: smaz },
      ];
    }
    return [
      { id: "otevri", nazev: "Otevřít", akce: () => otevri(radek) },
      ...(jeArchiv
        ? [
            {
              id: "extrahuj",
              nazev: "Extrahovat vše…",
              ikona: <PackageOpen className="h-4 w-4" />,
              akce: () => rozbalArchiv(radek.uzel.jmeno),
            },
          ]
        : []),
      { id: "c1", cara: true },
      {
        id: "vyjmi",
        nazev: "Vyjmout",
        zkratka: "Ctrl+X",
        ikona: <Scissors className="h-4 w-4" />,
        nedostupne: !!radek.jenCist,
        akce: () => kopiruj(true),
      },
      {
        id: "kopiruj",
        nazev: "Kopírovat",
        zkratka: "Ctrl+C",
        ikona: <Copy className="h-4 w-4" />,
        akce: () => kopiruj(false),
      },
      {
        id: "prejmenuj",
        nazev: "Přejmenovat",
        zkratka: "F2",
        ikona: <Pencil className="h-4 w-4" />,
        nedostupne: !!radek.jenCist || !!radek.uzel.zamceno,
        akce: () => zacniPrejmenovat(radek.uzel.jmeno),
      },
      {
        id: "zip",
        nazev: "Komprimovat do souboru ZIP",
        nedostupne: !!radek.jenCist,
        akce: zabalVyber,
      },
      {
        id: "smaz",
        nazev: "Odstranit",
        zkratka: "Del",
        ikona: <Trash2 className="h-4 w-4" />,
        nedostupne: !!radek.jenCist || !!radek.uzel.zamceno,
        akce: smaz,
      },
      { id: "c2", cara: true },
      {
        id: "vlastnosti",
        nazev: "Vlastnosti",
        zkratka: "Alt+Enter",
        ikona: <Info className="h-4 w-4" />,
        akce: () => nastavVlastnosti(radek.uzel.jmeno),
      },
    ];
  };

  const nabidkaPozadi = () => [
    {
      id: "novy",
      nazev: "Nový",
      ikona: <Plus className="h-4 w-4" />,
      podnabidka: [
        {
          id: "slozka",
          nazev: "Složka",
          ikona: <Ikona klic="slozka" velikost={16} />,
          akce: () => novaPolozka("slozka"),
        },
        {
          id: "text",
          nazev: "Textový dokument",
          ikona: <Ikona klic="text" velikost={16} />,
          akce: () => novaPolozka("text"),
        },
      ],
    },
    {
      id: "vloz",
      nazev: "Vložit",
      zkratka: "Ctrl+V",
      ikona: <ClipboardPaste className="h-4 w-4" />,
      nedostupne: !schranka,
      akce: vlozSem,
    },
    { id: "c1", cara: true },
    {
      id: "aktualizovat",
      nazev: "Aktualizovat",
      ikona: <RotateCw className="h-4 w-4" />,
      akce: () => nastavVyber([]),
    },
  ];

  /* ───────── vykreslení ───────── */

  const polozkaProVlastnosti = vlastnostiPro
    ? (radky ?? []).find((r) => r.uzel.jmeno === vlastnostiPro)
    : null;

  return (
    <div
      ref={obal}
      tabIndex={-1}
      className="win-bezvyberu flex h-full flex-col bg-win-plocha text-[13px] outline-none"
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest("[data-polozka]")) return;
        nastavVyber([]);
        nabidka.otevri(e, nabidkaPozadi(), obal.current);
      }}
    >
      {slotZahlavi &&
        createPortal(
          <Karty
            karty={karty}
            aktivni={aktivniKarta}
            nazev={nazevMista}
            onPrepni={(id) => {
              nastavAktivni(id);
              nastavVyber([]);
            }}
            onZavri={(id) => {
              if (karty.length === 1) return;
              nastavKarty((s) => s.filter((k) => k.id !== id));
              if (aktivniKarta === id) nastavAktivni(karty.find((k) => k.id !== id)!.id);
            }}
            onNova={() => {
              const id = Math.max(...karty.map((k) => k.id)) + 1;
              nastavKarty((s) => [...s, { id, historie: [DOMOV], index: 0 }]);
              nastavAktivni(id);
              nastavVyber([]);
            }}
          />,
          slotZahlavi,
        )}

      <PruhPrikazu
        vyber={vyber}
        kde={kde}
        jenCist={vArchivu !== -1 || jeZvlastni(kde)}
        maSchranku={!!schranka}
        zobrazeni={zobrazeni}
        razeni={razeni}
        vzestupne={vzestupne}
        nastaveni={nastaveni}
        onNova={novaPolozka}
        onKopiruj={kopiruj}
        onVloz={vlozSem}
        onPrejmenuj={() => vyber.length === 1 && zacniPrejmenovat(vyber[0])}
        onSmaz={smaz}
        onZip={zabalVyber}
        onZobrazeni={nastavZobrazeni}
        onRazeni={(r) => {
          if (r === razeni) nastavSmer((s) => !s);
          else {
            nastavRazeni(r);
            nastavSmer(true);
          }
        }}
        onNastaveni={(zmena) => poslat({ typ: "nastaveni/zmen", zmena })}
        onObnovKos={obnovZKoseVyber}
        onVysypKos={() => {
          poslat({ typ: "kos/vyprazdni" });
          nastavVyber([]);
        }}
        pocetVKosi={stav.kos.length}
      />

      {/* Adresní řádek */}
      <div className="flex h-10 shrink-0 items-center gap-1 px-2 pb-1">
        <IkonoveTlacitko aria-label="Zpět" disabled={karta.index === 0} onClick={zpet}>
          <ArrowLeft className="h-4 w-4" />
        </IkonoveTlacitko>
        <IkonoveTlacitko
          aria-label="Vpřed"
          disabled={karta.index >= karta.historie.length - 1}
          onClick={vpred}
        >
          <ArrowRight className="h-4 w-4" />
        </IkonoveTlacitko>
        <IkonoveTlacitko aria-label="Nahoru" onClick={nahoru}>
          <ArrowUp className="h-4 w-4" />
        </IkonoveTlacitko>
        <Drobecky kde={kde} onJdi={jdi} />
        <div className="relative w-56 shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-win-slaby" />
          <input
            value={dotaz}
            onChange={(e) => nastavDotaz(e.target.value)}
            placeholder={`Hledat: ${nazevMista(kde)}`}
            aria-label="Hledat"
            className="h-8 w-full rounded border border-win-linka bg-win-povrch pl-8 pr-2 text-[12px] outline-none focus:border-win-akcent"
          />
        </div>
      </div>

      {/* Tělo: postranní panel + obsah */}
      <div className="flex min-h-0 flex-1">
        <Postranni kde={kde} onJdi={jdi} pocetVKosi={stav.kos.length} />
        <div className="win-posuv min-h-0 flex-1 overflow-auto bg-win-povrch">
          {kde === POCITAC ? (
            <TentoPocitac disk={disk} onJdi={jdi} />
          ) : radky === null ? (
            <div className="p-8 text-center text-win-slaby">
              Toto umístění už neexistuje. Zkus se vrátit zpět.
            </div>
          ) : viditelne.length === 0 ? (
            <div className="p-10 text-center text-win-slaby">
              {nalezy ? "Žádné položky neodpovídají hledání." : "Tato složka je prázdná."}
            </div>
          ) : zobrazeni === "podrobnosti" ? (
            <TabulkaPolozek
              radky={viditelne}
              vyber={vyber}
              kde={kde}
              pripony={nastaveni.pripony}
              razeni={razeni}
              vzestupne={vzestupne}
              prejmenovava={prejmenovava}
              navrhJmena={navrhJmena}
              poleJmena={poleJmena}
              onNavrh={nastavNavrh}
              onDokonci={dokonciPrejmenovani}
              onKlik={klikNaPolozku}
              onOtevri={otevri}
              onNabidka={(e, r) => {
                if (!vyber.includes(r.uzel.jmeno)) nastavVyber([r.uzel.jmeno]);
                nabidka.otevri(e, nabidkaPolozky(r), obal.current);
              }}
              onRazeni={(r) => {
                if (r === razeni) nastavSmer((s) => !s);
                else {
                  nastavRazeni(r);
                  nastavSmer(true);
                }
              }}
            />
          ) : (
            <MrizkaPolozek
              radky={viditelne}
              vyber={vyber}
              pripony={nastaveni.pripony}
              velke={zobrazeni === "ikony"}
              prejmenovava={prejmenovava}
              navrhJmena={navrhJmena}
              poleJmena={poleJmena}
              onNavrh={nastavNavrh}
              onDokonci={dokonciPrejmenovani}
              onKlik={klikNaPolozku}
              onOtevri={otevri}
              onNabidka={(e, r) => {
                if (!vyber.includes(r.uzel.jmeno)) nastavVyber([r.uzel.jmeno]);
                nabidka.otevri(e, nabidkaPolozky(r), obal.current);
              }}
            />
          )}
        </div>
      </div>

      {/* Stavový řádek */}
      <div className="flex h-6 shrink-0 items-center gap-4 border-t border-win-linka bg-win-plocha px-3 text-[11px] text-win-slaby">
        <span>{viditelne.length} položek</span>
        {vyber.length > 0 && (
          <span>
            Vybráno: {vyber.length}{" "}
            {vyber.length === 1 ? "položka" : vyber.length < 5 ? "položky" : "položek"}
            {" · "}
            {velikostSloupec(
              viditelne
                .filter((r) => vyber.includes(r.uzel.jmeno))
                .reduce((s, r) => s + velikost(r.uzel), 0),
            )}
          </span>
        )}
        {vArchivu !== -1 && <span>Obsah archivu – položky jde jen prohlížet.</span>}
      </div>

      {nabidka.misto && <KontextovaNabidka misto={nabidka.misto} zavri={nabidka.zavri} />}

      {polozkaProVlastnosti && (
        <VlastnostiDialog
          radek={polozkaProVlastnosti}
          slozka={casti}
          onZavrit={() => nastavVlastnosti(null)}
          onOtevreno={(jmeno) => stopa(`vlastnosti:${jmeno}`)}
        />
      )}

      {nelzeOtevrit && (
        <Dialog
          nadpis="Jak chcete tento soubor otevřít?"
          onZavrit={() => nastavNelze(null)}
          tlacitka={
            <Tlacitko vzhled="akcent" onClick={() => nastavNelze(null)}>
              Rozumím
            </Tlacitko>
          }
        >
          <p>
            Soubor <strong>{nelzeOtevrit.jmeno}</strong> se nepodařilo otevřít.
          </p>
          <p className="mt-2 text-win-slaby">{nelzeOtevrit.duvod}</p>
          <p className="mt-3">
            Přípona neurčuje, co je uvnitř souboru – určuje, kterou aplikaci Windows
            zkusí zavolat. Když ta aplikace v počítači není, soubor zůstane zavřený,
            i když je úplně v pořádku.
          </p>
        </Dialog>
      )}

      {chyba && (
        <Dialog
          nadpis="Průzkumník souborů"
          onZavrit={() => nastavChybu(null)}
          tlacitka={
            <Tlacitko vzhled="akcent" onClick={() => nastavChybu(null)}>
              OK
            </Tlacitko>
          }
        >
          {chyba}
        </Dialog>
      )}
    </div>
  );
}

/**
 * Název tak, jak ho ukáže Průzkumník.
 *
 * U složek se uplatní český překlad systémových jmen (`Desktop` → `Plocha`),
 * u souborů skrytá přípona. Obojí je vidět jen tady – v terminálu se pořád
 * jmenují tak, jak jsou zapsané na disku, a přesně o ten rozdíl jde.
 */
function zobrazJmeno(uzel: Uzel, pripony: boolean, cesta?: string[]): string {
  if (jeSlozka(uzel)) return cesta ? zobrazeneJmeno(cesta) : uzel.jmeno;
  if (pripony || !znamaPripona(uzel.jmeno)) return uzel.jmeno;
  return zaklad(uzel.jmeno);
}

/* ───────────────────────── Karty v záhlaví ───────────────────────── */

function Karty({
  karty,
  aktivni,
  nazev,
  onPrepni,
  onZavri,
  onNova,
}: {
  karty: Karta[];
  aktivni: number;
  nazev: (misto: string) => string;
  onPrepni: (id: number) => void;
  onZavri: (id: number) => void;
  onNova: () => void;
}) {
  return (
    <div className="flex h-8 min-w-0 items-end gap-0.5 overflow-hidden">
      {karty.map((k) => {
        const jeAktivni = k.id === aktivni;
        return (
          <div
            key={k.id}
            className={`group flex h-[30px] min-w-0 max-w-[190px] shrink items-center gap-2 rounded-t-md pl-2.5 pr-1 text-[12px] ${
              jeAktivni ? "bg-win-plocha" : "hover:bg-win-zvyrazneny/70"
            }`}
          >
            <button
              type="button"
              onClick={() => onPrepni(k.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <Ikona klic="pruzkumnik" velikost={14} />
              <span className="truncate">{nazev(k.historie[k.index])}</span>
            </button>
            {karty.length > 1 && (
              <button
                type="button"
                aria-label="Zavřít kartu"
                onClick={() => onZavri(k.id)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 hover:bg-win-linka group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        aria-label="Nová karta"
        onClick={onNova}
        className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-win-zvyrazneny"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ───────────────────────── Pruh příkazů ───────────────────────── */

function PruhPrikazu({
  vyber,
  kde,
  jenCist,
  maSchranku,
  zobrazeni,
  razeni,
  vzestupne,
  nastaveni,
  onNova,
  onKopiruj,
  onVloz,
  onPrejmenuj,
  onSmaz,
  onZip,
  onZobrazeni,
  onRazeni,
  onNastaveni,
  onObnovKos,
  onVysypKos,
  pocetVKosi,
}: {
  vyber: string[];
  kde: string;
  jenCist: boolean;
  maSchranku: boolean;
  zobrazeni: Zobrazeni;
  razeni: Razeni;
  vzestupne: boolean;
  nastaveni: { pripony: boolean; skrytePolozky: boolean };
  onNova: (typ: "slozka" | "text") => void;
  onKopiruj: (vyjmout: boolean) => void;
  onVloz: () => void;
  onPrejmenuj: () => void;
  onSmaz: () => void;
  onZip: () => void;
  onZobrazeni: (z: Zobrazeni) => void;
  onRazeni: (r: Razeni) => void;
  onNastaveni: (zmena: { pripony?: boolean; skrytePolozky?: boolean }) => void;
  onObnovKos: () => void;
  onVysypKos: () => void;
  pocetVKosi: number;
}) {
  const [otevrena, nastavOtevrenou] = useState<"novy" | "radit" | "zobrazit" | null>(null);
  const obal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zavri = (e: PointerEvent) => {
      if (obal.current && !obal.current.contains(e.target as Node)) nastavOtevrenou(null);
    };
    window.addEventListener("pointerdown", zavri);
    return () => window.removeEventListener("pointerdown", zavri);
  }, []);

  const nic = vyber.length === 0;

  if (kde === KOS) {
    return (
      <div className="flex h-11 shrink-0 items-center gap-1 px-2">
        <Tlacitko vzhled="tichy" disabled={nic} onClick={onObnovKos}>
          <RotateCw className="h-4 w-4" /> Obnovit vybrané položky
        </Tlacitko>
        <Tlacitko vzhled="tichy" disabled={pocetVKosi === 0} onClick={onVysypKos}>
          <Trash2 className="h-4 w-4" /> Vysypat koš
        </Tlacitko>
      </div>
    );
  }

  return (
    <div ref={obal} className="relative flex h-11 shrink-0 items-center gap-0.5 px-2">
      <div className="relative">
      <Tlacitko
        vzhled="tichy"
        disabled={jenCist}
        onClick={() => nastavOtevrenou((o) => (o === "novy" ? null : "novy"))}
      >
        <Plus className="h-4 w-4" /> Nový <ChevronDown className="h-3 w-3" />
      </Tlacitko>
      {otevrena === "novy" && (
        <Panel>
          <PolozkaPanelu ikona={<Ikona klic="slozka" velikost={16} />} onClick={() => { onNova("slozka"); nastavOtevrenou(null); }}>
            Složka
          </PolozkaPanelu>
          <PolozkaPanelu ikona={<Ikona klic="text" velikost={16} />} onClick={() => { onNova("text"); nastavOtevrenou(null); }}>
            Textový dokument
          </PolozkaPanelu>
        </Panel>
      )}
      </div>

      <div className="mx-1 h-5 w-px bg-win-linka" />
      <IkonoveTlacitko aria-label="Vyjmout" disabled={nic || jenCist} onClick={() => onKopiruj(true)}>
        <Scissors className="h-4 w-4" />
      </IkonoveTlacitko>
      <IkonoveTlacitko aria-label="Kopírovat" disabled={nic} onClick={() => onKopiruj(false)}>
        <Copy className="h-4 w-4" />
      </IkonoveTlacitko>
      <IkonoveTlacitko aria-label="Vložit" disabled={!maSchranku || jenCist} onClick={onVloz}>
        <ClipboardPaste className="h-4 w-4" />
      </IkonoveTlacitko>
      <IkonoveTlacitko
        aria-label="Přejmenovat"
        disabled={vyber.length !== 1 || jenCist}
        onClick={onPrejmenuj}
      >
        <Pencil className="h-4 w-4" />
      </IkonoveTlacitko>
      <IkonoveTlacitko aria-label="Komprimovat do souboru ZIP" disabled={nic || jenCist} onClick={onZip}>
        <ArrowUpFromLine className="h-4 w-4" />
      </IkonoveTlacitko>
      <IkonoveTlacitko aria-label="Odstranit" disabled={nic || jenCist} onClick={onSmaz}>
        <Trash2 className="h-4 w-4" />
      </IkonoveTlacitko>

      <div className="mx-1 h-5 w-px bg-win-linka" />
      <div className="relative">
      <Tlacitko vzhled="tichy" onClick={() => nastavOtevrenou((o) => (o === "radit" ? null : "radit"))}>
        Řadit <ChevronDown className="h-3 w-3" />
      </Tlacitko>
      {otevrena === "radit" && (
        <Panel>
          {(
            [
              ["nazev", "Název"],
              ["datum", "Datum změny"],
              ["typ", "Typ"],
              ["velikost", "Velikost"],
            ] as [Razeni, string][]
          ).map(([id, popis]) => (
            <PolozkaPanelu
              key={id}
              zaskrtnuto={razeni === id}
              onClick={() => {
                onRazeni(id);
                nastavOtevrenou(null);
              }}
            >
              {popis}
            </PolozkaPanelu>
          ))}
          <div className="my-1 h-px bg-win-linka" />
          <PolozkaPanelu zaskrtnuto={vzestupne} onClick={() => { onRazeni(razeni); nastavOtevrenou(null); }}>
            {vzestupne ? "Vzestupně" : "Sestupně"}
          </PolozkaPanelu>
        </Panel>
      )}
      </div>

      <div className="relative">
      <Tlacitko
        vzhled="tichy"
        onClick={() => nastavOtevrenou((o) => (o === "zobrazit" ? null : "zobrazit"))}
      >
        Zobrazit <ChevronDown className="h-3 w-3" />
      </Tlacitko>
      {otevrena === "zobrazit" && (
        <Panel zprava>
          <PolozkaPanelu
            ikona={<LayoutGrid className="h-4 w-4" />}
            zaskrtnuto={zobrazeni === "ikony"}
            onClick={() => { onZobrazeni("ikony"); nastavOtevrenou(null); }}
          >
            Velké ikony
          </PolozkaPanelu>
          <PolozkaPanelu
            ikona={<LayoutGrid className="h-4 w-4" />}
            zaskrtnuto={zobrazeni === "dlazdice"}
            onClick={() => { onZobrazeni("dlazdice"); nastavOtevrenou(null); }}
          >
            Střední ikony
          </PolozkaPanelu>
          <PolozkaPanelu
            ikona={<List className="h-4 w-4" />}
            zaskrtnuto={zobrazeni === "podrobnosti"}
            onClick={() => { onZobrazeni("podrobnosti"); nastavOtevrenou(null); }}
          >
            Podrobnosti
          </PolozkaPanelu>
          <div className="my-1 h-px bg-win-linka" />
          <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-win-slaby">Zobrazit</div>
          <PolozkaPanelu
            zaskrtnuto={nastaveni.pripony}
            onClick={() => onNastaveni({ pripony: !nastaveni.pripony })}
          >
            Přípony názvů souborů
          </PolozkaPanelu>
          <PolozkaPanelu
            zaskrtnuto={nastaveni.skrytePolozky}
            onClick={() => onNastaveni({ skrytePolozky: !nastaveni.skrytePolozky })}
          >
            Skryté položky
          </PolozkaPanelu>
        </Panel>
      )}
      </div>
    </div>
  );
}

/**
 * Rozbalený panel pod tlačítkem v pruhu příkazů. Ukotvuje se k vlastnímu
 * tlačítku, ne k pevné vzdálenosti od kraje – v úzkém okně by se jinak
 * rozešel s tlačítkem, ke kterému patří.
 */
function Panel({ children, zprava = false }: { children: React.ReactNode; zprava?: boolean }) {
  return (
    <div
      className={`win-vyjezd absolute top-9 z-[200] min-w-[220px] rounded-lg border border-win-linka bg-win-povrch p-1 shadow-[var(--win-stin-nabidka)] ${
        zprava ? "right-0" : "left-0"
      }`}
    >
      {children}
    </div>
  );
}

function PolozkaPanelu({
  children,
  ikona,
  zaskrtnuto,
  onClick,
}: {
  children: React.ReactNode;
  ikona?: React.ReactNode;
  zaskrtnuto?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full items-center gap-3 rounded px-2 text-left text-[13px] hover:bg-win-zvyrazneny"
    >
      <span className="flex h-4 w-4 items-center justify-center text-win-slaby">
        {zaskrtnuto ? <span className="text-win-akcent">✓</span> : ikona}
      </span>
      {children}
    </button>
  );
}

/* ───────────────────────── Adresní řádek ───────────────────────── */

function Drobecky({ kde, onJdi }: { kde: string; onJdi: (kam: string) => void }) {
  const [pise, nastavPise] = useState(false);
  const [text, nastavText] = useState(kde);

  useEffect(() => nastavText(kde), [kde]);

  if (pise) {
    return (
      <form
        className="flex flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          nastavPise(false);
          onJdi(text.trim());
        }}
      >
        <input
          autoFocus
          value={text}
          onChange={(e) => nastavText(e.target.value)}
          onBlur={() => nastavPise(false)}
          aria-label="Adresa"
          className="h-8 w-full rounded border border-win-akcent bg-win-povrch px-2 text-[12px] outline-none"
        />
      </form>
    );
  }

  const casti = jeZvlastni(kde) ? [] : rozloz(kde);
  return (
    <button
      type="button"
      onClick={() => nastavPise(true)}
      title="Klikni a napiš cestu ručně"
      className="flex h-8 min-w-0 flex-1 items-center gap-0.5 rounded border border-win-linka bg-win-povrch px-2 text-left text-[12px] hover:border-win-slaby"
    >
      <Ikona
        klic={kde === KOS ? "kos" : kde === POCITAC ? "tento-pocitac" : "slozka"}
        velikost={16}
        className="mr-1 shrink-0"
      />
      {kde === KOS ? (
        <span>Koš</span>
      ) : kde === POCITAC ? (
        <span>{NAZEV_POCITACE}</span>
      ) : (
        casti.map((cast, i) => (
          <span key={`${cast}-${i}`} className="flex min-w-0 items-center">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-win-slaby" />}
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onJdi(sloz(casti.slice(0, i + 1)));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onJdi(sloz(casti.slice(0, i + 1)));
                }
              }}
              className="truncate rounded px-1 py-0.5 hover:bg-win-zvyrazneny"
            >
              {zobrazeneJmeno(casti.slice(0, i + 1))}
            </span>
          </span>
        ))
      )}
    </button>
  );
}

/* ───────────────────────── Postranní panel ───────────────────────── */

function Postranni({
  kde,
  onJdi,
  pocetVKosi,
}: {
  kde: string;
  onJdi: (kam: string) => void;
  pocetVKosi: number;
}) {
  const [rozbaleno, nastavRozbaleno] = useState(true);
  const polozka = (aktivni: boolean) =>
    `flex h-8 w-full items-center gap-2.5 rounded px-2 text-left text-[12px] ${
      aktivni ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
    }`;

  return (
    <nav
      aria-label="Navigační podokno"
      className="win-posuv w-56 shrink-0 overflow-auto border-r border-win-linka bg-win-plocha p-2"
    >
      <button type="button" className={polozka(kde === DOMOV)} onClick={() => onJdi(DOMOV)}>
        <Ikona klic="uzivatel" velikost={16} /> Domů
      </button>

      <button
        type="button"
        onClick={() => nastavRozbaleno((r) => !r)}
        className="mt-2 flex h-7 w-full items-center gap-1 rounded px-1 text-left text-[11px] uppercase tracking-wide text-win-slaby hover:bg-win-zvyrazneny"
      >
        {rozbaleno ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Rychlý přístup
      </button>
      {rozbaleno &&
        RYCHLY_PRISTUP.map((z) => (
          <button
            key={z.cesta}
            type="button"
            className={`${polozka(kde === z.cesta)} pl-5`}
            onClick={() => onJdi(z.cesta)}
          >
            <Ikona klic="slozka" velikost={16} /> {z.nazev}
          </button>
        ))}

      <div className="my-2 h-px bg-win-linka" />
      <button type="button" className={polozka(kde === POCITAC)} onClick={() => onJdi(POCITAC)}>
        <Ikona klic="tento-pocitac" velikost={16} /> {NAZEV_POCITACE}
      </button>
      <button
        type="button"
        className={`${polozka(kde === "C:\\")} pl-5`}
        onClick={() => onJdi("C:")}
      >
        <Ikona klic="disk" velikost={16} /> {NAZEV_DISKU}
      </button>

      <div className="my-2 h-px bg-win-linka" />
      <button type="button" className={polozka(kde === KOS)} onClick={() => onJdi(KOS)}>
        <Ikona klic={pocetVKosi ? "kos-plny" : "kos"} velikost={16} /> Koš
      </button>
    </nav>
  );
}

/* ───────────────────────── Tento počítač ───────────────────────── */

function TentoPocitac({ disk, onJdi }: { disk: Slozka; onJdi: (kam: string) => void }) {
  const obsazeno = OBSAZENO_SYSTEMEM + velikost(disk);
  const volne = Math.max(0, KAPACITA_DISKU - obsazeno);
  const podil = Math.min(100, (obsazeno / KAPACITA_DISKU) * 100);
  return (
    <div className="p-5">
      <h2 className="mb-3 text-[13px] font-semibold text-win-slaby">Složky</h2>
      <div className="mb-6 flex flex-wrap gap-3">
        {RYCHLY_PRISTUP.map((z) => (
          <button
            key={z.cesta}
            type="button"
            onDoubleClick={() => onJdi(z.cesta)}
            onClick={() => onJdi(z.cesta)}
            className="flex w-40 items-center gap-3 rounded-md p-2 text-left hover:bg-win-zvyrazneny"
          >
            <Ikona klic="slozka" velikost={32} />
            <span className="text-[12px]">{z.nazev}</span>
          </button>
        ))}
      </div>

      <h2 className="mb-3 text-[13px] font-semibold text-win-slaby">
        Zařízení a jednotky
      </h2>
      <button
        type="button"
        onClick={() => onJdi("C:")}
        className="flex w-72 items-center gap-3 rounded-md p-3 text-left hover:bg-win-zvyrazneny"
      >
        <Ikona klic="disk" velikost={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px]">{NAZEV_DISKU}</div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-win-linka">
            <div
              className="h-full rounded-full"
              style={{
                width: `${podil}%`,
                // Přes 90 % zaplnění zčervená, přesně jako ve Windows.
                backgroundColor: podil > 90 ? "#c42b1c" : "rgb(var(--win-akcent))",
              }}
            />
          </div>
          <div className="mt-1 text-[11px] text-win-slaby">
            Volných {velikostText(volne)} z {velikostText(KAPACITA_DISKU)}
          </div>
        </div>
      </button>
    </div>
  );
}

/* ───────────────────────── Zobrazení Podrobnosti ───────────────────────── */

function PoleJmena({
  hodnota,
  poleJmena,
  onZmena,
  onHotovo,
}: {
  hodnota: string;
  poleJmena: React.RefObject<HTMLInputElement>;
  onZmena: (h: string) => void;
  onHotovo: () => void;
}) {
  return (
    <input
      ref={poleJmena}
      autoFocus
      value={hodnota}
      // Celý název označený, jak to dělá Windows – psaní starý název přepíše.
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => onZmena(e.target.value)}
      onBlur={onHotovo}
      onKeyDown={(e) => {
        if (e.key === "Enter") onHotovo();
        if (e.key === "Escape") {
          onZmena("");
          onHotovo();
        }
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      aria-label="Nový název"
      className="w-full rounded-sm border border-win-akcent bg-win-povrch px-1 text-[13px] outline-none"
    />
  );
}

function TabulkaPolozek({
  radky,
  vyber,
  kde,
  pripony,
  razeni,
  vzestupne,
  prejmenovava,
  navrhJmena,
  poleJmena,
  onNavrh,
  onDokonci,
  onKlik,
  onOtevri,
  onNabidka,
  onRazeni,
}: {
  radky: Radek[];
  vyber: string[];
  kde: string;
  pripony: boolean;
  razeni: Razeni;
  vzestupne: boolean;
  prejmenovava: string | null;
  navrhJmena: string;
  poleJmena: React.RefObject<HTMLInputElement>;
  onNavrh: (h: string) => void;
  onDokonci: () => void;
  onKlik: (e: React.MouseEvent, jmeno: string) => void;
  onOtevri: (r: Radek) => void;
  onNabidka: (e: React.MouseEvent, r: Radek) => void;
  onRazeni: (r: Razeni) => void;
}) {
  const sipka = (id: Razeni) =>
    razeni === id ? <span className="text-[9px] text-win-akcent">{vzestupne ? "▲" : "▼"}</span> : null;
  const zahlavi = "flex w-full items-center gap-1 px-2 py-1 text-left hover:bg-win-zvyrazneny";
  const dalsiSloupec = kde === KOS ? "Původní umístění" : radky.some((r) => r.navic) ? "Cesta" : null;

  return (
    <table className="w-full table-fixed border-collapse text-[13px]">
      <thead className="sticky top-0 z-10 bg-win-povrch">
        <tr className="border-b border-win-linka text-[12px] text-win-slaby">
          <th className="w-[38%] font-normal">
            <button type="button" className={zahlavi} onClick={() => onRazeni("nazev")}>
              Název {sipka("nazev")}
            </button>
          </th>
          <th className="w-[20%] font-normal">
            <button type="button" className={zahlavi} onClick={() => onRazeni("datum")}>
              Datum změny {sipka("datum")}
            </button>
          </th>
          <th className="w-[22%] font-normal">
            <button type="button" className={zahlavi} onClick={() => onRazeni("typ")}>
              {dalsiSloupec ?? "Typ"} {dalsiSloupec ? null : sipka("typ")}
            </button>
          </th>
          <th className="w-[20%] font-normal">
            <button type="button" className={`${zahlavi} justify-end`} onClick={() => onRazeni("velikost")}>
              Velikost {sipka("velikost")}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {radky.map((r) => {
          const vybrano = vyber.includes(r.uzel.jmeno);
          return (
            <tr
              key={r.uzel.jmeno}
              data-polozka
              onClick={(e) => onKlik(e, r.uzel.jmeno)}
              onDoubleClick={() => onOtevri(r)}
              onContextMenu={(e) => onNabidka(e, r)}
              className={`cursor-default ${vybrano ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"}`}
            >
              <td className="px-2 py-1">
                <div className="flex items-center gap-2.5">
                  <IkonaSouboru
                    jmeno={r.uzel.jmeno}
                    slozka={jeSlozka(r.uzel)}
                    velikost={20}
                    className="shrink-0"
                  />
                  {prejmenovava === r.uzel.jmeno ? (
                    <PoleJmena
                      hodnota={navrhJmena}
                      poleJmena={poleJmena}
                      onZmena={onNavrh}
                      onHotovo={onDokonci}
                    />
                  ) : (
                    <span className={`truncate ${r.uzel.skryty ? "opacity-50" : ""}`}>
                      {zobrazJmeno(r.uzel, pripony, r.cesta)}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-2 py-1 text-win-slaby">{datumCas(r.uzel.zmeneno)}</td>
              <td className="truncate px-2 py-1 text-win-slaby">
                {dalsiSloupec ? r.navic : jeSlozka(r.uzel) ? "Složka souborů" : typSouboru(r.uzel.jmeno).popis}
              </td>
              <td className="px-2 py-1 text-right text-win-slaby">
                {jeSlozka(r.uzel) ? "" : velikostSloupec(velikost(r.uzel))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ───────────────────────── Zobrazení Ikony ───────────────────────── */

function MrizkaPolozek({
  radky,
  vyber,
  pripony,
  velke,
  prejmenovava,
  navrhJmena,
  poleJmena,
  onNavrh,
  onDokonci,
  onKlik,
  onOtevri,
  onNabidka,
}: {
  radky: Radek[];
  vyber: string[];
  pripony: boolean;
  velke: boolean;
  prejmenovava: string | null;
  navrhJmena: string;
  poleJmena: React.RefObject<HTMLInputElement>;
  onNavrh: (h: string) => void;
  onDokonci: () => void;
  onKlik: (e: React.MouseEvent, jmeno: string) => void;
  onOtevri: (r: Radek) => void;
  onNabidka: (e: React.MouseEvent, r: Radek) => void;
}) {
  const sirka = velke ? "w-28" : "w-24";
  return (
    <div className="flex flex-wrap content-start gap-1 p-3">
      {radky.map((r) => {
        const vybrano = vyber.includes(r.uzel.jmeno);
        return (
          <button
            key={r.uzel.jmeno}
            type="button"
            data-polozka
            onClick={(e) => onKlik(e, r.uzel.jmeno)}
            onDoubleClick={() => onOtevri(r)}
            onContextMenu={(e) => onNabidka(e, r)}
            className={`flex ${sirka} flex-col items-center gap-1.5 rounded p-2 text-center ${
              vybrano ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
            }`}
          >
            <IkonaSouboru
              jmeno={r.uzel.jmeno}
              slozka={jeSlozka(r.uzel)}
              velikost={velke ? 56 : 40}
              className={r.uzel.skryty ? "opacity-50" : ""}
            />
            {prejmenovava === r.uzel.jmeno ? (
              <PoleJmena
                hodnota={navrhJmena}
                poleJmena={poleJmena}
                onZmena={onNavrh}
                onHotovo={onDokonci}
              />
            ) : (
              <span className="line-clamp-2 break-words text-[12px] leading-tight">
                {zobrazJmeno(r.uzel, pripony, r.cesta)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Vlastnosti ───────────────────────── */

function VlastnostiDialog({
  radek,
  slozka,
  onZavrit,
  onOtevreno,
}: {
  radek: Radek;
  slozka: string[];
  onZavrit: () => void;
  onOtevreno: (jmeno: string) => void;
}) {
  const { uzel } = radek;
  const slozkaLi = jeSlozka(uzel);
  const typ = typSouboru(uzel.jmeno);
  const bajty = velikost(uzel);

  useEffect(() => onOtevreno(uzel.jmeno), [uzel.jmeno, onOtevreno]);

  const radekVlastnosti = (popis: string, hodnota: React.ReactNode) => (
    <div className="flex gap-3 border-b border-win-linka/60 py-1.5 last:border-0">
      <div className="w-32 shrink-0 text-win-slaby">{popis}</div>
      <div className="min-w-0 flex-1 break-words">{hodnota}</div>
    </div>
  );

  return (
    <Dialog
      nadpis={`${zobrazJmeno(uzel, true)} – vlastnosti`}
      onZavrit={onZavrit}
      tlacitka={
        <>
          <Tlacitko vzhled="akcent" onClick={onZavrit}>
            OK
          </Tlacitko>
          <Tlacitko onClick={onZavrit}>Storno</Tlacitko>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-4 border-b border-win-linka pb-4">
        <IkonaSouboru jmeno={uzel.jmeno} slozka={slozkaLi} velikost={48} />
        <div className="min-w-0 text-[14px] font-medium">{uzel.jmeno}</div>
      </div>
      {radekVlastnosti("Typ souboru", slozkaLi ? "Složka souborů" : typ.popis)}
      {!slozkaLi &&
        radekVlastnosti(
          "Otevřít pomocí",
          typ.app ? aplikaceNazev(typ.app) : "žádná přiřazená aplikace",
        )}
      {radekVlastnosti("Umístění", sloz(slozka))}
      {radekVlastnosti("Velikost", velikostPodrobne(bajty))}
      {radekVlastnosti(
        "Velikost na disku",
        // Windows počítá zabrané místo po celých blocích po 4 kB.
        velikostPodrobne(Math.ceil(bajty / 4096) * 4096),
      )}
      {slozkaLi &&
        radekVlastnosti(
          "Obsahuje",
          `${(uzel as Slozka).deti.filter((d) => !jeSlozka(d)).length} souborů, ${
            (uzel as Slozka).deti.filter(jeSlozka).length
          } složek`,
        )}
      {radekVlastnosti("Datum změny", datumDlouhy(uzel.zmeneno))}
      {radekVlastnosti(
        "Atributy",
        [uzel.zamceno ? "Jen pro čtení" : null, uzel.skryty ? "Skrytý" : null]
          .filter(Boolean)
          .join(", ") || "žádné",
      )}
    </Dialog>
  );
}

function aplikaceNazev(app: string): string {
  const nazvy: Record<string, string> = {
    "poznamkovy-blok": "Poznámkový blok",
    fotky: "Fotky",
    prohlizec: "Microsoft Edge",
    pruzkumnik: "Průzkumník souborů",
    malovani: "Malování",
  };
  return nazvy[app] ?? app;
}
