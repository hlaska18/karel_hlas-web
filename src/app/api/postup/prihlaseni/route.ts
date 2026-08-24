/**
 * Přihlášení k postupu: založí účet, nebo ověří existující, a vrátí lístek
 * spolu s uloženým postupem.
 *
 * Sama routa jen převádí výsledek na HTTP – co se doopravdy děje, je
 * v `sluzba.ts`, aby to šlo otestovat s úložištěm v paměti.
 *
 * Musí běžet na Node, ne na Edge: `scrypt` z `node:crypto` na Edge není.
 */

import { NextResponse } from "next/server";

import { prihlasNeboZaloz } from "@/lib/postup/sluzba";
import { ziskejUloziste } from "@/lib/postup/uloziste";

export const runtime = "nodejs";

/** Strop na tělo požadavku – bez něj by šlo endpoint zahltit. */
const MAX_TELO = 4 * 1024;

/**
 * Kontrola nastavení. Vrací JEN dvě „ano/ne" – jestli je připojené úložiště
 * a jestli je nastavený podpis. ŽÁDNÉ hodnoty, takže se tím nic neprozradí:
 * že synchronizace běží nebo neběží, stejně stojí na přihlašovací obrazovce.
 *
 * Bez tohohle by se při 503 dalo jen hádat, která z těch dvou věcí chybí.
 */
export function GET() {
  const uloziste = Boolean(process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL);
  const podpis = Boolean(process.env.POSTUP_PODPIS);
  const znak = (ano: boolean) => (ano ? "ano" : "NE");

  const radky = [
    `Uloziste pripojene: ${znak(uloziste)}`,
    `Podpis nastaveny:   ${znak(podpis)}`,
    "",
    uloziste && podpis
      ? "Synchronizace postupu bezi."
      : !podpis
        ? "Chybi promenna POSTUP_PODPIS - viz krok 3 v VERCEL.md."
        : "Uloziste neni pripojene k projektu - viz krok 2 v VERCEL.md.",
    uloziste && podpis ? "" : "Kdyz sis myslel, ze je hotovo: chybi nove nasazeni (krok 4).",
  ];

  // Obycejny text, ne JSON: Safari odpoved typu application/json STAHNE misto
  // zobrazeni, takze se Karlovi otevrelo okno se stahovanim misto odpovedi.
  return new NextResponse(radky.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const uloziste = ziskejUloziste();
  const podpis = process.env.POSTUP_PODPIS;
  if (!uloziste || !podpis) {
    // Chybějící nastavení NENÍ chyba. Web běží i bez úložiště, prostředí pak
    // jede lokálně jako dřív. 503 říká „teď ne", ne „rozbité".
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

  const vysledek = await prihlasNeboZaloz(uloziste, telo.prezdivka, telo.heslo, podpis);
  if (vysledek.stav === "spatny-tvar") {
    return NextResponse.json({ duvod: "spatny-tvar" }, { status: 400 });
  }
  if (vysledek.stav === "nesedi") {
    return NextResponse.json({ duvod: "nesedi" }, { status: 401 });
  }
  return NextResponse.json({
    listek: vysledek.listek,
    splneno: vysledek.splneno,
    novy: vysledek.novy,
  });
}
