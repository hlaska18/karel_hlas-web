import { describe, expect, it } from "vitest";
import { reducer, doKose, type Akce } from "@/lib/win/reducer";
import { vychoziStav, type Stav } from "@/lib/win/stav";
import { novaSlozka, rozloz } from "@/lib/win/fs";

const proved = (stav: Stav, ...akce: Akce[]): Stav => akce.reduce(reducer, stav);

const sOknem = () =>
  proved(vychoziStav(), { typ: "okno/otevri", app: "pruzkumnik" });

describe("okna", () => {
  it("otevření přidá okno a zapíše stopu o spuštění", () => {
    const stav = sOknem();
    expect(stav.okna).toHaveLength(1);
    expect(stav.stopy).toContain("spustil:pruzkumnik");
  });

  it("Průzkumník jde otevřít vícekrát, Nastavení jen jednou", () => {
    const dva = proved(
      vychoziStav(),
      { typ: "okno/otevri", app: "pruzkumnik" },
      { typ: "okno/otevri", app: "pruzkumnik" },
    );
    expect(dva.okna).toHaveLength(2);

    const jedno = proved(
      vychoziStav(),
      { typ: "okno/otevri", app: "nastaveni" },
      { typ: "okno/otevri", app: "nastaveni", arg: "ucty" },
    );
    expect(jedno.okna).toHaveLength(1);
    expect(jedno.okna[0].arg).toBe("ucty");
  });

  it("zaměření vytáhne okno nad ostatní", () => {
    const stav = proved(
      vychoziStav(),
      { typ: "okno/otevri", app: "pruzkumnik" },
      { typ: "okno/otevri", app: "terminal" },
    );
    const prvni = stav.okna[0];
    const po = reducer(stav, { typ: "okno/zamer", id: prvni.id });
    const nejvyssi = Math.max(...po.okna.map((o) => o.z));
    expect(po.okna.find((o) => o.id === prvni.id)!.z).toBe(nejvyssi);
  });

  it("klik na hlavní panel aktivní okno schová a neaktivní vytáhne", () => {
    const stav = sOknem();
    const id = stav.okna[0].id;
    const schovane = reducer(stav, { typ: "okno/prepni", id });
    expect(schovane.okna[0].stav).toBe("minimalizovane");
    const zpet = reducer(schovane, { typ: "okno/prepni", id });
    expect(zpet.okna[0].stav).toBe("normalni");
  });

  it("maximalizace si pamatuje původní polohu a obnovení ji vrátí", () => {
    const stav = sOknem();
    const id = stav.okna[0].id;
    const pred = { ...stav.okna[0] };
    const max = reducer(stav, { typ: "okno/maximalizuj", id });
    expect(max.okna[0].stav).toBe("maximalizovane");
    const zpet = reducer(max, { typ: "okno/obnov", id });
    expect(zpet.okna[0]).toMatchObject({ x: pred.x, y: pred.y, w: pred.w, h: pred.h });
    expect(zpet.okna[0].stav).toBe("normalni");
  });

  it("přichycení zruší maximalizaci a naopak", () => {
    const stav = sOknem();
    const id = stav.okna[0].id;
    const vlevo = reducer(stav, { typ: "okno/prichyt", id, kam: "vlevo" });
    expect(vlevo.okna[0].prichyceni).toBe("vlevo");
    const max = reducer(vlevo, { typ: "okno/maximalizuj", id });
    expect(max.okna[0].prichyceni).toBeNull();
  });

  it("posun okna zruší přichycení", () => {
    const stav = sOknem();
    const id = stav.okna[0].id;
    const prichycene = reducer(stav, { typ: "okno/prichyt", id, kam: "vpravo" });
    const posunute = reducer(prichycene, {
      typ: "okno/posun",
      id,
      obdelnik: { x: 10, y: 20, w: 400, h: 300 },
    });
    expect(posunute.okna[0].prichyceni).toBeNull();
    expect(posunute.okna[0].x).toBe(10);
  });

  it("zavření okno odebere", () => {
    const stav = sOknem();
    expect(reducer(stav, { typ: "okno/zavri", id: stav.okna[0].id }).okna).toHaveLength(0);
  });

  it("nový titulek beze změny vrací tentýž stav", () => {
    // Kdyby vracel nový, rozběhla by se smyčka: efekt aplikace hlásí titulek,
    // stav se změní, efekt se spustí znovu.
    const stav = sOknem();
    const id = stav.okna[0].id;
    const s1 = reducer(stav, { typ: "okno/titul", id, titul: "Dokumenty" });
    const s2 = reducer(s1, { typ: "okno/titul", id, titul: "Dokumenty" });
    expect(s2).toBe(s1);
  });

  it("okno se položí do plochy, kterou dostane", () => {
    const stav = reducer(vychoziStav(), {
      typ: "okno/otevri",
      app: "kalkulacka",
      plocha: { x: 0, y: 0, w: 800, h: 600 },
    });
    const o = stav.okna[0];
    expect(o.x).toBeGreaterThanOrEqual(0);
    expect(o.x + o.w).toBeLessThanOrEqual(800);
    expect(o.y + o.h).toBeLessThanOrEqual(600);
  });
});

describe("stav prostředí", () => {
  it("stopa se nezapisuje dvakrát a beze změny vrací tentýž stav", () => {
    const stav = reducer(vychoziStav(), { typ: "stopa", klic: "prikaz:dir" });
    const znovu = reducer(stav, { typ: "stopa", klic: "prikaz:dir" });
    expect(znovu).toBe(stav);
    expect(stav.stopy).toEqual(["prikaz:dir"]);
  });

  it("splněný úkol se nepřidá podruhé", () => {
    const stav = reducer(vychoziStav(), { typ: "ukoly/splneno", ids: ["pripony"] });
    expect(reducer(stav, { typ: "ukoly/splneno", ids: ["pripony"] })).toBe(stav);
  });

  it("změna nastavení mění jen zadané klíče", () => {
    const stav = reducer(vychoziStav(), { typ: "nastaveni/zmen", zmena: { motiv: "tmavy" } });
    expect(stav.nastaveni.motiv).toBe("tmavy");
    expect(stav.nastaveni.jmenoUctu).toBe("Žák");
  });

  it("koš se plní a vysype", () => {
    const disk = vychoziStav().disk;
    const polozky = doKose([novaSlozka("Pokus")], rozloz("C:\\Users\\Zak\\Desktop"));
    const sKosem = reducer(vychoziStav(), { typ: "kos/vloz", polozky });
    expect(sKosem.kos).toHaveLength(1);
    expect(reducer(sKosem, { typ: "kos/vyprazdni" }).kos).toEqual([]);
    expect(disk).toBeDefined();
  });

  it("reset vrátí prostředí do výchozího stavu", () => {
    const stav = proved(
      vychoziStav(),
      { typ: "okno/otevri", app: "terminal" },
      { typ: "nastaveni/zmen", zmena: { motiv: "tmavy" } },
    );
    const cisty = reducer(stav, { typ: "system/reset" });
    expect(cisty.okna).toEqual([]);
    expect(cisty.nastaveni.motiv).toBe("svetly");
  });
});
