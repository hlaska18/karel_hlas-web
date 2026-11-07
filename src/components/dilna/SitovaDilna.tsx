"use client";

/**
 * Síťová dílna: samostatné prostředí v tématu Digitální gramotnost.
 *
 * Karel 3. 11. 2026 vyndal síťové úlohy ze simulátoru Windows. Tady nejde o to
 * ovládat Windows, ale o síť: žák si nejdřív tipne, kde je chyba, doloží to
 * příkazy, opraví to a opravu ověří. Vzhled je z návrhu, který Karel schválil.
 *
 * Záložky zůstávají připojené i schované, aby se neztratil výpis Terminálu ani
 * přihlášení do routeru. Schéma je vidět u Terminálu a Nastavení, u routeru
 * a prohlížeče by jen bralo místo.
 */

import { useCallback, useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { ZnakDilna } from "@/components/ZnakDilna";
import { MojeVysledkySimulatoru, PrehledTridySimulatoru, type Vzhled } from "@/components/postup/VysledkySimulatoru";
import { VYCHOZI_JMENO, jmenoPlatne, stejneJmeno } from "@/lib/postupSimulatoru";
import { jePrihlasen, zapamatujPrihlaseni } from "@/lib/win/pristup";
import { CHYBY_SITE, sitFunguje, type Kabely, type Porucha, type Router, type SitStav } from "@/lib/win/sit";
import { SITUACE, SKUPINY_SIT, UKOLY_SIT, type Zakazka, type Zalozka } from "@/lib/dilna/ukoly";
import { nactiDilnu, reducerDilny, ulozDilnu, vychoziDilna, type StavDilny } from "@/lib/dilna/stav";
import { VYSVETLENI, vyhodnotTip, type CastSite } from "@/lib/dilna/tipy";
import type { CestaObalky } from "@/lib/dilna/obalka";
import { NastaveniPocitace } from "./NastaveniPocitace";
import { Prohlizec } from "./Prohlizec";
import { RouterZezadu, type Hlaska } from "./RouterZezadu";
import { Schema, type Obalka } from "./Schema";
import { Terminal } from "./Terminal";

const VZHLED: Vzhled = {
  okno: "rounded-[14px] border border-white/[.14] bg-[#0d1714] shadow-2xl",
  text: "text-[#e8f3ef]",
  slaby: "text-[#a6bdb4]",
  linka: "border-white/[.12]",
  najeti: "hover:bg-[#18332b]",
  akcent: "bg-[#6fe3c2]",
  akcentText: "text-[#06201a]",
  akcentPismo: "text-[#6fe3c2]",
  pole: "border border-white/[.18] bg-[#0d1714] text-[#e8f3ef]",
};

const ZALOZKY: { id: Zalozka; nazev: string }[] = [
  { id: "terminal", nazev: "Terminál" },
  { id: "nastaveni", nazev: "Nastavení počítače" },
  { id: "router", nazev: "Router zezadu" },
  { id: "prohlizec", nazev: "Prohlížeč" },
];

/** Které chyby patří k poruše: jejich radu žák uvidí u zakázky. */
const CHYBY_PORUCHY: Partial<Record<Porucha, string[]>> = { brana: ["db", "rr"], dns: ["id", "rr"] };

const tlacitko = "rounded-lg border border-white/[.14] bg-[#18332b] px-3 py-[7px] text-[13px] text-[#e8f3ef] hover:bg-[#1f4136] disabled:cursor-default disabled:text-[#a6bdb4] disabled:hover:bg-[#18332b]";
const hlavni = "rounded-lg bg-[#6fe3c2] px-4 py-2 text-[14px] font-semibold text-[#06201a] hover:bg-[#8aeccf]";
const POZADI_HLASKY: Record<Hlaska["druh"], string> = {
  ok: "bg-[#123c30] text-[#c8f5e6]",
  tip: "bg-[#3a211c] text-[#ffd9d0]",
  info: "bg-[#122019] text-[#c5d6cf]",
};

function Logo() {
  return <ZnakDilna className="h-6 w-6 text-[#6fe3c2]" />;
}

function OdkazZpet({ className }: { className: string }) {
  const [domu, nastavDomu] = useState("/");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("z") === "en") nastavDomu("/en");
  }, []);
  return (
    <Link href={domu} className={className}>
      <ArrowLeft className="h-3.5 w-3.5" /> Zpět na web
    </Link>
  );
}

export function SitovaDilna() {
  const [stav, poslat] = useReducer(reducerDilny, undefined, () => vychoziDilna());
  const [faze, nastavFazi] = useState<"nacitam" | "prihlaseni" | "bezi">("nacitam");

  /* Z úložiště až po připojení, jinak by se server a prohlížeč neshodly. */
  useEffect(() => {
    const nacteny = nactiDilnu();
    poslat({ typ: "nacti", stav: nacteny });
    nastavFazi(jePrihlasen("dilna") && jmenoPlatne(nacteny.jmeno) ? "bezi" : "prihlaseni");
  }, []);

  useEffect(() => {
    if (faze === "bezi") ulozDilnu(stav);
  }, [stav, faze]);

  return (
    <div className="relative flex h-full w-full flex-col bg-[#080d0b] text-[#e8f3ef] [&_:focus-visible]:outline [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-[#6fe3c2]">
      {faze === "prihlaseni" && (
        <Prihlaseni
          stav={stav}
          onHotovo={(jmeno, nacisto) => {
            poslat(nacisto ? { typ: "nacti", stav: vychoziDilna(jmeno) } : { typ: "jmeno", jmeno });
            zapamatujPrihlaseni(true, "dilna");
            nastavFazi("bezi");
          }}
        />
      )}
      {faze === "bezi" && <Dilna stav={stav} poslat={poslat} />}
    </div>
  );
}

function Prihlaseni({ stav, onHotovo }: { stav: StavDilny; onHotovo: (jmeno: string, nacisto: boolean) => void }) {
  // Pole je vždycky prázdné: předvyplněné jméno předchozího žáka by nový jen odklepl.
  const [jmeno, nastavJmeno] = useState("");
  const [hlaska, nastavHlasku] = useState("");
  const [ptaSe, nastavPtaSe] = useState(false);
  const hotovo = UKOLY_SIT.filter((u) => stav.splneno.includes(u.id)).length;

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6">
      <div className="mb-5 flex items-center gap-3">
        <Logo />
        <h1 className="text-[24px] font-semibold">NETLAB</h1>
      </div>
      <p className="mb-5 max-w-md text-center text-[14px] leading-normal text-[#c5d6cf]">
        Cvičná domácí síť, nic se nestane. Oprav porouchaný internet, zapoj nový router a vyžeň cizí zařízení z Wi-Fi.
      </p>
      <form
        className="flex w-full max-w-sm flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!jmenoPlatne(jmeno)) {
            nastavHlasku("Napiš své jméno a příjmení.");
            return;
          }
          nastavHlasku("");
          if (stav.jmeno && stav.jmeno !== VYCHOZI_JMENO && !stejneJmeno(stav.jmeno, jmeno) && hotovo > 0) nastavPtaSe(true);
          else onHotovo(jmeno.trim(), false);
        }}
      >
        <label className="block">
          <span className="mb-1 block text-[13px] text-[#a6bdb4]">Jméno a příjmení</span>
          <input
            autoFocus
            value={jmeno}
            onChange={(e) => {
              nastavJmeno(e.target.value);
              nastavPtaSe(false);
            }}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-white/[.18] bg-[#0d1714] px-3 py-2 text-[15px] text-[#e8f3ef]"
          />
        </label>
        {hlaska && <p role="alert" className="text-[13px] text-[#ffd9d0]">{hlaska}</p>}
        <button type="submit" disabled={ptaSe} className={`${hlavni} disabled:opacity-40`}>
          Vstoupit do dílny
        </button>
      </form>
      {ptaSe && (
        <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-2 rounded-xl bg-[#122019] p-4 text-center">
          <p className="text-[13px] leading-relaxed text-[#c5d6cf]">
            Na tomhle počítači je rozdělaná práce pod jménem <b>{stav.jmeno}</b>: hotovo {hotovo} z {UKOLY_SIT.length} zakázek. Je tvoje?
          </p>
          {/* Žádné tlačítko není výchozí: Enter nesmí převzít cizí práci. */}
          <div className="flex gap-2">
            <button type="button" onClick={() => onHotovo(jmeno.trim(), true)} className={tlacitko}>
              Ne, začít načisto
            </button>
            <button type="button" onClick={() => onHotovo(jmeno.trim(), false)} className={tlacitko}>
              Ano, pokračovat
            </button>
          </div>
        </div>
      )}
      <p className="mt-6 max-w-md text-center text-[12px] leading-relaxed text-[#a6bdb4]">
        Jméno ani práce se nikam neodesílají, zůstávají v tomhle prohlížeči. Učiteli je pošleš sám kódem postupu.
      </p>
      <OdkazZpet className="mt-4 flex items-center gap-1.5 text-[13px] text-[#6fe3c2] hover:underline" />
    </div>
  );
}

function Dilna({ stav, poslat }: { stav: StavDilny; poslat: React.Dispatch<Parameters<typeof reducerDilny>[1]> }) {
  const [vybranaId, nastavVybranou] = useState(() => (UKOLY_SIT.find((u) => !stav.splneno.includes(u.id)) ?? UKOLY_SIT[0]).id);
  const zakazka = UKOLY_SIT.find((u) => u.id === vybranaId) ?? UKOLY_SIT[0];
  const [zalozka, nastavZalozku] = useState<Zalozka>(zakazka.zalozka ?? "terminal");
  const [skupina, nastavSkupinu] = useState<string | null>(zakazka.skupina);
  const [okno, nastavOkno] = useState<null | "vysledky" | "prehled">(null);
  const [hlaska, nastavHlasku] = useState<Hlaska | null>(null);
  const [obalka, nastavObalku] = useState<Obalka | null>(null);
  const [tip, nastavTip] = useState<{ cast: CastSite; spravne: boolean } | null>(null);
  const [tipu, nastavTipu] = useState(0);
  /** Po novém začátku se Terminál a prohlížeč připojí znovu, s čistým výpisem. */
  const [zacatek, nastavZacatek] = useState(0);

  const porucha = zakazka.porucha;
  const situace = zakazka.situace;
  const poruchaBezi = Boolean(porucha && stav.sit.porucha === porucha);
  const poruchaHotova = Boolean(porucha && stav.stopy.includes(`porucha:${porucha}:overena`) && !stav.sit.porucha && sitFunguje(stav.sit));
  const situaceBezi = Boolean(situace && stav.stopy.includes(`situace:${situace}:spustena`));
  const ceka = (porucha && !poruchaBezi && !poruchaHotova && stav.overuje !== porucha) || (situace && !situaceBezi);
  const pokazenaJinde = !porucha && !situace && (Boolean(stav.sit.porucha) || !sitFunguje(stav.sit));
  const splneno = stav.splneno.includes(zakazka.id);
  const hotovo = UKOLY_SIT.filter((u) => stav.splneno.includes(u.id)).length;
  const otevreno = Math.min(stav.napovedy[zakazka.id] ?? 0, zakazka.kroky.length);
  const rady = (porucha ? CHYBY_PORUCHY[porucha] ?? [] : []).filter((id) => stav.chyby[id]);
  const k = stav.sit.kabely;
  const zapojeno = k.napajeni && k.wan && k.lan !== null;
  const ukazPojem = zapojeno && (situaceBezi || stav.stopy.includes("situace:router:spustena") || stav.splneno.includes("sit-router-zapoj"));
  const schema = zalozka === "terminal" || zalozka === "nastaveni";

  const vyber = (z: Zakazka) => {
    nastavVybranou(z.id);
    nastavSkupinu(z.skupina);
    nastavZalozku(z.zalozka ?? "terminal");
    nastavHlasku(null);
    nastavTip(null);
    nastavTipu(0);
  };

  const zacni = () => {
    if (porucha) poslat({ typ: "sit/porucha", porucha });
    else if (situace) poslat({ typ: "sit/situace", situace });
    nastavZacatek((n) => n + 1);
    nastavObalku(null);
    nastavTip(null);
    nastavTipu(0);
    nastavZalozku(zakazka.zalozka ?? "terminal");
    nastavHlasku(
      porucha
        ? { text: "Začni tím, co už víš ze zakázky. Příkazy piš do Terminálu.", druh: "info" }
        : situace === "router"
          ? { text: "Vyber kabel a pak klikni na port, kam podle tebe patří.", druh: "info" }
          : null,
    );
  };

  const dalsi = UKOLY_SIT[(UKOLY_SIT.indexOf(zakazka) + 1) % UKOLY_SIT.length];

  const stopa = useCallback((co: string) => poslat({ typ: "stopa", stopa: co }), [poslat]);

  const zmenSit = (sit: SitStav, zprava?: Hlaska) => {
    poslat({ typ: "sit/nastav", sit });
    if (zprava) nastavHlasku(zprava);
  };

  /** U poruchy se oprava musí ověřit. Co přesně pomohlo, tu ještě neprozrazujeme. */
  const zPoruchy = (zprava: string) => (poruchaBezi || stav.overuje === porucha ? `${zprava} Oprava se počítá, až když ji ověříš.` : zprava);

  const poPrikazu = (stopy: string[], dukazy: string[], cesta: CestaObalky | null, prikaz: string) => {
    poslat({ typ: "prikaz", stopy, dukazy });
    if (cesta) nastavHlasku({ text: cesta.zprava, druh: cesta.selhala ? "tip" : "ok" });
    else if (prikaz === "ipconfig") nastavHlasku(poruchaBezi ? { text: "Máš údaje, se kterými počítač pracuje. Všechno sedí?", druh: "info" } : null);
  };

  const poTipu = (cast: CastSite) => {
    if (!porucha || !poruchaBezi) return;
    const vysledek = vyhodnotTip(porucha, cast, stav.dukazy);
    nastavTip({ cast, spravne: vysledek.spravne });
    nastavTipu((n) => n + 1);
    nastavHlasku({ text: vysledek.text, druh: vysledek.spravne ? "ok" : "tip" });
  };

  const zobrazena: Hlaska | null = porucha && poruchaHotova ? { text: VYSVETLENI[porucha], druh: "ok" } : hlaska;

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <Logo />
          <strong className="text-[17px]">NETLAB</strong>
          <span className="text-[13px] text-[#a6bdb4]">síťová dílna, cvičná domácí síť, nic se nestane</span>
        </div>
        <div className="flex items-center gap-3.5 text-[13px] text-[#a6bdb4]">
          <span>
            Hotovo {hotovo} z {UKOLY_SIT.length}
          </span>
          <button type="button" onClick={() => nastavOkno("vysledky")} className={tlacitko}>
            Kód postupu
          </button>
          <OdkazZpet className="flex items-center gap-1.5 hover:text-[#e8f3ef]" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Zakázky" className="flex w-[280px] shrink-0 flex-col border-r border-white/10 px-3.5 py-4">
          <div className="px-2 pb-1.5 text-[12px] font-semibold tracking-[.06em] text-[#a6bdb4]">ZAKÁZKY</div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {SKUPINY_SIT.map((nazev) => {
              const zakazky = UKOLY_SIT.filter((u) => u.skupina === nazev);
              const hotovych = zakazky.filter((u) => stav.splneno.includes(u.id)).length;
              const otevrena = skupina === nazev;
              return (
                <section key={nazev}>
                  <button
                    type="button"
                    aria-expanded={otevrena}
                    onClick={() => nastavSkupinu(otevrena ? null : nazev)}
                    className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-[9px] text-left text-[14px] hover:bg-[#101c18] ${otevrena ? "font-semibold" : ""}`}
                  >
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#a6bdb4] ${otevrena ? "" : "-rotate-90"}`} />
                    <span className="min-w-0 flex-1">{nazev}</span>
                    <span className={`font-normal ${hotovych === zakazky.length ? "text-[#6fe3c2]" : "text-[#a6bdb4]"}`}>
                      {hotovych}/{zakazky.length}
                    </span>
                  </button>
                  {otevrena && (
                    <div className="flex flex-col gap-0.5 pb-1 pl-1.5 text-[13px]">
                      {zakazky.map((u) => {
                        const aktivni = u.id === zakazka.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            aria-current={aktivni ? "true" : undefined}
                            onClick={() => vyber(u)}
                            className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-[7px] text-left ${
                              aktivni ? "bg-[#18332b] text-[#e8f3ef]" : "text-[#a6bdb4] hover:bg-[#101c18] hover:text-[#e8f3ef]"
                            }`}
                          >
                            <span>{u.nazev}</span>
                            {stav.splneno.includes(u.id) && <Check className="h-4 w-4 shrink-0 text-[#6fe3c2]" strokeWidth={2.6} aria-label="hotovo" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          <div className="mt-3 shrink-0 px-2 text-[12px] leading-normal text-[#a6bdb4]">
            <p>Učiteli odevzdáš kód postupu jako v simulátorech.</p>
            <button type="button" onClick={() => nastavOkno("prehled")} className="mt-1.5 text-[#6fe3c2] hover:underline">
              Pro učitele: Přehled třídy
            </button>
          </div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 pb-4 pt-3.5">
          <section className="flex shrink-0 items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-[#6fe3c2]">Zakázka · {zakazka.skupina}</div>
              <h1 className="mb-1 mt-[3px] text-[22px] font-[650]">{zakazka.nazev}</h1>
              <p className="text-[14px] text-[#c5d6cf]">{zakazka.popis}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={otevreno >= zakazka.kroky.length}
                onClick={() => poslat({ typ: "napoveda", id: zakazka.id })}
                className={tlacitko}
              >
                Nápověda ({otevreno} z {zakazka.kroky.length})
              </button>
              {(porucha || situace) && !ceka && (
                <button type="button" onClick={zacni} className={tlacitko}>
                  Začít znovu
                </button>
              )}
              {splneno && (
                <button type="button" onClick={() => vyber(dalsi)} className={tlacitko}>
                  Další zakázka
                </button>
              )}
            </div>
          </section>

          {(otevreno > 0 || rady.length > 0) && (
            <div className="flex shrink-0 flex-col gap-1 rounded-lg bg-[#101c18] px-3 py-2 text-[13px] leading-snug text-[#c5d6cf]">
              {zakazka.kroky.slice(0, otevreno).map((text) => (
                <p key={text}>{text}</p>
              ))}
              {rady.map((id) => (
                <p key={id} className="text-[#a6bdb4]">
                  {CHYBY_SITE[id].rada}
                </p>
              ))}
              {otevreno > 0 && <p className="text-[12px] text-[#a6bdb4]">Nápovědy vidíš jen ty, do kódu postupu nejdou.</p>}
            </div>
          )}

          {ceka && (
            <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-[#6fe3c2]/40 bg-[#123c30] px-4 py-3 text-[14px]">
              <p>{situace ? SITUACE[situace].popis : "Síť je zatím v pořádku. Zakázka ji pokazí."}</p>
              <button type="button" onClick={zacni} className={`${hlavni} shrink-0`}>
                {situace ? SITUACE[situace].tlacitko : "Začít zakázku"}
              </button>
            </div>
          )}

          {pokazenaJinde && (
            <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl bg-[#3a211c] px-4 py-3 text-[14px] text-[#ffd9d0]">
              <p>Síť je pokažená nebo nezapojená z jiné zakázky. Tahle zakázka potřebuje fungující síť.</p>
              <button
                type="button"
                onClick={() => {
                  poslat({ typ: "sit/vychozi" });
                  nastavZacatek((n) => n + 1);
                  nastavHlasku(null);
                }}
                className={`${hlavni} shrink-0`}
              >
                Vrátit síť do pořádku
              </button>
            </div>
          )}

          {schema && (
            <Schema
              sit={stav.sit}
              naVybaleni={situace === "router" && situaceBezi}
              tip={tip}
              obalka={obalka}
              tipy={poruchaBezi ? tipu : null}
              onTip={poTipu}
            />
          )}

          {zobrazena && (
            <div role="status" className={`shrink-0 rounded-[10px] px-3.5 py-2.5 text-[14px] leading-snug ${POZADI_HLASKY[zobrazena.druh]}`}>
              {zobrazena.text}
            </div>
          )}

          <section className="flex min-h-[380px] flex-1 flex-col rounded-[14px] border border-white/[.08] bg-[#0d1714]">
            <div role="tablist" aria-label="Nástroje" className="flex shrink-0 gap-1 border-b border-white/[.08] px-2.5">
              {ZALOZKY.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  role="tab"
                  aria-selected={zalozka === z.id}
                  onClick={() => nastavZalozku(z.id)}
                  className={`border-b-2 px-3.5 py-[11px] text-[14px] ${
                    zalozka === z.id ? "border-[#6fe3c2] text-[#e8f3ef]" : "border-transparent text-[#a6bdb4] hover:text-[#e8f3ef]"
                  }`}
                >
                  {z.nazev}
                </button>
              ))}
            </div>
            <div className={`min-h-0 flex-1 overflow-hidden ${zalozka === "terminal" ? "" : "hidden"}`}>
              <Terminal key={zacatek} sit={stav.sit} aktivni={zalozka === "terminal"} onObalka={nastavObalku} onHotovo={poPrikazu} />
            </div>
            <div className={`min-h-0 flex-1 overflow-hidden ${zalozka === "nastaveni" ? "" : "hidden"}`}>
              <NastaveniPocitace
                sit={stav.sit}
                onUlozit={(nova) => zmenSit(nova, { text: zPoruchy("Nastavení je uložené."), druh: "info" })}
              />
            </div>
            <div className={`min-h-0 flex-1 overflow-hidden ${zalozka === "router" ? "" : "hidden"}`}>
              <RouterZezadu
                sit={stav.sit}
                ukazPojem={ukazPojem}
                onZmena={(kabely: Kabely) => zmenSit({ ...stav.sit, kabely })}
                onHlaska={(h) => nastavHlasku(porucha && h.druh !== "tip" ? { text: zPoruchy("Zapojení je změněné."), druh: "info" } : h)}
              />
            </div>
            <div className={`min-h-0 flex-1 overflow-hidden ${zalozka === "prohlizec" ? "" : "hidden"}`}>
              <Prohlizec
                key={zacatek}
                sit={stav.sit}
                aktivni={zalozka === "prohlizec"}
                onStopa={stopa}
                onZmenaRouteru={(zmena: Partial<Router>) => zmenSit({ ...stav.sit, router: { ...stav.sit.router, ...zmena } })}
              />
            </div>
          </section>
        </main>
      </div>

      {okno === "vysledky" && (
        <MojeVysledkySimulatoru
          simulator="sit"
          chyby={stav.chyby}
          jmeno={stav.jmeno}
          nastavJmeno={(jmeno) => poslat({ typ: "jmeno", jmeno })}
          splneno={stav.splneno}
          obnov={(ids) => poslat({ typ: "obnov", ids })}
          otevriPrehled={() => nastavOkno("prehled")}
          zavri={() => nastavOkno(null)}
          vzhled={VZHLED}
        />
      )}
      {okno === "prehled" && <PrehledTridySimulatoru zavri={() => nastavOkno(null)} vzhled={VZHLED} />}
    </>
  );
}
