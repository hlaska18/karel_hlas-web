import { describe, expect, it } from "vitest";
import { coUdelaTazeni, pustTazene, stopaTazeni } from "@/lib/mac/tazeni";
import { vytvorDiskMac, UVITANI } from "@/lib/mac/seed";
import { APLIKACE, DOKUMENTY, KOS, PLOCHA, SVAZKY } from "@/lib/mac/cesty";
import { najdi, najdiSlozku, novaSlozka, vloz } from "@/lib/win/fs";

const FLASH = [...SVAZKY, "FLASH"];
const UVITANI_NA_PLOSE = [...PLOCHA, UVITANI];

describe("tažení myší", () => {
  it("po stejném disku přesouvá – z plochy do Dokumentů", () => {
    const vysledek = pustTazene(vytvorDiskMac(), UVITANI_NA_PLOSE, DOKUMENTY);
    expect(vysledek?.akce).toBe("presun");
    expect(najdi(vysledek!.disk, UVITANI_NA_PLOSE)).toBeNull();
    expect(najdi(vysledek!.disk, [...DOKUMENTY, UVITANI])).not.toBeNull();
  });

  it("na jiný disk kopíruje – originál zůstane na ploše", () => {
    const vysledek = pustTazene(vytvorDiskMac(), UVITANI_NA_PLOSE, FLASH);
    expect(vysledek?.akce).toBe("kopie");
    expect(najdi(vysledek!.disk, UVITANI_NA_PLOSE)).not.toBeNull();
    expect(najdi(vysledek!.disk, [...FLASH, UVITANI])).not.toBeNull();
    expect(stopaTazeni(FLASH, "kopie")).toBe("zkopiroval-na-jiny-svazek");
  });

  it("na koš vždycky přesouvá, i z FLASH – a soubor tam pořád je", () => {
    const disk = vytvorDiskMac();
    expect(coUdelaTazeni(disk, [...FLASH, "Zaloha.txt"], KOS)).toBe("presun");
    const vysledek = pustTazene(disk, UVITANI_NA_PLOSE, KOS);
    expect(najdi(vysledek!.disk, [...KOS, UVITANI])).not.toBeNull();
    expect(stopaTazeni(KOS, "presun")).toBe("presunul-do-kose");
  });

  it("při shodě jmen dostane položka v cíli jiné jméno, nic se nepřepíše", () => {
    let disk = vytvorDiskMac();
    disk = pustTazene(disk, UVITANI_NA_PLOSE, FLASH)!.disk; // kopie na FLASH
    const vysledek = pustTazene(disk, UVITANI_NA_PLOSE, FLASH);
    expect(vysledek?.jmeno).not.toBe(UVITANI);
    expect(
      najdiSlozku(vysledek!.disk, FLASH)!.deti.filter((d) =>
        d.jmeno.startsWith("Přečti"),
      ),
    ).toHaveLength(2);
  });

  it("odmítne nesmysly: do téže složky, sama do sebe, do balíčku .app", () => {
    let disk = vytvorDiskMac();
    disk = vloz(disk, PLOCHA, novaSlozka("Projekt"));
    const projekt = [...PLOCHA, "Projekt"];
    expect(coUdelaTazeni(disk, UVITANI_NA_PLOSE, PLOCHA)).toBeNull();
    expect(coUdelaTazeni(disk, projekt, projekt)).toBeNull();
    const aplikace = najdiSlozku(disk, APLIKACE)!.deti.find((d) =>
      d.jmeno.endsWith(".app"),
    )!;
    expect(
      coUdelaTazeni(disk, UVITANI_NA_PLOSE, [...APLIKACE, aplikace.jmeno]),
    ).toBeNull();
    expect(coUdelaTazeni(disk, UVITANI_NA_PLOSE, projekt)).toBe("presun");
  });
});
