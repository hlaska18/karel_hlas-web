"use client";

/**
 * Finder.
 *
 * Proti windowsovému Průzkumníkovi tu jsou čtyři věci jinak, a všechny čtyři
 * jsou záměr, ne zjednodušení:
 *
 *   1. CESTA NEMÁ PÍSMENO DISKU. Všechno visí pod jediným `/` a připojený
 *      flash disk se objeví ve `/Volumes`. Proto je dole pruh s cestou –
 *      žák má vidět, kde zrovna je, zapsané tak, jak se to na Macu píše.
 *   2. SKRYTÉ JE JMÉNO, ne příznak. Cokoli s tečkou na začátku Finder neukáže.
 *      Přepínač proto říká „položky s tečkou", ne „skryté položky" – ať je
 *      poznat, že je to něco jiného než ve Windows.
 *   3. `.app` NENÍ SOUBOR, je to složka. Finder ji ukazuje jako jednu položku
 *      a dovnitř pustí jen přes „Zobrazit obsah balíčku" v pravém tlačítku.
 *   4. INFORMACE MÍSTO VLASTNOSTÍ. Ukazují druh položky a plnou cestu –
 *      u balíčku doslova napíšou, že je to balíček.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Folder,
  HardDrive,
  House,
  Image,
  Monitor,
  LayoutGrid,
  List,
  Package,
  Search,
  Trash2,
  Usb,
} from "lucide-react";
import { useMac, useOknoMac } from "../system";
import { APLIKACE_BALICKU, VelkaIkona } from "../ikony";
import type { AppId } from "@/lib/mac/stav";
import { polozekSlovy } from "@/lib/mac/text";
import {
  coUdelaTazeni,
  pustTazene,
  skonciTazeni,
  stopaTazeni,
  tazenaPolozka,
  zacniTazeni,
  type AkceTazeni,
} from "@/lib/mac/tazeni";
import { NabidkaMistni, PanelInformace, type PolozkaNabidky } from "../ui";
import {
  DOKUMENTY,
  DOMOV,
  KOREN,
  OBRAZKY,
  PLOCHA,
  STAZENE,
  SVAZKY,
  KOS,
  jeBalicek,
  jeSkryte,
  rozlozMac,
  slozMac,
  sVlnovkou,
} from "@/lib/mac/cesty";
import {
  jeSlozka,
  kopie,
  najdi,
  najdiSlozku,
  novaSlozka as vytvorSlozku,
  odeber,
  pocetPolozek,
  prejmenuj,
  velikost,
  vloz,
  volneJmeno,
  type Uzel,
} from "@/lib/win/fs";
import {
  datumCas,
  velikostPodrobne,
  velikostSloupec,
  velikostText,
} from "@/lib/win/format";

const MISTA = [
  { jmeno: "zak", cesta: DOMOV, znak: House },
  { jmeno: "Plocha", cesta: PLOCHA, znak: Monitor },
  { jmeno: "Dokumenty", cesta: DOKUMENTY, znak: FileText },
  { jmeno: "Stažené", cesta: STAZENE, znak: Download },
  { jmeno: "Obrázky", cesta: OBRAZKY, znak: Image },
];

/**
 * České skloňování ve stavovém řádku: 1 položka, 2–4 položky, 5+ položek.
 * Bez toho tam stálo „1 položek“, což je přesně ten druh drobnosti, podle
 * které je poznat, že prostředí nikdo nedodělal.
 */
/** Přípony, které Poznámky umí otevřít jako text. */
const TEXTOVE = ["txt", "plist", "csv", "md", "xml", "json", "log", "zshrc"];

function jeTextovy(jmeno: string): boolean {
  const tecka = jmeno.lastIndexOf(".");
  // Soubory jako `.zshrc` jsou celé jen přípona – tečka je na začátku.
  const pripona = tecka <= 0 ? jmeno.slice(1) : jmeno.slice(tecka + 1);
  return TEXTOVE.includes(pripona.toLowerCase());
}

/** Je to složka, kterou Finder ukazuje jako složku? Balíček se počítá jinak. */
const jeProstaSlozka = (u: Uzel) => jeSlozka(u) && !jeBalicek(u.jmeno);

export function Finder() {
  const { stav, poslat, spust, stopa } = useMac();
  const { arg, nastavTitul, slotZahlavi, aktivni } = useOknoMac();

  /** Historie chození tam a zpět. Index ukazuje, kde v ní právě stojíme. */
  const [historie, nastavHistorii] = useState<string[][]>([
    arg ? rozlozMac(arg) : PLOCHA,
  ]);
  const [kde, nastavKde] = useState(0);
  const [vybrano, nastavVybrano] = useState<string | null>(null);
  const [nabidka, nastavNabidku] = useState<{
    x: number;
    y: number;
    jmeno: string | null;
  } | null>(null);
  const [informace, nastavInformace] = useState<string | null>(null);
  const [prejmenovavany, nastavPrejmenovavany] = useState<string | null>(null);
  const [novyNazev, nastavNovyNazev] = useState("");
  const [hledani, nastavHledani] = useState("");
  const [hlaska, nastavHlasku] = useState<{
    nadpis: string;
    text: string;
  } | null>(null);
  /**
   * Finder ve skutecnosti startuje v zobrazeni IKON, ne v seznamu – proto je
   * to vychozi i tady. Seznam je pak ta druha moznost, ne naopak.
   */
  const [zobrazeni, nastavZobrazeni] = useState<"ikony" | "seznam">("ikony");
  /** Jméno položky v Rychlém náhledu, nebo null, když je zavřený. */
  const [nahled, nastavNahled] = useState<string | null>(null);
  /** Co se právě táhne myší (jméno v aktuální složce). */
  const [tazeno, nastavTazeno] = useState<string | null>(null);
  /** Nad kterým cílem je tažená položka – a co se stane, když ji pustíš. */
  const [nadCilem, nastavNadCilem] = useState<{
    klic: string;
    akce: "presun" | "kopie";
  } | null>(null);
  const polePrejmenovani = useRef<HTMLInputElement>(null);

  const cesta = historie[kde];
  const slozka = najdiSlozku(stav.disk, cesta);
  /** Volné místo. Kapacita disku je 245 GB, obsazené se počítá ze stromu. */
  const volneMisto = useMemo(() => {
    const obsazeno = velikost(stav.disk) + 41_000_000_000;
    // `velikostText`, ne `velikostSloupec`: ten druhý je windowsácký sloupec
    // Velikost a hlásí VŽDYCKY kilobajty, takže dole svítilo
    // „199 198 416 kB k dispozici“ místo „190,0 GB“.
    return velikostText(245_000_000_000 - obsazeno);
  }, [stav.disk]);
  const jmenoMista = cesta[cesta.length - 1] || "Macintosh HD";

  useEffect(() => {
    nastavTitul(jmenoMista);
  }, [jmenoMista, nastavTitul]);

  /**
   * Nabídka „Jít“ poslala okno jinam. Porovnává se s aktuální cestou, aby to
   * nezacyklilo: `jdi` sáhne do historie, ta překreslí Finder a efekt by se
   * spustil znovu.
   */
  useEffect(() => {
    if (!arg) return;
    const kam = rozlozMac(arg);
    if (slozMac(kam) === slozMac(historie[kde])) return;
    nastavHistorii((h) => [...h.slice(0, kde + 1), kam]);
    nastavKde((k) => k + 1);
    nastavVybrano(null);
    // `historie` a `kde` schválně mimo závislosti: efekt reaguje na příkaz
    // z nabídky, ne na vlastní chození uvnitř okna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arg]);

  /* Doklad, že žák našel připojený disk tam, kde na Macu je – bez písmene. */
  useEffect(() => {
    if (slozMac(cesta) === "/Volumes/FLASH") stopa("nasel-flash");
  }, [cesta, stopa]);

  useEffect(() => {
    if (prejmenovavany)
      window.setTimeout(() => polePrejmenovani.current?.select(), 30);
  }, [prejmenovavany]);

  const jdi = useCallback(
    (nova: string[]) => {
      nastavHistorii((h) => [...h.slice(0, kde + 1), nova]);
      nastavKde((k) => k + 1);
      nastavVybrano(null);
      nastavPrejmenovavany(null);
    },
    [kde],
  );

  const polozky = useMemo(() => {
    if (!slozka) return [];
    const vse = stav.nastaveni.skrytePolozky
      ? slozka.deti
      : slozka.deti.filter((d) => !jeSkryte(d.jmeno));
    const h = hledani.trim().toLowerCase();
    const filtrovane = h
      ? vse.filter((d) => d.jmeno.toLowerCase().includes(h))
      : vse;
    // Složky napřed, pak podle abecedy – Finder to tak dělá ve výchozím stavu.
    return [...filtrovane].sort((a, b) => {
      const as = jeProstaSlozka(a);
      const bs = jeProstaSlozka(b);
      if (as !== bs) return as ? -1 : 1;
      return a.jmeno.localeCompare(b.jmeno, "cs");
    });
  }, [slozka, stav.nastaveni.skrytePolozky, hledani]);

  /**
   * Co udělá dvojklik. Na Macu udělá něco VŽDYCKY – složka se otevře, dokument
   * se otevře v aplikaci, `.app` se spustí. Dřív se dvojklikem na soubor
   * nestalo nic a vypadalo to jako závada.
   */
  const otevri = (u: Uzel) => {
    if (jeProstaSlozka(u)) {
      jdi([...cesta, u.jmeno]);
      return;
    }
    // Balíček se chová jako JEDEN KUS: dvojklik ho spustí, dovnitř se jde až
    // přes „Zobrazit obsah balíčku". Přesně tím se liší od obyčejné složky.
    if (jeBalicek(u.jmeno)) {
      const app = APLIKACE_BALICKU[u.jmeno];
      if (app) {
        stopa("spustil-z-balicku");
        if (stav.bezici.includes(app)) poslat({ typ: "app/dopredu", app });
        else spust(app);
      } else {
        nastavHlasku({
          nadpis: `Aplikaci „${u.jmeno}" nelze otevřít`,
          text: "V téhle simulaci není udělaná. Na skutečném Macu by se spustila – balíček totiž obsahuje celý program.",
        });
      }
      return;
    }
    if (jeTextovy(u.jmeno)) {
      spust("poznamky", slozMac([...cesta, u.jmeno]));
      return;
    }
    nastavHlasku({
      nadpis: `Dokument „${u.jmeno}" nelze otevřít`,
      text: "Simulace umí otevřít jen textové soubory. Obrázky, archivy ani instalátory v ní aplikaci nemají.",
    });
  };

  /* ───────── akce z pravého tlačítka ───────── */

  const zalozSlozku = () => {
    if (!slozka) return;
    const jmeno = volneJmeno(slozka, "nová složka");
    poslat({
      typ: "disk/nastav",
      disk: vloz(stav.disk, cesta, vytvorSlozku(jmeno)),
    });
    nastavVybrano(jmeno);
    nastavNovyNazev(jmeno);
    nastavPrejmenovavany(jmeno);
  };

  const dokonciPrejmenovani = () => {
    if (!prejmenovavany) return;
    const cil = novyNazev.trim();
    if (cil && cil !== prejmenovavany) {
      const novy = prejmenuj(stav.disk, [...cesta, prejmenovavany], cil);
      if (novy) {
        poslat({ typ: "disk/nastav", disk: novy });
        nastavVybrano(cil);
        // Doklad pro úlohu o tom, že tečka na začátku položku schová.
        if (jeSkryte(cil)) stopa("zalozil-teckovou");
      }
    }
    nastavPrejmenovavany(null);
  };

  /**
   * „Přesunout do koše" je na Macu doslova PŘESUN, ne smazání – soubor skončí
   * ve skryté složce `~/.Trash` a je pořád na disku. Dokud ho žák nevysype,
   * dá se vrátit. Přesně tenhle rozdíl proti „Odstranit" ve Windows má
   * prostředí ukázat, takže se tu nic nemaže.
   */
  const doKose = (jmeno: string) => {
    const uzel = najdi(stav.disk, [...cesta, jmeno]);
    if (!uzel || uzel.zamceno) return;
    const vKosi = najdiSlozku(stav.disk, KOS);
    const noveJmeno = vKosi ? volneJmeno(vKosi, jmeno) : jmeno;
    let disk = odeber(stav.disk, [...cesta, jmeno]);
    disk = vloz(disk, KOS, { ...kopie(uzel), jmeno: noveJmeno });
    poslat({ typ: "disk/nastav", disk });
    stopa("presunul-do-kose");
    nastavVybrano(null);
  };

  /*
   * Tažení myší.
   *
   * Pravidlo je stejné jako ve Windows a proto z něj NENÍ úloha: po
   * stejném disku se položka PŘESUNE, na jiný disk (tady FLASH) se
   * ZKOPÍRUJE. Finder, který tažení neumí, ale působí rozbitě – žák to
   * zkusí jako první věc.
   *
   * Kopii poznáš podle zeleného plusu u kurzoru. Ten kreslí prohlížeč sám,
   * když se nastaví `dropEffect = "copy"`, takže je stejný jako na skutečném
   * Macu a nic se nepředstírá. Dole ve stavovém řádku se to navíc napíše.
   *
   * Pravidla jsou v `lib/mac/tazeni.ts`, společná s plochou a Dockem – táhne
   * se i mezi okny, z plochy do okna a z okna na plochu nebo na koš.
   */
  const coUdela = (cil: string[]): AkceTazeni | null => {
    const zdroj = tazenaPolozka();
    return zdroj ? coUdelaTazeni(stav.disk, zdroj, cil) : null;
  };

  const pust = (cil: string[]) => {
    const zdroj = tazenaPolozka();
    if (!zdroj) return;
    const vysledek = pustTazene(stav.disk, zdroj, cil);
    if (!vysledek) return;
    poslat({ typ: "disk/nastav", disk: vysledek.disk });
    stopa(stopaTazeni(cil, vysledek.akce));
    nastavVybrano(null);
  };

  /**
   * Obsluha cíle, na který jde položku pustit. `klic` jen pro zvýraznění.
   * Cíl, který položku bere, zastaví probublání – jinak by složku v okně
   * přebilo okno samo, které je cílem taky.
   */
  const cilTazeni = (cil: string[], klic: string) => ({
    onDragOver: (e: React.DragEvent) => {
      const akce = coUdela(cil);
      if (!akce) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = akce === "kopie" ? "copy" : "move";
      if (nadCilem?.klic !== klic) nastavNadCilem({ klic, akce });
    },
    onDragLeave: () => {
      if (nadCilem?.klic === klic) nastavNadCilem(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pust(cil);
      skonciTazeni();
      nastavNadCilem(null);
      nastavTazeno(null);
    },
  });

  /** Obsluha položky, kterou jde táhnout. */
  const zdrojTazeni = (jmeno: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      // Safari bez `setData` tažení vůbec nezačne.
      e.dataTransfer.setData("text/plain", jmeno);
      e.dataTransfer.effectAllowed = "copyMove";
      zacniTazeni([...cesta, jmeno]);
      nastavTazeno(jmeno);
    },
    onDragEnd: () => {
      skonciTazeni();
      nastavTazeno(null);
      nastavNadCilem(null);
    },
  });

  /** Vysypat koš. Teprve tohle soubory doopravdy smaže. */
  const vysypKos = () => {
    const vKosi = najdiSlozku(stav.disk, KOS);
    if (!vKosi || vKosi.deti.length === 0) return;
    let disk = stav.disk;
    for (const d of vKosi.deti) disk = odeber(disk, [...KOS, d.jmeno]);
    poslat({ typ: "disk/nastav", disk });
    stopa("vysypal-kos");
  };

  const vKosi = slozMac(cesta) === slozMac(KOS);

  /*
   * Dvě klávesy, které na Macu dělají něco jiného než ve Windows – a obě
   * jsou bez ⌘, takže projdou i na windowsové klávesnici.
   *
   *   ENTER vybranou položku PŘEJMENUJE. Ve Windows by ji otevřel. Je to
   *   jeden z nejčastějších omylů po přechodu a žák na něj narazí sám.
   *   MEZERNÍK otevře Rychlý náhled – podívat se dovnitř souboru bez
   *   spouštění aplikace. Ve Windows nic takového není. Další mezerník nebo
   *   Escape náhled zavře.
   *
   * Poslouchá se jen ve Finderu, který je vpředu, a nikdy, když se zrovna
   * píše do pole – jinak by mezera v hledání otevřela náhled.
   */
  useEffect(() => {
    if (!aktivni) return;
    const klavesa = (e: KeyboardEvent) => {
      const cil = e.target as HTMLElement | null;
      if (
        cil &&
        (cil.tagName === "INPUT" ||
          cil.tagName === "TEXTAREA" ||
          cil.isContentEditable)
      ) {
        return;
      }
      if (prejmenovavany) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (nahled) {
          nastavNahled(null);
        } else if (vybrano && slozka?.deti.some((d) => d.jmeno === vybrano)) {
          nastavNahled(vybrano);
          stopa("nahled-mezernikem");
        }
        return;
      }
      if (e.key === "Escape" && nahled) {
        nastavNahled(null);
        return;
      }
      if (e.key === "Enter" && vybrano && !nahled) {
        const uzel = slozka?.deti.find((d) => d.jmeno === vybrano);
        if (!uzel || uzel.zamceno) return;
        e.preventDefault();
        nastavNovyNazev(uzel.jmeno);
        nastavPrejmenovavany(uzel.jmeno);
        stopa("prejmenoval-enterem");
      }
    };
    window.addEventListener("keydown", klavesa);
    return () => {
      window.removeEventListener("keydown", klavesa);
    };
  }, [aktivni, prejmenovavany, nahled, vybrano, slozka, stopa]);

  const polozkyNabidky = (jmeno: string | null): PolozkaNabidky[] => {
    if (!jmeno) {
      return vKosi
        ? [{ text: "Vysypat koš", akce: polozky.length ? vysypKos : undefined }]
        : [{ text: "Nová složka", akce: zalozSlozku }];
    }
    const uzel = slozka?.deti.find((d) => d.jmeno === jmeno);
    if (!uzel) return [{ text: "Nová složka", akce: zalozSlozku }];

    const seznam: PolozkaNabidky[] = [];
    if (jeProstaSlozka(uzel)) {
      seznam.push({ text: "Otevřít", akce: () => otevri(uzel) });
    }
    if (jeBalicek(uzel.jmeno)) {
      // Tohle je celý úkol o balíčcích. Jediná cesta dovnitř `.app`.
      seznam.push({
        text: "Zobrazit obsah balíčku",
        akce: () => {
          stopa("balicek:otevrel");
          jdi([...cesta, uzel.jmeno]);
        },
      });
    }
    seznam.push({
      text: "Informace",
      akce: () => {
        // Stopa se zapisuje, i když na ní zatím žádná úloha nevisí. Kroky
        // úlohy o položkách s tečkou do Informací posílají, takže až bude
        // jasné, co přesně se z nich má vyčíst, je doklad po ruce – a žákům,
        // kteří prostředí projdou dřív, se zpětně nepočítá nic.
        stopa("otevrel-informace");
        nastavInformace(uzel.jmeno);
      },
      oddelovac: true,
    });
    seznam.push({
      text: "Přejmenovat",
      akce: uzel.zamceno
        ? undefined
        : () => {
            nastavNovyNazev(uzel.jmeno);
            nastavPrejmenovavany(uzel.jmeno);
          },
    });
    seznam.push({
      text: "Přesunout do koše",
      akce: uzel.zamceno ? undefined : () => doKose(uzel.jmeno),
      oddelovac: true,
    });
    seznam.push({ text: "Nová složka", akce: zalozSlozku });
    return seznam;
  };

  const uzelInformace = informace
    ? slozka?.deti.find((d) => d.jmeno === informace)
    : null;

  /**
   * Ovládání Finderu patří do TÉHOŽ pruhu jako semafor a název okna – tak to
   * má skutečný Mac. Vykresluje se proto portálem do záhlaví, ne jako druhý
   * proužek pod ním.
   */
  /**
   * Ovládání Finderu patří do TÉHOŽ pruhu jako semafor a název okna.
   *
   * Tvar je podle skutečného Finderu (snímek z české nápovědy Applu): každá
   * skupina je BÍLÁ PILULKA se stínem, ne plochá ikona na pozadí. Právě ty
   * pilulky dělají pruh macOSovým – ploché ikony vypadaly jako panel nástrojů
   * z Windows.
   */
  /**
   * Jmeno polozky – nebo pole na prejmenovani, kdyz se zrovna prejmenovava.
   * Je to stejne v seznamu i v ikonach, jen zarovnane jinak, proto to sedi
   * na jednom miste.
   *
   * Tecka na zacatku se schvalne nezvyraznuje jinak – zak ji ma poznat sam
   * podle jmena, protoze presne tak to na Macu funguje.
   */
  const jmenoNeboPole = (u: Uzel, nastred: boolean) =>
    prejmenovavany === u.jmeno ? (
      <input
        ref={polePrejmenovani}
        value={novyNazev}
        onChange={(e) => nastavNovyNazev(e.target.value)}
        onBlur={dokonciPrejmenovani}
        onKeyDown={(e) => {
          if (e.key === "Enter") dokonciPrejmenovani();
          if (e.key === "Escape") nastavPrejmenovavany(null);
        }}
        aria-label="Nový název"
        spellCheck={false}
        className={`min-w-0 rounded border border-mac-akcent bg-mac-povrch px-1 text-[13px] text-mac-text outline-none ${
          nastred ? "w-full text-center" : "flex-1"
        }`}
      />
    ) : (
      <span className={nastred ? "line-clamp-2 break-words" : "truncate"}>
        {u.jmeno}
      </span>
    );

  const naradi = slotZahlavi
    ? createPortal(
        <>
          {/* Zpět a vpřed sdílejí jednu kapsli, jako na Macu. Plocha tlačítka
              se ukáže až při najetí – ne řada bílých pilulek se stínem. */}
          <div className="mac-toolbar-group ml-1 flex shrink-0 items-center overflow-hidden">
            <button
              type="button"
              aria-label="Zpět"
              disabled={kde === 0}
              onClick={() => {
                nastavKde((k) => k - 1);
                nastavVybrano(null);
              }}
              className="mac-toolbar-button pl-1 text-mac-text disabled:opacity-30"
            >
              <ChevronLeft className="h-[15px] w-[15px]" />
            </button>
            <button
              type="button"
              aria-label="Vpřed"
              disabled={kde >= historie.length - 1}
              onClick={() => {
                nastavKde((k) => k + 1);
                nastavVybrano(null);
              }}
              className="mac-toolbar-button pr-1 text-mac-text disabled:opacity-30"
            >
              <ChevronRight className="h-[15px] w-[15px]" />
            </button>
          </div>

          {/* Název složky: vlevo, tučně, větší. Ne vystředěný. */}
          <span className="ml-1 min-w-0 truncate text-[15px] font-semibold text-mac-text">
            {jmenoMista}
          </span>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className="mac-toolbar-group flex shrink-0 items-center overflow-hidden">
              <button
                type="button"
                title="Jako ikony"
                aria-pressed={zobrazeni === "ikony"}
                onClick={() => nastavZobrazeni("ikony")}
                className={`mac-toolbar-button pl-1 ${
                  zobrazeni === "ikony" ? "text-mac-text" : "text-mac-slaby"
                }`}
              >
                <LayoutGrid className="h-[15px] w-[15px]" />
              </button>
              <button
                type="button"
                title="Jako seznam"
                aria-pressed={zobrazeni === "seznam"}
                onClick={() => nastavZobrazeni("seznam")}
                className={`mac-toolbar-button pr-1 ${
                  zobrazeni === "seznam" ? "text-mac-text" : "text-mac-slaby"
                }`}
              >
                <List className="h-[15px] w-[15px]" />
              </button>
            </div>
            {/* Prstenec kolem celé kapsle, ne kolem pole uvnitř – tak ho kreslí
                Finder. Pole je širší než dřív (až 150 px), v úzkém okně se
                zúží, ale nezmizí. */}
            <label className="mac-toolbar-group flex h-[30px] min-w-[76px] max-w-[160px] flex-1 items-center gap-1.5 px-2.5 focus-within:ring-[3px] focus-within:ring-mac-akcent/55">
              <Search className="h-3.5 w-3.5 shrink-0 text-mac-slaby" />
              <input
                value={hledani}
                onChange={(e) => nastavHledani(e.target.value)}
                placeholder="Hledat"
                aria-label="Hledat ve složce"
                spellCheck={false}
                className="w-full min-w-0 bg-transparent text-[12px] text-mac-text outline-none placeholder:text-mac-slaby focus-visible:outline-none"
              />
            </label>
          </div>
        </>,
        slotZahlavi,
      )
    : null;

  // Rychlý náhled se vykresluje na PLOCHU, ne do okna: okno má při otevření
  // animaci s `transform`, a ta by fixně umístěný panel uvěznila uvnitř
  // okna místo nad celou obrazovkou, kde ho má Mac.
  const uzelNahledu = nahled
    ? slozka?.deti.find((d) => d.jmeno === nahled)
    : undefined;
  const plochaProNahled =
    typeof document !== "undefined"
      ? document.querySelector(".mac-tapeta")
      : null;
  const panelNahledu =
    uzelNahledu && plochaProNahled
      ? createPortal(
          <RychlyNahled
            uzel={uzelNahledu}
            zavri={() => nastavNahled(null)}
            otevri={() => {
              nastavNahled(null);
              otevri(uzelNahledu);
            }}
          />,
          plochaProNahled,
        )
      : null;

  return (
    <div className="mac-bezvyberu flex h-full bg-mac-povrch text-[13px] text-mac-text">
      {naradi}
      {panelNahledu}
      {/* Bok je široký jako jeho kus v pruhu okna (`--mac-bok-sirka`),
          takže opticky sahá až k semaforu. */}
      <aside
        data-postranni
        className="mac-sidebar mac-posuv w-[var(--mac-bok-sirka)] shrink-0 overflow-y-auto px-2 py-3"
      >
        <Skupina nazev="Oblíbené" />
        {MISTA.map((m) => (
          <PolozkaBoku
            key={m.jmeno}
            jmeno={m.jmeno}
            // Oblíbené složky mají na Macu vlastní ikonu podle toho, co v nich
            // je – ne desetkrát tutéž složku. Barvu mají všechny zvýrazňovací,
            // jako na Macu, ne pevnou modrou.
            znak={<m.znak className="h-[15px] w-[15px] text-mac-akcent" />}
            aktivni={slozMac(cesta) === slozMac(m.cesta)}
            tazeni={cilTazeni(m.cesta, `b:${m.jmeno}`)}
            zvyrazneno={nadCilem?.klic === `b:${m.jmeno}`}
            onClick={() => jdi(m.cesta)}
          />
        ))}
        <Skupina nazev="Umístění" />
        <PolozkaBoku
          jmeno="Macintosh HD"
          znak={<HardDrive className="h-[15px] w-[15px] text-mac-akcent" />}
          aktivni={cesta.length === 1}
          onClick={() => jdi([KOREN])}
          tazeni={cilTazeni([KOREN], "b:hd")}
          zvyrazneno={nadCilem?.klic === "b:hd"}
        />
        <PolozkaBoku
          jmeno="FLASH"
          // Vyměnitelný disk je na Macu oranžový, pevný šedý – drobnost,
          // ale je podle ní hned poznat, co je co.
          znak={<Usb className="h-[15px] w-[15px] text-[#f59e0b]" />}
          aktivni={slozMac(cesta) === "/Volumes/FLASH"}
          onClick={() => jdi([...SVAZKY, "FLASH"])}
          tazeni={cilTazeni([...SVAZKY, "FLASH"], "b:flash")}
          zvyrazneno={nadCilem?.klic === "b:flash"}
        />
        <PolozkaBoku
          jmeno="Koš"
          znak={<Trash2 className="h-[15px] w-[15px] text-mac-akcent" />}
          aktivni={slozMac(cesta) === slozMac(KOS)}
          onClick={() => jdi(KOS)}
          tazeni={cilTazeni(KOS, "b:kos")}
          zvyrazneno={nadCilem?.klic === "b:kos"}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          // Celé okno je cíl: sem se pouští z plochy nebo z jiného okna
          // do složky, kterou okno ukazuje.
          {...cilTazeni(cesta, "okno")}
          className={`mac-posuv min-h-0 flex-1 overflow-y-auto ${
            nadCilem?.klic === "okno" ? "ring-2 ring-inset ring-mac-akcent" : ""
          }`}
          onContextMenu={(e) => {
            // Prázdné místo pod seznamem: nabídka jen s „Nová složka".
            if (e.target !== e.currentTarget) return;
            e.preventDefault();
            nastavNabidku({ x: e.clientX, y: e.clientY, jmeno: null });
          }}
        >
          {!slozka ? (
            <p className="p-6 text-mac-slaby">Tahle složka tu není.</p>
          ) : polozky.length === 0 ? (
            <p className="p-6 text-mac-slaby">Složka je prázdná.</p>
          ) : zobrazeni === "ikony" ? (
            /* Mřížka ikon. Na Macu se nevybírá pruh přes celý řádek jako
               v seznamu – zvýrazní se JMÉNO modrou pilulkou pod ikonou. */
            <div className="grid grid-cols-[repeat(auto-fill,minmax(116px,1fr))] items-start gap-y-4 p-4">
              {polozky.map((u) => {
                const vybrana = vybrano === u.jmeno;
                return (
                  <div
                    key={u.jmeno}
                    title={druh(u)}
                    {...zdrojTazeni(u.jmeno)}
                    {...(jeProstaSlozka(u)
                      ? cilTazeni([...cesta, u.jmeno], `m:${u.jmeno}`)
                      : {})}
                    onClick={() => nastavVybrano(u.jmeno)}
                    onDoubleClick={() => otevri(u)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      nastavVybrano(u.jmeno);
                      nastavNabidku({
                        x: e.clientX,
                        y: e.clientY,
                        jmeno: u.jmeno,
                      });
                    }}
                    className={`flex cursor-default flex-col items-center gap-1 rounded-lg px-2 py-1 ${
                      nadCilem?.klic === `m:${u.jmeno}`
                        ? "bg-mac-akcent/15 ring-2 ring-mac-akcent"
                        : ""
                    } ${tazeno === u.jmeno ? "opacity-50" : ""}`}
                  >
                    <IkonaPolozky uzel={u} barevne velke />
                    <span
                      className={`max-w-full rounded-[7px] px-1.5 text-center text-[12px] leading-[15px] ${
                        vybrana
                          ? "bg-mac-akcent text-mac-akcent-text"
                          : "text-mac-text"
                      }`}
                    >
                      {jmenoNeboPole(u, true)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full border-collapse">
              {/* Záhlaví bez verzálek a prostrkání – to je webová tabulka,
                  ne Finder. Průsvitné, ať řádky pod ním při posouvání prosvítají. */}
              <thead className="sticky top-0 bg-mac-povrch/90 text-[11px] text-mac-slaby shadow-[inset_0_-1px_0_rgb(var(--mac-linka))] backdrop-blur-xl">
                <tr>
                  <th className="px-3 py-1.5 text-left font-normal">Název</th>
                  <th className="w-[160px] px-3 py-1.5 text-left font-normal">
                    Datum změny
                  </th>
                  <th className="w-[90px] px-3 py-1.5 text-right font-normal">
                    Velikost
                  </th>
                </tr>
              </thead>
              <tbody>
                {polozky.map((u) => {
                  const vybranaRadka = vybrano === u.jmeno;
                  return (
                    <tr
                      key={u.jmeno}
                      {...zdrojTazeni(u.jmeno)}
                      {...(jeProstaSlozka(u)
                        ? cilTazeni([...cesta, u.jmeno], `r:${u.jmeno}`)
                        : {})}
                      onClick={() => nastavVybrano(u.jmeno)}
                      onDoubleClick={() => otevri(u)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        nastavVybrano(u.jmeno);
                        nastavNabidku({
                          x: e.clientX,
                          y: e.clientY,
                          jmeno: u.jmeno,
                        });
                      }}
                      className={`cursor-default ${
                        nadCilem?.klic === `r:${u.jmeno}`
                          ? "bg-mac-akcent/20 outline outline-2 outline-mac-akcent"
                          : vybranaRadka
                            ? "bg-mac-akcent text-mac-akcent-text"
                            : "odd:bg-black/[0.02] hover:bg-mac-zvyrazneny"
                      } ${tazeno === u.jmeno ? "opacity-50" : ""}`}
                    >
                      <td className="flex items-center gap-2 px-3 py-1.5">
                        <IkonaPolozky uzel={u} barevne={!vybranaRadka} />
                        {jmenoNeboPole(u, false)}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums opacity-80">
                        {datumCas(u.zmeneno)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums opacity-80">
                        {jeProstaSlozka(u)
                          ? "--"
                          : velikostSloupec(velikost(u))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pruh s cestou. Ve Windows je adresní řádek nahoře a píše se do něj;
            tady je dole a jen ukazuje – a hlavně ukazuje unixovou cestu. */}
        <div className="flex h-[24px] shrink-0 items-center gap-2 border-t border-mac-linka bg-mac-panel px-3 text-[11px] text-mac-slaby">
          {/* Během tažení tu místo cesty stojí, co se stane. Je to jediné
              místo, kde je pravidlo přesun/kopie napsané slovy. */}
          {nadCilem ? (
            <span className="font-medium text-mac-akcent">
              {nadCilem.akce === "kopie"
                ? "Pustíš-li to, zkopíruje se to – je to jiný disk"
                : "Pustíš-li to, přesune se to"}
            </span>
          ) : (
            <span className="tabular-nums">{sVlnovkou(cesta)}</span>
          )}
          {/* Skutečný Finder píše dole počet položek a volné místo na disku.
              Kapacita je vymyšlená, ale pevná – kdyby se dopočítávala z obsahu,
              skákala by po každém uloženém souboru a vypadalo by to rozbitě. */}
          <span className="ml-auto">
            {polozekSlovy(polozky.length)}, {volneMisto} k dispozici
          </span>
        </div>
      </div>

      {nabidka && (
        <NabidkaMistni
          x={nabidka.x}
          y={nabidka.y}
          polozky={polozkyNabidky(nabidka.jmeno)}
          zavri={() => nastavNabidku(null)}
        />
      )}

      {hlaska && (
        <Hlaska
          nadpis={hlaska.nadpis}
          text={hlaska.text}
          zavri={() => nastavHlasku(null)}
        />
      )}

      {uzelInformace && (
        <PanelInformace
          nadpis={uzelInformace.jmeno}
          zavri={() => nastavInformace(null)}
          radky={[
            { popisek: "Druh", hodnota: druh(uzelInformace) },
            {
              popisek: "Velikost",
              hodnota: velikostPodrobne(velikost(uzelInformace)),
            },
            ...(jeSlozka(uzelInformace)
              ? [
                  {
                    popisek: "Obsahuje",
                    hodnota: `${pocetPolozek(uzelInformace).souboru} souborů, ${
                      pocetPolozek(uzelInformace).slozek
                    } složek`,
                  },
                ]
              : []),
            {
              popisek: "Kde",
              // Plná cesta bez písmene disku. Přesně tohle je v Informacích
              // nejcennější a ve windowsových Vlastnostech to vypadá jinak.
              hodnota: (
                <span className="font-mono text-[11px]">{slozMac(cesta)}</span>
              ),
            },
            { popisek: "Změněno", hodnota: datumCas(uzelInformace.zmeneno) },
          ]}
        />
      )}
    </div>
  );
}

/**
 * Jak se položka jmenuje v Informacích.
 *
 * Balíček se říká nahlas. Je to jediné místo v prostředí, kde se žák to slovo
 * dozví, aniž by musel hádat – a bez něj by úloha „dostaň se dovnitř aplikace"
 * neměla za co chytit.
 */
function druh(u: Uzel): string {
  if (jeBalicek(u.jmeno)) return "Balíček aplikace (je to složka)";
  if (jeSlozka(u)) return "Složka";
  if (jeSkryte(u.jmeno))
    return "Dokument (jméno začíná tečkou, proto se běžně neukazuje)";
  return "Dokument";
}

function IkonaPolozky({
  uzel,
  barevne,
  velke,
}: {
  uzel: Uzel;
  barevne: boolean;
  velke?: boolean;
}) {
  if (velke) return <VelkaIkona uzel={uzel} />;
  if (jeBalicek(uzel.jmeno)) {
    return <Package className={`h-4 w-4 ${barevne ? "text-mac-slaby" : ""}`} />;
  }
  if (jeSlozka(uzel))
    return <Folder className={`h-4 w-4 ${barevne ? "text-mac-akcent" : ""}`} />;
  return <FileText className="h-4 w-4 opacity-70" />;
}

/**
 * Nadpis sekce v postranním panelu. macOS je píše malými tučnými písmeny,
 * NE verzálkami – verzálky s prostrkáním jsou windowsácký zvyk a byla to
 * jedna z věcí, podle kterých panel nevypadal jako z Macu.
 */
/**
 * Hláška „tohle otevřít nejde". Na Macu je to malé okénko uprostřed s tučným
 * nadpisem a jedním tlačítkem – ne proužek nahoře ani nic, co samo zmizí.
 */
function Hlaska({
  nadpis,
  text,
  zavri,
}: {
  nadpis: string;
  text: string;
  zavri: () => void;
}) {
  useEffect(() => {
    const klavesa = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") zavri();
    };
    window.addEventListener("keydown", klavesa);
    return () => window.removeEventListener("keydown", klavesa);
  }, [zavri]);

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/20">
      <div className="mac-vjezd w-[320px] rounded-xl bg-mac-povrch p-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <p className="text-[13px] font-semibold text-mac-text">{nadpis}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-mac-slaby">
          {text}
        </p>
        <button
          type="button"
          onClick={zavri}
          className="mt-4 w-full rounded-md bg-mac-akcent px-3 py-1.5 text-[13px] font-medium text-mac-akcent-text hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function Skupina({ nazev }: { nazev: string }) {
  return (
    <div className="px-2 pb-1 pt-4 text-[11px] font-semibold text-mac-slaby">
      {nazev}
    </div>
  );
}

function PolozkaBoku({
  jmeno,
  znak,
  aktivni,
  onClick,
  tazeni,
  zvyrazneno,
}: {
  jmeno: string;
  znak: React.ReactNode;
  aktivni: boolean;
  onClick: () => void;
  /** Obsluha pro puštění tažené položky na tohle místo. */
  tazeni?: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
  };
  zvyrazneno?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...tazeni}
      // Vybrané místo má na Macu jemný šedý oblázek, ne plnou modrou –
      // ta patří vybranému SOUBORU ve výpisu, ne položce panelu.
      className={`flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-left ${
        zvyrazneno
          ? "bg-mac-akcent text-mac-akcent-text"
          : aktivni
            ? // Průsvitný oblázek (8 % barvy textu), ať sedí na barvu boku
              // ve světlém i tmavém motivu.
              "bg-mac-text/[0.08] font-medium text-mac-text"
            : "hover:bg-mac-text/[0.05]"
      }`}
    >
      {znak}
      <span className="truncate">{jmeno}</span>
    </button>
  );
}

/**
 * Rychlý náhled (Quick Look).
 *
 * Na Macu se do souboru podíváš mezerníkem, aniž bys spouštěl aplikaci –
 * a to je rozdíl proti Windows, kde nic takového není. Ukáže se to, co jde
 * ukázat: text souboru, obrázek, u složky počet položek. U ostatního se
 * poctivě řekne, že náhled v simulaci není; předstírat ho by bylo horší.
 */
function RychlyNahled({
  uzel,
  zavri,
  otevri,
}: {
  uzel: Uzel;
  zavri: () => void;
  otevri: () => void;
}) {
  const jeObrazek = !jeSlozka(uzel) && uzel.obsah.startsWith("data:image");
  const jeText = !jeSlozka(uzel) && !jeObrazek && jeTextovy(uzel.jmeno);

  let telo: React.ReactNode;
  if (jeSlozka(uzel)) {
    telo = (
      <div className="flex flex-col items-center gap-4 py-10">
        <span className="scale-[2.4]">
          <VelkaIkona uzel={uzel} />
        </span>
        <p className="mt-6 text-[13px] text-mac-slaby">
          {jeBalicek(uzel.jmeno)
            ? "Aplikace (ve skutečnosti složka)"
            : polozekSlovy(uzel.deti.length)}
        </p>
      </div>
    );
  } else if (jeObrazek) {
    telo = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={uzel.obsah}
        alt={uzel.jmeno}
        className="mx-auto max-h-[52vh] max-w-full object-contain"
      />
    );
  } else if (jeText) {
    telo = (
      <pre className="mac-posuv max-h-[52vh] overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[12px] leading-relaxed text-mac-text">
        {uzel.obsah || "(Soubor je prázdný.)"}
      </pre>
    );
  } else {
    telo = (
      <div className="flex flex-col items-center gap-4 py-10">
        <span className="scale-[2.4]">
          <VelkaIkona uzel={uzel} />
        </span>
        <p className="mt-6 max-w-[300px] text-center text-[12px] leading-relaxed text-mac-slaby">
          Náhled pro tenhle druh souboru v simulaci není. Na skutečném Macu by
          se tu ukázal obsah.
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-[860] flex items-center justify-center bg-black/20"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) zavri();
      }}
    >
      <div className="mac-vjezd flex max-h-[76vh] w-[min(620px,88%)] flex-col overflow-hidden rounded-xl bg-mac-povrch shadow-[var(--mac-stin)]">
        <div className="relative flex h-[42px] shrink-0 items-center border-b border-mac-linka bg-mac-panel px-3">
          <button
            type="button"
            onClick={zavri}
            aria-label="Zavřít náhled"
            title="Zavřít (mezerník nebo Escape)"
            className="flex h-6 w-6 items-center justify-center rounded-md text-mac-slaby hover:bg-mac-zvyrazneny hover:text-mac-text"
          >
            ✕
          </button>
          <span className="pointer-events-none absolute inset-x-0 truncate px-24 text-center text-[13px] font-semibold text-mac-text">
            {uzel.jmeno}
          </span>
          <button
            type="button"
            onClick={otevri}
            className="ml-auto rounded-md border border-mac-linka px-2.5 py-1 text-[12px] text-mac-text hover:bg-mac-zvyrazneny"
          >
            Otevřít
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{telo}</div>
        <p className="shrink-0 border-t border-mac-linka px-4 py-2 text-[11px] text-mac-slaby">
          Rychlý náhled: mezerník ho otevře i zavře. Soubor se nespouští, jen se
          do něj díváš.
        </p>
      </div>
    </div>
  );
}
