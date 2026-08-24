/**
 * Uložení postupu. Přijme lístek a seznam splněných úloh, sloučí ho s tím, co
 * je v úložišti, a sloučený vrátí zpátky.
 *
 * Slučuje se sjednocením: splněná úloha už nikdy neubude, takže kdo pracoval
 * offline doma a pak se přihlásil ve škole, sečte se to a konflikt nevzniká.
 */

import { NextResponse } from "next/server";

import { ocisti, precti, slouc } from "@/lib/postup/jadro";
import { ziskejUloziste } from "@/lib/postup/uloziste";

export const runtime = "nodejs";

const MAX_TELO = 16 * 1024;

export async function POST(req: Request) {
  const uloziste = ziskejUloziste();
  const podpis = process.env.POSTUP_PODPIS;
  if (!uloziste || !podpis) {
    return NextResponse.json({ duvod: "nenastaveno" }, { status: 503 });
  }

  const syrove = await req.text();
  if (syrove.length > MAX_TELO) {
    return NextResponse.json({ duvod: "prilis-velke" }, { status: 413 });
  }

  let telo: { listek?: unknown; splneno?: unknown };
  try {
    telo = JSON.parse(syrove);
  } catch {
    return NextResponse.json({ duvod: "spatny-tvar" }, { status: 400 });
  }

  const prezdivka = typeof telo.listek === "string" ? precti(telo.listek, podpis) : null;
  if (!prezdivka) {
    return NextResponse.json({ duvod: "neplatny-listek" }, { status: 401 });
  }

  const zaznam = await uloziste.nacti(prezdivka);
  if (!zaznam) {
    // Lístek platí, ale záznam zmizel (např. si ho žák smazal na jiném stroji).
    // Zakládat ho znovu by vzkřísilo, co někdo úmyslně smazal.
    return NextResponse.json({ duvod: "nenalezeno" }, { status: 404 });
  }

  // `ocisti` propustí jen existující id úloh – bez toho by z endpointu bylo
  // úložiště na libovolná data.
  const sloucene = slouc(ocisti(zaznam.splneno), ocisti(telo.splneno));
  await uloziste.uloz(prezdivka, { ...zaznam, splneno: sloucene, naposled: Date.now() });

  return NextResponse.json({ splneno: sloucene });
}

/** Smazání vlastního postupu – žák se ho musí umět zbavit sám. */
export async function DELETE(req: Request) {
  const uloziste = ziskejUloziste();
  const podpis = process.env.POSTUP_PODPIS;
  if (!uloziste || !podpis) {
    return NextResponse.json({ duvod: "nenastaveno" }, { status: 503 });
  }

  const listek = new URL(req.url).searchParams.get("listek") ?? "";
  const prezdivka = precti(listek, podpis);
  if (!prezdivka) {
    return NextResponse.json({ duvod: "neplatny-listek" }, { status: 401 });
  }

  await uloziste.smaz(prezdivka);
  return NextResponse.json({ smazano: true });
}
