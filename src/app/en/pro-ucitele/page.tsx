import { permanentRedirect } from "next/navigation";

/** EN protějšek – banka je teď sekce /en (#banka). Viz /pro-ucitele. */
export default function ProUciteleEnPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams(
    Object.entries(searchParams).flatMap(([k, v]) =>
      v == null ? [] : Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]],
    ),
  ).toString();
  permanentRedirect(`/en${qs ? `?${qs}` : ""}#banka`);
}
