"use client";

/**
 * Router a kabely – pohled na skutečný router vedle počítače (cvičení
 * „Síť a poruchy“). Žák tu zapojuje napájení, kabel od poskytovatele a kabel
 * od počítače, čte kontrolky a štítek. Router je smyšlený: skutečné routery
 * vypadají různě, porty WAN/LAN, kontrolky a štítek ale mívá každý.
 */

import { X } from "lucide-react";
import { useSystem } from "./system";
import { STITEK, kontrolky, type Kabely, type SitStav } from "@/lib/win/sit";

const PORTY_LAN = [1, 2, 3, 4];

export function RouterAKabely({ sit, zavri }: { sit: SitStav; zavri: () => void }) {
  const { poslat } = useSystem();
  const k = sit.kabely;
  const svetla = kontrolky(sit);
  const zmen = (zmena: Partial<Kabely>) => poslat({ typ: "sit/nastav", sit: { ...sit, kabely: { ...k, ...zmena } } });

  return (
    <div
      className="absolute inset-0 z-[960] flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) zavri();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Router a kabely"
        className="win-bezvyberu flex max-h-[92%] w-full max-w-[620px] flex-col overflow-hidden rounded-lg border border-win-linka bg-win-povrch text-win-text shadow-[var(--win-stin)]"
        onKeyDown={(e) => {
          if (e.key === "Escape") zavri();
        }}
      >
        <div className="flex shrink-0 items-center border-b border-win-linka px-4 py-3">
          <h2 className="flex-1 text-[14px] font-semibold">Router a kabely</h2>
          <button type="button" onClick={zavri} aria-label="Zavřít" className="rounded p-1 hover:bg-win-zvyrazneny">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="win-posuv min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[12px] leading-relaxed">
          {/* Přední strana: kontrolky */}
          <div className="rounded-lg bg-[#1f2328] px-4 py-3 text-[#e6e6e6]">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-[#9aa0a6]">DR-300 · přední strana</div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Kontrolka nazev="Napájení" sviti={svetla.napajeni} />
              <Kontrolka nazev="Internet" sviti={svetla.internet} />
              <Kontrolka nazev="Wi-Fi" sviti={svetla.wifi} />
              {PORTY_LAN.map((n) => (
                <Kontrolka key={n} nazev={`LAN ${n}`} sviti={svetla.lan === n} />
              ))}
            </div>
          </div>

          {/* Zadní strana: porty */}
          <div className="mt-2 rounded-lg bg-[#2b3036] px-4 py-3 text-[#e6e6e6]">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-[#9aa0a6]">Zadní strana</div>
            <div className="flex flex-wrap items-end gap-2">
              <Port nazev="Napájení" zapojeno={k.napajeni} barva="#9aa0a6" />
              <Port nazev="WAN" zapojeno={k.wan} barva="#4c8bf5" />
              {PORTY_LAN.map((n) => (
                <Port key={n} nazev={`LAN ${n}`} zapojeno={k.lan === n} barva="#e5b73b" />
              ))}
            </div>
          </div>

          <h3 className="mt-4 text-[13px] font-semibold">Kabely</h3>
          <div className="mt-1 divide-y divide-win-linka rounded-md border border-win-linka">
            <Radek
              nazev="Napájecí adaptér routeru"
              stav={k.napajeni ? "v zásuvce a v routeru" : "nezapojený"}
            >
              <Tlac onClick={() => zmen({ napajeni: !k.napajeni })}>{k.napajeni ? "Odpojit" : "Zapojit"}</Tlac>
            </Radek>
            <Radek
              nazev="Kabel z datové zásuvky poskytovatele"
              stav={k.wan ? "v portu WAN" : "nezapojený"}
            >
              <Tlac onClick={() => zmen({ wan: !k.wan })}>{k.wan ? "Odpojit" : "Zapojit do WAN"}</Tlac>
            </Radek>
            <Radek nazev="Kabel od počítače" stav={k.lan ? `v portu LAN ${k.lan}` : "nezapojený"}>
              <span className="flex flex-wrap gap-1">
                {PORTY_LAN.map((n) => (
                  <Tlac key={n} aktivni={k.lan === n} onClick={() => zmen({ lan: n })}>
                    LAN {n}
                  </Tlac>
                ))}
                {k.lan !== null && <Tlac onClick={() => zmen({ lan: null })}>Odpojit</Tlac>}
              </span>
            </Radek>
          </div>

          <h3 className="mt-4 text-[13px] font-semibold">Štítek na spodní straně routeru</h3>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 rounded-md border border-win-linka px-3 py-2 font-mono text-[11px]">
            <dt className="text-win-slaby">Model</dt>
            <dd>{STITEK.model}</dd>
            <dt className="text-win-slaby">Správa</dt>
            <dd>http://{STITEK.sprava}</dd>
            <dt className="text-win-slaby">Uživatel</dt>
            <dd>{STITEK.uzivatel}</dd>
            <dt className="text-win-slaby">Heslo správy</dt>
            <dd>{STITEK.adminHeslo}</dd>
            <dt className="text-win-slaby">Wi-Fi (SSID)</dt>
            <dd>{STITEK.wifiNazev}</dd>
            <dt className="text-win-slaby">Heslo Wi-Fi</dt>
            <dd>{STITEK.wifiHeslo}</dd>
            <dt className="text-win-slaby">MAC</dt>
            <dd>{STITEK.mac}</dd>
          </dl>
          <p className="mt-2 text-win-slaby">
            Štítek ukazuje tovární údaje. Když heslo ve správě routeru změníš, štítek o tom neví. Zjednodušeno: skutečné
            routery vypadají různě, porty WAN a LAN a kontrolky ale mívají podobné.
          </p>
        </div>
      </div>
    </div>
  );
}

function Kontrolka({ nazev, sviti }: { nazev: string; sviti: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: sviti ? "#3ddc84" : "#4a4f55", boxShadow: sviti ? "0 0 6px #3ddc84" : "none" }}
      />
      {nazev}
      <span className="sr-only">{sviti ? "svítí" : "nesvítí"}</span>
    </span>
  );
}

function Port({ nazev, zapojeno, barva }: { nazev: string; zapojeno: boolean; barva: string }) {
  return (
    <span className="flex flex-col items-center gap-1 text-[10px]">
      <span
        className="flex h-7 w-9 items-end justify-center rounded-[3px] border-2 pb-0.5"
        style={{ borderColor: barva, background: zapojeno ? barva : "#15181b" }}
      >
        {zapojeno && <span className="h-2 w-4 rounded-sm bg-[#15181b]/70" />}
      </span>
      {nazev}
    </span>
  );
}

function Radek({ nazev, stav, children }: { nazev: string; stav: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{nazev}</div>
        <div className="text-win-slaby">{stav}</div>
      </div>
      {children}
    </div>
  );
}

function Tlac({ children, onClick, aktivni }: { children: React.ReactNode; onClick: () => void; aktivni?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 rounded border px-2.5 text-[12px] ${
        aktivni ? "border-win-akcent bg-win-akcent text-win-akcent-text" : "border-win-linka hover:bg-win-zvyrazneny"
      }`}
    >
      {children}
    </button>
  );
}
