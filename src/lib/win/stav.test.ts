import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Ukládání stavu a přepínání scénářů.
 *
 * Testy běží v prostředí `node`, kde `window` není. Podstrčí se proto jen
 * tolik, kolik `stav.ts` opravdu používá – celý jsdom by kvůli třem metodám
 * `localStorage` byl zbytečný.
 */
const uloziste = new Map<string, string>();

vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => uloziste.get(k) ?? null,
    setItem: (k: string, v: string) => void uloziste.set(k, v),
    removeItem: (k: string) => void uloziste.delete(k),
  },
});

const { nacti, uloz, vychoziStav } = await import("@/lib/win/stav");

describe("uložení a načtení", () => {
  beforeEach(() => uloziste.clear());

  it("bez uloženého stavu vrací null", () => {
    expect(nacti()).toBeNull();
  });

  it("co se uloží, to se načte", () => {
    const stav = { ...vychoziStav(), splneno: ["slozka-informatika"], stopy: ["prikaz:dir"] };
    uloz(stav);
    const zpet = nacti();
    expect(zpet?.splneno).toEqual(["slozka-informatika"]);
    expect(zpet?.stopy).toEqual(["prikaz:dir"]);
  });

  it("poškozený obsah prostředí neshodí", () => {
    uloziste.set("win11-vyuka-stav", "{tohle není JSON");
    expect(nacti()).toBeNull();
  });
});

describe("přepnutí scénáře", () => {
  beforeEach(() => uloziste.clear());

  it("ODŠKRTANÉ ÚLOHY ZŮSTANOU", () => {
    // Tohle je celé jádro věci. Učitel pošle odkaz na jiné cvičení a žák
    // nesmí přijít o postup jen proto, že se změnil disk. Kdyby se to
    // rozbilo, projeví se to až v hodině a nikdo nepozná proč.
    uloz({ ...vychoziStav("uklid"), splneno: ["slozka-informatika"], stopy: ["prikaz:dir"] });
    const novy = nacti("poviru");
    expect(novy?.scenar).toBe("poviru");
    expect(novy?.splneno).toEqual(["slozka-informatika"]);
    expect(novy?.stopy).toEqual(["prikaz:dir"]);
  });

  it("disk se přitom opravdu vymění", () => {
    const uklid = vychoziStav("uklid");
    uloz(uklid);
    const plochaUklid = JSON.stringify(uklid.disk).includes("IMG_1000.jpg");
    expect(plochaUklid).toBe(true);
    // Po přepnutí na výchozí scénář už fotky z úklidu na disku být nesmějí.
    expect(JSON.stringify(nacti("vychozi")?.disk)).not.toContain("IMG_1000.jpg");
  });

  it("stejný scénář nechá disk i s tím, co si žák vytvořil", () => {
    const stav = vychoziStav("uklid");
    uloz(stav);
    expect(JSON.stringify(nacti("uklid")?.disk)).toContain("IMG_1000.jpg");
  });

  it("stav uložený bez scénáře se bere jako výchozí", () => {
    // Žáci, kteří prostředí používali před zavedením scénářů, mají v úložišti
    // záznam bez pole `scenar`. Nesmí se jim kvůli tomu přestavět disk.
    const stav = vychoziStav();
    uloz(stav);
    const syrove = JSON.parse(uloziste.get("win11-vyuka-stav")!);
    delete syrove.scenar;
    uloziste.set("win11-vyuka-stav", JSON.stringify(syrove));
    expect(nacti("vychozi")).not.toBeNull();
    expect(nacti("vychozi")?.scenar).toBe("vychozi");
  });
});
