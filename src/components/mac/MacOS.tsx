"use client";

/**
 * Celé virtuální macOS: přihlášení, plocha, horní lišta, okna, Dock.
 *
 * Stavěné vedle windowsové simulace, ne místo ní. Sdílí se jen souborový
 * systém a přihlašovací kódy; všechno ostatní má Mac vlastní, aby se do
 * Windows nemuselo sahat.
 */

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, Maximize2, Minimize2, Search } from "lucide-react";
import Link from "next/link";
import { MacProvider, OknoMacProvider, useMac } from "./system";
import { jeSlozka, najdiSlozku, najdiSoubor } from "@/lib/win/fs";
import { OknoRamMac } from "./OknoRam";
import { HorniLista, type Nabidka } from "./HorniLista";
import { Dock, VZHLED_APLIKACI } from "./Dock";
import { Plocha } from "./Plocha";
import { DzinProvider } from "./Dzin";
import { APLIKACE_BALICKU, VelkaIkona } from "./ikony";
import { PanelUkoluMac } from "./PanelUkolu";
import { PrihlaseniMac } from "./Prihlaseni";
import { Finder } from "./apps/Finder";
import { Poznamky, UDALOST_ULOZIT } from "./apps/Poznamky";
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
  jeBalicek,
  rozlozMac,
  sVlnovkou,
  slozMac,
} from "@/lib/mac/cesty";
import { type Nalez, prohledej } from "@/lib/mac/hledani";
import { UVITANI } from "@/lib/mac/seed";
import {
  rozlisWindows,
  rozpoznejProhlizec,
  rozpoznejSystem,
} from "@/lib/mac/pocitac";
import { jePrihlasen, zapamatujPrihlaseni } from "@/lib/win/pristup";
import { zapomenMac } from "@/lib/mac/stav";

type Faze = "prihlaseni" | "bezi";
type Panel =
  null | "vynutit" | "oMacu" | "znovu" | "jdi" | "launchpad" | "spotlight";

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

  /**
   * Uvítání po přihlášení: otevře se Přečti si mě.txt z plochy.
   *
   * Bez toho žák po zadání kódu koukal na prázdnou plochu a nevěděl, kam
   * klepnout. Teď ho první obrazovka přivítá a řekne, kde najde úkoly.
   *
   * Otevírá se jako okno „od systému" (`samo`), takže se nezapíše stopa
   * o spuštění Poznámek – úloha „Lišta se mění" chce, aby je žák spustil
   * sám. Zavřením tohohle okna ale žák přirozeně splní „Nech Poznámky běžet
   * bez jediného okna", protože program po zavření okna běží dál; to je
   * správně, to už je jeho vlastní krok a je to přesně ta lekce.
   *
   * JEN PŘI ÚVODNÍM PŘIHLÁŠENÍ (Karel: „pouze při úvodním přihlášení").
   * Co se jednou ukázalo, si pamatuje `stav.uvitano` v uloženém stavu, takže
   * to přežije zavření záložky i odhlášení. Znovu se ukáže až po úplném
   * „Začít načisto", kdy je to skutečně nový začátek.
   *
   * Nic se neotevře, když žák soubor smazal nebo přejmenoval, ani když už
   * otevřený je.
   */
  const otevriUvitani = () => {
    if (stav.uvitano) return;
    // Jen tenhle soubor, bez okna Finderu – na ploše je pak jediná věc a je
    // jasné, čím začít. Efekt „první okno po přihlášení" níž se tím pádem
    // neozve (nějaké okno už je), a neozve se ani po zavření uvítání, protože
    // zavření zapíše stopu. Finder si žák otevře v první úloze sám z Docku.
    const cesta = [...PLOCHA, UVITANI];
    const arg = slozMac(cesta);
    if (
      najdiSoubor(stav.disk, cesta) &&
      !stav.okna.some((o) => o.app === "poznamky" && o.arg === arg)
    ) {
      poslat({ typ: "okno/otevri", app: "poznamky", arg, samo: true });
    }
    poslat({ typ: "uvitani/ukazano" });
  };

  /* Rozběhnuté sezení si pamatuje karta – obnovení stránky nevrací na zámek. */
  useEffect(() => {
    if (jePrihlasen("macos")) nastavFazi("bezi");
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
    const sledovac =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(zmer);
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
      } else if (
        e.ctrlKey &&
        e.shiftKey &&
        (e.key === "." || e.code === "Period")
      ) {
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
   *
   * Při úvodním přihlášení se sem nedojde, plochu zaplní uvítání (viz
   * `otevriUvitani`). Tohle je záloha pro případ, že uvítací soubor chybí
   * nebo se stránka obnoví dřív, než žák cokoli udělá.
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
    zapamatujPrihlaseni(false, "macos");
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
    zapamatujPrihlaseni(false, "macos");
    window.location.reload();
  };

  // Jen z oken na obrazovce: schované v Docku má vrstvu nejvyšší (bylo
  // vpředu, když se schovávalo), a okno pod ním by pak zůstalo šedé.
  const nejvyssiZ = Math.max(
    0,
    ...stav.okna.filter((o) => !o.minimalizovane).map((o) => o.z),
  );
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
    const mojeOkna = () =>
      stav.okna.filter((o) => o.app === vpredu && !o.minimalizovane);
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
      polozky: [
        { text: "Nápověda pro macOS", akce: () => nastavPanel("oMacu") },
      ],
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
        if (finderVpredu)
          poslat({ typ: "okno/arg", id: finderVpredu.id, arg: slozMac(kam) });
        else spust("finder", slozMac(kam));
      };
      return [
        {
          titul: "Soubor",
          polozky: [
            {
              text: "Nové okno Finderu",
              zkratka: "⌘N",
              akce: () => spust("finder", slozMac(PLOCHA)),
            },
            {
              text: "Nová složka",
              zkratka: "⇧⌘N",
              zesedle: true,
              oddelovac: true,
            },
            {
              text: "Informace",
              zkratka: "⌘I",
              zesedle: true,
              oddelovac: true,
            },
            { text: "Zavřít okno", zkratka: "⌘W", akce: zavriOkno },
          ],
        },
        upravy,
        {
          titul: "Zobrazení",
          polozky: [
            { text: "Jako ikony", zkratka: "⌘1", zesedle: true },
            // Položky s tečkou se ve skutečném Finderu v nabídce zapnout
            // nedají, jen zkratkou ⇧⌘. (tady Ctrl+Shift+.). Proto tu nejsou.
            { text: "Jako seznam", zkratka: "⌘2", zesedle: true },
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
            {
              text: "Aplikace",
              zkratka: "⇧⌘A",
              akce: () => jdi(SLOZKA_APLIKACI),
              oddelovac: true,
            },
            {
              text: "Počítač",
              zkratka: "⇧⌘C",
              akce: () => jdi([KOREN]),
              oddelovac: true,
            },
            {
              text: "Přejít do složky…",
              zkratka: "⇧⌘G",
              akce: () => nastavPanel("jdi"),
            },
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
              akce: () =>
                spust("poznamky", slozMac([...DOKUMENTY, "Poznámka.txt"])),
            },
            {
              // Dřív tu bylo jen zešedlé a ukládalo tlačítko v okně. Teď
              // ukládá tohle – tlačítko v okně Mac nemá.
              text: "Uložit",
              zkratka: "⌘S",
              oddelovac: true,
              akce: () => {
                const o = posledniOkno();
                if (o)
                  window.dispatchEvent(
                    new CustomEvent(UDALOST_ULOZIT, { detail: o.id }),
                  );
              },
            },
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
      // Nabídka prohlížeče („Znovu načíst stránku…") do Macu nepatří. Kde
      // má prostředí vlastní nabídku, otevře ji samo; jinde se neukáže nic,
      // jako na Macu. Textová pole si ji nechají – hodí se na vložení.
      onContextMenu={(e) => {
        const cil = e.target as HTMLElement;
        if (cil.closest("input, textarea, [contenteditable='true']")) return;
        e.preventDefault();
      }}
      data-motiv={stav.nastaveni.motiv}
      data-efekty={stav.nastaveni.omezitEfekty ? "omezene" : undefined}
    >
      {faze === "prihlaseni" && (
        <>
          <PrihlaseniMac
            onHotovo={() => {
              zapamatujPrihlaseni(true, "macos");
              nastavFazi("bezi");
              otevriUvitani();
            }}
          />
          {/* Menší a tlumenější než dřív, ať nepřebíjejí zámek – ale pořád
              vidět a na jedno kliknutí (Karlovy návrhy 24. 9. 2026). */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={prepniCelou}
              className="mac-sklo-zaloha flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 text-[11px] text-white/75 backdrop-blur transition hover:bg-black/50 hover:text-white"
            >
              {celaObrazovka ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              {celaObrazovka ? "Zpět z celé obrazovky" : "Celá obrazovka"}
            </button>
            <Link
              href="/"
              className="mac-sklo-zaloha flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 text-[11px] text-white/75 backdrop-blur transition hover:bg-black/50 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Zpět na web
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
            // Lupa je přepínač: druhé kliknutí hledání zavře, jako na Macu.
            onSpotlight={() =>
              nastavPanel((p) => (p === "spotlight" ? null : "spotlight"))
            }
          />

          <DzinProvider>
            <div
              ref={plochaRef}
              className="mac-tapeta relative min-h-0 flex-1"
              data-tapeta={stav.nastaveni.tapeta}
            >
              <Plocha />

              {stav.okna.map((okno) => (
                <OknoSAplikaci
                  key={okno.id}
                  okno={okno}
                  // Nestačí být nahoře, okno musí patřit programu vpředu. Po
                  // zavření posledního okna Finderu je vpředu Finder bez okna
                  // a okno Poznámek pod ním má zešednout, jako na Macu.
                  aktivni={okno.z === nejvyssiZ && okno.app === stav.vpredu}
                  onZacitZnovu={() => nastavPanel("znovu")}
                />
              ))}

              <PanelUkoluMac />

              <Dock onLaunchpad={() => nastavPanel("launchpad")} />

              {panel === "vynutit" && (
                <VynutitUkonceni zavri={() => nastavPanel(null)} />
              )}
              {panel === "oMacu" && <OMacu zavri={() => nastavPanel(null)} />}
              {panel === "znovu" && (
                <ZacitZnovu
                  zavri={() => nastavPanel(null)}
                  potvrd={zacitZnovu}
                />
              )}
              {panel === "jdi" && (
                <PrejitDoSlozky zavri={() => nastavPanel(null)} />
              )}
              {panel === "launchpad" && (
                <Launchpad zavri={() => nastavPanel(null)} />
              )}
              {panel === "spotlight" && (
                <Spotlight zavri={() => nastavPanel(null)} />
              )}
            </div>
          </DzinProvider>
        </div>
      )}

      {/*
        Jas a Night Shift z Ovládacího centra. Obojí je vrstva PŘES celou
        obrazovku, ne `filter` na ní: filtr na předkovi vypne sklo
        (`backdrop-filter`) všem uvnitř. Myš vrstvami prochází. Jas platí
        i pro zamykací obrazovku, stejně jako na skutečném displeji.
      */}
      {stav.nastaveni.nocniRezim && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1000]"
          style={{
            background: "rgb(255 150 60 / 0.22)",
            mixBlendMode: "multiply",
          }}
        />
      )}
      {stav.nastaveni.jas < 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1000] bg-black"
          style={{ opacity: 1 - stav.nastaveni.jas }}
        />
      )}
    </div>
  );
}

/**
 * Vynutit ukončení.
 *
 * Jedno okénko se seznamem toho, co běží. Program bez okna v něm žák uvidí
 * pojmenovaný, i když po něm na obrazovce nic není. Popisky a tlačítka jsou
 * jako na skutečném Macu: žádné „bez okna“ a u Finderu „Znovu spustit“,
 * protože Finder ukončit nejde (rada 25. 9. 2026).
 */
function VynutitUkonceni({ zavri }: { zavri: () => void }) {
  const { stav, poslat } = useMac();
  const [vybrana, nastavVybranou] = useState<AppId | null>(null);

  return (
    <div className="absolute inset-0 z-[850] flex items-start justify-center bg-black/25 pt-[12vh]">
      <div className="mac-vjezd w-[380px] overflow-hidden rounded-xl bg-mac-povrch shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="border-b border-mac-linka bg-mac-panel px-4 py-3">
          <h2 className="text-[13px] font-semibold text-mac-text">
            Vynutit ukončení aplikací
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-mac-slaby">
            Pokud aplikace nereaguje, vyber její název a klikni na Vynutit
            ukončení.
          </p>
        </div>

        <ul className="max-h-[220px] overflow-y-auto p-2">
          {stav.bezici.map((app) => {
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
            disabled={!vybrana}
            onClick={() => {
              // Finder se jen znovu spustí – okna i stav zůstanou, jak byly.
              if (vybrana && vybrana !== "finder")
                poslat({ typ: "app/ukonci", app: vybrana });
              zavri();
            }}
            className="rounded-md bg-mac-akcent px-3 py-1.5 text-[13px] font-medium text-mac-akcent-text hover:opacity-90 disabled:opacity-40"
          >
            {vybrana === "finder" ? "Znovu spustit" : "Vynutit ukončení"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Aplikace (dřív Launchpad) – mřížka všech aplikací přes celou plochu.
 *
 * Na Macu je to jediné místo, kde jsou aplikace pohromadě, a nahrazuje to,
 * co Windows řeší nabídkou Start. Zavírá se kliknutím kamkoli i Escapem,
 * stejně jako ten skutečný. V macOS 26 se tomu říká Aplikace, a tak se to
 * jmenuje i v Docku a v zadání úloh (Karlovy návrhy 24. 9. 2026). Vnitřně
 * zůstává „launchpad“.
 */
function Launchpad({ zavri }: { zavri: () => void }) {
  const { stav, poslat, spust } = useMac();
  const [hledani, nastavHledani] = useState("");
  const pole = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const klavesa = (e: KeyboardEvent) => {
      if (e.key === "Escape") zavri();
    };
    window.addEventListener("keydown", klavesa);
    // Skutečný Launchpad má kurzor rovnou v hledání – stačí začít psát.
    const id = window.setTimeout(() => pole.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", klavesa);
      window.clearTimeout(id);
    };
  }, [zavri]);

  const otevri = (app: AppId) => {
    if (stav.bezici.includes(app)) poslat({ typ: "app/dopredu", app });
    else spust(app);
    zavri();
  };

  // Bez diakritiky a bez ohledu na velikost písmen: „poznamky" má najít
  // Poznámky, jinak by hledání bylo k ničemu na české klávesnici.
  const bezDiakritiky = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const hledane = bezDiakritiky(hledani.trim());
  const nalezene = (Object.keys(APLIKACE) as AppId[]).filter(
    (app) => !hledane || bezDiakritiky(APLIKACE[app].nazev).includes(hledane),
  );

  return (
    <div
      role="dialog"
      aria-label="Aplikace"
      className="mac-vjezd absolute inset-0 z-[870] flex flex-col items-center bg-black/45 pt-[9vh] backdrop-blur-2xl"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) zavri();
      }}
    >
      {/* Vyhledávací pole nahoře je to, podle čeho se Launchpad pozná –
          je i na jeho ikoně v Docku. */}
      <div className="mac-sklo-zaloha flex w-[260px] items-center gap-2 rounded-full bg-white/25 px-3 py-1.5 backdrop-blur">
        <Search className="h-4 w-4 shrink-0 text-white/80" />
        <input
          ref={pole}
          value={hledani}
          onChange={(e) => nastavHledani(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nalezene.length > 0) otevri(nalezene[0]);
          }}
          placeholder="Hledat"
          aria-label="Hledat aplikaci"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/60 focus-visible:outline-none"
        />
      </div>

      <div className="mt-12 grid grid-cols-4 gap-x-12 gap-y-9">
        {nalezene.map((app) => {
          const Z = VZHLED_APLIKACI[app].znak;
          const Plna = VZHLED_APLIKACI[app].plna;
          return (
            <button
              key={app}
              type="button"
              onClick={() => otevri(app)}
              className="flex w-[110px] flex-col items-center gap-2"
            >
              {Plna ? (
                <Plna
                  className="h-[70px] w-[70px] transition-transform hover:scale-105"
                  style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))" }}
                />
              ) : (
                <span
                  className="flex h-[70px] w-[70px] items-center justify-center rounded-[22%] shadow-lg transition-transform hover:scale-105"
                  style={{ background: VZHLED_APLIKACI[app].pozadi }}
                >
                  <Z
                    style={{ color: VZHLED_APLIKACI[app].barva }}
                    className="h-9 w-9"
                  />
                </span>
              )}
              <span
                className="text-center text-[12px] leading-tight text-white"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
              >
                {APLIKACE[app].nazev}
              </span>
            </button>
          );
        })}
        {nalezene.length === 0 && (
          <p className="col-span-4 text-[13px] text-white/75">
            Žádná aplikace tomu neodpovídá.
          </p>
        )}
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
    const casti =
      zadano === "~" || zadano.startsWith("~/")
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
        <h2 className="text-[13px] font-semibold text-mac-text">
          Přejít do složky:
        </h2>
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
          className="mt-3 w-full rounded-md border border-mac-linka bg-mac-povrch px-3 py-2 font-mono text-[13px] text-mac-text outline-none focus:border-mac-akcent focus:ring-[3px] focus:ring-mac-akcent/35"
        />
        <p
          className={`mt-2 h-4 text-[11px] ${chyba ? "text-[#c0392b]" : "text-mac-slaby"}`}
        >
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
function ZacitZnovu({
  zavri,
  potvrd,
}: {
  zavri: () => void;
  potvrd: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[860] flex items-start justify-center bg-black/25 pt-[14vh]">
      <div className="mac-vjezd w-[400px] overflow-hidden rounded-xl bg-mac-povrch shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="px-5 py-4">
          <h2 className="text-[14px] font-semibold text-mac-text">
            Začít úplně od začátku?
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-mac-slaby">
            Smažou se všechny soubory, které sis vytvořil, vrátí se nastavení a
            vynulují se odškrtnuté úlohy. Budeš se muset znovu přihlásit
            jménem. Tohle se nedá vzít zpět.
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

/**
 * Údaje o skutečném počítači pod simulací – systém, prohlížeč, obrazovka,
 * sklo, animace a plynulost. Ve třídě se okno vyfotí (nebo údaje zkopírují)
 * a je jasné, proč něco nejede. Zjišťuje se jen v prohlížeči, nikam se to
 * neposílá. Pravidla rozpoznání jsou v `lib/mac/pocitac.ts`.
 */
function useUdajePocitace() {
  const [udaje, nastavUdaje] = useState<[string, string][] | null>(null);
  /** Snímky za sekundu; „skryto", dokud karta není vidět. */
  const [fps, nastavFps] = useState<number | "skryto" | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const prohlizec = rozpoznejProhlizec(ua);
    const umi = (vlastnost: string, hodnota: string) =>
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports(vlastnost, hodnota);
    const sklo =
      umi("backdrop-filter", "blur(2px)") ||
      umi("-webkit-backdrop-filter", "blur(2px)");
    /*
     * Dotaz na animace umí Chrome až od 74, v cíli je 64. Starší prohlížeč
     * na neznámý dotaz odpoví „neplatí" – a to není totéž jako „animace
     * jsou zapnuté". Pozná se to podle `media`: neznámý dotaz se vrátí jako
     * „not all“. Radši se přizná, že to neví, než aby tvrdil nepravdu.
     */
    const dotazNaAnimace =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const animace = !dotazNaAnimace
      ? "prohlížeč to neřekne"
      : dotazNaAnimace.media === "not all"
        ? "prohlížeč to neřekne (starší verze)"
        : dotazNaAnimace.matches
          ? "vypnuté"
          : "zapnuté";
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      userAgentData?: {
        getHighEntropyValues?: (
          co: string[],
        ) => Promise<{ platformVersion?: string }>;
      };
    };
    // Prohlížeč paměť zaokrouhluje a nad 8 GB už víc neřekne.
    const pamet = nav.deviceMemory
      ? nav.deviceMemory >= 8
        ? "8 GB a víc"
        : `asi ${nav.deviceMemory} GB`
      : null;

    const radky = (system: string): [string, string][] => [
      ["Systém", system],
      [
        "Prohlížeč",
        prohlizec.verze
          ? `${prohlizec.nazev} ${prohlizec.verze}`
          : prohlizec.nazev,
      ],
      [
        "Obrazovka",
        `${screen.width} × ${screen.height}, hustota ${
          Math.round(window.devicePixelRatio * 100) / 100
        }×`,
      ],
      ["Okno prohlížeče", `${window.innerWidth} × ${window.innerHeight}`],
      [
        "Procesor",
        navigator.hardwareConcurrency
          ? `${navigator.hardwareConcurrency} vláken`
          : "nezjištěno",
      ],
      ...(pamet ? ([["Paměť", pamet]] as [string, string][]) : []),
      [
        "Sklo (průhlednost)",
        sklo ? "funguje" : "nefunguje – panely jsou ploché",
      ],
      ["Animace v systému", animace],
    ];

    let zije = true;
    const system = rozpoznejSystem(ua);
    nastavUdaje(radky(system));
    // Windows 10 a 11 se v textu prohlížeče hlásí stejně. Chrome a Edge
    // umějí říct víc, když se zeptá.
    if (
      system === "Windows 10 nebo 11" &&
      nav.userAgentData?.getHighEntropyValues
    ) {
      nav.userAgentData
        .getHighEntropyValues(["platformVersion"])
        .then((h) => {
          const presne = h.platformVersion
            ? rozlisWindows(h.platformVersion)
            : null;
          if (presne && zije) nastavUdaje(radky(presne));
        })
        .catch(() => {});
    }

    // Plynulost: kolik snímků prohlížeč za sekundu doopravdy nakreslí.
    // Pod 30 to na oko seká – a to je přesně to, co je potřeba vědět.
    // Skrytá karta kreslí jen pár snímků za sekundu, takže se měří, až je
    // vidět, a když se schová, začne se znovu. První čtvrtsekunda se
    // nepočítá – to se okno teprve rozjíždí.
    const ROZJEZD_MS = 250;
    const MERENI_MS = 1500;
    let ram = 0;
    const zmer = () => {
      cancelAnimationFrame(ram);
      if (document.hidden) {
        nastavFps("skryto");
        return;
      }
      nastavFps(null);
      const start = performance.now();
      let snimku = 0;
      let od = 0;
      ram = requestAnimationFrame(function krok(ted) {
        if (!zije) return;
        if (ted - start < ROZJEZD_MS) {
          ram = requestAnimationFrame(krok);
          return;
        }
        if (od === 0) od = ted;
        snimku++;
        if (ted - od < MERENI_MS) ram = requestAnimationFrame(krok);
        else nastavFps(Math.round(((snimku - 1) * 1000) / (ted - od)));
      });
    };
    const priZmeneViditelnosti = () => zmer();
    document.addEventListener("visibilitychange", priZmeneViditelnosti);
    zmer();
    return () => {
      zije = false;
      cancelAnimationFrame(ram);
      document.removeEventListener("visibilitychange", priZmeneViditelnosti);
    };
  }, []);

  return { udaje, fps };
}

/** „O tomto Macu“ – a hlavně poctivá věta o tom, co to je a co má žák za klávesnici. */
function OMacu({ zavri }: { zavri: () => void }) {
  const { udaje, fps } = useUdajePocitace();
  const [zkopirovano, nastavZkopirovano] = useState<"ano" | "nejde" | null>(
    null,
  );

  const vsechno: [string, string][] | null = udaje
    ? [
        ...udaje,
        [
          "Plynulost",
          fps === null
            ? "měří se…"
            : fps === "skryto"
              ? "změří se, až bude karta vidět"
              : `${fps} snímků za sekundu – ${
                  fps >= 50 ? "plynulé" : fps >= 30 ? "ujde" : "seká"
                }`,
        ],
      ]
    : null;

  const zkopiruj = () => {
    if (!vsechno) return;
    const text = vsechno.map(([k, v]) => `${k}: ${v}`).join("\n");
    // Starší cesta přes skryté pole. Projde i tam, kde nová schránka
    // (navigator.clipboard) není, nebo ji prohlížeč nepustí.
    const postaru = () => {
      const pole = document.createElement("textarea");
      pole.value = text;
      pole.setAttribute("readonly", "");
      pole.style.position = "fixed";
      pole.style.opacity = "0";
      document.body.appendChild(pole);
      pole.select();
      let povedlo = false;
      try {
        povedlo = document.execCommand("copy");
      } catch {
        povedlo = false;
      }
      pole.remove();
      nastavZkopirovano(povedlo ? "ano" : "nejde");
    };
    if (!navigator.clipboard?.writeText) {
      postaru();
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => nastavZkopirovano("ano"))
      .catch(postaru);
  };

  return (
    <div className="absolute inset-0 z-[850] flex items-center justify-center bg-black/25">
      <div className="mac-vjezd mac-posuv max-h-[92%] w-[460px] overflow-y-auto rounded-xl bg-mac-povrch p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <h2 className="text-[17px] font-semibold text-mac-text">
          Výuková simulace macOS
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-mac-slaby">
          Neběží tu skutečný systém a nic se neinstaluje. Všechno, co tady
          uděláš, se děje jen v téhle záložce prohlížeče – tvého počítače se to
          nedotkne a na server se neodesílá nic.
        </p>

        {/* Na skutečném Macu tu je čip, paměť a verze systému. Tady je to
            počítač, na kterém simulace doopravdy běží. */}
        <div className="mt-4 rounded-lg border border-mac-linka p-3 text-left">
          <p className="text-[12px] font-semibold text-mac-text">
            Na čem to právě běží
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-mac-slaby">
            Skutečný počítač pod simulací. Když něco nejede, pomůže to
            vyučujícímu. Nic z toho se nikam neposílá.
          </p>
          {vsechno && (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[12px]">
              {vsechno.map(([k, v]) => (
                // `Fragment`, ne obal s `display: contents` – ten umí Chrome
                // až od 65 a v cíli je 64. Tabulka by se rozsypala.
                <Fragment key={k}>
                  <dt className="text-mac-slaby">{k}</dt>
                  <dd className="tabular-nums text-mac-text">{v}</dd>
                </Fragment>
              ))}
            </dl>
          )}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={zkopiruj}
              disabled={!vsechno || typeof fps !== "number"}
              className="rounded-md border border-mac-linka px-2.5 py-1 text-[12px] text-mac-text hover:bg-mac-zvyrazneny disabled:opacity-50"
            >
              Zkopírovat údaje
            </button>
            <span className="text-[11px] text-mac-slaby" aria-live="polite">
              {zkopirovano === "ano"
                ? "Zkopírováno – vlož to vyučujícímu."
                : zkopirovano === "nejde"
                  ? "Tady kopírovat nejde, okno vyfoť."
                  : ""}
            </span>
          </div>
        </div>

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
    (titul: string, arg?: string) =>
      poslat({ typ: "okno/titul", id: okno.id, titul, arg }),
    [okno.id, poslat],
  );
  const zavri = useCallback(
    () => poslat({ typ: "okno/zavri", id: okno.id }),
    [okno.id, poslat],
  );

  // Bez `useMemo` by kontext dostal při každém překreslení novou referenci
  // a efekty uvnitř aplikace by se spouštěly pořád dokola.
  const hodnota = useMemo(
    () => ({ id: okno.id, arg: okno.arg, aktivni, nastavTitul, zavri }),
    [okno.id, okno.arg, aktivni, nastavTitul, zavri],
  );

  return (
    <OknoRamMac okno={okno} aktivni={aktivni}>
      {(slot) => (
        <OknoMacProvider value={{ ...hodnota, slotZahlavi: slot }}>
          <Aplikace app={okno.app} onZacitZnovu={onZacitZnovu} />
        </OknoMacProvider>
      )}
    </OknoRamMac>
  );
}

function Aplikace({
  app,
  onZacitZnovu,
}: {
  app: AppId;
  onZacitZnovu: () => void;
}) {
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

/**
 * Spotlight.
 *
 * Na Macu se jím hledá úplně všechno a je to první věc, po které člověk
 * sáhne, když neví, kde co leží. Proto hledá doopravdy – v celém disku,
 * po skutečných jménech (viz `lib/mac/hledani.ts`).
 *
 * Co se najde, to se i otevře, a otevře se tím, čím se to otevřít má:
 * složka ve Finderu, textový soubor v Poznámkách, balíček `.app` se rovnou
 * spustí. U ostatních se otevře složka, ve které leží – tak to dělá i Mac,
 * když dokumentu nerozumí.
 */
function Spotlight({ zavri }: { zavri: () => void }) {
  const { stav, poslat, spust } = useMac();
  const [dotaz, nastavDotaz] = useState("");
  const [vybrany, nastavVybrany] = useState(0);
  const pole = useRef<HTMLInputElement>(null);

  const nalezy = useMemo(() => prohledej(stav.disk, dotaz), [stav.disk, dotaz]);

  useEffect(() => {
    const id = window.setTimeout(() => pole.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  // Po každé změně dotazu se ukazovátko vrací na první nález – jinak by
  // ukazovalo na řádek, který už dávno není ten, na který se žák dívá.
  useEffect(() => {
    nastavVybrany(0);
  }, [dotaz]);

  const otevri = (n: Nalez) => {
    const cesta = slozMac(n.cesta);
    const app = APLIKACE_BALICKU[n.uzel.jmeno];
    if (app) {
      if (stav.bezici.includes(app)) poslat({ typ: "app/dopredu", app });
      else spust(app);
    } else if (jeSlozka(n.uzel) && !jeBalicek(n.uzel.jmeno)) {
      spust("finder", cesta);
    } else if (JE_TEXT.test(n.uzel.jmeno)) {
      spust("poznamky", cesta);
    } else {
      spust("finder", slozMac(n.cesta.slice(0, -1)));
    }
    zavri();
  };

  return (
    <div
      className="absolute inset-0 z-[880] flex flex-col items-center bg-black/25 pt-[14vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) zavri();
      }}
    >
      <div className="mac-vjezd w-[min(560px,86%)] overflow-hidden rounded-2xl bg-mac-panel/95 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-mac-slaby" />
          <input
            ref={pole}
            value={dotaz}
            onChange={(e) => nastavDotaz(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") zavri();
              if (e.key === "ArrowDown" && nalezy.length > 0) {
                e.preventDefault();
                nastavVybrany((v) => (v + 1) % nalezy.length);
              }
              if (e.key === "ArrowUp" && nalezy.length > 0) {
                e.preventDefault();
                nastavVybrany((v) => (v - 1 + nalezy.length) % nalezy.length);
              }
              if (e.key === "Enter" && nalezy[vybrany]) otevri(nalezy[vybrany]);
            }}
            placeholder="Hledat v celém disku"
            aria-label="Hledat v celém disku"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[19px] text-mac-text outline-none placeholder:text-mac-slaby focus-visible:outline-none"
          />
        </div>

        {dotaz.trim() !== "" && (
          <div className="border-t border-mac-linka">
            {nalezy.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-mac-slaby">
                Nic takového tu není.
              </p>
            ) : (
              nalezy.map((n, i) => (
                <button
                  key={slozMac(n.cesta)}
                  type="button"
                  onMouseEnter={() => nastavVybrany(i)}
                  onClick={() => otevri(n)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                    i === vybrany
                      ? "bg-mac-akcent text-mac-akcent-text"
                      : "text-mac-text"
                  }`}
                >
                  <VelkaIkona uzel={n.uzel} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">
                      {n.uzel.jmeno}
                    </span>
                    {/* Cesta pod jménem je tu schválně: Spotlight neříká jen
                        CO našel, ale hlavně KDE to leží. */}
                    <span
                      className={`block truncate text-[11px] ${
                        i === vybrany ? "opacity-80" : "text-mac-slaby"
                      }`}
                    >
                      {sVlnovkou(n.cesta.slice(0, -1))}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Přípony, které umí otevřít Poznámky. Totéž co ve Finderu. */
const JE_TEXT = /\.(txt|plist|csv|md|xml|json|log)$|^\.?zshrc$/i;
