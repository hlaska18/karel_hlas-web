import { describe, expect, it } from "vitest";
import { SCENARE, VYCHOZI_SCENAR, diskProScenar, scenarPodleId } from "@/lib/win/scenare";
import { existuje, jeSlozka, najdiSlozku, rozloz, type Uzel } from "@/lib/win/fs";
import { PRIPONA_ZASIFROVANO, VYZVA } from "@/lib/win/virus";
import { UKOLY } from "@/lib/win/ukoly";
import { vychoziStav } from "@/lib/win/stav";

const DOMOV = "C:\\Users\\Zak";

/**
 * Kostra, na kterou se dívají úlohy. Kdyby ji některý scénář neměl, úkoly by
 * se přestaly odškrtávat a nikdo by nepoznal proč – proto je to test, ne
 * poznámka v komentáři.
 */
const KOSTRA = [
  `${DOMOV}\\Desktop`,
  `${DOMOV}\\Documents`,
  `${DOMOV}\\Downloads`,
  `${DOMOV}\\Pictures`,
  `${DOMOV}\\Music`,
  `${DOMOV}\\Videos`,
  "C:\\Windows\\System32",
];

describe("scénáře", () => {
  it("mají jedinečná id a výchozí je první", () => {
    const ids = SCENARE.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SCENARE[0].id).toBe(VYCHOZI_SCENAR);
  });

  it("neznámé id spadne na výchozí", () => {
    // Překlep v odkazu nesmí skončit prázdnou obrazovkou.
    expect(scenarPodleId("nesmysl").id).toBe(VYCHOZI_SCENAR);
    expect(scenarPodleId(null).id).toBe(VYCHOZI_SCENAR);
    expect(scenarPodleId(undefined).id).toBe(VYCHOZI_SCENAR);
  });

  it.each(SCENARE.map((s) => [s.nazev, s.id]))("%s zachovává kostru disku", (_n, id) => {
    const disk = diskProScenar(id);
    for (const cesta of KOSTRA) {
      expect(existuje(disk, rozloz(cesta)), `chybí ${cesta}`).toBe(true);
      expect(jeSlozka(najdiSlozku(disk, rozloz(cesta))!)).toBe(true);
    }
  });

  it.each(SCENARE.map((s) => [s.nazev, s.id]))("%s má popis pro učitele", (_n, id) => {
    const s = scenarPodleId(id);
    expect(s.nazev.length).toBeGreaterThan(2);
    expect(s.popis.length).toBeGreaterThan(30);
  });

  it("výchozí scénář disk nijak nemění", () => {
    const a = diskProScenar(VYCHOZI_SCENAR);
    expect(najdiSlozku(a, rozloz(`${DOMOV}\\Desktop`))?.deti.length).toBe(3);
  });

  it("úklid zavalí plochu, ale nesmaže, co tam bylo", () => {
    const plocha = najdiSlozku(diskProScenar("uklid"), rozloz(`${DOMOV}\\Desktop`))!;
    const jmena = plocha.deti.map((d) => d.jmeno);
    expect(jmena.filter((j) => j.startsWith("IMG_")).length).toBe(48);
    expect(jmena).toContain("Zaloha.jpg");
    expect(jmena.filter((j) => j.startsWith("Nová složka")).length).toBe(3);
    // Původní soubory z výchozího disku tam musí zůstat – úlohy se na ně dívají.
    expect(jmena).toContain("Úkoly do informatiky.txt");
  });

  it("úklid dá fotkám různá jména i data, aby šlo řadit", () => {
    const plocha = najdiSlozku(diskProScenar("uklid"), rozloz(`${DOMOV}\\Desktop`))!;
    const fotky = plocha.deti.filter((d) => d.jmeno.startsWith("IMG_"));
    expect(new Set(fotky.map((f) => f.jmeno)).size).toBe(fotky.length);
    expect(new Set(fotky.map((f) => f.zmeneno)).size).toBeGreaterThan(1);
    // Řazení podle jména a podle data musí dát jiné pořadí, jinak je cvičení
    // na řazení k ničemu.
    const podleJmena = [...fotky].sort((a, b) => a.jmeno.localeCompare(b.jmeno)).map((f) => f.jmeno);
    const podleData = [...fotky].sort((a, b) => a.zmeneno - b.zmeneno).map((f) => f.jmeno);
    expect(podleJmena).not.toEqual(podleData);
  });

  it("po útoku je opravdu po útoku", () => {
    const disk = diskProScenar("poviru");
    const plocha = najdiSlozku(disk, rozloz(`${DOMOV}\\Desktop`))!;
    expect(plocha.deti.map((d) => d.jmeno)).toContain(VYZVA);
    const vsechna: string[] = [];
    const projdi = (u: Uzel) => {
      vsechna.push(u.jmeno);
      if (jeSlozka(u)) u.deti.forEach(projdi);
    };
    projdi(disk);
    expect(vsechna.some((j) => j.endsWith(`.${PRIPONA_ZASIFROVANO}`))).toBe(true);
  });

  it("úlohy se dál dají vyhodnotit nad každým scénářem", () => {
    // Nejde o to, aby byly splněné – jen o to, aby žádná kontrola nespadla
    // na chybějící složce.
    for (const s of SCENARE) {
      const stav = vychoziStav(s.id);
      expect(() => UKOLY.forEach((u) => u.hotovo(stav))).not.toThrow();
    }
  });

  it("stav si scénář pamatuje", () => {
    expect(vychoziStav("uklid").scenar).toBe("uklid");
    expect(vychoziStav().scenar).toBe(VYCHOZI_SCENAR);
  });
});
