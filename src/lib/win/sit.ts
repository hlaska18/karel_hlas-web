/**
 * Síť virtuálního počítače: odkud příkazy ipconfig, ping, nslookup a tracert
 * berou, co vypsat.
 *
 * Dva světy, každý drží jedna funkce níž:
 *
 * - ŠKOLA (výchozí /windows). Počítač v učebně, síť 10.20.x.x, nic se v ní
 *   nedá pokazit. Dřív `ping` na cokoli odpovídal ze školní brány 10.20.3.1,
 *   i `ping seznam.cz` – to nebyla pravda (rada 31. 10. 2026).
 * - DOMOV (cvičení `?scenar=sit`). Domácí síť 192.168.1.x za routerem, kterou
 *   jde v Nastavení pokazit a opravit: ruční přiřazení IP se špatnou bránou,
 *   ruční server DNS, který neexistuje.
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

export interface SitStav {
  ip: NastaveniIp;
  dns: NastaveniDns;
}

export type Porucha = "brana" | "dns";

/* ───────────────────── Domácí síť ───────────────────── */

export const ROUTER = "192.168.1.1";
const DOMACI_PC = "192.168.1.23";
const MASKA = "255.255.255.0";
/** Veřejná adresa domácnosti – pod ní router vystupuje do internetu. */
export const VEREJNA_ADRESA = "203.0.113.57";

/** Co by počítači přidělil router (DHCP). */
const DHCP: { adresa: string; maska: string; brana: string; dns: string } = {
  adresa: DOMACI_PC,
  maska: MASKA,
  brana: ROUTER,
  dns: ROUTER,
};

export const VYCHOZI_SIT: SitStav = {
  ip: { prirazeni: "dhcp", adresa: DOMACI_PC, maska: MASKA, brana: ROUTER },
  dns: { prirazeni: "dhcp", server: ROUTER },
};

/**
 * Pokažený počítač pro úlohy s poruchou. Obě poruchy jsou z praxe: ruční
 * nastavení, které někdo opsal špatně, nebo zbylo po jiné síti.
 */
export function sitSPoruchou(porucha: Porucha): SitStav {
  if (porucha === "brana") {
    return {
      ip: { prirazeni: "rucne", adresa: DOMACI_PC, maska: MASKA, brana: "192.168.1.254" },
      // Ruční IP ve Windows vyžaduje i ruční DNS – proto ruční, ale správně.
      dns: { prirazeni: "rucne", server: ROUTER },
    };
  }
  return {
    ip: { prirazeni: "dhcp", adresa: DOMACI_PC, maska: MASKA, brana: ROUTER },
    dns: { prirazeni: "rucne", server: "192.168.1.53" },
  };
}

/** Hodnoty, se kterými počítač opravdu pracuje (DHCP, nebo ruční). */
export function ucinne(sit: SitStav): { adresa: string; maska: string; brana: string; dns: string } {
  const ip = sit.ip.prirazeni === "dhcp" ? DHCP : sit.ip;
  const dns = sit.dns.prirazeni === "dhcp" ? DHCP.dns : sit.dns.server;
  return { adresa: ip.adresa, maska: ip.maska, brana: ip.brana, dns };
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function jeIpv4(text: string): boolean {
  const m = IPV4.exec(text.trim());
  return Boolean(m && m.slice(1).every((c) => Number(c) <= 255));
}

/** Soukromé rozsahy (10/8, 172.16/12, 192.168/16) a vlastní stroj. */
function soukroma(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Je adresa v domácí síti 192.168.1.0/24 a dá se použít pro počítač? */
function vDomaciSiti(ip: string): boolean {
  if (!jeIpv4(ip)) return false;
  const c = ip.split(".").map(Number);
  return c[0] === 192 && c[1] === 168 && c[2] === 1 && c[3] >= 2 && c[3] <= 254;
}

/** Zařízení, která v domácí síti opravdu existují. */
const DOMACI_ZARIZENI: Record<string, { ttl: number }> = {
  [ROUTER]: { ttl: 64 },
  "192.168.1.12": { ttl: 64 }, // telefon
  "192.168.1.20": { ttl: 64 }, // televize
};

export interface Diagnoza {
  /** Počítač má adresu ze správné sítě a dosáhne na router. */
  lan: boolean;
  /** Brána je router – pakety do internetu mají kudy odejít. */
  internet: boolean;
  /** Server DNS odpovídá – názvy webů se přeloží na adresy. */
  dns: boolean;
}

export function diagnoza(sit: SitStav): Diagnoza {
  const u = ucinne(sit);
  const lan = vDomaciSiti(u.adresa) && u.adresa !== ROUTER && u.maska === MASKA;
  const internet = lan && u.brana === ROUTER;
  // Server DNS v domácí síti odpovídá jen tehdy, když je to router. Veřejný
  // server (třeba ten od poskytovatele) funguje, když vede cesta do internetu.
  // Zjednodušeno: simulace bere každou veřejnou adresu jako fungující server DNS.
  const dns = jeIpv4(u.dns) && ((u.dns === ROUTER && lan) || (!soukroma(u.dns) && internet));
  return { lan, internet, dns };
}

/** Funguje síť tak, jak má (stránky v internetu se otevřou podle názvu)? */
export const sitFunguje = (sit: SitStav) => {
  const d = diagnoza(sit);
  return d.internet && d.dns;
};

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
      d: { lan: true, internet: true, dns: true },
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
    mac: "3C-52-82-1A-07-C4",
    adresa: u.adresa,
    maska: u.maska,
    brana: u.brana,
    dns: [u.dns],
    dhcp: sit.ip.prirazeni === "dhcp",
    serverDhcp: ROUTER,
    d,
    preloz: (n) => DOMACI_WEBY[n] ?? (n.endsWith(".example") || n.endsWith(".local") ? null : ukazkovaAdresa(n)),
    mistni: (ip) => (ip === u.adresa ? 128 : DOMACI_ZARIZENI[ip]?.ttl ?? null),
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
  vystup.push(`${tecky("Přípona DNS podle připojení")}${s.pripona}`);
  if (vse) {
    vystup.push(
      `${tecky("Popis")}${s.adapter}`,
      `${tecky("Fyzická adresa")}${s.mac}`,
      `${tecky("Protokol DHCP povolen")}${s.dhcp ? "Ano" : "Ne"}`,
      `${tecky("Automatická konfigurace povolena")}Ano`,
    );
  }
  vystup.push(`${tecky("Místní IPv6 adresa Link-local")}fe80::14c2:8b3f:9a21:5d07%12`);
  vystup.push(`${tecky("Adresa IPv4")}${s.adresa}${vse ? "(Upřednostňováno)" : ""}`);
  vystup.push(`${tecky("Maska podsítě")}${s.maska}`);
  vystup.push(`${tecky("Výchozí brána")}${s.brana}`);
  if (vse) {
    if (s.dhcp) vystup.push(`${tecky("Server DHCP")}${s.serverDhcp}`);
    vystup.push(`${tecky("Servery DNS")}${s.dns[0]}`);
    for (const dalsi of s.dns.slice(1)) vystup.push(`${" ".repeat(SIRKA)}${dalsi}`);
    vystup.push(`${tecky("NetBIOS přes TCP/IP")}Povoleno`);
  }
  vystup.push("");
  return { vystup, stopy: vse ? ["prikaz:ipconfig", "prikaz:ipconfig-all"] : ["prikaz:ipconfig"] };
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
      `    Pakety: Odeslané = 4, Přijaté = ${prijato}, Ztracené = ${4 - prijato} (${Math.round(((4 - prijato) / 4) * 100)}% ztráta),`,
    ];
    if (casy.length) {
      const min = Math.min(...casy);
      const max = Math.max(...casy);
      const prumer = Math.round(casy.reduce((a, b) => a + b, 0) / casy.length);
      radky.push("Přibližná doba cesty v milisekundách:", `    Minimum = ${min}ms, Maximum = ${max}ms, Průměr = ${prumer}ms`);
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
    // Úloha „Ověř spojení s routerem“: doma je to router i při špatně zadané bráně.
    return odpovez(ttl, [1, 1, 2, 1], c.ip === (s.domaci ? ROUTER : s.brana) ? ["ping:brana:ok"] : []);
  }

  // Do internetu se jde přes bránu. Špatná brána = pakety nemají kudy.
  if (!s.d.internet) return nedostupny();
  if (s.vnitrni.includes(c.ip)) return odpovez(127, [1, 1, 1, 1], []);
  // Soukromá adresa mimo vlastní síť: router ji pošle dál a nikdo neodpoví.
  if (soukroma(c.ip)) {
    return { vystup: [...zacatek, ...Array(4).fill("Vypršel časový limit žádosti."), ...statistika(0, [])] };
  }
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

/** Která porucha je právě spuštěná a ještě neopravená. */
export function aktivniPorucha(sit: SitStav, stopy: string[]): Porucha | null {
  const d = diagnoza(sit);
  if (stopy.includes("porucha:brana:spustena") && !d.internet) return "brana";
  if (stopy.includes("porucha:dns:spustena") && d.internet && !d.dns) return "dns";
  return null;
}

/** Jaké chyby zapsat po uložení nového nastavení sítě. */
export function chybyPriZmene(pred: SitStav, po: SitStav, stopy: string[]): string[] {
  const chyby: string[] = [];
  const porucha = aktivniPorucha(pred, stopy);
  const zmenaDns = JSON.stringify(pred.dns) !== JSON.stringify(po.dns);
  const zmenaIp = JSON.stringify(pred.ip) !== JSON.stringify(po.ip);
  if (porucha === "brana" && zmenaDns && !zmenaIp) chyby.push("db");
  if (porucha === "dns" && zmenaIp && !zmenaDns) chyby.push("id");
  const rucne = po.ip.prirazeni === "rucne" || po.dns.prirazeni === "rucne";
  if (rucne && sitFunguje(pred) && !sitFunguje(po)) chyby.push("rr");
  return chyby;
}
