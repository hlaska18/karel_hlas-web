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
import {
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import { ZnakJablko } from "@/components/ZnakJablko";
import { useMac } from "./system";
import { APLIKACE, JAS_MIN, type NastaveniMac } from "@/lib/mac/stav";
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
  onSpotlight,
}: {
  /** Nabídky aplikace vpředu. Jablko a jméno aplikace si lišta doplní sama. */
  nabidky: Nabidka[];
  onVynutitUkonceni: () => void;
  onOdhlasit: () => void;
  onZacitZnovu: () => void;
  onOMacu: () => void;
  onSpotlight: () => void;
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
    {
      text: "Vynutit ukončení…",
      zkratka: "⌥⌘⎋",
      akce: onVynutitUkonceni,
      oddelovac: true,
    },
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
      className="relative z-[900] shrink-0 text-[13px] text-mac-text"
    >
      {/*
        Sklo je jen na pruhu, ne na obalu. Panely vpravo (Ovládací centrum,
        Centrum oznámení) mají vlastní sklo, a sklo uvnitř skla nevidí, co je
        pod ním: `backdrop-filter` předka z něj dělá hranici. Ikona z plochy
        pak panelem prosvítala ostrá, nerozmazaná. Proto stojí panely vedle
        pruhu, ne v něm.
      */}
      <div className="mac-sklo mac-bezvyberu flex h-[26px] items-center border-b border-black/10 px-2">
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
                onMouseEnter={() =>
                  otevrena &&
                  !PANELY.includes(otevrena) &&
                  nastavOtevrenou(klic)
                }
                className={`flex h-[26px] items-center rounded px-2 ${
                  aktivni
                    ? "bg-mac-akcent text-mac-akcent-text"
                    : "hover:bg-black/10"
                } ${n.tucne ? "font-semibold" : ""}`}
                aria-label={n.jablko ? "Nabídka systému" : undefined}
              >
                {n.jablko ? <ZnakJablko /> : n.titul}
              </button>
              {aktivni && (
                <Rozbaleno
                  polozky={n.polozky}
                  zavri={() => nastavOtevrenou(null)}
                />
              )}
            </div>
          );
        })}

        {/*
        Pravá strana lišty: Ovládací centrum, Spotlight a datum s časem, v tom
        pořadí jako na Macu.

        BATERIE A WI-FI TU NEJSOU. Ve škole stojí stolní Macy, které baterii
        nemají, a jsou na kabelu, takže Wi-Fi v liště nepotřebují. Dřív tu
        obě ikony byly jen nakreslené a kliknutí na ně nedělalo nic – to
        vypadalo rozbitě.

        Všechno, co tu zbylo, po kliknutí něco udělá, a nic nepředstírá:
        Ovládací centrum přepíná věci, které prostředí opravdu umí, Spotlight
        hledá na disku, který tu je, a datum otevře Centrum oznámení
        s kalendářem a hodinami.
      */}
        <div className="ml-auto flex items-center gap-[6px] pr-1">
          <button
            type="button"
            aria-label="Ovládací centrum"
            aria-expanded={otevrena === "cc"}
            onClick={() => nastavOtevrenou(otevrena === "cc" ? null : "cc")}
            className={`flex h-[22px] items-center rounded px-1.5 ${
              otevrena === "cc" ? "bg-black/15" : "hover:bg-black/10"
            }`}
          >
            <SlidersHorizontal
              className="h-[14px] w-[14px] opacity-75"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            title="Spotlight – hledání v celém disku"
            aria-label="Spotlight – hledání v celém disku"
            onClick={onSpotlight}
            className="flex h-[22px] items-center rounded px-1.5 opacity-75 hover:bg-black/10 hover:opacity-100"
          >
            <Search className="h-[14px] w-[14px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Centrum oznámení"
            aria-expanded={otevrena === "nc"}
            onClick={() => nastavOtevrenou(otevrena === "nc" ? null : "nc")}
            className={`flex h-[22px] items-center gap-[10px] rounded px-1.5 ${
              otevrena === "nc" ? "bg-black/15" : "hover:bg-black/10"
            }`}
          >
            <span className="tabular-nums opacity-85">
              {cas ? datumSlovy(cas) : ""}
            </span>
            <span className="tabular-nums">{cas ? hodiny(cas) : "--:--"}</span>
          </button>
        </div>
      </div>

      {otevrena === "cc" && <OvladaciCentrum />}
      {otevrena === "nc" && cas && <CentrumOznameni cas={cas} />}
    </div>
  );
}

/** Klíče panelů vpravo. Přejetím myší se na ně nepřepíná, na nabídky ano. */
const PANELY = ["cc", "nc"];

/** Sklo panelů vpravo nahoře – stejné jako u nabídek, jen oblejší. */
const SKLO_PANELU =
  "mac-nabidka mac-bezvyberu rounded-2xl border border-black/10 bg-mac-panel/90 text-[13px] text-mac-text shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl";

/**
 * Ovládací centrum.
 *
 * Skutečné má i Wi-Fi, Bluetooth, AirDrop, zvuk nebo Soustředění. Tady je
 * jen to, co prostředí doopravdy umí: přepínač, po kterém se nic nestane,
 * je horší než žádný. Tmavý režim je totéž nastavení jako v Nastavení
 * systému, jen po ruce – a právě to je na Ovládacím centru to podstatné.
 */
function OvladaciCentrum() {
  const { stav, poslat } = useMac();
  const n = stav.nastaveni;
  const zmen = (zmena: Partial<NastaveniMac>) =>
    poslat({ typ: "nastaveni/zmen", zmena });
  return (
    <div
      role="dialog"
      aria-label="Ovládací centrum"
      className={`${SKLO_PANELU} absolute right-2 top-[30px] w-[300px] p-2.5`}
    >
      <div className="grid grid-cols-2 gap-2">
        <Dlazdice
          ikona={Moon}
          nazev="Tmavý režim"
          zapnuto={n.motiv === "tmavy"}
          prepni={() =>
            zmen({ motiv: n.motiv === "tmavy" ? "svetly" : "tmavy" })
          }
        />
        <Dlazdice
          ikona={Sunset}
          nazev="Night Shift"
          zapnuto={n.nocniRezim}
          prepni={() => zmen({ nocniRezim: !n.nocniRezim })}
        />
      </div>
      <div className="mt-2 rounded-xl bg-mac-povrch/60 px-3 py-2.5">
        <label htmlFor="mac-jas" className="text-[12px] font-semibold">
          Displej
        </label>
        <div className="mt-2 flex items-center gap-2">
          <Sun
            className="h-[14px] w-[14px] shrink-0 opacity-60"
            aria-hidden="true"
          />
          <input
            id="mac-jas"
            type="range"
            min={Math.round(JAS_MIN * 100)}
            max={100}
            value={Math.round(n.jas * 100)}
            onChange={(e) => zmen({ jas: Number(e.target.value) / 100 })}
            className="w-full"
            style={{ accentColor: "rgb(var(--mac-akcent))" }}
          />
        </div>
      </div>
    </div>
  );
}

function Dlazdice({
  ikona: Ikona,
  nazev,
  zapnuto,
  prepni,
}: {
  ikona: LucideIcon;
  nazev: string;
  zapnuto: boolean;
  prepni: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={zapnuto}
      onClick={prepni}
      className="flex items-center gap-2 rounded-xl bg-mac-povrch/60 p-2 text-left hover:bg-mac-povrch/80"
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          zapnuto
            ? "bg-mac-akcent text-mac-akcent-text"
            : "bg-black/10 text-mac-text"
        }`}
      >
        <Ikona className="h-[14px] w-[14px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold leading-tight">
          {nazev}
        </span>
        <span className="block text-[11px] leading-tight text-mac-slaby">
          {zapnuto ? "Zapnuto" : "Vypnuto"}
        </span>
      </span>
    </button>
  );
}

const MESICE_1P = [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec",
];
const DNY_1P = [
  "neděle",
  "pondělí",
  "úterý",
  "středa",
  "čtvrtek",
  "pátek",
  "sobota",
];
const DNY_ZKRATKY = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

/**
 * Centrum oznámení – otevře ho kliknutí na datum, jako na Macu.
 *
 * Oznámení tu nikdo neposílá, takže zbývají widgety. Oba ukazují pravdu:
 * kalendář dnešní měsíc a hodiny skutečný čas. Počasí nebo zprávy by musely
 * být vymyšlené.
 */
function CentrumOznameni({ cas }: { cas: Date }) {
  const rok = cas.getFullYear();
  const mesic = cas.getMonth();
  const dnes = cas.getDate();
  // Týden začíná pondělím. `getDay()` má neděli jako 0, proto ten posun.
  const odsazeni = (new Date(rok, mesic, 1).getDay() + 6) % 7;
  const dnu = new Date(rok, mesic + 1, 0).getDate();
  const bunky: (number | null)[] = [
    ...Array<null>(odsazeni).fill(null),
    ...Array.from({ length: dnu }, (_, i) => i + 1),
  ];

  return (
    <div
      role="dialog"
      aria-label="Centrum oznámení"
      className="absolute right-2 top-[30px] flex w-[330px] flex-col gap-2"
    >
      <div className={`${SKLO_PANELU} grid grid-cols-[88px_1fr] gap-3 p-4`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#ff3b30]">
            {DNY_1P[cas.getDay()]}
          </p>
          <p className="text-[40px] font-light leading-none tabular-nums">
            {dnes}
          </p>
          <p className="mt-3 text-[11px] leading-snug text-mac-slaby">
            Na dnešek nic v kalendáři
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#ff3b30]">
            {MESICE_1P[mesic]}
          </p>
          <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center text-[10px] tabular-nums">
            {DNY_ZKRATKY.map((d) => (
              <span key={d} className="font-semibold text-mac-slaby">
                {d}
              </span>
            ))}
            {bunky.map((d, i) => (
              <span
                key={i}
                className={`mx-auto flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                  d === dnes ? "bg-[#ff3b30] font-semibold text-white" : ""
                }`}
              >
                {d ?? ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`${SKLO_PANELU} flex items-center gap-4 p-4`}>
        <Cifernik cas={cas} />
        <div>
          <p className="text-[13px] font-semibold">Praha</p>
          <p className="text-[11px] text-mac-slaby">Dnes · {hodiny(cas)}</p>
        </div>
      </div>
    </div>
  );
}

/** Ručičkové hodiny do widgetu. Ručičky jdou podle skutečného času. */
function Cifernik({ cas }: { cas: Date }) {
  const s = cas.getSeconds();
  const m = cas.getMinutes() + s / 60;
  const h = (cas.getHours() % 12) + m / 60;
  const rucicka = (
    uhel: number,
    delka: number,
    sirka: number,
    barva: string,
  ) => (
    <line
      x1={50}
      y1={50}
      x2={50 + delka * Math.sin((uhel * Math.PI) / 180)}
      y2={50 - delka * Math.cos((uhel * Math.PI) / 180)}
      stroke={barva}
      strokeWidth={sirka}
      strokeLinecap="round"
    />
  );
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-[64px] w-[64px] shrink-0"
      aria-hidden="true"
    >
      <circle cx={50} cy={50} r={48} fill="rgb(var(--mac-povrch))" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1={50}
          y1={8}
          x2={50}
          y2={i % 3 === 0 ? 16 : 12}
          stroke="currentColor"
          strokeOpacity={0.55}
          strokeWidth={i % 3 === 0 ? 3 : 2}
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      {rucicka(h * 30, 24, 5, "currentColor")}
      {rucicka(m * 6, 36, 3.5, "currentColor")}
      {rucicka(s * 6, 38, 1.5, "#ff9500")}
      <circle cx={50} cy={50} r={3} fill="#ff9500" />
    </svg>
  );
}

function Rozbaleno({
  polozky,
  zavri,
}: {
  polozky: Polozka[];
  zavri: () => void;
}) {
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
            {p.zkratka && (
              <span className="text-[12px] opacity-60">{p.zkratka}</span>
            )}
          </button>
          {p.oddelovac && <div className="my-1 h-px bg-mac-linka" />}
        </div>
      ))}
    </div>
  );
}
