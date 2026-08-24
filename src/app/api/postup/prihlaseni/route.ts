/**
 * Přihlášení k postupu: založí účet, nebo ověří existující, a vrátí lístek
 * spolu s uloženým postupem.
 *
 * Musí běžet na Node, ne na Edge – `scrypt` z `node:crypto` na Edge není.
 */

import { NextResponse } from "next/server";

import {
  MAX_HESLO,
  hesloSedi,
  normalizujPrezdivku,
  ocisti,
  prezdivkaSedi,
  vyrobLístek,
  zahashuj,
} from "@/lib/postup/jadro";
import { jeNastavene, ziskejUloziste } from "@/lib/postup/uloziste";

export const runtime = "nodejs";

/** Strop na tělo požadavku – bez něj by šlo endpoint zahltit. */
const MAX_TELO = 4 * 1024;

export async function POST(req: Request) {
  const uloziste = ziskejUloziste();
  const podpis = process.env.POSTUP_PODPIS;
  if (!uloziste || !jeNastavene() || !podpis) {
    // Chybějící nastavení NENÍ chyba. Web má běžet i bez úložiště, prostředí
    // pak jede lokálně jako dřív. 503 říká „teď ne", ne „rozbité".
    return NextResponse.json({ duvod: "nenastaveno" }, { status: 503 });
  }

  const syrove = await req.text();
  if (syrove.length > MAX_TELO) {
    return NextResponse.json({ duvod: "prilis-velke" }, { status: 413 });
  }

  let telo: { prezdivka?: unknown; heslo?: unknown };
  try {
    telo = JSON.parse(syrove);
  } catch {
    return NextResponse.json({ duvod: "spatny-tvar" }, { status: 400 });
  }

  const heslo = typeof telo.heslo === "string" ? telo.heslo : "";
  const prezdivka = normalizujPrezdivku(typeof telo.prezdivka === "string" ? telo.prezdivka : "");

  if (!prezdivkaSedi(prezdivka) || heslo.length < 4 || heslo.length > MAX_HESLO) {
    return NextResponse.json({ duvod: "spatny-tvar" }, { status: 400 });
  }

  const ted = Date.now();
  const zaznam = await uloziste.nacti(prezdivka);

  if (zaznam) {
    if (!hesloSedi(heslo, zaznam.hash, zaznam.sul)) {
      // Schválně stejná odpověď, jako by účet neexistoval by být nemohla –
      // účet TU je. Ale hláška nesmí prozradit nic navíc než „nesedí to".
      return NextResponse.json({ duvod: "nesedi" }, { status: 401 });
    }
    await uloziste.uloz(prezdivka, { ...zaznam, naposled: ted });
    return NextResponse.json({
      listek: vyrobLístek(prezdivka, podpis, ted),
      splneno: ocisti(zaznam.splneno),
      novy: false,
    });
  }

  const { hash, sul } = zahashuj(heslo);
  await uloziste.uloz(prezdivka, { hash, sul, splneno: [], zalozeno: ted, naposled: ted });
  return NextResponse.json({
    listek: vyrobLístek(prezdivka, podpis, ted),
    splneno: [],
    novy: true,
  });
}
