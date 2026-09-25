"use client";

/**
 * Moje výsledky a Přehled třídy pro simulátory Windows a macOS.
 *
 * Obdoba oken z kurzu SQL (`components/dbb/Vysledky.tsx`): žák se přihlásí
 * jménem, na konci hodiny zkopíruje kód postupu do Teams a učitel kódy vloží
 * do Přehledu třídy. Karel 25. 9. 2026: „se jménem a kódem postupu“.
 *
 * Okna jsou společná pro oba simulátory, vzhled si ale každý předá sám
 * (`Vzhled`) – ve Windows vypadají jako Windows, na Macu jako Mac. Přehled
 * třídy rozumí kódům ze všech tří simulátorů: WIN1-, MAC1- i SQLKURZ1-.
 */

import { useState, type ReactNode } from "react";
import { Check, Copy, X } from "lucide-react";
import {
  NAZEV_SIMULATORU,
  VYCHOZI_JMENO,
  dekodujSimulator,
  dnes,
  jmenoPlatne,
  najdiKodySimulatoru,
  sloucitSimulatory,
  textKopieSimulatoru,
  zakodujSimulator,
  type PostupSimulatoru,
  type Simulator,
} from "@/lib/postupSimulatoru";
import { najdiKody, sloucitPostupy } from "@/lib/dbb/kodPostupu";
import { stahni } from "@/lib/dbb/stahni";
import { UKOLY as UKOLY_WIN } from "@/lib/win/ukoly";
import { UKOLY_MAC } from "@/lib/mac/ukoly";

/** Třídy, kterými si simulátor okna obarví. */
export type Vzhled = {
  /** Obal okna: podklad, rámeček, stín, zaoblení. */
  okno: string;
  text: string;
  slaby: string;
  linka: string;
  /** Podklad při najetí myší – celá třída i s `hover:`, ať ji Tailwind najde. */
  najeti: string;
  /** Zvýrazňovací barva jako podklad a text na něm. */
  akcent: string;
  akcentText: string;
  /** Zvýrazňovací barva jako barva textu (odkazy). */
  akcentPismo: string;
  /** Textové pole. */
  pole: string;
};

type UkolKratce = { id: string; nazev: string };

const UKOLY: Record<Simulator, UkolKratce[]> = {
  windows: UKOLY_WIN.map((u) => ({ id: u.id, nazev: u.nazev })),
  macos: UKOLY_MAC.map((u) => ({ id: u.id, nazev: u.nazev })),
};

/** Kolik z úloh simulátoru je splněných (jen úlohy, které pořád existují). */
function hotovychZ(simulator: Simulator, splneno: string[]): number {
  return UKOLY[simulator].filter((u) => splneno.indexOf(u.id) !== -1).length;
}

function kopiruj(text: string, hotovo: () => void) {
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

/** Modální okno přes celou obrazovku simulátoru. */
function Okno({
  titulek,
  zavri,
  sirka,
  vzhled,
  children,
}: {
  titulek: string;
  zavri: () => void;
  sirka: number;
  vzhled: Vzhled;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-[960] flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) zavri();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulek}
        className={`flex max-h-[90%] w-full flex-col overflow-hidden ${vzhled.okno} ${vzhled.text}`}
        style={{ maxWidth: sirka }}
        onKeyDown={(e) => {
          if (e.key === "Escape") zavri();
        }}
      >
        <div className={`flex shrink-0 items-center border-b px-4 py-3 ${vzhled.linka}`}>
          <h2 className="flex-1 text-[14px] font-semibold">{titulek}</h2>
          <button type="button" onClick={zavri} aria-label="Zavřít" className={`rounded p-1 ${vzhled.najeti}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[12px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/** Dlaždice úloh: zelená = splněná, prázdná = zatím ne. Číslo = pořadí v panelu. */
function Dlazdice({ simulator, splneno, vzhled, mala }: { simulator: Simulator; splneno: string[]; vzhled: Vzhled; mala?: boolean }) {
  return (
    <span className="flex flex-wrap">
      {UKOLY[simulator].map((u, i) => {
        const hotovo = splneno.indexOf(u.id) !== -1;
        return (
          <span
            key={u.id}
            title={`${i + 1}. ${u.nazev}${hotovo ? " – splněno" : ""}`}
            className={`mb-1 mr-1 flex items-center justify-center rounded-[4px] border font-semibold tabular-nums ${
              mala ? "h-[16px] w-[16px] text-[9px]" : "h-[26px] w-[26px] text-[11px]"
            } ${hotovo ? "border-[#2e9d4f] bg-[#2e9d4f] text-white" : `${vzhled.linka} ${vzhled.slaby}`}`}
          >
            {mala ? "" : i + 1}
          </span>
        );
      })}
    </span>
  );
}

/* ─────────────────────────── Moje výsledky ─────────────────────────── */

export function MojeVysledkySimulatoru({
  simulator,
  jmeno,
  nastavJmeno,
  splneno,
  obnov,
  otevriPrehled,
  zavri,
  vzhled,
}: {
  simulator: Simulator;
  jmeno: string;
  nastavJmeno: (jmeno: string) => void;
  splneno: string[];
  /** Pokračovat z kódu: přidá splněné úlohy z kódu k těm, co tu jsou. */
  obnov: (ids: string[]) => void;
  otevriPrehled: () => void;
  zavri: () => void;
  vzhled: Vzhled;
}) {
  const [upravovane, nastavUpravovane] = useState(jmeno === VYCHOZI_JMENO ? "" : jmeno);
  const [zkopirovano, nastavZkopirovano] = useState(false);
  const [vlozeny, nastavVlozeny] = useState("");
  const [obnova, nastavObnovu] = useState<{ ok: boolean; text: string } | null>(null);

  const hotovo = hotovychZ(simulator, splneno);
  const celkem = UKOLY[simulator].length;
  const platne = jmenoPlatne(upravovane);
  const postup: PostupSimulatoru = {
    simulator,
    jmeno: upravovane.trim(),
    datum: dnes(),
    splneno: splneno.filter((id) => UKOLY[simulator].some((u) => u.id === id)),
    celkem,
  };
  const kod = zakodujSimulator(postup);

  const nactiKod = () => {
    const p = najdiKodySimulatoru(vlozeny)[0] || dekodujSimulator(vlozeny);
    if (!p) {
      nastavObnovu({ ok: false, text: "Tohle není kód postupu. Vlož celý kód, jak jsi ho poslal(a) do Teams." });
      return;
    }
    if (p.simulator !== simulator) {
      nastavObnovu({
        ok: false,
        text: `Tohle je kód ze simulátoru ${NAZEV_SIMULATORU[p.simulator]}. Vlož ho tam – tady je ${NAZEV_SIMULATORU[simulator]}.`,
      });
      return;
    }
    const ids = p.splneno.filter((id) => UKOLY[simulator].some((u) => u.id === id));
    obnov(ids);
    if (!platne && p.jmeno) {
      nastavUpravovane(p.jmeno);
      nastavJmeno(p.jmeno);
    }
    nastavVlozeny("");
    const slovy = ids.length === 1 ? "1 splněná úloha" : ids.length >= 2 && ids.length <= 4 ? `${ids.length} splněné úlohy` : `${ids.length} splněných úloh`;
    nastavObnovu({ ok: true, text: `Načteno z kódu: ${slovy}. Úlohy, které máš hotové tady, zůstaly.` });
  };

  return (
    <Okno titulek={`Moje výsledky – ${NAZEV_SIMULATORU[simulator]}`} zavri={zavri} sirka={520} vzhled={vzhled}>
      <label className="flex items-center">
        <span className="mr-2 shrink-0">Jméno:</span>
        <input
          value={upravovane}
          onChange={(e) => {
            nastavUpravovane(e.target.value);
            if (jmenoPlatne(e.target.value)) nastavJmeno(e.target.value.trim());
          }}
          placeholder="jméno a příjmení"
          aria-invalid={!platne}
          spellCheck={false}
          className={`h-[28px] flex-1 rounded-[4px] px-2 text-[13px] ${vzhled.pole} ${platne ? "" : "!border-[#c42b1c]"}`}
        />
      </label>

      <p className="mt-4 flex items-baseline leading-none">
        <span className="mr-4 text-[28px] font-semibold tabular-nums">
          Hotovo {hotovo}/{celkem}
        </span>
        <span className={`text-[12px] ${vzhled.slaby}`}>{new Date().toLocaleDateString("cs-CZ")}</span>
      </p>
      <div className="mt-3">
        <Dlazdice simulator={simulator} splneno={splneno} vzhled={vzhled} />
      </div>
      <p className={`mt-1 ${vzhled.slaby}`}>Zelená = splněná úloha. Číslo je pořadí v panelu Úkoly, po najetí myší se ukáže název.</p>

      <p className="mt-4 font-semibold">Kód postupu pro učitele</p>
      <p className={vzhled.slaby}>Zkopíruj ho do Teams. Když Teams nejde, vyfoť celé tohle okno.</p>
      <div className="mt-1 flex items-center">
        <code className={`min-w-0 flex-1 select-all truncate rounded-[4px] border px-2 py-1 font-mono text-[11px] ${vzhled.linka}`}>{kod}</code>
        <button
          type="button"
          disabled={!platne}
          title={platne ? undefined : "Nejdřív nahoře napiš své jméno a příjmení."}
          onClick={() => kopiruj(textKopieSimulatoru(postup, kod, hotovo, celkem), () => nastavZkopirovano(true))}
          className={`ml-2 flex h-[28px] shrink-0 items-center rounded-[4px] px-3 disabled:opacity-45 ${vzhled.akcent} ${vzhled.akcentText}`}
        >
          {zkopirovano ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {zkopirovano ? "Zkopírováno" : "Kopírovat"}
        </button>
      </div>

      <p className="mt-4 font-semibold">Pokračovat z kódu</p>
      <p className={vzhled.slaby}>Začal(a) jsi na jiném počítači? Vlož svůj kód postupu a úlohy se ti odškrtnou i tady.</p>
      <div className="mt-1 flex items-center">
        <input
          value={vlozeny}
          onChange={(e) => {
            nastavVlozeny(e.target.value);
            nastavObnovu(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") nactiKod();
          }}
          spellCheck={false}
          placeholder={simulator === "windows" ? "WIN1-…" : "MAC1-…"}
          aria-label="Kód postupu z jiného počítače"
          className={`h-[28px] min-w-0 flex-1 rounded-[4px] px-2 font-mono text-[11px] ${vzhled.pole}`}
        />
        <button
          type="button"
          disabled={!vlozeny.trim()}
          onClick={nactiKod}
          className={`ml-2 h-[28px] shrink-0 rounded-[4px] border px-3 disabled:opacity-45 ${vzhled.linka} ${vzhled.najeti}`}
        >
          Načíst
        </button>
      </div>
      {obnova && <p className={`mt-1 ${obnova.ok ? "text-[#1e8a3c]" : "text-[#c42b1c]"}`}>{obnova.text}</p>}

      <button type="button" onClick={otevriPrehled} className={`mt-5 underline ${vzhled.akcentPismo}`}>
        Pro učitele: Přehled třídy
      </button>
    </Okno>
  );
}

/* ─────────────────────────── Přehled třídy ─────────────────────────── */

const PISEMKA_SADA: Record<string, string> = { A: "dilna", B: "stavebniny" };

export function PrehledTridySimulatoru({ zavri, vzhled }: { zavri: () => void; vzhled: Vzhled }) {
  const [text, nastavText] = useState("");
  const simulatory = sloucitSimulatory(najdiKodySimulatoru(text));
  // Kurz SQL: stačí shrnutí. Podrobný přehled (lekce, šedé, písemky) je
  // v programu na /sql, Nápověda → Přehled třídy.
  const sql = sloucitPostupy(najdiKody(text));
  const pocet = (hotove: number[], od: number, po: number) => hotove.filter((id) => id >= od && id <= po).length;
  const bunka = `border-b px-2 py-1 ${vzhled.linka}`;

  const csv = () => {
    const radky: string[][] = [["Simulátor", "Jméno", "Datum", "Hotovo", "Celkem", "Splněné úlohy"]];
    simulatory.forEach((z) => {
      const nazvy = UKOLY[z.simulator].filter((u) => z.splneno.indexOf(u.id) !== -1).map((u) => u.nazev);
      radky.push([NAZEV_SIMULATORU[z.simulator], z.jmeno, z.datum, String(nazvy.length), String(UKOLY[z.simulator].length), nazvy.join(" | ")]);
    });
    sql.forEach((z) => {
      radky.push([
        z.pisemka ? `Kurz SQL – písemka ${z.pisemka}` : "Kurz SQL",
        z.jmeno,
        z.datum,
        z.pisemka ? String(((z.sady || {})[PISEMKA_SADA[z.pisemka]] || [0])[0]) : `Dotazy ${pocet(z.hotove, 1, 13)}/13, Program ${pocet(z.hotove, 14, 19)}/6`,
        z.pisemka ? "16" : "19",
        "",
      ]);
    });
    const obsah = radky.map((r) => r.map((b) => `"${b.replace(/"/g, '""')}"`).join(";")).join("\r\n");
    // BOM, ať Excel pozná češtinu.
    stahni("prehled-tridy-simulatory.csv", new TextEncoder().encode("\uFEFF" + obsah), "text/csv");
  };

  const sekce = (simulator: Simulator) => {
    const zaci = simulatory.filter((z) => z.simulator === simulator);
    if (!zaci.length) return null;
    const ukoly = UKOLY[simulator];
    return (
      <section key={simulator} className="mt-4">
        <h3 className="text-[13px] font-semibold">
          {NAZEV_SIMULATORU[simulator]} · {zaci.length} {zaci.length === 1 ? "žák" : zaci.length < 5 ? "žáci" : "žáků"}
        </h3>
        <table className="mt-1 w-full" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className={`text-left ${vzhled.slaby}`}>
              <th className={`${bunka} font-normal`}>Jméno</th>
              <th className={`${bunka} font-normal`}>Datum</th>
              <th className={`${bunka} font-normal`}>Hotovo</th>
              <th className={`${bunka} font-normal`}>Úlohy</th>
            </tr>
          </thead>
          <tbody>
            {zaci.map((z, i) => (
              <tr key={i}>
                <td className={`${bunka} font-semibold`}>{z.jmeno || "(bez jména)"}</td>
                <td className={`${bunka} whitespace-nowrap`}>{z.datum}</td>
                <td className={`${bunka} whitespace-nowrap tabular-nums`}>
                  {hotovychZ(simulator, z.splneno)}/{ukoly.length}
                </td>
                <td className={bunka}>
                  <Dlazdice simulator={simulator} splneno={z.splneno} vzhled={vzhled} mala />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className={`px-2 py-1 text-right ${vzhled.slaby}`}>
                Úlohu má hotovou:
              </td>
              <td className="px-2 py-1">
                <span className="flex flex-wrap">
                  {ukoly.map((u, i) => {
                    const kolik = zaci.filter((z) => z.splneno.indexOf(u.id) !== -1).length;
                    return (
                      <span
                        key={u.id}
                        title={`${i + 1}. ${u.nazev}: ${kolik} z ${zaci.length}`}
                        className="mb-1 mr-1 w-[16px] text-center text-[9px] leading-[16px] text-white"
                        style={{ background: `rgba(46, 157, 79, ${0.15 + (0.85 * kolik) / zaci.length})` }}
                      >
                        {kolik}
                      </span>
                    );
                  })}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    );
  };

  return (
    <Okno titulek="Přehled třídy (pro učitele)" zavri={zavri} sirka={860} vzhled={vzhled}>
      <p>
        Vlož kódy postupu od žáků – klidně celé zprávy z Teams, kódy se v textu najdou samy. Rozumí kódům z Windows (WIN1-),
        z macOS (MAC1-) i z kurzu SQL (SQLKURZ1-). Kódy téhož žáka se sčítají. Kód je shrnutí, ne důkaz: vzniká v prohlížeči
        žáka a dá se upravit.
      </p>
      <textarea
        value={text}
        onChange={(e) => nastavText(e.target.value)}
        spellCheck={false}
        aria-label="Kódy postupu od žáků"
        placeholder="WIN1-…  MAC1-…  SQLKURZ1-…"
        className={`mt-2 h-[90px] w-full resize-none rounded-[4px] p-2 font-mono text-[11px] ${vzhled.pole}`}
      />
      {!simulatory.length && !sql.length ? (
        <p className={`mt-3 ${vzhled.slaby}`}>Zatím žádný kód.</p>
      ) : (
        <>
          {sekce("windows")}
          {sekce("macos")}
          {sql.length > 0 && (
            <section className="mt-4">
              <h3 className="text-[13px] font-semibold">Kurz SQL</h3>
              <table className="mt-1 w-full" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr className={`text-left ${vzhled.slaby}`}>
                    <th className={`${bunka} font-normal`}>Jméno</th>
                    <th className={`${bunka} font-normal`}>Datum</th>
                    <th className={`${bunka} font-normal`}>Výsledek</th>
                  </tr>
                </thead>
                <tbody>
                  {sql.map((z, i) => (
                    <tr key={i}>
                      <td className={`${bunka} font-semibold`}>{z.jmeno || "(bez jména)"}</td>
                      <td className={`${bunka} whitespace-nowrap`}>{z.datum}</td>
                      <td className={`${bunka} tabular-nums`}>
                        {z.pisemka
                          ? `Písemka ${z.pisemka}: ${((z.sady || {})[PISEMKA_SADA[z.pisemka]] || [0, 16])[0]}/16`
                          : `Dotazy ${pocet(z.hotove, 1, 13)}/13 · Program ${pocet(z.hotove, 14, 19)}/6`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={`mt-1 ${vzhled.slaby}`}>
                Podrobný přehled kurzu SQL (lekce, zobrazená řešení, kde začít příště) je v programu na /sql v nabídce Nápověda → Přehled
                třídy.
              </p>
            </section>
          )}
          <button type="button" onClick={csv} className={`mt-4 h-[28px] rounded-[4px] border px-3 ${vzhled.linka} ${vzhled.najeti}`}>
            Stáhnout jako CSV (Excel)
          </button>
        </>
      )}
    </Okno>
  );
}
