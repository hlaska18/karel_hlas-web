"use client";

/**
 * Celé virtuální macOS: přihlášení, plocha, horní lišta, okna, Dock.
 *
 * Stavěné vedle windowsové simulace, ne místo ní. Sdílí se jen souborový
 * systém a přihlašovací kódy; všechno ostatní má Mac vlastní, aby se do
 * Windows nemuselo sahat.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { MacProvider, OknoMacProvider, useMac } from "./system";
import { najdiSlozku } from "@/lib/win/fs";
import { OknoRamMac } from "./OknoRam";
import { HorniLista, type Nabidka } from "./HorniLista";
import { Dock, VZHLED_APLIKACI } from "./Dock";
import { Plocha } from "./Plocha";
import { PanelUkoluMac } from "./PanelUkolu";
import { PrihlaseniMac } from "./Prihlaseni";
import { Finder } from "./apps/Finder";
import { Poznamky } from "./apps/Poznamky";
import { Terminal } from "./apps/Terminal";
import { Nastaveni } from "./apps/Nastaveni";
import { APLIKACE, type AppId, type Okno } from "@/lib/mac/stav";
import {
  APLIKACE as SLOZKA_APLIKACI,
  DOKUMENTY,
  DOMOV,
  KOREN,
  PLOCHA,
  STAZENE,
  rozlozMac,
  slozMac,
} from "@/lib/mac/cesty";
import { jePrihlasen, zapamatujPrihlaseni } from "@/lib/win/pristup";
import { zapomenMac } from "@/lib/mac/stav";

type Faze = "prihlaseni" | "bezi";
type Panel = null | "vynutit" | "oMacu" | "znovu" | "jdi" | "launchpad";

export function VirtualniMac() {
  return (
    <MacProvider>
      <Obrazovka />
    </MacProvider>
  );
}

function Obrazovka() {
  const { stav, poslat, spust, stopa, nastavPlochu } = useMac();
  const [faze, nastavFazi] = useState<Faze>("prihlaseni");
  const [panel, nastavPanel] = useState<Panel>(null);
  const [celaObrazovka, nastavCelou] = useState(false);
  const obrazovka = useRef<HTMLDivElement>(null);
  const plochaRef = useRef<HTMLDivElement>(null);

  /* Rozběhnuté sezení si pamatuje karta – obnovení stránky nevrací na zámek. */
  useEffect(() => {
    if (jePrihlasen()) nastavFazi("bezi");
  }, []);

  /* Rozměry plochy: okna se kladou vůči ní, ne vůči stránce. */
  useEffect(() => {
    const prvek = plochaRef.current;
    if (!prvek || faze !== "bezi") return;
    const zmer = () => {
      const ram = prvek.getBoundingClientRect();
      nastavPlochu({ x: ram.left, y: ram.top, w: ram.width, h: ram.height });
    };
    zmer();
    // `typeof`, ne rovnou `new`: ResizeObserver umí až Safari 13.1, ale cíl
    // webu sahá na Safari 12 (viz .browserslistrc). Bez téhle pojistky by
    // konstruktor vyhodil ReferenceError a shodil celé prostředí.
    const sledovac = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(zmer);
    sledovac?.observe(prvek);
    window.addEventListener("resize", zmer);
    return () => {
      sledovac?.disconnect();
      window.removeEventListener("resize", zmer);
    };
  }, [faze, nastavPlochu]);

  /* Jediné místo, kde se panel Vynutit ukončení otevírá. Cesty jsou tři
     (jablko, zkratka, tlačítko), takže stopa patří sem, ne ke každé z nich. */
  const otevriVynuceni = useCallback(() => {
    stopa("otevrel-vynuceni");
    nastavPanel("vynutit");
  }, [stopa]);

  /**
   * Klávesové zkratky. Vybrané OPATRNĚ, protože žáci sedí u windowsových
   * strojů a v prohlížeči:
   *
   *   Ctrl+Alt+Esc     Vynutit ukončení (na Macu ⌥⌘⎋) – nic v systému ani
   *                    v prohlížeči to nebere, takže je bezpečná.
   *   Ctrl+Shift+.     položky s tečkou (na Macu ⇧⌘.) – taky volná.
   *
   * ⌘W ani ⌘Q SE NEMAPUJÍ SCHVÁLNĚ. Ctrl+W zavře žákovi kartu prohlížeče
   * a Ctrl+Q ve Firefoxu celý prohlížeč – přišel by o rozdělanou práci
   * a vypadalo by to, že simulace spadla. Říká se to i v „O tomto Macu“.
   */
  useEffect(() => {
    if (faze !== "bezi") return;
    const naKlavesu = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === "Escape") {
        e.preventDefault();
        otevriVynuceni();
      } else if (e.ctrlKey && e.shiftKey && (e.key === "." || e.code === "Period")) {
        e.preventDefault();
        poslat({
          typ: "nastaveni/zmen",
          zmena: { skrytePolozky: !stav.nastaveni.skrytePolozky },
        });
      } else if (e.key === "Escape") {
        nastavPanel(null);
      }
    };
    window.addEventListener("keydown", naKlavesu);
    return () => window.removeEventListener("keydown", naKlavesu);
  }, [faze, poslat, otevriVynuceni, stav.nastaveni.skrytePolozky]);

  /**
   * První okno po přihlášení.
   *
   * Prázdná plocha s Dockem nikam nevede – žák neví, kde začít. Otevře se
   * proto jedno okno Finderu, ale JEN POPRVÉ: `stopy` jsou prázdné jedině
   * do chvíle, než se v prostředí cokoli stane. Kdyby se okno otevíralo
   * pokaždé, když plocha zůstane prázdná, rozbilo by to hned první úlohu –
   * tu, ve které má žák okno zavřít a vidět, že Finder běží dál.
   */
  useEffect(() => {
    if (faze !== "bezi") return;
    if (stav.okna.length > 0 || stav.stopy.length > 0) return;
    spust("finder", slozMac(PLOCHA));
  }, [faze, stav.okna.length, stav.stopy.length, spust]);

  useEffect(() => {
    const sleduj = () => nastavCelou(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sleduj);
    return () => document.removeEventListener("fullscreenchange", sleduj);
  }, []);

  const prepniCelou = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void obrazovka.current?.requestFullscreen?.();
  }, []);

  const odhlasit = () => {
    zapamatujPrihlaseni(false);
    nastavPanel(null);
    nastavFazi("prihlaseni");
  };

  /**
   * Úplný reset: zapomenout disk, postup i přihlášení a načíst stránku znovu.
   *
   * Všechny tři věci v JEDNOM obslužném kroku a hned za nimi reload. Kdyby se
   * mezi nimi stihl změnit stav, proběhne ukládací efekt v `system.tsx`
   * a zapíše smazaný stav zpátky – přesně na tohle jsem naletěl ve Windows.
   *
   * Po načtení vrátí `nactiMac()` `null`, postaví se čerstvý výchozí stav
   * a `jePrihlasen()` je `false`, takže prostředí naběhne na zamykací
   * obrazovce. Akce `system/reset` v reduceru k tomu není potřeba.
   */
  const zacitZnovu = () => {
    zapomenMac();
    zapamatujPrihlaseni(false);
    window.location.reload();
  };

  const nejvyssiZ = Math.max(0, ...stav.okna.map((o) => o.z));
  const vpredu = stav.vpredu ?? "finder";

  /* Nabídky aplikace vpředu. Krátké schválně – nemá to být kopie macOS,
     ale místo, kde je vidět, že nabídka patří PROGRAMU, ne oknu. */
  /**
   * Nabídky aplikace vpředu.
   *
   * Názvy i zkratky jsou ty SKUTEČNÉ z české lokalizace macOS, ne vymyšlené –
   * žák, který si někdy sedne k opravdovému Macu, má najít totéž. Zkratky se
   * ukazují, ale nemapují se na klávesy: viz komentář u klávesových zkratek výš.
   *
   * Položky, které prostředí neumí (schránka, zpět, jiné pohledy), jsou
   * ZESEDLÉ, ne vynechané. Nabídka, ve které chybí půlka obvyklých položek,
   * vypadá rozbitě; zešedlá položka je naopak běžný stav i na skutečném Macu.
   */
  const nabidky: Nabidka[] = (() => {
    const mojeOkna = () => stav.okna.filter((o) => o.app === vpredu && !o.minimalizovane);
    const posledniOkno = () => {
      const moje = mojeOkna();
      return moje.length ? moje.reduce((a, b) => (a.z > b.z ? a : b)) : null;
    };
    const zavriOkno = () => {
      const o = posledniOkno();
      if (o) poslat({ typ: "okno/zavri", id: o.id });
    };
    const doDocku = () => {
      const o = posledniOkno();
      if (o) poslat({ typ: "okno/minimalizuj", id: o.id });
    };

    const okno: Nabidka = {
      titul: "Okno",
      polozky: [
        { text: "Schovat do Docku", zkratka: "⌘M", akce: doDocku },
        { text: "Zavřít okno", zkratka: "⌘W", akce: zavriOkno },
      ],
    };
    const napoveda: Nabidka = {
      titul: "Nápověda",
      polozky: [{ text: "Nápověda pro macOS", akce: () => nastavPanel("oMacu") }],
    };
    /* Schránka a Zpět tu nejsou udělané. Nabídka Úpravy ale na Macu je vždycky,
       takže se ukáže zešedlá – chybějící nabídka by vypadala jako závada. */
    const upravy: Nabidka = {
      titul: "Úpravy",
      polozky: [
        { text: "Zpět", zkratka: "⌘Z", zesedle: true },
        { text: "Vyjmout", zkratka: "⌘X", zesedle: true },
        { text: "Kopírovat", zkratka: "⌘C", zesedle: true, oddelovac: true },
        { text: "Vybrat vše", zkratka: "⌘A", zesedle: true },
      ],
    };

    if (vpredu === "finder") {
      /* „Jít“ na Macu přepne SOUČASNÉ okno. Nové otevře jen tehdy, když žádné
         není – to dělá skutečný Finder taky. */
      const finderVpredu = mojeOkna().sort((a, b) => b.z - a.z)[0];
      const jdi = (kam: string[]) => {
        if (finderVpredu) poslat({ typ: "okno/arg", id: finderVpredu.id, arg: slozMac(kam) });
        else spust("finder", slozMac(kam));
      };
      return [
        {
          titul: "Soubor",
          polozky: [
            { text: "Nové okno Finderu", zkratka: "⌘N", akce: () => spust("finder", slozMac(PLOCHA)) },
            { text: "Nová složka", zkratka: "⇧⌘N", zesedle: true, oddelovac: true },
            { text: "Informace", zkratka: "⌘I", zesedle: true, oddelovac: true },
            { text: "Zavřít okno", zkratka: "⌘W", akce: zavriOkno },
          ],
        },
        upravy,
        {
          titul: "Zobrazení",
          polozky: [
            { text: "Jako ikony", zkratka: "⌘1", zesedle: true },
            { text: "Jako seznam", zkratka: "⌘2", zesedle: true, oddelovac: true },
            {
              text: stav.nastaveni.skrytePolozky
                ? "Skrýt položky s tečkou"
                : "Zobrazit položky s tečkou",
              zkratka: "⇧⌘.",
              akce: () =>
                poslat({
                  typ: "nastaveni/zmen",
                  zmena: { skrytePolozky: !stav.nastaveni.skrytePolozky },
                }),
            },
          ],
        },
        {
          // Tahle nabídka na Windows nemá obdobu a je to nejlepší místo, kde
          // žák uvidí, že domovská složka, Plocha i Aplikace jsou jen cesty.
          titul: "Jít",
          polozky: [
            { text: "Domů", zkratka: "⇧⌘H", akce: () => jdi(DOMOV) },
            { text: "Plocha", zkratka: "⇧⌘D", akce: () => jdi(PLOCHA) },
            { text: "Dokumenty", zkratka: "⇧⌘O", akce: () => jdi(DOKUMENTY) },
            { text: "Stažené", zkratka: "⌥⌘L", akce: () => jdi(STAZENE) },
            { text: "Aplikace", zkratka: "⇧⌘A", akce: () => jdi(SLOZKA_APLIKACI), oddelovac: true },
            { text: "Počítač", zkratka: "⇧⌘C", akce: () => jdi([KOREN]), oddelovac: true },
            { text: "Přejít do složky…", zkratka: "⇧⌘G", akce: () => nastavPanel("jdi") },
          ],
        },
        okno,
        napoveda,
      ];
    }

    if (vpredu === "poznamky") {
      return [
        {
          titul: "Soubor",
          polozky: [
            {
              text: "Nová poznámka",
              zkratka: "⌘N",
              akce: () => spust("poznamky", slozMac([...DOKUMENTY, "Poznámka.txt"])),
            },
            { text: "Uložit", zkratka: "⌘S", zesedle: true, oddelovac: true },
            { text: "Zavřít okno", zkratka: "⌘W", akce: zavriOkno },
          ],
        },
        upravy,
        okno,
        napoveda,
      ];
    }

    if (vpredu === "nastaveni") {
      // Nastavení systému nemá nabídku Soubor – není co zakládat ani ukládat.
      // Propadávalo to sem na větev Terminálu, takže mu nahoře svítil „Shell“.
      return [upravy, okno, napoveda];
    }

    return [
      {
        // Terminál má první nabídku „Shell“, ne „Soubor“ – jedna z drobností,
        // podle kterých se pozná, že to není jen přebarvené okno.
        titul: "Shell",
        polozky: [
          { text: "Nové okno", zkratka: "⌘N", akce: () => spust("terminal") },
          { text: "Zavřít okno", zkratka: "⌘W", akce: zavriOkno },
        ],
      },
      upravy,
      okno,
      napoveda,
    ];
  })();

  return (
    <div
      ref={obrazovka}
      className="mac relative h-full w-full overflow-hidden bg-black"
      data-motiv={stav.nastaveni.motiv}
    >
      {faze === "prihlaseni" && (
        <>
          <PrihlaseniMac
            onHotovo={() => {
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
              {celaObrazovka ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {celaObrazovka ? "Zpět z celé obrazovky" : "Celá obrazovka"}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md bg-black/40 px-3 py-2 text-[12px] text-white backdrop-blur hover:bg-black/60"
            >
              <ArrowLeft className="h-4 w-4" /> Zpět na web
            </Link>
          </div>
        </>
      )}

      {faze === "bezi" && (
        <div className="absolute inset-0 flex flex-col">
          <HorniLista
            nabidky={nabidky}
            onVynutitUkonceni={otevriVynuceni}
            onOdhlasit={odhlasit}
            onZacitZnovu={() => nastavPanel("znovu")}
            onOMacu={() => nastavPanel("oMacu")}
          />

          <div ref={plochaRef} className="mac-tapeta relative min-h-0 flex-1">
            <Plocha />

            {stav.okna.map((okno) => (
              <OknoSAplikaci
                key={okno.id}
                okno={okno}
                aktivni={okno.z === nejvyssiZ}
                onZacitZnovu={() => nastavPanel("znovu")}
              />
            ))}

            <PanelUkoluMac />

            <Dock onLaunchpad={() => nastavPanel("launchpad")} />

            {panel === "vynutit" && <VynutitUkonceni zavri={() => nastavPanel(null)} />}
            {panel === "oMacu" && <OMacu zavri={() => nastavPanel(null)} />}
            {panel === "znovu" && (
              <ZacitZnovu zavri={() => nastavPanel(null)} potvrd={zacitZnovu} />
            )}
            {panel === "jdi" && <PrejitDoSlozky zavri={() => nastavPanel(null)} />}
            {panel === "launchpad" && <Launchpad zavri={() => nastavPanel(null)} />}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Vynutit ukončení.
 *
 * Ve Windows se na to chodí do Správce úloh, což je celý program s grafy
 * a záložkami. Na Macu je to jedno okénko se seznamem toho, co běží – a je to
 * jediné místo, kde žák uvidí běžící program BEZ okna pojmenovaný nahlas.
 * Proto je v úlohách hned po té první.
 */
function VynutitUkonceni({ zavri }: { zavri: () => void }) {
  const { stav, poslat } = useMac();
  const [vybrana, nastavVybranou] = useState<AppId | null>(null);

  return (
    <div className="absolute inset-0 z-[850] flex items-start justify-center bg-black/25 pt-[12vh]">
      <div className="mac-vjezd w-[380px] overflow-hidden rounded-xl bg-mac-povrch shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="border-b border-mac-linka bg-mac-panel px-4 py-3">
          <h2 className="text-[13px] font-semibold text-mac-text">Vynutit ukončení aplikací</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-mac-slaby">
            Tady je vidět, co běží. Zavřené okno program nezastaví – pokud je
            v seznamu, běží dál.
          </p>
        </div>

        <ul className="max-h-[220px] overflow-y-auto p-2">
          {stav.bezici.map((app) => {
            const oken = stav.okna.filter((o) => o.app === app).length;
            return (
              <li key={app}>
                <button
                  type="button"
                  onClick={() => nastavVybranou(app)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] ${
                    vybrana === app
                      ? "bg-mac-akcent text-mac-akcent-text"
                      : "text-mac-text hover:bg-mac-zvyrazneny"
                  }`}
                >
                  <span>{APLIKACE[app].nazev}</span>
                  <span className="text-[11px] opacity-70">
                    {oken === 0 ? "bez okna" : `${oken} okno`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end gap-2 border-t border-mac-linka bg-mac-panel px-4 py-3">
          <button
            type="button"
            onClick={zavri}
            className="rounded-md border border-mac-linka bg-mac-povrch px-3 py-1.5 text-[13px] text-mac-text hover:bg-mac-zvyrazneny"
          >
            Zrušit
          </button>
          <button
            type="button"
            disabled={!vybrana || vybrana === "finder"}
            title={vybrana === "finder" ? "Finder ukončit nejde, dá se jen znovu spustit." : undefined}
            onClick={() => {
              if (vybrana) poslat({ typ: "app/ukonci", app: vybrana });
              zavri();
            }}
            className="rounded-md bg-mac-akcent px-3 py-1.5 text-[13px] font-medium text-mac-akcent-text hover:opacity-90 disabled:opacity-40"
          >
            Vynutit ukončení
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Launchpad – mřížka všech aplikací přes celou plochu.
 *
 * Na Macu je to jediné místo, kde jsou aplikace pohromadě, a nahrazuje to,
 * co Windows řeší nabídkou Start. Zavírá se kliknutím kamkoli i Escapem,
 * stejně jako ten skutečný.
 */
function Launchpad({ zavri }: { zavri: () => void }) {
  const { stav, poslat, spust } = useMac();

  useEffect(() => {
    const klavesa = (e: KeyboardEvent) => {
      if (e.key === "Escape") zavri();
    };
    window.addEventListener("keydown", klavesa);
    return () => window.removeEventListener("keydown", klavesa);
  }, [zavri]);

  const otevri = (app: AppId) => {
    if (stav.bezici.includes(app)) poslat({ typ: "app/dopredu", app });
    else spust(app);
    zavri();
  };

  return (
    <div
      className="mac-vjezd absolute inset-0 z-[870] flex items-start justify-center bg-black/45 pt-[16vh] backdrop-blur-2xl"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) zavri();
      }}
    >
      <div className="grid grid-cols-4 gap-x-10 gap-y-8">
        {(Object.keys(APLIKACE) as AppId[]).map((app) => (
          <button
            key={app}
            type="button"
            onClick={() => otevri(app)}
            className="flex w-[110px] flex-col items-center gap-2"
          >
            <span
              className="flex h-[68px] w-[68px] items-center justify-center rounded-[16px] shadow-lg transition-transform hover:scale-105"
              style={{ background: VZHLED_APLIKACI[app].pozadi }}
            >
              {(() => {
                const Z = VZHLED_APLIKACI[app].znak;
                return <Z style={{ color: VZHLED_APLIKACI[app].barva }} className="h-8 w-8" />;
              })()}
            </span>
            <span
              className="text-center text-[12px] leading-tight text-white"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              {APLIKACE[app].nazev}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * „Přejít do složky…“ (⇧⌘G).
 *
 * Na Windows se cesta píše do adresního řádku nahoře v okně; na Macu do
 * tohohle okénka. Je to nejpřímější způsob, jak si žák vyzkouší, že cesta
 * je text — a že začíná lomítkem, ne písmenem disku. Proto tu není výběr
 * ze seznamu: musí ji napsat.
 */
function PrejitDoSlozky({ zavri }: { zavri: () => void }) {
  const { stav, poslat, spust, stopa } = useMac();
  const [text, nastavText] = useState("/");
  const [chyba, nastavChybu] = useState("");
  const pole = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => pole.current?.select(), 40);
    return () => window.clearTimeout(id);
  }, []);

  const jdi = () => {
    const zadano = text.trim();
    // Vlnovka je na Macu domovská složka a žák ji vidí v Terminálu i dole
    // ve Finderu, takže ji tohle okénko musí brát taky.
    const casti = zadano === "~" || zadano.startsWith("~/")
      ? [...DOMOV, ...rozlozMac(zadano.slice(1)).slice(1)]
      : rozlozMac(zadano);
    if (!najdiSlozku(stav.disk, casti)) {
      nastavChybu("Složka s touhle cestou tu není.");
      return;
    }
    stopa("prejit-do-slozky");
    const finder = stav.okna
      .filter((o) => o.app === "finder" && !o.minimalizovane)
      .sort((a, b) => b.z - a.z)[0];
    if (finder) poslat({ typ: "okno/arg", id: finder.id, arg: slozMac(casti) });
    else spust("finder", slozMac(casti));
    zavri();
  };

  return (
    <div className="absolute inset-0 z-[860] flex items-start justify-center bg-black/20 pt-[16vh]">
      <div className="mac-vjezd w-[460px] rounded-xl bg-mac-povrch p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <h2 className="text-[13px] font-semibold text-mac-text">Přejít do složky:</h2>
        <input
          ref={pole}
          value={text}
          onChange={(e) => {
            nastavText(e.target.value);
            nastavChybu("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") jdi();
            if (e.key === "Escape") zavri();
          }}
          aria-label="Cesta ke složce"
          spellCheck={false}
          className="mt-3 w-full rounded-md border border-mac-linka bg-mac-povrch px-3 py-2 font-mono text-[13px] text-mac-text outline-none focus-visible:outline-none"
        />
        <p className={`mt-2 h-4 text-[11px] ${chyba ? "text-[#c0392b]" : "text-mac-slaby"}`}>
          {chyba || "Například /Users/zak/Documents nebo /Volumes/FLASH"}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={zavri}
            className="rounded-md border border-mac-linka bg-mac-povrch px-3 py-1.5 text-[13px] text-mac-text hover:bg-mac-zvyrazneny"
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={jdi}
            className="rounded-md bg-mac-akcent px-3 py-1.5 text-[13px] font-medium text-mac-akcent-text hover:opacity-90"
          >
            Jít
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Potvrzení úplného resetu.
 *
 * Text vyjmenovává, co se ztratí. Samotné „opravdu?“ nikdo nečte – a tohle
 * je jediná věc v prostředí, která se nedá vzít zpět.
 */
function ZacitZnovu({ zavri, potvrd }: { zavri: () => void; potvrd: () => void }) {
  return (
    <div className="absolute inset-0 z-[860] flex items-start justify-center bg-black/25 pt-[14vh]">
      <div className="mac-vjezd w-[400px] overflow-hidden rounded-xl bg-mac-povrch shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="px-5 py-4">
          <h2 className="text-[14px] font-semibold text-mac-text">Začít úplně od začátku?</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-mac-slaby">
            Smažou se všechny soubory, které sis vytvořil, vrátí se nastavení
            a vynulují se odškrtnuté úlohy. Budeš se muset znovu přihlásit kódem
            od vyučujícího. Tohle se nedá vzít zpět.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-mac-linka bg-mac-panel px-4 py-3">
          <button
            type="button"
            onClick={zavri}
            className="rounded-md border border-mac-linka bg-mac-povrch px-3 py-1.5 text-[13px] text-mac-text hover:bg-mac-zvyrazneny"
          >
            Ne
          </button>
          <button
            type="button"
            onClick={potvrd}
            className="rounded-md bg-mac-akcent px-3 py-1.5 text-[13px] font-medium text-mac-akcent-text hover:opacity-90"
          >
            Ano, začít od začátku
          </button>
        </div>
      </div>
    </div>
  );
}

/** „O tomto Macu“ – a hlavně poctivá věta o tom, co to je a co má žák za klávesnici. */
function OMacu({ zavri }: { zavri: () => void }) {
  return (
    <div className="absolute inset-0 z-[850] flex items-center justify-center bg-black/25">
      <div className="mac-vjezd w-[420px] rounded-xl bg-mac-povrch p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <h2 className="text-[17px] font-semibold text-mac-text">Výuková simulace macOS</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-mac-slaby">
          Neběží tu skutečný systém a nic se neinstaluje. Všechno, co tady
          uděláš, se děje jen v téhle záložce prohlížeče – tvého počítače se to
          nedotkne a na server se neodesílá nic.
        </p>
        <div className="mt-4 rounded-lg bg-mac-zvyrazneny p-3 text-left text-[12px] leading-relaxed text-mac-text">
          <p className="font-semibold">Klávesnice</p>
          <p className="mt-1 text-mac-slaby">
            Na klávesnici, u které sedíš, žádné ⌘ není. V nabídkách se píše tak,
            jak to má Mac, ale tady zmáčkni <strong>Ctrl</strong>. Fungují{" "}
            <strong>Ctrl+Alt+Esc</strong> (vynutit ukončení) a{" "}
            <strong>Ctrl+Shift+.</strong> (položky s tečkou).
          </p>
          <p className="mt-2 text-mac-slaby">
            ⌘W a ⌘Q tu schválně nejsou na klávesách: Ctrl+W by ti zavřel kartu
            prohlížeče a přišel bys o práci. Klikej na ně v nabídce.
          </p>
        </div>
        <button
          type="button"
          onClick={zavri}
          className="mt-5 rounded-md bg-mac-akcent px-4 py-1.5 text-[13px] font-medium text-mac-akcent-text hover:opacity-90"
        >
          Rozumím
        </button>
      </div>
    </div>
  );
}

/**
 * Jedno okno i s aplikací uvnitř.
 *
 * Vlastní komponenta kvůli `useCallback`: kdyby aplikace dostávala nové
 * `nastavTitul` při každém překreslení, spustil by se její efekt s titulkem
 * pořád dokola a prostředí by se zacyklilo. (Táž past jako ve Windows.)
 */
function OknoSAplikaci({
  okno,
  aktivni,
  onZacitZnovu,
}: {
  okno: Okno;
  aktivni: boolean;
  onZacitZnovu: () => void;
}) {
  const { poslat } = useMac();

  const nastavTitul = useCallback(
    (titul: string, arg?: string) => poslat({ typ: "okno/titul", id: okno.id, titul, arg }),
    [okno.id, poslat],
  );
  const zavri = useCallback(() => poslat({ typ: "okno/zavri", id: okno.id }), [okno.id, poslat]);

  // Bez `useMemo` by kontext dostal při každém překreslení novou referenci
  // a efekty uvnitř aplikace by se spouštěly pořád dokola.
  const hodnota = useMemo(
    () => ({ id: okno.id, arg: okno.arg, aktivni, nastavTitul, zavri }),
    [okno.id, okno.arg, aktivni, nastavTitul, zavri],
  );

  return (
    <OknoRamMac okno={okno} aktivni={aktivni}>
      <OknoMacProvider value={hodnota}>
        <Aplikace app={okno.app} onZacitZnovu={onZacitZnovu} />
      </OknoMacProvider>
    </OknoRamMac>
  );
}

function Aplikace({ app, onZacitZnovu }: { app: AppId; onZacitZnovu: () => void }) {
  switch (app) {
    case "finder":
      return <Finder />;
    case "poznamky":
      return <Poznamky />;
    case "terminal":
      return <Terminal />;
    case "nastaveni":
      return <Nastaveni onZacitZnovu={onZacitZnovu} />;
    default:
      return null;
  }
}
