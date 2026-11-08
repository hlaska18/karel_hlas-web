"use client";

/**
 * Router zezadu: kabely na stole, porty, kontrolky, štítek.
 *
 * Do portu se dá zastrčit i špatný kabel (kromě konektorů, které se fyzicky
 * nevejdou). Pozná se to na kontrolkách, ne z návodu. Port WAN je napsaný jen
 * na routeru, zadání ho neprozrazuje.
 *
 * Od 8. 11. 2026 (Karel: „kabely jako kabely, ne políčka“) je to scéna:
 * kabel vede ze zdroje (zásuvka, datová zásuvka, počítač) ke konektoru a
 * konektor se přetáhne do portu. Klikání (konektor, pak port) zůstává pro
 * klávesnici a pro ty, komu přetahování nejde.
 */

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { STITEK, kontrolky, type Kabely, type SitStav } from "@/lib/win/sit";

export type Hlaska = { text: string; druh: "ok" | "tip" | "info" };

type KabelId = "posk" | "pc" | "adapter";
type PortId = "nap" | "wan" | 1 | 2 | 3 | 4;

/** Scéna má pevný poměr stran, souřadnice jsou v jednotkách viewBoxu. */
const SIRKA = 800;
const VYSKA = 440;
const ROUTER = { x: 50, y: 24, w: 700, h: 128 };
const PORT_Y = 76;
/** Kam se kreslí zastrčený konektor (těsně pod routerem). */
const ZASTRCENY_Y = ROUTER.y + ROUTER.h + 20;
/** Jak blízko portu se musí konektor pustit, aby se zastrčil. */
const DOSAH = 46;

type Bod = { x: number; y: number };

const KABELY: {
  id: KabelId;
  nazev: string;
  kratce: string;
  barva: string;
  /** Odkud kabel vede (pevný konec). */
  zdroj: Bod & { popis: string };
  /** Kde leží volný konec na stole. */
  klid: Bod;
}[] = [
  {
    id: "adapter",
    nazev: "Napájecí adaptér",
    kratce: "adaptér",
    barva: "#d7e6e0",
    zdroj: { x: 95, y: 396, popis: "zásuvka ve zdi" },
    klid: { x: 175, y: 300 },
  },
  {
    id: "posk",
    nazev: "Kabel od poskytovatele",
    kratce: "poskytovatel",
    barva: "#7cc4ff",
    zdroj: { x: 375, y: 396, popis: "datová zásuvka v bytě" },
    klid: { x: 410, y: 300 },
  },
  {
    id: "pc",
    nazev: "Síťový kabel k počítači",
    kratce: "počítač",
    barva: "#e5b73b",
    zdroj: { x: 690, y: 396, popis: "počítač na stole" },
    klid: { x: 625, y: 300 },
  },
];

const PORTY: { id: PortId; nazev: string; x: number }[] = [
  { id: "nap", nazev: "Napájení", x: 120 },
  { id: "wan", nazev: "WAN", x: 228 },
  { id: 1, nazev: "LAN 1", x: 340 },
  { id: 2, nazev: "LAN 2", x: 432 },
  { id: 3, nazev: "LAN 3", x: 524 },
  { id: 4, nazev: "LAN 4", x: 616 },
];
const WPS_X = 700;

/** Procenta pro absolutně umístěné tlačítko nad scénou. */
const pozice = (x: number, y: number, w: number, h: number) => ({
  left: `${((x - w / 2) / SIRKA) * 100}%`,
  top: `${((y - h / 2) / VYSKA) * 100}%`,
  width: `${(w / SIRKA) * 100}%`,
  height: `${(h / VYSKA) * 100}%`,
});

/** Prověšený kabel od zdroje ke spodku konektoru. */
const cestaKabelu = (od: Bod, k: Bod) => {
  // Čím blíž konektor u zdroje, tím menší oblouk, jinak se kabel na stole zatočí do háčku.
  const prohyb = Math.min(120, Math.max(24, (od.y - k.y) * 0.55));
  return `M ${od.x} ${od.y} C ${od.x} ${od.y - prohyb}, ${k.x} ${k.y + 18 + prohyb}, ${k.x} ${k.y + 18}`;
};

const nazevPortu = (id: PortId) => PORTY.find((p) => p.id === id)?.nazev ?? "";

/** Kam který kabel právě vede. */
function zapojeni(k: Kabely): Record<KabelId, PortId | null> {
  return {
    adapter: k.napajeni ? "nap" : null,
    posk: k.wan ? "wan" : (k.poskytovatelVLan ?? null) as PortId | null,
    pc: k.pocitacVeWan ? "wan" : (k.lan as PortId | null),
  };
}

function naKabely(z: Record<KabelId, PortId | null>): Kabely {
  return {
    napajeni: z.adapter === "nap",
    wan: z.posk === "wan",
    poskytovatelVLan: typeof z.posk === "number" ? z.posk : null,
    lan: typeof z.pc === "number" ? z.pc : null,
    pocitacVeWan: z.pc === "wan",
  };
}

/** Co říct po zapojení. Vychází z toho, co je vidět, opravu neprozrazuje. */
function vyhodnot(z: Record<KabelId, PortId | null>, kabel: KabelId, port: PortId): Hlaska {
  const nap = z.adapter === "nap";
  const wan = z.posk === "wan";
  const lan = typeof z.pc === "number";
  if (nap && wan && lan) {
    return { text: "Hotovo. Kabel od poskytovatele vede ven z domu, počítač je v domácí síti a router mezi nimi přebírá obálky. Svítí Napájení, Internet, Wi-Fi a jeden LAN.", druh: "ok" };
  }
  if (z.adapter && z.posk && z.pc) {
    return { text: "Všechno je zapojené, ale kontrolka Internet nesvítí. Router čeká internet na jiném portu než domácí zařízení. Zkus to přehodit.", druh: "tip" };
  }
  if (!nap) return { text: `Kabel je v portu ${nazevPortu(port)}, ale kontrolky nesvítí. Co routeru ještě chybí?`, druh: "info" };
  if (wan && kabel !== "pc") return { text: "Kontrolka Internet svítí, router má internet. Ještě počítač.", druh: "ok" };
  if (kabel === "adapter") return { text: "Router běží: svítí Napájení a Wi-Fi. Další kabel.", druh: "info" };
  return { text: `Zapojeno do portu ${nazevPortu(port)}. Podívej se na kontrolky: svítí, co má?`, druh: "info" };
}

export function RouterZezadu({
  sit,
  ukazPojem,
  onZmena,
  onHlaska,
}: {
  sit: SitStav;
  /** Karta „Nový pojem“ se ukáže až po správném zapojení. */
  ukazPojem: boolean;
  onZmena: (kabely: Kabely) => void;
  onHlaska: (h: Hlaska) => void;
}) {
  const [ruka, nastavRuku] = useState<KabelId | null>(null);
  /** Konektor, který se právě táhne myší. */
  const [tah, nastavTah] = useState<{ id: KabelId; bod: Bod; start: Bod; posun: boolean } | null>(null);
  const scena = useRef<HTMLDivElement>(null);
  const z = zapojeni(sit.kabely);
  const k = kontrolky(sit);

  const zapoj = (kabel: KabelId, port: PortId) => {
    if (port === "nap" && kabel !== "adapter") {
      onHlaska({ text: "Do kulaté zdířky se síťový konektor nevejde.", druh: "tip" });
      return;
    }
    if (port !== "nap" && kabel === "adapter") {
      onHlaska({ text: "Kulatý konektor adaptéru se do síťového portu nevejde.", druh: "tip" });
      return;
    }
    if (KABELY.some((c) => c.id !== kabel && z[c.id] === port)) {
      onHlaska({ text: `Port ${nazevPortu(port)} je obsazený. Vyber jiný, nebo kabel nejdřív vytáhni.`, druh: "tip" });
      return;
    }
    const nove = { ...z, [kabel]: port };
    onZmena(naKabely(nove));
    onHlaska(vyhodnot(nove, kabel, port));
    nastavRuku(null);
  };

  const klikPort = (port: PortId) => {
    if (!ruka) {
      onHlaska({ text: "Nejdřív vezmi konec kabelu: přetáhni ho sem, nebo na něj klikni.", druh: "info" });
      return;
    }
    zapoj(ruka, port);
  };

  const vytahni = (id: KabelId) => {
    const nazev = KABELY.find((c) => c.id === id)?.nazev ?? "";
    onZmena(naKabely({ ...z, [id]: null }));
    onHlaska({ text: `${nazev} je vytažený a leží na stole.`, druh: "info" });
    nastavRuku(null);
  };

  /** Ukazatel myši v souřadnicích scény. */
  const doSceny = (e: ReactPointerEvent): Bod => {
    const r = scena.current?.getBoundingClientRect();
    if (!r || !r.width) return { x: 0, y: 0 };
    return { x: ((e.clientX - r.left) / r.width) * SIRKA, y: ((e.clientY - r.top) / r.height) * VYSKA };
  };

  const blizkyPort = (b: Bod): PortId | "wps" | null => {
    let nej: { id: PortId | "wps"; d: number } | null = null;
    for (const p of [...PORTY, { id: "wps" as const, x: WPS_X }]) {
      const d = Math.hypot(b.x - p.x, b.y - PORT_Y);
      if (d < DOSAH && (!nej || d < nej.d)) nej = { id: p.id, d };
    }
    return nej?.id ?? null;
  };

  const zacniTah = (id: KabelId, e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const b = doSceny(e);
    nastavTah({ id, bod: b, start: b, posun: false });
  };

  const tahni = (e: ReactPointerEvent) => {
    if (!tah) return;
    const b = doSceny(e);
    nastavTah({ ...tah, bod: b, posun: tah.posun || Math.hypot(b.x - tah.start.x, b.y - tah.start.y) > 8 });
  };

  const pust = (e: ReactPointerEvent) => {
    if (!tah) return;
    const { id, posun } = tah;
    nastavTah(null);
    if (!posun) {
      // Kliknutí bez tahu: konektor do ruky (nebo z ruky).
      nastavRuku(ruka === id ? null : id);
      return;
    }
    const cil = blizkyPort(doSceny(e));
    if (cil === "wps") {
      onHlaska({ text: "WPS je tlačítko, ne port. Kabel se do něj nezapojuje.", druh: "tip" });
      return;
    }
    if (cil !== null) {
      if (z[id] !== cil) zapoj(id, cil);
      return;
    }
    if (z[id] !== null) vytahni(id);
  };

  /** Kde je konektor teď: v ruce myši, v portu, nebo na stole. */
  const konektor = (id: KabelId): Bod => {
    if (tah?.id === id && tah.posun) return tah.bod;
    const port = z[id];
    if (port !== null) return { x: PORTY.find((p) => p.id === port)!.x, y: ZASTRCENY_Y };
    return KABELY.find((c) => c.id === id)!.klid;
  };
  /** Port, nad kterým se konektor právě drží. */
  const nadPortem = tah?.posun ? blizkyPort(tah.bod) : null;
  /** Kabel v portu, který se zrovna vytahuje, port už nezabírá. */
  const vPortu = (port: PortId) => KABELY.find((c) => z[c.id] === port && !(tah?.id === c.id && tah.posun));
  const vRuce = KABELY.find((c) => c.id === ruka);

  const svetla: [string, boolean][] = [
    ["Napájení", k.napajeni],
    ["Internet", k.internet],
    ["Wi-Fi", k.wifi],
    ...[1, 2, 3, 4].map((n): [string, boolean] => [`LAN ${n}`, k.lan.includes(n)]),
  ];

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_300px] gap-4 overflow-y-auto p-4">
      <div className="flex min-w-0 flex-col gap-3">
        <section aria-label="Router zezadu a kabely na stole">
          <h2 className="mb-1 text-[14px] font-semibold">Router zezadu a kabely na stole</h2>
          <p className="mb-2.5 text-[13px] text-[#a6bdb4]">
            Přetáhni konec kabelu do portu. Vytáhneš ho tak, že ho přetáhneš zpátky na stůl. Jde to i klikáním: klikni na konec kabelu
            a pak na port.
          </p>
          <div
            ref={scena}
            className="relative w-full select-none overflow-hidden rounded-[14px] border border-white/[.14] bg-[#0f1a16]"
            style={{ aspectRatio: `${SIRKA} / ${VYSKA}` }}
          >
            <svg viewBox={`0 0 ${SIRKA} ${VYSKA}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
              {/* deska stolu */}
              <rect x="0" y={ROUTER.y + ROUTER.h + 46} width={SIRKA} height={VYSKA} fill="#14211c" />
              {/* tělo routeru */}
              <rect x={ROUTER.x} y={ROUTER.y} width={ROUTER.w} height={ROUTER.h} rx="16" fill="#18332b" stroke="rgba(255,255,255,.16)" />
              <text x={ROUTER.x + 16} y={ROUTER.y + 20} fontSize="12" fill="#a6bdb4">
                {STITEK.model}
              </text>
              {PORTY.map((p) => {
                const kdo = vPortu(p.id);
                const sviti = nadPortem === p.id || (ruka !== null && !tah);
                const fill = kdo ? kdo.barva : "#050807";
                const stroke = nadPortem === p.id ? "#6fe3c2" : sviti ? "#7fa297" : "rgba(255,255,255,.28)";
                return (
                  <g key={String(p.id)}>
                    {p.id === "nap" ? (
                      <circle cx={p.x} cy={PORT_Y} r="20" fill={fill} stroke={stroke} strokeWidth={nadPortem === p.id ? 3 : 1.5} />
                    ) : (
                      <>
                        <rect x={p.x - 28} y={PORT_Y - 21} width="56" height="42" rx="5" fill={fill} stroke={stroke} strokeWidth={nadPortem === p.id ? 3 : 1.5} />
                        {!kdo && <rect x={p.x - 9} y={PORT_Y + 13} width="18" height="7" fill="#18332b" />}
                      </>
                    )}
                    <text x={p.x} y={PORT_Y + 42} textAnchor="middle" fontSize="13" fontWeight="600" fill="#e8f3ef">
                      {p.nazev}
                    </text>
                  </g>
                );
              })}
              <circle cx={WPS_X} cy={PORT_Y} r="18" fill="#0d1714" stroke="rgba(255,255,255,.28)" />
              <text x={WPS_X} y={PORT_Y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#e8f3ef">
                WPS
              </text>
              <text x={WPS_X} y={PORT_Y + 42} textAnchor="middle" fontSize="12" fill="#a6bdb4">
                tlačítko
              </text>

              {/* zdroje kabelů */}
              {KABELY.map((c) => (
                <g key={`zdroj-${c.id}`}>
                  <rect x={c.zdroj.x - 24} y={c.zdroj.y - 6} width="48" height="22" rx="4" fill="#e8f3ef" opacity=".85" />
                  <text x={c.zdroj.x} y={c.zdroj.y + 32} textAnchor="middle" fontSize="13" fill="#c5d6cf">
                    {c.zdroj.popis}
                  </text>
                </g>
              ))}

              {/* kabely: tlustá čára s tmavým lemem a konektor na konci */}
              {KABELY.map((c) => {
                const b = konektor(c.id);
                const drzi = ruka === c.id || tah?.id === c.id;
                const d = cestaKabelu(c.zdroj, b);
                return (
                  <g key={`kabel-${c.id}`}>
                    <path d={d} fill="none" stroke="#050807" strokeWidth="10" strokeLinecap="round" />
                    <path d={d} fill="none" stroke={c.barva} strokeWidth="6" strokeLinecap="round" />
                    {c.id === "adapter" ? (
                      <rect x={b.x - 11} y={b.y - 18} width="22" height="36" rx="10" fill="#2b3a35" stroke={c.barva} strokeWidth="2.5" />
                    ) : (
                      <>
                        <rect x={b.x - 13} y={b.y - 18} width="26" height="36" rx="3" fill={c.barva} stroke="#050807" strokeWidth="1.5" />
                        <rect x={b.x - 8} y={b.y - 18} width="16" height="9" fill="rgba(255,255,255,.55)" />
                      </>
                    )}
                    {drzi && (
                      <rect x={b.x - 19} y={b.y - 24} width="38" height="48" rx="7" fill="none" stroke="#6fe3c2" strokeWidth="2.5" />
                    )}
                    {z[c.id] === null && !(tah?.id === c.id && tah.posun) && (
                      <text x={b.x + 22} y={b.y + 5} fontSize="13" fill={c.barva}>
                        {c.kratce}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Neviditelná tlačítka nad scénou: klávesnice a čtečky. */}
            {PORTY.map((p) => {
              const kdo = vPortu(p.id);
              return (
                <button
                  key={`port-${String(p.id)}`}
                  type="button"
                  aria-label={`Port ${p.nazev}, ${kdo ? `zapojený ${kdo.kratce}` : "volný"}`}
                  onClick={() => klikPort(p.id)}
                  style={pozice(p.x, PORT_Y, 64, 50)}
                  className="absolute rounded-md bg-transparent p-0"
                />
              );
            })}
            <button
              type="button"
              aria-label="Tlačítko WPS"
              onClick={() => onHlaska({ text: "WPS je tlačítko, ne port. Kabel se do něj nezapojuje.", druh: "tip" })}
              style={pozice(WPS_X, PORT_Y, 42, 42)}
              className="absolute rounded-full bg-transparent p-0"
            />
            {KABELY.map((c) => {
              const b = konektor(c.id);
              const port = z[c.id];
              return (
                <button
                  key={`konektor-${c.id}`}
                  type="button"
                  aria-pressed={ruka === c.id}
                  aria-label={`${c.nazev}, ${port !== null ? `v portu ${nazevPortu(port)}` : "leží na stole"}`}
                  onPointerDown={(e) => zacniTah(c.id, e)}
                  onPointerMove={tahni}
                  onPointerUp={pust}
                  onPointerCancel={() => nastavTah(null)}
                  onClick={(e) => {
                    // Myš to vyřídí přes pointer události, tady jen klávesnice.
                    if (e.detail === 0) nastavRuku(ruka === c.id ? null : c.id);
                  }}
                  style={{ ...pozice(b.x, b.y, 44, 52), touchAction: "none" }}
                  className={`absolute rounded-lg bg-transparent p-0 ${tah?.id === c.id ? "cursor-grabbing" : "cursor-grab"}`}
                />
              );
            })}
          </div>

          <div className="mt-2 flex min-h-9 flex-wrap items-center gap-2 text-[13px] text-[#c5d6cf]" aria-live="polite">
            {vRuce ? (
              <>
                <span>
                  V ruce: <b style={{ color: vRuce.barva }}>{vRuce.nazev}</b>. Klikni na port.
                </span>
                {z[vRuce.id] !== null && (
                  <button
                    type="button"
                    onClick={() => vytahni(vRuce.id)}
                    className="rounded-lg border border-white/[.14] bg-[#18332b] px-3 py-1.5 hover:bg-[#1f4136]"
                  >
                    Vytáhnout a položit na stůl
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => nastavRuku(null)}
                  className="rounded-lg border border-white/[.14] bg-[#18332b] px-3 py-1.5 hover:bg-[#1f4136]"
                >
                  Pustit z ruky
                </button>
              </>
            ) : (
              <span className="text-[#a6bdb4]">
                {KABELY.map((c) => `${c.kratce}: ${z[c.id] !== null ? nazevPortu(z[c.id]!) : "na stole"}`).join(" · ")}
              </span>
            )}
          </div>
        </section>

        {ukazPojem && (
          <section className="rounded-xl bg-[#122019] px-4 py-3 text-[14px] leading-[1.45] text-[#c5d6cf]">
            <strong className="text-[#e8f3ef]">Nový pojem: WAN a LAN.</strong> WAN je port, kterým router mluví s internetem.
            Porty LAN vedou k zařízením doma. Router stojí mezi těmi dvěma sítěmi a přebírá obálky jako třídírna na poště.
          </section>
        )}
      </div>

      <aside className="flex flex-col gap-3">
        <section aria-label="Kontrolky">
          <h2 className="mb-2.5 text-[14px] font-semibold">Kontrolky zepředu</h2>
          <div className="flex flex-col gap-[7px] text-[14px]">
            {svetla.map(([nazev, sviti]) => (
              <div key={nazev} className="flex items-center justify-between">
                <span className="flex items-center gap-[9px]">
                  <span className={`h-3 w-3 rounded-full border-2 ${sviti ? "border-[#6fe3c2] bg-[#6fe3c2]" : "border-[#7fa297] bg-transparent"}`} />
                  {nazev}
                </span>
                <span className={`text-[13px] ${sviti ? "text-[#6fe3c2]" : "text-[#a6bdb4]"}`}>{sviti ? "svítí" : "nesvítí"}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Štítek routeru" className="rounded-[10px] bg-[#e8f3ef] px-4 py-3 text-[13px] leading-normal text-[#0d1714]">
          <div className="mb-1.5 text-[14px] font-bold">{STITEK.model}</div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
            <dt className="text-[#35504a]">Správa</dt>
            <dd>{STITEK.sprava}</dd>
            <dt className="text-[#35504a]">Jméno</dt>
            <dd>{STITEK.uzivatel}</dd>
            <dt className="text-[#35504a]">Heslo</dt>
            <dd>{STITEK.adminHeslo}</dd>
            <dt className="text-[#35504a]">Wi-Fi</dt>
            <dd>{STITEK.wifiNazev}</dd>
            <dt className="text-[#35504a]">Heslo Wi-Fi</dt>
            <dd>{STITEK.wifiHeslo}</dd>
            <dt className="text-[#35504a]">MAC</dt>
            <dd>{STITEK.mac}</dd>
          </dl>
        </section>

        <p className="text-[12px] leading-normal text-[#a6bdb4]">Zjednodušeno. Skutečné routery se liší rozložením portů a popisky kontrolek.</p>
      </aside>
    </div>
  );
}
