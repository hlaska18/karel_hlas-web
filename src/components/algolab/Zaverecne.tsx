"use client";

/**
 * Hodina 8: závěrečné ověření. Žák vidí jen otázky, ne správnost. Na konci
 * zkopíruje jednu zprávu s čitelnými odpověďmi a kódem ALGZ1- a pošle ji
 * vyučujícímu. Vyučující zprávy vloží do přehledu: ten variantu každého žáka
 * vytvoří znovu, automatické části spočítá a ruční body si pamatuje v prohlížeči.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, ClipboardCopy, Download, GraduationCap, Trash2 } from "lucide-react";
import { normalizujJmeno } from "@/lib/dbb/kodPostupu";
import { bezVzorce } from "@/lib/dbb/csv";
import { stahni } from "@/lib/dbb/stahni";
import { jmenoPlatne } from "@/lib/postupSimulatoru";
import { ulozDoProhlizece } from "@/lib/ulozeni";
import {
  BODY,
  CVICNE_ZADANI,
  dekodujOdevzdani,
  MAX_ODPOVEDI,
  najdiOdevzdani,
  nenactenaOdevzdani,
  noveZadani,
  prazdneOdpovedi,
  RUBRIKA,
  spoctiBody,
  spravneStrategie,
  STRATEGIE,
  VERZE_GENERATORU,
  vytvorVariantu,
  zakodujOdevzdani,
  zpravaProUcitele,
  type Odevzdani,
  type OdpovediZaverecne,
  type Varianta,
} from "@/lib/algolab/zaverecne";
import { normalizujHeslo, zadaniZHesla } from "@/lib/algolab/obal";
import { jmenaPraci, klicPrace, otiskPrace, praceBez, praceDoTextu, praceZTextu, type PraceZaka, type SkladPraci } from "@/lib/algolab/praceH8";
import { cz } from "./Kostra";
import { Hlaska, Karta, TabulkaDP, hlavni, poleTrida, tlacitko } from "./spolecne";

const KLIC_PRACE = "algolab-h8";
const KLIC_HODNOCENI = "algolab-hodnoceni";
const KLIC_ODEVZDANYCH = "algolab-odevzdane";
/** Hesla zadání, která vyučující v tomhle prohlížeči vytvořil nebo zadal. */
const KLIC_HESEL = "algolab-hesla-zadani";

function cti<T>(klic: string, vychozi: T): T {
  try {
    const t = window.localStorage.getItem(klic);
    return t ? (JSON.parse(t) as T) : vychozi;
  } catch {
    return vychozi;
  }
}

function kopiruj(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return Promise.resolve(false);
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false,
  );
}

const dnes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function Zaverecne({ zadaniZAdresy }: { zadaniZAdresy: string | null }) {
  const [rezim, nastavRezim] = useState<"uvod" | "zak" | "ucitel">(zadaniZAdresy ? "zak" : "uvod");
  const [zadani, nastavZadani] = useState(zadaniZAdresy ?? CVICNE_ZADANI);
  const obsah = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Novější prohlížeče vracejí ze scrollTo Promise, efekt nesmí nic vrátit.
    obsah.current?.scrollTo({ top: 0 });
  }, [rezim]);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div ref={obsah} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {rezim === "uvod" && (
          <Uvod
            cvicne={() => {
              nastavZadani(CVICNE_ZADANI);
              nastavRezim("zak");
            }}
            ucitel={() => nastavRezim("ucitel")}
          />
        )}
        {rezim === "zak" && <Zak zadani={zadani} zpet={zadaniZAdresy ? undefined : () => nastavRezim("uvod")} />}
        {rezim === "ucitel" && <Ucitel zpet={() => nastavRezim("uvod")} />}
      </div>
    </main>
  );
}

function Uvod({ cvicne, ucitel }: { cvicne: () => void; ucitel: () => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h2 className="text-[22px] font-semibold">Závěrečné ověření</h2>
      <p className="text-[15px] leading-relaxed text-[#c5d6cf]">
        Jediný známkovaný výstup bloku, 45 minut. Čtyři části: rozpoznat vhodný algoritmus, doplnit tabulku dynamického programování, porovnat
        algoritmy výpočtem a krátce zdůvodnit. Každý žák má vlastní čísla podle svého jména.
      </p>
      <div className="grid gap-2.5 md:grid-cols-2">
        <Karta nadpis="Jsem žák">
          <p className="mb-3 text-[14px] leading-relaxed text-[#c5d6cf]">
            Odkaz na ostré ověření ti pošle vyučující. Tady si můžeš vyzkoušet cvičné: na konci uvidíš body a správné odpovědi.
          </p>
          <button type="button" onClick={cvicne} className={hlavni}>
            Cvičné ověření <ChevronRight className="h-4 w-4" />
          </button>
        </Karta>
        <Karta nadpis="Jsem vyučující">
          <p className="mb-3 text-[14px] leading-relaxed text-[#c5d6cf]">
            Vytvoř odkaz pro třídu, vlož odevzdané zprávy a doplň body za zdůvodnění. Všechno zůstává jen v tomhle prohlížeči.
          </p>
          <button type="button" onClick={ucitel} className={tlacitko}>
            <GraduationCap className="h-4 w-4" /> Pro vyučující
          </button>
        </Karta>
      </div>
      <Tabulka3Casti />
    </div>
  );
}

function Tabulka3Casti() {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-[14px]">
        <caption className="sr-only">Části závěrečného ověření</caption>
        <thead className="bg-[#101c18] text-[12px] text-[#a6bdb4]">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Část</th>
            <th scope="col" className="px-3 py-2 font-medium">Čas</th>
            <th scope="col" className="px-3 py-2 font-medium">Body</th>
            <th scope="col" className="px-3 py-2 font-medium">Hodnotí</th>
          </tr>
        </thead>
        <tbody className="text-[#c5d6cf]">
          {[
            ["1. Rozpoznání strategie u čtyř situací", "8 min", BODY.strategie, "počítač"],
            ["2. Tabulka dynamického programování", "12 min", BODY.dp, "počítač"],
            ["3. Porovnání algoritmů výpočtem", "12 min", BODY.porovnani, "počítač"],
            ["4. Zdůvodnění, tři krátké odpovědi", "13 min", BODY.zduvodneni, "vyučující podle rubriky"],
          ].map((r) => (
            <tr key={String(r[0])} className="border-t border-white/[.07]">
              {r.map((b, i) => (
                <td key={i} className="px-3 py-1.5">
                  {b}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────── Žák ───────────── */

/** sessionStorage: klíč práce otevřené v téhle kartě. Po obnovení stránky tak žák nemusí psát jméno znovu. */
const KLIC_JA = "algolab-h8-ja";

function ctiSklad(): SkladPraci {
  let text: string | null = null;
  try {
    text = window.localStorage.getItem(KLIC_PRACE);
  } catch {
    /* úložiště je zakázané */
  }
  return praceZTextu(text, dnes());
}

function ctiJa(): string | null {
  try {
    return window.sessionStorage.getItem(KLIC_JA);
  } catch {
    return null;
  }
}

function zapisJa(klic: string | null) {
  try {
    if (klic === null) window.sessionStorage.removeItem(KLIC_JA);
    else window.sessionStorage.setItem(KLIC_JA, klic);
  } catch {
    /* jen pohodlí */
  }
}

const bezZmeny = ({ zadani, jmeno, odpovedi, odevzdano, datum }: PraceZaka): PraceZaka => ({ zadani, jmeno, odpovedi, odevzdano, datum });

function Zak({ zadani, zpet }: { zadani: string; zpet?: () => void }) {
  // Práce se drží zvlášť podle zadání a jména. Sama se otevře jen ta, kterou žák rozdělal v téhle kartě.
  const [prace, nastavPraci] = useState<PraceZaka | null>(() => {
    const ja = ctiJa();
    const p = ja ? ctiSklad()[ja] : undefined;
    return p && p.zadani === zadani ? bezZmeny(p) : null;
  });
  const [jmeno, nastavJmeno] = useState("");
  const [chyba, nastavChybu] = useState("");
  const cvicne = zadani === CVICNE_ZADANI;

  // Ověření otevřené ve dvou kartách: starší karta by přepsala novější odpovědi, proto přestane ukládat.
  const [jinde, nastavJinde] = useState(false);
  const aktualni = useRef(prace);
  aktualni.current = prace;
  /** Otisk práce, jak ji tahle karta naposledy uložila. */
  const ulozeno = useRef<string | null>(null);
  useEffect(() => {
    const zmena = (e: StorageEvent) => {
      // `key === null` je smazání celého úložiště (localStorage.clear()).
      if (e.key !== null && e.key !== KLIC_PRACE) return;
      const moje = aktualni.current;
      if (!moje || ulozeno.current === null) return;
      const vedle = ctiSklad()[klicPrace(moje.zadani, moje.jmeno)];
      // Cizí práce ve stejném prohlížeči se mě netýká, jen změna té mojí.
      if (!vedle || otiskPrace(vedle) !== ulozeno.current) nastavJinde(true);
    };
    window.addEventListener("storage", zmena);
    return () => {
      window.removeEventListener("storage", zmena);
    };
  }, []);

  useEffect(() => {
    if (!prace || jinde) return;
    ulozeno.current = otiskPrace(prace);
    ulozDoProhlizece(KLIC_PRACE, praceDoTextu(ctiSklad(), prace, Date.now()));
    zapisJa(klicPrace(prace.zadani, prace.jmeno));
  }, [prace, jinde]);

  /** Jiný žák u stejného počítače: práce zůstane uložená, jen se zavře. */
  const odejdi = () => {
    zapisJa(null);
    ulozeno.current = null;
    nastavJinde(false);
    nastavPraci(null);
  };

  /** Cvičné ověření znovu: tuhle jednu práci smaže. */
  const smaz = () => {
    if (prace) ulozDoProhlizece(KLIC_PRACE, praceBez(ctiSklad(), klicPrace(prace.zadani, prace.jmeno)));
    odejdi();
  };

  if (!prace) {
    const ulozena = jmenaPraci(ctiSklad(), zadani);
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h2 className="text-[22px] font-semibold">{cvicne ? "Cvičné ověření" : "Závěrečné ověření"}</h2>
        <p className="text-[15px] leading-relaxed text-[#c5d6cf]">
          {cvicne
            ? "Cvičné zadání se nehodnotí. Na konci uvidíš body i správné odpovědi."
            : `Zadání ${zadani}. Během práce neuvidíš, co máš správně. Na konci zkopíruješ jednu zprávu a pošleš ji vyučujícímu.`}{" "}
          Čísla v úlohách se odvodí z tvého jména, proto ho napiš celé a stejně, jako ho znáš z třídní knihy.
        </p>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!jmenoPlatne(jmeno)) {
              nastavChybu("Napiš své celé jméno.");
              return;
            }
            const cele = jmeno.trim().replace(/\s+/g, " ");
            // Stejné jméno u stejného zadání = pokračování v uložené práci.
            const rozdelana = ctiSklad()[klicPrace(zadani, cele)];
            nastavJmeno("");
            nastavPraci(rozdelana ? bezZmeny(rozdelana) : { zadani, jmeno: cele, odpovedi: prazdneOdpovedi(), odevzdano: false, datum: dnes() });
          }}
        >
          <label htmlFor="algolab-jmeno" className="text-[14px]">
            Jméno a příjmení
          </label>
          <input
            id="algolab-jmeno"
            value={jmeno}
            onChange={(e) => {
              nastavJmeno(e.target.value);
              nastavChybu("");
            }}
            maxLength={80}
            autoComplete="off"
            className={`${poleTrida} w-[260px]`}
          />
          <button type="submit" className={hlavni}>
            Začít
          </button>
        </form>
        {chyba && (
          <p role="status" className="text-[13px] text-[#ff9d8a]">
            {chyba}
          </p>
        )}
        {ulozena.length > 0 && (
          <p className="text-[13px] leading-relaxed text-[#a6bdb4]">
            V tomhle prohlížeči je uložená práce: {ulozena.join(", ")}. Je-li některá tvoje, napiš jméno stejně a budeš pokračovat, kde jsi
            skončil(a). Cizí práci nech být.
          </p>
        )}
        {zpet && (
          <div>
            <button type="button" onClick={zpet} className={tlacitko}>
              Zpět
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {jinde && (
        <div role="alert" className="mb-4 flex max-w-4xl flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <Hlaska druh="tip">
              Ověření máš otevřené i v jiné kartě a odpovědi se tam změnily. Aby se nic nepřepsalo, tahle karta teď neukládá. Vyber, s čím
              chceš pokračovat.
            </Hlaska>
          </div>
          <button
            type="button"
            onClick={() => {
              const vedle = ctiSklad()[klicPrace(prace.zadani, prace.jmeno)];
              if (!vedle) {
                odejdi();
                return;
              }
              nastavPraci(bezZmeny(vedle));
              nastavJinde(false);
            }}
            className={hlavni}
          >
            Načíst odpovědi z druhé karty
          </button>
          <button type="button" onClick={() => nastavJinde(false)} className={tlacitko}>
            Nechat odpovědi z téhle karty
          </button>
        </div>
      )}
      <Test prace={prace} nastavPraci={(p) => (p ? nastavPraci(p) : smaz())} cvicne={cvicne} zpet={zpet} jinyZak={odejdi} />
    </>
  );
}

function Test({
  prace,
  nastavPraci,
  cvicne,
  zpet,
  jinyZak,
}: {
  prace: PraceZaka;
  nastavPraci: (p: PraceZaka | null) => void;
  cvicne: boolean;
  zpet?: () => void;
  jinyZak: () => void;
}) {
  const v = useMemo(() => vytvorVariantu(prace.jmeno, prace.zadani), [prace.jmeno, prace.zadani]);
  const o = prace.odpovedi;
  const zamceno = prace.odevzdano;
  const [potvrdit, nastavPotvrdit] = useState(false);
  const zmen = (z: Partial<OdpovediZaverecne>) => nastavPraci({ ...prace, odpovedi: { ...o, ...z } });
  const nevyplneno =
    o.situace.filter((s) => s < 0).length +
    o.bunky.filter((b) => !b.trim()).length +
    (o.vyznam < 0 ? 1 : 0) +
    (o.kapacita.trim() ? 0 : 1) +
    o.porovnani.filter((p) => !p.trim()).length +
    o.texty.filter((t) => !t.trim()).length;
  const indexBunky = (r: number, s: number) => v.dp.bunky.findIndex((b) => b.radek === r && b.sloupec === s);
  const zakazkaVyznamu = v.dp.zakazky[v.dp.vyznam.radek - 1];

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[22px] font-semibold">{cvicne ? "Cvičné ověření" : "Závěrečné ověření"}</h2>
        <span className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-[#a6bdb4]">
          {prace.jmeno} · zadání {prace.zadani}
          <button type="button" onClick={jinyZak} className="underline underline-offset-2 hover:text-[#e8f3ef]">
            Nejsi to ty?
          </button>
        </span>
      </div>
      {!zamceno && (
        <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
          Odpovědi se průběžně ukládají v prohlížeči. Kalkulačku i papír smíš použít. Nástroje z lekcí ti spočítají čísla, ale body jsou hlavně
          za to, že víš proč.
        </p>
      )}

      <Karta nadpis={`Část 1: Který postup se hodí? (${BODY.strategie} b, asi 8 min)`}>
        <p className="mb-2.5 text-[13px] text-[#a6bdb4]">
          U každé situace vyber z postupů, které znáš z hodin, ten nejúspornější, který splní, co situace žádá.
        </p>
        <div className="flex flex-col gap-3">
          {v.situace.map((s, i) => (
            <label key={i} className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
              <span>
                <span className="font-semibold">{i + 1}.</span> {s.text}
              </span>
              <select
                value={o.situace[i]}
                disabled={zamceno}
                onChange={(e) => zmen({ situace: o.situace.map((x, j) => (j === i ? Number(e.target.value) : x)) })}
                className={`${poleTrida} max-w-[420px]`}
              >
                <option value={-1}>vyber postup</option>
                {STRATEGIE.map((st, j) => (
                  <option key={st} value={j}>
                    {st}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Karta>

      <Karta nadpis={`Část 2: Tabulka dynamického programování (${BODY.dp} b, asi 12 min)`}>
        <p className="mb-2.5 text-[14px] leading-relaxed text-[#c5d6cf]">
          Stroj má {v.dp.kapacita} volných hodin. Úkol se udělá celý, nebo vůbec. Buňka = nejlepší přínos v tisících Kč, když smíš vybírat z
          úkolů až po tento řádek a stroj má tolik hodin, kolik je ve sloupci.
        </p>
        <div className="mb-1 text-[14px]">
          <span className="font-semibold">5.</span> Doplň tři buňky s rámečkem (5 b za každou).
        </div>
        <TabulkaDP
          zakazky={v.dp.zakazky}
          kapacita={v.dp.kapacita}
          tabulka={v.dp.tabulka}
          vlastni={(r, s) => {
            const i = indexBunky(r, s);
            if (i < 0) return null;
            return (
              <input
                inputMode="numeric"
                value={o.bunky[i]}
                disabled={zamceno}
                aria-label={`Buňka ${v.dp.zakazky[r - 1].nazev}, ${s} h`}
                onChange={(e) => zmen({ bunky: o.bunky.map((b, j) => (j === i ? e.target.value : b)) })}
                className={`${poleTrida} w-[52px] !border-[#e5b73b] !px-1 !py-0.5 text-center`}
              />
            );
          }}
        />
        <fieldset className="mt-3.5 flex flex-col gap-1.5">
          <legend className="mb-1 text-[14px] leading-relaxed">
            <span className="font-semibold">6.</span> Co znamená číslo v řádku {zakazkaVyznamu.nazev} a sloupci {v.dp.vyznam.sloupec}? (5 b)
          </legend>
          {v.dp.vyznam.moznosti.map((m, i) => (
            <label key={m.text} className="flex cursor-pointer items-start gap-2 text-[14px] leading-relaxed text-[#c5d6cf]">
              <input type="radio" name="zaverecne-vyznam" disabled={zamceno} checked={o.vyznam === i} onChange={() => zmen({ vyznam: i })} className="mt-1 accent-[#6fe3c2]" />
              {m.text}
            </label>
          ))}
        </fieldset>
        <label className="mt-3.5 flex flex-col gap-1.5 text-[14px] leading-relaxed">
          <span>
            <span className="font-semibold">7.</span> Stroj dostane hodinu navíc ({v.dp.kapacita + 1} h). O kolik tisíc Kč vzroste nejlepší
            přínos? (10 b)
          </span>
          <input value={o.kapacita} disabled={zamceno} onChange={(e) => zmen({ kapacita: e.target.value })} inputMode="numeric" className={`${poleTrida} w-[100px]`} />
        </label>
      </Karta>

      <Karta nadpis={`Část 3: Porovnání algoritmů (${BODY.porovnani} b, asi 12 min)`}>
        <p className="mb-2.5 text-[13px] text-[#a6bdb4]">
          Odpověz číslem, třeba 4096. Mocninu smíš zapsat i jako 2^12. Faktoriál a jiné výpočty dopočítej, kalkulačku použít smíš. Slovní odpověď se
          nepočítá.
        </p>
        <div className="flex flex-col gap-3">
          {v.porovnani.map((q, i) => (
            <label key={i} className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
              <span>
                <span className="font-semibold">{8 + i}.</span> {q.text}
              </span>
              <input
                value={o.porovnani[i]}
                disabled={zamceno}
                onChange={(e) => zmen({ porovnani: o.porovnani.map((x, j) => (j === i ? e.target.value : x)) })}
                inputMode="numeric"
                className={`${poleTrida} w-[180px]`}
              />
            </label>
          ))}
        </div>
      </Karta>

      <Karta nadpis={`Část 4: Zdůvodnění (${BODY.zduvodneni} b, asi 13 min)`}>
        <p className="mb-2.5 text-[13px] text-[#a6bdb4]">Hodnotí vyučující. Stačí dvě tři věty, nejvýš {MAX_ODPOVEDI} znaků.</p>
        <div className="flex flex-col gap-3.5">
          {v.zduvodneni.map((q, i) => (
            <label key={i} className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
              <span>
                <span className="font-semibold">{13 + i}.</span> {q} ({RUBRIKA[i].stupne[RUBRIKA[i].stupne.length - 1]} b)
              </span>
              <textarea
                value={o.texty[i]}
                disabled={zamceno}
                maxLength={MAX_ODPOVEDI}
                onChange={(e) => zmen({ texty: o.texty.map((x, j) => (j === i ? e.target.value : x)) })}
                rows={3}
                className="w-full rounded-lg border border-[#6f8a80] bg-[#080d0b] p-2.5 text-[14px] leading-relaxed text-[#e8f3ef]"
              />
              <span className="self-end text-[12px] tabular-nums text-[#a6bdb4]">
                {o.texty[i].length} / {MAX_ODPOVEDI}
              </span>
            </label>
          ))}
        </div>
      </Karta>

      {!zamceno ? (
        <div className="flex flex-col gap-2.5">
          {potvrdit && nevyplneno > 0 && (
            <Hlaska druh="tip">
              Nevyplněných odpovědí: {nevyplneno}. Opravdu odevzdat? Po odevzdání se odpovědi zamknou.
            </Hlaska>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (nevyplneno > 0 && !potvrdit) {
                  nastavPotvrdit(true);
                  return;
                }
                nastavPraci({ ...prace, odevzdano: true, datum: dnes() });
              }}
              className={hlavni}
            >
              {potvrdit && nevyplneno > 0 ? "Přesto odevzdat" : "Odevzdat"}
            </button>
            {zpet && (
              <button type="button" onClick={zpet} className={tlacitko}>
                Zpět
              </button>
            )}
          </div>
        </div>
      ) : (
        <Odevzdano prace={prace} v={v} cvicne={cvicne} odemknout={() => nastavPraci({ ...prace, odevzdano: false })} smazat={() => nastavPraci(null)} />
      )}
    </div>
  );
}

function Odevzdano({
  prace,
  v,
  cvicne,
  odemknout,
  smazat,
}: {
  prace: PraceZaka;
  v: Varianta;
  cvicne: boolean;
  odemknout: () => void;
  smazat: () => void;
}) {
  const od: Odevzdani = { verze: VERZE_GENERATORU, zadani: prace.zadani, jmeno: prace.jmeno, datum: prace.datum, odpovedi: prace.odpovedi };
  const zprava = zpravaProUcitele(v, od);
  const [zkopirovano, nastavZkopirovano] = useState<boolean | null>(null);
  const pole = useRef<HTMLTextAreaElement>(null);
  const body = spoctiBody(v, prace.odpovedi);

  if (cvicne) {
    return (
      <div className="flex flex-col gap-3">
        <Hlaska druh="ok">
          Cvičné ověření: {body.automaticky} z {BODY.strategie + BODY.dp + BODY.porovnani} bodů za části 1–3 (strategie {body.strategie}, tabulka{" "}
          {body.dp}, porovnání {body.porovnani}). Zdůvodnění by hodnotil vyučující.
        </Hlaska>
        <Karta nadpis="Správné odpovědi">
          <ul className="flex flex-col gap-1 text-[14px] leading-relaxed text-[#c5d6cf]">
            {v.situace.map((s, i) => (
              <li key={i}>
                {i + 1}. {spravneStrategie(s).map((x) => STRATEGIE[x]).join(" nebo ")} {body.detail.situace[i] ? "✓" : "✗"}
              </li>
            ))}
            <li>5. Buňky: {v.dp.bunky.map((b, i) => `${b.zakazka.nazev} ${b.sloupec} h = ${b.hodnota}${body.detail.bunky[i] ? " ✓" : " ✗"}`).join(", ")}</li>
            <li>
              6. {v.dp.vyznam.moznosti.find((m) => m.spravne)?.text} {body.detail.vyznam ? "✓" : "✗"}
            </li>
            <li>
              7. O {v.dp.kapacitaNavic.rozdil} tis. Kč {body.detail.kapacita ? "✓" : "✗"}
            </li>
            {v.porovnani.map((q, i) => (
              <li key={i}>
                {8 + i}. {cz(q.spravne)} {body.detail.porovnani[i] ? "✓" : "✗"}
              </li>
            ))}
          </ul>
        </Karta>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={odemknout} className={tlacitko}>
            Upravit odpovědi
          </button>
          <button type="button" onClick={smazat} className={tlacitko}>
            Zkusit znovu s jiným jménem
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Hlaska druh="ok">Odevzdáno. Zkopíruj celou zprávu a pošli ji vyučujícímu, třeba v Teams. Kód na konci zprávy nesmaž, podle něj se boduje.</Hlaska>
      <textarea ref={pole} readOnly value={zprava} rows={12} aria-label="Zpráva pro vyučujícího" className={`${poleTrida} w-full font-mono !text-[12px]`} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            kopiruj(zprava).then((ok) => {
              nastavZkopirovano(ok);
              if (!ok) pole.current?.select();
            })
          }
          className={hlavni}
        >
          {zkopirovano ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
          {zkopirovano ? "Zkopírováno" : "Zkopírovat zprávu"}
        </button>
        <button type="button" onClick={odemknout} className={tlacitko}>
          Upravit odpovědi
        </button>
        {zkopirovano === false && <span className="text-[13px] text-[#ff9d8a]">Kopírování se nepovedlo. Zpráva je označená, zkopíruj ji Ctrl+C.</span>}
      </div>
      <p className="text-[13px] text-[#a6bdb4]">Když odpovědi upravíš, pošli novou zprávu. Vyučující vezme tu poslední.</p>
    </div>
  );
}

/* ───────────── Vyučující ───────────── */

type Rubrika = (number | null)[];
const klicZaka = (o: Odevzdani) => `${o.zadani}|${normalizujJmeno(o.jmeno)}`;

function Ucitel({ zpet }: { zpet: () => void }) {
  const [zadani, nastavZadaniStav] = useState<{ id: string; heslo: string } | null>(null);
  const [hesla, nastavHesla] = useState<string[]>(() => cti<string[]>(KLIC_HESEL, []).filter((h) => typeof h === "string"));
  const [heslo, nastavHeslo] = useState("");
  const [hlaskaHesla, nastavHlaskuHesla] = useState("");
  const [zkopirovano, nastavZkopirovano] = useState<string | null>(null);
  const [vlozeno, nastavVlozeno] = useState("");
  const [kody, nastavKody] = useState<string[]>(() => cti<string[]>(KLIC_ODEVZDANYCH, []).filter((k) => typeof k === "string"));
  const [hodnoceni, nastavHodnoceni] = useState<Record<string, Rubrika>>(() => cti(KLIC_HODNOCENI, {}));
  const [hlaska, nastavHlasku] = useState("");
  const [otevreny, nastavOtevreny] = useState<string | null>(null);

  useEffect(() => {
    ulozDoProhlizece(KLIC_ODEVZDANYCH, JSON.stringify(kody));
  }, [kody]);
  useEffect(() => {
    ulozDoProhlizece(KLIC_HODNOCENI, JSON.stringify(hodnoceni));
  }, [hodnoceni]);
  useEffect(() => {
    ulozDoProhlizece(KLIC_HESEL, JSON.stringify(hesla));
  }, [hesla]);

  const pridejHeslo = (h: string) => {
    if (!hesla.some((x) => normalizujHeslo(x) === normalizujHeslo(h))) nastavHesla([...hesla, h]);
  };
  const nastavZadani = (z: { id: string; heslo: string }) => {
    nastavZadaniStav(z);
    pridejHeslo(z.heslo);
  };

  /** Zadání, ke kterým tu je heslo. Bez hesla se odpovědi nevyhodnotí, jinak by si je žák zobrazil. */
  const znama = useMemo(() => new Set(hesla.map(zadaniZHesla)), [hesla]);

  /** Od každého žáka v zadání jen poslední odevzdání (později vložené vyhrává). */
  const { prace, cekajici } = useMemo(() => {
    const podleZaka = new Map<string, Odevzdani>();
    for (const k of kody) {
      const o = dekodujOdevzdani(k);
      if (o) podleZaka.set(klicZaka(o), o);
    }
    const cekajici = new Map<string, number>();
    const prace = Array.from(podleZaka.values())
      .filter((o) => {
        if (znama.has(o.zadani)) return true;
        if (o.zadani !== CVICNE_ZADANI) cekajici.set(o.zadani, (cekajici.get(o.zadani) ?? 0) + 1);
        return false;
      })
      .map((o) => {
        const v = vytvorVariantu(o.jmeno, o.zadani, o.verze);
        return { o, v, body: spoctiBody(v, o.odpovedi) };
      })
      .sort((a, b) => a.o.zadani.localeCompare(b.o.zadani) || a.o.jmeno.localeCompare(b.o.jmeno, "cs"));
    return { prace, cekajici: Array.from(cekajici.entries()).sort((a, b) => a[0].localeCompare(b[0])) };
  }, [kody, znama]);

  const odemkni = () => {
    const id = zadaniZHesla(heslo);
    if (normalizujHeslo(heslo).length !== 12 || !cekajici.some(([z]) => z === id)) {
      nastavHlaskuHesla("Tohle heslo nepatří k žádnému načtenému zadání. Zkontroluj ho, má 12 znaků.");
      return;
    }
    pridejHeslo(heslo.trim().toUpperCase());
    nastavHeslo("");
    nastavHlaskuHesla(`Zadání ${id} odemčeno.`);
  };

  const odkaz = zadani ? `${window.location.origin}/algolab?zaverecne=${zadani.id}` : "";
  const textProTridu = zadani
    ? `Závěrečné ověření ALGOLAB (45 minut). Otevři odkaz, napiš celé jméno a na konci mi sem pošli celou zprávu, kterou ti stránka připraví:\n${odkaz}`
    : "";

  const vyhodnot = () => {
    const nalezene = najdiOdevzdani(vlozeno);
    if (!nalezene.length) {
      nastavHlasku("Ve vloženém textu není žádný platný kód ALGZ1-. Vlož celé zprávy od žáků. Useknutý nebo upravený kód se nenačte.");
      return;
    }
    const nove = (vlozeno.match(/ALGZ1-[A-Za-z0-9_-]+/g) ?? []).filter((k) => dekodujOdevzdani(k));
    nastavKody([...kody.filter((k) => !nove.includes(k)), ...nove]);
    nastavVlozeno("");
    // Useknutý kód nesmí zapadnout: žák by v přehledu chyběl a nikdo by nevěděl proč.
    const vadne = nenactenaOdevzdani(vlozeno);
    const cich = vadne.filter((j) => j).join(", ");
    nastavHlasku(
      `Načteno odevzdání: ${nalezene.length}.` +
        (vadne.length ? ` Nenačtené kódy (useknuté nebo upravené): ${vadne.length}${cich ? `, ve zprávě od: ${cich}` : ""}. Ať pošlou celou zprávu znovu.` : ""),
    );
  };

  const rubrika = (klic: string): Rubrika => hodnoceni[klic] ?? [null, null, null];
  const nastavBod = (klic: string, i: number, hodnota: number | null) =>
    nastavHodnoceni({ ...hodnoceni, [klic]: rubrika(klic).map((x, j) => (j === i ? hodnota : x)) });
  const rucne = (klic: string) => {
    const r = rubrika(klic);
    return r.every((x) => x !== null) ? r.reduce<number>((s, x) => s + (x ?? 0), 0) : null;
  };

  const exportuj = () => {
    const hlavicka = ["Jméno", "Zadání", "Datum", "Strategie (20)", "Tabulka (30)", "Porovnání (25)", ...RUBRIKA.map((r) => `${r.nazev} (${r.stupne[r.stupne.length - 1]})`), "Celkem (100)"];
    const radky = prace.map(({ o, body }) => {
      const k = klicZaka(o);
      const r = rubrika(k);
      const ruc = rucne(k);
      return [o.jmeno, o.zadani, o.datum, body.strategie, body.dp, body.porovnani, ...r.map((x) => (x === null ? "" : x)), ruc === null ? "" : body.automaticky + ruc];
    });
    const obsah = [hlavicka, ...radky].map((r) => r.map((b) => `"${bezVzorce(String(b)).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    stahni("algolab-zaverecne-overeni.csv", new TextEncoder().encode("﻿" + obsah), "text/csv");
  };

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold">Závěrečné ověření: pro vyučující</h2>
        <button type="button" onClick={zpet} className={tlacitko}>
          Zpět
        </button>
      </div>
      <Hlaska>
        Odpovědi se vyhodnotí jen s heslem zadání, takže žák si tu správné odpovědi nezobrazí. Kód je podepsaný, upravený se nenačte.
        Totožnost žáka bez serveru ověřit nejde a kdo umí číst kód stránky, ochranu obejde. Hodí se na běžné školní hodnocení, ne na
        zabezpečenou zkoušku. Varianta vzniká ze jména, proto ať ho žák napíše celé. Hranice známek určuješ ty.
      </Hlaska>

      <Karta nadpis="1. Odkaz pro třídu">
        {!zadani ? (
          <button type="button" onClick={() => nastavZadani(noveZadani())} className={hlavni}>
            Vytvořit nové zadání
          </button>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="text-[14px] text-[#c5d6cf]">
              Zadání <b className="font-mono">{zadani.id}</b>. Pro další třídu můžeš použít stejné, nebo vytvořit nové.
            </p>
            <p className="rounded-md border border-[#e3c26f]/40 bg-[#e3c26f]/10 px-3 py-2 text-[14px] leading-relaxed text-[#f3e3b5]">
              Heslo k vyhodnocení: <b className="select-all font-mono text-[#fff4d6]">{zadani.heslo}</b>. Žákům ho neukazuj. Tenhle prohlížeč si
              ho pamatuje, na jiném počítači ho zadáš u odevzdaných zpráv. Zapiš si ho.
            </p>
            <textarea readOnly value={textProTridu} rows={3} aria-label="Text pro třídu" className={`${poleTrida} w-full !text-[13px]`} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => kopiruj(textProTridu).then((ok) => nastavZkopirovano(ok ? "text" : "chyba"))}
                className={hlavni}
              >
                {zkopirovano === "text" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Zkopírovat text pro třídu
              </button>
              <button type="button" onClick={() => nastavZadani(noveZadani())} className={tlacitko}>
                Jiné zadání
              </button>
            </div>
            {zkopirovano === "chyba" && <p className="text-[13px] text-[#ff9d8a]">Kopírování se nepovedlo, označ text a zkopíruj ho Ctrl+C.</p>}
          </div>
        )}
      </Karta>

      <Karta nadpis="2. Odevzdané zprávy">
        <p className="mb-2 text-[14px] leading-relaxed text-[#c5d6cf]">
          Vlož zprávy od žáků, klidně celé vlákno z Teams naráz. Načtou se jen platné kódy ALGZ1-. Od každého žáka platí poslední vložené
          odevzdání.
        </p>
        <textarea
          value={vlozeno}
          onChange={(e) => {
            nastavVlozeno(e.target.value);
            nastavHlasku("");
          }}
          rows={5}
          aria-label="Vložené zprávy od žáků"
          className={`${poleTrida} w-full !text-[13px]`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={vyhodnot} disabled={!vlozeno.trim()} className={hlavni}>
            Načíst
          </button>
          {hlaska && (
            <span role="status" className="text-[13px] text-[#c5d6cf]">
              {hlaska}
            </span>
          )}
        </div>
        {cekajici.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 rounded-md border border-white/10 bg-[#0b1411] px-3 py-2.5">
            <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
              Čeká na heslo zadání:{" "}
              {cekajici.map(([z, n], i) => (
                <span key={z}>
                  {i > 0 && ", "}
                  <b className="font-mono">{z}</b> ({n})
                </span>
              ))}
              . Heslo jsi dostal(a) při vytvoření zadání.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={heslo}
                onChange={(e) => {
                  nastavHeslo(e.target.value);
                  nastavHlaskuHesla("");
                }}
                onKeyDown={(e) => e.key === "Enter" && heslo.trim() && odemkni()}
                placeholder="XXXX-XXXX-XXXX"
                aria-label="Heslo zadání"
                autoComplete="off"
                spellCheck={false}
                className={`${poleTrida} w-56 font-mono !text-[13px]`}
              />
              <button type="button" onClick={odemkni} disabled={!heslo.trim()} className={tlacitko}>
                Odemknout
              </button>
              {hlaskaHesla && (
                <span role="status" className="text-[13px] text-[#c5d6cf]">
                  {hlaskaHesla}
                </span>
              )}
            </div>
          </div>
        )}
      </Karta>

      {prace.length > 0 && (
        <Karta nadpis={`3. Hodnocení (${prace.length})`}>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-[13px] tabular-nums">
              <caption className="sr-only">Body žáků v závěrečném ověření</caption>
              <thead className="bg-[#101c18] text-left text-[12px] text-[#a6bdb4]">
                <tr>
                  <th scope="col" className="px-2.5 py-2 font-medium">Jméno</th>
                  <th scope="col" className="px-2.5 py-2 font-medium">Zadání</th>
                  <th scope="col" className="px-2.5 py-2 text-right font-medium">1 /20</th>
                  <th scope="col" className="px-2.5 py-2 text-right font-medium">2 /30</th>
                  <th scope="col" className="px-2.5 py-2 text-right font-medium">3 /25</th>
                  {RUBRIKA.map((r) => (
                    <th key={r.nazev} scope="col" className="px-2.5 py-2 font-medium">
                      {r.nazev}
                    </th>
                  ))}
                  <th scope="col" className="px-2.5 py-2 text-right font-medium">Celkem</th>
                </tr>
              </thead>
              <tbody>
                {prace.map(({ o, v, body }) => {
                  const k = klicZaka(o);
                  const r = rubrika(k);
                  const ruc = rucne(k);
                  const otevreno = otevreny === k;
                  return (
                    <RadekZaka
                      key={k}
                      o={o}
                      v={v}
                      body={body}
                      rubrika={r}
                      celkem={ruc === null ? null : body.automaticky + ruc}
                      otevreno={otevreno}
                      prepni={() => nastavOtevreny(otevreno ? null : k)}
                      nastavBod={(i, h) => nastavBod(k, i, h)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={exportuj} className={hlavni}>
              <Download className="h-4 w-4" /> Stáhnout CSV pro Excel
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Smazat všechna načtená odevzdání i ruční body v tomhle prohlížeči?")) {
                  nastavKody([]);
                  nastavHodnoceni({});
                }
              }}
              className={tlacitko}
            >
              <Trash2 className="h-4 w-4" /> Smazat seznam
            </button>
          </div>
        </Karta>
      )}
    </div>
  );
}

function RadekZaka({
  o,
  v,
  body,
  rubrika,
  celkem,
  otevreno,
  prepni,
  nastavBod,
}: {
  o: Odevzdani;
  v: Varianta;
  body: ReturnType<typeof spoctiBody>;
  rubrika: Rubrika;
  celkem: number | null;
  otevreno: boolean;
  prepni: () => void;
  nastavBod: (i: number, h: number | null) => void;
}) {
  const ano = (b: boolean) => (b ? <span className="text-[#6fe3c2]">✓</span> : <span className="text-[#ff9d8a]">✗</span>);
  return (
    <>
      <tr className="border-t border-white/[.07]">
        <td className="px-2.5 py-1.5">
          <button type="button" onClick={prepni} aria-expanded={otevreno} className="flex items-center gap-1 text-left hover:text-[#6fe3c2]">
            {otevreno ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {o.jmeno}
          </button>
        </td>
        <td className="px-2.5 py-1.5 font-mono">{o.zadani}</td>
        <td className="px-2.5 py-1.5 text-right">{body.strategie}</td>
        <td className="px-2.5 py-1.5 text-right">{body.dp}</td>
        <td className="px-2.5 py-1.5 text-right">{body.porovnani}</td>
        {RUBRIKA.map((r, i) => (
          <td key={r.nazev} className="px-2.5 py-1.5">
            <select
              value={rubrika[i] ?? ""}
              onChange={(e) => nastavBod(i, e.target.value === "" ? null : Number(e.target.value))}
              aria-label={`${r.nazev}, ${o.jmeno}`}
              className={`${poleTrida} !px-1.5 !py-0.5 !text-[13px]`}
            >
              <option value="">–</option>
              {r.stupne.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </td>
        ))}
        <td className="px-2.5 py-1.5 text-right font-semibold">{celkem === null ? <span className="font-normal text-[#a6bdb4]">doplň</span> : celkem}</td>
      </tr>
      {otevreno && (
        <tr className="bg-[#0b1411]">
          <td colSpan={9} className="px-3.5 py-3">
            <div className="grid gap-3 text-[13px] leading-relaxed text-[#c5d6cf] lg:grid-cols-2">
              <div className="flex flex-col gap-1">
                <b className="text-[#e8f3ef]">Části 1–3</b>
                {v.situace.map((s, i) => (
                  <span key={i}>
                    {i + 1}. {o.odpovedi.situace[i] >= 0 ? STRATEGIE[o.odpovedi.situace[i]] : "–"} {ano(body.detail.situace[i])}{" "}
                    {!body.detail.situace[i] && <span className="text-[#a6bdb4]">(správně {spravneStrategie(s).map((x) => STRATEGIE[x]).join(" nebo ")})</span>}
                  </span>
                ))}
                <span>
                  5. buňky{" "}
                  {o.odpovedi.bunky
                    .map((b, i) => `${v.dp.bunky[i].zakazka.nazev} ${v.dp.bunky[i].sloupec} h = ${b || "–"} ${body.detail.bunky[i] ? "✓" : `✗ (správně ${v.dp.bunky[i].hodnota})`}`)
                    .join(", ")}
                </span>
                <span>
                  6. význam {ano(body.detail.vyznam)} · 7. hodina navíc {o.odpovedi.kapacita || "–"} {ano(body.detail.kapacita)}
                  {!body.detail.kapacita && <span className="text-[#a6bdb4]"> (správně {v.dp.kapacitaNavic.rozdil})</span>}
                </span>
                {v.porovnani.map((q, i) => (
                  <span key={i}>
                    {8 + i}. {o.odpovedi.porovnani[i] || "–"} {ano(body.detail.porovnani[i])}
                    {!body.detail.porovnani[i] && <span className="text-[#a6bdb4]"> (správně {cz(q.spravne)})</span>}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <b className="text-[#e8f3ef]">Část 4: zdůvodnění</b>
                {v.zduvodneni.map((q, i) => (
                  <div key={i}>
                    <div className="text-[#a6bdb4]">
                      {13 + i}. {q}
                    </div>
                    <div className="whitespace-pre-wrap text-[#e8f3ef]">{o.odpovedi.texty[i].trim() || "bez odpovědi"}</div>
                  </div>
                ))}
                <div className="text-[#a6bdb4]">
                  Odevzdáno {o.datum}. Rubrika: výběr algoritmu 0/5/10, souvislost postupu a výsledku 0/5/10, podmínka nebo omezení 0/2/5.
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
