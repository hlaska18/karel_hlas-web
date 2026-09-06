"use client";

/**
 * Uzamykací a přihlašovací obrazovka.
 *
 * První, co žák uvidí. Kromě zadání kódu má ještě jednu úlohu: říct rovnou
 * a bez kliků navíc, co to je. Nikdo nemá strávit první minutu hodiny
 * hádáním, jestli se dívá na skutečné Windows, nebo na výukovou simulaci.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { Ikona } from "./Ikona";
import { TAPETY, vybranaTapeta } from "@/lib/win/obrazky";
import { datumSlovy, hodiny } from "@/lib/win/format";
import { scenarPodleId, scenarZAdresy, VYCHOZI_SCENAR } from "@/lib/win/scenare";
import { kodSedi } from "@/lib/win/pristup";

/**
 * Kroky: zámek → kód → vítejte.
 *
 * Účty žáků na serveru byly zrušené (viz `pristup.ts`): postup zůstává
 * v prohlížeči a na server nejde nic. Zbyl vstupní kód od učitele, a ten
 * je ORGANIZAČNÍ ZÁVORA, ne zámek – drží pohromadě třídu a otevírá hodinu.
 * Obrazovka to říká nahlas, protože kód se porovnává v prohlížeči a kdo se
 * podívá do zdroje, najde ho.
 */
type Faze = "zamek" | "kod" | "vitejte";

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
  const scenar = scenarPodleId(scenarZAdresy());
  const [chyba, nastavChybu] = useState(false);
  const [kod, nastavKod] = useState("");
  const [hlaska, nastavHlasku] = useState("");
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
    const dal = () => nastavFazi("kod");
    window.addEventListener("keydown", dal);
    window.addEventListener("pointerdown", dal);
    return () => {
      window.removeEventListener("keydown", dal);
      window.removeEventListener("pointerdown", dal);
    };
  }, [faze]);

  useEffect(() => {
    if (faze === "kod") window.setTimeout(() => pole.current?.focus(), 60);

    if (faze === "vitejte") {
      // Krátká pauza jako při skutečném přihlašování – ne kvůli efektu,
      // ale aby bylo poznat, že se přechází do jiného prostředí.
      const id = window.setTimeout(() => onHotovo(), 1400);
      return () => window.clearTimeout(id);
    }
  }, [faze, onHotovo]);

  /** Ověření kódu. Běží celé v prohlížeči – nic se neodesílá. */
  const odesliKod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodSedi(kod)) {
      nastavHlasku("Tenhle kód nesedí. Zeptej se vyučujícího.");
      nastavChybu(true);
      window.setTimeout(() => nastavChybu(false), 700);
      return;
    }
    nastavHlasku("");
    nastavFazi("vitejte");
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
          <div className="flex flex-col items-center gap-3">
            {/* Co to je, se říká hned tady. Dřív to stálo až u pole na třídní
                kód, takže to člověk uviděl po kliknutí – a první minuta hodiny
                se strávila hádáním, jestli jsou to skutečné Windows. */}
            <p className="max-w-[340px] text-center text-[12px] leading-relaxed text-white/70 drop-shadow">
              Výuková simulace Windows 11 pro hodiny informatiky. Neběží tu
              skutečný systém a nic se neinstaluje.
            </p>
            {/* Který scénář se otevřel. Ukazuje se jen u jiného než výchozího:
                učitel i žák hned vidí, že odkaz vedl na konkrétní cvičení
                a že ten nepořádek na ploše tam patří. */}
            {scenar.id !== VYCHOZI_SCENAR && (
              <p className="rounded-full bg-white/15 px-3 py-1 text-center text-[12px] text-white/90 drop-shadow">
                Cvičení: {scenar.nazev}
              </p>
            )}
            <p className="animate-pulse text-center text-[14px] text-white/85 drop-shadow">
              Klikni nebo stiskni libovolnou klávesu
            </p>
          </div>
        </div>
      )}

      {faze === "kod" && (
        <form
          onSubmit={odesliKod}
          className={`relative z-10 flex w-[420px] max-w-[92vw] flex-col items-center text-white ${
            chyba ? "animate-[zatreseni_0.45s]" : ""
          }`}
        >
          <Ikona klic="uzivatel" velikost={112} className="drop-shadow-lg" />
          <h1 className="mt-4 text-[26px] font-light">{jmenoUctu}</h1>
          <p className="mt-1 max-w-[320px] text-center text-[13px] leading-relaxed text-white/75">
            Zadej kód, který máš od vyučujícího.
          </p>

          <div className="mt-5 flex w-full max-w-[300px] items-center gap-2 rounded-md border border-white/40 bg-black/35 px-3 backdrop-blur">
            <KeyRound className="h-4 w-4 shrink-0 text-white/60" />
            <input
              ref={pole}
              value={kod}
              onChange={(e) => nastavKod(e.target.value)}
              placeholder="Kód"
              aria-label="Kód od vyučujícího"
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] uppercase tracking-widest text-white outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-white/50"
            />
            <button
              type="submit"
              disabled={!kod.trim()}
              aria-label="Pokračovat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/35 disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p
            className={`mt-3 h-5 text-[13px] transition-opacity ${
              hlaska ? "text-[#ff9a9a] opacity-100" : "opacity-0"
            }`}
          >
            {hlaska || "\u00a0"}
          </p>

          {/* Řekne se to na rovinu. Kód se porovnává tady v prohlížeči, takže
              kdo se umí podívat do zdroje stránky, najde ho – vydávat ho za
              zabezpečení by byla lež. Drží třídu pohromadě, nic víc, a po
              zrušení účtů tu ani není co chránit. */}
          <p className="mt-8 max-w-[340px] text-center text-[12px] leading-relaxed text-white/65">
            Kód drží pohromadě třídu, nechrání žádné údaje – žádné se tu
            neukládají. Co v prostředí uděláš, zůstává v tomhle prohlížeči
            a na server se neodesílá nic.{" "}
            {/* Odkaz je tady schválně, ne až v patičce webu: tvrzení „nic se
                neukládá" má být doložitelné právě ve chvíli, kdy ho žák čte
                a rozhoduje se, jestli kód zadá. */}
            <a
              href="/soukromi"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2 transition hover:text-white"
            >
              Co web ukládá
            </a>
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
