"use client";

/**
 * Karta Upravit pragma – nastavení databáze. Kurz ji nepotřebuje, ale
 * v programu je, tak tu je taky: hodnoty se jen ukazují, měnit nejdou.
 */

import { useMemo } from "react";
import { useDbb, precti } from "@/components/dbb/kontext";

const POLOZKY: { nazev: string; pragma: string; popis?: (v: string) => string }[] = [
  { nazev: "Automatický úklid", pragma: "auto_vacuum", popis: (v) => ["Žádný", "Plný", "Postupný"][Number(v)] || v },
  { nazev: "Automatický index", pragma: "automatic_index", popis: (v) => (v === "1" ? "ano" : "ne") },
  { nazev: "Kontrolovat cizí klíče", pragma: "foreign_keys", popis: (v) => (v === "1" ? "ano" : "ne") },
  { nazev: "Kódování", pragma: "encoding" },
  { nazev: "Režim žurnálu", pragma: "journal_mode" },
  { nazev: "Velikost stránky", pragma: "page_size" },
  { nazev: "Počet stránek", pragma: "page_count" },
  { nazev: "Rekurzivní spouštěče", pragma: "recursive_triggers", popis: (v) => (v === "1" ? "ano" : "ne") },
  { nazev: "Verze uživatele", pragma: "user_version" },
];

export function KartaPragma() {
  const api = useDbb();
  const hodnoty = useMemo(() => {
    const db = api.db();
    return POLOZKY.map((p) => {
      const r = precti(db, `PRAGMA ${p.pragma};`);
      const v = r && r.values[0] ? String(r.values[0][0]) : "";
      return { ...p, hodnota: p.popis ? p.popis(v) : v };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.verze, api.otevrena]);

  if (!api.otevrena) return <div className="h-full bg-dbb-povrch" />;

  return (
    <div className="dbb-posuv h-full overflow-auto p-3">
      <table className="text-[12px]">
        <tbody>
          {hodnoty.map((p) => (
            <tr key={p.pragma}>
              <td className="py-[3px] pr-6">{p.nazev}</td>
              <td className="py-[3px]">
                <input
                  value={p.hodnota}
                  readOnly
                  aria-label={p.nazev}
                  className="h-[22px] w-[200px] border border-dbb-linka bg-dbb-okno px-1.5 text-[12px] text-dbb-slaby"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 max-w-md text-[12px] text-dbb-slaby">
        Nastavení databáze tu jen čteš – pro kurz není potřeba nic měnit.
      </p>
    </div>
  );
}
