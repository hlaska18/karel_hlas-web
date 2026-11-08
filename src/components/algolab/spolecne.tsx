"use client";

/** Stavební díly lekcí ALGOLABu. Vzhled drží Síťovou dílnu. */

import { useEffect, useState, type ReactNode } from "react";
import type { Zakazka } from "@/lib/algolab/batoh";

export const tlacitko =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/[.14] bg-[#18332b] px-3 py-[7px] text-[13px] text-[#e8f3ef] hover:bg-[#1f4136] disabled:cursor-default disabled:text-[#a6bdb4] disabled:opacity-60 disabled:hover:bg-[#18332b]";
export const hlavni =
  "inline-flex items-center gap-1.5 rounded-lg bg-[#6fe3c2] px-4 py-2 text-[14px] font-semibold text-[#06201a] hover:bg-[#8aeccf] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-[#6fe3c2]";
/** Rámeček pole má kontrast přes 3 : 1 proti pozadí (WCAG 1.4.11, Codex 7. 11. 2026). */
export const poleTrida =
  "rounded-lg border border-[#6f8a80] bg-[#0d1714] px-2.5 py-1.5 text-[14px] text-[#e8f3ef]";

export function Karta({ nadpis, children }: { nadpis?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#0d1714] p-4">
      {nadpis && <h3 className="mb-2.5 text-[15px] font-semibold">{nadpis}</h3>}
      {children}
    </section>
  );
}

const POZADI_HLASKY = {
  ok: "bg-[#123c30] text-[#c8f5e6]",
  tip: "bg-[#3a211c] text-[#ffd9d0]",
  info: "bg-[#122019] text-[#c5d6cf]",
};

export function Hlaska({ druh = "info", children }: { druh?: keyof typeof POZADI_HLASKY; children: ReactNode }) {
  return <div className={`rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed ${POZADI_HLASKY[druh]}`}>{children}</div>;
}

export function Zjednoduseno({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] leading-relaxed text-[#a6bdb4]">
      <b className="font-semibold text-[#c5d6cf]">Zjednodušeno.</b> {children}
    </p>
  );
}

export function NovyPojem({ pojem, children }: { pojem: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#6fe3c2]/30 bg-[#0f231d] p-3.5">
      <div className="text-[11px] font-semibold tracking-[.08em] text-[#6fe3c2]">NOVÝ POJEM</div>
      <div className="mt-1 text-[15px] font-semibold">{pojem}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-[#c5d6cf]">{children}</p>
    </div>
  );
}

/**
 * Pole na celé číslo. Rozepsaný text si drží samo, ven pošle jen platnou hodnotu.
 * Jinak by smazání poslední číslice přepsalo pole nulou nebo přepočítalo tabulku
 * s nesmyslem. Po opuštění se vrátí poslední platná hodnota.
 */
export function CisloPole({
  hodnota,
  od,
  po,
  onZmena,
  popisek,
}: {
  hodnota: number;
  od: number;
  po: number;
  onZmena: (n: number) => void;
  popisek: string;
}) {
  const [text, nastavText] = useState(String(hodnota));
  useEffect(() => nastavText(String(hodnota)), [hodnota]);
  return (
    <input
      type="number"
      min={od}
      max={po}
      value={text}
      aria-label={popisek}
      onChange={(e) => {
        nastavText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== "" && Number.isInteger(n) && n >= od && n <= po) onZmena(n);
      }}
      onBlur={() => nastavText(String(hodnota))}
      className={`${poleTrida} w-[68px]`}
    />
  );
}

export type Bunka = [number, number];
const obsahuje = (seznam: Bunka[] | undefined, r: number, s: number) => !!seznam?.some(([a, b]) => a === r && b === s);

/**
 * Tabulka dílčích řešení. Řádek `i` = smíš vybírat z prvních `i` zakázek,
 * sloupec `h` = stroj má `h` hodin. Posouvá se jen uvnitř rámečku.
 */
export function TabulkaDP({
  zakazky,
  kapacita,
  tabulka,
  odkryta,
  aktualni,
  zdroje,
  cesta,
  vlastni,
}: {
  zakazky: Zakazka[];
  kapacita: number;
  tabulka: number[][];
  odkryta?: (radek: number, sloupec: number) => boolean;
  aktualni?: Bunka | null;
  zdroje?: Bunka[];
  cesta?: Bunka[];
  /** Vlastní obsah buňky, například pole k doplnění. */
  vlastni?: (radek: number, sloupec: number) => ReactNode;
}) {
  const sloupce = Array.from({ length: kapacita + 1 }, (_, h) => h);
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-center text-[14px]">
        <caption className="sr-only">Tabulka nejlepších přínosů v tisících Kč podle počtu úkolů a volných hodin</caption>
        <thead>
          <tr className="bg-[#101c18] text-[12px] text-[#a6bdb4]">
            <th scope="col" className="whitespace-nowrap px-3 py-1.5 text-left font-medium">
              Vybíráš až po / hodiny
            </th>
            {sloupce.map((h) => (
              <th key={h} scope="col" className="min-w-[38px] px-1 py-1.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabulka.map((radek, r) => (
            <tr key={r} className="border-t border-white/[.07]">
              <th scope="row" className="whitespace-nowrap px-3 py-1 text-left text-[13px] font-normal text-[#c5d6cf]">
                {r === 0 ? (
                  "žádný úkol"
                ) : (
                  <>
                    {zakazky[r - 1].nazev} <span className="text-[#a6bdb4]">({zakazky[r - 1].doba} h, {zakazky[r - 1].prinos})</span>
                  </>
                )}
              </th>
              {radek.map((hodnota, s) => {
                const vidi = r === 0 || !odkryta || odkryta(r, s);
                const jeAktualni = aktualni?.[0] === r && aktualni?.[1] === s;
                const trida = jeAktualni
                  ? "bg-[#6fe3c2] font-semibold text-[#06201a]"
                  : obsahuje(zdroje, r, s)
                    ? "bg-[#1f4136] text-[#e8f3ef] outline outline-1 -outline-offset-1 outline-[#6fe3c2]"
                    : obsahuje(cesta, r, s)
                      ? "bg-[#123c30] font-semibold text-[#c8f5e6]"
                      : vidi
                        ? "text-[#c5d6cf]"
                        : "";
                const vlastniObsah = vlastni?.(r, s);
                return (
                  <td key={s} className={`h-8 px-1 tabular-nums ${trida}`}>
                    {vlastniObsah ?? (vidi ? hodnota : "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Kapacita({ pouzito, kapacita }: { pouzito: number; kapacita: number }) {
  const podil = Math.min(100, (pouzito / kapacita) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-[13px] text-[#c5d6cf]">
        <span>Čas stroje</span>
        <span className="tabular-nums">
          {pouzito} z {kapacita} h
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Využitý čas stroje"
        aria-valuemin={0}
        aria-valuemax={kapacita}
        aria-valuenow={pouzito}
        className="h-3 overflow-hidden rounded-full bg-[#18332b]"
      >
        <div className="h-full rounded-full bg-[#6fe3c2] transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${podil}%` }} />
      </div>
    </div>
  );
}
