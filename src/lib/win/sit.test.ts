import { describe, expect, it } from "vitest";
import { reducer, type Akce } from "@/lib/win/reducer";
import { vychoziStav, type Stav } from "@/lib/win/stav";
import { SCENAR_SIT } from "@/lib/win/scenare";
import { UKOLY, UKOLY_SIT, postup, vyhodnot } from "@/lib/win/ukoly";
import { strankaSit } from "@/lib/win/web";
import { VYCHOZI_SIT, diagnoza, ipconfig, nslookup, ping, sitSPoruchou, tracert, type SitStav } from "@/lib/win/sit";
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
    expect(diagnoza(VYCHOZI_SIT)).toEqual({ lan: true, internet: true, dns: true });
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
    expect(diagnoza(sit)).toEqual({ lan: true, internet: true, dns: false });
    expect(ping(sit, ["203.0.113.10"]).stopy).toContain("ping:internet:ok");
    expect(ping(sit, ["skola.example"]).stopy ?? []).not.toContain("ping:internet:ok");
    expect(strankaSit("skola.example", sit).html).toContain("ERR_NAME_NOT_RESOLVED");
    expect(strankaSit("203.0.113.10", sit).adresa).toBe("skola.example");
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
      sit: { ip: { prirazeni: "rucne", adresa: "192.168.1.23", maska: "255.255.255.0", brana: "192.168.1.100" }, dns: dhcp.dns },
    });
    expect(s.chyby).toEqual({ rr: 1 });
  });
});

describe("sada úloh a kód WSIT1", () => {
  it("cvičení má vlastní úlohy, výchozí sada se nemění", () => {
    expect(UKOLY).toHaveLength(33);
    expect(UKOLY_SIT.every((u) => u.id.startsWith("sit-"))).toBe(true);
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
