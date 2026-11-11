"use client";

/**
 * Společná kostra hodin 1–3 a 5–7: ukládání přes obal ALGOLABu, navigace fází,
 * fokus na nadpis po přechodu a opakované stavební díly (tip, krokování,
 * kontrola odpovědí, reflexe).
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, ChevronsRight, RotateCcw, X } from "lucide-react";
import { klicHodiny, nactiLekci, type FazeLekce, type StavLekce } from "@/lib/algolab/lekce";
import { novySeed } from "@/lib/algolab/nahoda";
import { AlgoritmyHodiny, type Algoritmus } from "./JakFunguje";
import { Hlaska, Karta, hlavni, poleTrida, tlacitko } from "./spolecne";

/* ───────────── Ukládání ───────────── */

/**
 * Obal ALGOLABu drží poslední zápis každé hodiny i v paměti. Když úložiště
 * nefunguje nebo druhá karta zakázala ukládání, kód postupu se pořád skládá
 * z toho, co žák vidí.
 */
export const UkladaniAlgolabu = createContext<(klic: string, hodnota: string) => void>(() => {});

export interface Lekce<T> {
  stav: StavLekce<T>;
  data: T;
  zmen: (zmena: Partial<T>) => void;
  jdiNa: (faze: string, hotova?: string) => void;
}

export function useLekce<T extends object>(cislo: number, faze: FazeLekce[], vychozi: () => T): Lekce<T> {
  const uloz = useContext(UkladaniAlgolabu);
  const [stav, nastav] = useState<StavLekce<T>>(() => nactiLekci(cislo, faze, vychozi));
  const prvni = useRef(true);
  useEffect(() => {
    // Načtený stav se hned nezapisuje: jinak by pouhé otevření hodiny poslalo druhé kartě změnu.
    if (prvni.current) {
      prvni.current = false;
      return;
    }
    uloz(klicHodiny(cislo), JSON.stringify(stav));
  }, [stav, cislo, uloz]);

  const zmen = useCallback((zmena: Partial<T>) => nastav((s) => ({ ...s, data: { ...s.data, ...zmena } })), []);
  const jdiNa = useCallback((cil: string, hotova?: string) => {
    nastav((s) => ({ ...s, faze: cil, hotovo: hotova && !s.hotovo.includes(hotova) ? [...s.hotovo, hotova] : s.hotovo }));
  }, []);
  return { stav, data: stav.data, zmen, jdiNa };
}

/* ───────────── Kostra hodiny ───────────── */

export function KostraLekce({
  faze,
  aktualni,
  hotovo,
  jdiNa,
  children,
}: {
  faze: FazeLekce[];
  aktualni: string;
  hotovo: string[];
  jdiNa: (faze: string) => void;
  children: ReactNode;
}) {
  const obsah = useRef<HTMLDivElement>(null);
  const prvni = useRef(true);
  useEffect(() => {
    obsah.current?.scrollTo({ top: 0 });
    if (prvni.current) {
      prvni.current = false;
      return;
    }
    if (document.activeElement?.closest("[role=dialog]")) return;
    const nadpis = obsah.current?.querySelector("h2");
    if (nadpis) {
      nadpis.setAttribute("tabindex", "-1");
      nadpis.focus({ preventScroll: true });
    }
  }, [aktualni]);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <nav aria-label="Fáze lekce" className="flex shrink-0 flex-wrap gap-1 border-b border-white/10 px-5 py-2.5">
        {faze.map((f, i) => {
          const je = aktualni === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-current={je ? "step" : undefined}
              onClick={() => jdiNa(f.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] ${
                je ? "bg-[#18332b] font-semibold text-[#e8f3ef]" : "text-[#a6bdb4] hover:bg-[#101c18] hover:text-[#e8f3ef]"
              }`}
            >
              {hotovo.includes(f.id) ? (
                <Check className="h-3.5 w-3.5 text-[#6fe3c2]" strokeWidth={2.6} aria-label="hotovo" />
              ) : (
                <span className="tabular-nums">{i + 1}.</span>
              )}
              {f.nazev}
              <span className="font-normal opacity-70">{f.minut} min</span>
            </button>
          );
        })}
      </nav>
      <div ref={obsah} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {children}
      </div>
    </main>
  );
}

/** Nadpis fáze s krátkým úvodem. */
export function Nadpis({ children, uvod }: { children: ReactNode; uvod?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[22px] font-semibold">{children}</h2>
      {uvod && <p className="max-w-3xl text-[15px] leading-relaxed text-[#c5d6cf]">{uvod}</p>}
    </div>
  );
}

export function Dal({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <div>
      <button type="button" onClick={onClick} disabled={disabled} className={hlavni}>
        {children} <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Přepínač částí experimentu (A, B, C). */
export function Casti<K extends string>({ casti, aktualni, vyber }: { casti: { id: K; nazev: string }[]; aktualni: string; vyber: (k: K) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {casti.map((c, i) => (
        <button
          key={c.id}
          type="button"
          onClick={() => vyber(c.id)}
          aria-pressed={aktualni === c.id}
          className={`${tlacitko} ${aktualni === c.id ? "!border-[#6fe3c2]" : ""}`}
        >
          {String.fromCharCode(65 + i)}. {c.nazev}
        </button>
      ))}
    </div>
  );
}

/* ───────────── Tip ───────────── */

/**
 * „Tipni si nejdřív“: dokud žák netipne, akce pod tipem se nespustí. Tip se
 * pak už nemění, vyhodnotí ho až výsledek.
 */
export function TipniSi({
  otazka,
  moznosti,
  vybrano,
  vyber,
  spravne,
  vyhodnotit,
  vysvetleni,
}: {
  otazka: ReactNode;
  moznosti: string[];
  vybrano: number;
  vyber: (i: number) => void;
  spravne?: number;
  /** Ukázat vyhodnocení (po animaci nebo krokování). */
  vyhodnotit?: boolean;
  vysvetleni?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e5b73b]/40 bg-[#1d1a0f] p-3.5">
      <div className="text-[11px] font-semibold tracking-[.08em] text-[#e5b73b]">TIPNI SI NEJDŘÍV</div>
      <div className="mt-1 text-[14px] leading-relaxed">{otazka}</div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Tvůj tip">
        {moznosti.map((m, i) => (
          <button
            key={m}
            type="button"
            disabled={vybrano >= 0}
            aria-pressed={vybrano === i}
            onClick={() => vyber(i)}
            className={`${tlacitko} ${vybrano === i ? "!border-[#e5b73b] !text-[#e8f3ef] !opacity-100" : ""}`}
          >
            {m}
          </button>
        ))}
      </div>
      {vybrano >= 0 && !vyhodnotit && <p className="mt-2 text-[13px] text-[#c5d6cf]">Tip máš. Teď se podívej, jak to dopadne.</p>}
      {vybrano >= 0 && vyhodnotit && spravne !== undefined && (
        <div className="mt-2.5">
          <Hlaska druh={vybrano === spravne ? "ok" : "tip"}>
            {vybrano === spravne ? "Tipl(a) jsi správně. " : `Správně je „${moznosti[spravne]}“. `}
            {vysvetleni}
          </Hlaska>
        </div>
      )}
    </div>
  );
}

/* ───────────── Krokování ───────────── */

export function Krokovac({
  krok,
  pocet,
  nastav,
  popisek = "Krok",
  zamceno,
}: {
  krok: number;
  pocet: number;
  nastav: (k: number) => void;
  popisek?: string;
  /** Důvod, proč se zatím nedá pokračovat (třeba chybí tip). */
  zamceno?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => nastav(Math.max(0, krok - 1))} disabled={krok <= 0} className={tlacitko}>
        <ChevronLeft className="h-4 w-4" /> Zpět
      </button>
      <button type="button" onClick={() => nastav(Math.min(pocet, krok + 1))} disabled={krok >= pocet || !!zamceno} className={hlavni}>
        Další krok <ChevronRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => nastav(pocet)} disabled={krok >= pocet || !!zamceno} className={tlacitko}>
        <ChevronsRight className="h-4 w-4" /> Na konec
      </button>
      <button type="button" onClick={() => nastav(0)} disabled={krok <= 0} className={tlacitko}>
        <RotateCcw className="h-4 w-4" /> Od začátku
      </button>
      <span className="text-[13px] tabular-nums text-[#a6bdb4]" aria-live="polite">
        {popisek} {krok} z {pocet}
      </span>
      {zamceno && <span className="text-[13px] text-[#e5b73b]">{zamceno}</span>}
    </div>
  );
}

/* ───────────── Kontrola odpovědí ───────────── */

export function Znacka({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#6fe3c2]">
      <Check className="h-4 w-4" strokeWidth={2.6} /> správně
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#ff9d8a]">
      <X className="h-4 w-4" strokeWidth={2.6} /> ještě ne
    </span>
  );
}

/** Otázka výzvy s polem na odpověď a značkou po kontrole. */
export function Otazka({
  cislo,
  text,
  hodnota,
  zmen,
  ok,
  zkontrolovano,
  sirka = "w-[140px]",
  napoveda,
  spravne,
}: {
  cislo: number;
  text: ReactNode;
  hodnota: string;
  zmen: (t: string) => void;
  ok: boolean;
  zkontrolovano: boolean;
  sirka?: string;
  napoveda?: string;
  /** Správná odpověď ukázaná po kontrole, když je odpověď špatně. */
  spravne?: ReactNode;
}) {
  const id = `otazka-${cislo}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] leading-relaxed">
        <span className="font-semibold tabular-nums">{cislo}.</span> {text}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          value={hodnota}
          onChange={(e) => zmen(e.target.value)}
          placeholder={napoveda}
          autoComplete="off"
          spellCheck={false}
          className={`${poleTrida} ${sirka}`}
        />
        {zkontrolovano && <Znacka ok={ok} />}
        {zkontrolovano && !ok && spravne !== undefined && <span className="text-[13px] text-[#c5d6cf]">Správně: {spravne}</span>}
      </div>
    </div>
  );
}

export function Vyber({
  cislo,
  text,
  moznosti,
  vybrano,
  vyber,
  ok,
  zkontrolovano,
}: {
  cislo: number;
  text: ReactNode;
  moznosti: string[];
  vybrano: number;
  vyber: (i: number) => void;
  ok: boolean;
  zkontrolovano: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-[14px] leading-relaxed">
        <span className="font-semibold tabular-nums">{cislo}.</span> {text}
      </legend>
      {moznosti.map((m, i) => (
        <label key={m} className="flex cursor-pointer items-start gap-2 text-[14px] leading-relaxed text-[#c5d6cf]">
          <input type="radio" name={`vyber-${cislo}`} checked={vybrano === i} onChange={() => vyber(i)} className="mt-1 accent-[#6fe3c2]" />
          <span>
            <span className="font-semibold">{String.fromCharCode(97 + i)})</span> {m}
          </span>
        </label>
      ))}
      {zkontrolovano && (
        <div>
          <Znacka ok={ok} />
        </div>
      )}
    </fieldset>
  );
}

/** Spodek výzvy: kontrola, výsledek a nové zadání. */
export function KontrolaVyzvy({
  zkontrolovano,
  spravne,
  celkem,
  zkontroluj,
  noveZadani,
  dal,
}: {
  zkontrolovano: boolean;
  spravne: number;
  celkem: number;
  zkontroluj: () => void;
  noveZadani: () => void;
  dal: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {zkontrolovano && (
        <Hlaska druh={spravne === celkem ? "ok" : "tip"}>
          {spravne === celkem
            ? "Všechno správně. Zkus ještě jedno zadání, nebo pokračuj k reflexi."
            : `Správně ${spravne} z ${celkem}. Oprav, co nesedí, a zkontroluj znovu. U správných odpovědí je vysvětlení v lekci.`}
        </Hlaska>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={zkontroluj} className={hlavni}>
          Zkontrolovat
        </button>
        <button type="button" onClick={noveZadani} className={tlacitko}>
          <RotateCcw className="h-4 w-4" /> Nové zadání
        </button>
        <button type="button" onClick={dal} className={tlacitko}>
          Pokračovat k reflexi <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ───────────── Reflexe ───────────── */

export function ReflexeLekce({
  otazka,
  text,
  zmenText,
  vzor,
  odkryto,
  odkryj,
  skryj,
  pojmy,
  zaver,
  algoritmy,
}: {
  otazka: string;
  text: string;
  zmenText: (t: string) => void;
  vzor: ReactNode;
  odkryto: boolean;
  odkryj: () => void;
  skryj: () => void;
  pojmy: { pojem: string; text: ReactNode }[];
  /** Věta na konec, třeba co přijde v další hodině. */
  zaver?: ReactNode;
  /** Celé karty „Jak to funguje“ k dočtení, sbalené (i pro toho, kdo tipy přeskočil). */
  algoritmy?: Algoritmus[];
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h2 className="text-[22px] font-semibold">Co si z toho bereš?</h2>
      <Karta nadpis={otazka}>
        <textarea
          value={text}
          onChange={(e) => zmenText(e.target.value)}
          rows={5}
          aria-label="Tvoje odpověď"
          placeholder="Napiš to vlastními slovy, stačí dvě tři věty."
          className="w-full rounded-lg border border-[#6f8a80] bg-[#080d0b] p-2.5 text-[14px] leading-relaxed text-[#e8f3ef] placeholder:text-[#a6bdb4]"
        />
        <p className="mt-1 text-[12px] text-[#a6bdb4]">Odpověď se ukládá jen v tomhle prohlížeči, nikam se neposílá.</p>
        <div className="mt-2.5">
          {odkryto ? (
            <button type="button" onClick={skryj} className={tlacitko}>
              Skrýt vzorovou odpověď
            </button>
          ) : (
            <button type="button" disabled={text.trim().length < 10} onClick={odkryj} className={hlavni}>
              Porovnat se vzorovou odpovědí
            </button>
          )}
        </div>
      </Karta>
      {odkryto && <Hlaska druh="ok">{vzor}</Hlaska>}
      <div className="grid gap-2.5 md:grid-cols-2">
        {pojmy.map((p) => (
          <div key={p.pojem} className="rounded-xl border border-[#6fe3c2]/30 bg-[#0f231d] p-3.5">
            <div className="text-[11px] font-semibold tracking-[.08em] text-[#6fe3c2]">NOVÝ POJEM</div>
            <div className="mt-1 text-[15px] font-semibold">{p.pojem}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#c5d6cf]">{p.text}</p>
          </div>
        ))}
      </div>
      {algoritmy && algoritmy.length > 0 && <AlgoritmyHodiny algoritmy={algoritmy} />}
      {zaver && <p className="text-[14px] leading-relaxed text-[#c5d6cf]">{zaver}</p>}
    </div>
  );
}

/* ───────────── Drobnosti ───────────── */

/** Seed výzvy: uložený, nebo nový (a hned se uloží, aby se zadání po obnovení stránky nezměnilo). */
export function useSeed(seed: number, uloz: (s: number) => void): number {
  const [novy] = useState(() => (seed >= 0 ? seed : novySeed()));
  useEffect(() => {
    if (seed < 0) uloz(novy);
  }, [seed, novy, uloz]);
  return seed >= 0 ? seed : novy;
}

export const cz = (n: number, des = 0) => n.toLocaleString("cs-CZ", { minimumFractionDigits: des, maximumFractionDigits: des });

/** Číslo z odpovědi žáka (mezery, nezlomitelné mezery, desetinná čárka). */
export function cisloOdpovedi(t: string): number {
  const s = t.replace(/\s/g, "").replace(",", ".");
  return s === "" ? NaN : Number(s);
}

/** Tlačítka-štítky s čísly, třeba karty nebo krabice. */
export function Stitek({ children, stav = "zakladni" }: { children: ReactNode; stav?: "zakladni" | "aktivni" | "zdroj" | "hotovo" | "tlumene" }) {
  const trida = {
    zakladni: "border-white/[.14] bg-[#101c18] text-[#e8f3ef]",
    aktivni: "border-[#6fe3c2] bg-[#6fe3c2] text-[#06201a] font-semibold",
    zdroj: "border-[#6fe3c2] bg-[#1f4136] text-[#e8f3ef]",
    hotovo: "border-[#6fe3c2]/40 bg-[#123c30] text-[#c8f5e6]",
    tlumene: "border-white/[.06] bg-transparent text-[#a6bdb4]/60",
  }[stav];
  return <span className={`inline-flex min-w-[46px] items-center justify-center rounded-lg border px-2 py-1.5 text-[14px] tabular-nums ${trida}`}>{children}</span>;
}
