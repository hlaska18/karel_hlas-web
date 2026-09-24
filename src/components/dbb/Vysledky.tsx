"use client";

/**
 * Moje výsledky (pro žáka) a Přehled třídy (pro učitele).
 *
 * Žádné účty ani server: žák ukáže obrazovku, vyfotí ji, nebo opíše kód
 * postupu do Teams. Učitel kódy vloží do Přehledu třídy a vidí tabulku.
 * Kód je shrnutí, ne důkaz – důkazem je stažený soubor z lekce 19.
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useDbb } from "@/components/dbb/kontext";
import { Okno, Tlacitko, Paticka } from "@/components/dbb/okna";
import { KURZ, SADY, lekceHotova, povinne } from "@/lib/dbb/kurz";
import { zakoduj, najdiKody, type Postup } from "@/lib/dbb/kodPostupu";
import { stahni } from "@/lib/dbb/stahni";
import { cist, zapsat } from "@/lib/dbb/uloziste";

const dva = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Postup žáka spočítaný z odškrtnutých úkolů. */
export function spoctiPostup(splneno: Set<string>, opsano: Set<string>, jmeno: string): Postup {
  const d = new Date();
  const hotove = KURZ.filter((l) => lekceHotova(l, splneno)).map((l) => l.id);
  const sede = KURZ.filter(
    (l) => lekceHotova(l, splneno) && povinne(l).some((u) => opsano.has(u.klic)),
  ).map((l) => l.id);
  let navic = 0;
  KURZ.forEach((l) => l.ukoly.forEach((u) => u.navic && splneno.has(u.klic) && navic++));
  const sady: Record<string, [number, number]> = {};
  SADY.forEach((s) => {
    const ukoly = s.lekce.ukoly;
    sady[s.id] = [ukoly.filter((u) => splneno.has(u.klic)).length, ukoly.length];
  });
  const ulohy = Array.from(splneno).filter((k) => k.indexOf("u-") === 0);
  return { jmeno, datum: `${d.getFullYear()}-${dva(d.getMonth() + 1)}-${dva(d.getDate())}`, hotove, sede, navic, sady, ulohy };
}

export function kopiruj(text: string, hotovo: () => void) {
  const zaloha = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      hotovo();
    } finally {
      document.body.removeChild(ta);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(hotovo, zaloha);
  else zaloha();
}

/** Dlaždice lekce: zelená = samostatně, šedá = s vloženým řešením, prázdná = zatím ne. */
function Dlazdice({ id, stav, nazev }: { id: number; stav: "hotova" | "seda" | "nic"; nazev: string }) {
  const barva =
    stav === "hotova"
      ? "border-[#2e9d4f] bg-[#2e9d4f] text-white"
      : stav === "seda"
        ? "border-[#9a9a9a] bg-[#c8c8c8] text-[#333]"
        : "border-dbb-linka bg-dbb-povrch text-dbb-slaby";
  return (
    <span title={nazev} className={`flex h-[30px] w-[30px] items-center justify-center border text-[12px] font-semibold ${barva}`}>
      {id}
    </span>
  );
}

export function MojeVysledky({ zavrit }: { zavrit: () => void }) {
  const { kurz } = useDbb();
  const [jmeno, nastavJmeno] = useState(() => cist("dbb-jmeno") || "");
  const [zkopirovano, nastavZkopirovano] = useState(false);
  const p = spoctiPostup(kurz.splneno, kurz.opsano, jmeno.trim());
  const kod = zakoduj(p);
  const d = new Date();
  const vlozeno = Array.from(kurz.opsano).length;

  return (
    <Okno titulek="Moje výsledky" zavrit={zavrit} sirka={560}>
      <div className="px-5 py-4 text-[12px] leading-relaxed">
        <label className="flex items-center">
          <span className="mr-2 shrink-0">Jméno:</span>
          <input
            value={jmeno}
            onChange={(e) => {
              nastavJmeno(e.target.value);
              zapsat("dbb-jmeno", e.target.value);
            }}
            placeholder="napiš své jméno, ať je na fotce i v kódu"
            className="h-[26px] flex-1 border border-dbb-linka px-2 text-[13px] focus:border-dbb-akcent"
          />
        </label>
        <p className="mt-4 text-[28px] font-semibold leading-none">
          Splněno {p.hotove.length}/{KURZ.length}
          <span className="ml-3 text-[13px] font-normal text-dbb-slaby">
            {d.getDate()}. {d.getMonth() + 1}. {d.getFullYear()} {dva(d.getHours())}:{dva(d.getMinutes())}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap" style={{ width: 10 * 34 }}>
          {KURZ.map((l) => (
            <span key={l.id} className="mb-1 mr-1">
              <Dlazdice
                id={l.id}
                nazev={l.title}
                stav={p.sede.indexOf(l.id) !== -1 ? "seda" : p.hotove.indexOf(l.id) !== -1 ? "hotova" : "nic"}
              />
            </span>
          ))}
        </div>
        <p className="mt-2 text-dbb-slaby">
          <span className="mr-1 inline-block h-2.5 w-2.5 bg-[#2e9d4f] align-middle" /> splněno samostatně
          <span className="ml-3 mr-1 inline-block h-2.5 w-2.5 bg-[#c8c8c8] align-middle" /> šedá = splněno s pomocí
          tlačítka Vložit do editoru
        </p>
        <p className="mt-1 text-dbb-slaby">
          Vložená řešení: {vlozeno} · úlohy navíc: {p.navic}
          {SADY.map((s) => (p.sady && p.sady[s.id] && p.sady[s.id][0] > 0 ? ` · ${s.kratce}: ${p.sady[s.id][0]}/${p.sady[s.id][1]}` : ""))}
          {p.ulohy && p.ulohy.length > 0 ? ` · úlohy od učitele: ${p.ulohy.length}` : ""}
        </p>

        <p className="mt-4 font-semibold">Kód postupu pro učitele</p>
        <p className="text-dbb-slaby">Opiš nebo zkopíruj ho do Teams. Je to shrnutí – důkazem práce je soubor z lekce 19.</p>
        <div className="mt-1 flex items-center">
          <code className="dbb-kod min-w-0 flex-1 select-all truncate border border-dbb-linka bg-dbb-okno px-2 py-1 text-[11px]">
            {kod}
          </code>
          <button
            type="button"
            onClick={() => kopiruj(kod, () => nastavZkopirovano(true))}
            className="ml-2 flex h-[26px] items-center border border-dbb-linka bg-dbb-povrch px-2 hover:bg-dbb-hover"
          >
            {zkopirovano ? <Check className="mr-1 h-3.5 w-3.5 text-[#2e9d4f]" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            {zkopirovano ? "Zkopírováno" : "Kopírovat"}
          </button>
        </div>
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={zavrit}>
          Zavřít
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}

export function PrehledTridy({ zavrit }: { zavrit: () => void }) {
  const [text, nastavText] = useState("");
  // Stejné jméno víckrát (žák poslal kód dvakrát) – platí nejnovější.
  const podleJmena: Record<string, Postup> = {};
  najdiKody(text).forEach((p) => {
    const klic = p.jmeno.toLowerCase() || "(bez jména)";
    if (!podleJmena[klic] || podleJmena[klic].datum <= p.datum) podleJmena[klic] = p;
  });
  const zaci = Object.keys(podleJmena)
    .sort((a, b) => a.localeCompare(b, "cs"))
    .map((k) => podleJmena[k]);

  const csv = () => {
    const hlava = ["Jméno", "Datum", "Splněno", "Šedé lekce", "Úlohy navíc"].concat(
      SADY.map((s) => s.kratce),
      ["Úlohy od učitele"],
    );
    const radky = zaci.map((z) =>
      [z.jmeno, z.datum, `${z.hotove.length}/${KURZ.length}`, z.sede.join(" "), String(z.navic)].concat(
        SADY.map((s) => (z.sady && z.sady[s.id] ? `${z.sady[s.id][0]}/${z.sady[s.id][1]}` : "")),
        [(z.ulohy || []).join(" ")],
      ),
    );
    const obsah = [hlava]
      .concat(radky)
      .map((r) => r.map((b) => `"${b.replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    // BOM, ať Excel pozná češtinu.
    stahni("prehled-tridy-sql.csv", new Uint8Array(new TextEncoder().encode("﻿" + obsah)), "text/csv");
  };

  return (
    <Okno titulek="Přehled třídy (pro učitele)" zavrit={zavrit} sirka={900}>
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 text-[12px]">
        <p className="leading-relaxed">
          Vlož kódy postupu od žáků – klidně celé zprávy z Teams, kódy se v textu najdou samy. Kód je shrnutí, ne
          důkaz: vzniká v prohlížeči žáka a dá se upravit. Důkazem práce je stažený soubor z lekce 19.
        </p>
        <textarea
          value={text}
          onChange={(e) => nastavText(e.target.value)}
          spellCheck={false}
          aria-label="Kódy postupu od žáků"
          placeholder="SQLKURZ1-…"
          className="dbb-kod mt-2 h-[90px] w-full shrink-0 resize-none border border-dbb-linka p-2 text-[11px] focus:border-dbb-akcent"
        />
        <div className="dbb-posuv mt-3 min-h-[120px] flex-1 overflow-auto border border-dbb-linka">
          {zaci.length === 0 ? (
            <p className="p-3 text-dbb-slaby">Zatím žádný kód.</p>
          ) : (
            <table className="w-full" style={{ borderSpacing: 0 }}>
              <thead>
                <tr className="bg-dbb-hlavicka text-left">
                  <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">Jméno</th>
                  <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">Datum</th>
                  <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">Splněno</th>
                  <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">Lekce</th>
                  <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">Navíc</th>
                  <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">Od učitele</th>
                </tr>
              </thead>
              <tbody>
                {zaci.map((z, i) => (
                  <tr key={i}>
                    <td className="border-b border-dbb-mrizka px-2 py-1 font-semibold">{z.jmeno || "(bez jména)"}</td>
                    <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">{z.datum}</td>
                    <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">
                      {z.hotove.length}/{KURZ.length}
                    </td>
                    <td className="border-b border-dbb-mrizka px-2 py-1">
                      <span className="flex">
                        {KURZ.map((l) => {
                          const stav = z.sede.indexOf(l.id) !== -1 ? "seda" : z.hotove.indexOf(l.id) !== -1 ? "hotova" : "nic";
                          return (
                            <span
                              key={l.id}
                              title={`${l.id}. ${l.title}`}
                              className={`mr-px h-[14px] w-[12px] ${
                                stav === "hotova" ? "bg-[#2e9d4f]" : stav === "seda" ? "bg-[#c8c8c8]" : "bg-dbb-mrizka"
                              }`}
                            />
                          );
                        })}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">
                      {z.navic}
                      {SADY.map((s) =>
                        z.sady && z.sady[s.id] && z.sady[s.id][0] > 0 ? ` · ${s.kratce} ${z.sady[s.id][0]}/${z.sady[s.id][1]}` : "",
                      )}
                    </td>
                    <td className="border-b border-dbb-mrizka px-2 py-1 dbb-kod text-[11px]">
                      {(z.ulohy || []).join(", ") || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Paticka
        vlevo={
          zaci.length > 0 ? (
            <button type="button" onClick={csv} className="h-[28px] border border-dbb-linka bg-dbb-povrch px-3 hover:bg-dbb-hover">
              Stáhnout jako CSV (Excel)
            </button>
          ) : null
        }
      >
        <Tlacitko primarni prvni akce={zavrit}>
          Zavřít
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}
