"use client";

/**
 * Panel vpravo. V programu tu jsou ukotvené panely Schéma DB a Log SQL;
 * přibyl k nim Kurz SQL – a ten je na první záložce. Zavřít se panel nedá,
 * jen přepnout: kdyby šel zavřít, žák by kurz schoval a neměl ho jak vrátit
 * (stejnou past řešil panel úkolů ve virtuálních Windows).
 */

import { useMemo, useState } from "react";
import { Table2, KeyRound, Columns3 } from "lucide-react";
import { useDbb, type DokKarta } from "@/components/dbb/kontext";
import { nactiStrukturu, schemaSloupce } from "@/components/dbb/KartaStruktura";
import { PanelKurzu } from "@/components/dbb/PanelKurzu";
import { t } from "@/lib/dbb/jazyk";

const NAZVY: { id: DokKarta; text: string }[] = [
  { id: "kurz", text: t("Kurz SQL", "SQL Course") },
  { id: "schema", text: t("Schéma DB", "DB Schema") },
  { id: "log", text: t("Log SQL", "SQL Log") },
];

function Schema() {
  const api = useDbb();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = useMemo(() => nactiStrukturu(api.db()), [api.verze, api.otevrena]);
  if (!api.otevrena) {
    return <p className="p-3 text-[12px] text-dbb-slaby">{t("Není otevřená žádná databáze.", "No database is open.")}</p>;
  }
  return (
    <div className="dbb-posuv h-full select-text overflow-auto bg-dbb-povrch py-1 text-[12px]">
      {s.tabulky.length === 0 && <p className="px-3 py-2 text-dbb-slaby">{t("Databáze zatím nemá žádnou tabulku.", "The database has no tables yet.")}</p>}
      {s.tabulky.map((t) => (
        <div key={t.nazev} className="mb-1">
          <div className="flex h-[20px] items-center px-2 font-semibold">
            <Table2 className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[#2e75b6]" />
            {t.nazev}
          </div>
          {t.sloupce.map((c) => (
            <div key={c.nazev} className="flex h-[19px] items-center pl-7 pr-2" title={schemaSloupce(c)}>
              {c.pk ? (
                <KeyRound className="mr-1.5 h-3 w-3 shrink-0 text-[#c9901a]" />
              ) : (
                <Columns3 className="mr-1.5 h-3 w-3 shrink-0 text-dbb-slaby" />
              )}
              <span className="mr-2">{c.nazev}</span>
              <span className="truncate text-dbb-slaby">
                {c.typ}
                {c.odkaz ? ` → ${c.odkaz}` : ""}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Log() {
  const api = useDbb();
  const [kdo, nastavKdo] = useState<"uzivatel" | "aplikace">("uzivatel");
  const zaznamy = api.log.filter((z) => z.kdo === kdo);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[30px] shrink-0 items-center px-2 text-[12px]">
        <label className="flex flex-1 items-center">
          <span className="mr-1.5">{t("Zobrazit SQL odeslané:", "Show SQL submitted by")}</span>
          <select
            value={kdo}
            onChange={(e) => nastavKdo(e.target.value as "uzivatel" | "aplikace")}
            className="h-[22px] border border-dbb-linka bg-dbb-povrch px-1 text-[12px]"
          >
            <option value="uzivatel">{t("uživatelem", "User")}</option>
            <option value="aplikace">{t("aplikací", "Application")}</option>
          </select>
        </label>
        <button type="button" onClick={api.vymazLog} className="h-[22px] border border-dbb-linka bg-dbb-povrch px-2.5 hover:bg-dbb-hover">
          {t("Vymazat", "Clear")}
        </button>
      </div>
      <div className="dbb-posuv dbb-kod min-h-0 flex-1 select-text overflow-auto border-t border-dbb-linka bg-dbb-povrch py-1 text-[12px]">
        {zaznamy.map((z, i) => (
          <div key={i} className="flex px-1">
            <span className="mr-2 w-7 shrink-0 text-right text-dbb-slaby">{i + 1}</span>
            <span className="whitespace-pre-wrap">{z.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dok() {
  const api = useDbb();
  const nazev = NAZVY.find((n) => n.id === api.dokKarta)?.text;
  return (
    <div className="flex h-full min-h-0 flex-col border border-dbb-linka bg-dbb-lista">
      <div className="flex h-[22px] shrink-0 items-center justify-center border-b border-dbb-linka bg-dbb-okno text-[12px]">
        {nazev}
      </div>
      <div className="min-h-0 flex-1">
        {api.dokKarta === "kurz" && <PanelKurzu />}
        {api.dokKarta === "schema" && <Schema />}
        {api.dokKarta === "log" && <Log />}
      </div>
      <div role="tablist" className="flex h-[24px] shrink-0 items-start border-t border-dbb-linka bg-dbb-okno">
        {NAZVY.map((n) => {
          const aktivni = api.dokKarta === n.id;
          return (
            <button
              key={n.id}
              type="button"
              role="tab"
              aria-selected={aktivni}
              onClick={() => api.nastavDokKartu(n.id)}
              className={`-mt-px mr-[-1px] h-[22px] border border-dbb-linka px-3 text-[12px] ${
                aktivni ? "border-t-dbb-lista bg-dbb-lista font-semibold" : "bg-dbb-okno hover:bg-dbb-hover"
              }`}
            >
              {n.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
