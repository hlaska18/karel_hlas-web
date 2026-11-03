"use client";

/**
 * Nastavení počítače v dílně: tytéž volby jako ve Windows 11 (Ethernet →
 * Upravit nastavení IP a DNS). Tady žák opravuje poruchy brány a DNS.
 */

import { useEffect, useState } from "react";
import { MAC_PC, ROUTER, diagnoza, jeIpv4, ucinne, type NastaveniDns, type NastaveniIp, type Prirazeni, type SitStav } from "@/lib/win/sit";

const nazevPrirazeni = (p: Prirazeni) => (p === "dhcp" ? "Automaticky (DHCP)" : "Ručně");
const pole = "w-full rounded-lg border border-white/[.18] bg-[#0d1714] px-2.5 py-2 font-mono text-[14px] text-[#e8f3ef]";
const tlacitko = "rounded-lg bg-[#6fe3c2] px-4 py-2 text-[14px] font-semibold text-[#06201a] hover:bg-[#8aeccf] disabled:opacity-40";

export function NastaveniPocitace({ sit, onUlozit }: { sit: SitStav; onUlozit: (nova: SitStav) => void }) {
  const d = diagnoza(sit);
  const u = ucinne(sit);
  // Windows hlásí „Bez internetu“ i při rozbitém DNS, test připojení se ptá na název.
  const stav = d.internet && d.dns ? "Připojeno" : d.lan ? "Bez internetu" : "Žádné připojení k síti";

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 overflow-y-auto p-4 text-[14px]">
      <div className="flex flex-col gap-[7px]">
        <h2 className="mb-0.5 text-[15px] font-semibold">Ethernet</h2>
        <Udaj popis="Stav" hodnota={stav} />
        <Udaj popis="Přiřazení IP" hodnota={nazevPrirazeni(sit.ip.prirazeni)} />
        <Udaj popis="Přiřazení serveru DNS" hodnota={nazevPrirazeni(sit.dns.prirazeni)} />
        <Udaj popis="Adresa IPv4" hodnota={u.adresa} />
        <Udaj popis="Maska podsítě" hodnota={u.maska} />
        <Udaj popis="Výchozí brána" hodnota={u.brana} />
        <Udaj popis="Servery DNS IPv4" hodnota={u.dns} />
        <Udaj popis="Fyzická adresa (MAC)" hodnota={MAC_PC} />
        <p className="mt-2 text-[12px] text-[#a6bdb4]">Tytéž údaje vypíše v Terminálu příkaz ipconfig /all.</p>
      </div>
      <div className="flex flex-col gap-3">
        <UpravitIp sit={sit} onUlozit={onUlozit} />
        <UpravitDns sit={sit} onUlozit={onUlozit} />
      </div>
    </div>
  );
}

function Udaj({ popis, hodnota }: { popis: string; hodnota: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#a6bdb4]">{popis}</span>
      <span className="text-right">{hodnota || "–"}</span>
    </div>
  );
}

function Volba({ hodnota, moznosti, onZmena }: { hodnota: Prirazeni; moznosti: Prirazeni[]; onZmena: (p: Prirazeni) => void }) {
  return (
    <div className="flex gap-2">
      {moznosti.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={hodnota === p}
          onClick={() => onZmena(p)}
          className={`flex-1 rounded-lg border border-white/[.14] px-3 py-[7px] text-[13px] ${
            hodnota === p ? "bg-[#6fe3c2] text-[#06201a]" : "bg-[#18332b] text-[#e8f3ef] hover:bg-[#1f4136]"
          }`}
        >
          {nazevPrirazeni(p)}
        </button>
      ))}
    </div>
  );
}

function Policko({ popis, hodnota, onZmena }: { popis: string; hodnota: string; onZmena: (h: string) => void }) {
  const chyba = hodnota.trim() !== "" && !jeIpv4(hodnota);
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] text-[#a6bdb4]">{popis}</span>
      <input className={pole} value={hodnota} onChange={(e) => onZmena(e.target.value)} spellCheck={false} autoComplete="off" />
      {chyba && <span className="mt-1 block text-[12px] text-[#ffd9d0]">Zadej adresu ve tvaru 192.168.1.10.</span>}
    </label>
  );
}

function UpravitIp({ sit, onUlozit }: { sit: SitStav; onUlozit: (nova: SitStav) => void }) {
  const [ip, nastavIp] = useState<NastaveniIp>(sit.ip);
  // Porucha nebo nový scénář vymění síť zvenku: formulář ji musí převzít.
  useEffect(() => nastavIp(sit.ip), [sit.ip]);
  const rucne = ip.prirazeni === "rucne";
  const platne = !rucne || [ip.adresa, ip.maska, ip.brana].every(jeIpv4);

  const ulozit = () => {
    onUlozit({
      ...sit,
      ip: { ...ip, adresa: ip.adresa.trim(), maska: ip.maska.trim(), brana: ip.brana.trim() },
      // Ruční adresa IP ve Windows nejde s automatickým DNS: DNS se přepne na
      // ručně a ponechá server, který počítač právě používá.
      dns: rucne && sit.dns.prirazeni === "dhcp" ? { prirazeni: "rucne", server: ucinne(sit).dns || ROUTER } : sit.dns,
    });
  };

  return (
    <section className="flex flex-col gap-2.5 rounded-xl bg-[#122019] p-3.5">
      <h3 className="font-semibold">Upravit nastavení IP</h3>
      <Volba hodnota={ip.prirazeni} moznosti={["dhcp", "rucne"]} onZmena={(p) => nastavIp({ ...ip, prirazeni: p })} />
      {rucne && (
        <>
          <Policko popis="Adresa IP" hodnota={ip.adresa} onZmena={(h) => nastavIp({ ...ip, adresa: h })} />
          <Policko popis="Maska podsítě" hodnota={ip.maska} onZmena={(h) => nastavIp({ ...ip, maska: h })} />
          <Policko popis="Výchozí brána" hodnota={ip.brana} onZmena={(h) => nastavIp({ ...ip, brana: h })} />
        </>
      )}
      <div>
        <button type="button" disabled={!platne} onClick={ulozit} className={tlacitko}>
          Uložit
        </button>
      </div>
    </section>
  );
}

function UpravitDns({ sit, onUlozit }: { sit: SitStav; onUlozit: (nova: SitStav) => void }) {
  const [dns, nastavDns] = useState<NastaveniDns>(sit.dns);
  useEffect(() => nastavDns(sit.dns), [sit.dns]);
  // Při ruční adrese IP nabízí Windows pro DNS jen ruční zadání.
  const moznosti: Prirazeni[] = sit.ip.prirazeni === "rucne" ? ["rucne"] : ["dhcp", "rucne"];
  const rucne = dns.prirazeni === "rucne";
  const platne = !rucne || jeIpv4(dns.server);

  return (
    <section className="flex flex-col gap-2.5 rounded-xl bg-[#122019] p-3.5">
      <h3 className="font-semibold">Upravit nastavení DNS</h3>
      <Volba hodnota={dns.prirazeni} moznosti={moznosti} onZmena={(p) => nastavDns({ ...dns, prirazeni: p })} />
      {rucne && <Policko popis="Upřednostňovaný server DNS" hodnota={dns.server} onZmena={(h) => nastavDns({ ...dns, server: h })} />}
      <div>
        <button
          type="button"
          disabled={!platne}
          onClick={() => onUlozit({ ...sit, dns: { ...dns, server: dns.server.trim() } })}
          className={tlacitko}
        >
          Uložit
        </button>
      </div>
    </section>
  );
}
