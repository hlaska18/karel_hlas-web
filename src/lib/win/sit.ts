/**
 * Síť: odkud příkazy ipconfig, ping, nslookup a tracert berou, co vypsat.
 *
 * Dva světy, každý drží jedna funkce níž:
 *
 * - ŠKOLA (simulátor Windows). Počítač v učebně, síť 10.20.x.x, nic se v ní
 *   nedá pokazit. Dřív `ping` na cokoli odpovídal ze školní brány 10.20.3.1,
 *   i `ping seznam.cz` – to nebyla pravda (rada 31. 10. 2026).
 * - DOMOV (Síťová dílna, `/sitova-dilna`). Domácí síť 192.168.1.x za routerem,
 *   kterou jde pokazit a opravit: ruční přiřazení IP se špatnou bránou, ruční
 *   server DNS, který neexistuje, kabely, vypnutý server DHCP.
 *
 * Pravidla obsahu (CLAUDE.md): adresy v internetu jen z ukázkových rozsahů
 * 198.51.100.x a 203.0.113.x, domácí síť 192.168.1.x, škola 10.x. Názvy webů
 * v internetu končí na `.example` (vyhrazené, nikdy nepatří skutečné firmě).
 * Skutečné weby (seznam.cz…) dostanou adresu z ukázkového rozsahu – jejich
 * pravou adresu simulace neví a vymýšlet si ji nemá.
 *
 * Znění výpisů je podle české verze Windows 11 (cmd). Co simulace zjednodušuje,
 * je ve výpisu označené „(Zjednodušeno – …)“.
 */

export type Prirazeni = "dhcp" | "rucne";

export interface NastaveniIp {
  prirazeni: Prirazeni;
  /** Ruční hodnoty. Při DHCP se nepoužijí, ale pamatují se pro další úpravu. */
  adresa: string;
  maska: string;
  brana: string;
}

export interface NastaveniDns {
  prirazeni: Prirazeni;
  server: string;
}

/** Co je zapojené kabely (pohled na router). */
export interface Kabely {
  /** Napájecí adaptér routeru je v zásuvce. */
  napajeni: boolean;
  /** Kabel z datové zásuvky poskytovatele vede do portu WAN. */
  wan: boolean;
  /** Do kterého portu LAN (1–4) vede kabel od počítače, `null` = nikam. */
  lan: number | null;
  /** Omyl při zapojování: kabel od poskytovatele v portu LAN (1–4). */
  poskytovatelVLan?: number | null;
  /** Omyl při zapojování: kabel od počítače v portu WAN. */
  pocitacVeWan?: boolean;
}

export type Zabezpeceni = "otevrena" | "wpa2" | "wpa2-wpa3" | "wpa3";

export interface Zarizeni {
  nazev: string;
  mac: string;
  adresa: string;
  pripojeni: "kabel" | "wifi";
  /** Cizí zařízení ve scénáři „Cizí zařízení ve Wi-Fi“. */
  cizi?: boolean;
}

/** Nastavení routeru – mění se ve správě routeru (prohlížeč → 192.168.1.1). */
export interface Router {
  adminHeslo: string;
  wifi: { nazev: string; zabezpeceni: Zabezpeceni; heslo: string };
  wps: boolean;
  host: { zapnuto: boolean; heslo: string };
  /** Router přiděluje adresy (server DHCP). */
  dhcp: boolean;
  zarizeni: Zarizeni[];
  /** MAC adresy zablokovaných zařízení. */
  blokovane: string[];
}

export interface SitStav {
  ip: NastaveniIp;
  dns: NastaveniDns;
  kabely: Kabely;
  router: Router;
  /** Právě spuštěná porucha (tlačítko v zakázce), než ji žák opraví. */
  porucha?: Porucha;
}

/** Poruchy seřazené tak, jak se hledají: odspodu, od kabelu k názvům. */
export type Porucha = "kabel" | "dhcp" | "brana" | "wan" | "dns";

/** Scénáře, které začínají jinak nastaveným routerem. */
export type Situace = "router" | "cizi";

/* ───────────────────── Domácí síť ───────────────────── */

export const ROUTER = "192.168.1.1";
const DOMACI_PC = "192.168.1.23";
const MASKA = "255.255.255.0";
/** Veřejná adresa domácnosti – pod ní router vystupuje do internetu. */
export const VEREJNA_ADRESA = "203.0.113.57";
/** Adresa, kterou si Windows dají samy, když jim nikdo nepřidělí jinou (APIPA). */
export const APIPA = "169.254.23.115";
export const MAC_PC = "3C-52-82-1A-07-C4";

/**
 * Štítek na spodní straně routeru. Router je smyšlený – žádný skutečný
 * nevypadá úplně stejně, ale údaje na štítku mívá každý.
 */
export const STITEK = {
  model: "DR-300 (ukázkový domácí router)",
  sprava: ROUTER,
  uzivatel: "admin",
  adminHeslo: "Q7m-4kzR",
  wifiNazev: "DR300-4F2A",
  wifiHeslo: "vk82-mr7q-x4tz",
  mac: "58-D5-6E-4F-2A-10",
};

/** Kdo je doma připojený (telefon a televize odpovídají i na ping). */
const RODINA: Zarizeni[] = [
  { nazev: "DOMACI-PC", mac: MAC_PC, adresa: DOMACI_PC, pripojeni: "kabel" },
  { nazev: "Telefon-mama", mac: "8A-2C-41-07-B3-5E", adresa: "192.168.1.12", pripojeni: "wifi" },
  { nazev: "Televize-obyvak", mac: "F0-99-B6-21-4C-08", adresa: "192.168.1.20", pripojeni: "wifi" },
];

/** Cizí zařízení ve scénáři „Cizí zařízení ve Wi-Fi“. */
export const CIZI: Zarizeni = {
  nazev: "android-5c1e",
  mac: "A6-1F-33-9C-50-E2",
  adresa: "192.168.1.37",
  pripojeni: "wifi",
  cizi: true,
};

const TOVARNI_ROUTER: Router = {
  adminHeslo: STITEK.adminHeslo,
  wifi: { nazev: STITEK.wifiNazev, zabezpeceni: "wpa2", heslo: STITEK.wifiHeslo },
  wps: true,
  host: { zapnuto: false, heslo: "" },
  dhcp: true,
  zarizeni: RODINA,
  blokovane: [],
};

const ZAPOJENO: Kabely = { napajeni: true, wan: true, lan: 1 };

export const VYCHOZI_SIT: SitStav = {
  ip: { prirazeni: "dhcp", adresa: DOMACI_PC, maska: MASKA, brana: ROUTER },
  dns: { prirazeni: "dhcp", server: ROUTER },
  kabely: ZAPOJENO,
  router: TOVARNI_ROUTER,
};

/** Uložený stav ze starší verze (bez kabelů a routeru) doplní výchozími. */
export function doplnSit(sit: Partial<SitStav> | undefined): SitStav {
  return {
    ...VYCHOZI_SIT,
    ...sit,
    kabely: { ...ZAPOJENO, ...sit?.kabely },
    router: { ...TOVARNI_ROUTER, ...sit?.router },
  };
}

/**
 * Pokažená síť pro úlohy s poruchou. Všechny jsou z praxe: vypadlý kabel,
 * vypnutý server DHCP, ruční nastavení opsané špatně nebo zbylé po jiné síti,
 * výpadek u poskytovatele (tady vytažený kabel WAN).
 */
export function sitSPoruchou(porucha: Porucha): SitStav {
  const zaklad = { ...VYCHOZI_SIT, porucha };
  switch (porucha) {
    case "kabel":
      return { ...zaklad, kabely: { ...ZAPOJENO, lan: null } };
    case "wan":
      return { ...zaklad, kabely: { ...ZAPOJENO, wan: false } };
    case "dhcp":
      return { ...zaklad, router: { ...TOVARNI_ROUTER, dhcp: false } };
    case "brana":
      return {
        ...zaklad,
        ip: { prirazeni: "rucne", adresa: DOMACI_PC, maska: MASKA, brana: "192.168.1.254" },
        // Ruční IP ve Windows vyžaduje i ruční DNS – proto ruční, ale správně.
        dns: { prirazeni: "rucne", server: ROUTER },
      };
    case "dns":
      return { ...zaklad, dns: { prirazeni: "rucne", server: "192.168.1.53" } };
  }
}

/** Začátek scénáře: nový router v krabici, nebo síť, ve které je někdo cizí. */
export function sitProSituaci(situace: Situace): SitStav {
  if (situace === "router") {
    // Telefon a televize novou Wi-Fi ještě neznají – připojený je jen počítač na kabelu.
    return {
      ...VYCHOZI_SIT,
      kabely: { napajeni: false, wan: false, lan: null },
      router: { ...TOVARNI_ROUTER, zarizeni: RODINA.filter((z) => z.mac === MAC_PC) },
    };
  }
  return {
    ...VYCHOZI_SIT,
    router: {
      ...TOVARNI_ROUTER,
      wifi: { nazev: "Novakovi", zabezpeceni: "wpa2", heslo: "12345678" },
      zarizeni: [...RODINA, CIZI],
    },
  };
}

/** Svítí kontrolky na routeru? */
export function kontrolky(sit: SitStav): { napajeni: boolean; internet: boolean; wifi: boolean; lan: number[] } {
  const k = sit.kabely;
  const porty = [k.lan, k.poskytovatelVLan].filter((p): p is number => typeof p === "number");
  return {
    napajeni: k.napajeni,
    internet: k.napajeni && k.wan,
    wifi: k.napajeni,
    lan: k.napajeni ? porty : [],
  };
}

export interface Ucinne {
  /** Kabel vede do zapnutého routeru (Windows: médium připojeno). */
  medium: boolean;
  /** Adresa 169.254.x.x – počítači nikdo nepřidělil adresu. */
  apipa: boolean;
  adresa: string;
  maska: string;
  brana: string;
  dns: string;
}

/** Hodnoty, se kterými počítač opravdu pracuje (DHCP, nebo ruční). */
export function ucinne(sit: SitStav): Ucinne {
  const veWan = Boolean(sit.kabely.pocitacVeWan);
  const medium = sit.kabely.napajeni && (sit.kabely.lan !== null || veWan);
  if (!medium) return { medium, apipa: false, adresa: "", maska: "", brana: "", dns: "" };
  const dnsRucne = sit.dns.prirazeni === "rucne" ? sit.dns.server : "";
  // Port WAN adresy nepřiděluje, ten je sám dostává od poskytovatele.
  if (veWan) return { medium, apipa: true, adresa: APIPA, maska: "255.255.0.0", brana: "", dns: dnsRucne };
  if (sit.ip.prirazeni === "rucne") {
    const { adresa, maska, brana } = sit.ip;
    return { medium, apipa: false, adresa, maska, brana, dns: dnsRucne || ROUTER };
  }
  if (!sit.router.dhcp) {
    return { medium, apipa: true, adresa: APIPA, maska: "255.255.0.0", brana: "", dns: dnsRucne };
  }
  return { medium, apipa: false, adresa: DOMACI_PC, maska: MASKA, brana: ROUTER, dns: dnsRucne || ROUTER };
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function jeIpv4(text: string): boolean {
  const m = IPV4.exec(text.trim());
  return Boolean(m && m.slice(1).every((c) => Number(c) <= 255));
}

/** Soukromé rozsahy (10/8, 172.16/12, 192.168/16) a vlastní stroj. */
export function soukroma(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Je adresa v domácí síti 192.168.1.0/24 a dá se použít pro počítač? */
function vDomaciSiti(ip: string): boolean {
  if (!jeIpv4(ip)) return false;
  const c = ip.split(".").map(Number);
  return c[0] === 192 && c[1] === 168 && c[2] === 1 && c[3] >= 2 && c[3] <= 254;
}

export interface Diagnoza {
  /** Kabel od počítače vede do zapnutého routeru. */
  medium: boolean;
  /** Počítač má adresu ze správné sítě a dosáhne na router. */
  lan: boolean;
  /** Router má spojení s poskytovatelem (kabel WAN). */
  wan: boolean;
  /** Brána je router a router je připojený – pakety do internetu projdou. */
  internet: boolean;
  /** Server DNS odpovídá – názvy webů se přeloží na adresy. */
  dns: boolean;
}

export function diagnoza(sit: SitStav): Diagnoza {
  const u = ucinne(sit);
  const lan = u.medium && vDomaciSiti(u.adresa) && u.adresa !== ROUTER && u.maska === MASKA;
  const wan = sit.kabely.napajeni && sit.kabely.wan;
  const internet = lan && u.brana === ROUTER && wan;
  // Server DNS v domácí síti odpovídá jen tehdy, když je to router – a ten
  // názvy jen předává dál, takže bez spojení s poskytovatelem nepřeloží nic.
  // Veřejný server funguje, když vede cesta do internetu.
  // Zjednodušeno: simulace bere každou veřejnou adresu jako fungující server DNS.
  const dns = jeIpv4(u.dns) && ((u.dns === ROUTER && lan && wan) || (!soukroma(u.dns) && internet));
  return { medium: u.medium, lan, wan, internet, dns };
}

/** Funguje síť tak, jak má (stránky v internetu se otevřou podle názvu)? */
export const sitFunguje = (sit: SitStav) => {
  const d = diagnoza(sit);
  return d.internet && d.dns;
};

/** Je správa routeru z počítače dostupná (prohlížeč → 192.168.1.1)? */
export const spravaDostupna = (sit: SitStav) => diagnoza(sit).lan;

/* ───────────────────── Názvy a adresy ───────────────────── */

/** Weby v „internetu“ domácího cvičení. */
export const DOMACI_WEBY: Record<string, string> = {
  "skola.example": "203.0.113.10",
  "zpravy.example": "203.0.113.20",
  "mojeip.example": "198.51.100.80",
};

/** Školní vnitřní weby (stejné adresy jako v prohlížeči výchozího scénáře). */
const SKOLNI_WEBY: Record<string, string> = {
  "skola.local": "10.20.0.10",
  "ucebnice.local": "10.20.0.11",
  "stahovani.local": "10.20.0.12",
};

/** Mezilehlé routery poskytovatele cestou do internetu. */
const PRES_POSKYTOVATELE = ["198.51.100.1", "198.51.100.65"];

/**
 * Adresa pro web, který simulace nezná (seznam.cz…). Pořád stejná pro stejný
 * název a vždy z ukázkového rozsahu 203.0.113.x – pravou adresu simulace neví.
 */
function ukazkovaAdresa(nazev: string): string {
  let h = 0;
  for (let i = 0; i < nazev.length; i++) h = (h * 31 + nazev.charCodeAt(i)) >>> 0;
  return `203.0.113.${100 + (h % 150)}`;
}

/** Vypadá to jako název webu? Jedno slovo bez tečky simulace nepřekládá. */
const jeNazev = (text: string) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(text);

/* ───────────────────── Svět, ve kterém příkaz běží ───────────────────── */

interface Svet {
  domaci: boolean;
  nazevPc: string;
  adapter: string;
  pripona: string;
  mac: string;
  adresa: string;
  maska: string;
  brana: string;
  dns: string[];
  dhcp: boolean;
  serverDhcp: string;
  /** Kabel zapojený do zapnutého routeru. */
  medium: boolean;
  apipa: boolean;
  d: Diagnoza;
  /** Přeloží název na adresu, nebo `null`, když takový web není. */
  preloz: (nazev: string) => string | null;
  /** Existuje adresa v místní síti? Vrací TTL odpovědi. */
  mistni: (ip: string) => number | null;
  jeMistni: (ip: string) => boolean;
  /** Servery v jiné vnitřní podsíti (škola), dosažitelné přes bránu. */
  vnitrni: string[];
  /** Routery od brány po cíl (bez cíle). */
  cesta: string[];
}

function svet(sit: SitStav | undefined): Svet {
  if (!sit) {
    return {
      domaci: false,
      nazevPc: "SPST-UCEBNA-14",
      adapter: "Intel(R) Ethernet Connection (17) I219-LM",
      pripona: "skola.local",
      mac: "B4-2E-99-1C-73-0A",
      adresa: "10.20.3.147",
      maska: MASKA,
      brana: "10.20.3.1",
      dns: ["10.20.0.5", "10.20.0.6"],
      dhcp: true,
      serverDhcp: "10.20.0.2",
      medium: true,
      apipa: false,
      d: { medium: true, lan: true, wan: true, internet: true, dns: true },
      preloz: (n) => SKOLNI_WEBY[n] ?? (n.endsWith(".local") ? null : ukazkovaAdresa(n)),
      mistni: (ip) => (ip === "10.20.3.1" ? 64 : ip.startsWith("10.20.") ? 128 : null),
      jeMistni: (ip) => ip.startsWith("10.20.3."),
      vnitrni: ["10.20.0.1", "10.20.0.2", "10.20.0.5", "10.20.0.6", ...Object.values(SKOLNI_WEBY)],
      cesta: ["10.20.3.1", "10.20.0.1", ...PRES_POSKYTOVATELE],
    };
  }
  const u = ucinne(sit);
  const d = diagnoza(sit);
  return {
    domaci: true,
    nazevPc: "DOMACI-PC",
    adapter: "Realtek PCIe GbE Family Controller",
    pripona: "",
    mac: MAC_PC,
    adresa: u.adresa,
    maska: u.maska,
    brana: u.brana,
    dns: u.dns ? [u.dns] : [],
    dhcp: sit.ip.prirazeni === "dhcp",
    serverDhcp: ROUTER,
    medium: u.medium,
    apipa: u.apipa,
    d,
    preloz: (n) => DOMACI_WEBY[n] ?? (n.endsWith(".example") || n.endsWith(".local") ? null : ukazkovaAdresa(n)),
    // Odpoví router a zařízení, která jsou právě v síti (zablokované ne).
    mistni: (ip) => {
      if (ip === u.adresa) return 128;
      if (ip === ROUTER) return 64;
      const z = sit.router.zarizeni.find((x) => x.adresa === ip && x.mac !== MAC_PC);
      return z && !sit.router.blokovane.includes(z.mac) ? 64 : null;
    },
    jeMistni: (ip) => /^192\.168\.1\.\d+$/.test(ip),
    vnitrni: [],
    cesta: [ROUTER, ...PRES_POSKYTOVATELE],
  };
}

/* ───────────────────── Příkazy ───────────────────── */

export interface VysledekSite {
  vystup: string[];
  stopy?: string[];
}

/** Řádky výpisu ipconfig přesně tak, jak je píše česká verze Windows. */
const PRESNE: Record<string, string> = {
  "Přípona DNS podle připojení": "   Přípona DNS podle připojení . . . : ",
  "Místní IPv6 adresa Link-local": "   Místní IPv6 adresa Link-local  . . : ",
  "Adresa IPv4": "   Adresa IPv4. . . . . . . . . . . .: ",
  "Maska podsítě": "   Maska podsítě  . . . . . . . . . .: ",
  "Výchozí brána": "   Výchozí brána  . . . . . . . . . .: ",
};
const SIRKA = PRESNE["Adresa IPv4"].length;

/** Popisek zarovnaný tečkami na pevnou šířku, jako ve Windows. */
const tecky = (popis: string) => {
  if (PRESNE[popis]) return PRESNE[popis];
  let s = `   ${popis} `;
  while (s.length < SIRKA - 2) s += s.length % 2 ? " " : ".";
  return `${s}: `;
};

/** ipconfig a ipconfig /all. */
export function ipconfig(sit: SitStav | undefined, argumenty: string[]): VysledekSite {
  const s = svet(sit);
  const vse = argumenty.some((a) => a.toLowerCase() === "/all");
  const vystup = ["", "Konfigurace protokolu IP systému Windows", ""];
  if (vse) {
    vystup.push(
      `${tecky("Název hostitele")}${s.nazevPc}`,
      `${tecky("Primární přípona DNS")}`,
      `${tecky("Typ uzlu")}Hybridní`,
      `${tecky("Směrování IP povoleno")}Ne`,
      "",
    );
  }
  vystup.push("", "Adaptér sítě Ethernet Ethernet:", "");
  const popisAdapteru = () => {
    if (!vse) return;
    vystup.push(
      `${tecky("Popis")}${s.adapter}`,
      `${tecky("Fyzická adresa")}${s.mac}`,
      `${tecky("Protokol DHCP povolen")}${s.dhcp ? "Ano" : "Ne"}`,
      `${tecky("Automatická konfigurace povolena")}Ano`,
    );
  };
  const stopy = vse ? ["prikaz:ipconfig", "prikaz:ipconfig-all"] : ["prikaz:ipconfig"];
  // Kabel nikam nevede (nebo router nemá proud): Windows adresu vůbec nevypíše.
  if (!s.medium) {
    vystup.push(`${tecky("Stav média")}Médium odpojeno`, `${tecky("Přípona DNS podle připojení")}${s.pripona}`);
    popisAdapteru();
    vystup.push("");
    return { vystup, stopy };
  }
  vystup.push(`${tecky("Přípona DNS podle připojení")}${s.pripona}`);
  popisAdapteru();
  vystup.push(`${tecky("Místní IPv6 adresa Link-local")}fe80::14c2:8b3f:9a21:5d07%12`);
  vystup.push(`${tecky(s.apipa ? "Adresa IPv4 automatické konfigurace" : "Adresa IPv4")}${s.adresa}${vse ? "(Upřednostňováno)" : ""}`);
  vystup.push(`${tecky("Maska podsítě")}${s.maska}`);
  vystup.push(`${tecky("Výchozí brána")}${s.brana}`);
  if (vse) {
    if (s.dhcp && !s.apipa) vystup.push(`${tecky("Server DHCP")}${s.serverDhcp}`);
    if (s.dns.length) vystup.push(`${tecky("Servery DNS")}${s.dns[0]}`);
    for (const dalsi of s.dns.slice(1)) vystup.push(`${" ".repeat(SIRKA)}${dalsi}`);
    vystup.push(`${tecky("NetBIOS přes TCP/IP")}Povoleno`);
  }
  vystup.push("");
  // Zakázka „Připoj počítač“: ověřit si v ipconfig, že počítač adresu dostal.
  if (s.domaci && s.d.lan) stopy.push("overeno:ipconfig-adresa");
  return { vystup, stopy };
}

const jePrepinac = (a: string) => a.startsWith("/") || a.startsWith("-");

function nenasel(prikaz: string, kam: string): string[] {
  return prikaz === "ping"
    ? [`Žádost Ping nemohla najít hostitele ${kam}. Zkontrolujte název a zkuste to znovu.`]
    : [`Nelze přeložit název cílového systému ${kam}.`];
}

/** Přeloží cíl příkazu na adresu. `chyba` = název se přeložit nepodařilo. */
function cil(s: Svet, kam: string): { ip: string; nazev?: string } | { chyba: true } {
  const k = kam.toLowerCase();
  if (jeIpv4(k)) return { ip: k };
  if (k === "localhost") return { ip: "127.0.0.1", nazev: s.nazevPc };
  if (!jeNazev(k) || !s.d.dns) return { chyba: true };
  const ip = s.preloz(k);
  return ip ? { ip, nazev: k } : { chyba: true };
}

export function ping(sit: SitStav | undefined, argumenty: string[]): VysledekSite {
  const kam = argumenty.find((a) => !jePrepinac(a)) ?? "";
  if (!kam) return { vystup: ["Chybná syntaxe příkazu."] };
  const s = svet(sit);
  const c = cil(s, kam);
  if ("chyba" in c) return { vystup: nenasel("ping", kam) };

  const hlavicka = c.nazev ? `${c.nazev} [${c.ip}]` : c.ip;
  const zacatek = ["", `Příkaz PING na ${hlavicka} s délkou 32 bajtů:`];
  const statistika = (prijato: number, casy: number[]) => {
    const radky = [
      "",
      `Statistika ping pro ${c.ip}:`,
      `    Pakety: Odeslané = 4, Přijaté = ${prijato}, Ztracené = ${4 - prijato} (ztráta ${Math.round(((4 - prijato) / 4) * 100)}%),`,
    ];
    if (casy.length) {
      const min = Math.min(...casy);
      const max = Math.max(...casy);
      const prumer = Math.round(casy.reduce((a, b) => a + b, 0) / casy.length);
      radky.push("Přibližná doba do přijetí odezvy v milisekundách:",`    Minimum = ${min}ms, Maximum = ${max}ms, Průměr = ${prumer}ms`);
    }
    return [...radky, ""];
  };

  // Vlastní stroj.
  if (c.ip === "127.0.0.1" || c.ip === s.adresa) {
    return {
      vystup: [...zacatek, ...Array(4).fill(`Odpověď od ${c.ip}: bajty=32 čas<1ms TTL=128`), ...statistika(4, [0, 0, 0, 0])],
    };
  }

  // Bez platné adresy v síti počítač nic neodešle.
  if (!s.d.lan) {
    return { vystup: [...zacatek, ...Array(4).fill("Selhání obecné."), ...statistika(0, [])] };
  }

  const odpovez = (ttl: number, casy: number[], stopy: string[]): VysledekSite => ({
    vystup: [...zacatek, ...casy.map((t) => `Odpověď od ${c.ip}: bajty=32 čas${t < 1 ? "<1" : `=${t}`}ms TTL=${ttl}`), ...statistika(4, casy)],
    stopy,
  });
  /* Cíl nikdo nezvedá: Windows pak vypíše odpověď od SEBE (nedosažitelný
     cíl), a protože nějaká odpověď přišla, počítá pakety jako přijaté. To je
     skutečné chování a dobrá chyták pro třídu. */
  const nedostupny = (): VysledekSite => ({
    vystup: [...zacatek, ...Array(4).fill(`Odpověď od ${s.adresa}: Cílový hostitel není dostupný.`), ...statistika(4, [])],
  });

  if (s.jeMistni(c.ip)) {
    const ttl = s.mistni(c.ip);
    if (ttl === null) return nedostupny();
    // Zakázka „Ověř spojení s routerem“: doma je to router i při špatně zadané bráně.
    return odpovez(ttl, [1, 1, 2, 1], c.ip === (s.domaci ? ROUTER : s.brana) ? ["ping:brana:ok"] : []);
  }

  // Do internetu se jde přes bránu. Špatná brána = pakety nemají kudy.
  // Správná brána bez spojení s poskytovatelem: router pakety vezme, ale
  // dál je poslat nemůže a odpověď nepřijde.
  const casovyLimit = (): VysledekSite => ({
    vystup: [...zacatek, ...Array(4).fill("Vypršel časový limit žádosti."), ...statistika(0, [])],
  });
  if (!s.d.internet) return s.brana === ROUTER && s.domaci ? casovyLimit() : nedostupny();
  if (s.vnitrni.includes(c.ip)) return odpovez(127, [1, 1, 1, 1], []);
  // Soukromá adresa mimo vlastní síť: router ji pošle dál a nikdo neodpoví.
  if (soukroma(c.ip)) return casovyLimit();
  return odpovez(55, [12, 11, 13, 12], ["ping:internet:ok"]);
}

export function nslookup(sit: SitStav | undefined, argumenty: string[]): VysledekSite {
  const kam = argumenty.find((a) => !jePrepinac(a));
  if (!kam) {
    return {
      vystup: [
        "(Zjednodušeno – interaktivní režim příkazu nslookup simulace neumí.)",
        "Napiš nslookup a název webu, třeba: nslookup skola.example",
      ],
    };
  }
  const s = svet(sit);
  const server = s.dns[0];
  const hlavicka = [`Server:  ${s.domaci ? "UnKnown" : "dns1.skola.local"}`, `Address:  ${server}`, ""];
  if (!s.d.dns) {
    return {
      vystup: [
        "Vypršel časový limit požadavku DNS.",
        "    časový limit byl 2 s.",
        ...hlavicka,
        "Vypršel časový limit požadavku DNS.",
        "    časový limit byl 2 s.",
        `*** Vypršel časový limit požadavku na server ${s.domaci ? "UnKnown" : "dns1.skola.local"}.`,
        "",
      ],
    };
  }
  const k = kam.toLowerCase();
  const ip = jeIpv4(k) ? null : s.preloz(k);
  if (!ip) {
    return { vystup: [...hlavicka, `*** ${s.domaci ? "UnKnown" : "dns1.skola.local"} nemůže najít ${kam}: Non-existent domain`, ""] };
  }
  return {
    vystup: [...hlavicka, "Neautoritativní odpověď:", `Název:    ${k}`, `Address:  ${ip}`, ""],
    stopy: ["nslookup:ok"],
  };
}

export function tracert(sit: SitStav | undefined, argumenty: string[]): VysledekSite {
  const kam = argumenty.find((a) => !jePrepinac(a));
  if (!kam) return { vystup: ["", "Použití: tracert [-d] [-h maximální_počet_směrování] cílový_název", ""] };
  const s = svet(sit);
  const c = cil(s, kam);
  if ("chyba" in c) return { vystup: nenasel("tracert", kam) };

  const radek = (n: number, casy: string, ip: string) => `${String(n).padStart(3)}  ${casy}  ${ip}`;
  const ms = (t: number) => (t < 1 ? "   <1 ms" : `${String(t).padStart(5)} ms`);
  const vystup = [
    "",
    `Výpis trasy k ${c.nazev ? `${c.nazev} [${c.ip}]` : c.ip}`,
    "s nejvýše 30 směrováními:",
    "",
  ];

  if (!s.d.lan) {
    vystup.push("Selhání obecné.", "");
    return { vystup };
  }
  if (s.jeMistni(c.ip)) {
    if (s.mistni(c.ip) === null) {
      vystup.push(`  1     ${s.adresa}  hlásí: Cílový hostitel není dostupný.`);
    } else {
      vystup.push(radek(1, `${ms(0)}${ms(0)}${ms(0)}`, c.ip));
    }
    vystup.push("", "Trasování bylo dokončeno.", "");
    return { vystup };
  }
  if (!s.d.internet && s.domaci && s.brana === ROUTER) {
    // Router odpoví, za ním už nikdo – kabel k poskytovateli nevede.
    vystup.push(
      radek(1, `${ms(1)}${ms(1)}${ms(1)}`, ROUTER),
      "  2     *        *        *     Vypršel časový limit žádosti.",
      "  3     *        *        *     Vypršel časový limit žádosti.",
      "(Zjednodušeno – skutečný tracert by takhle zkoušel až 30 směrování.)",
      "",
    );
    return { vystup };
  }
  if (!s.d.internet) {
    vystup.push(`  1     ${s.adresa}  hlásí: Cílový hostitel není dostupný.`, "", "Trasování bylo dokončeno.", "");
    return { vystup };
  }
  if (s.vnitrni.includes(c.ip)) {
    vystup.push(radek(1, `${ms(0)}${ms(0)}${ms(0)}`, s.brana), radek(2, `${ms(1)}${ms(1)}${ms(1)}`, c.ip));
    vystup.push("", "Trasování bylo dokončeno.", "");
    return { vystup };
  }
  if (soukroma(c.ip)) {
    vystup.push(
      radek(1, `${ms(0)}${ms(0)}${ms(0)}`, s.brana),
      "  2     *        *        *     Vypršel časový limit žádosti.",
      "  3     *        *        *     Vypršel časový limit žádosti.",
      "(Zjednodušeno – skutečný tracert by takhle zkoušel až 30 směrování.)",
      "",
    );
    return { vystup };
  }
  const zastavky = [...s.cesta, c.ip];
  zastavky.forEach((ip, i) => {
    const zaklad = i === 0 ? 0 : 3 + i * 3;
    vystup.push(radek(i + 1, `${ms(zaklad)}${ms(zaklad + (i ? 1 : 0))}${ms(zaklad)}`, ip));
  });
  vystup.push("", "Trasování bylo dokončeno.", "");
  return { vystup, stopy: ["tracert:ok"] };
}

/* ───────────────────── Chyby při opravě ───────────────────── */

/**
 * Číselník chyb, které simulace pozná JISTĚ – z toho, co žák udělal, ne
 * z toho, co si myslí (rada 31. 10. 2026: „popis chování, ne verdikt“).
 * Text je proto věta o činu. Id jsou krátká, nesou se v kódu postupu.
 */
export const CHYBY_SITE: Record<string, { text: string; rada: string }> = {
  db: {
    text: "Při poruše brány měnil(a) server DNS",
    rada: "Když nejde ani ping na adresu v internetu, názvy za to nemůžou. Nejdřív ipconfig: sedí výchozí brána s adresou routeru?",
  },
  id: {
    text: "Při poruše DNS měnil(a) adresu IP nebo bránu",
    rada: "Když ping na adresu funguje a na název ne, cesta do internetu je v pořádku. Porucha je v překladu názvů – v serveru DNS.",
  },
  rr: {
    text: "Uložil(a) ruční nastavení, se kterým síť přestala fungovat",
    rada: "Ruční nastavení se musí opsat přesně. Doma je skoro vždycky správně Automaticky (DHCP).",
  },
};

/** Trvá ještě závada, kterou porucha způsobila? */
function zavada(sit: SitStav, porucha: Porucha): boolean {
  const d = diagnoza(sit);
  switch (porucha) {
    case "kabel":
      return sit.kabely.lan === null;
    case "wan":
      return !sit.kabely.wan;
    case "dhcp":
      // Dočasná ruční adresa (kvůli přístupu do správy) musí zase zmizet.
      return !sit.router.dhcp || sit.ip.prirazeni !== "dhcp";
    case "brana":
      return !d.internet;
    case "dns":
      return d.internet && !d.dns;
  }
}

/**
 * Opravil žák právě spuštěnou poruchu? Závada musí zmizet A síť musí
 * fungovat. Obejít poruchu jinudy (ruční adresa místo zapnutého DHCP)
 * opravou není – ostatní zařízení v domě by adresu pořád nedostala.
 */
export function opravenaPorucha(sit: SitStav): Porucha | null {
  return sit.porucha && !zavada(sit, sit.porucha) && sitFunguje(sit) ? sit.porucha : null;
}

/** Která porucha je právě spuštěná a ještě neopravená. */
export function aktivniPorucha(sit: SitStav): Porucha | null {
  return sit.porucha && zavada(sit, sit.porucha) ? sit.porucha : null;
}

/** Jaké chyby zapsat po uložení nového nastavení sítě. */
export function chybyPriZmene(pred: SitStav, po: SitStav): string[] {
  const chyby: string[] = [];
  const porucha = aktivniPorucha(pred);
  const zmenaDns = JSON.stringify(pred.dns) !== JSON.stringify(po.dns);
  const zmenaIp = JSON.stringify(pred.ip) !== JSON.stringify(po.ip);
  if (porucha === "brana" && zmenaDns && !zmenaIp) chyby.push("db");
  if (porucha === "dns" && zmenaIp && !zmenaDns) chyby.push("id");
  const rucne = po.ip.prirazeni === "rucne" || po.dns.prirazeni === "rucne";
  if ((zmenaIp || zmenaDns) && rucne && sitFunguje(pred) && !sitFunguje(po)) chyby.push("rr");
  return chyby;
}
