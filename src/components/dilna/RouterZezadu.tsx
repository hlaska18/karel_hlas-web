"use client";

/**
 * Router zezadu: kabely na stole, porty, kontrolky, štítek.
 *
 * Do portu se dá zastrčit i špatný kabel (kromě konektorů, které se fyzicky
 * nevejdou). Pozná se to na kontrolkách, ne z návodu. Port WAN je napsaný jen
 * na routeru, zadání ho neprozrazuje.
 */

import { useState } from "react";
import { STITEK, kontrolky, type Kabely, type SitStav } from "@/lib/win/sit";

export type Hlaska = { text: string; druh: "ok" | "tip" | "info" };

type KabelId = "posk" | "pc" | "adapter";
type PortId = "nap" | "wan" | 1 | 2 | 3 | 4;

const KABELY: { id: KabelId; nazev: string; odkud: string; kratce: string; barva: string }[] = [
  { id: "posk", nazev: "Kabel od poskytovatele", odkud: "z datové zásuvky v bytě", kratce: "poskytovatel", barva: "#7cc4ff" },
  { id: "pc", nazev: "Síťový kabel k počítači", odkud: "od počítače na stole", kratce: "počítač", barva: "#e5b73b" },
  { id: "adapter", nazev: "Napájecí adaptér", odkud: "ze zásuvky ve zdi", kratce: "adaptér", barva: "#d7e6e0" },
];

const PORTY: { id: PortId; nazev: string }[] = [
  { id: "nap", nazev: "Napájení" },
  { id: "wan", nazev: "WAN" },
  { id: 1, nazev: "LAN 1" },
  { id: 2, nazev: "LAN 2" },
  { id: 3, nazev: "LAN 3" },
  { id: 4, nazev: "LAN 4" },
];

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
  const z = zapojeni(sit.kabely);
  const k = kontrolky(sit);

  const klikPort = (port: PortId) => {
    if (!ruka) {
      onHlaska({ text: "Nejdřív vyber kabel, který chceš zapojit.", druh: "info" });
      return;
    }
    if (port === "nap" && ruka !== "adapter") {
      onHlaska({ text: "Do kulaté zdířky se síťový konektor nevejde.", druh: "tip" });
      return;
    }
    if (port !== "nap" && ruka === "adapter") {
      onHlaska({ text: "Kulatý konektor adaptéru se do síťového portu nevejde.", druh: "tip" });
      return;
    }
    if (KABELY.some((c) => c.id !== ruka && z[c.id] === port)) {
      onHlaska({ text: `Port ${nazevPortu(port)} je obsazený. Vyber jiný, nebo kabel nejdřív vytáhni.`, druh: "tip" });
      return;
    }
    const nove = { ...z, [ruka]: port };
    onZmena(naKabely(nove));
    onHlaska(vyhodnot(nove, ruka, port));
    nastavRuku(null);
  };

  const vytahni = (id: KabelId, nazev: string) => {
    onZmena(naKabely({ ...z, [id]: null }));
    onHlaska({ text: `${nazev} je vytažený.`, druh: "info" });
    nastavRuku(null);
  };

  const svetla: [string, boolean][] = [
    ["Napájení", k.napajeni],
    ["Internet", k.internet],
    ["Wi-Fi", k.wifi],
    ...[1, 2, 3, 4].map((n): [string, boolean] => [`LAN ${n}`, k.lan.includes(n)]),
  ];

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_300px] gap-4 overflow-y-auto p-4">
      <div className="flex min-w-0 flex-col gap-3">
        <section aria-label="Zadní strana routeru">
          <h2 className="mb-2.5 text-[14px] font-semibold">Router zezadu</h2>
          <div className="flex items-start justify-between gap-1 rounded-[14px] border border-white/[.14] bg-[#18332b] px-4 pb-2 pt-4">
            {PORTY.map((p) => {
              const kdo = KABELY.find((c) => z[c.id] === p.id);
              return (
                <div key={p.id} className="min-h-[122px] w-[74px] text-center">
                  <button
                    type="button"
                    aria-label={`Port ${p.nazev}, ${kdo ? `zapojený ${kdo.kratce}` : "volný"}`}
                    onClick={() => klikPort(p.id)}
                    style={{ background: kdo ? kdo.barva : "#050807" }}
                    className={`mx-auto block h-[50px] w-[62px] p-0 hover:!border-[#6fe3c2] ${p.id === "nap" ? "rounded-full" : "rounded-md"} ${
                      ruka ? "border-2 border-[#7fa297]" : "border border-white/[.28]"
                    }`}
                  />
                  <div className="mt-1.5 text-[12px] font-semibold">{p.nazev}</div>
                  {kdo && (
                    <>
                      <svg className="mx-auto mt-0.5 block" width="8" height="18" aria-hidden="true">
                        <path d="M 4 0 L 4 18" stroke={kdo.barva} strokeWidth="3" />
                      </svg>
                      <div className="text-[12px]" style={{ color: kdo.barva }}>
                        {kdo.kratce}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <div className="w-[74px] text-center">
              <button
                type="button"
                aria-label="Tlačítko WPS"
                onClick={() => onHlaska({ text: "WPS je tlačítko, ne port. Kabel se do něj nezapojuje.", druh: "tip" })}
                className="mx-auto block h-[50px] w-[50px] rounded-full border border-white/[.28] bg-[#0d1714] p-0 text-[12px] font-semibold"
              >
                WPS
              </button>
              <div className="mt-1.5 text-[12px] text-[#a6bdb4]">tlačítko</div>
            </div>
          </div>
        </section>

        <section aria-label="Kabely">
          <h2 className="mb-2.5 text-[14px] font-semibold">Kabely na stole</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {KABELY.map((c) => {
              const port = z[c.id];
              const vybrany = ruka === c.id;
              return (
                <div key={c.id} className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    aria-pressed={vybrany}
                    onClick={() => nastavRuku(vybrany ? null : c.id)}
                    className={`block w-full rounded-lg p-3 text-left hover:bg-[#1f4136] ${
                      vybrany ? "border-2 border-[#6fe3c2] bg-[#123c30]" : "border border-white/[.14] bg-[#18332b]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-semibold">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.barva }} />
                      {c.nazev}
                    </span>
                    <span className="mt-1 block text-[13px] text-[#c5d6cf]">
                      {vybrany ? "v ruce, klikni na port" : port !== null ? `v portu ${nazevPortu(port)}` : c.odkud}
                    </span>
                  </button>
                  {port !== null && (
                    <button
                      type="button"
                      onClick={() => vytahni(c.id, c.nazev)}
                      className="self-start rounded-lg border border-white/[.14] bg-[#18332b] px-3 py-1.5 text-[13px] hover:bg-[#1f4136]"
                    >
                      Vytáhnout
                    </button>
                  )}
                </div>
              );
            })}
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
