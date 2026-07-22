import { redirectToBank } from "@/lib/bankRedirect";

/** EN protějšek – banka je teď sekce /en (#banka). Viz /pro-ucitele. */
export default function ProUciteleEnPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirectToBank(searchParams, "/en");
}
