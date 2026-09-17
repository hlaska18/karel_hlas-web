"use client";

/**
 * Horní lišta – nejdůležitější kus celého prostředí.
 *
 * VE WINDOWS má nabídky každé okno svoje, uvnitř sebe. NA MACU je nabídka
 * jedna jediná, nahoře, a patří té aplikaci, která je právě vpředu. Když žák
 * zavře poslední okno Poznámek, okno zmizí – ale nahoře pořád svítí
 * „Poznámky“, protože program běží. To je ta věc, kterou má simulace naučit,
 * a proto je jméno aplikace v liště schválně tučné hned vedle jablka.
 *
 * KLÁVESNICE. Žáci sedí u windowsových strojů, kde ⌘ není. Prostředí proto
 * bere Ctrl jako ⌘ a říká to nahlas – viz nabídka jablka a `MacOS.tsx`.
 */

import { useEffect, useRef, useState } from "react";
import { Apple, BatteryMedium, Search, SlidersHorizontal, Wifi } from "lucide-react";
import { useMac } from "./system";
import { APLIKACE } from "@/lib/mac/stav";
import { datumSlovy, hodiny } from "@/lib/win/format";

export interface Polozka {
  text: string;
  /** Zkratka, jak ji píše macOS. */
  zkratka?: string;
  akce?: () => void;
  /** Položka je vidět, ale nejde na ni kliknout (třeba „Ukončit Finder“). */
  zesedle?: boolean;
  /** Vodorovná čára pod položkou. */
  oddelovac?: boolean;
}

export interface Nabidka {
  titul: string;
  polozky: Polozka[];
  /** Místo textu se vykreslí jablko. Má ho jen nabídka systému. */
  jablko?: boolean;
  /** Tučně – tak macOS odlišuje jméno aplikace vpředu od ostatních nabídek. */
  tucne?: boolean;
}

export function HorniLista({
  nabidky,
  onVynutitUkonceni,
  onOdhlasit,
  onZacitZnovu,
  onOMacu,
}: {
  /** Nabídky aplikace vpředu. Jablko a jméno aplikace si lišta doplní sama. */
  nabidky: Nabidka[];
  onVynutitUkonceni: () => void;
  onOdhlasit: () => void;
  onZacitZnovu: () => void;
  onOMacu: () => void;
}) {
  const { stav, poslat } = useMac();
  const [otevrena, nastavOtevrenou] = useState<string | null>(null);
  const [cas, nastavCas] = useState<Date | null>(null);
  const lista = useRef<HTMLDivElement>(null);

  const vpredu = stav.vpredu ?? "finder";
  const jmenoVpredu = APLIKACE[vpredu].nazev;

  useEffect(() => {
    nastavCas(new Date());
    const id = window.setInterval(() => nastavCas(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Kliknutí mimo lištu nabídku zavře. Stejně tak Escape. */
  useEffect(() => {
    if (!otevrena) return;
    const venku = (e: MouseEvent) => {
      if (!lista.current?.contains(e.target as Node)) nastavOtevrenou(null);
    };
    const klavesa = (e: KeyboardEvent) => {
      if (e.key === "Escape") nastavOtevrenou(null);
    };
    window.addEventListener("mousedown", venku);
    window.addEventListener("keydown", klavesa);
    return () => {
      window.removeEventListener("mousedown", venku);
      window.removeEventListener("keydown", klavesa);
    };
  }, [otevrena]);

  /* Nabídka jablka. Je pořád stejná, ať je vpředu cokoli – i to je rozdíl
     proti Windows, kde nic jako „nabídka systému“ nad okny není. */
  const jablko: Polozka[] = [
    { text: "O tomto Macu", akce: onOMacu, oddelovac: true },
    { text: "Vynutit ukončení…", zkratka: "⌥⌘⎋", akce: onVynutitUkonceni, oddelovac: true },
    { text: "Odhlásit se", zkratka: "⇧⌘Q", akce: onOdhlasit, oddelovac: true },
    // Ve skutečném macOS nic takového není. Je to učební pomůcka: žák si má
    // moct prostředí vrátit do stavu, ve kterém ho dostal, aniž by čekal na
    // vyučujícího. Bydlí u jablka, protože tam už je Odhlásit se.
    { text: "Začít úplně od začátku…", akce: onZacitZnovu },
  ];

  /* Nabídka pojmenovaná po aplikaci. „Ukončit“ tu je pro všechny kromě
     Finderu – ten se ukončit nedá a nabídka to má přiznat, ne to předstírat
     položkou, po které se nic nestane. */
  const aplikace: Polozka[] = [
    { text: `O aplikaci ${jmenoVpredu}`, akce: onOMacu, oddelovac: true },
    {
      text: `Skrýt ${jmenoVpredu}`,
      zkratka: "⌘H",
      akce: () =>
        stav.okna
          .filter((o) => o.app === vpredu)
          .forEach((o) => poslat({ typ: "okno/minimalizuj", id: o.id })),
      oddelovac: true,
    },
    vpredu === "finder"
      ? { text: "Ukončit Finder", zkratka: "⌘Q", zesedle: true }
      : {
          text: `Ukončit ${jmenoVpredu}`,
          zkratka: "⌘Q",
          akce: () => poslat({ typ: "app/ukonci", app: vpredu }),
        },
  ];

  const vsechny: Nabidka[] = [
    { titul: "Apple", polozky: jablko, jablko: true },
    { titul: jmenoVpredu, polozky: aplikace, tucne: true },
    ...nabidky,
  ];

  return (
    <div
      ref={lista}
      className="mac-sklo mac-bezvyberu relative z-[900] flex h-[26px] shrink-0 items-center border-b border-black/10 px-2 text-[13px] text-mac-text"
    >
      {vsechny.map((n, i) => {
        const klic = `${i}-${n.titul}`;
        const aktivni = otevrena === klic;
        return (
          <div key={klic} className="relative">
            <button
              type="button"
              onClick={() => nastavOtevrenou(aktivni ? null : klic)}
              // Když je nějaká nabídka otevřená, stačí po liště přejet. Bez
              // toho působí lišta tuhle a žák klikáním hledá, co kam patří.
              onMouseEnter={() => otevrena && nastavOtevrenou(klic)}
              className={`flex h-[26px] items-center rounded px-2 ${
                aktivni ? "bg-mac-akcent text-mac-akcent-text" : "hover:bg-black/10"
              } ${n.tucne ? "font-semibold" : ""}`}
              aria-label={n.jablko ? "Nabídka systému" : undefined}
            >
              {n.jablko ? <Apple className="h-[15px] w-[15px]" fill="currentColor" /> : n.titul}
            </button>
            {aktivni && <Rozbaleno polozky={n.polozky} zavri={() => nastavOtevrenou(null)} />}
          </div>
        );
      })}

      {/*
        Pravá strana lišty. Pořadí je to skutečné z macOS: baterie, Wi-Fi,
        Ovládací centrum, Spotlight a nakonec datum s časem. Právě tahle
        skupina ikon dělá z pruhu nahoře „lištu Macu“ – bez nich to byl jen
        proužek s hodinami.

        Nic z toho nic nedělá a je to přiznané v titulku. Předstírat Wi-Fi,
        která se nepřipojí, nebo vyhledávání, které nic nenajde, by bylo horší
        než je tam nemít.
      */}
      <div className="ml-auto flex items-center gap-[10px] pr-1">
        <span title="Baterie – v téhle simulaci nefunguje" className="flex items-center">
          <BatteryMedium className="h-[15px] w-[15px] opacity-75" aria-hidden="true" />
        </span>
        <span title="Wi-Fi – v téhle simulaci nefunguje" className="flex items-center">
          <Wifi className="h-[14px] w-[14px] opacity-75" aria-hidden="true" />
        </span>
        <span title="Ovládací centrum – v téhle simulaci nefunguje" className="flex items-center">
          <SlidersHorizontal className="h-[14px] w-[14px] opacity-75" aria-hidden="true" />
        </span>
        <span title="Spotlight – v téhle simulaci nefunguje" className="flex items-center">
          <Search className="h-[14px] w-[14px] opacity-75" aria-hidden="true" />
        </span>
        <span className="tabular-nums opacity-85">{cas ? datumSlovy(cas) : ""}</span>
        <span className="tabular-nums">{cas ? hodiny(cas) : "--:--"}</span>
      </div>
    </div>
  );
}

function Rozbaleno({ polozky, zavri }: { polozky: Polozka[]; zavri: () => void }) {
  return (
    <div
      className="mac-nabidka absolute left-0 top-[26px] min-w-[230px] rounded-lg border border-black/10 bg-mac-panel/95 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      role="menu"
    >
      {polozky.map((p, i) => (
        <div key={`${p.text}-${i}`}>
          <button
            type="button"
            role="menuitem"
            disabled={p.zesedle || !p.akce}
            onClick={() => {
              p.akce?.();
              zavri();
            }}
            className={`flex w-full items-center justify-between gap-8 rounded px-3 py-[5px] text-left text-[13px] ${
              p.zesedle || !p.akce
                ? "cursor-default text-mac-slaby/60"
                : "text-mac-text hover:bg-mac-akcent hover:text-mac-akcent-text"
            }`}
          >
            <span>{p.text}</span>
            {p.zkratka && <span className="text-[12px] opacity-60">{p.zkratka}</span>}
          </button>
          {p.oddelovac && <div className="my-1 h-px bg-mac-linka" />}
        </div>
      ))}
    </div>
  );
}
