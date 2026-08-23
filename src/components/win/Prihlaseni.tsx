"use client";

/**
 * Uzamykací a přihlašovací obrazovka.
 *
 * První, co žák uvidí. Kromě zadání kódu má ještě jednu úlohu: říct rovnou
 * a bez kliků navíc, co to je. Nikdo nemá strávit první minutu hodiny
 * hádáním, jestli se dívá na skutečné Windows, nebo na výukovou simulaci.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { Ikona } from "./Ikona";
import { TAPETY, vybranaTapeta } from "@/lib/win/obrazky";
import { datumSlovy, hodiny } from "@/lib/win/format";
import { PRISTUPOVY_KOD, jeVychoziKod, kodSedi } from "@/lib/win/pristup";

type Faze = "zamek" | "prihlaseni" | "vitejte";

export function Prihlaseni({
  jmenoUctu,
  tapetaId,
  onHotovo,
}: {
  jmenoUctu: string;
  tapetaId: string;
  onHotovo: () => void;
}) {
  const [faze, nastavFazi] = useState<Faze>("zamek");
  const [kod, nastavKod] = useState("");
  const [chyba, nastavChybu] = useState(false);
  const [cas, nastavCas] = useState<Date | null>(null);
  const pole = useRef<HTMLInputElement>(null);
  const tapeta = vybranaTapeta(tapetaId) ?? TAPETY[0];

  useEffect(() => {
    nastavCas(new Date());
    const id = window.setInterval(() => nastavCas(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Uzamykací obrazovku odemkne cokoli – klik, mezerník, Enter. */
  useEffect(() => {
    if (faze !== "zamek") return;
    const dal = () => nastavFazi("prihlaseni");
    window.addEventListener("keydown", dal);
    window.addEventListener("pointerdown", dal);
    return () => {
      window.removeEventListener("keydown", dal);
      window.removeEventListener("pointerdown", dal);
    };
  }, [faze]);

  useEffect(() => {
    if (faze === "prihlaseni") window.setTimeout(() => pole.current?.focus(), 60);
    if (faze === "vitejte") {
      // Krátká pauza jako při skutečném přihlašování – ne kvůli efektu,
      // ale aby bylo poznat, že se přechází do jiného prostředí.
      const id = window.setTimeout(onHotovo, 1400);
      return () => window.clearTimeout(id);
    }
  }, [faze, onHotovo]);

  const odesli = (e: React.FormEvent) => {
    e.preventDefault();
    if (kodSedi(kod)) {
      nastavFazi("vitejte");
      return;
    }
    nastavChybu(true);
    nastavKod("");
    window.setTimeout(() => nastavChybu(false), 700);
    pole.current?.focus();
  };

  return (
    <div
      className="win absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url("${tapeta.url}")` }}
      data-motiv="tmavy"
    >
      {/* Ztmavení a rozostření sílí, jak se postupuje k přihlášení. */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundColor: faze === "zamek" ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.55)",
          backdropFilter: faze === "zamek" ? "none" : "blur(28px)",
          WebkitBackdropFilter: faze === "zamek" ? "none" : "blur(28px)",
        }}
      />

      {faze === "zamek" && (
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 text-white">
          <div />
          <div className="text-center">
            <div className="text-[86px] font-light leading-none tabular-nums drop-shadow-lg sm:text-[110px]">
              {cas ? hodiny(cas) : "--:--"}
            </div>
            <div className="mt-2 text-[20px] font-light drop-shadow sm:text-[26px]">
              {cas ? datumSlovy(cas) : ""}
            </div>
          </div>
          <p className="animate-pulse text-center text-[14px] text-white/85 drop-shadow">
            Klikni nebo stiskni libovolnou klávesu
          </p>
        </div>
      )}

      {faze === "prihlaseni" && (
        <form
          onSubmit={odesli}
          className={`relative z-10 flex w-[min(92vw,420px)] flex-col items-center text-white ${
            chyba ? "animate-[zatreseni_0.45s]" : ""
          }`}
        >
          <Ikona klic="uzivatel" velikost={112} className="drop-shadow-lg" />
          <h1 className="mt-4 text-[26px] font-light">{jmenoUctu}</h1>
          <p className="mt-1 text-[13px] text-white/75">
            Zadej kód, který máš od vyučujícího
          </p>

          <div className="mt-5 flex w-full max-w-[300px] items-center gap-2 rounded-md border border-white/40 bg-black/35 px-3 backdrop-blur">
            <Lock className="h-4 w-4 shrink-0 text-white/60" />
            <input
              ref={pole}
              value={kod}
              onChange={(e) => nastavKod(e.target.value)}
              placeholder="Přístupový kód"
              aria-label="Přístupový kód"
              autoComplete="off"
              spellCheck={false}
              className="h-11 min-w-0 flex-1 bg-transparent text-center text-[15px] tracking-[0.2em] text-white outline-none placeholder:tracking-normal placeholder:text-white/50"
            />
            <button
              type="submit"
              aria-label="Přihlásit se"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 hover:bg-white/35"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p
            className={`mt-3 h-5 text-[13px] transition-opacity ${
              chyba ? "text-[#ff9a9a] opacity-100" : "opacity-0"
            }`}
          >
            Kód není správný. Zkus to znovu.
          </p>

          {/* Dokud je kód ten výchozí, nemá co tajit: stojí i ve zdrojáku
              stránky a je to závora, ne zámek. Lepší, když se návštěvník
              dostane dovnitř, než aby stál před polem a nevěděl. Jakmile si
              vyučující nastaví vlastní kód, nápověda zmizí sama. */}
          {jeVychoziKod() && (
            <p className="mt-1 text-[12px] text-white/60">
              Nemáš kód od vyučujícího? Zkus{" "}
              <button
                type="button"
                onClick={() => nastavKod(PRISTUPOVY_KOD)}
                className="font-semibold tracking-[0.12em] text-white/85 underline decoration-dotted underline-offset-2 hover:text-white"
              >
                {PRISTUPOVY_KOD}
              </button>
            </p>
          )}

          <p className="mt-8 max-w-[340px] text-center text-[12px] leading-relaxed text-white/65">
            Tohle je výuková simulace Windows 11 pro hodiny informatiky.
            Neběží tu skutečný systém, nic se neinstaluje a nic se neodesílá –
            všechno zůstává v tomhle prohlížeči.
          </p>
        </form>
      )}

      {faze === "vitejte" && (
        <div className="relative z-10 flex flex-col items-center text-white">
          <Ikona klic="uzivatel" velikost={112} className="drop-shadow-lg" />
          <h1 className="mt-4 text-[26px] font-light">{jmenoUctu}</h1>
          <div className="mt-6 flex items-center gap-3 text-[15px]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Vítejte
          </div>
        </div>
      )}
    </div>
  );
}
