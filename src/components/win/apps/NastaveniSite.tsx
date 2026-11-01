"use client";

/**
 * Nastavení → Síť a internet ve cvičení „Síť a poruchy“ (`?scenar=sit`).
 *
 * Domácí počítač na kabelu. Přiřazení IP a serveru DNS se dá upravit stejně
 * jako ve Windows 11 (Ethernet → Upravit), a právě tady žák opravuje poruchy.
 * Výchozí simulace ukazuje dál školní síť z `Nastaveni.tsx` – to se nemění.
 */

import { useState } from "react";
import { Globe } from "lucide-react";
import { Dialog, Pole, Rozbalovac, Tlacitko } from "../ui";
import { useSystem } from "../system";
import { ROUTER, diagnoza, jeIpv4, ucinne, type Prirazeni, type SitStav } from "@/lib/win/sit";

const PRIRAZENI: { id: Prirazeni; nazev: string }[] = [
  { id: "dhcp", nazev: "Automaticky (DHCP)" },
  { id: "rucne", nazev: "Ručně" },
];

const nazevPrirazeni = (p: Prirazeni) => (p === "dhcp" ? "Automaticky (DHCP)" : "Ručně");

export function OddilSitDomaci({ sit }: { sit: SitStav }) {
  const { poslat } = useSystem();
  const [upravuji, nastavUpravuji] = useState<"ip" | "dns" | null>(null);
  const d = diagnoza(sit);
  const u = ucinne(sit);
  const ulozit = (nova: SitStav) => {
    poslat({ typ: "sit/nastav", sit: nova });
    nastavUpravuji(null);
  };

  return (
    <>
      <div className="mb-2 rounded-md border border-win-linka bg-win-povrch">
        <div className="flex items-center gap-4 px-4 py-3">
          <Globe className="h-5 w-5 shrink-0 text-win-slaby" />
          <div className="min-w-0 flex-1">
            <div className="truncate">Ethernet</div>
            <div className="truncate text-[12px] text-win-slaby">
              {/* Windows hlásí „Bez internetu“ i při rozbitém DNS – test připojení se ptá na název. */}
              {d.internet && d.dns ? "Připojeno" : d.lan ? "Bez internetu" : "Žádné připojení k síti"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-win-linka bg-win-povrch">
        <Radek popis="Přiřazení IP" hodnota={nazevPrirazeni(sit.ip.prirazeni)}>
          <Tlacitko onClick={() => nastavUpravuji("ip")}>Upravit</Tlacitko>
        </Radek>
        <Radek popis="Přiřazení serveru DNS" hodnota={nazevPrirazeni(sit.dns.prirazeni)}>
          <Tlacitko onClick={() => nastavUpravuji("dns")}>Upravit</Tlacitko>
        </Radek>
        <Radek popis="Adresa IPv4" hodnota={u.adresa} />
        <Radek popis="Maska podsítě" hodnota={u.maska} />
        <Radek popis="Výchozí brána" hodnota={u.brana} />
        <Radek popis="Servery DNS IPv4" hodnota={u.dns} />
        <Radek popis="Fyzická adresa (MAC)" hodnota="3C-52-82-1A-07-C4" />
      </div>
      <p className="mt-3 text-[12px] text-win-slaby">
        Tytéž údaje vypíše v Terminálu příkaz <code>ipconfig /all</code>.
      </p>

      {upravuji === "ip" && <UpravitIp sit={sit} onUlozit={ulozit} onZrusit={() => nastavUpravuji(null)} />}
      {upravuji === "dns" && <UpravitDns sit={sit} onUlozit={ulozit} onZrusit={() => nastavUpravuji(null)} />}
    </>
  );
}

function Radek({ popis, hodnota, children }: { popis: string; hodnota: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-win-linka px-4 py-2.5 first:border-t-0">
      <div className="w-56 shrink-0 text-win-slaby">{popis}</div>
      <div className="flex-1">{hodnota}</div>
      {children}
    </div>
  );
}

function Policko({ popis, hodnota, onZmena }: { popis: string; hodnota: string; onZmena: (h: string) => void }) {
  const chyba = hodnota.trim() !== "" && !jeIpv4(hodnota);
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-[12px]">{popis}</span>
      <Pole value={hodnota} onChange={(e) => onZmena(e.target.value)} spellCheck={false} className="w-full" />
      {chyba && <span className="mt-1 block text-[11px] text-red-600">Zadej adresu ve tvaru 192.168.1.10.</span>}
    </label>
  );
}

function UpravitIp({ sit, onUlozit, onZrusit }: { sit: SitStav; onUlozit: (s: SitStav) => void; onZrusit: () => void }) {
  const [ip, nastavIp] = useState(sit.ip);
  const rucne = ip.prirazeni === "rucne";
  const platne = !rucne || [ip.adresa, ip.maska, ip.brana].every(jeIpv4);

  const ulozit = () => {
    const nova: SitStav = {
      ...sit,
      ip: { ...ip, adresa: ip.adresa.trim(), maska: ip.maska.trim(), brana: ip.brana.trim() },
      // Ruční adresa IP ve Windows nejde s automatickým DNS – DNS se přepne
      // na ručně a ponechá server, který počítač právě používá.
      dns: rucne && sit.dns.prirazeni === "dhcp" ? { prirazeni: "rucne", server: ucinne(sit).dns || ROUTER } : sit.dns,
    };
    onUlozit(nova);
  };

  return (
    <Dialog
      nadpis="Upravit nastavení IP"
      onZavrit={onZrusit}
      tlacitka={
        <>
          <Tlacitko vzhled="akcent" disabled={!platne} onClick={ulozit}>
            Uložit
          </Tlacitko>
          <Tlacitko onClick={onZrusit}>Zrušit</Tlacitko>
        </>
      }
    >
      <Rozbalovac
        popis="Přiřazení IP"
        hodnota={ip.prirazeni}
        moznosti={PRIRAZENI}
        onZmena={(p) => nastavIp({ ...ip, prirazeni: p })}
        sirka="w-full"
      />
      {rucne && (
        <>
          <Policko popis="Adresa IP" hodnota={ip.adresa} onZmena={(h) => nastavIp({ ...ip, adresa: h })} />
          <Policko popis="Maska podsítě" hodnota={ip.maska} onZmena={(h) => nastavIp({ ...ip, maska: h })} />
          <Policko popis="Brána" hodnota={ip.brana} onZmena={(h) => nastavIp({ ...ip, brana: h })} />
        </>
      )}
    </Dialog>
  );
}

function UpravitDns({ sit, onUlozit, onZrusit }: { sit: SitStav; onUlozit: (s: SitStav) => void; onZrusit: () => void }) {
  const [dns, nastavDns] = useState(sit.dns);
  // Při ruční adrese IP nabízí Windows pro DNS jen ruční zadání.
  const moznosti = sit.ip.prirazeni === "rucne" ? PRIRAZENI.filter((p) => p.id === "rucne") : PRIRAZENI;
  const rucne = dns.prirazeni === "rucne";
  const platne = !rucne || jeIpv4(dns.server);

  return (
    <Dialog
      nadpis="Upravit nastavení DNS"
      onZavrit={onZrusit}
      tlacitka={
        <>
          <Tlacitko
            vzhled="akcent"
            disabled={!platne}
            onClick={() => onUlozit({ ...sit, dns: { ...dns, server: dns.server.trim() } })}
          >
            Uložit
          </Tlacitko>
          <Tlacitko onClick={onZrusit}>Zrušit</Tlacitko>
        </>
      }
    >
      <Rozbalovac
        popis="Přiřazení serveru DNS"
        hodnota={dns.prirazeni}
        moznosti={moznosti}
        onZmena={(p) => nastavDns({ ...dns, prirazeni: p })}
        sirka="w-full"
      />
      {rucne && (
        <Policko
          popis="Upřednostňovaný server DNS"
          hodnota={dns.server}
          onZmena={(h) => nastavDns({ ...dns, server: h })}
        />
      )}
    </Dialog>
  );
}
