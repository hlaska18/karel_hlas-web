import { permanentRedirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

/** Zploští Next.js `searchParams` na query string (zachová opakované klíče). */
function toQueryString(searchParams: SearchParams): string {
  return new URLSearchParams(
    Object.entries(searchParams).flatMap(([k, v]) =>
      v == null ? [] : Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]],
    ),
  ).toString();
}

/**
 * Trvale přesměruje starou adresu /pro-ucitele (CZ i EN) na sekci banky
 * (#banka) a zachová sdílené parametry (?tema=&lekce=), aby dřív rozeslané
 * odkazy dál fungovaly. `base` = "" pro CZ, "/en" pro EN.
 */
export function redirectToBank(searchParams: SearchParams, base = ""): never {
  const qs = toQueryString(searchParams);
  permanentRedirect(`${base}/${qs ? `?${qs}` : ""}#banka`);
}
