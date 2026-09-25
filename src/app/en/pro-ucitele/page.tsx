import { redirectToBank } from "@/lib/bankRedirect";

/** EN protějšek – banka je teď sekce /en (#banka). Viz /pro-ucitele. */
export default async function ProUciteleEnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectToBank(await searchParams, "/en");
}
