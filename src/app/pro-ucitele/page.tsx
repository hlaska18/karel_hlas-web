import { redirectToBank } from "@/lib/bankRedirect";

/**
 * Banka je teď sekce homepage (one-page). Tahle stará adresa proto trvale
 * přesměrovává na /#banka a zachovává sdílené parametry (?tema=&lekce=),
 * aby dřív rozeslané odkazy na konkrétní lekce dál fungovaly.
 *
 * Od Next.js 15 přicházejí parametry adresy jako Promise – proto `await`.
 */
export default async function ProUcitelePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectToBank(await searchParams);
}
