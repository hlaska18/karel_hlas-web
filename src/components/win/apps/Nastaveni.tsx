"use client";

/**
 * Nastavení systému.
 *
 * Není to kulisa: každý přepínač tady opravdu něco mění – motiv, barvu,
 * tapetu, zarovnání hlavního panelu, zobrazování přípon. Kdyby polovina
 * voleb nic nedělala, žák by se přestal dívat, co se po jeho zásahu stalo,
 * a to je přesně ten návyk, který se má v hodině vypěstovat.
 */

import { useEffect, useMemo, useState } from "react";
import { nactiUcet, smazPostup, zapomenUcet } from "@/lib/postup/klient";
import {
  Accessibility,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  LayoutGrid,
  Monitor,
  Palette,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { Ikona } from "../Ikona";
import { Posuvnik, Prepinac, Rozbalovac, Tlacitko } from "../ui";
import { useOkno, useSystem } from "../system";
import { AKCENTY, barvaAkcentu } from "@/lib/win/akcenty";
import { TAPETY } from "@/lib/win/obrazky";
import { velikostText } from "@/lib/win/format";
import { datumSlovy, hodiny } from "@/lib/win/format";
import { KAPACITA_DISKU, OBSAZENO_SYSTEMEM } from "@/lib/win/nazvy";
import { velikost } from "@/lib/win/fs";
import { APLIKACE, type AppId } from "@/lib/win/typy";
import type { Nastaveni as TypNastaveni } from "@/lib/win/stav";

type Oddil =
  | "system"
  | "zarizeni"
  | "sit"
  | "prizpusobeni"
  | "aplikace"
  | "ucty"
  | "cas"
  | "usnadneni"
  | "update";

const ODDILY: { id: Oddil; nazev: string; ikona: React.ReactNode }[] = [
  { id: "system", nazev: "Systém", ikona: <Monitor className="h-4 w-4" /> },
  { id: "zarizeni", nazev: "Bluetooth a zařízení", ikona: <Bluetooth className="h-4 w-4" /> },
  { id: "sit", nazev: "Síť a internet", ikona: <Globe className="h-4 w-4" /> },
  { id: "prizpusobeni", nazev: "Přizpůsobení", ikona: <Palette className="h-4 w-4" /> },
  { id: "aplikace", nazev: "Aplikace", ikona: <LayoutGrid className="h-4 w-4" /> },
  { id: "ucty", nazev: "Účty", ikona: <User className="h-4 w-4" /> },
  { id: "cas", nazev: "Čas a jazyk", ikona: <Clock className="h-4 w-4" /> },
  { id: "usnadneni", nazev: "Usnadnění přístupu", ikona: <Accessibility className="h-4 w-4" /> },
  { id: "update", nazev: "Windows Update", ikona: <RefreshCw className="h-4 w-4" /> },
];

export function Nastaveni() {
  const { stav, poslat, stopa } = useSystem();
  const { arg, nastavTitul } = useOkno();
  const [oddil, nastavOddil] = useState<Oddil>(() => (arg as Oddil) ?? "system");
  const [podstranka, nastavPodstranku] = useState<string | null>(null);
  const [hledani, nastavHledani] = useState("");
  const n = stav.nastaveni;

  const zmen = (zmena: Partial<TypNastaveni>) => poslat({ typ: "nastaveni/zmen", zmena });

  useEffect(() => {
    if (arg && ODDILY.some((o) => o.id === arg)) {
      nastavOddil(arg as Oddil);
      nastavPodstranku(null);
    }
  }, [arg]);

  useEffect(() => {
    nastavTitul("Nastavení");
  }, [nastavTitul]);

  const nazevOddilu = ODDILY.find((o) => o.id === oddil)?.nazev ?? "";

  return (
    <div className="flex h-full bg-win-plocha text-[13px]">
      {/* Postranní nabídka */}
      <nav
        aria-label="Oddíly nastavení"
        className="win-posuv w-60 shrink-0 overflow-auto border-r border-win-linka p-2"
      >
        <div className="mb-3 flex items-center gap-3 rounded-md p-2">
          <Ikona klic="uzivatel" velikost={32} />
          <div className="min-w-0">
            <div className="truncate text-[13px]">{n.jmenoUctu}</div>
            <div className="truncate text-[11px] text-win-slaby">Místní účet</div>
          </div>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-win-slaby" />
          <input
            value={hledani}
            onChange={(e) => nastavHledani(e.target.value)}
            placeholder="Najít nastavení"
            aria-label="Najít nastavení"
            className="h-8 w-full rounded border border-win-linka bg-win-povrch pl-8 pr-2 text-[12px] outline-none focus:border-win-akcent"
          />
        </div>
        {ODDILY.filter((o) =>
          o.nazev.toLowerCase().includes(hledani.trim().toLowerCase()),
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              nastavOddil(o.id);
              nastavPodstranku(null);
            }}
            className={`mb-0.5 flex h-9 w-full items-center gap-3 rounded px-2 text-left ${
              oddil === o.id ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
            }`}
          >
            <span className={oddil === o.id ? "text-win-akcent" : "text-win-slaby"}>{o.ikona}</span>
            <span className="truncate">{o.nazev}</span>
          </button>
        ))}
      </nav>

      {/* Obsah */}
      <div className="win-posuv min-w-0 flex-1 overflow-auto px-8 py-6">
        <div className="mx-auto max-w-3xl">
          {podstranka ? (
            <button
              type="button"
              onClick={() => nastavPodstranku(null)}
              className="mb-2 flex items-center gap-1.5 rounded px-1 py-0.5 text-[12px] text-win-slaby hover:bg-win-zvyrazneny"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> {nazevOddilu}
            </button>
          ) : null}
          <h1 className="mb-5 text-[24px] font-semibold tracking-tight">
            {podstranka ?? nazevOddilu}
          </h1>

          {oddil === "system" && (
            <OddilSystem
              n={n}
              zmen={zmen}
              podstranka={podstranka}
              naPodstranku={nastavPodstranku}
              obsazeno={OBSAZENO_SYSTEMEM + velikost(stav.disk)}
              onInformace={() => stopa("nastaveni:o-systemu")}
            />
          )}
          {oddil === "zarizeni" && <OddilZarizeni n={n} zmen={zmen} />}
          {oddil === "sit" && <OddilSit n={n} zmen={zmen} />}
          {oddil === "prizpusobeni" && (
            <OddilPrizpusobeni
              n={n}
              zmen={zmen}
              podstranka={podstranka}
              naPodstranku={nastavPodstranku}
            />
          )}
          {oddil === "aplikace" && <OddilAplikace />}
          {oddil === "ucty" && <OddilUcty n={n} zmen={zmen} />}
          {oddil === "cas" && <OddilCas />}
          {oddil === "usnadneni" && <OddilUsnadneni n={n} zmen={zmen} />}
          {oddil === "update" && (
            <OddilUpdate hotovo={n.aktualizace} onHotovo={() => zmen({ aktualizace: true })} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── stavební kameny ───────────────────────── */

function Karta({
  nadpis,
  popis,
  ikona,
  ovladac,
  children,
  onClick,
}: {
  nadpis: string;
  popis?: string;
  ikona?: React.ReactNode;
  ovladac?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const obsah = (
    <>
      <div className="flex items-center gap-4 px-4 py-3">
        {ikona && <span className="shrink-0 text-win-slaby">{ikona}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate">{nadpis}</div>
          {popis && <div className="truncate text-[12px] text-win-slaby">{popis}</div>}
        </div>
        {ovladac}
        {onClick && <ChevronRight className="h-4 w-4 shrink-0 text-win-slaby" />}
      </div>
      {children && <div className="border-t border-win-linka px-4 py-3">{children}</div>}
    </>
  );

  const trida = "mb-2 w-full rounded-md border border-win-linka bg-win-povrch text-left";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${trida} hover:bg-win-zvyrazneny`}>
      {obsah}
    </button>
  ) : (
    <div className={trida}>{obsah}</div>
  );
}

function Podnadpis({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 text-[15px] font-semibold">{children}</h2>;
}

/* ───────────────────────── Systém ───────────────────────── */

function OddilSystem({
  n,
  zmen,
  podstranka,
  naPodstranku,
  obsazeno,
  onInformace,
}: {
  n: TypNastaveni;
  zmen: (z: Partial<TypNastaveni>) => void;
  podstranka: string | null;
  naPodstranku: (s: string | null) => void;
  obsazeno: number;
  onInformace: () => void;
}) {
  useEffect(() => {
    if (podstranka === "Informace") onInformace();
  }, [podstranka, onInformace]);

  if (podstranka === "Informace") {
    const udaje: [string, string][] = [
      ["Název zařízení", "SPST-UCEBNA-14"],
      ["Procesor", "Intel(R) Core(TM) i5-13400  2.50 GHz"],
      ["Nainstalovaná paměť RAM", "16,0 GB (využitelné: 15,7 GB)"],
      ["ID zařízení", "8F2C41A9-77B0-4E13-9D5A-2C0146BB3E71"],
      ["Typ systému", "64bitový operační systém, procesor x64"],
      ["Pero a dotykové ovládání", "Pro tento displej není k dispozici zadávání perem ani dotykem"],
      ["Edice", "Windows 11 Education"],
      ["Verze", "24H2"],
      ["Sestavení operačního systému", "26100.2033"],
    ];
    return (
      <div className="rounded-md border border-win-linka bg-win-povrch">
        {udaje.map(([popis, hodnota], i) => (
          <div
            key={popis}
            className={`flex flex-wrap gap-2 px-4 py-2.5 ${i > 0 ? "border-t border-win-linka" : ""}`}
          >
            <div className="w-64 shrink-0 text-win-slaby">{popis}</div>
            <div className="min-w-0 flex-1">{hodnota}</div>
          </div>
        ))}
      </div>
    );
  }

  const volne = Math.max(0, KAPACITA_DISKU - obsazeno);
  const podil = (obsazeno / KAPACITA_DISKU) * 100;

  return (
    <>
      <Karta nadpis="Obrazovka" popis="Jas, rozlišení, noční osvětlení">
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between">
              <span>Jas</span>
              <span className="text-win-slaby">{n.jas} %</span>
            </div>
            <Posuvnik hodnota={n.jas} onZmena={(h) => zmen({ jas: h })} popis="Jas obrazovky" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div>Noční osvětlení</div>
              <div className="text-[12px] text-win-slaby">Potlačí modrou složku světla</div>
            </div>
            <Prepinac
              zapnuto={n.nocniRezim}
              popis="Noční osvětlení"
              onZmena={(h) => zmen({ nocniRezim: h })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Rozlišení obrazovky</span>
            <Rozbalovac
              hodnota={n.rozliseni}
              popis="Rozlišení obrazovky"
              moznosti={[
                { id: "1920", nazev: "1920 × 1080 (doporučeno)" },
                { id: "1600", nazev: "1600 × 900" },
                { id: "1280", nazev: "1280 × 720" },
              ]}
              onZmena={(id) => zmen({ rozliseni: id as typeof n.rozliseni })}
            />
          </div>
        </div>
      </Karta>

      <Karta nadpis="Zvuk" popis="Hlasitost, výstupní zařízení">
        <div className="mb-1 flex justify-between">
          <span>Hlasitost</span>
          <span className="text-win-slaby">{n.hlasitost} %</span>
        </div>
        <Posuvnik
          hodnota={n.hlasitost}
          onZmena={(h) => zmen({ hlasitost: h })}
          popis="Hlasitost systému"
        />
      </Karta>

      <Karta nadpis="Úložiště" popis="Místní disk (C:)">
        <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-win-linka">
          <div
            className="h-full rounded-full bg-win-akcent"
            style={{ width: `${Math.min(100, podil)}%` }}
          />
        </div>
        <div className="text-[12px] text-win-slaby">
          Obsazeno {velikostText(obsazeno)} z {velikostText(KAPACITA_DISKU)} · volných{" "}
          {velikostText(volne)}
        </div>
      </Karta>

      <Karta
        nadpis="Informace"
        popis="Název zařízení, procesor, paměť, verze Windows"
        onClick={() => naPodstranku("Informace")}
      />
    </>
  );
}

/* ───────────────────────── Ostatní oddíly ───────────────────────── */

function OddilZarizeni({
  n,
  zmen,
}: {
  n: TypNastaveni;
  zmen: (z: Partial<TypNastaveni>) => void;
}) {
  return (
    <>
      <Karta
        nadpis="Bluetooth"
        popis={n.bluetooth ? "Zapnuto – zařízení je viditelné" : "Vypnuto"}
        ikona={<Bluetooth className="h-5 w-5" />}
        ovladac={
          <Prepinac zapnuto={n.bluetooth} popis="Bluetooth" onZmena={(h) => zmen({ bluetooth: h })} />
        }
      />
      <Podnadpis>Zařízení</Podnadpis>
      {[
        ["Klávesnice", "Standardní klávesnice PS/2"],
        ["Myš", "Optická myš USB"],
        ["Monitor", "Obecný monitor PnP (1920 × 1080)"],
        ["Tiskárna", "Učebna 14 – síťová tiskárna (offline)"],
      ].map(([nazev, popis]) => (
        <Karta key={nazev} nadpis={nazev} popis={popis} />
      ))}
    </>
  );
}

function OddilSit({ n, zmen }: { n: TypNastaveni; zmen: (z: Partial<TypNastaveni>) => void }) {
  return (
    <>
      <Karta
        nadpis="Wi-Fi"
        popis={n.wifi ? "Připojeno k síti SPST-ZACI" : "Vypnuto"}
        ikona={<Globe className="h-5 w-5" />}
        ovladac={<Prepinac zapnuto={n.wifi} popis="Wi-Fi" onZmena={(h) => zmen({ wifi: h })} />}
      />
      <Karta
        nadpis="Režim v letadle"
        popis="Vypne všechna bezdrátová připojení najednou"
        ovladac={
          <Prepinac
            zapnuto={n.rezimVLetadle}
            popis="Režim v letadle"
            onZmena={(h) => zmen({ rezimVLetadle: h, wifi: h ? false : n.wifi })}
          />
        }
      />
      <Podnadpis>Vlastnosti sítě</Podnadpis>
      <div className="rounded-md border border-win-linka bg-win-povrch">
        {[
          ["Typ připojení", "Ethernet"],
          ["Adresa IPv4", "10.20.3.147"],
          ["Maska podsítě", "255.255.255.0"],
          ["Výchozí brána", "10.20.3.1"],
          ["Servery DNS", "10.20.0.5, 10.20.0.6"],
          ["Fyzická adresa (MAC)", "B4-2E-99-1C-73-0A"],
        ].map(([popis, hodnota], i) => (
          <div
            key={popis}
            className={`flex flex-wrap gap-2 px-4 py-2.5 ${i > 0 ? "border-t border-win-linka" : ""}`}
          >
            <div className="w-56 shrink-0 text-win-slaby">{popis}</div>
            <div>{hodnota}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-win-slaby">
        Tytéž údaje vypíše v Terminálu příkaz <code>ipconfig</code>.
      </p>
    </>
  );
}

function OddilPrizpusobeni({
  n,
  zmen,
  podstranka,
  naPodstranku,
}: {
  n: TypNastaveni;
  zmen: (z: Partial<TypNastaveni>) => void;
  podstranka: string | null;
  naPodstranku: (s: string | null) => void;
}) {
  if (podstranka === "Pozadí") {
    return (
      <>
        <div className="mb-5 overflow-hidden rounded-lg border border-win-linka">
          <img
            src={TAPETY.find((t) => t.id === n.tapeta)?.url}
            alt="Náhled plochy"
            className="aspect-video w-full object-cover"
          />
        </div>
        <Podnadpis>Naposledy použité obrázky</Podnadpis>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TAPETY.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => zmen({ tapeta: t.id })}
              className={`overflow-hidden rounded-md border-2 ${
                n.tapeta === t.id ? "border-win-akcent" : "border-transparent hover:border-win-linka"
              }`}
            >
              <img src={t.url} alt={t.nazev} className="aspect-video w-full object-cover" />
              <div className="bg-win-povrch px-2 py-1 text-left text-[12px]">{t.nazev}</div>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (podstranka === "Barvy") {
    return (
      <>
        <Karta nadpis="Zvolte režim" popis="Světlý nebo tmavý vzhled celého systému">
          <div className="flex gap-3">
            {(
              [
                ["svetly", "Světlý"],
                ["tmavy", "Tmavý"],
              ] as const
            ).map(([id, popis]) => (
              <button
                key={id}
                type="button"
                onClick={() => zmen({ motiv: id })}
                className={`flex-1 overflow-hidden rounded-md border-2 p-2 text-left ${
                  n.motiv === id ? "border-win-akcent" : "border-win-linka hover:bg-win-zvyrazneny"
                }`}
              >
                <div
                  className="mb-2 flex aspect-video items-end justify-center rounded p-2"
                  style={{ backgroundColor: id === "svetly" ? "#f3f3f3" : "#202020" }}
                >
                  <div
                    className="h-3 w-2/3 rounded-full"
                    style={{ backgroundColor: id === "svetly" ? "#d6d6d6" : "#3d3d3d" }}
                  />
                </div>
                <span className="text-[12px]">{popis}</span>
              </button>
            ))}
          </div>
        </Karta>

        <Karta
          nadpis="Efekty průhlednosti"
          popis="Průsvitná okna a hlavní panel"
          ovladac={
            <Prepinac
              zapnuto={n.efektyPruhlednosti}
              popis="Efekty průhlednosti"
              onZmena={(h) => zmen({ efektyPruhlednosti: h })}
            />
          }
        />

        <Karta nadpis="Zvýrazňovací barva" popis="Barva tlačítek, označení a hlavního panelu">
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
            {AKCENTY.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-label={a.nazev}
                title={a.nazev}
                onClick={() => zmen({ akcent: a.id })}
                className={`aspect-square rounded ${
                  n.akcent === a.id ? "ring-2 ring-win-text ring-offset-2 ring-offset-win-povrch" : ""
                }`}
                style={{ backgroundColor: barvaAkcentu(a, n.motiv === "tmavy") }}
              />
            ))}
          </div>
        </Karta>
      </>
    );
  }

  if (podstranka === "Hlavní panel") {
    return (
      <>
        <Karta nadpis="Chování hlavního panelu">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div>Zarovnání hlavního panelu</div>
                <div className="text-[12px] text-win-slaby">
                  Vlevo je to, jak vypadal panel do Windows 10.
                </div>
              </div>
              <Rozbalovac
                hodnota={n.zarovnaniPanelu}
                popis="Zarovnání hlavního panelu"
                sirka="w-40"
                moznosti={[
                  { id: "stred", nazev: "Na střed" },
                  { id: "vlevo", nazev: "Vlevo" },
                ]}
                onZmena={(h) => zmen({ zarovnaniPanelu: h })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>Animace v systému</div>
              <Prepinac
                zapnuto={n.animace}
                popis="Animace v systému"
                onZmena={(h) => zmen({ animace: h })}
              />
            </div>
          </div>
        </Karta>
      </>
    );
  }

  return (
    <>
      <div className="mb-5 overflow-hidden rounded-lg border border-win-linka">
        <img
          src={TAPETY.find((t) => t.id === n.tapeta)?.url}
          alt="Náhled plochy"
          className="aspect-[21/9] w-full object-cover"
        />
      </div>
      <Karta
        nadpis="Pozadí"
        popis="Obrázek na ploše"
        ikona={<Palette className="h-5 w-5" />}
        onClick={() => naPodstranku("Pozadí")}
      />
      <Karta
        nadpis="Barvy"
        popis={`Režim ${n.motiv === "tmavy" ? "tmavý" : "světlý"}, zvýrazňovací barva`}
        ikona={<Palette className="h-5 w-5" />}
        onClick={() => naPodstranku("Barvy")}
      />
      <Karta
        nadpis="Hlavní panel"
        popis="Zarovnání a chování panelu"
        ikona={<LayoutGrid className="h-5 w-5" />}
        onClick={() => naPodstranku("Hlavní panel")}
      />
    </>
  );
}

function OddilAplikace() {
  const seznam = Object.entries(APLIKACE) as [AppId, (typeof APLIKACE)[AppId]][];
  return (
    <>
      <Podnadpis>Nainstalované aplikace</Podnadpis>
      {seznam.map(([id, a]) => (
        <Karta
          key={id}
          nadpis={a.nazev}
          popis={a.popis}
          ikona={<Ikona klic={id} velikost={28} />}
          ovladac={<span className="text-[12px] text-win-slaby">Součást systému</span>}
        />
      ))}
      <p className="mt-3 text-[12px] text-win-slaby">
        Ve výukovém prostředí se nedají instalovat další programy. Na školním
        počítači to zpravidla také nejde – instalace vyžaduje účet správce.
      </p>
    </>
  );
}

function OddilUcty({ n, zmen }: { n: TypNastaveni; zmen: (z: Partial<TypNastaveni>) => void }) {
  const [jmeno, nastavJmeno] = useState(n.jmenoUctu);
  /** Přezdívka účtu, ke kterému se ukládá postup; `null` = nepřihlášený. */
  const [ucet, nastavUcet] = useState<string | null>(null);
  const [mazani, nastavMazani] = useState<"maze" | "hotovo" | "chyba" | null>(null);

  // Čte se až v prohlížeči – na serveru žádná relace není.
  useEffect(() => nastavUcet(nactiUcet()), []);

  const smaz = async () => {
    nastavMazani("maze");
    const povedlo = await smazPostup();
    if (povedlo) {
      // Účet je pryč i pro tuhle kartu: dál je co mazat až po novém přihlášení.
      zapomenUcet();
      nastavUcet(null);
    }
    nastavMazani(povedlo ? "hotovo" : "chyba");
  };

  return (
    <>
      <div className="mb-5 flex items-center gap-4 rounded-md border border-win-linka bg-win-povrch p-4">
        <Ikona klic="uzivatel" velikost={56} />
        <div>
          <div className="text-[16px] font-semibold">{n.jmenoUctu}</div>
          <div className="text-[12px] text-win-slaby">Místní účet · Správce</div>
        </div>
      </div>
      <Karta nadpis="Zobrazované jméno" popis="Jak se účet ukazuje na přihlašovací obrazovce">
        <div className="flex gap-2">
          <input
            value={jmeno}
            onChange={(e) => nastavJmeno(e.target.value)}
            aria-label="Zobrazované jméno"
            className="h-8 flex-1 rounded border border-win-linka bg-win-povrch px-3 text-[13px] outline-none focus:border-win-akcent"
          />
          <Tlacitko
            vzhled="akcent"
            disabled={!jmeno.trim() || jmeno === n.jmenoUctu}
            onClick={() => zmen({ jmenoUctu: jmeno.trim() })}
          >
            Uložit
          </Tlacitko>
        </div>
      </Karta>
      <Karta
        nadpis="Možnosti přihlášení"
        popis="V učebně se přihlašuje kódem od vyučujícího"
        ikona={<ShieldCheck className="h-5 w-5" />}
      />
      {/* Ukazuje se jen přihlášenému. Kdo účet nemá, nemá co mazat – a nabízet
          mu tlačítko, které nic neudělá, by bylo horší než ho neukázat. */}
      {ucet && (
        <Karta
          nadpis="Uložený postup"
          popis={`Splněné úlohy se ukládají k přezdívce \u201e${ucet}\u201c a načtou se ti i na jiném počítači.`}
        >
          <div className="flex items-center gap-3">
            <Tlacitko disabled={mazani !== null} onClick={smaz}>
              {mazani === "maze" ? "Mažu…" : "Smazat můj postup"}
            </Tlacitko>
            {mazani === "hotovo" && (
              <span className="text-[12px] text-win-slaby">
                Smazáno. Splněné úlohy zůstávají zaškrtnuté jen v tomhle počítači.
              </span>
            )}
            {mazani === "chyba" && (
              <span className="text-[12px] text-win-slaby">Nepovedlo se – zkus to za chvíli.</span>
            )}
          </div>
        </Karta>
      )}
    </>
  );
}

function OddilCas() {
  const [ted, nastavTed] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => nastavTed(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <>
      <Karta nadpis="Datum a čas" popis="Nastavuje se automaticky ze sítě">
        <div className="text-[28px] font-light tabular-nums">{hodiny(ted)}</div>
        <div className="text-[12px] text-win-slaby">{datumSlovy(ted)}</div>
      </Karta>
      <Karta nadpis="Časové pásmo" popis="(UTC+01:00) Praha, Bratislava, Budapešť" />
      <Karta nadpis="Jazyk zobrazení systému" popis="Čeština (Česko)" />
      <Karta nadpis="Rozložení klávesnice" popis="Čeština (QWERTZ)" />
    </>
  );
}

function OddilUsnadneni({
  n,
  zmen,
}: {
  n: TypNastaveni;
  zmen: (z: Partial<TypNastaveni>) => void;
}) {
  return (
    <>
      <Karta
        nadpis="Efekty animace"
        popis="Vypnutí pomůže na slabším počítači i při nevolnosti z pohybu"
        ovladac={
          <Prepinac zapnuto={n.animace} popis="Efekty animace" onZmena={(h) => zmen({ animace: h })} />
        }
      />
      <Karta
        nadpis="Efekty průhlednosti"
        ovladac={
          <Prepinac
            zapnuto={n.efektyPruhlednosti}
            popis="Efekty průhlednosti"
            onZmena={(h) => zmen({ efektyPruhlednosti: h })}
          />
        }
      />
      <Karta nadpis="Velikost textu" popis="Ve výukovém prostředí je pevná (100 %)" />
    </>
  );
}

function OddilUpdate({ hotovo, onHotovo }: { hotovo: boolean; onHotovo: () => void }) {
  const [stav, nastavStav] = useState<"klid" | "hleda" | "stahuje" | "hotovo">(
    hotovo ? "hotovo" : "klid",
  );
  const [postup, nastavPostup] = useState(0);

  useEffect(() => {
    if (stav !== "hleda" && stav !== "stahuje") return;
    const id = window.setInterval(() => {
      nastavPostup((p) => {
        const dalsi = p + (stav === "hleda" ? 12 : 7);
        if (dalsi >= 100) {
          if (stav === "hleda") {
            nastavStav("stahuje");
            return 0;
          }
          nastavStav("hotovo");
          onHotovo();
          return 100;
        }
        return dalsi;
      });
    }, 180);
    return () => window.clearInterval(id);
  }, [stav, onHotovo]);

  return (
    <>
      <div className="mb-4 flex items-center gap-4 rounded-md border border-win-linka bg-win-povrch p-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: stav === "hotovo" ? "#107c41" : "rgb(var(--win-akcent))" }}
        >
          <RefreshCw className={`h-5 w-5 ${stav === "hleda" || stav === "stahuje" ? "animate-spin" : ""}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">
            {stav === "klid" && "Je vhodné zkontrolovat aktualizace"}
            {stav === "hleda" && "Vyhledávají se aktualizace…"}
            {stav === "stahuje" && "Stahuje se aktualizace zabezpečení"}
            {stav === "hotovo" && "Systém je aktuální"}
          </div>
          <div className="text-[12px] text-win-slaby">
            {stav === "hotovo"
              ? `Poslední kontrola: dnes v ${hodiny(new Date())}`
              : "Poslední kontrola: před 12 dny"}
          </div>
        </div>
        {stav === "klid" && (
          <Tlacitko vzhled="akcent" onClick={() => nastavStav("hleda")}>
            Vyhledat aktualizace
          </Tlacitko>
        )}
      </div>

      {(stav === "hleda" || stav === "stahuje") && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-win-linka">
          <div
            className="h-full rounded-full bg-win-akcent transition-all"
            style={{ width: `${postup}%` }}
          />
        </div>
      )}

      <Podnadpis>Historie aktualizací</Podnadpis>
      <div className="rounded-md border border-win-linka bg-win-povrch">
        {[
          stav === "hotovo"
            ? ["Kumulativní aktualizace pro Windows 11 (KB5049982)", "Nainstalováno dnes"]
            : null,
          ["Aktualizace definic programu Microsoft Defender (KB2267602)", "Nainstalováno před 3 dny"],
          ["Aktualizace zásobníku údržby (KB5048602)", "Nainstalováno před 18 dny"],
        ]
          .filter((r): r is [string, string] => r !== null)
          .map(([nazev, kdy], i) => (
            <div key={nazev} className={`px-4 py-2.5 ${i > 0 ? "border-t border-win-linka" : ""}`}>
              <div className="truncate">{nazev}</div>
              <div className="text-[12px] text-win-slaby">{kdy}</div>
            </div>
          ))}
      </div>
    </>
  );
}
