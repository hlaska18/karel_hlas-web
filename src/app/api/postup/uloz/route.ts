/**
 * Uložení postupu. Přijme lístek a seznam splněných úloh, sloučí ho s tím, co
 * je v úložišti, a sloučený vrátí zpátky. Slučuje se sjednocením – viz
 * `sluzba.ts`, kde je i vysvětlení proč.
 */

import { NextResponse } from "next/server";

import { precti } from "@/lib/postup/jadro";
import { ulozPostupDoUloziste } from "@/lib/postup/sluzba";
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

  const vysledek = await ulozPostupDoUloziste(uloziste, telo.listek, telo.splneno, podpis);
  if (vysledek.stav === "neplatny-listek") {
    return NextResponse.json({ duvod: "neplatny-listek" }, { status: 401 });
  }
  if (vysledek.stav === "nenalezeno") {
    return NextResponse.json({ duvod: "nenalezeno" }, { status: 404 });
  }
  return NextResponse.json({ splneno: vysledek.splneno });
}

/** Smazání vlastního postupu – žák se ho musí umět zbavit sám. */
export async function DELETE(req: Request) {
  const uloziste = ziskejUloziste();
  const podpis = process.env.POSTUP_PODPIS;
  if (!uloziste || !podpis) {
    return NextResponse.json({ duvod: "nenastaveno" }, { status: 503 });
  }

  // Z hlavičky, ne z adresy: query se propisuje do logů, historie prohlížeče
  // i do `Referer`, a přihlašovací lístek do žádného z těch míst nepatří.
  const listek = req.headers.get("x-listek") ?? "";
  const prezdivka = precti(listek, podpis);
  if (!prezdivka) {
    return NextResponse.json({ duvod: "neplatny-listek" }, { status: 401 });
  }

  await uloziste.smaz(prezdivka);
  return NextResponse.json({ smazano: true });
}
