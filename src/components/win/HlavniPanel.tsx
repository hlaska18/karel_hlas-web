"use client";

/**
 * Hlavní panel, oznamovací oblast a rozbalovací panely.
 *
 * Zarovnání na střed je to, co lidi po přechodu z Windows 10 nejvíc zaskočí –
 * proto se dá v Nastavení přepnout doleva a je z toho i jeden z úkolů. Tlačítka
 * běžících aplikací mají pod sebou čárku a to aktivní světlejší podklad, přesně
 * jako v předloze.
 */

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bluetooth,
  ChevronUp,
  LayoutGrid,
  Moon,
  Plane,
  Search,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  HardDrive,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { Ikona } from "./Ikona";
import { Posuvnik, useVenkovniKlik } from "./ui";
import { useSystem } from "./system";
import { APLIKACE, type AppId } from "@/lib/win/typy";
import { datum, datumSlovy, hodiny } from "@/lib/win/format";

const PRIPNUTE_NA_PANEL: AppId[] = ["pruzkumnik", "prohlizec", "poznamkovy-blok", "nastaveni"];

/**
 * Který vyskakovací panel je otevřený. Exportuje se, protože stav drží
 * `VirtualniPocitac` – dokud byl ten seznam opsaný na dvou místech, každá nová
 * položka se musela dopsat dvakrát.
 */
export type Panel = "start" | "rychla" | "oznameni" | "skryte" | "prehled" | null;

export function HlavniPanel({
  otevreny,
  nastavOtevreny,
  onZobrazitPlochu,
}: {
  otevreny: Panel;
  nastavOtevreny: (p: Panel) => void;
  onZobrazitPlochu: () => void;
}) {
  const { stav, poslat, spust } = useSystem();
  const [cas, nastavCas] = useState<Date | null>(null);
  const n = stav.nastaveni;

  // Hodiny se rozběhnou až na klientovi – jinak by se serverem vykreslený
  // čas neshodoval s tím v prohlížeči a React by hlásil rozpor.
  useEffect(() => {
    nastavCas(new Date());
    const id = window.setInterval(() => nastavCas(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /** Aplikace na panelu: připnuté plus ty, co zrovna běží. */
  const bezici = Array.from(new Set(stav.okna.map((o) => o.app)));
  const naPanelu = Array.from(new Set([...PRIPNUTE_NA_PANEL, ...bezici]));
  const nejvyssiZ = Math.max(0, ...stav.okna.map((o) => o.z));

  const klikNaAplikaci = (app: AppId) => {
    const okna = stav.okna.filter((o) => o.app === app);
    if (okna.length === 0) {
      spust(app);
      return;
    }
    const posledni = okna.reduce((a, b) => (a.z > b.z ? a : b));
    poslat({ typ: "okno/prepni", id: posledni.id });
  };

  return (
    <>
      <div
        /* Panel je součástí toku, ne plovoucí vrstva: plocha nad ním pak
           opravdu končí u jeho horní hrany a maximalizované ani přichycené
           okno pod něj nezaleze. */
        className={`win-sklo win-bezvyberu relative z-[600] flex h-12 shrink-0 items-center border-t border-win-linka/60 px-2 ${
          n.zarovnaniPanelu === "stred" ? "justify-center" : "justify-start"
        }`}
      >
        <div className="flex items-center gap-1">
          <TlacitkoPanelu
            popis="Start"
            aktivni={otevreny === "start"}
            onClick={() => nastavOtevreny(otevreny === "start" ? null : "start")}
          >
            <LogoStart />
          </TlacitkoPanelu>
          <TlacitkoPanelu popis="Hledat" onClick={() => nastavOtevreny("start")}>
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </TlacitkoPanelu>
          {/* Zobrazení úkolů ukazuje otevřená okna. Dřív bylo zavěšené na
              „Zobrazit plochu", takže dělalo totéž co tlačítko o kus dál –
              a bez otevřených oken nedělalo vůbec nic. */}
          <TlacitkoPanelu
            popis="Zobrazení úkolů"
            aktivni={otevreny === "prehled"}
            onClick={() => nastavOtevreny(otevreny === "prehled" ? null : "prehled")}
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
          </TlacitkoPanelu>

          {naPanelu.map((app) => {
            const okna = stav.okna.filter((o) => o.app === app);
            const jeAktivni = okna.some((o) => o.z === nejvyssiZ && o.stav !== "minimalizovane");
            return (
              <button
                key={app}
                type="button"
                aria-label={APLIKACE[app].nazev}
                title={APLIKACE[app].nazev}
                onClick={() => klikNaAplikaci(app)}
                className={`relative flex h-10 w-10 items-center justify-center rounded transition-colors ${
                  jeAktivni ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
                }`}
              >
                <Ikona klic={app} velikost={24} />
                {okna.length > 0 && (
                  <span
                    className="absolute bottom-0.5 h-[3px] rounded-full transition-all"
                    style={{
                      width: jeAktivni ? 16 : 6,
                      backgroundColor: "rgb(var(--win-akcent))",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Oznamovací oblast */}
        <div
          className={`flex items-center gap-1 ${
            n.zarovnaniPanelu === "stred" ? "absolute right-2" : "ml-auto"
          }`}
        >
          <button
            type="button"
            aria-label="Skryté ikony"
            onClick={() => nastavOtevreny(otevreny === "skryte" ? null : "skryte")}
            className={`flex h-8 w-6 items-center justify-center rounded ${
              otevreny === "skryte" ? "bg-win-zvyrazneny" : "hover:bg-win-zvyrazneny"
            }`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Rychlá nastavení"
            onClick={() => nastavOtevreny(otevreny === "rychla" ? null : "rychla")}
            className={`flex h-8 items-center gap-2 rounded px-2 ${
              otevreny === "rychla" ? "bg-win-zvyrazneny" : "hover:bg-win-zvyrazneny"
            }`}
          >
            {n.wifi && !n.rezimVLetadle ? (
              <Wifi className="h-4 w-4" strokeWidth={1.7} />
            ) : (
              <WifiOff className="h-4 w-4" strokeWidth={1.7} />
            )}
            {n.hlasitost > 0 ? (
              <Volume2 className="h-4 w-4" strokeWidth={1.7} />
            ) : (
              <VolumeX className="h-4 w-4" strokeWidth={1.7} />
            )}
          </button>
          <button
            type="button"
            aria-label="Datum a čas"
            onClick={() => nastavOtevreny(otevreny === "oznameni" ? null : "oznameni")}
            className={`flex h-8 flex-col items-end justify-center rounded px-2 text-[11.5px] leading-[1.15] tabular-nums ${
              otevreny === "oznameni" ? "bg-win-zvyrazneny" : "hover:bg-win-zvyrazneny"
            }`}
          >
            <span>{cas ? hodiny(cas) : "--:--"}</span>
            <span>{cas ? datum(cas) : ""}</span>
          </button>
          <button
            type="button"
            aria-label="Zobrazit plochu"
            onClick={onZobrazitPlochu}
            title="Zobrazit plochu"
            className="h-8 w-1.5 rounded-sm border-l border-win-linka hover:bg-win-zvyrazneny"
          />
        </div>
      </div>

      {otevreny === "prehled" && <PrehledOken zavri={() => nastavOtevreny(null)} />}
      {otevreny === "skryte" && <SkryteIkony zavri={() => nastavOtevreny(null)} />}
      {otevreny === "rychla" && <RychlaNastaveni zavri={() => nastavOtevreny(null)} />}
      {otevreny === "oznameni" && cas && (
        <PanelOznameni cas={cas} zavri={() => nastavOtevreny(null)} />
      )}
    </>
  );
}

function TlacitkoPanelu({
  children,
  popis,
  aktivni,
  onClick,
}: {
  children: React.ReactNode;
  popis: string;
  aktivni?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={popis}
      title={popis}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
        aktivni ? "bg-win-zvyrazneny" : "hover:bg-win-zvyrazneny"
      }`}
    >
      {children}
    </button>
  );
}

/** Čtyři tabulky – univerzální značka tlačítka Start, kreslená vlastní. */
function LogoStart() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <g fill="currentColor">
        <rect x="1" y="1" width="8" height="8" rx="1.2" />
        <rect x="11" y="1" width="8" height="8" rx="1.2" />
        <rect x="1" y="11" width="8" height="8" rx="1.2" />
        <rect x="11" y="11" width="8" height="8" rx="1.2" />
      </g>
    </svg>
  );
}

/* ───────────────────────── Rychlá nastavení ───────────────────────── */

/**
 * Zobrazení úkolů – přehled otevřených oken přes celou plochu.
 *
 * Klik na dlaždici okno vytáhne dopředu, klik mimo přehled zavře. Když není
 * otevřené nic, řekne to rovnou; prázdná obrazovka bez vysvětlení by vypadala
 * jako rozbité tlačítko.
 */
function PrehledOken({ zavri }: { zavri: () => void }) {
  const { stav, poslat } = useSystem();

  return (
    <div
      className="absolute inset-0 z-[460] flex items-center justify-center bg-black/45 p-10 backdrop-blur-sm"
      onClick={zavri}
      role="dialog"
      aria-label="Zobrazení úkolů"
    >
      {stav.okna.length === 0 ? (
        <p className="text-[15px] text-white/85">Žádná otevřená okna</p>
      ) : (
        <div className="flex max-w-4xl flex-wrap items-stretch justify-center gap-5">
          {stav.okna.map((o) => {
            const app = APLIKACE[o.app];
            return (
              <button
                key={o.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  poslat({ typ: "okno/zamer", id: o.id });
                  zavri();
                }}
                className="flex w-56 flex-col items-center gap-2 rounded-lg border border-white/25 bg-white/10 p-4 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                {/* `app.ikona` je jen klíč, ne prvek – kreslí ho komponenta Ikona.
                    Napoprvé jsem ho vypsal přímo a v dlaždici stálo „pruzkumnik". */}
                <Ikona klic={o.app} velikost={30} />
                <span className="w-full truncate text-[13px]">{o.titul || app.nazev}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Ikony, které se na hlavní panel nevešly – ve Windows je schová šipka.
 *
 * Není to výplň: každá položka vede tam, kam patří, takže kliknutí něco udělá.
 * Prázdný panel by byl stejná ozdoba jako mrtvá šipka, jen o patro níž.
 */
function SkryteIkony({ zavri }: { zavri: () => void }) {
  const { stav, spust } = useSystem();
  const obal = useRef<HTMLDivElement>(null);
  useVenkovniKlik(obal, zavri);

  const polozky = [
    {
      id: "zabezpeceni",
      nazev: "Zabezpečení systému Windows",
      // Oddíl „zabezpečení" v Nastavení není, a odkazovat naslepo by znamenalo
      // spadnout na Systém. Vede proto tam, kde se s hrozbou dá něco udělat.
      popis: stav.virusBezi ? "Zjištěna hrozba – zkontroluj procesy" : "Zkontrolovat běžící procesy",
      ikona: <ShieldCheck className="h-5 w-5" />,
      akce: () => spust("spravce-uloh"),
    },
    {
      id: "aktualizace",
      nazev: "Windows Update",
      popis: stav.nastaveni.aktualizace ? "Systém je aktuální" : "K dispozici jsou aktualizace",
      ikona: <RefreshCw className="h-5 w-5" />,
      akce: () => spust("nastaveni", "update"),
    },
    {
      id: "uloziste",
      nazev: "Místní disk (C:)",
      popis: "Otevřít v Průzkumníku",
      ikona: <HardDrive className="h-5 w-5" />,
      akce: () => spust("pruzkumnik", "C:"),
    },
  ];

  return (
    <div
      ref={obal}
      role="dialog"
      aria-label="Skryté ikony"
      className="win-stin-nabidka absolute bottom-14 right-3 z-50 w-72 rounded-lg border border-win-linka bg-win-panel p-1.5"
    >
      {polozky.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            p.akce();
            zavri();
          }}
          className="flex w-full items-center gap-3 rounded px-2.5 py-2 text-left hover:bg-win-zvyrazneny"
        >
          <span className="text-win-akcent">{p.ikona}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px]">{p.nazev}</span>
            <span className="block truncate text-[11.5px] text-win-slaby">{p.popis}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function RychlaNastaveni({ zavri }: { zavri: () => void }) {
  const { stav, poslat, spust } = useSystem();
  const n = stav.nastaveni;
  const obal = useRef<HTMLDivElement>(null);
  useVenkovniKlik(obal, zavri);

  const zmen = (zmena: Partial<typeof n>) => poslat({ typ: "nastaveni/zmen", zmena });

  const dlazdice = [
    {
      id: "wifi",
      nazev: n.wifi ? "SPST-ZACI" : "Wi-Fi",
      zapnuto: n.wifi && !n.rezimVLetadle,
      ikona: <Wifi className="h-5 w-5" />,
      akce: () => zmen({ wifi: !n.wifi, rezimVLetadle: false }),
    },
    {
      id: "bt",
      nazev: "Bluetooth",
      zapnuto: n.bluetooth,
      ikona: <Bluetooth className="h-5 w-5" />,
      akce: () => zmen({ bluetooth: !n.bluetooth }),
    },
    {
      id: "letadlo",
      nazev: "Režim v letadle",
      zapnuto: n.rezimVLetadle,
      ikona: <Plane className="h-5 w-5" />,
      akce: () => zmen({ rezimVLetadle: !n.rezimVLetadle, wifi: n.rezimVLetadle }),
    },
    {
      id: "noc",
      nazev: "Noční osvětlení",
      zapnuto: n.nocniRezim,
      ikona: <Moon className="h-5 w-5" />,
      akce: () => zmen({ nocniRezim: !n.nocniRezim }),
    },
    {
      id: "motiv",
      nazev: n.motiv === "tmavy" ? "Tmavý režim" : "Světlý režim",
      zapnuto: n.motiv === "tmavy",
      ikona: n.motiv === "tmavy" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />,
      akce: () => zmen({ motiv: n.motiv === "tmavy" ? "svetly" : "tmavy" }),
    },
    {
      id: "pristupnost",
      nazev: "Usnadnění",
      zapnuto: false,
      ikona: <LayoutGrid className="h-5 w-5" />,
      akce: () => {
        spust("nastaveni", "usnadneni");
        zavri();
      },
    },
  ];

  return (
    <div
      ref={obal}
      className="win-sklo win-vyjezd win-bezvyberu absolute bottom-[56px] right-2 z-[700] w-80 rounded-lg border border-win-linka p-4 text-win-text shadow-[var(--win-stin-nabidka)]"
    >
      <div className="grid grid-cols-3 gap-2">
        {dlazdice.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={d.akce}
            className={`flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-[11px] transition-colors ${
              d.zapnuto
                ? "border-transparent bg-win-akcent text-win-akcent-text"
                : "border-win-linka bg-win-povrch hover:bg-win-zvyrazneny"
            }`}
          >
            {d.ikona}
            <span className="line-clamp-1 px-1">{d.nazev}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <Sun className="h-4 w-4 shrink-0 text-win-slaby" />
          <Posuvnik hodnota={n.jas} onZmena={(h) => zmen({ jas: h })} popis="Jas" />
        </div>
        <div className="flex items-center gap-3">
          {n.hlasitost > 0 ? (
            <Volume2 className="h-4 w-4 shrink-0 text-win-slaby" />
          ) : (
            <VolumeX className="h-4 w-4 shrink-0 text-win-slaby" />
          )}
          <Posuvnik
            hodnota={n.hlasitost}
            onZmena={(h) => zmen({ hlasitost: h })}
            popis="Hlasitost"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end border-t border-win-linka pt-3">
        <button
          type="button"
          onClick={() => {
            spust("nastaveni");
            zavri();
          }}
          className="flex h-8 items-center gap-2 rounded px-2 text-[12px] hover:bg-win-zvyrazneny"
        >
          <Ikona klic="nastaveni" velikost={16} /> Všechna nastavení
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Oznámení a kalendář ───────────────────────── */

function PanelOznameni({ cas, zavri }: { cas: Date; zavri: () => void }) {
  const { stav } = useSystem();
  const obal = useRef<HTMLDivElement>(null);
  useVenkovniKlik(obal, zavri);

  const prvni = new Date(cas.getFullYear(), cas.getMonth(), 1);
  // Pondělí je první den týdne, jak je zvykem v Česku.
  const posun = (prvni.getDay() + 6) % 7;
  const dniVMesici = new Date(cas.getFullYear(), cas.getMonth() + 1, 0).getDate();
  const bunky = [
    ...Array.from({ length: posun }, () => null),
    ...Array.from({ length: dniVMesici }, (_, i) => i + 1),
  ];

  return (
    <div
      ref={obal}
      className="win-sklo win-vyjezd win-bezvyberu absolute bottom-[56px] right-2 z-[700] w-80 rounded-lg border border-win-linka p-4 text-win-text shadow-[var(--win-stin-nabidka)]"
    >
      <div className="mb-3 flex items-start gap-2">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-win-slaby" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">Žádná nová oznámení</p>
          <p className="text-[12px] text-win-slaby">
            {stav.kos.length > 0
              ? `V Koši máš ${stav.kos.length} položek. Vysypat ho můžeš z plochy.`
              : "Až něco přijde, objeví se to tady."}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-win-linka bg-win-povrch p-3">
        <div className="mb-1 text-[26px] font-light tabular-nums">{hodiny(cas)}</div>
        <div className="mb-3 text-[12px] text-win-slaby">{datumSlovy(cas)}</div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
          {["po", "út", "st", "čt", "pá", "so", "ne"].map((d) => (
            <div key={d} className="text-win-slaby">
              {d}
            </div>
          ))}
          {bunky.map((den, i) => (
            <div
              key={i}
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
                den === cas.getDate() ? "bg-win-akcent text-win-akcent-text" : ""
              }`}
            >
              {den ?? ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
