import { describe, expect, it } from "vitest";
import { reducer, type Akce } from "@/lib/win/reducer";
import { vychoziStav, type Stav } from "@/lib/win/stav";
import { SCENAR_SIT } from "@/lib/win/scenare";
import { UKOLY, UKOLY_SIT, postup, vyhodnot } from "@/lib/win/ukoly";
import { strankaSit } from "@/lib/win/web";
import { najdiSlozku, rozloz } from "@/lib/win/fs";
import {
  APIPA,
  CIZI,
  STITEK,
  VYCHOZI_SIT,
  diagnoza,
  doplnSit,
  ipconfig,
  nslookup,
  ping,
  sitSPoruchou,
  tracert,
  type SitStav,
} from "@/lib/win/sit";
import {
  dekodujSimulator,
  najdiKodySimulatoru,
  sloucitSimulatory,
  zakodujSimulator,
} from "@/lib/postupSimulatoru";

const proved = (stav: Stav, ...akce: Akce[]): Stav => akce.reduce(reducer, stav);

/** Výpis ipconfig z doby před cvičením sítě (shell.ts, commit 7919196). */
const STARY_IPCONFIG = [
  "",
  "Konfigurace protokolu IP systému Windows",
  "",
  "",
  "Adaptér sítě Ethernet Ethernet:",
  "",
  "   Přípona DNS podle připojení . . . : skola.local",
  "   Místní IPv6 adresa Link-local  . . : fe80::14c2:8b3f:9a21:5d07%12",
  "   Adresa IPv4. . . . . . . . . . . .: 10.20.3.147",
  "   Maska podsítě  . . . . . . . . . .: 255.255.255.0",
  "   Výchozí brána  . . . . . . . . . .: 10.20.3.1",
  "",
];

describe("příkazy sítě ve výchozí simulaci (škola)", () => {
  it("ipconfig vypíše přesně to, co dřív", () => {
    expect(ipconfig(undefined, []).vystup).toEqual(STARY_IPCONFIG);
    expect(ipconfig(undefined, []).stopy).toEqual(["prikaz:ipconfig"]);
    // /all splní i starou úlohu „Zjisti adresu“.
    expect(ipconfig(undefined, ["/all"]).stopy).toContain("prikaz:ipconfig");
  });

  it("ping už neodpovídá z brány za každý cíl", () => {
    const v = ping(undefined, ["skola.local"]).vystup.join("\n");
    expect(v).toContain("[10.20.0.10]");
    expect(v).not.toContain("Odpověď od 10.20.3.1");
    expect(ping(undefined, ["neexistuje.local"]).vystup.join("\n")).toContain("nemohla najít hostitele");
  });

  it("adresy v internetu jsou jen z ukázkových rozsahů", () => {
    const vse = [
      ...ping(undefined, ["seznam.cz"]).vystup,
      ...tracert(undefined, ["seznam.cz"]).vystup,
      ...nslookup(undefined, ["seznam.cz"]).vystup,
    ].join("\n");
    const verejne = (vse.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) ?? []).filter(
      (ip) => !ip.startsWith("10.") && !ip.startsWith("127."),
    );
    expect(verejne.length).toBeGreaterThan(0);
    verejne.forEach((ip) => expect(ip).toMatch(/^(198\.51\.100|203\.0\.113)\./));
  });
});

describe("domácí síť a poruchy", () => {
  it("výchozí domácí síť funguje", () => {
    expect(diagnoza(VYCHOZI_SIT)).toEqual({ medium: true, lan: true, wan: true, internet: true, dns: true });
    expect(ping(VYCHOZI_SIT, ["skola.example"]).stopy).toContain("ping:internet:ok");
    expect(strankaSit("skola.example", VYCHOZI_SIT).adresa).toBe("skola.example");
  });

  it("porucha brány: router odpoví, internet ne", () => {
    const sit = sitSPoruchou("brana");
    expect(diagnoza(sit).internet).toBe(false);
    expect(ping(sit, ["192.168.1.1"]).stopy).toContain("ping:brana:ok");
    expect(ping(sit, ["skola.example"]).stopy ?? []).not.toContain("ping:internet:ok");
    expect(strankaSit("skola.example", sit).adresa).toBeNull();
  });

  it("porucha DNS: adresa projde, název ne", () => {
    const sit = sitSPoruchou("dns");
    expect(diagnoza(sit)).toMatchObject({ lan: true, internet: true, dns: false });
    expect(ping(sit, ["203.0.113.10"]).stopy).toContain("ping:internet:ok");
    expect(ping(sit, ["skola.example"]).stopy ?? []).not.toContain("ping:internet:ok");
    expect(strankaSit("skola.example", sit).html).toContain("ERR_NAME_NOT_RESOLVED");
    expect(strankaSit("203.0.113.10", sit).adresa).toBe("skola.example");
  });
});

describe("kabely, DHCP a poskytovatel", () => {
  it("bez kabelu ipconfig hlásí odpojené médium a nic nejde", () => {
    const sit = sitSPoruchou("kabel");
    expect(ipconfig(sit, []).vystup.join("\n")).toContain("Médium odpojeno");
    expect(ipconfig(sit, []).vystup.join("\n")).not.toContain("Adresa IPv4");
    expect(ping(sit, ["192.168.1.1"]).stopy ?? []).not.toContain("ping:brana:ok");
  });

  it("vypnuté DHCP: počítač si dá adresu 169.254.x.x a bez brány", () => {
    const sit = sitSPoruchou("dhcp");
    const v = ipconfig(sit, []).vystup.join("\n");
    expect(v).toContain(APIPA);
    expect(diagnoza(sit).lan).toBe(false);
    // Ruční adresa síť rozjede, ale poruchu neopraví – router dál nepřiděluje.
    const obejito: SitStav = { ...sit, ip: { prirazeni: "rucne", adresa: "192.168.1.50", maska: "255.255.255.0", brana: "192.168.1.1" } };
    expect(diagnoza(obejito).internet).toBe(true);
  });

  it("bez kabelu WAN odpoví router, dál nic, a názvy se nepřeloží", () => {
    const sit = sitSPoruchou("wan");
    expect(ping(sit, ["192.168.1.1"]).stopy).toContain("ping:brana:ok");
    expect(ping(sit, ["203.0.113.10"]).vystup.join("\n")).toContain("Vypršel časový limit žádosti.");
    expect(ping(sit, ["skola.example"]).vystup.join("\n")).toContain("nemohla najít hostitele");
    expect(tracert(sit, ["203.0.113.10"]).vystup.join("\n")).toContain("192.168.1.1");
  });

  it("zablokované zařízení na ping neodpoví", () => {
    const sit: SitStav = { ...VYCHOZI_SIT, router: { ...VYCHOZI_SIT.router, zarizeni: [...VYCHOZI_SIT.router.zarizeni, CIZI] } };
    expect(ping(sit, [CIZI.adresa]).vystup.join("\n")).toContain("bajty=32");
    const blok: SitStav = { ...sit, router: { ...sit.router, blokovane: [CIZI.mac] } };
    expect(ping(blok, [CIZI.adresa]).vystup.join("\n")).toContain("není dostupný");
  });

  it("starší uložený stav bez routeru se doplní", () => {
    const stary = { ip: VYCHOZI_SIT.ip, dns: VYCHOZI_SIT.dns } as Partial<SitStav>;
    expect(doplnSit(stary)).toEqual(VYCHOZI_SIT);
  });
});

describe("úlohy s poruchou v reduceru", () => {
  const dhcp: SitStav = VYCHOZI_SIT;

  it("oprava porucha brány splní úlohu, špatný krok se zapíše jako chyba", () => {
    let s = proved(vychoziStav(SCENAR_SIT), { typ: "sit/porucha", porucha: "brana" });
    expect(vyhodnot(s)).not.toContain("sit-porucha-brana");
    // Žák nejdřív sahá na DNS – to je při poruše brány vedle.
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, dns: { prirazeni: "rucne", server: "198.51.100.53" } } });
    expect(s.chyby).toEqual({ db: 1 });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, ip: dhcp.ip } });
    expect(s.stopy).toContain("porucha:brana:opravena");
    expect(vyhodnot(s)).toContain("sit-porucha-brana");
  });

  it("vrácení do výchozího stavu poruchu neopraví za žáka a chyby nesmaže", () => {
    let s = proved(vychoziStav(SCENAR_SIT), { typ: "sit/porucha", porucha: "dns" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, ip: { ...s.sit!.ip, prirazeni: "rucne", brana: "192.168.1.2" } } });
    expect(s.chyby).toEqual({ id: 1 });
    s = proved(s, { typ: "napoveda", id: "sit-porucha-dns" }, { typ: "system/reset" });
    expect(vyhodnot(s)).not.toContain("sit-porucha-dns");
    expect(s.chyby).toEqual({ id: 1 });
    expect(s.napovedy).toEqual({ "sit-porucha-dns": 1 });
  });

  it("ruční nastavení, se kterým síť přestane fungovat, je chyba rr", () => {
    const s = proved(vychoziStav(SCENAR_SIT), {
      typ: "sit/nastav",
      sit: { ...dhcp, ip: { prirazeni: "rucne", adresa: "192.168.1.23", maska: "255.255.255.0", brana: "192.168.1.100" } },
    });
    expect(s.chyby).toEqual({ rr: 1 });
  });

  it("vytažený kabel u ruční adresy není chyba ručního nastavení", () => {
    let s = proved(vychoziStav(SCENAR_SIT), {
      typ: "sit/nastav",
      sit: { ...dhcp, ip: { prirazeni: "rucne", adresa: "192.168.1.40", maska: "255.255.255.0", brana: "192.168.1.1" } },
    });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, kabely: { ...s.sit!.kabely, lan: null } } });
    expect(s.chyby).toEqual({});
  });

  it("poruchy kabel, DHCP a WAN se opraví u routeru", () => {
    let s = proved(vychoziStav(SCENAR_SIT), { typ: "sit/porucha", porucha: "kabel" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, kabely: { ...s.sit!.kabely, lan: 3 } } });
    expect(vyhodnot(s)).toContain("sit-porucha-kabel");

    s = proved(s, { typ: "sit/porucha", porucha: "dhcp" });
    // Obejít to ruční adresou nestačí.
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, ip: { prirazeni: "rucne", adresa: "192.168.1.50", maska: "255.255.255.0", brana: "192.168.1.1" } } });
    expect(vyhodnot(s)).not.toContain("sit-porucha-dhcp");
    // S ruční adresou se dostane do správy a zapne DHCP – ale hotovo je až s Automaticky.
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, router: { ...s.sit!.router, dhcp: true } } });
    expect(vyhodnot(s)).not.toContain("sit-porucha-dhcp");
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, ip: dhcp.ip } });
    expect(vyhodnot(s)).toContain("sit-porucha-dhcp");

    s = proved(s, { typ: "sit/porucha", porucha: "wan" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, kabely: { ...s.sit!.kabely, wan: true } } });
    expect(vyhodnot(s)).toContain("sit-porucha-wan");
  });
});

describe("scénáře Nový router a Cizí zařízení", () => {
  it("výchozí zapojená síť úlohy routeru nesplní, dokud scénář nezačne", () => {
    const s = vychoziStav(SCENAR_SIT);
    s.stopy = ["overeno:ipconfig-adresa", "overeno:router-prihlaseni"];
    expect(vyhodnot(s).filter((id) => id.startsWith("sit-router"))).toEqual([]);
  });

  it("nový router: zapojit, připojit počítač, správa, heslo, Wi-Fi", () => {
    let s = proved(vychoziStav(SCENAR_SIT), { typ: "stopa", klic: "overeno:ipconfig-adresa" }, { typ: "sit/situace", situace: "router" });
    // Stará ověření po novém začátku neplatí.
    expect(s.stopy).not.toContain("overeno:ipconfig-adresa");
    expect(ipconfig(s.sit, []).vystup.join("\n")).toContain("Médium odpojeno");
    // Novou Wi-Fi zatím nikdo nezná – v routeru je jen počítač na kabelu.
    expect(s.sit!.router.zarizeni.map((z) => z.nazev)).toEqual(["DOMACI-PC"]);
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, kabely: { napajeni: true, wan: true, lan: null } } });
    expect(vyhodnot(s)).toContain("sit-router-zapoj");
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, kabely: { ...s.sit!.kabely, lan: 2 } } });
    for (const k of ipconfig(s.sit, []).stopy ?? []) s = proved(s, { typ: "stopa", klic: k });
    expect(vyhodnot(s)).toContain("sit-router-pc");
    s = proved(s, { typ: "stopa", klic: "overeno:router-prihlaseni" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, router: { ...s.sit!.router, adminHeslo: "nove-heslo-1" } } });
    s = proved(s, {
      typ: "sit/nastav",
      sit: { ...s.sit!, router: { ...s.sit!.router, wifi: { nazev: "Doma", zabezpeceni: "wpa3", heslo: "dlouhe-heslo-12" } } },
    });
    const hotove = vyhodnot(s);
    expect(hotove).toEqual(expect.arrayContaining(["sit-router-sprava", "sit-router-heslo", "sit-router-wifi"]));
  });

  it("Wi-Fi s továrním heslem nebo jen WPA2 úlohu nesplní", () => {
    let s = proved(vychoziStav(SCENAR_SIT), { typ: "sit/situace", situace: "router" });
    s = proved(s, {
      typ: "sit/nastav",
      sit: { ...s.sit!, router: { ...s.sit!.router, wifi: { nazev: "Doma", zabezpeceni: "wpa2", heslo: "dlouhe-heslo-12" } } },
    });
    expect(vyhodnot(s)).not.toContain("sit-router-wifi");
    s = proved(s, {
      typ: "sit/nastav",
      sit: { ...s.sit!, router: { ...s.sit!.router, wifi: { nazev: "Doma", zabezpeceni: "wpa3", heslo: STITEK.wifiHeslo } } },
    });
    expect(vyhodnot(s)).not.toContain("sit-router-wifi");
  });

  it("cizí zařízení: zablokovat, heslo, WPS, hosté", () => {
    let s = proved(vychoziStav(SCENAR_SIT), { typ: "sit/situace", situace: "cizi" });
    expect(s.sit!.router.zarizeni).toContainEqual(CIZI);
    const r = s.sit!.router;
    s = proved(s, {
      typ: "sit/nastav",
      sit: {
        ...s.sit!,
        router: {
          ...r,
          blokovane: [CIZI.mac],
          wifi: { ...r.wifi, zabezpeceni: "wpa2-wpa3", heslo: "jine-dlouhe-heslo" },
          wps: false,
          host: { zapnuto: true, heslo: "pro-navstevu" },
        },
      },
    });
    expect(vyhodnot(s)).toEqual(expect.arrayContaining(["sit-cizi-zablokuj", "sit-cizi-heslo", "sit-cizi-wps", "sit-cizi-host"]));
  });
});

describe("sada úloh a kód WSIT1", () => {
  it("cvičení má vlastní úlohy, výchozí sada se nemění", () => {
    expect(UKOLY).toHaveLength(33);
    expect(UKOLY_SIT.every((u) => u.id.startsWith("sit-"))).toBe(true);
    expect(new Set(UKOLY_SIT.map((u) => u.id)).size).toBe(UKOLY_SIT.length);
    expect(postup([], SCENAR_SIT).celkem).toBe(UKOLY_SIT.length);
    // Ve výchozím scénáři se úlohy sítě neodškrtnou, ani když stopa sedí.
    const s = vychoziStav();
    s.stopy = ["prikaz:ipconfig-all"];
    expect(vyhodnot(s)).not.toContain("sit-ipconfig");
  });

  it("kód nese chyby, staré kódy je nedostanou", () => {
    const kod = zakodujSimulator({
      simulator: "sit",
      jmeno: "Jana Nováková",
      datum: "2026-11-02",
      splneno: ["sit-ipconfig"],
      celkem: UKOLY_SIT.length,
      chyby: { db: 2 },
    });
    expect(kod.startsWith("WSIT1-")).toBe(true);
    expect(dekodujSimulator(kod)?.chyby).toEqual({ db: 2 });
    const bezChyb = zakodujSimulator({ simulator: "sit", jmeno: "Petr", datum: "2026-11-02", splneno: [], celkem: 8 });
    expect(dekodujSimulator(bezChyb)).not.toHaveProperty("chyby");
    const win = zakodujSimulator({ simulator: "windows", jmeno: "Eva", datum: "2026-11-02", splneno: [], celkem: 33 });
    expect(dekodujSimulator(win)).not.toHaveProperty("chyby");
  });

  it("neznámé chyby a nesmysly se zahodí, sloučení bere nejvyšší počet", () => {
    const a = zakodujSimulator({ simulator: "sit", jmeno: "Jana", datum: "2026-11-02", splneno: ["sit-ipconfig"], celkem: 8, chyby: { db: 1 } });
    const b =
      "WSIT1-" +
      Buffer.from(JSON.stringify({ j: "Jana", d: "2026-11-03", h: ["sit-tracert"], c: 8, ch: { db: 3, xx: 5, id: "hodne" } }))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const zaci = sloucitSimulatory(najdiKodySimulatoru(`${a}\n${b}`));
    expect(zaci).toHaveLength(1);
    expect(zaci[0].chyby).toEqual({ db: 3 });
    expect(zaci[0].splneno).toEqual(["sit-ipconfig", "sit-tracert"]);
  });
});

describe("síťové úlohy v běžném seznamu Windows", () => {
  const sitove = (s: Stav) => vyhodnot(s).filter((id) => id.startsWith("sit-"));

  it("výchozí počítač je ve škole a výchozí počet zůstává 33", () => {
    const s = vychoziStav();
    expect(s.sit).toBeUndefined();
    expect(UKOLY).toHaveLength(33);
    expect(postup(UKOLY_SIT.map((u) => u.id), s.scenar)).toEqual({ hotovo: 0, celkem: 33 });
  });

  it("příkazy spuštěné ve škole se nepočítají ani po přenesení domů", () => {
    let s = proved(vychoziStav(), { typ: "stopa", klic: "prikaz:ipconfig-all" }, { typ: "stopa", klic: "prikaz:ipconfig" });
    expect(sitove(s)).toEqual([]);
    s = proved(s, { typ: "sit/domov" });
    expect(s.sit).toEqual(VYCHOZI_SIT);
    expect(sitove(s)).toEqual([]);
    // Výchozí úloha o ipconfig tím o svůj doklad nepřijde.
    expect(s.stopy).toContain("prikaz:ipconfig");
    s = proved(s, { typ: "stopa", klic: "prikaz:ipconfig-all" });
    expect(sitove(s)).toEqual(["sit-ipconfig"]);
  });

  it("porucha i scénář přenesou počítač domů samy a návrat do školy síť vypne", () => {
    expect(proved(vychoziStav(), { typ: "sit/porucha", porucha: "dns" }).sit?.porucha).toBe("dns");
    const s = proved(vychoziStav(), { typ: "sit/situace", situace: "router" });
    expect(s.sit?.kabely.wan).toBe(false);
    expect(proved(s, { typ: "sit/skola" }).sit).toBeUndefined();
  });

  it("porucha ukončí scénář, takže neodškrtne „Zapoj router“", () => {
    for (const start of [vychoziStav(), vychoziStav(SCENAR_SIT)]) {
      const s = proved(start, { typ: "sit/situace", situace: "router" }, { typ: "sit/porucha", porucha: "kabel" });
      expect(s.stopy).not.toContain("situace:router:spustena");
      expect(vyhodnot(s)).not.toContain("sit-router-zapoj");
    }
    // Ve scénáři samotném se počítá dál.
    const s = proved(vychoziStav(), { typ: "sit/situace", situace: "router" });
    const zapojeno = proved(s, { typ: "sit/nastav", sit: { ...s.sit!, kabely: { ...s.sit!.kabely, napajeni: true, wan: true } } });
    expect(vyhodnot(zapojeno)).toContain("sit-router-zapoj");
  });

  it("nový router dá na plochu dopis od poskytovatele jen jednou", () => {
    const plocha = (s: Stav) => {
      const slozka = najdiSlozku(s.disk, rozloz("C:\\Users\\Zak\\Desktop"));
      return (slozka?.deti ?? []).filter((d) => d.jmeno === "Pokyny od poskytovatele.txt").length;
    };
    expect(plocha(vychoziStav())).toBe(0);
    const s = proved(vychoziStav(), { typ: "sit/situace", situace: "router" }, { typ: "sit/situace", situace: "router" });
    expect(plocha(s)).toBe(1);
  });

  it("kód WIN1 se síťovými úlohami: Přehled počítá „x/33“ zvlášť a chyby ukáže u sítě", () => {
    const kod = zakodujSimulator({
      simulator: "windows",
      jmeno: "Jana Nováková",
      datum: "2026-11-01",
      splneno: ["kos", "sit-ipconfig"],
      celkem: 33,
      chyby: { db: 1 },
    });
    expect(kod.startsWith("WIN1-")).toBe(true);
    const zaci = sloucitSimulatory(najdiKodySimulatoru(kod));
    const win = zaci.find((z) => z.simulator === "windows")!;
    const sit = zaci.find((z) => z.simulator === "sit")!;
    expect(win.splneno).toEqual(["kos"]);
    expect(win.celkem).toBe(33);
    expect(win.chyby).toBeUndefined();
    expect(sit.splneno).toEqual(["sit-ipconfig"]);
    expect(sit.chyby).toEqual({ db: 1 });
  });

  it("kód WIN1 a dřívější WSIT1 téhož žáka se u sítě sečtou", () => {
    const win = zakodujSimulator({ simulator: "windows", jmeno: "Jana", datum: "2026-11-02", splneno: ["sit-tracert"], celkem: 33 });
    const stary = zakodujSimulator({ simulator: "sit", jmeno: "Jana", datum: "2026-11-01", splneno: ["sit-ipconfig"], celkem: 20 });
    const sit = sloucitSimulatory(najdiKodySimulatoru(`${win} ${stary}`)).find((z) => z.simulator === "sit")!;
    expect(sit.splneno.slice().sort()).toEqual(["sit-ipconfig", "sit-tracert"]);
  });

  it("kód bez síťových úloh zůstane jediný řádek jako dřív", () => {
    const kod = zakodujSimulator({ simulator: "windows", jmeno: "Jana", datum: "2026-11-01", splneno: ["kos"], celkem: 33 });
    expect(sloucitSimulatory(najdiKodySimulatoru(kod))).toHaveLength(1);
  });
});
