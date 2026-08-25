import { describe, expect, it } from "vitest";
import {
  hesloSedi,
  normalizujPrezdivku,
  ocisti,
  precti,
  prezdivkaSedi,
  slouc,
  vyrobLístek,
  zahashuj,
} from "@/lib/postup/jadro";
import { UKOLY } from "@/lib/win/ukoly";

const PODPIS = "tajemstvi-jen-pro-testy";
const PRVNI = UKOLY[0].id;
const DRUHY = UKOLY[1].id;

describe("přezdívka", () => {
  it("sjednotí velikost písmen a mezery", () => {
    // Bez toho by „Kolibrik" a „kolibrik " byly dva účty a žákovi by zmizel
    // postup, aniž by tušil proč.
    expect(normalizujPrezdivku("  Kolibrik ")).toBe("kolibrik");
    expect(normalizujPrezdivku("KOLIBRIK")).toBe("kolibrik");
  });

  it("srovná i rozloženou diakritiku z macOS", () => {
    // macOS píše „ě" jako e + háček (NFD), Windows jako jeden znak (NFC).
    expect(normalizujPrezdivku("ježek")).toBe(normalizujPrezdivku("ježek".normalize("NFD")));
  });

  it("pustí rozumné tvary a odmítne nesmysly", () => {
    expect(prezdivkaSedi("kolibrik")).toBe(true);
    expect(prezdivkaSedi("3a-07")).toBe(true);
    expect(prezdivkaSedi("ježek.2")).toBe(true);
    expect(prezdivkaSedi("a")).toBe(false); // moc krátká
    expect(prezdivkaSedi("a".repeat(33))).toBe(false); // moc dlouhá
    expect(prezdivkaSedi("dva slova")).toBe(false); // mezera
    expect(prezdivkaSedi("zak:1")).toBe(false); // dvojtečka je oddělovač klíče
  });
});

describe("heslo", () => {
  it("ověří správné a odmítne špatné", async () => {
    const { hash, sul } = await zahashuj("tajne");
    expect(await hesloSedi("tajne", hash, sul)).toBe(true);
    expect(await hesloSedi("tajné", hash, sul)).toBe(false);
    expect(await hesloSedi("", hash, sul)).toBe(false);
  });

  it("stejné heslo dvou žáků dá jiný hash", async () => {
    // Sůl je na účet, ne globální – jinak by shodná hesla byla v úložišti
    // vidět jako shodné řetězce.
    expect((await zahashuj("stejne")).hash).not.toBe((await zahashuj("stejne")).hash);
  });
});

describe("lístek", () => {
  it("přečte přezdívku z vlastního lístku", () => {
    expect(precti(vyrobLístek("kolibrik", PODPIS), PODPIS)).toBe("kolibrik");
  });

  it("neuzná lístek podepsaný jiným tajemstvím", () => {
    expect(precti(vyrobLístek("kolibrik", "cizi"), PODPIS)).toBeNull();
  });

  it("neuzná přepsanou přezdívku", () => {
    // Kdyby šlo v lístku jen přepsat jméno, četl by kdokoli cizí postup.
    const listek = vyrobLístek("kolibrik", PODPIS);
    const podvrzeny = listek.replace("kolibrik", "vydra");
    expect(precti(podvrzeny, PODPIS)).toBeNull();
  });

  it("neuzná prošlý lístek", () => {
    const stary = vyrobLístek("kolibrik", PODPIS, Date.now() - 400 * 24 * 3600 * 1000);
    expect(precti(stary, PODPIS)).toBeNull();
  });

  it("nespadne na nesmyslném vstupu", () => {
    for (const nesmysl of ["", "a.b.c", "...", "kolibrik", "a.b.zz"]) {
      expect(precti(nesmysl, PODPIS)).toBeNull();
    }
  });
});

describe("postup", () => {
  it("propustí jen existující úlohy", () => {
    // Bez toho by z endpointu bylo úložiště na cokoli.
    expect(ocisti([PRVNI, "vymyslene-id", 42, null])).toEqual([PRVNI]);
  });

  it("zahodí duplicity", () => {
    expect(ocisti([PRVNI, PRVNI, DRUHY])).toEqual([PRVNI, DRUHY]);
  });

  it("z jiného než pole udělá prázdno", () => {
    expect(ocisti("hodně" as unknown)).toEqual([]);
    expect(ocisti(undefined)).toEqual([]);
  });

  it("sloučí postup ze dvou počítačů", () => {
    // Úloha už nikdy neubude, takže sjednocení stačí a konflikt nevzniká.
    expect(slouc([PRVNI], [DRUHY]).sort()).toEqual([PRVNI, DRUHY].sort());
    expect(slouc([PRVNI], [PRVNI])).toEqual([PRVNI]);
  });
});
