"use client";

/**
 * Správce úloh.
 *
 * Běžící aplikace jsou skutečné – jsou to okna, která má žák otevřená, a
 * „Ukončit úlohu" je opravdu zavře. Procesy na pozadí jsou vymyšlené, ale
 * chovají se rozumně: jejich zatížení kolísá kolem vlastní hodnoty, součet
 * sedí s grafem a nic neskáče o desítky procent mezi dvěma sekundami.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Cpu, HardDrive, Rocket, Wifi } from "lucide-react";
import { Ikona } from "../Ikona";
import { Prepinac, Tlacitko } from "../ui";
import { useOkno, useSystem } from "../system";
import { PROCES as PROCES_VIRU } from "@/lib/win/virus";
import { APLIKACE } from "@/lib/win/typy";
import { cislo, velikostText } from "@/lib/win/format";

type Zalozka = "procesy" | "vykon" | "spusteni";

interface Proces {
  id: string;
  nazev: string;
  /** Základ zatížení, kolem kterého hodnota kolísá. */
  cpu: number;
  pamet: number;
  disk: number;
  sit: number;
  systemovy: boolean;
  oknoId?: number;
}

const PROCESY_NA_POZADI: Omit<Proces, "id">[] = [
  { nazev: "Systém a paměť komprimovaná", cpu: 0.4, pamet: 118, disk: 0.2, sit: 0, systemovy: true },
  { nazev: "Hostitel služby: Místní systém", cpu: 0.3, pamet: 62, disk: 0.1, sit: 0, systemovy: true },
  { nazev: "Klientský server modulu runtime", cpu: 0.2, pamet: 8, disk: 0, sit: 0, systemovy: true },
  { nazev: "Zabezpečení systému Windows", cpu: 0.6, pamet: 94, disk: 0.3, sit: 0.1, systemovy: true },
  { nazev: "Antimalware Service Executable", cpu: 1.8, pamet: 214, disk: 1.4, sit: 0, systemovy: true },
  { nazev: "Zásady skupiny – klient", cpu: 0.1, pamet: 12, disk: 0, sit: 0, systemovy: true },
  { nazev: "Tiskový server", cpu: 0.1, pamet: 21, disk: 0, sit: 0, systemovy: true },
  { nazev: "Průzkumník Windows", cpu: 0.9, pamet: 156, disk: 0.4, sit: 0.2, systemovy: false },
];

const CELKEM_PAMET = 16 * 1024; // MB

export function SpravceUloh() {
  const { stav, poslat } = useSystem();
  const { nastavTitul } = useOkno();
  const [zalozka, nastavZalozku] = useState<Zalozka>("procesy");
  const [tik, nastavTik] = useState(0);
  const [vybrany, nastavVybrany] = useState<string | null>(null);
  const [poSpusteni, nastavPoSpusteni] = useState<Record<string, boolean>>({
    "Microsoft Edge": true,
    "Aplikace Nastavení": false,
    "Zálohování OneDrive": true,
    "Hlasový asistent": false,
  });

  useEffect(() => {
    nastavTitul("Správce úloh");
  }, [nastavTitul]);

  // Vzorkuje se jednou za sekundu, jako v předloze.
  useEffect(() => {
    const id = window.setInterval(() => nastavTik((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const aplikace: Proces[] = stav.okna.map((o) => ({
    id: `okno-${o.id}`,
    nazev: APLIKACE[o.app].nazev,
    cpu: o.app === "prohlizec" ? 3.2 : o.app === "malovani" ? 2.1 : 0.8,
    pamet: o.app === "prohlizec" ? 328 : o.app === "malovani" ? 142 : 58,
    disk: 0.3,
    sit: o.app === "prohlizec" ? 0.4 : 0,
    systemovy: false,
    oknoId: o.id,
  }));

  const naPozadi: Proces[] = PROCESY_NA_POZADI.map((p, i) => ({ ...p, id: `bg-${i}` }));

  /**
   * Cvičný škodlivý proces z hodiny o bezpečnosti. Schválně žere procesor
   * a schválně se jmenuje skoro jako systémový `svchost.exe` – rozdíl v jednom
   * písmenu je to, co má žák najít.
   */
  const skodlivy: Proces[] = stav.virusBezi
    ? [
        {
          id: "virus",
          nazev: PROCES_VIRU,
          cpu: 61.4,
          pamet: 402,
          disk: 8.7,
          sit: 2.3,
          systemovy: false,
        },
      ]
    : [];

  /** Kolísání kolem základu – deterministické podle tiku, ať to nepodivně skáče. */
  const kolisej = (zaklad: number, seminko: number) =>
    Math.max(0, zaklad * (0.75 + 0.5 * Math.abs(Math.sin(tik * 0.7 + seminko))));

  const vsechny = [...skodlivy, ...aplikace, ...naPozadi];
  const soucetCpu = vsechny.reduce((s, p, i) => s + kolisej(p.cpu, i), 0);
  const soucetPamet = vsechny.reduce((s, p) => s + p.pamet, 0) + 3800;
  const soucetDisk = vsechny.reduce((s, p, i) => s + kolisej(p.disk, i), 0);
  const soucetSit = vsechny.reduce((s, p, i) => s + kolisej(p.sit, i), 0);

  const ukonci = () => {
    const proces = vsechny.find((p) => p.id === vybrany);
    if (proces?.oknoId) poslat({ typ: "okno/zavri", id: proces.oknoId });
    // Ukončení cvičného škodlivého procesu zastaví jeho běh. Přejmenované
    // soubory zůstanou – uklidit po něm je druhá půlka lekce.
    if (proces?.id === "virus") poslat({ typ: "virus/zastav" });
    nastavVybrany(null);
  };

  const zalozky: { id: Zalozka; nazev: string; ikona: React.ReactNode }[] = [
    { id: "procesy", nazev: "Procesy", ikona: <Activity className="h-4 w-4" /> },
    { id: "vykon", nazev: "Výkon", ikona: <Cpu className="h-4 w-4" /> },
    { id: "spusteni", nazev: "Aplikace po spuštění", ikona: <Rocket className="h-4 w-4" /> },
  ];

  return (
    <div className="win-bezvyberu flex h-full bg-win-plocha text-[13px]">
      <nav aria-label="Oddíly" className="w-48 shrink-0 border-r border-win-linka p-2">
        {zalozky.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => nastavZalozku(z.id)}
            className={`mb-0.5 flex h-9 w-full items-center gap-2.5 rounded px-2 text-left ${
              zalozka === z.id ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
            }`}
          >
            {z.ikona}
            <span className="truncate">{z.nazev}</span>
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {zalozka === "procesy" && (
          <>
            <div className="flex h-11 shrink-0 items-center justify-between px-3">
              <h1 className="text-[15px] font-semibold">Procesy</h1>
              <Tlacitko
                // Ukončit jde okno aplikace a cvičný škodlivý proces. Systémové procesy
                // zůstávají zašedlé – ve skutečném Windows to taky není nic, co by se
                // mělo zkoušet.
                disabled={
                  !(() => {
                    const p = vsechny.find((x) => x.id === vybrany);
                    return Boolean(p?.oknoId) || p?.id === "virus";
                  })()
                }
                onClick={ukonci}
              >
                Ukončit úlohu
              </Tlacitko>
            </div>
            <div className="win-posuv min-h-0 flex-1 overflow-auto">
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-0 bg-win-plocha text-[12px] text-win-slaby">
                  <tr className="border-b border-win-linka">
                    <th className="w-[46%] px-3 py-1.5 text-left font-normal">Název</th>
                    <th className="px-2 py-1.5 text-right font-normal">
                      <div>{soucetCpu.toFixed(0)} %</div>
                      <div>Procesor</div>
                    </th>
                    <th className="px-2 py-1.5 text-right font-normal">
                      <div>{((soucetPamet / CELKEM_PAMET) * 100).toFixed(0)} %</div>
                      <div>Paměť</div>
                    </th>
                    <th className="px-2 py-1.5 text-right font-normal">
                      <div>{soucetDisk.toFixed(0)} %</div>
                      <div>Disk</div>
                    </th>
                    <th className="px-3 py-1.5 text-right font-normal">
                      <div>{soucetSit.toFixed(1)} Mb/s</div>
                      <div>Síť</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <SkupinaProcesu
                    nadpis="Aplikace"
                    procesy={aplikace}
                    vybrany={vybrany}
                    onVyber={nastavVybrany}
                    kolisej={kolisej}
                  />
                  <SkupinaProcesu
                    nadpis="Procesy na pozadí"
                    procesy={[...skodlivy, ...naPozadi]}
                    vybrany={vybrany}
                    onVyber={nastavVybrany}
                    kolisej={kolisej}
                  />
                </tbody>
              </table>
            </div>
          </>
        )}

        {zalozka === "vykon" && (
          <Vykon
            cpu={Math.min(100, soucetCpu)}
            pamet={soucetPamet}
            disk={Math.min(100, soucetDisk * 8)}
            sit={soucetSit}
            tik={tik}
          />
        )}

        {zalozka === "spusteni" && (
          <div className="win-posuv min-h-0 flex-1 overflow-auto p-3">
            <h1 className="mb-1 text-[15px] font-semibold">Aplikace po spuštění</h1>
            <p className="mb-4 text-[12px] text-win-slaby">
              Tyto aplikace se spouštějí samy při přihlášení. Čím jich je víc, tím déle
              trvá, než je počítač připravený.
            </p>
            {Object.entries(poSpusteni).map(([nazev, zapnuto]) => (
              <div
                key={nazev}
                className="mb-1.5 flex items-center justify-between rounded-md border border-win-linka bg-win-povrch px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate">{nazev}</div>
                  <div className="text-[12px] text-win-slaby">
                    Dopad na spuštění: {zapnuto ? "střední" : "žádný"}
                  </div>
                </div>
                <Prepinac
                  zapnuto={zapnuto}
                  popis={`Spouštět ${nazev} po přihlášení`}
                  onZmena={(h) => nastavPoSpusteni((s) => ({ ...s, [nazev]: h }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkupinaProcesu({
  nadpis,
  procesy,
  vybrany,
  onVyber,
  kolisej,
}: {
  nadpis: string;
  procesy: Proces[];
  vybrany: string | null;
  onVyber: (id: string) => void;
  kolisej: (zaklad: number, seminko: number) => number;
}) {
  if (procesy.length === 0) return null;
  return (
    <>
      <tr>
        <td colSpan={5} className="px-3 pb-1 pt-3 text-[12px] font-semibold text-win-slaby">
          {nadpis} ({procesy.length})
        </td>
      </tr>
      {procesy.map((p, i) => (
        <tr
          key={p.id}
          onClick={() => onVyber(p.id)}
          className={`cursor-default ${
            vybrany === p.id ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
          }`}
        >
          <td className="truncate px-3 py-1">
            <span className="flex items-center gap-2">
              <Ikona klic={p.systemovy ? "aplikace" : "pruzkumnik"} velikost={16} />
              <span className="truncate">{p.nazev}</span>
            </span>
          </td>
          <td className="px-2 py-1 text-right">{kolisej(p.cpu, i).toFixed(1)} %</td>
          <td className="px-2 py-1 text-right">{cislo(p.pamet)} MB</td>
          <td className="px-2 py-1 text-right">{kolisej(p.disk, i).toFixed(1)} MB/s</td>
          <td className="px-3 py-1 text-right">{kolisej(p.sit, i).toFixed(1)} Mb/s</td>
        </tr>
      ))}
    </>
  );
}

/* ───────────────────────── Výkon ───────────────────────── */

function Vykon({
  cpu,
  pamet,
  disk,
  sit,
  tik,
}: {
  cpu: number;
  pamet: number;
  disk: number;
  sit: number;
  tik: number;
}) {
  const [vybrany, nastavVybrany] = useState<"cpu" | "pamet" | "disk" | "sit">("cpu");
  const rady = useRef<Record<string, number[]>>({ cpu: [], pamet: [], disk: [], sit: [] });

  useEffect(() => {
    const zapis = (klic: string, hodnota: number) => {
      rady.current[klic] = [...rady.current[klic], hodnota].slice(-60);
    };
    zapis("cpu", cpu);
    zapis("pamet", (pamet / CELKEM_PAMET) * 100);
    zapis("disk", disk);
    zapis("sit", Math.min(100, sit * 10));
  }, [tik, cpu, pamet, disk, sit]);

  const karty = [
    { id: "cpu" as const, nazev: "Procesor", hodnota: `${cpu.toFixed(0)} %`, ikona: <Cpu className="h-4 w-4" /> },
    {
      id: "pamet" as const,
      nazev: "Paměť",
      hodnota: `${(pamet / 1024).toFixed(1)}/16,0 GB`,
      ikona: <Activity className="h-4 w-4" />,
    },
    { id: "disk" as const, nazev: "Disk 0 (C:)", hodnota: `${disk.toFixed(0)} %`, ikona: <HardDrive className="h-4 w-4" /> },
    { id: "sit" as const, nazev: "Ethernet", hodnota: `${sit.toFixed(1)} Mb/s`, ikona: <Wifi className="h-4 w-4" /> },
  ];

  const podrobnosti: Record<string, [string, string][]> = {
    cpu: [
      ["Základní frekvence", "2,50 GHz"],
      ["Jádra", "10"],
      ["Logické procesory", "16"],
      ["Doba běhu systému", `${Math.floor(tik / 60)}:${String(tik % 60).padStart(2, "0")}`],
      ["Virtualizace", "Povolena"],
    ],
    pamet: [
      ["Celkem", "16,0 GB"],
      ["Využito", `${(pamet / 1024).toFixed(1)} GB`],
      ["K dispozici", `${(16 - pamet / 1024).toFixed(1)} GB`],
      ["Rychlost", "3200 MT/s"],
      ["Sloty", "2 z 4 obsazené"],
    ],
    disk: [
      ["Typ", "SSD (NVMe)"],
      ["Kapacita", velikostText(255_000_000_000)],
      ["Doba odezvy", `${(disk / 20).toFixed(1)} ms`],
      ["Formátováno", "NTFS"],
    ],
    sit: [
      ["Typ adaptéru", "Ethernet"],
      ["IPv4", "10.20.3.147"],
      ["Odesláno", `${(sit * 0.3).toFixed(1)} Mb/s`],
      ["Přijato", `${(sit * 0.7).toFixed(1)} Mb/s`],
    ],
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="win-posuv w-56 shrink-0 overflow-auto border-r border-win-linka p-2">
        {karty.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => nastavVybrany(k.id)}
            className={`mb-1.5 flex w-full items-center gap-3 rounded-md p-2 text-left ${
              vybrany === k.id ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
            }`}
          >
            <Graf data={rady.current[k.id] ?? []} maly />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px]">{k.nazev}</span>
              <span className="block truncate text-[11px] text-win-slaby">{k.hodnota}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="win-posuv min-w-0 flex-1 overflow-auto p-4">
        <h1 className="text-[17px] font-semibold">
          {karty.find((k) => k.id === vybrany)?.nazev}
        </h1>
        <div className="mt-3 rounded-md border border-win-linka bg-win-povrch p-2">
          <Graf data={rady.current[vybrany] ?? []} />
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {podrobnosti[vybrany].map(([popis, hodnota]) => (
            <div key={popis} className="flex justify-between border-b border-win-linka/60 py-1">
              <dt className="text-win-slaby">{popis}</dt>
              <dd>{hodnota}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/** Průběh v čase. Poslední hodnota je vpravo, jako v předloze. */
function Graf({ data, maly = false }: { data: number[]; maly?: boolean }) {
  const sirka = 240;
  const vyska = maly ? 34 : 160;
  const body = useMemo(() => {
    if (data.length < 2) return "";
    const krok = sirka / 59;
    return data
      .map((h, i) => `${(i + (60 - data.length)) * krok},${vyska - (Math.min(100, h) / 100) * vyska}`)
      .join(" ");
  }, [data, vyska]);

  return (
    <svg
      viewBox={`0 0 ${sirka} ${vyska}`}
      className={maly ? "h-9 w-12 shrink-0" : "h-40 w-full"}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {!maly && (
        <g stroke="rgb(var(--win-linka))" strokeWidth="1">
          {[0.25, 0.5, 0.75].map((p) => (
            <line key={p} x1="0" y1={vyska * p} x2={sirka} y2={vyska * p} />
          ))}
        </g>
      )}
      {body && (
        <>
          <polygon
            points={`${body} ${sirka},${vyska} 0,${vyska}`}
            fill="rgb(var(--win-akcent))"
            opacity="0.22"
          />
          <polyline points={body} fill="none" stroke="rgb(var(--win-akcent))" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}
