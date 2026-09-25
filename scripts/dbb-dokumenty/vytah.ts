/**
 * Vytáhne lekce a úlohy kurzu SQL v DB Browseru do JSONu pro generátor
 * dokumentů (reseni.js, navod.js). Jak to spustit: README.txt vedle.
 */
import { KURZ, SADY } from "@/lib/dbb/kurz";

const lekce = KURZ.concat(SADY.map((s) => s.lekce)).map((l) => ({
  id: l.id,
  title: l.title,
  teach: l.teach,
  example: l.example || null,
  soubor: l.databaze ? l.databaze.soubor : l.knihovna ? "knihovna.db" : null,
  tabulka: l.tabulka || null,
  ukoly: l.ukoly.map((u) => ({
    klic: u.klic,
    zadani: u.zadani,
    hint: u.hint,
    reseni: u.reseni,
    reseniJeSql: u.reseniJeSql,
    navic: !!u.navic,
    ceka: u.ceka || null,
    druh: u.kontrola.druh,
    reference: u.kontrola.druh === "stav" ? null : u.kontrola.reference,
    check: u.kontrola.druh === "zmena" ? u.kontrola.check : null,
    nadCistou: u.kontrola.druh === "dotaz" ? u.kontrola.nadCistou : null,
  })),
}));
process.stdout.write(JSON.stringify(lekce, null, 1));
