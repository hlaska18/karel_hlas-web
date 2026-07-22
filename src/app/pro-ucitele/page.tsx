import { redirectToBank } from "@/lib/bankRedirect";

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
  redirectToBank(searchParams);
}
