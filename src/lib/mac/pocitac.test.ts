import { describe, expect, it } from "vitest";
import {
  rozlisWindows,
  rozpoznejProhlizec,
  rozpoznejSystem,
} from "@/lib/mac/pocitac";

const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const EDGE_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.2739.42";
const FIREFOX_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const OPERA_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 OPR/113.0.0.0";

describe("na čem prostředí běží", () => {
  it("pozná prohlížeč i verzi – Edge a Opera nejsou Chrome, Chrome není Safari", () => {
    expect(rozpoznejProhlizec(CHROME_WIN)).toEqual({
      nazev: "Chrome",
      verze: "128",
    });
    expect(rozpoznejProhlizec(EDGE_WIN)).toEqual({
      nazev: "Edge",
      verze: "128",
    });
    expect(rozpoznejProhlizec(OPERA_WIN)).toEqual({
      nazev: "Opera",
      verze: "113",
    });
    expect(rozpoznejProhlizec(FIREFOX_WIN)).toEqual({
      nazev: "Firefox",
      verze: "130",
    });
    expect(rozpoznejProhlizec(SAFARI_MAC)).toEqual({
      nazev: "Safari",
      verze: "17.5",
    });
    expect(rozpoznejProhlizec("něco divného").nazev).toBe("neznámý");
  });

  it("pozná systém; Windows 10 a 11 z textu rozlišit nejde", () => {
    expect(rozpoznejSystem(CHROME_WIN)).toBe("Windows 10 nebo 11");
    expect(rozpoznejSystem(SAFARI_MAC)).toBe("macOS");
  });

  it("Windows 11 pozná podle platformVersion, Windows 10 taky", () => {
    expect(rozlisWindows("15.0.0")).toBe("Windows 11");
    expect(rozlisWindows("13.0.0")).toBe("Windows 11");
    expect(rozlisWindows("10.0.0")).toBe("Windows 10");
    expect(rozlisWindows("0.0.0")).toBeNull();
    expect(rozlisWindows("")).toBeNull();
  });
});
