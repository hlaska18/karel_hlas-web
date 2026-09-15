import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Adresa simulátoru snese jakoukoli velikost písmen.
 *
 * PROČ. `/windows` je jediná adresa webu, kterou lidé opravdu PÍŠOU – Karel ji
 * dává žákům do EduPage a diktuje ji ve třídě. Telefon i Word přitom první
 * písmeno rády zvětší a `/Windows` vracelo 404. Žák pak netuší, co dělá
 * špatně, a v hodině je z toho pět ztracených minut.
 *
 * PROČ NE PŘES `redirects()` V `next.config.mjs`. Zkoušel jsem to a nefunguje
 * to: přesměrování se vyhodnocují PŘED hledáním stránky, takže pravidlo, které
 * chytá `windows` v libovolné velikosti písmen, chytne i tu správnou adresu
 * a vznikne smyčka. Vyjmout ji negativním lookaheadem nešlo – Next.js ten
 * zápis ve vzoru nepřijal a `/Windows` dál vracelo 404 (ověřeno proti
 * produkčnímu serveru, ne odhadnuto).
 *
 * ROZSAH. `matcher` pouští middleware jen na tvary slova „windows", takže se
 * nedotkne ničeho jiného – hlavně ne souborů v `public/materialy`, kde na
 * velikosti písmen v názvech ZÁLEŽÍ.
 *
 * Dočasné (307), ne trvalé: trvalé si prohlížeče zapamatují natvrdo a špatně
 * se to bere zpátky.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/windows") {
    const url = request.nextUrl.clone();
    url.pathname = "/windows";
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:varianta([Ww][Ii][Nn][Dd][Oo][Ww][Ss])"],
};
