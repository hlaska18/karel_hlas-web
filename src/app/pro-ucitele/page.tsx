import { permanentRedirect } from "next/navigation";

/**
 * Banka je teď sekce homepage (one-page). Tahle stará adresa proto trvale
 * přesměrovává na /#banka a zachovává sdílené parametry (?tema=&lekce=),
 * aby dřív rozeslané odkazy na konkrétní lekce dál fungovaly.
 */
export default function ProUcitelePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams(
    Object.entries(searchParams).flatMap(([k, v]) =>
      v == null ? [] : Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]],
    ),
  ).toString();
  permanentRedirect(`/${qs ? `?${qs}` : ""}#banka`);
}
