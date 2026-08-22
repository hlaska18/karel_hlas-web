import { describe, expect, it } from "vitest";
import { doplnit, rozdel, spust, uvitani, vyzva, type Kontext } from "@/lib/win/shell";
import { existuje, najdi, najdiSlozku, rozloz } from "@/lib/win/fs";
import { vytvorDisk } from "@/lib/win/seed";

const ctx = (cesta = "C:\\Users\\Zak"): Kontext => ({
  disk: vytvorDisk(),
  cesta: rozloz(cesta),
  jmenoUctu: "Žák",
});

const vypis = (radky: string[]) => radky.join("\n");

describe("rozbor řádku", () => {
  it("drží uvozovky pohromadě", () => {
    expect(rozdel('copy "Poznámky k hodině.txt" Documents')).toEqual([
      "copy",
      "Poznámky k hodině.txt",
      "Documents",
    ]);
  });
});

describe("příkazový řádek", () => {
  it("dir vypíše obsah složky a součty", () => {
    const v = spust("dir", ctx(), "cmd");
    expect(vypis(v.vystup)).toContain("Desktop");
    expect(vypis(v.vystup)).toContain("souborů");
    expect(v.stopy).toContain("prikaz:dir");
  });

  it("dir /b vypíše jen jména", () => {
    const v = spust("dir /b", ctx(), "cmd");
    expect(v.vystup).toContain("Documents");
    expect(vypis(v.vystup)).not.toContain("<DIR>");
  });

  it("cd změní aktuální složku a cd .. se vrátí", () => {
    const k = ctx();
    const dolu = spust("cd Documents", k, "cmd");
    expect(dolu.cesta).toEqual(["C:", "Users", "Zak", "Documents"]);
    const nahoru = spust("cd ..", { ...k, cesta: dolu.cesta! }, "cmd");
    expect(nahoru.cesta).toEqual(["C:", "Users", "Zak"]);
  });

  it("cd na neexistující cestu hlásí chybu a nikam nepřejde", () => {
    const v = spust("cd Neexistuje", ctx(), "cmd");
    expect(v.cesta).toBeUndefined();
    expect(vypis(v.vystup)).toContain("nemůže nalézt");
  });

  it("md vytvoří složku, podruhé už ne", () => {
    const k = ctx();
    const prvni = spust("md Test", k, "cmd");
    expect(existuje(prvni.disk!, ["C:", "Users", "Zak", "Test"])).toBe(true);
    const druhy = spust("md Test", { ...k, disk: prvni.disk! }, "cmd");
    expect(vypis(druhy.vystup)).toContain("již existuje");
  });

  it("rd smaže jen prázdnou složku, /s i s obsahem", () => {
    const k = ctx("C:\\Users\\Zak\\Documents");
    const bezS = spust("rd Škola", k, "cmd");
    expect(bezS.disk).toBeUndefined();
    expect(vypis(bezS.vystup)).toContain("není prázdný");
    const sS = spust("rd /s Škola", k, "cmd");
    expect(existuje(sS.disk!, rozloz("C:\\Users\\Zak\\Documents\\Škola"))).toBe(false);
  });

  it("del smaže soubor natrvalo, na složku nesáhne", () => {
    const k = ctx("C:\\Users\\Zak\\Desktop");
    const v = spust("del Poznámky.txt", k, "cmd");
    expect(existuje(v.disk!, rozloz("C:\\Users\\Zak\\Desktop\\Poznámky.txt"))).toBe(false);
    expect(spust("del Neexistuje.txt", k, "cmd").disk).toBeUndefined();
  });

  it("odmítne smazat zamčenou systémovou položku", () => {
    const v = spust("rd /s Windows", ctx("C:"), "cmd");
    expect(vypis(v.vystup)).toContain("Přístup byl odepřen");
  });

  it("copy zkopíruje soubor, originál zůstane", () => {
    const k = ctx("C:\\Users\\Zak\\Desktop");
    const v = spust("copy Poznámky.txt Kopie.txt", k, "cmd");
    expect(existuje(v.disk!, rozloz("C:\\Users\\Zak\\Desktop\\Kopie.txt"))).toBe(true);
    expect(existuje(v.disk!, rozloz("C:\\Users\\Zak\\Desktop\\Poznámky.txt"))).toBe(true);
  });

  it("move soubor přesune", () => {
    const k = ctx("C:\\Users\\Zak\\Desktop");
    const v = spust("move Poznámky.txt ..\\Documents", k, "cmd");
    expect(existuje(v.disk!, rozloz("C:\\Users\\Zak\\Documents\\Poznámky.txt"))).toBe(true);
    expect(existuje(v.disk!, rozloz("C:\\Users\\Zak\\Desktop\\Poznámky.txt"))).toBe(false);
  });

  it("ren přejmenuje a hlídá kolizi", () => {
    const k = ctx("C:\\Users\\Zak\\Desktop");
    const v = spust("ren Poznámky.txt Zápisky.txt", k, "cmd");
    expect(existuje(v.disk!, rozloz("C:\\Users\\Zak\\Desktop\\Zápisky.txt"))).toBe(true);
    const kolize = spust("ren Poznámky.txt Poznámky.txt", k, "cmd");
    expect(vypis(kolize.vystup)).toContain("již existuje");
  });

  it("type vypíše obsah textového souboru", () => {
    const v = spust("type Poznámky.txt", ctx("C:\\Users\\Zak\\Desktop"), "cmd");
    expect(vypis(v.vystup)).toContain("Cesta k souboru");
  });

  it("ipconfig hlásí adresu IPv4 a zapíše stopu", () => {
    const v = spust("ipconfig", ctx(), "cmd");
    expect(vypis(v.vystup)).toContain("Adresa IPv4");
    expect(v.stopy).toContain("prikaz:ipconfig");
  });

  it("neznámý příkaz vypíše hlášku Windows", () => {
    expect(vypis(spust("neco", ctx(), "cmd").vystup)).toContain("není názvem vnitřního");
  });

  it("cls vyčistí a exit ukončí kartu", () => {
    expect(spust("cls", ctx(), "cmd").vycistit).toBe(true);
    expect(spust("exit", ctx(), "cmd").ukoncit).toBe(true);
  });
});

describe("PowerShell", () => {
  it("Get-ChildItem vypíše tabulku a zapíše stopu", () => {
    const v = spust("Get-ChildItem", ctx(), "powershell");
    expect(vypis(v.vystup)).toContain("LastWriteTime");
    expect(v.stopy).toContain("prikaz:get-childitem");
  });

  it("aliasy ls a gci dělají totéž", () => {
    for (const alias of ["ls", "gci", "dir"]) {
      expect(vypis(spust(alias, ctx(), "powershell").vystup)).toContain("Directory:");
    }
  });

  it("New-Item -ItemType Directory vytvoří složku", () => {
    const v = spust("New-Item -ItemType Directory -Name Pokus", ctx(), "powershell");
    expect(existuje(v.disk!, rozloz("C:\\Users\\Zak\\Pokus"))).toBe(true);
  });

  it("neznámá rutina hlásí PowerShellovou chybu", () => {
    expect(vypis(spust("Neco-Divneho", ctx(), "powershell").vystup)).toContain("není rozpoznán");
  });
});

describe("prostředí terminálu", () => {
  it("výzva se liší podle režimu", () => {
    expect(vyzva("cmd", ["C:", "Users"])).toBe("C:\\Users>");
    expect(vyzva("powershell", ["C:", "Users"])).toBe("PS C:\\Users> ");
  });

  it("uvítání zmiňuje verzi Windows", () => {
    expect(uvitani("cmd").join(" ")).toContain("Microsoft Windows");
  });

  it("doplňování nabídne položky z aktuální složky", () => {
    expect(doplnit(ctx(), "Doc")).toContain("Documents");
    expect(doplnit(ctx(), "zzz")).toEqual([]);
  });
});

describe("terminál a Průzkumník vidí tentýž disk", () => {
  it("složka založená příkazem md je ve stromu", () => {
    const k = ctx();
    const v = spust("md Sdílené", k, "cmd");
    expect(najdiSlozku(v.disk!, rozloz("C:\\Users\\Zak\\Sdílené"))).not.toBeNull();
    expect(najdi(v.disk!, rozloz("C:\\Users\\Zak\\Sdílené"))?.druh).toBe("slozka");
  });
});
