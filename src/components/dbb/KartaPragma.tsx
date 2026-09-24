"use client";

/**
 * Karta Upravit pragma – nastavení databáze. Kurz ji nepotřebuje, ale
 * v programu je, tak tu je taky: hodnoty se jen ukazují, měnit nejdou.
 */

import { useMemo } from "react";
import { useDbb, precti } from "@/components/dbb/kontext";
import { t } from "@/lib/dbb/jazyk";

const POLOZKY: { nazev: string; pragma: string; popis?: (v: string) => string }[] = [
  { nazev: t("Automatický úklid", "Auto Vacuum"), pragma: "auto_vacuum", popis: (v) => [t("Žádný", "None"), t("Plný", "Full"), t("Postupný", "Incremental")][Number(v)] || v },
  { nazev: t("Automatický index", "Automatic Index"), pragma: "automatic_index", popis: (v) => (v === "1" ? t("ano", "yes") : t("ne", "no")) },
  { nazev: t("Kontrolovat cizí klíče", "Foreign Keys"), pragma: "foreign_keys", popis: (v) => (v === "1" ? t("ano", "yes") : t("ne", "no")) },
  { nazev: t("Kódování", "Encoding"), pragma: "encoding" },
  { nazev: t("Režim žurnálu", "Journal Mode"), pragma: "journal_mode" },
  { nazev: t("Velikost stránky", "Page Size"), pragma: "page_size" },
  { nazev: t("Počet stránek", "Page Count"), pragma: "page_count" },
  { nazev: t("Rekurzivní spouštěče", "Recursive Triggers"), pragma: "recursive_triggers", popis: (v) => (v === "1" ? t("ano", "yes") : t("ne", "no")) },
  { nazev: t("Verze uživatele", "User Version"), pragma: "user_version" },
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
      <p className="mb-3 border-l-[3px] border-dbb-akcent bg-dbb-hover px-2 py-1 text-[12px]">
        {t("Pokročilé nastavení databáze. ", "Advanced database settings. ")}
        <b>{t("V kurzu tu nic neměň", "Don't change anything here during the course")}</b>
        {t(" – hodnoty tu jsou, jen aby karta vypadala jako v programu.", " – the values are here only so the tab looks like the real program.")}
      </p>
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
    </div>
  );
}
