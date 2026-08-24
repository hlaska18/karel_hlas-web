"use client";

/**
 * Celý virtuální počítač: přihlášení, plocha, okna, hlavní panel, vypnutí.
 *
 * Obrazovka je jeden prvek s vlastním souřadným systémem – okna se pokládají
 * vůči němu, ne vůči stránce. Díky tomu je jedno, jestli žák stránku roluje,
 * má jiné rozlišení nebo si zapne celou obrazovku.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Maximize2, Minimize2, Power } from "lucide-react";
import Link from "next/link";
import { SystemProvider, OknoProvider, useSystem } from "./system";
import { Plocha } from "./Plocha";
import { OknoRam } from "./OknoRam";
import { HlavniPanel } from "./HlavniPanel";
import type { Panel } from "./HlavniPanel";
import { Start } from "./Start";
import { PanelUkolu } from "./PanelUkolu";
import { Prihlaseni } from "./Prihlaseni";
import { Pruzkumnik } from "./apps/Pruzkumnik";
import { PoznamkovyBlok } from "./apps/PoznamkovyBlok";
import { Malovani } from "./apps/Malovani";
import { Kalkulacka } from "./apps/Kalkulacka";
import { Nastaveni } from "./apps/Nastaveni";
import { Terminal } from "./apps/Terminal";
import { SpravceUloh } from "./apps/SpravceUloh";
import { Fotky } from "./apps/Fotky";
import { Prohlizec } from "./apps/Prohlizec";
import { OvladaciPanely } from "./apps/OvladaciPanely";
import { vybranyAkcent } from "@/lib/win/akcenty";
import { MERITKO } from "@/lib/win/stav";
import { jePrihlasen, zapamatujPrihlaseni } from "@/lib/win/pristup";
import type { AppId } from "@/lib/win/typy";
import type { Okno } from "@/lib/win/stav";

type Faze = "prihlaseni" | "bezi" | "restartuji" | "vypinam" | "vypnuto";

export function VirtualniPocitac() {
  return (
    <SystemProvider>
      <Obrazovka />
    </SystemProvider>
  );
}

function Obrazovka() {
  const { stav, poslat, nastavPlochu, prihlasUcet } = useSystem();
  const domu = useDomu();
  const [faze, nastavFazi] = useState<Faze>("prihlaseni");
  const [panel, nastavPanel] = useState<Panel>(null);
  const [celaObrazovka, nastavCelou] = useState(false);
  const obrazovka = useRef<HTMLDivElement>(null);
  const plochaRef = useRef<HTMLDivElement>(null);
  const n = stav.nastaveni;

  /* Přihlášení si pamatuje karta – po obnovení stránky se kód nezadává znovu. */
  useEffect(() => {
    if (jePrihlasen()) nastavFazi("bezi");
  }, []);

  /* Rozměry plochy: okna se kladou a přichytávají vůči ní, ne vůči stránce. */
  useEffect(() => {
    const prvek = plochaRef.current;
    if (!prvek || faze !== "bezi") return;
    const zmer = () => {
      const ram = prvek.getBoundingClientRect();
      const obdelnik = { x: ram.left, y: ram.top, w: ram.width, h: ram.height };
      nastavPlochu(obdelnik);
      // Okna uložená z většího displeje by po zmenšení koukala ven z plochy.
      // Akce sahá jen na ta, která tam opravdu nelezou, takže rozmístěná okna
      // zůstanou, kde byla.
      poslat({ typ: "okna/srovnej", plocha: obdelnik });
    };
    zmer();
    const sledovac = new ResizeObserver(zmer);
    sledovac.observe(prvek);
    // `resize` vedle ResizeObserveru schválně: observer sleduje prvek zachycený
    // ve chvíli, kdy efekt běžel, a když ho React později vymění, pozoruje
    // odpojený uzel a mlčí. Změna velikosti okna je přitom přesně ta událost,
    // kvůli které se tu měří – ověřeno, že po ní observer sám nepřišel.
    window.addEventListener("resize", zmer);
    window.addEventListener("scroll", zmer, true);
    return () => {
      sledovac.disconnect();
      window.removeEventListener("resize", zmer);
      window.removeEventListener("scroll", zmer, true);
    };
  }, [faze, nastavPlochu, poslat]);

  /* Systémové klávesové zkratky. */
  useEffect(() => {
    if (faze !== "bezi") return;
    const naKlavesu = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Escape") {
        e.preventDefault();
        poslat({ typ: "okno/otevri", app: "spravce-uloh" });
      } else if (e.ctrlKey && e.key === "Escape") {
        e.preventDefault();
        nastavPanel((p) => (p === "start" ? null : "start"));
      } else if (e.key === "Escape") {
        nastavPanel(null);
      }
    };
    window.addEventListener("keydown", naKlavesu);
    return () => window.removeEventListener("keydown", naKlavesu);
  }, [faze, poslat]);

  useEffect(() => {
    const sleduj = () => nastavCelou(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sleduj);
    return () => document.removeEventListener("fullscreenchange", sleduj);
  }, []);

  const prepniCelou = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void obrazovka.current?.requestFullscreen?.();
  }, []);

  const zobrazPlochu = () => {
    stav.okna.forEach((o) => poslat({ typ: "okno/minimalizuj", id: o.id }));
    nastavPanel(null);
  };

  const napajeni = (co: "odhlasit" | "restart" | "vypnout") => {
    nastavPanel(null);
    stav.okna.forEach((o) => poslat({ typ: "okno/zavri", id: o.id }));
    zapamatujPrihlaseni(false);
    if (co === "restart") {
      nastavFazi("restartuji");
      window.setTimeout(() => nastavFazi("prihlaseni"), 2200);
    } else if (co === "vypnout") {
      nastavFazi("vypinam");
      window.setTimeout(() => nastavFazi("vypnuto"), 1800);
    } else {
      nastavFazi("prihlaseni");
    }
  };

  const akcent = vybranyAkcent(n.akcent);
  const nejvyssiZ = Math.max(0, ...stav.okna.map((o) => o.z));

  return (
    <div
      ref={obrazovka}
      className="win relative h-full w-full overflow-hidden bg-black"
      data-motiv={n.motiv}
      data-pruhlednost={n.efektyPruhlednosti ? "ano" : "ne"}
      data-animace={n.animace ? "ano" : "ne"}
      style={{
        // Zvýrazňovací barva se propisuje do celého prostředí jedinou proměnnou.
        // Je to trojice kanálů, aby se z ní daly odvodit i průhledné odstíny.
        ["--win-akcent" as string]: n.motiv === "tmavy" ? akcent.tmavy : akcent.svetly,
        ["--win-akcent-text" as string]: n.motiv === "tmavy" ? "6 40 60" : "255 255 255",
        // Jas a noční osvětlení jsou skutečné filtry přes celou obrazovku.
        filter: `brightness(${0.55 + (n.jas / 100) * 0.45})${
          n.nocniRezim ? " sepia(0.35) saturate(1.15) hue-rotate(-12deg)" : ""
        }`,
        // Nižší rozlišení = větší prvky a míň místa, jako na skutečném monitoru.
        // Schválně `zoom`, ne `transform: scale`: zoom se propíše do rozvržení
        // i do souřadnic ukazatele, takže tažení a změna velikosti oken fungují
        // dál. Se `scale` by okna „utíkala" od kurzoru.
        zoom: MERITKO[n.rozliseni],
      }}
    >
      {faze === "prihlaseni" && (
        <>
          <Prihlaseni
            jmenoUctu={n.jmenoUctu}
            tapetaId={n.tapeta}
            onHotovo={(ucet) => {
              prihlasUcet(ucet);
              zapamatujPrihlaseni(true);
              nastavFazi("bezi");
            }}
          />
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={prepniCelou}
              className="flex items-center gap-2 rounded-md bg-black/40 px-3 py-2 text-[12px] text-white backdrop-blur hover:bg-black/60"
            >
              {celaObrazovka ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              {celaObrazovka ? "Zpět z celé obrazovky" : "Celá obrazovka"}
            </button>
            <Link
              href={domu}
              className="flex items-center gap-2 rounded-md bg-black/40 px-3 py-2 text-[12px] text-white backdrop-blur hover:bg-black/60"
            >
              <ArrowLeft className="h-4 w-4" /> Zpět na web
            </Link>
          </div>
        </>
      )}

      {(faze === "restartuji" || faze === "vypinam") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          <p className="text-[15px]">
            {faze === "restartuji" ? "Restartuje se…" : "Vypíná se…"}
          </p>
        </div>
      )}

      {faze === "vypnuto" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black px-6 text-center text-white">
          <Power className="h-10 w-10 text-white/40" />
          <p className="text-[15px] text-white/80">Virtuální počítač je vypnutý.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => nastavFazi("prihlaseni")}
              className="rounded-md border border-white/30 px-4 py-2 text-[13px] hover:bg-white/10"
            >
              Zapnout znovu
            </button>
            <Link
              href={domu}
              className="rounded-md border border-white/30 px-4 py-2 text-[13px] hover:bg-white/10"
            >
              Zpět na web
            </Link>
          </div>
        </div>
      )}

      {faze === "bezi" && (
        <div className="absolute inset-0 flex flex-col">
          {/* Plocha s okny */}
          <div
            ref={plochaRef}
            className="relative min-h-0 flex-1"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) nastavPanel(null);
            }}
          >
            <Plocha />

            {stav.okna.map((okno) => (
              <OknoSAplikaci key={okno.id} okno={okno} aktivni={okno.z === nejvyssiZ} />
            ))}

            <PanelUkolu />

            {panel === "start" && (
              <>
                <div className="absolute inset-0 z-[450]" onClick={() => nastavPanel(null)} />
                <Start zavri={() => nastavPanel(null)} onOdhlasit={napajeni} />
              </>
            )}
          </div>

          <HlavniPanel
            otevreny={panel}
            nastavOtevreny={nastavPanel}
            onZobrazitPlochu={zobrazPlochu}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Jedno okno i s aplikací uvnitř.
 *
 * Vlastní komponenta kvůli `useCallback`: kdyby si aplikace dostávala nové
 * `nastavTitul` při každém překreslení, spustil by se její efekt s titulkem
 * pořád dokola a prostředí by se zacyklilo.
 */
function OknoSAplikaci({ okno, aktivni }: { okno: Okno; aktivni: boolean }) {
  const { poslat } = useSystem();

  const nastavTitul = useCallback(
    (titul: string, arg?: string) => poslat({ typ: "okno/titul", id: okno.id, titul, arg }),
    [okno.id, poslat],
  );
  const zavri = useCallback(() => poslat({ typ: "okno/zavri", id: okno.id }), [okno.id, poslat]);

  return (
    <OknoRam okno={okno} aktivni={aktivni}>
      {(slot) => (
        <OknoObsah
          id={okno.id}
          app={okno.app}
          arg={okno.arg}
          aktivni={aktivni}
          slot={slot}
          nastavTitul={nastavTitul}
          zavri={zavri}
        />
      )}
    </OknoRam>
  );
}

function OknoObsah({
  id,
  app,
  arg,
  aktivni,
  slot,
  nastavTitul,
  zavri,
}: {
  id: number;
  app: AppId;
  arg?: string;
  aktivni: boolean;
  slot: HTMLDivElement | null;
  nastavTitul: (titul: string, arg?: string) => void;
  zavri: () => void;
}) {
  const hodnota = useMemo(
    () => ({ id, arg, aktivni, slotZahlavi: slot, nastavTitul, zavri }),
    [id, arg, aktivni, slot, nastavTitul, zavri],
  );
  return (
    <OknoProvider value={hodnota}>
      <Aplikace app={app} />
    </OknoProvider>
  );
}

/** Překlad identifikátoru aplikace na komponentu. */
function Aplikace({ app }: { app: AppId }) {
  switch (app) {
    case "pruzkumnik":
      return <Pruzkumnik />;
    case "poznamkovy-blok":
      return <PoznamkovyBlok />;
    case "malovani":
      return <Malovani />;
    case "kalkulacka":
      return <Kalkulacka />;
    case "nastaveni":
      return <Nastaveni />;
    case "terminal":
      return <Terminal />;
    case "spravce-uloh":
      return <SpravceUloh />;
    case "fotky":
      return <Fotky />;
    case "prohlizec":
      return <Prohlizec />;
    case "ovladaci-panely":
      return <OvladaciPanely />;
    default:
      return null;
  }
}

/**
 * Kam vede „Zpět na web". Kdo sem přijde z anglické verze, má se mít jak
 * vrátit na /en – stejně jako u kurzu SQL, který na to má `?z=en`. Prostředí
 * samo zůstává české; slíbeno je to předem u obou odkazů, které sem vedou.
 *
 * Čte se až v prohlížeči schválně: kdyby stránka sáhla po `searchParams`,
 * přestala by být statická, a kvůli jednomu odkazu to nestojí za to.
 */
function useDomu(): string {
  const [domu, nastavDomu] = useState("/");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("z") === "en") nastavDomu("/en");
  }, []);
  return domu;
}

/** Odkaz zpět pro obrazovku „tohle je stavěné na počítač" (mobil). */
export function OdkazNaWeb({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link href={useDomu()} className={className}>
      {children}
    </Link>
  );
}
