"use client";

/**
 * Schéma domácí sítě: počítač – router – internet, nad routerem Wi-Fi.
 *
 * Při poruše se dá klikat: žák si tipne, kde je chyba. Čáry jsou při poruše
 * schválně pořád plné, jinak by schéma prozradilo odpověď. Skutečný stav kabelů
 * ukazuje jen při vybalování routeru, kde je to vidět i doopravdy.
 *
 * Mřížka je souměrná, střed routeru je proto přesně v polovině šířky. Z toho se
 * počítá poloha obálky. Přechod `left` s „omezit pohyb“ není: obálka skáče.
 */

import type { ReactNode } from "react";
import { MAC_PC, ROUTER, ucinne, type SitStav } from "@/lib/win/sit";
import type { CastSite } from "@/lib/dilna/tipy";
import type { Zastavka } from "@/lib/dilna/obalka";

const POLOHA: Record<Zastavka, string> = {
  pc: "85px",
  pul: "calc(42.5px + 25%)",
  router: "50%",
  net: "calc(100% - 85px)",
};

export interface Obalka {
  kde: Zastavka;
  cervena: boolean;
}

export function Schema({
  sit,
  naVybaleni,
  tip,
  obalka,
  tipy,
  onTip,
}: {
  sit: SitStav;
  /** Běží vybalování routeru: čáry ukazují, co je opravdu zapojené. */
  naVybaleni: boolean;
  /** Na které části je žákův poslední tip. */
  tip: { cast: CastSite; spravne: boolean } | null;
  obalka: Obalka | null;
  /** Počet tipů, `null` = teď se netipuje (není porucha). */
  tipy: number | null;
  onTip: (cast: CastSite) => void;
}) {
  const u = ucinne(sit);
  const klikaci = tipy !== null;
  const wifi = sit.router.zarizeni.filter((z) => z.mac !== MAC_PC && !sit.router.blokovane.includes(z.mac));
  const kabelPlny = !naVybaleni || sit.kabely.lan !== null || Boolean(sit.kabely.pocitacVeWan);
  const vedeniPlne = !naVybaleni || sit.kabely.wan;
  const ramecek = (cast: CastSite) =>
    tip?.cast === cast
      ? tip.spravne
        ? "border-2 border-[#6fe3c2]"
        : "border-2 border-[#ff9d8a]"
      : "border border-white/[.12]";

  return (
    <section aria-label="Schéma domácí sítě" className="shrink-0 rounded-[14px] border border-white/[.08] bg-[#0d1714] px-4 py-3">
      <div className="mb-2 flex min-h-[20px] items-baseline justify-between gap-4 text-[13px]">
        {klikaci ? (
          <p>
            <strong className="font-semibold text-[#e8f3ef]">Kde je podle tebe chyba?</strong>{" "}
            <span className="text-[#a6bdb4]">Klikni na místo ve schématu. Tipů: {tipy}</span>
          </p>
        ) : (
          <span />
        )}
        {wifi.length > 0 && (
          <span className="hidden text-[12px] text-[#a6bdb4] xl:inline">Čárkovaně Wi-Fi</span>
        )}
      </div>

      <div className="relative">
        <div className="mb-1.5 flex min-h-[34px] flex-wrap justify-center gap-2">
          {wifi.map((z) => (
            <span key={z.mac} className="flex h-[34px] items-center rounded-[9px] border border-dashed border-[#7fa297] px-3 text-[12px] text-[#c5d6cf]">
              {z.nazev}
            </span>
          ))}
        </div>

        <div className="relative grid grid-cols-[170px_1fr_200px_1fr_170px] items-center">
          <Cast klikaci={klikaci} popis="Tip: počítač" onClick={() => onTip("pc")} tridy={`h-[84px] ${ramecek("pc")}`}>
            <span className="block text-[14px] font-semibold text-[#e8f3ef]">DOMACI-PC</span>
            <span className="mt-0.5 block font-mono text-[13px] text-[#a6bdb4]">{u.adresa || "bez adresy"}</span>
            <span className="block text-[12px] text-[#a6bdb4]">počítač na stole</span>
          </Cast>

          <Vedeni klikaci={klikaci} plne={kabelPlny} popis="kabel" aria="Tip: kabel mezi počítačem a routerem" oznaceno={tip?.cast === "kabel"} spravne={tip?.spravne} onClick={() => onTip("kabel")} />

          <Cast klikaci={klikaci} popis="Tip: router" onClick={() => onTip("router")} tridy={`h-[84px] ${ramecek("router")}`}>
            <span className="block text-[14px] font-semibold text-[#e8f3ef]">Router DR-300</span>
            <span className="mt-0.5 block font-mono text-[13px] text-[#a6bdb4]">{ROUTER}</span>
            <span className="block text-[12px] text-[#a6bdb4]">třídírna doma</span>
          </Cast>

          <Vedeni klikaci={klikaci} plne={vedeniPlne} popis="přípojka k poskytovateli" aria="Tip: přípojka k poskytovateli" oznaceno={tip?.cast === "vedeni"} spravne={tip?.spravne} onClick={() => onTip("vedeni")} />

          <Cast klikaci={klikaci} popis="Tip: internet" onClick={() => onTip("internet")} tridy={`h-[84px] ${ramecek("internet")}`}>
            <span className="block text-[14px] font-semibold text-[#e8f3ef]">Internet</span>
            <span className="mt-0.5 block text-[13px] text-[#a6bdb4]">skola.example</span>
            <span className="block font-mono text-[12px] text-[#a6bdb4]">203.0.113.10</span>
          </Cast>

          {obalka && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 flex h-6 w-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] transition-[left] duration-700 ease-linear motion-reduce:transition-none"
              style={{ left: POLOHA[obalka.kde], background: obalka.cervena ? "#ff9d8a" : "#6fe3c2" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06201a" strokeWidth="2" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="12" rx="1.5" />
                <path d="M3 7l9 7 9-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-[12px] text-[#a6bdb4]">
        Zjednodušeno. Domácí router je ve skutečnosti router, přepínač a Wi-Fi v jedné krabici. Obálka = paket.
      </p>
    </section>
  );
}

function Cast({
  klikaci,
  popis,
  onClick,
  tridy,
  children,
}: {
  klikaci: boolean;
  popis: string;
  onClick: () => void;
  tridy: string;
  children: ReactNode;
}) {
  const zaklad = `block w-full rounded-xl bg-[#18332b] px-3.5 py-2.5 text-left ${tridy}`;
  if (!klikaci) return <div className={zaklad}>{children}</div>;
  return (
    <button type="button" aria-label={popis} onClick={onClick} className={`${zaklad} cursor-pointer hover:bg-[#1f4136]`}>
      {children}
    </button>
  );
}

function Vedeni({
  klikaci,
  plne,
  popis,
  aria,
  oznaceno,
  spravne,
  onClick,
}: {
  klikaci: boolean;
  plne: boolean;
  popis: string;
  aria: string;
  oznaceno: boolean;
  spravne?: boolean;
  onClick: () => void;
}) {
  const obsah = (
    <>
      <span className="block pb-1 text-center text-[12px] leading-tight text-[#a6bdb4]">{popis}</span>
      <span className={`block border-t-[2.5px] border-[#7fa297] ${plne ? "" : "border-dashed opacity-60"}`} />
    </>
  );
  const obrys = oznaceno ? (spravne ? "outline outline-2 outline-[#6fe3c2]" : "outline outline-2 outline-[#ff9d8a]") : "";
  if (!klikaci) return <div className="px-1">{obsah}</div>;
  return (
    <button type="button" aria-label={aria} onClick={onClick} className={`cursor-pointer rounded-lg px-1 py-3 hover:bg-[#6fe3c2]/[.08] ${obrys}`}>
      {obsah}
    </button>
  );
}
