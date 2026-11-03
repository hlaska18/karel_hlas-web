import { describe, expect, it } from "vitest";
import { reducer } from "@/lib/win/reducer";
import { vychoziStav } from "@/lib/win/stav";
import { SCENARE } from "@/lib/win/scenare";
import { UKOLY, postup, vyhodnot } from "@/lib/win/ukoly";
import { UKOLY_SIT } from "@/lib/dilna/ukoly";
import { strankaSit } from "@/lib/dilna/stranky";
import {
  APIPA,
  CIZI,
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

describe("sada úloh a kód WSIT1", () => {
  it("dílna má vlastní úlohy, výchozí sada se nemění", () => {
    expect(UKOLY).toHaveLength(33);
    expect(UKOLY_SIT).toHaveLength(20);
    expect(UKOLY_SIT.every((u) => u.id.startsWith("sit-"))).toBe(true);
    expect(new Set(UKOLY_SIT.map((u) => u.id)).size).toBe(UKOLY_SIT.length);
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

describe("simulátor Windows po přesunu sítě do dílny", () => {
  it("nemá síťové úlohy ani síťový scénář a počítá dál 33", () => {
    const s = vychoziStav();
    expect(s).not.toHaveProperty("sit");
    expect(UKOLY.some((u) => u.id.startsWith("sit-"))).toBe(false);
    expect(SCENARE.some((c) => c.id === "sit")).toBe(false);
    expect(postup(UKOLY_SIT.map((u) => u.id))).toEqual({ hotovo: 0, celkem: 33 });
  });

  it("splněné síťové úlohy ve starém uložení postup Windows nezkazí", () => {
    const s = { ...vychoziStav(), stopy: ["prikaz:ipconfig-all"], splneno: ["sit-ipconfig"] };
    expect(vyhodnot(s).some((id) => id.startsWith("sit-"))).toBe(false);
    expect(reducer(s, { typ: "stopa", klic: "prikaz:ipconfig" }).stopy).toContain("prikaz:ipconfig");
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
