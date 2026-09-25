"use client";

/**
 * Přihlašovací obrazovka macOS.
 *
 * Od 25. 9. 2026 se žák přihlásí SVÝM JMÉNEM, ne kódem od učitele – kód nic
 * nechránil (Karlovo rozhodnutí, stejně jako ve Windows). Jméno nese kód
 * postupu, který žák na konci hodiny pošle učiteli.
 *
 * Když na počítači zůstala rozdělaná práce pod jiným jménem, obrazovka se
 * zeptá, čí je – bez výchozího tlačítka, Enter nesmí převzít cizí práci.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { datumSlovy, hodiny } from "@/lib/win/format";
import { VYCHOZI_NASTAVENI, vychoziStavMac, zapomenMac } from "@/lib/mac/stav";
import { postupMac } from "@/lib/mac/ukoly";
import { VYCHOZI_JMENO, jmenoPlatne, stejneJmeno } from "@/lib/postupSimulatoru";
import { useMac } from "./system";

type Faze = "zamek" | "jmeno" | "vitejte";

export function PrihlaseniMac({ onHotovo }: { onHotovo: () => void }) {
  const { stav, poslat } = useMac();
  const jmenoUctu = stav.nastaveni.jmenoUctu || VYCHOZI_JMENO;
  const rozdelano = postupMac(stav.splneno);
  const [faze, nastavFazi] = useState<Faze>("zamek");
  // Pole je vždycky prázdné, i když si počítač pamatuje minulé jméno:
  // předvyplněné jméno předchozího žáka by nový žák jen odklepl Enterem.
  const [jmeno, nastavJmeno] = useState("");
  /** Rozdělaná práce patří jinému jménu – ptáme se, čí je. */
  const [ptaSeCi, nastavPtaSeCi] = useState(false);
  const [hlaska, nastavHlasku] = useState("");
  /** Ptá se na potvrzení úklidu po předchozím žákovi? */
  const [ptaSeNaUklid, nastavPtaSeNaUklid] = useState(false);
  const [chyba, nastavChybu] = useState(false);
  /** Je otevřené vysvětlení simulace (odkaz Informace dole)? */
  const [info, nastavInfo] = useState(false);
  const [cas, nastavCas] = useState<Date | null>(null);
  const pole = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nastavCas(new Date());
    const id = window.setInterval(() => nastavCas(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Ze zámku se jde dál čímkoli – klik, mezerník, Enter. */
  useEffect(() => {
    if (faze !== "zamek") return;
    const dal = () => nastavFazi("jmeno");
    window.addEventListener("keydown", dal);
    window.addEventListener("mousedown", dal);
    return () => {
      window.removeEventListener("keydown", dal);
      window.removeEventListener("mousedown", dal);
    };
  }, [faze]);

  // Informace se při přechodu ze zámku k poli na jméno zavřou – na nízké
  // obrazovce by jinak zakryly odkaz Začít načisto.
  useEffect(() => nastavInfo(false), [faze]);

  useEffect(() => {
    if (faze === "jmeno") window.setTimeout(() => pole.current?.focus(), 60);
    if (faze === "vitejte") {
      const id = window.setTimeout(() => onHotovo(), 1200);
      return () => window.clearTimeout(id);
    }
  }, [faze, onHotovo]);

  /** Přihlásí jménem; `nacisto` = rozdělaná práce patřila někomu jinému. */
  const prihlas = (nacisto: boolean) => {
    const j = jmeno.trim();
    if (nacisto) {
      zapomenMac();
      // Čistý stav i do paměti – jinak by se hned uložil zpátky ten starý
      // (stejně jako u odkazu Začít načisto níž).
      poslat({ typ: "system/nacti", stav: vychoziStavMac() });
    }
    poslat({ typ: "nastaveni/zmen", zmena: { jmenoUctu: j } });
    nastavPtaSeCi(false);
    nastavFazi("vitejte");
  };

  const odesli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jmenoPlatne(jmeno)) {
      nastavHlasku("Napiš své jméno a příjmení.");
      nastavChybu(true);
      window.setTimeout(() => nastavChybu(false), 700);
      return;
    }
    nastavHlasku("");
    const cizi = jmenoUctu !== VYCHOZI_JMENO && !stejneJmeno(jmenoUctu, jmeno) && rozdelano.hotovo > 0;
    if (cizi) {
      nastavPtaSeCi(true);
      return;
    }
    prihlas(false);
  };

  // Zamykací obrazovka ukazuje výchozí tapetu, ne vlastní pozadí – na Macu
  // je to tatáž plocha, jen rozostřená.
  return (
    <div
      className="mac mac-tapeta absolute inset-0 overflow-hidden"
      data-motiv="tmavy"
      data-tapeta={VYCHOZI_NASTAVENI.tapeta}
    >
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundColor:
            faze === "zamek" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.45)",
          backdropFilter: faze === "zamek" ? "none" : "blur(30px)",
          WebkitBackdropFilter: faze === "zamek" ? "none" : "blur(30px)",
        }}
      />

      {/* Hodiny nahoře jsou na macOS zámku vždycky, i když se zadává heslo. */}
      <div
        className={`relative z-10 flex flex-col items-center text-white transition-all duration-500 ${
          faze === "zamek" ? "pt-[14vh]" : "pt-[7vh]"
        }`}
      >
        <div className="text-[18px] font-medium drop-shadow">
          {cas ? datumSlovy(cas) : ""}
        </div>
        <div
          className={`font-semibold leading-none tabular-nums drop-shadow-lg transition-all duration-500 ${
            faze === "zamek" ? "text-[112px]" : "text-[64px]"
          }`}
        >
          {cas ? hodiny(cas) : "--:--"}
        </div>

        {/* Zámek ukazuje jen to, co ukazuje zámek Macu: čas, datum a výzvu.
            Vysvětlení simulace je pod odkazem Informace dole (Karlovy
            návrhy 24. 9. 2026). */}
        {faze === "zamek" && (
          <div className="mt-16 flex flex-col items-center gap-3">
            <p className="animate-pulse text-[14px] text-white/85 drop-shadow">
              Klikni nebo stiskni libovolnou klávesu
            </p>
          </div>
        )}

        {faze === "jmeno" && (
          <form
            onSubmit={odesli}
            className={`mt-14 flex w-[360px] max-w-[92vw] flex-col items-center ${
              chyba ? "animate-[zatreseni_0.45s]" : ""
            }`}
          >
            <AvatarZak jmeno={jmeno} />
            <h1 className="mt-3 text-[20px] font-medium drop-shadow">{jmeno.trim() || "Přihlášení"}</h1>

            <div // Zaostřené pole se jen prosvětlí, jako na zamykací obrazovce Macu.
              className="mac-sklo-zaloha mt-5 flex w-[260px] items-center gap-2 rounded-full border border-white/40 bg-black/30 pl-4 pr-1 backdrop-blur transition-colors focus-within:border-white/75 focus-within:bg-black/40"
            >
              <input
                ref={pole}
                value={jmeno}
                onChange={(e) => {
                  nastavJmeno(e.target.value);
                  nastavPtaSeCi(false);
                }}
                placeholder="Jméno a příjmení"
                aria-label="Jméno a příjmení"
                autoComplete="off"
                spellCheck={false}
                maxLength={60}
                className="h-9 min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/50"
              />
              <button
                type="submit"
                disabled={!jmeno.trim() || ptaSeCi}
                aria-label="Přihlásit se"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/25 transition hover:bg-white/40 disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p
              className={`mt-3 h-5 text-[13px] transition-opacity ${
                hlaska ? "text-[#ff9a9a] opacity-100" : "opacity-0"
              }`}
            >
              {hlaska || " "}
            </p>

            {ptaSeCi && (
              <div className="mb-2 flex max-w-[340px] flex-col items-center gap-2 rounded-lg bg-black/40 px-4 py-3 text-center">
                <p className="text-[12px] leading-relaxed text-white/85">
                  Na tomhle počítači je rozdělaná práce pod jménem <b>{jmenoUctu}</b> – splněno {rozdelano.hotovo} z{" "}
                  {rozdelano.celkem} úloh. Je tvoje?
                </p>
                {/* Žádné tlačítko není výchozí: Enter nesmí převzít cizí práci. */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => prihlas(true)}
                    className="rounded-md bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-black transition hover:bg-white"
                  >
                    Ne, začít načisto
                  </button>
                  <button
                    type="button"
                    onClick={() => prihlas(false)}
                    className="rounded-md px-3 py-1.5 text-[12px] text-white/80 ring-1 ring-white/40 transition hover:text-white"
                  >
                    Ano, pokračovat
                  </button>
                </div>
              </div>
            )}

            {/*
              Začít načisto PATŘÍ SEM, ne jen do Nastavení.

              Na školním počítači sedí za den několik žáků a stav je uložený
              pod jedním klíčem v prohlížeči. Bez tohohle tlačítka sedne další
              do cizí plochy a cizích odškrtnutých úloh a ani nepozná, že to
              není jeho. V Nastavení to taky je, jenže tam se dostane až ten,
              kdo je uvnitř – a to je pozdě.
            */}
            {!ptaSeNaUklid ? (
              <button
                type="button"
                onClick={() => nastavPtaSeNaUklid(true)}
                // 60 % bílé: přes tapetu ho musí najít žák, který si přesedl
                // (rada 24. 9. 2026 – na 45 % byl skoro schovaný).
                className="mt-4 text-[12px] text-white/60 underline decoration-dotted underline-offset-2 transition hover:text-white/85"
              >
                Sedí tu po někom jiném? Začít načisto
              </button>
            ) : (
              <div className="mt-4 flex max-w-[340px] flex-col items-center gap-2 rounded-lg bg-black/40 px-4 py-3">
                <p className="text-center text-[12px] leading-relaxed text-white/80">
                  Smaže se plocha, soubory i odškrtnuté úlohy předchozího žáka.
                  Tebe se to nijak nedotkne – ty ještě nic nemáš.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => nastavPtaSeNaUklid(false)}
                    className="rounded-md px-3 py-1.5 text-[12px] text-white/70 transition hover:text-white"
                  >
                    Nechat být
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      zapomenMac();
                      // Nestačí smazat uložený stav: prostředí běží v paměti
                      // dál s plochou předchozího žáka a hned by ji zase
                      // uložilo zpátky. První verze dělala jen tohle a úklid
                      // tím ve skutečnosti neproběhl. Čistý stav se proto
                      // nahraje i do paměti.
                      poslat({ typ: "system/nacti", stav: vychoziStavMac() });
                      nastavPtaSeNaUklid(false);
                      nastavHlasku("Hotovo, prostředí je čisté.");
                    }}
                    className="rounded-md bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-black transition hover:bg-white"
                  >
                    Začít načisto
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {faze === "vitejte" && (
          <div className="mt-20 flex flex-col items-center gap-4">
            <AvatarZak jmeno={jmeno} />
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>

      {/*
        Vysvětlení simulace a toho, co se ukládá. Dřív stálo přímo na zámku
        a pod polem na kód a rušilo dojem systému; teď je pod odkazem dole.
        Odkaz na /soukromi je pořád hned za větou „nic se neukládá“.
        Kliknutí na odkaz nesmí zámek odemknout – proto `stopPropagation`.
      */}
      {faze !== "vitejte" && (
        <div
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {info && (
            <div className="mac-sklo-zaloha mb-3 w-[380px] max-w-[88vw] rounded-xl bg-black/45 px-4 py-3 text-[12px] leading-relaxed text-white/80 backdrop-blur-xl">
              <p>
                Výuková simulace macOS pro hodiny informatiky. Neběží tu skutečný
                systém a nic se neinstaluje. Všechno, co se tu stane, se děje jen
                v téhle záložce – tvého počítače se to nedotkne.
              </p>
              <p className="mt-2">
                Jméno ani práce se nikam neodesílají – zůstávají v tomhle
                prohlížeči. Učiteli je pošleš sám kódem postupu (panel Úkoly →
                Moje výsledky).{" "}
                <strong className="font-semibold text-white/90">
                  Na jiném počítači práci nenajdeš – pokračuješ tam z kódu postupu.
                </strong>{" "}
                <a
                  href="/soukromi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 transition hover:text-white"
                >
                  Co web ukládá
                </a>
              </p>
            </div>
          )}
          <button
            type="button"
            aria-expanded={info}
            onClick={() => nastavInfo((i) => !i)}
            onKeyDown={(e) => e.stopPropagation()}
            className="rounded-full px-3 py-1 text-[12px] text-white/60 drop-shadow transition hover:text-white/90"
          >
            Výuková simulace · Informace
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Avatar s iniciálami. Obecná ikona postavičky z knihovny působila jako
 * webový formulář; Mac ukazuje u účtu bez fotky iniciály na barevném kruhu.
 * Píšou se živě z pole se jménem.
 */
function AvatarZak({ jmeno }: { jmeno: string }) {
  const slova = jmeno.trim().split(/\s+/).filter(Boolean);
  const inicialy = slova.length ? (slova[0][0] + (slova.length > 1 ? slova[slova.length - 1][0] : "")).toUpperCase() : "Ž";
  return (
    <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-gradient-to-br from-[#8ab4ff] via-[#7867e6] to-[#44309a] text-[38px] font-medium text-white shadow-lg">
      {inicialy}
    </div>
  );
}
