"use client";

/**
 * Správa routeru: webová stránka routeru na 192.168.1.1 v prohlížeči dílny.
 * Je to komponenta místo obyčejné stránky, protože se v ní vyplňují formuláře.
 * Vypadá schválně jako cizí web, ne jako dílna. Každý router má správu
 * uspořádanou jinak; přihlášení, Wi-Fi, síť pro hosty, připojená zařízení,
 * DHCP a heslo ke správě ale mívá každý.
 */

import { useState } from "react";
import { ROUTER, VEREJNA_ADRESA, STITEK, diagnoza, type Router, type SitStav, type Zabezpeceni } from "@/lib/win/sit";

type Cast = "prehled" | "wifi" | "host" | "zarizeni" | "lan" | "sprava";

const CASTI: { id: Cast; nazev: string }[] = [
  { id: "prehled", nazev: "Přehled" },
  { id: "wifi", nazev: "Wi-Fi" },
  { id: "host", nazev: "Síť pro hosty" },
  { id: "zarizeni", nazev: "Připojená zařízení" },
  { id: "lan", nazev: "Síť LAN" },
  { id: "sprava", nazev: "Správa" },
];

const ZABEZPECENI: { id: Zabezpeceni; nazev: string }[] = [
  { id: "otevrena", nazev: "Žádné (otevřená síť)" },
  { id: "wpa2", nazev: "WPA2-Personal" },
  { id: "wpa2-wpa3", nazev: "WPA2/WPA3-Personal" },
  { id: "wpa3", nazev: "WPA3-Personal" },
];

const pole = "h-8 w-full rounded border border-[#c8ccd0] bg-white px-2 text-[13px] text-[#1a1a1a] outline-none focus:border-[#0f4c81]";
const tlacitko = "h-8 rounded bg-[#0f4c81] px-4 text-[13px] font-semibold text-white hover:bg-[#0c3d68] disabled:opacity-40";

export function SpravaRouteru({
  sit,
  onStopa,
  onZmena,
}: {
  sit: SitStav;
  onStopa: (stopa: string) => void;
  onZmena: (zmena: Partial<Router>) => void;
}) {
  const [prihlasen, nastavPrihlasen] = useState(false);
  const [cast, nastavCast] = useState<Cast>("prehled");
  const router = sit.router;
  const uloz = onZmena;

  if (!prihlasen) {
    return (
      <Prihlaseni
        heslo={router.adminHeslo}
        onPrihlasen={() => {
          nastavPrihlasen(true);
          onStopa("overeno:router-prihlaseni");
        }}
      />
    );
  }

  return (
    <div className="flex h-full bg-[#f4f6f8] text-[13px] text-[#1a1a1a]" style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <nav className="w-48 shrink-0 bg-[#0f4c81] p-3 text-white">
        <div className="mb-3 text-[15px] font-semibold">DR-300</div>
        {CASTI.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => nastavCast(c.id)}
            className={`mb-0.5 block w-full rounded px-2 py-1.5 text-left ${cast === c.id ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            {c.nazev}
          </button>
        ))}
        <button type="button" onClick={() => nastavPrihlasen(false)} className="mt-4 px-2 text-[12px] text-white/70 hover:underline">
          Odhlásit
        </button>
      </nav>
      <main className="min-w-0 flex-1 overflow-auto p-6">
        <div className="max-w-xl">
          {cast === "prehled" && <Prehled sit={sit} />}
          {cast === "wifi" && <WiFi router={router} uloz={uloz} />}
          {cast === "host" && <Host router={router} uloz={uloz} />}
          {cast === "zarizeni" && <Zarizeni router={router} uloz={uloz} />}
          {cast === "lan" && <Lan router={router} uloz={uloz} />}
          {cast === "sprava" && <Sprava uloz={uloz} />}
          <p className="mt-8 text-[11px] text-[#6b7280]">
            Zjednodušeno – správa každého routeru vypadá jinak. Tyhle části ale najdeš skoro v každé.
          </p>
        </div>
      </main>
    </div>
  );
}

function Prihlaseni({ heslo, onPrihlasen }: { heslo: string; onPrihlasen: () => void }) {
  const [jmeno, nastavJmeno] = useState("");
  const [zadane, nastavZadane] = useState("");
  const [chyba, nastavChybu] = useState(false);
  const prihlas = () => {
    if (jmeno.trim() === STITEK.uzivatel && zadane === heslo) onPrihlasen();
    else nastavChybu(true);
  };
  return (
    <div className="flex h-full items-center justify-center bg-[#f4f6f8] text-[13px] text-[#1a1a1a]" style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <form
        className="w-72 rounded-lg border border-[#dde1e5] bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          prihlas();
        }}
      >
        <h1 className="mb-1 text-[18px] font-semibold">Router DR-300</h1>
        <p className="mb-4 text-[12px] text-[#6b7280]">Přihlášení do správy routeru</p>
        <label className="mb-2 block">
          <span className="mb-1 block text-[12px]">Uživatelské jméno</span>
          <input className={pole} value={jmeno} onChange={(e) => nastavJmeno(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-[12px]">Heslo</span>
          <input
            className={pole}
            type="password"
            value={zadane}
            onChange={(e) => {
              nastavZadane(e.target.value);
              nastavChybu(false);
            }}
            autoComplete="off"
          />
        </label>
        {chyba && <p className="mb-3 text-[12px] text-[#b42318]">Nesprávné jméno nebo heslo. Tovární údaje jsou na štítku routeru.</p>}
        <button type="submit" className={`${tlacitko} w-full`}>
          Přihlásit
        </button>
      </form>
    </div>
  );
}

/** Simulace si hesla ukládá do prohlížeče – skutečné tu nemají co dělat. */
function NeSkutecne() {
  return <p className="mb-3 text-[12px] text-[#6b7280]">Vymysli cvičné heslo. Žádné, které opravdu používáš.</p>;
}

function Nadpis({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-[20px] font-semibold">{children}</h1>;
}

function Ulozeno({ text }: { text: string | null }) {
  return text ? <p className="mt-3 rounded bg-[#e7f6ec] px-3 py-2 text-[12px] text-[#1e6b3a]">{text}</p> : null;
}

function Prehled({ sit }: { sit: SitStav }) {
  const d = diagnoza(sit);
  const pripojeno = sit.router.zarizeni.filter((z) => !sit.router.blokovane.includes(z.mac)).length;
  return (
    <>
      <Nadpis>Přehled</Nadpis>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-[#dde1e5] bg-white p-4">
        <dt className="text-[#6b7280]">Internet (WAN)</dt>
        <dd>{d.wan ? "Připojeno" : "Nepřipojeno – zkontroluj kabel v portu WAN"}</dd>
        <dt className="text-[#6b7280]">Veřejná adresa</dt>
        <dd>{d.wan ? VEREJNA_ADRESA : "–"}</dd>
        <dt className="text-[#6b7280]">Adresa routeru v síti</dt>
        <dd>{ROUTER}</dd>
        <dt className="text-[#6b7280]">Wi-Fi</dt>
        <dd>{sit.router.wifi.nazev}</dd>
        <dt className="text-[#6b7280]">Připojená zařízení</dt>
        <dd>{sit.router.dhcp ? pripojeno : "server DHCP je vypnutý"}</dd>
      </dl>
    </>
  );
}

function WiFi({ router, uloz }: { router: Router; uloz: (z: Partial<Router>) => void }) {
  const [nazev, nastavNazev] = useState(router.wifi.nazev);
  const [zabezpeceni, nastavZabezpeceni] = useState<Zabezpeceni>(router.wifi.zabezpeceni);
  const [heslo, nastavHeslo] = useState(router.wifi.heslo);
  const [wps, nastavWps] = useState(router.wps);
  const [hlaska, nastavHlasku] = useState<string | null>(null);
  const otevrena = zabezpeceni === "otevrena";
  const platne = nazev.trim().length > 0 && (otevrena || (heslo.length >= 8 && heslo.length <= 63));

  return (
    <>
      <Nadpis>Wi-Fi</Nadpis>
      <div className="rounded-lg border border-[#dde1e5] bg-white p-4">
        <label className="mb-3 block">
          <span className="mb-1 block text-[12px]">Název sítě (SSID)</span>
          <input className={pole} value={nazev} onChange={(e) => nastavNazev(e.target.value)} spellCheck={false} maxLength={32} />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-[12px]">Zabezpečení</span>
          <select className={pole} value={zabezpeceni} onChange={(e) => nastavZabezpeceni(e.target.value as Zabezpeceni)}>
            {ZABEZPECENI.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nazev}
              </option>
            ))}
          </select>
        </label>
        {!otevrena && (
          <label className="mb-3 block">
            <span className="mb-1 block text-[12px]">Heslo (8 až 63 znaků)</span>
            <input className={pole} value={heslo} onChange={(e) => nastavHeslo(e.target.value)} spellCheck={false} autoComplete="off" />
          </label>
        )}
        <NeSkutecne />
        {otevrena && (
          <p className="mb-3 text-[12px] text-[#b42318]">Do otevřené sítě se připojí kdokoli v dosahu, bez hesla.</p>
        )}
        <label className="mb-4 flex items-center gap-2">
          <input type="checkbox" checked={wps} onChange={(e) => nastavWps(e.target.checked)} />
          WPS (připojení tlačítkem nebo PINem bez hesla)
        </label>
        <button
          type="button"
          disabled={!platne}
          className={tlacitko}
          onClick={() => {
            uloz({ wifi: { nazev: nazev.trim(), zabezpeceni, heslo: otevrena ? "" : heslo }, wps });
            nastavHlasku(
              heslo !== router.wifi.heslo || zabezpeceni !== router.wifi.zabezpeceni
                ? "Uloženo. Zařízení připojená přes Wi-Fi se odpojila a musí se připojit znovu s novým heslem."
                : "Uloženo.",
            );
          }}
        >
          Uložit
        </button>
        <Ulozeno text={hlaska} />
      </div>
    </>
  );
}

function Host({ router, uloz }: { router: Router; uloz: (z: Partial<Router>) => void }) {
  const [zapnuto, nastavZapnuto] = useState(router.host.zapnuto);
  const [heslo, nastavHeslo] = useState(router.host.heslo);
  const [hlaska, nastavHlasku] = useState<string | null>(null);
  const platne = !zapnuto || heslo.length >= 8;
  return (
    <>
      <Nadpis>Síť pro hosty</Nadpis>
      <div className="rounded-lg border border-[#dde1e5] bg-white p-4">
        <p className="mb-3 text-[12px] text-[#6b7280]">
          Zvláštní Wi-Fi pro návštěvy. Zařízení v ní se dostanou do internetu, ale ne k počítačům a dalším zařízením
          v domácí síti.
        </p>
        <label className="mb-3 flex items-center gap-2">
          <input type="checkbox" checked={zapnuto} onChange={(e) => nastavZapnuto(e.target.checked)} />
          Zapnout síť pro hosty ({router.wifi.nazev}-host)
        </label>
        <NeSkutecne />
        {zapnuto && (
          <label className="mb-3 block">
            <span className="mb-1 block text-[12px]">Heslo pro hosty (aspoň 8 znaků)</span>
            <input className={pole} value={heslo} onChange={(e) => nastavHeslo(e.target.value)} spellCheck={false} autoComplete="off" />
          </label>
        )}
        <button
          type="button"
          disabled={!platne}
          className={tlacitko}
          onClick={() => {
            uloz({ host: { zapnuto, heslo } });
            nastavHlasku("Uloženo.");
          }}
        >
          Uložit
        </button>
        <Ulozeno text={hlaska} />
      </div>
    </>
  );
}

function Zarizeni({ router, uloz }: { router: Router; uloz: (z: Partial<Router>) => void }) {
  if (!router.dhcp) {
    return (
      <>
        <Nadpis>Připojená zařízení</Nadpis>
        <p className="rounded-lg border border-[#dde1e5] bg-white p-4">
          Server DHCP je vypnutý. Router teď nikomu adresy nepřiděluje, a proto tu nikoho nevidí.
        </p>
      </>
    );
  }
  return (
    <>
      <Nadpis>Připojená zařízení</Nadpis>
      <table className="w-full border-collapse rounded-lg bg-white text-[12px]">
        <thead>
          <tr className="text-left text-[#6b7280]">
            <th className="border-b border-[#dde1e5] p-2 font-normal">Název</th>
            <th className="border-b border-[#dde1e5] p-2 font-normal">Adresa IP</th>
            <th className="border-b border-[#dde1e5] p-2 font-normal">MAC</th>
            <th className="border-b border-[#dde1e5] p-2 font-normal">Připojení</th>
            <th className="border-b border-[#dde1e5] p-2" />
          </tr>
        </thead>
        <tbody>
          {router.zarizeni.map((z) => {
            const blokovano = router.blokovane.includes(z.mac);
            return (
              <tr key={z.mac} className={blokovano ? "text-[#9ca3af]" : ""}>
                <td className="border-b border-[#eef0f2] p-2">{z.nazev}</td>
                <td className="border-b border-[#eef0f2] p-2 font-mono">{blokovano ? "–" : z.adresa}</td>
                <td className="border-b border-[#eef0f2] p-2 font-mono">{z.mac}</td>
                <td className="border-b border-[#eef0f2] p-2">{z.pripojeni === "kabel" ? "Kabel" : "Wi-Fi"}</td>
                <td className="border-b border-[#eef0f2] p-2 text-right">
                  {z.nazev !== "DOMACI-PC" && (
                    <button
                      type="button"
                      className="text-[#0f4c81] hover:underline"
                      onClick={() =>
                        uloz({
                          blokovane: blokovano ? router.blokovane.filter((m) => m !== z.mac) : [...router.blokovane, z.mac],
                        })
                      }
                    >
                      {blokovano ? "Odblokovat" : "Zablokovat"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-[12px] text-[#6b7280]">
        Tohle zařízení (DOMACI-PC) zablokovat nejde – odřízl by sis správu routeru.
      </p>
    </>
  );
}

function Lan({ router, uloz }: { router: Router; uloz: (z: Partial<Router>) => void }) {
  const [dhcp, nastavDhcp] = useState(router.dhcp);
  const [hlaska, nastavHlasku] = useState<string | null>(null);
  return (
    <>
      <Nadpis>Síť LAN</Nadpis>
      <div className="rounded-lg border border-[#dde1e5] bg-white p-4">
        <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt className="text-[#6b7280]">Adresa routeru</dt>
          <dd>{ROUTER}</dd>
          <dt className="text-[#6b7280]">Maska podsítě</dt>
          <dd>255.255.255.0</dd>
          <dt className="text-[#6b7280]">Rozsah adres DHCP</dt>
          <dd>192.168.1.2 – 192.168.1.199</dd>
        </dl>
        <label className="mb-4 flex items-center gap-2">
          <input type="checkbox" checked={dhcp} onChange={(e) => nastavDhcp(e.target.checked)} />
          Server DHCP (router přiděluje zařízením adresy)
        </label>
        <button
          type="button"
          className={tlacitko}
          onClick={() => {
            uloz({ dhcp });
            nastavHlasku(dhcp ? "Uloženo." : "Uloženo. Zařízení, která se teď připojí, adresu nedostanou.");
          }}
        >
          Uložit
        </button>
        <Ulozeno text={hlaska} />
      </div>
    </>
  );
}

function Sprava({ uloz }: { uloz: (z: Partial<Router>) => void }) {
  const [heslo, nastavHeslo] = useState("");
  const [znovu, nastavZnovu] = useState("");
  const [hlaska, nastavHlasku] = useState<string | null>(null);
  const platne = heslo.length >= 8 && heslo === znovu;
  return (
    <>
      <Nadpis>Správa</Nadpis>
      <div className="rounded-lg border border-[#dde1e5] bg-white p-4">
        <p className="mb-3 text-[12px] text-[#6b7280]">Heslo pro přihlášení do správy routeru. Tovární heslo je na štítku.</p>
        <NeSkutecne />
        <label className="mb-3 block">
          <span className="mb-1 block text-[12px]">Nové heslo (aspoň 8 znaků)</span>
          <input className={pole} type="password" value={heslo} onChange={(e) => nastavHeslo(e.target.value)} autoComplete="off" />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-[12px]">Nové heslo znovu</span>
          <input className={pole} type="password" value={znovu} onChange={(e) => nastavZnovu(e.target.value)} autoComplete="off" />
        </label>
        {znovu && heslo !== znovu && <p className="mb-3 text-[12px] text-[#b42318]">Hesla se neshodují.</p>}
        <button
          type="button"
          disabled={!platne}
          className={tlacitko}
          onClick={() => {
            uloz({ adminHeslo: heslo });
            nastavHeslo("");
            nastavZnovu("");
            nastavHlasku("Heslo je změněné. Příště se přihlas novým heslem.");
          }}
        >
          Změnit heslo
        </button>
        <Ulozeno text={hlaska} />
      </div>
    </>
  );
}
