import { beforeEach, describe, expect, it, vi } from "vitest";
import { cestaObalky } from "@/lib/dilna/obalka";
import { STRANKY_SIT, strankaSit } from "@/lib/dilna/stranky";
import { nactiDilnu, overuje, reducerDilny, vychoziDilna, type AkceDilny, type StavDilny } from "@/lib/dilna/stav";
import { VYSVETLENI, vyhodnotTip, type CastSite } from "@/lib/dilna/tipy";
import { UKOLY_SIT } from "@/lib/dilna/ukoly";
import {
  CIZI,
  STITEK,
  VYCHOZI_SIT,
  ipconfig,
  kontrolky,
  nslookup,
  ping,
  sitSPoruchou,
  tracert,
  ucinne,
  type Porucha,
  type SitStav,
} from "@/lib/win/sit";

const proved = (stav: StavDilny, ...akce: AkceDilny[]): StavDilny => akce.reduce(reducerDilny, stav);
const start = () => vychoziDilna("Jana Nováková");
/** Žák si opravu ověří pingem na web podle názvu. */
const over = (s: StavDilny) => {
  const stopy = ping(s.sit, ["skola.example"]).stopy ?? [];
  return proved(s, { typ: "prikaz", stopy: stopy.includes("ping:internet:ok") ? [...stopy, "ping:nazev:ok"] : stopy, dukazy: [] });
};

describe("porucha: oprava se počítá, až když ji žák ověří", () => {
  it("brána: oprava sama nestačí, chyba se zapíše", () => {
    let s = proved(start(), { typ: "sit/porucha", porucha: "brana" });
    expect(s.splneno).not.toContain("sit-porucha-brana");
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, dns: { prirazeni: "rucne", server: "198.51.100.53" } } });
    expect(s.chyby).toEqual({ db: 1 });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, ip: VYCHOZI_SIT.ip } });
    expect(s.overuje).toBe("brana");
    expect(s.splneno).not.toContain("sit-porucha-brana");
    s = over(s);
    expect(s.overuje).toBeUndefined();
    expect(s.splneno).toContain("sit-porucha-brana");
  });

  it("DNS se pingem na adresu ověřit nedá, ten chodil i s poruchou", () => {
    let s = proved(start(), { typ: "sit/porucha", porucha: "dns" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, dns: VYCHOZI_SIT.dns } });
    expect(s.overuje).toBe("dns");
    s = proved(s, { typ: "prikaz", stopy: ping(s.sit, ["203.0.113.10"]).stopy ?? [], dukazy: [] });
    expect(s.splneno).not.toContain("sit-porucha-dns");
    s = over(s);
    expect(s.splneno).toContain("sit-porucha-dns");
    expect(overuje("dns", ["nslookup:ok"])).toBe(true);
    expect(overuje("brana", ["ping:internet:ok"])).toBe(true);
    expect(overuje("brana", ["ping:brana:ok"])).toBe(false);
  });

  it("kabel, DHCP i WAN se opraví u routeru a v nastavení", () => {
    let s = proved(start(), { typ: "sit/porucha", porucha: "kabel" });
    s = over(proved(s, { typ: "sit/nastav", sit: { ...s.sit, kabely: { ...s.sit.kabely, lan: 3 } } }));
    expect(s.splneno).toContain("sit-porucha-kabel");

    s = proved(s, { typ: "sit/porucha", porucha: "dhcp" });
    // Obejít to ruční adresou nestačí.
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, ip: { prirazeni: "rucne", adresa: "192.168.1.200", maska: "255.255.255.0", brana: "192.168.1.1" } } });
    s = over(s);
    expect(s.splneno).not.toContain("sit-porucha-dhcp");
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, router: { ...s.sit.router, dhcp: true } } });
    s = over(s);
    expect(s.splneno).not.toContain("sit-porucha-dhcp");
    s = over(proved(s, { typ: "sit/nastav", sit: { ...s.sit, ip: VYCHOZI_SIT.ip } }));
    expect(s.splneno).toContain("sit-porucha-dhcp");

    s = proved(s, { typ: "sit/porucha", porucha: "wan" });
    s = over(proved(s, { typ: "sit/nastav", sit: { ...s.sit, kabely: { ...s.sit.kabely, wan: true } } }));
    expect(s.splneno).toContain("sit-porucha-wan");
  });

  it("nová porucha smaže důkazy a splněná zakázka zůstane splněná", () => {
    let s = proved(start(), { typ: "sit/porucha", porucha: "kabel" });
    s = proved(s, { typ: "prikaz", stopy: [], dukazy: ["ipconfig"] });
    s = over(proved(s, { typ: "sit/nastav", sit: { ...s.sit, kabely: { ...s.sit.kabely, lan: 1 } } }));
    s = proved(s, { typ: "sit/porucha", porucha: "kabel" });
    expect(s.dukazy).toEqual([]);
    expect(s.stopy).not.toContain("porucha:kabel:overena");
    expect(s.splneno).toContain("sit-porucha-kabel");
  });

  it("chyba rr: ruční nastavení, se kterým síť přestane fungovat", () => {
    const s = proved(start(), {
      typ: "sit/nastav",
      sit: { ...VYCHOZI_SIT, ip: { prirazeni: "rucne", adresa: "192.168.1.23", maska: "255.255.255.0", brana: "192.168.1.100" } },
    });
    expect(s.chyby).toEqual({ rr: 1 });
  });

  it("vytažený kabel u ruční adresy není chyba ručního nastavení", () => {
    let s = proved(start(), {
      typ: "sit/nastav",
      sit: { ...VYCHOZI_SIT, ip: { prirazeni: "rucne", adresa: "192.168.1.40", maska: "255.255.255.0", brana: "192.168.1.1" } },
    });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, kabely: { ...s.sit.kabely, lan: null } } });
    expect(s.chyby).toEqual({});
  });
});

describe("scénáře Nový router a Cizí zařízení", () => {
  it("výchozí zapojená síť úlohy routeru nesplní, dokud scénář nezačne", () => {
    const s = proved(start(), { typ: "stopa", stopa: "overeno:ipconfig-adresa" }, { typ: "stopa", stopa: "overeno:router-prihlaseni" });
    expect(s.splneno.filter((id) => id.startsWith("sit-router"))).toEqual([]);
  });

  it("nový router: zapojit, připojit počítač, správa, heslo, Wi-Fi", () => {
    let s = proved(start(), { typ: "stopa", stopa: "overeno:ipconfig-adresa" }, { typ: "sit/situace", situace: "router" });
    expect(s.stopy).not.toContain("overeno:ipconfig-adresa");
    expect(ipconfig(s.sit, []).vystup.join("\n")).toContain("Médium odpojeno");
    expect(s.sit.router.zarizeni.map((z) => z.nazev)).toEqual(["DOMACI-PC"]);
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, kabely: { napajeni: true, wan: true, lan: null } } });
    expect(s.splneno).toContain("sit-router-zapoj");
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, kabely: { ...s.sit.kabely, lan: 2 } } });
    s = proved(s, { typ: "prikaz", stopy: ipconfig(s.sit, []).stopy ?? [], dukazy: ["ipconfig"] });
    expect(s.splneno).toContain("sit-router-pc");
    s = proved(s, { typ: "stopa", stopa: "overeno:router-prihlaseni" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, router: { ...s.sit.router, adminHeslo: "nove-heslo-1" } } });
    s = proved(s, {
      typ: "sit/nastav",
      sit: { ...s.sit, router: { ...s.sit.router, wifi: { nazev: "Doma", zabezpeceni: "wpa3", heslo: "dlouhe-heslo-12" } } },
    });
    expect(s.splneno).toEqual(expect.arrayContaining(["sit-router-sprava", "sit-router-heslo", "sit-router-wifi"]));
  });

  it("omyly se zapojením: kontrolky i adresa odpovídají tomu, co je zastrčené", () => {
    const prehozeno: SitStav = {
      ...VYCHOZI_SIT,
      kabely: { napajeni: true, wan: false, lan: null, poskytovatelVLan: 2, pocitacVeWan: true },
    };
    expect(kontrolky(prehozeno)).toMatchObject({ internet: false, lan: [2] });
    expect(ucinne(prehozeno)).toMatchObject({ medium: true, apipa: true, brana: "" });
    let s = proved(start(), { typ: "sit/situace", situace: "router" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, kabely: prehozeno.kabely } });
    expect(s.splneno).not.toContain("sit-router-zapoj");
  });

  it("Wi-Fi s továrním heslem nebo jen WPA2 úlohu nesplní", () => {
    let s = proved(start(), { typ: "sit/situace", situace: "router" });
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, router: { ...s.sit.router, wifi: { nazev: "Doma", zabezpeceni: "wpa2", heslo: "dlouhe-heslo-12" } } } });
    expect(s.splneno).not.toContain("sit-router-wifi");
    s = proved(s, { typ: "sit/nastav", sit: { ...s.sit, router: { ...s.sit.router, wifi: { nazev: "Doma", zabezpeceni: "wpa3", heslo: STITEK.wifiHeslo } } } });
    expect(s.splneno).not.toContain("sit-router-wifi");
  });

  it("cizí zařízení: zablokovat, heslo, WPS, hosté", () => {
    let s = proved(start(), { typ: "sit/situace", situace: "cizi" });
    expect(s.sit.router.zarizeni).toContainEqual(CIZI);
    const r = s.sit.router;
    s = proved(s, {
      typ: "sit/nastav",
      sit: {
        ...s.sit,
        router: {
          ...r,
          blokovane: [CIZI.mac],
          wifi: { ...r.wifi, zabezpeceni: "wpa2-wpa3", heslo: "jine-dlouhe-heslo" },
          wps: false,
          host: { zapnuto: true, heslo: "pro-navstevu" },
        },
      },
    });
    expect(s.splneno).toEqual(expect.arrayContaining(["sit-cizi-zablokuj", "sit-cizi-heslo", "sit-cizi-wps", "sit-cizi-host"]));
  });

  it("porucha ukončí scénář, takže neodškrtne „Zapoj router“", () => {
    const s = proved(start(), { typ: "sit/situace", situace: "router" }, { typ: "sit/porucha", porucha: "kabel" });
    expect(s.stopy).not.toContain("situace:router:spustena");
    expect(s.splneno).not.toContain("sit-router-zapoj");
  });
});

describe("tipy", () => {
  const PORUCHY: [Porucha, CastSite, string[]][] = [
    ["kabel", "kabel", ["ipconfig"]],
    ["dhcp", "router", ["ipconfig"]],
    ["brana", "pc", ["ipconfig"]],
    ["wan", "vedeni", ["tracert-adresa"]],
    ["dns", "pc", ["nslookup"]],
  ];

  it.each(PORUCHY)("%s: správná část s důkazem platí, bez důkazu je to jen možná", (porucha, cast, dukazy) => {
    expect(vyhodnotTip(porucha, cast, dukazy).spravne).toBe(true);
    const bez = vyhodnotTip(porucha, cast, []);
    expect(bez.spravne).toBe(false);
    expect(bez.text).toContain("Možná");
    expect(VYSVETLENI[porucha].startsWith("Hotovo.")).toBe(true);
  });

  it.each(PORUCHY)("%s: jiná část nikdy neplatí", (porucha, spravna) => {
    const casti: CastSite[] = ["pc", "kabel", "router", "vedeni", "internet"];
    const vse = ["ipconfig", "ping-router", "ping-adresa", "ping-nazev", "nslookup", "tracert-adresa"];
    for (const cast of casti.filter((c) => c !== spravna)) expect(vyhodnotTip(porucha, cast, vse).spravne).toBe(false);
  });
});

describe("obálka sedí s výpisem příkazu", () => {
  const SITE: [string, SitStav][] = [
    ["v pořádku", VYCHOZI_SIT],
    ...(["kabel", "dhcp", "brana", "wan", "dns"] as Porucha[]).map((p): [string, SitStav] => [p, sitSPoruchou(p)]),
  ];
  const CILE = ["192.168.1.1", "192.168.1.12", "192.168.1.254", "203.0.113.10", "skola.example", "neexistuje.example", "10.0.0.9"];

  it.each(SITE)("%s: na server dojde jen tehdy, když ping uspěje", (_, sit) => {
    for (const kam of CILE) {
      const v = ping(sit, [kam]);
      const cesta = cestaObalky(sit, "ping", kam, v.vystup)!;
      const uspel = v.vystup.some((r) => r.includes("bajty=32"));
      expect(cesta.zastavky.includes("net")).toBe(Boolean(v.stopy?.includes("ping:internet:ok")));
      if (uspel) expect(cesta.selhala).toBe(false);
      else expect(cesta.selhala).toBe(true);
    }
  });

  it("konkrétní cesty", () => {
    const ob = (sit: SitStav, kam: string) => cestaObalky(sit, "ping", kam, ping(sit, [kam]).vystup)!;
    expect(ob(sitSPoruchou("kabel"), "192.168.1.1").zastavky).toEqual([]);
    expect(ob(sitSPoruchou("brana"), "192.168.1.1").zastavky).toContain("router");
    expect(ob(sitSPoruchou("brana"), "203.0.113.10").zastavky).toEqual(["pul", "pc"]);
    expect(ob(sitSPoruchou("wan"), "203.0.113.10").zastavky).toEqual(["pul", "router", "pul", "pc"]);
    expect(ob(VYCHOZI_SIT, "skola.example").zastavky).toContain("net");
    expect(cestaObalky(VYCHOZI_SIT, "ipconfig", undefined, [])).toBeNull();
  });

  it("nslookup a tracert: přeložený i nepřeložený název", () => {
    const n = (sit: SitStav, kam: string) => cestaObalky(sit, "nslookup", kam, nslookup(sit, [kam]).vystup)!;
    expect(n(VYCHOZI_SIT, "skola.example").selhala).toBe(false);
    expect(n(VYCHOZI_SIT, "neexistuje.example").selhala).toBe(true);
    expect(n(sitSPoruchou("dns"), "skola.example").zastavky).toEqual(["pul", "pc"]);
    const t = (sit: SitStav, kam: string) => cestaObalky(sit, "tracert", kam, tracert(sit, [kam]).vystup)!;
    expect(t(VYCHOZI_SIT, "skola.example").zastavky).toContain("net");
    expect(t(sitSPoruchou("wan"), "203.0.113.10").zastavky).not.toContain("net");
  });
});

describe("stránky a zakázky", () => {
  it("adresy v zakázkách a stránkách jsou jen z povolených rozsahů", () => {
    const text = [...UKOLY_SIT.flatMap((u) => [u.popis, ...u.kroky]), ...STRANKY_SIT.map((s) => s.telo)].join("\n");
    for (const ip of text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) ?? []) {
      expect(ip).toMatch(/^(198\.51\.100|203\.0\.113|192\.168\.1|255\.255\.255)\./);
    }
    expect(text).not.toMatch(/\bEdge\b|Start a spusť|panelu Úkoly/);
  });

  it("zadání Zapoj router neprozradí port WAN, nápověda až postupně", () => {
    const u = UKOLY_SIT.find((z) => z.id === "sit-router-zapoj")!;
    expect(u.popis).not.toMatch(/WAN|LAN/);
    expect(u.kroky[0]).not.toMatch(/WAN|LAN/);
  });

  it("správa routeru je jen z domácí sítě", () => {
    expect(strankaSit("192.168.1.1", VYCHOZI_SIT).router).toBe(true);
    expect(strankaSit("192.168.1.1", sitSPoruchou("kabel")).router).toBeUndefined();
  });
});

describe("přenos rozdělané práce ze simulátoru Windows", () => {
  const uloziste = new Map<string, string>();

  beforeEach(() => {
    uloziste.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => uloziste.get(k) ?? null,
        setItem: (k: string, v: string) => uloziste.set(k, v),
      },
    });
    return () => vi.unstubAllGlobals();
  });

  it("převezme síťové zakázky, chyby, nápovědy a jméno, ostatní úlohy ne", () => {
    uloziste.set(
      "win11-vyuka-stav",
      JSON.stringify({ splneno: ["kos", "sit-ipconfig"], chyby: { db: 1 }, napovedy: { "sit-tracert": 2 }, nastaveni: { jmenoUctu: "Jana Nováková" } }),
    );
    uloziste.set("win11-vyuka-sit", JSON.stringify({ splneno: ["sit-tracert"], chyby: { db: 3 } }));
    const s = nactiDilnu();
    expect(s.jmeno).toBe("Jana Nováková");
    expect(s.splneno.slice().sort()).toEqual(["sit-ipconfig", "sit-tracert"]);
    expect(s.chyby).toEqual({ db: 3 });
    expect(s.napovedy).toEqual({ "sit-tracert": 2 });
    expect(s.sit).toEqual(VYCHOZI_SIT);
  });

  it("bez síťové práce začíná načisto a uložený stav dílny má přednost", () => {
    uloziste.set("win11-vyuka-stav", JSON.stringify({ splneno: ["kos"], nastaveni: { jmenoUctu: "Jana" } }));
    expect(nactiDilnu()).toEqual(vychoziDilna());
    uloziste.set("sitova-dilna", JSON.stringify({ ...vychoziDilna("Petr Malý"), splneno: ["sit-nslookup"] }));
    expect(nactiDilnu().jmeno).toBe("Petr Malý");
    expect(nactiDilnu().splneno).toEqual(["sit-nslookup"]);
  });

  it("rozbitý obsah úložiště nic neshodí", () => {
    uloziste.set("sitova-dilna", "{nesmysl");
    uloziste.set("win11-vyuka-stav", "null");
    expect(nactiDilnu()).toEqual(vychoziDilna());
  });
});
