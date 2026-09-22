/**
 * Na čem prostředí doopravdy běží.
 *
 * Okno „O tomto Macu" ukazuje pod simulací skutečný počítač: systém,
 * prohlížeč, obrazovku, sklo, animace a plynulost. Ve třídě stačí okno
 * vyfotit a je jasné, proč něco nejede – dřív se to jen odhadovalo ze
 * snímků obrazovky. Nic z toho neopouští prohlížeč.
 */

export interface Prohlizec {
  nazev: string;
  verze: string | null;
}

/**
 * Prohlížeč z textu `navigator.userAgent`. Pořadí je důležité: Edge
 * i Opera se hlásí i jako Chrome a Chrome se hlásí i jako Safari.
 */
export function rozpoznejProhlizec(ua: string): Prohlizec {
  const verze = (re: RegExp) => ua.match(re)?.[1] ?? null;
  if (/Edg\//.test(ua)) return { nazev: "Edge", verze: verze(/Edg\/(\d+)/) };
  if (/OPR\//.test(ua)) return { nazev: "Opera", verze: verze(/OPR\/(\d+)/) };
  if (/Firefox\//.test(ua))
    return { nazev: "Firefox", verze: verze(/Firefox\/(\d+)/) };
  if (/Chrome\//.test(ua))
    return { nazev: "Chrome", verze: verze(/Chrome\/(\d+)/) };
  if (/Safari\//.test(ua))
    return { nazev: "Safari", verze: verze(/Version\/(\d+(?:\.\d+)?)/) };
  return { nazev: "neznámý", verze: null };
}

/**
 * Systém z textu `navigator.userAgent`. Windows 10 a 11 se v něm hlásí
 * stejně („Windows NT 10.0"); rozliší je až `rozlisWindows` níž, a to jen
 * v prohlížečích, které to umějí.
 */
export function rozpoznejSystem(ua: string): string {
  if (/Windows NT 10/.test(ua)) return "Windows 10 nebo 11";
  if (/Windows NT 6\.3/.test(ua)) return "Windows 8.1";
  if (/Windows NT 6\.1/.test(ua)) return "Windows 7";
  if (/Windows/.test(ua)) return "Windows";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "neznámý";
}

/**
 * Windows 11 hlásí v `platformVersion` hlavní číslo 13 a víc, Windows 10
 * 1 až 10 (tak to Microsoft pro Client Hints zavedl). `null`, když to
 * z hodnoty nejde říct.
 */
export function rozlisWindows(platformVersion: string): string | null {
  const hlavni = Number.parseInt(platformVersion.split(".")[0] ?? "", 10);
  if (!Number.isFinite(hlavni)) return null;
  if (hlavni >= 13) return "Windows 11";
  if (hlavni >= 1) return "Windows 10";
  return null;
}
