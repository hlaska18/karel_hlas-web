"use client";

/**
 * Dock.
 *
 * Proti windowsovému hlavnímu panelu tu je jeden podstatný rozdíl, a je to
 * přesně ten, kvůli kterému tahle simulace vznikla: TEČKA POD IKONOU.
 *
 * Na hlavním panelu Windows znamená tlačítko „tady je okno“. V Docku znamená
 * tečka „tady běží program“ – a ta tečka zůstane svítit i potom, co žák zavře
 * poslední okno červeným puntíkem. Je to jediné místo na obrazovce, kde je
 * spuštěný program bez okna vidět, takže se na ni odkazuje i zadání úloh.
 *
 * Schované (žluté) okno se navíc objeví jako vlastní ikona vpravo za čárou,
 * takže jsou oba stavy vidět vedle sebe.
 */

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  Folder,
  Settings,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import { useMac } from "./system";
import { useDzin, zmerVraceni } from "./Dzin";
import {
  IkonaAplikace,
  IkonaFinder,
  IkonaKos,
  IkonaNastaveni,
  IkonaPoznamky,
  IkonaStazene,
  IkonaTerminal,
} from "./ikonyAplikaci";
import { NabidkaMistni, type PolozkaNabidky } from "./ui";
import {
  coUdelaTazeni,
  pustTazene,
  skonciTazeni,
  stopaTazeni,
  tazenaPolozka,
} from "@/lib/mac/tazeni";
import {
  APLIKACE,
  DOCK_MAX,
  DOCK_MIN,
  DOCK_ZVETSENI_DOSAH,
  DOCK_ZVETSENI_MAX,
  PORADI_DOCKU,
  type AppId,
  type Obdelnik,
} from "@/lib/mac/stav";
import { DOKUMENTY, KOS, PLOCHA, STAZENE, slozMac } from "@/lib/mac/cesty";
import { jeSlozka, najdiSlozku, odeber } from "@/lib/win/fs";


/**
 * Ikona Launchpadu, kreslená podle té skutečné: nahoře vyhledávací pole,
 * pod ním mřížka barevných dlaždic. Obecná mřížka z knihovny ikon se
 * nepodobala ničemu a Karel ji v Docku nepoznal.
 */
function ZnakLaunchpad({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const barvy = [
    "#f5a33c",
    "#e8607c",
    "#5ac2a0",
    "#c58cf0",
    "#6aa9f0",
    "#f0c44a",
    "#7fd08a",
    "#e87f7f",
    "#9aa0aa",
  ];
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3.2"
        width="18"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.28"
      />
      <circle cx="6.4" cy="5.2" r="1.1" fill="currentColor" opacity="0.55" />
      {barvy.map((b, i) => (
        <rect
          key={b + i}
          x={3.4 + (i % 3) * 6.2}
          y={9.6 + Math.floor(i / 3) * 4.6}
          width="5.2"
          height="3.6"
          rx="1.2"
          fill={b}
        />
      ))}
    </svg>
  );
}

/** Ikona aplikace: buď z knihovny, nebo vlastní kresba. */
type Znak = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

/**
 * Ikony jsou kreslené, ne obrázkové – prostředí se kvůli Docku nemá stahovat
 * o megabajt navíc, a hlavně by staženými ikonami Applu předstíralo, že je to
 * jejich aplikace.
 *
 * Každá je vlastní kresba, ne symbol z knihovny na barevném čtverci: Finder má
 * dvoubarevný obličej, Terminál výzvu na černém, TextEdit list papíru s perem
 * se žlutým pruhem. Na obecném symbolu nebylo poznat, která aplikace to je,
 * a v Docku to byla ta nejnápadnější věc.
 */
function ZnakFinder({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Modrý obličej se světlým profilem vpravo, jak ho má Finder
          (celá ikona je v ikonyAplikaci.tsx, tohle je malá záloha). */}
      <path d="M2 4h20v16H2z" fill="#1e8ff0" />
      <path d="M12.5 4H22v16h-9.2v-4.4l-1.3-.4 1.3-4.4z" fill="#eaf5ff" />
      <circle cx="7.2" cy="9.6" r="1" fill="#1c1c20" />
      <circle cx="16.8" cy="9.6" r="1" fill="#1c1c20" />
      <path
        d="M6.4 14.8c2 1.7 9.2 1.7 11.2 0"
        fill="none"
        stroke="#1c1c20"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZnakTerminal({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M4.5 7.5 9 11.5 4.5 15.5"
        fill="none"
        stroke="#7dff9b"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 16h8"
        stroke="#7dff9b"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZnakPoznamky({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <rect x="4.5" y="3" width="13" height="18" rx="1.5" fill="#ffffff" stroke="#9aa0aa" strokeWidth="0.8" />
      {[6.5, 9.2, 11.9, 14.6].map((y) => (
        <rect key={y} x="6.5" y={y} width="9" height="1.1" rx="0.55" fill="#9aa0aa" />
      ))}
      <path d="M20.5 8.5 L13 17.5 L12 20 L14.5 19 L22 10 Z" fill="#2b2d33" />
    </svg>
  );
}

function ZnakNastaveni({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.2" fill="#8b9099" />
      <circle cx="12" cy="12" r="3.1" fill="#f2f3f5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <rect
            key={i}
            x="11.1"
            y="1.9"
            width="1.8"
            height="3.4"
            rx="0.9"
            fill="#8b9099"
            transform={`rotate(${(a * 180) / Math.PI} 12 12)`}
          />
        );
      })}
    </svg>
  );
}

/**
 * Vzhled ikony. `plna` je celá ikona přes celou plochu (Karlovy návrhy
 * 24. 9. 2026) – kde je, kreslí se místo značky na barevném podkladu.
 * `pozadi`, `barva` a `znak` zůstávají pro malé odznaky a jako záloha.
 */
export type VzhledAplikace = { pozadi: string; barva: string; znak: Znak; plna?: Znak };

export const VZHLED_APLIKACI: Record<AppId, VzhledAplikace> = {
  finder: {
    pozadi: "linear-gradient(165deg,#35c6ff,#1683ee)",
    barva: "#1c1c20",
    znak: ZnakFinder,
    plna: IkonaFinder,
  },
  poznamky: {
    pozadi: "linear-gradient(165deg,#f4f5f7,#d9dce2)",
    barva: "#2b2d33",
    znak: ZnakPoznamky,
    plna: IkonaPoznamky,
  },
  terminal: {
    pozadi: "linear-gradient(165deg,#3a3a3f,#141416)",
    barva: "#7dff9b",
    znak: ZnakTerminal,
    plna: IkonaTerminal,
  },
  nastaveni: {
    pozadi: "linear-gradient(165deg,#eceef2,#b9bec7)",
    barva: "#3a3a3c",
    znak: ZnakNastaveni,
    plna: IkonaNastaveni,
  },
};

/** Plný Koš – stejná kresba, jen se zmačkanými papíry nahoře. */
function IkonaKosPlny(p: { className?: string; style?: React.CSSProperties }) {
  return <IkonaKos {...p} plny />;
}

/**
 * Stín pod celou ikonou. Sleduje její tvar – i Koš a složku bez podkladu.
 * Jen jeden `drop-shadow`: každý filtr se při zvětšování Docku přepočítává
 * s každým pohybem myši (rada 24. 9. 2026, výkon ve třídě s Netopem).
 */
const STIN_IKONY = "drop-shadow(0 1.5px 2.5px rgba(0,0,0,0.3))";

export function Dock({ onLaunchpad }: { onLaunchpad: () => void }) {
  const { stav, poslat, spust, stopa } = useMac();
  /**
   * Velikost během tažení. Do stavu se zapisuje až po puštění – kdyby se
   * ukládalo při každém pohybu myši, psalo by se do úložiště stokrát za
   * vteřinu kvůli jednomu tahu.
   */
  const [tazena, nastavTazenou] = useState<number | null>(null);
  const dzin = useDzin();
  const rada = useRef<HTMLDivElement>(null);
  const zvetsovat = stav.nastaveni.dockZvetseni && !stav.nastaveni.omezitEfekty;

  /**
   * Zvětšení ikony pod kurzorem.
   *
   * Ikona roste TAK, ABY ZABRALA SKUTEČNÉ MÍSTO, ne jen přes `transform`.
   * První verze ji zvětšovala čistě transformací, kterou rozvržení nevidí:
   * Dock nevěděl, že má ikonu obsáhnout, takže přetékala ven ze skla
   * a přes svislou čárku, za kterou se Dock zvětšuje. Teď si každá ikona
   * řekne o širší místo a o místo nad sebou, Dock se podle toho sám
   * roztáhne a čárka se posune s ostatními.
   *
   * Míra zvětšení se počítá z poloh ikon V KLIDU, změřených při vjezdu myši
   * do Docku. Kdyby se měřilo za pohybu, střed ikony by se posouval podle
   * jejího vlastního zvětšení a celé by se to rozkmitalo.
   *
   * A aby ikona pod kurzorem pod kurzorem i zůstala: Dock je vystředěný,
   * takže by rostl do obou stran a ikona by kurzoru ujela. Celý se proto
   * posune o to, oč vyrostl na jedné straně víc než na druhé.
   */
  const vKlidu = useRef<
    | {
        prvek: HTMLElement;
        tlacitko: HTMLElement;
        stred: number;
        zaklad: number;
      }[]
    | null
  >(null);

  const zmerKlid = () => {
    const obal = rada.current;
    if (!obal) return null;
    // Obyčejný cyklus, ne `flatMap`: ten umí Chrome až od 69 a v cíli
    // prohlížečů je 64 (a Opera 51, což je totéž). Neznámá metoda by
    // neshodila jen zvětšování Docku, ale celé prostředí.
    const merky: {
      prvek: HTMLElement;
      tlacitko: HTMLElement;
      stred: number;
      zaklad: number;
    }[] = [];
    obal.querySelectorAll<HTMLElement>("[data-dock-ikona]").forEach((prvek) => {
      const tlacitko = prvek.querySelector<HTMLElement>("button");
      if (!tlacitko) return;
      const r = tlacitko.getBoundingClientRect();
      merky.push({
        prvek,
        tlacitko,
        stred: r.left + r.width / 2,
        zaklad: tlacitko.offsetWidth,
      });
    });
    vKlidu.current = merky;
    return merky;
  };

  const zvetsi = (e: React.MouseEvent) => {
    const obal = rada.current;
    if (!zvetsovat || !obal) return;
    const merky = vKlidu.current ?? zmerKlid();
    if (!merky) return;
    const x = e.clientX;

    let vlevo = 0;
    let vpravo = 0;
    for (const m of merky) {
      const d = Math.abs(x - m.stred) / (m.zaklad * DOCK_ZVETSENI_DOSAH);
      const v = Math.max(0, 1 - d);
      // Vyhlazení, ať zvětšení nepřechází do okolí lomeně.
      const mira = 1 + (DOCK_ZVETSENI_MAX - 1) * (v * v * (3 - 2 * v));
      const prirustek = (mira - 1) * m.zaklad;
      // Kolik z přírůstku padne nalevo od kurzoru: podle toho, KDE v ikoně
      // kurzor stojí, ne jen na kterou stranu od jejího středu. První verze
      // přiřazovala přírůstek celý jedné straně a stačil zlomek pixelu přes
      // střed ikony, aby Dock pod rukou poskočil o polovinu jejího růstu.
      const levyOkraj = m.stred - m.zaklad / 2;
      const podil = Math.max(0, Math.min(1, (x - levyOkraj) / m.zaklad));
      vlevo += prirustek * podil;
      vpravo += prirustek * (1 - podil);
      m.prvek.style.transition = "none";
      m.tlacitko.style.transition = "none";
      m.prvek.style.width = `${m.zaklad * mira}px`;
      m.prvek.style.paddingTop = `${prirustek}px`;
      m.tlacitko.style.transformOrigin = "bottom center";
      m.tlacitko.style.transform = `scale(${mira.toFixed(3)})`;
    }
    obal.style.transition = "none";
    obal.style.transform = `translateX(${((vpravo - vlevo) / 2).toFixed(1)}px)`;
  };

  const sroveji = () => {
    const obal = rada.current;
    const hladce = "180ms ease-out";
    for (const m of vKlidu.current ?? []) {
      m.prvek.style.transition = `width ${hladce}, padding-top ${hladce}`;
      m.tlacitko.style.transition = `transform ${hladce}`;
      m.prvek.style.width = "";
      m.prvek.style.paddingTop = "";
      m.tlacitko.style.transform = "";
    }
    if (obal) {
      obal.style.transition = `transform ${hladce}`;
      obal.style.transform = "";
    }
    // Při dalším vjezdu se klidové polohy změří znovu – mezitím se Dock
    // mohl zvětšit tažením za čárku nebo přibyla schovaná okna.
    vKlidu.current = null;
  };
  const velikost = tazena ?? stav.nastaveni.dockVelikost;

  /**
   * Vrácení okna z Docku. Tady je pořadí obrácené než u schování: nejdřív
   * se přehraje vyjetí z ikony a teprve potom se okno vrátí do stavu, aby
   * nestálo na obrazovce dřív, než tam doletí.
   */
  const vratZDocku = (
    okno: { id: number; app: AppId; ram: Obdelnik },
    pomalu = false,
  ) => {
    const doStavu = () => poslat({ typ: "okno/obnov", id: okno.id });
    const zmereno = zmerVraceni(okno.ram, okno.app, okno.id);
    if (!zmereno) {
      doStavu();
      return;
    }
    dzin({ ...zmereno, smer: -1, pomalu, poDobehnuti: doStavu });
  };

  /**
   * Tažení za čárku v Docku. Na Macu je ta čárka táhlo, ne ozdoba: chytne
   * se a tahem nahoru se Dock zvětší, dolů zmenší. Tady to bylo jenom
   * nakreslené, což vypadalo jako rozbité táhlo.
   */
  const zacniTahat = (e: React.MouseEvent) => {
    e.preventDefault();
    const zacatekY = e.clientY;
    const zacatekVelikost = stav.nastaveni.dockVelikost;
    let posledni = zacatekVelikost;

    const pohyb = (ev: MouseEvent) => {
      // Nahoru je větší, proto zacatekY minus aktuální.
      const nova = zacatekVelikost + (zacatekY - ev.clientY);
      posledni = Math.max(DOCK_MIN, Math.min(DOCK_MAX, Math.round(nova)));
      nastavTazenou(posledni);
    };
    const konec = () => {
      window.removeEventListener("mousemove", pohyb);
      window.removeEventListener("mouseup", konec);
      nastavTazenou(null);
      poslat({ typ: "nastaveni/zmen", zmena: { dockVelikost: posledni } });
    };
    window.addEventListener("mousemove", pohyb);
    window.addEventListener("mouseup", konec);
  };
  const schovana = stav.okna.filter((o) => o.minimalizovane);
  /** Kolik je v koši. Plný koš má na Macu jinou ikonu než prázdný. */
  const vKosi = najdiSlozku(stav.disk, KOS)?.deti.length ?? 0;

  /**
   * Nabídka po kliknutí pravým tlačítkem na ikonu.
   *
   * Dřív tu žádná nebyla, takže vyskočila nabídka prohlížeče („Znovu načíst
   * stránku…") a iluze Macu se rozbila. Obsah se drží skutečného Docku:
   * nahoře okna programu (✓ to vpředu, ◆ schované v Docku), pod nimi nové
   * okno a nakonec Ukončit.
   *
   * U Finderu Ukončit CHYBÍ, stejně jako na Macu. Není to opomenutí, je to
   * tatáž lekce jako úloha „Okno není program": Finder běží vždycky.
   *
   * Ve stavu se drží jen to, KTERÁ ikona to je; položky se skládají až při
   * vykreslení, ať nikdy neukazují zastaralý seznam oken.
   */
  const [nabidka, nastavNabidku] = useState<{
    x: number;
    y: number;
    co: AppId | "launchpad" | "stazene" | "kos";
  } | null>(null);

  const naPraveTlacitko =
    (co: AppId | "launchpad" | "stazene" | "kos") => (e: React.MouseEvent) => {
      e.preventDefault();
      const ikona =
        (e.currentTarget as HTMLElement).querySelector("button") ??
        e.currentTarget;
      const r = ikona.getBoundingClientRect();
      nastavNabidku({ x: r.left + r.width / 2, y: r.top, co });
    };

  /**
   * Koš a Stažené jsou v Docku i cíle tažení: soubor přetažený na koš se
   * do něj přesune, na Stažené se přesune do Stažených. Ikona pod taženým
   * souborem ztmavne, jako na Macu. Pravidla jsou společná s Finderem
   * a plochou (`lib/mac/tazeni.ts`).
   */
  const [nadIkonou, nastavNadIkonou] = useState<"kos" | "stazene" | null>(null);
  const cilVDocku = (klic: "kos" | "stazene", cil: string[]) => ({
    onDragOver: (e: React.DragEvent) => {
      const zdroj = tazenaPolozka();
      const akce = zdroj ? coUdelaTazeni(stav.disk, zdroj, cil) : null;
      if (!akce) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = akce === "kopie" ? "copy" : "move";
      if (nadIkonou !== klic) nastavNadIkonou(klic);
    },
    onDragLeave: () => {
      if (nadIkonou === klic) nastavNadIkonou(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const zdroj = tazenaPolozka();
      const vysledek = zdroj ? pustTazene(stav.disk, zdroj, cil) : null;
      if (vysledek) {
        poslat({ typ: "disk/nastav", disk: vysledek.disk });
        stopa(stopaTazeni(cil, vysledek.akce));
      }
      nastavNadIkonou(null);
      skonciTazeni();
    },
  });

  const vysypKos = () => {
    const kos = najdiSlozku(stav.disk, KOS);
    if (!kos || kos.deti.length === 0) return;
    let disk = stav.disk;
    for (const d of kos.deti) disk = odeber(disk, [...KOS, d.jmeno]);
    poslat({ typ: "disk/nastav", disk });
    stopa("vysypal-kos");
  };

  const polozkyAplikace = (app: AppId): PolozkaNabidky[] => {
    if (!stav.bezici.includes(app))
      return [{ text: "Otevřít", akce: () => otevriZDocku(app) }];
    const okna = stav.okna
      .filter((o) => o.app === app)
      .sort((a, b) => a.id - b.id);
    const viditelna = okna.filter((o) => !o.minimalizovane);
    const nahore = viditelna.length
      ? viditelna.reduce((a, b) => (a.z > b.z ? a : b))
      : null;
    const polozky: PolozkaNabidky[] = okna.map((o) => ({
      text: o.titul || APLIKACE[app].nazev,
      znak: o.minimalizovane ? "◆" : o.id === nahore?.id ? "✓" : undefined,
      akce: () =>
        o.minimalizovane
          ? vratZDocku(o)
          : poslat({ typ: "okno/dopredu", id: o.id }),
    }));
    if (polozky.length) polozky[polozky.length - 1].oddelovac = true;
    const nove: Partial<Record<AppId, PolozkaNabidky>> = {
      finder: {
        text: "Nové okno Finderu",
        akce: () => spust("finder", slozMac(PLOCHA)),
      },
      poznamky: {
        text: "Nová poznámka",
        akce: () => spust("poznamky", slozMac([...DOKUMENTY, "Poznámka.txt"])),
      },
      terminal: { text: "Nové okno", akce: () => spust("terminal") },
    };
    const noveOkno = nove[app];
    if (noveOkno) polozky.push({ ...noveOkno, oddelovac: app !== "finder" });
    if (app !== "finder")
      polozky.push({
        text: "Ukončit",
        akce: () => poslat({ typ: "app/ukonci", app }),
      });
    return polozky;
  };

  const polozkyNabidky = (
    co: AppId | "launchpad" | "stazene" | "kos",
  ): PolozkaNabidky[] => {
    if (co === "launchpad") return [{ text: "Otevřít", akce: onLaunchpad }];
    if (co === "stazene")
      return [
        {
          text: "Otevřít „Stažené“",
          akce: () => spust("finder", slozMac(STAZENE)),
        },
      ];
    if (co === "kos")
      return [
        {
          text: "Otevřít",
          akce: () => spust("finder", slozMac(KOS)),
          oddelovac: true,
        },
        { text: "Vysypat koš", akce: vKosi ? vysypKos : undefined },
      ];
    return polozkyAplikace(co);
  };

  /**
   * Co udělá kliknutí na ikonu v Docku.
   *
   * Přesně jako na skutečném Macu, a to ve všech čtyřech případech:
   *   neběží                → spustí se a otevře okno
   *   běží a okno je vidět  → vytáhne se dopředu
   *   běží a okno je v Docku→ vrátí se z Docku
   *   běží a okno není      → otevře se NOVÉ okno
   *
   * Poslední případ se sem musel dodělat. Předtím se jen přepnula lišta
   * nahoře a na obrazovce se nestalo nic – žák, který zavřel okno Finderu,
   * neměl jak se dostat zpátky a vypadalo to jako rozbitá ikona. Lekci to
   * nebere: tečka pod ikonou svítila celou dobu a nahoře stál Finder, což
   * je přesně to, co má úloha ukázat.
   */
  const otevriZDocku = (app: AppId) => {
    if (!stav.bezici.includes(app)) {
      spust(app);
      return;
    }
    const jehoOkna = stav.okna.filter((o) => o.app === app);
    if (jehoOkna.length === 0) {
      spust(app);
      return;
    }
    const vidiSe = jehoOkna.filter((o) => !o.minimalizovane);
    if (vidiSe.length === 0) {
      const posledni = jehoOkna.reduce((a, b) => (a.z > b.z ? a : b));
      poslat({ typ: "okno/obnov", id: posledni.id });
      return;
    }
    poslat({ typ: "app/dopredu", app });
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[800] flex justify-center pb-2">
      <div
        ref={rada}
        onMouseMove={zvetsi}
        onMouseLeave={sroveji}
        className="mac-dock mac-bezvyberu pointer-events-auto relative flex items-end gap-2 rounded-2xl px-2 py-2"
      >
        {/* Finder úplně vlevo, hned za ním Aplikace (dřív Launchpad) – jediné
            místo, kde žák uvidí všechny aplikace pohromadě. Pořadí je
            v `PORADI_DOCKU` a stojí na něm texty úloh. */}
        {PORADI_DOCKU.map((app) =>
          app === "aplikace" ? (
            <Ikona
              key={app}
              popis="Aplikace"
              strana={velikost}
              zvetsuje={zvetsovat}
              vzhled={{
                pozadi: "linear-gradient(165deg,#fbfbfd,#d6d8de)",
                barva: "#3a3a3c",
                znak: ZnakLaunchpad,
                plna: IkonaAplikace,
              }}
              onClick={onLaunchpad}
              onContextMenu={naPraveTlacitko("launchpad")}
              bezPopisku={nabidka !== null}
            />
          ) : (
            <Ikona
              key={app}
              popis={APLIKACE[app].nazev}
              strana={velikost}
              zvetsuje={zvetsovat}
              znacka={{ "data-dock-app": app }}
              vzhled={VZHLED_APLIKACI[app]}
              bezi={stav.bezici.includes(app)}
              skakat={!stav.nastaveni.omezitEfekty}
              onClick={() => otevriZDocku(app)}
              onContextMenu={naPraveTlacitko(app)}
              bezPopisku={nabidka !== null}
            />
          ),
        )}

        {/* Za čárou stojí na Macu zástupci složek a koš – ne aplikace.
            Proto jsou tady, ne v řadě výš. */}
        <div
          onMouseDown={zacniTahat}
          title="Táhni nahoru nebo dolů a změň velikost Docku"
          className="mx-1 w-[7px] shrink-0 cursor-ns-resize self-center"
          style={{ height: Math.round(velikost * 0.8) }}
        >
          {/* Čára je tenká, ale chytat se musí dát i vedle ní – proto je
              kolem ní širší průhledný pruh. Barva jde z barvy textu: tmavá
              na světlém skle, světlá na tmavém. Bílá napevno na světlém
              Docku nebyla vidět, a úloha se žlutým puntíkem podle ní
              naviguje (rada 24. 9. 2026). */}
          <div className="mx-auto h-full w-px bg-mac-text/20" />
        </div>
        <Ikona
          popis="Stažené"
          strana={velikost}
          zvetsuje={zvetsovat}
          vzhled={{
            pozadi: "linear-gradient(160deg,#9fd6ff,#3f97e0)",
            barva: "#0b3c63",
            znak: Download,
            plna: IkonaStazene,
          }}
          onClick={() => spust("finder", slozMac(STAZENE))}
          onContextMenu={naPraveTlacitko("stazene")}
          bezPopisku={nabidka !== null}
          tazeni={cilVDocku("stazene", STAZENE)}
          ztmavena={nadIkonou === "stazene"}
        />

        {/*
          Schovaná okna. Na Macu stojí v pravé části Docku hned před košem,
          stejně velká jako ostatní ikony, a vypadají jako zmenšené okno
          s ikonkou aplikace v rohu. Dřív tu byla vlevo za aplikacemi za
          vlastní čárou, menší a s ikonou aplikace – vypadala jako „naposledy
          otevřené aplikace" a ve třídě to tak i působilo.
        */}
        {schovana.map((okno) => (
          <Ikona
            key={okno.id}
            popis={`${okno.titul || APLIKACE[okno.app].nazev} – schované okno`}
            strana={velikost}
            zvetsuje={zvetsovat}
            vzhled={VZHLED_APLIKACI[okno.app]}
            obsah={<MiniOkno app={okno.app} strana={velikost} />}
            znacka={{ "data-dock-okno": String(okno.id) }}
            onClick={(e) => vratZDocku(okno, e.shiftKey)}
            // Nabídku tu skutečný Mac nemá; jen ať nevyskočí ta prohlížečová.
            onContextMenu={(e) => e.preventDefault()}
          />
        ))}
        <Ikona
          popis={vKosi === 0 ? "Koš (prázdný)" : `Koš (${vKosi})`}
          strana={velikost}
          zvetsuje={zvetsovat}
          vzhled={{
            pozadi:
              vKosi === 0
                ? "linear-gradient(160deg,#d8d8dd,#a9a9b0)"
                : "linear-gradient(160deg,#c3c7cf,#7f858f)",
            barva: "#3a3a3c",
            znak: Trash2,
            plna: vKosi === 0 ? IkonaKos : IkonaKosPlny,
          }}
          // Koš je na Macu složka, takže se otevře ve Finderu jako každá jiná.
          // Tím se zároveň prozradí, že smazané soubory nezmizely.
          onClick={() => spust("finder", slozMac(KOS))}
          onContextMenu={naPraveTlacitko("kos")}
          bezPopisku={nabidka !== null}
          tazeni={cilVDocku("kos", KOS)}
          ztmavena={nadIkonou === "kos"}
        />
      </div>

      {nabidka && (
        <NabidkaMistni
          nad
          x={nabidka.x}
          y={nabidka.y}
          polozky={polozkyNabidky(nabidka.co)}
          zavri={() => nastavNabidku(null)}
        />
      )}
    </div>
  );
}

function Ikona({
  popis,
  vzhled,
  bezi,
  skakat,
  strana,
  znacka,
  zvetsuje,
  onClick,
  onContextMenu,
  bezPopisku,
  tazeni,
  ztmavena,
  obsah,
}: {
  popis: string;
  vzhled: VzhledAplikace;
  bezi?: boolean;
  /** Poskočit, když se program spustí? Vypíná to Omezit efekty. */
  skakat?: boolean;
  /** Značka do DOMu, aby efekt džina našel, kam okno letí. */
  znacka?: Record<string, string>;
  /** Strana ikony v pixelech. Řídí ji tažení za čárku v Docku. */
  strana: number;
  /** Zvětšuje se celý Dock pod kurzorem? Pak si ikona nepřidává vlastní skok. */
  zvetsuje?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Když je otevřená nabídka, popisek nad ikonou se neukazuje – jako na Macu. */
  bezPopisku?: boolean;
  /** Obsluha, když je ikona cílem tažení (Koš, Stažené). */
  tazeni?: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Ztmavená – nad ikonou se právě vznáší tažený soubor. */
  ztmavena?: boolean;
  /** Vlastní kresba místo značky na barevném čtverci (schované okno). */
  obsah?: React.ReactNode;
}) {
  const Znak = vzhled.znak;
  const Plna = obsah ? undefined : vzhled.plna;

  /*
   * Skok při spuštění. Na Macu ikona poskočí ve chvíli, kdy se pod ní
   * rozsvítí tečka, a pohyb stáhne pohled dolů do Docku. Jen při změně
   * z „neběží“ na „běží“ – Finder, který běží od začátku, neskáče.
   */
  const [skace, nastavSkace] = useState(false);
  const beziDriv = useRef(bezi);
  const skakatRef = useRef(skakat);
  skakatRef.current = skakat;
  useEffect(() => {
    const driv = beziDriv.current;
    beziDriv.current = bezi;
    if (!bezi || driv || !skakatRef.current) return;
    nastavSkace(true);
    const id = window.setTimeout(() => nastavSkace(false), 1000);
    return () => {
      window.clearTimeout(id);
      nastavSkace(false);
    };
  }, [bezi]);

  return (
    <div
      data-dock-ikona
      // Roste se nahoru z Docku, ne do stran od středu – proto počátek dole.
      className="group/dock relative flex origin-bottom flex-col items-center"
      onContextMenu={onContextMenu}
      {...tazeni}
      {...znacka}
    >
      {/* Popisek nad ikonou. V Docku je to jediné, co ikonu pojmenuje – bez
          něj žák hádá podle obrázku, a u Terminálu to není poznat. */}
      {/* Bublina jde s motivem: světlá s tmavým textem ve světlém, tmavá
          v tmavém. Černá napevno působila na světlém Docku jako popisek
          z Windows (rada 24. 9. 2026). */}
      <span
        className={`pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-mac-panel/95 px-2 py-1 text-[12px] text-mac-text opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition-opacity ${
          bezPopisku ? "" : "group-hover/dock:opacity-100"
        }`}
      >
        {popis}
      </span>
      {/* Bez `title`: prohlížeč by pod ikonu přidal ještě vlastní šedou
          bublinu se jménem, takže by jméno viselo dvakrát – nad ikonou
          i pod ní. Jméno pro čtečky obrazovky drží `aria-label`. */}
      <button
        type="button"
        // Čtečka obrazovky tečku nevidí – „běží“ jí to řekne slovy.
        aria-label={bezi ? `${popis}, běží` : popis}
        onClick={onClick}
        disabled={!onClick}
        // Zaoblení 22 % strany je macOS „squircle"; pevných 12 px vypadalo
        // při větší ikoně jako obyčejný zaoblený čtverec.
        className={`flex items-center justify-center disabled:cursor-default ${
          obsah || Plna ? "" : "shadow-md"
        } ${ztmavena ? "brightness-75" : ""} ${skace ? "mac-skok" : ""} ${
          // Když se zvětšuje celý Dock, nesmí si ikona přidávat ještě vlastní
          // skok při najetí – skládalo by se to a poskakovalo.
          zvetsuje
            ? ""
            : "transition-transform duration-150 hover:-translate-y-1.5 hover:scale-110"
        }`}
        style={{
          width: strana,
          height: strana,
          background: obsah || Plna ? "transparent" : vzhled.pozadi,
          borderRadius: `${Math.round(strana * 0.22)}px`,
        }}
      >
        {/* Celá ikona vyplní plochu. Značka na podkladu (záloha) roste
            s ikonou – 55 % strany sedí na nejmenším i největším Docku. */}
        {obsah ??
          (Plna ? (
            <Plna style={{ width: strana, height: strana, filter: STIN_IKONY }} />
          ) : (
            <Znak
              style={{
                color: vzhled.barva,
                width: Math.round(strana * 0.55),
                height: Math.round(strana * 0.55),
              }}
            />
          ))}
      </button>
      {/*
        Tečka běžícího programu.

        Je to jediné místo na obrazovce, kde je vidět program bez okna, takže
        na ni ukazuje zadání první úlohy. Dřív byla schválně větší (6 px), protože
        4 px přes světlé sklo byly sotva znát. 24. 9. 2026 Karel rozhodl „co bude
        nejvíc Apple“ – má tedy 4 px jako skutečný macOS a zadání úlohy žáka
        upozorní, že je malá a má se podívat pozorně.

        Barva jde z `--mac-text`, takže je tmavá ve světlém motivu a světlá
        v tmavém. Bílá napevno by v tmavém motivu zmizela úplně.

        Místo pod ikonou je rezervované vždycky, aby ikony neposkakovaly
        nahoru a dolů podle toho, co zrovna běží.
      */}
      <span
        className={`mt-[3px] h-[4px] w-[4px] rounded-full ${
          bezi ? "bg-mac-text/70" : "bg-transparent"
        }`}
      />
    </div>
  );
}

/**
 * Schované okno v Docku: zmenšené okno se semaforem a ikonkou aplikace
 * v rohu, jako náhled na Macu. Míry jsou v pixelech, ne v procentech
 * s `aspect-ratio` – to Chrome 64 z cíle prohlížečů neumí.
 */
function MiniOkno({ app, strana }: { app: AppId; strana: number }) {
  const v = VZHLED_APLIKACI[app];
  const Znak = v.znak;
  const Plna = v.plna;
  const pruh = Math.max(4, Math.round(strana * 0.15));
  const puntik = Math.max(2, Math.round(strana * 0.06));
  const odznak = Math.round(strana * 0.42);
  return (
    <span className="relative block" style={{ width: strana, height: strana }}>
      <span
        className="absolute overflow-hidden rounded-[3px] bg-mac-povrch shadow-md ring-1 ring-black/15"
        style={{
          left: Math.round(strana * 0.04),
          right: Math.round(strana * 0.04),
          top: Math.round(strana * 0.16),
          bottom: Math.round(strana * 0.16),
        }}
      >
        <span
          className="flex items-center bg-mac-panel"
          style={{ height: pruh, gap: puntik, paddingLeft: puntik * 1.5 }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((b) => (
            <span
              key={b}
              className="block rounded-full"
              style={{ width: puntik, height: puntik, background: b }}
            />
          ))}
        </span>
        <span
          className="block rounded-sm bg-mac-linka"
          style={{
            margin: `${puntik * 2}px ${puntik * 2}px 0`,
            height: puntik,
          }}
        />
        <span
          className="block w-1/2 rounded-sm bg-mac-linka"
          style={{ margin: `${puntik}px ${puntik * 2}px 0`, height: puntik }}
        />
      </span>
      <span
        className={`absolute flex items-center justify-center ${Plna ? "" : "shadow"}`}
        style={{
          right: 0,
          bottom: 0,
          width: odznak,
          height: odznak,
          background: Plna ? "transparent" : v.pozadi,
          borderRadius: Math.round(odznak * 0.22),
        }}
      >
        {Plna ? (
          <Plna style={{ width: odznak, height: odznak, filter: STIN_IKONY }} />
        ) : (
          <Znak
            style={{
              color: v.barva,
              width: Math.round(odznak * 0.6),
              height: Math.round(odznak * 0.6),
            }}
          />
        )}
      </span>
    </span>
  );
}
