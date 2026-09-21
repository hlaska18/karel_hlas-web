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

import { useRef, useState } from "react";
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
import { NabidkaMistni, type PolozkaNabidky } from "./ui";
import {
  APLIKACE,
  DOCK_MAX,
  DOCK_MIN,
  DOCK_ZVETSENI_DOSAH,
  DOCK_ZVETSENI_MAX,
  type AppId,
  type Obdelnik,
} from "@/lib/mac/stav";
import { DOKUMENTY, KOS, PLOCHA, STAZENE, slozMac } from "@/lib/mac/cesty";
import { jeSlozka, najdiSlozku, odeber } from "@/lib/win/fs";

const PORADI: AppId[] = ["finder", "poznamky", "terminal", "nastaveni"];

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
 * dvoubarevný obličej, Terminál výzvu na černém, Poznámky linkovaný papír
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
      {/* Dvě poloviny obličeje, jak je má Finder: světlejší levá, sytější pravá */}
      <path d="M2 4h10v16H2z" fill="#bfe3ff" />
      <path d="M12 4h10v16H12z" fill="#1e88e5" />
      <circle cx="7.4" cy="10" r="1.05" fill="#0b3c63" />
      <circle cx="16.6" cy="10" r="1.05" fill="#ffffff" />
      <path
        d="M6.6 15.2c1.9 1.5 8.9 1.5 10.8 0"
        fill="none"
        stroke="#0b3c63"
        strokeOpacity="0.85"
        strokeWidth="1.3"
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
      <rect x="4" y="3.5" width="16" height="17" rx="2" fill="#fffaf0" />
      <rect x="4" y="3.5" width="16" height="3.6" rx="2" fill="#f0b429" />
      {[10.5, 13.4, 16.3].map((y) => (
        <rect
          key={y}
          x="6.6"
          y={y}
          width="10.8"
          height="1.25"
          rx="0.62"
          fill="#c9a227"
          opacity="0.6"
        />
      ))}
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

export const VZHLED_APLIKACI: Record<
  AppId,
  { pozadi: string; barva: string; znak: Znak }
> = {
  finder: {
    pozadi: "linear-gradient(165deg,#ffffff,#e6eef6)",
    barva: "#0b3c63",
    znak: ZnakFinder,
  },
  poznamky: {
    pozadi: "linear-gradient(165deg,#fff6dc,#f3d98a)",
    barva: "#5a4300",
    znak: ZnakPoznamky,
  },
  terminal: {
    pozadi: "linear-gradient(165deg,#3a3a3f,#141416)",
    barva: "#7dff9b",
    znak: ZnakTerminal,
  },
  nastaveni: {
    pozadi: "linear-gradient(165deg,#eceef2,#b9bec7)",
    barva: "#3a3a3c",
    znak: ZnakNastaveni,
  },
};

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
    const merky = Array.from(
      obal.querySelectorAll<HTMLElement>("[data-dock-ikona]"),
    ).flatMap((prvek) => {
      const tlacitko = prvek.querySelector<HTMLElement>("button");
      if (!tlacitko) return [];
      const r = tlacitko.getBoundingClientRect();
      return [
        {
          prvek,
          tlacitko,
          stred: r.left + r.width / 2,
          zaklad: tlacitko.offsetWidth,
        },
      ];
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
        className="mac-sklo mac-bezvyberu pointer-events-auto relative flex items-end gap-2 rounded-2xl border border-white/20 px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
      >
        {/* Launchpad stojí na Macu hned vedle Finderu a je to jediné místo,
            kde žák uvidí všechny aplikace pohromadě. */}
        <Ikona
          popis="Launchpad"
          strana={velikost}
          zvetsuje={zvetsovat}
          vzhled={{
            pozadi: "linear-gradient(165deg,#fbfbfd,#d6d8de)",
            barva: "#3a3a3c",
            znak: ZnakLaunchpad,
          }}
          onClick={onLaunchpad}
          onContextMenu={naPraveTlacitko("launchpad")}
          bezPopisku={nabidka !== null}
        />
        {PORADI.map((app) => (
          <Ikona
            key={app}
            popis={APLIKACE[app].nazev}
            strana={velikost}
            zvetsuje={zvetsovat}
            znacka={{ "data-dock-app": app }}
            vzhled={VZHLED_APLIKACI[app]}
            bezi={stav.bezici.includes(app)}
            onClick={() => otevriZDocku(app)}
            onContextMenu={naPraveTlacitko(app)}
            bezPopisku={nabidka !== null}
          />
        ))}

        {schovana.length > 0 && (
          <div
            className="mx-1 w-px self-center bg-white/25"
            style={{ height: Math.round(velikost * 0.8) }}
          />
        )}

        {schovana.map((okno) => (
          <Ikona
            key={okno.id}
            popis={`${okno.titul || APLIKACE[okno.app].nazev} – schované okno`}
            strana={Math.round(velikost * 0.72)}
            zvetsuje={zvetsovat}
            vzhled={VZHLED_APLIKACI[okno.app]}
            znacka={{ "data-dock-okno": String(okno.id) }}
            onClick={(e) => vratZDocku(okno, e.shiftKey)}
            // Nabídku tu skutečný Mac nemá; jen ať nevyskočí ta prohlížečová.
            onContextMenu={(e) => e.preventDefault()}
          />
        ))}

        {/* Za čárou stojí na Macu zástupci složek a koš – ne aplikace.
            Proto jsou tady, ne v řadě výš. */}
        <div
          onMouseDown={zacniTahat}
          title="Táhni nahoru nebo dolů a změň velikost Docku"
          className="mx-1 w-[7px] shrink-0 cursor-ns-resize self-center"
          style={{ height: Math.round(velikost * 0.8) }}
        >
          {/* Čára je tenká, ale chytat se musí dát i vedle ní – proto je
              kolem ní širší průhledný pruh. */}
          <div className="mx-auto h-full w-px bg-white/25" />
        </div>
        <Ikona
          popis="Stažené"
          strana={velikost}
          zvetsuje={zvetsovat}
          vzhled={{
            pozadi: "linear-gradient(160deg,#9fd6ff,#3f97e0)",
            barva: "#0b3c63",
            znak: Download,
          }}
          onClick={() => spust("finder", slozMac(STAZENE))}
          onContextMenu={naPraveTlacitko("stazene")}
          bezPopisku={nabidka !== null}
        />
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
          }}
          // Koš je na Macu složka, takže se otevře ve Finderu jako každá jiná.
          // Tím se zároveň prozradí, že smazané soubory nezmizely.
          onClick={() => spust("finder", slozMac(KOS))}
          onContextMenu={naPraveTlacitko("kos")}
          bezPopisku={nabidka !== null}
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
  strana,
  znacka,
  zvetsuje,
  onClick,
  onContextMenu,
  bezPopisku,
}: {
  popis: string;
  vzhled: { pozadi: string; barva: string; znak: Znak };
  bezi?: boolean;
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
}) {
  const Znak = vzhled.znak;
  return (
    <div
      data-dock-ikona
      // Roste se nahoru z Docku, ne do stran od středu – proto počátek dole.
      className="group/dock relative flex origin-bottom flex-col items-center"
      onContextMenu={onContextMenu}
      {...znacka}
    >
      {/* Popisek nad ikonou. V Docku je to jediné, co ikonu pojmenuje – bez
          něj žák hádá podle obrázku, a u Terminálu to není poznat. */}
      <span
        className={`pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-black/75 px-2 py-1 text-[12px] text-white opacity-0 transition-opacity ${
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
        aria-label={popis}
        onClick={onClick}
        disabled={!onClick}
        // Zaoblení 22 % strany je macOS „squircle"; pevných 12 px vypadalo
        // při větší ikoně jako obyčejný zaoblený čtverec.
        className={`flex items-center justify-center shadow-md disabled:cursor-default ${
          // Když se zvětšuje celý Dock, nesmí si ikona přidávat ještě vlastní
          // skok při najetí – skládalo by se to a poskakovalo.
          zvetsuje
            ? ""
            : "transition-transform duration-150 hover:-translate-y-1.5 hover:scale-110"
        }`}
        style={{
          width: strana,
          height: strana,
          background: vzhled.pozadi,
          borderRadius: `${Math.round(strana * 0.22)}px`,
        }}
      >
        {/* Značka roste s ikonou – 55 % strany je poměr, na kterém to sedí
            i na nejmenším i na největším Docku. */}
        <Znak
          style={{
            color: vzhled.barva,
            width: Math.round(strana * 0.55),
            height: Math.round(strana * 0.55),
          }}
        />
      </button>
      {/*
        Tečka běžícího programu.

        Je to jediné místo na obrazovce, kde je vidět program bez okna, takže
        na ni ukazuje zadání první úlohy – a proto je schválně o kus větší, než
        má skutečný macOS. Změřeno na 4 px přes světlé sklo Docku: byla sotva
        znát a úloha, která na ni odkazuje, by nedávala smysl.

        Barva jde z `--mac-text`, takže je tmavá ve světlém motivu a světlá
        v tmavém. Bílá napevno by v tmavém motivu zmizela úplně.

        Místo pod ikonou je rezervované vždycky, aby ikony neposkakovaly
        nahoru a dolů podle toho, co zrovna běží.
      */}
      <span
        className={`mt-1 h-[6px] w-[6px] rounded-full ${
          bezi ? "bg-mac-text/75" : "bg-transparent"
        }`}
      />
    </div>
  );
}
