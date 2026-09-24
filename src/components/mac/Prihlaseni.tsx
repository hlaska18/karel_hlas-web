"use client";

/**
 * Přihlašovací obrazovka macOS.
 *
 * Kódy jsou TYTÉŽ jako u Windows (`win/pristup.ts`) a je to schválně: kód
 * patří třídě, ne operačnímu systému. Učitel napíše na tabuli jeden a platí
 * pro obě prostředí; kdo se přihlásil do Windows, projde i sem.
 *
 * Stejně jako tam platí, že je to ORGANIZAČNÍ ZÁVORA, ne zámek – porovnává se
 * v prohlížeči a kdo se podívá do zdroje, najde ho. Obrazovka to říká nahlas.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { datumSlovy, hodiny } from "@/lib/win/format";
import { kodSedi } from "@/lib/win/pristup";
import { VYCHOZI_NASTAVENI, vychoziStavMac, zapomenMac } from "@/lib/mac/stav";
import { useMac } from "./system";

type Faze = "zamek" | "kod" | "vitejte";

export function PrihlaseniMac({ onHotovo }: { onHotovo: () => void }) {
  const { poslat } = useMac();
  const [faze, nastavFazi] = useState<Faze>("zamek");
  const [kod, nastavKod] = useState("");
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
    const dal = () => nastavFazi("kod");
    window.addEventListener("keydown", dal);
    window.addEventListener("mousedown", dal);
    return () => {
      window.removeEventListener("keydown", dal);
      window.removeEventListener("mousedown", dal);
    };
  }, [faze]);

  // Informace se při přechodu ze zámku k poli na kód zavřou – na nízké
  // obrazovce by jinak zakryly odkaz Začít načisto.
  useEffect(() => nastavInfo(false), [faze]);

  useEffect(() => {
    if (faze === "kod") window.setTimeout(() => pole.current?.focus(), 60);
    if (faze === "vitejte") {
      const id = window.setTimeout(() => onHotovo(), 1200);
      return () => window.clearTimeout(id);
    }
  }, [faze, onHotovo]);

  const odesli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodSedi(kod, "macos")) {
      nastavHlasku("Tenhle kód nesedí. Zeptej se vyučujícího.");
      nastavChybu(true);
      window.setTimeout(() => nastavChybu(false), 700);
      return;
    }
    nastavHlasku("");
    nastavFazi("vitejte");
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

        {faze === "kod" && (
          <form
            onSubmit={odesli}
            className={`mt-14 flex w-[360px] max-w-[92vw] flex-col items-center ${
              chyba ? "animate-[zatreseni_0.45s]" : ""
            }`}
          >
            <AvatarZak />
            <h1 className="mt-3 text-[20px] font-medium drop-shadow">Žák</h1>

            <div // Zaostřené pole se jen prosvětlí, jako na zamykací obrazovce Macu.
              className="mac-sklo-zaloha mt-5 flex w-[260px] items-center gap-2 rounded-full border border-white/40 bg-black/30 pl-4 pr-1 backdrop-blur transition-colors focus-within:border-white/75 focus-within:bg-black/40"
            >
              <input
                ref={pole}
                value={kod}
                onChange={(e) => nastavKod(e.target.value)}
                placeholder="Kód od vyučujícího"
                aria-label="Kód od vyučujícího"
                autoComplete="off"
                spellCheck={false}
                maxLength={32}
                className="h-9 min-w-0 flex-1 bg-transparent text-[14px] uppercase tracking-widest text-white outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-white/50"
              />
              <button
                type="submit"
                disabled={!kod.trim()}
                aria-label="Odemknout"
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
                className="mt-4 text-[12px] text-white/45 underline decoration-dotted underline-offset-2 transition hover:text-white/80"
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
            <AvatarZak />
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
                {/* Jen „školní": veřejný kód MACOS pro cizí učitele do Windows
                    neplatí, takže „jeden platí do obou" by pro ně nebyla pravda. */}
                Školní kód platí i do virtuálních Windows. Drží pohromadě třídu,
                nechrání žádné údaje – žádné se tu neukládají. Co tu uděláš,
                zůstává v tomhle prohlížeči.{" "}
                <strong className="font-semibold text-white/90">
                  Na jiném počítači ani po vyčištění prohlížeče to nenajdeš.
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
 * Avatar s iniciálou. Obecná ikona postavičky z knihovny působila jako
 * webový formulář; Mac ukazuje u účtu bez fotky iniciálu na barevném kruhu.
 */
function AvatarZak() {
  return (
    <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-gradient-to-br from-[#8ab4ff] via-[#7867e6] to-[#44309a] text-[40px] font-medium text-white shadow-lg">
      Ž
    </div>
  );
}
