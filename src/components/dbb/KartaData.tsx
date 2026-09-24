"use client";

/**
 * Karta Prohlížet data – tabulka jako v Excelu. Filtr pod záhlavím funguje
 * jako v programu: kus textu hledá obsažený text, podmínka začínající
 * =, <, >, <=, >= nebo <> porovnává. Dvojklik buňku přepíše – program za
 * žáka pošle UPDATE a zapíše ho do Logu SQL.
 */

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, FilterX, Plus, Trash2, Printer } from "lucide-react";
import { useDbb, precti, uvoz } from "@/components/dbb/kontext";
import { Mrizka, type Razeni } from "@/components/dbb/Mrizka";
import { tabulky } from "@/lib/dbb/prikazy";

/** Podmínka z textu filtru: [sql, parametr]. */
export function podminkaFiltru(sloupec: string, text: string): [string, unknown] | null {
  const f = text.trim();
  if (!f) return null;
  const m = f.match(/^(<=|>=|<>|!=|=|<|>)\s*(.*)$/);
  if (m) {
    const hodnota = m[2].trim();
    const cislo = hodnota !== "" && !isNaN(Number(hodnota)) ? Number(hodnota) : hodnota;
    const op = m[1] === "!=" ? "<>" : m[1];
    return [`${uvoz(sloupec)} ${op} ?`, cislo];
  }
  return [`${uvoz(sloupec)} LIKE ?`, `%${f}%`];
}

export function KartaData() {
  const api = useDbb();
  const db = api.db();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seznam = useMemo(() => (db ? tabulky(db) : []), [api.verze, api.otevrena]);
  const [tabulka, nastavTabulku] = useState<string>("");
  const [filtry, nastavFiltry] = useState<string[]>([]);
  const [razeni, nastavRazeni] = useState<Razeni>(null);
  const [vybrany, nastavVybrany] = useState<{ r: number; s: number } | null>(null);
  const [chyba, nastavChybu] = useState<string | null>(null);

  // Když tabulka zmizí (jiný soubor, DROP TABLE), vyber první, která je.
  useEffect(() => {
    if (seznam.length && seznam.indexOf(tabulka) === -1) {
      nastavTabulku(seznam.indexOf("knihy") !== -1 ? "knihy" : seznam[0]);
      nastavFiltry([]);
      nastavRazeni(null);
    }
  }, [seznam, tabulka]);

  const data = useMemo(() => {
    if (!db || !tabulka || seznam.indexOf(tabulka) === -1) return null;
    const info = precti(db, `PRAGMA table_info(${uvoz(tabulka)})`);
    const sloupce = info ? info.values.map((v) => String(v[1])) : [];
    const podminky: string[] = [];
    const params: unknown[] = [];
    sloupce.forEach((s, i) => {
      const p = podminkaFiltru(s, filtry[i] || "");
      if (p) {
        podminky.push(p[0]);
        params.push(p[1]);
      }
    });
    let sql = `SELECT rowid AS "_rowid_", * FROM ${uvoz(tabulka)}`;
    if (podminky.length) sql += ` WHERE ${podminky.join(" AND ")}`;
    if (razeni && sloupce[razeni.sloupec]) {
      sql += ` ORDER BY ${uvoz(sloupce[razeni.sloupec])} ${razeni.smer === "asc" ? "ASC" : "DESC"}`;
    }
    try {
      const st = db.prepare(sql);
      const radky: unknown[][] = [];
      const id: string[] = [];
      try {
        // sql.js Statement.bind – typ ho neuvádí, program ho potřebuje jen tady.
        (st as unknown as { bind: (p: unknown[]) => void }).bind(params);
        while (st.step()) {
          const r = st.get();
          id.push(String(r[0]));
          radky.push(r.slice(1));
        }
      } finally {
        st.free();
      }
      return { sloupce, radky, id };
    } catch {
      return { sloupce, radky: [] as unknown[][], id: [] as string[] };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.verze, api.otevrena, tabulka, filtry, razeni, seznam]);

  useEffect(() => {
    if (data && tabulka) api.hlasProhlizeni(tabulka, data.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tabulka]);

  if (!api.otevrena) return <div className="h-full bg-dbb-povrch" />;

  const typSloupce = (i: number): string => {
    const info = precti(db, `PRAGMA table_info(${uvoz(tabulka)})`);
    return info && info.values[i] ? String(info.values[i][2]).toUpperCase() : "";
  };

  const ulozBunku = (r: number, s: number, hodnota: string): string | null => {
    if (!data) return null;
    const typ = typSloupce(s);
    const cislo = /INT|REAL|NUM|FLOA|DOUB/.test(typ) && hodnota.trim() !== "" && !isNaN(Number(hodnota));
    const nova: unknown = cislo ? Number(hodnota) : hodnota;
    const puvodni = data.radky[r][s];
    if (String(puvodni) === String(nova) && puvodni !== null) return null;
    const sloupec = data.sloupce[s];
    const rowid = data.id[r];
    const zaznam = `UPDATE ${uvoz(tabulka)} SET ${uvoz(sloupec)}=${cislo ? nova : `'${hodnota.replace(/'/g, "''")}'`} WHERE "_rowid_"='${rowid}';`;
    const chybaText = api.provedAplikaci(`UPDATE ${uvoz(tabulka)} SET ${uvoz(sloupec)} = ? WHERE rowid = ?`, [nova, Number(rowid)], zaznam);
    if (!chybaText) api.udalost(`upraveno:${tabulka}`);
    return chybaText;
  };

  return (
    <div className="flex h-full flex-col p-1.5">
      <div className="flex h-[28px] shrink-0 items-center">
        <label className="mr-2 flex items-center text-[12px]">
          <span className="mr-1.5">Tabulka:</span>
          <select
            value={tabulka}
            onChange={(e) => {
              nastavTabulku(e.target.value);
              nastavFiltry([]);
              nastavRazeni(null);
              nastavVybrany(null);
              api.udalost(`prohlizet:${e.target.value}`);
            }}
            className="h-[22px] min-w-[160px] border border-dbb-linka bg-dbb-povrch px-1 text-[12px]"
          >
            {seznam.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          title="Obnovit (F5)"
          aria-label="Obnovit"
          onClick={() => nastavFiltry((f) => f.slice())}
          className="flex h-[24px] w-[26px] items-center justify-center rounded-[3px] hover:bg-dbb-hover"
        >
          <RefreshCw className="h-4 w-4 text-[#2e75b6]" />
        </button>
        <button
          type="button"
          title="Vymazat všechny filtry"
          aria-label="Vymazat všechny filtry"
          onClick={() => nastavFiltry([])}
          className="flex h-[24px] w-[26px] items-center justify-center rounded-[3px] hover:bg-dbb-hover"
        >
          <FilterX className="h-4 w-4" />
        </button>
        <button type="button" title="Tisk" aria-label="Tisk" disabled className="flex h-[24px] w-[26px] items-center justify-center opacity-40">
          <Printer className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-dbb-linka" aria-hidden="true" />
        <button
          type="button"
          onClick={() => {
            const c = api.provedAplikaci(`INSERT INTO ${uvoz(tabulka)} DEFAULT VALUES;`);
            nastavChybu(c);
          }}
          className="flex h-[24px] items-center rounded-[3px] px-1.5 text-[12px] hover:bg-dbb-hover"
        >
          <Plus className="mr-1 h-4 w-4 text-[#2e9d4f]" /> Nový záznam
        </button>
        <button
          type="button"
          disabled={!vybrany}
          onClick={() => {
            if (!vybrany || !data) return;
            const rowid = data.id[vybrany.r];
            const c = api.provedAplikaci(
              `DELETE FROM ${uvoz(tabulka)} WHERE rowid = ?`,
              [Number(rowid)],
              `DELETE FROM ${uvoz(tabulka)} WHERE "_rowid_"='${rowid}';`,
            );
            nastavChybu(c);
            nastavVybrany(null);
          }}
          className="flex h-[24px] items-center rounded-[3px] px-1.5 text-[12px] enabled:hover:bg-dbb-hover disabled:opacity-45"
        >
          <Trash2 className="mr-1 h-4 w-4 text-[#c42b1c]" /> Smazat záznam
        </button>
      </div>
      {chyba && (
        <div role="alert" className="mb-1 flex shrink-0 items-start border border-[#f1bbb9] bg-[#fdf3f2] px-2 py-1 text-[12px] text-[#a4262c]">
          <span className="flex-1">{chyba}</span>
          <button type="button" onClick={() => nastavChybu(null)} className="ml-3 underline">
            Zavřít
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 border border-dbb-linka">
        {data && (
          <Mrizka
            sloupce={data.sloupce}
            radky={data.radky}
            filtry={filtry}
            nastavFiltr={(i, text) =>
              nastavFiltry((f) => {
                const n = f.slice();
                while (n.length <= i) n.push("");
                n[i] = text;
                return n;
              })
            }
            razeni={razeni}
            kliknutiZahlavi={(i) =>
              nastavRazeni((r) => (r && r.sloupec === i ? (r.smer === "asc" ? { sloupec: i, smer: "desc" } : null) : { sloupec: i, smer: "asc" }))
            }
            ulozBunku={ulozBunku}
            vybrany={vybrany}
            vyber={(r, s) => nastavVybrany({ r, s })}
          />
        )}
      </div>
      <div className="flex h-[24px] shrink-0 items-center text-[12px] text-dbb-slaby">
        {data && (
          <span>
            {data.radky.length ? `1 - ${data.radky.length} z ${data.radky.length}` : "0 - 0 z 0"}
          </span>
        )}
      </div>
    </div>
  );
}
