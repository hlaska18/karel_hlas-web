"use client";

/**
 * Uzamykací a přihlašovací obrazovka.
 *
 * První, co žák uvidí. Kromě přihlášení jménem má ještě jednu úlohu: říct rovnou
 * a bez kliků navíc, co to je. Nikdo nemá strávit první minutu hodiny
 * hádáním, jestli se dívá na skutečné Windows, nebo na výukovou simulaci.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, UserRound } from "lucide-react";
import { Ikona } from "./Ikona";
import { TAPETY, vybranaTapeta } from "@/lib/win/obrazky";
import { datumSlovy, hodiny } from "@/lib/win/format";
import { scenarPodleId, scenarZAdresy, VYCHOZI_SCENAR } from "@/lib/win/scenare";
import { VYCHOZI_JMENO, jmenoPlatne, stejneJmeno } from "@/lib/postupSimulatoru";

/**
 * Kroky: zámek → jméno → vítejte.
 *
 * Účty žáků na serveru byly zrušené (viz `pristup.ts`): postup zůstává
 * v prohlížeči a na server nejde nic. Vstupní kód od učitele Karel
 * 25. 9. 2026 zrušil taky – nic nechránil. Žák se přihlásí SVÝM JMÉNEM:
 * to se objeví v kódu postupu, který na konci hodiny pošle učiteli.
 *
 * Když na počítači zůstala rozdělaná práce pod jiným jménem (jiný žák,
 * předchozí hodina), obrazovka se zeptá, jestli je jeho. Bez výchozího
 * tlačítka – Enter nesmí potichu převzít cizí práci.
 */
type Faze = "zamek" | "jmeno" | "vitejte";

export function Prihlaseni({
  jmenoUctu,
  tapetaId,
  rozdelano,
  onHotovo,
}: {
  jmenoUctu: string;
  tapetaId: string;
  /** Kolik úloh je na tomhle počítači splněných (rozdělaná práce). */
  rozdelano: { hotovo: number; celkem: number };
  /** Přihlášení jménem; `nacisto` = začít bez rozdělané práce předchozího. */
  onHotovo: (jmeno: string, nacisto: boolean) => void;
}) {
  const [faze, nastavFazi] = useState<Faze>("zamek");
  /**
   * Který scénář si žádá adresa. Čte se AŽ PO PŘIPOJENÍ, ne při renderu.
   *
   * `scenarZAdresy()` sahá na adresu okna, kterou server nezná – stránka je
   * předrenderovaná bez dotazu. Volání při renderu proto vracelo na serveru
   * výchozí scénář a v prohlížeči ten z adresy, React hlásil neshodu při
   * hydrataci a ZAHODIL celé serverem vykreslené HTML. Projevilo se to
   * pokaždé, když učitel rozeslal odkaz se scénářem (`?scenar=poviru`),
   * tedy přesně v té situaci, kvůli které scénáře existují.
   *
   * Stejný postup jako u hodin níž: první render je shodný se serverem
   * a upraví se až potom.
   */
  const [scenarId, nastavScenarId] = useState(VYCHOZI_SCENAR);
  useEffect(() => nastavScenarId(scenarZAdresy()), []);
  const scenar = scenarPodleId(scenarId);
  const [chyba, nastavChybu] = useState(false);
  // Pole je vždycky prázdné, i když si počítač pamatuje minulé jméno:
  // předvyplněné jméno předchozího žáka by nový žák jen odklepl Enterem.
  const [jmeno, nastavJmeno] = useState("");
  const [hlaska, nastavHlasku] = useState("");
  /** Rozdělaná práce patří jinému jménu – ptáme se, čí je. */
  const [ptaSe, nastavPtaSe] = useState(false);
  const volba = useRef<{ jmeno: string; nacisto: boolean }>({ jmeno: "", nacisto: false });
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
    const dal = () => nastavFazi("jmeno");
    window.addEventListener("keydown", dal);
    window.addEventListener("pointerdown", dal);
    return () => {
      window.removeEventListener("keydown", dal);
      window.removeEventListener("pointerdown", dal);
    };
  }, [faze]);

  useEffect(() => {
    if (faze === "jmeno") window.setTimeout(() => pole.current?.focus(), 60);

    if (faze === "vitejte") {
      // Krátká pauza jako při skutečném přihlašování – ne kvůli efektu,
      // ale aby bylo poznat, že se přechází do jiného prostředí.
      const id = window.setTimeout(() => onHotovo(volba.current.jmeno, volba.current.nacisto), 1400);
      return () => window.clearTimeout(id);
    }
  }, [faze, onHotovo]);

  const prihlas = (nacisto: boolean) => {
    volba.current = { jmeno: jmeno.trim(), nacisto };
    nastavPtaSe(false);
    nastavFazi("vitejte");
  };

  /** Přihlášení jménem. Běží celé v prohlížeči – nic se neodesílá. */
  const odesliJmeno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jmenoPlatne(jmeno)) {
      nastavHlasku("Napiš své jméno a příjmení.");
      nastavChybu(true);
      window.setTimeout(() => nastavChybu(false), 700);
      return;
    }
    nastavHlasku("");
    // Rozdělaná práce pod jiným jménem: zeptat se, čí je.
    const cizi = jmenoUctu !== VYCHOZI_JMENO && !stejneJmeno(jmenoUctu, jmeno) && rozdelano.hotovo > 0;
    if (cizi) {
      nastavPtaSe(true);
      return;
    }
    prihlas(false);
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
              skutečný systém a nic se neinstaluje. Všechno, co se tu stane,
              se děje jen v téhle záložce – tvého počítače se to nedotkne.
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

      {faze === "jmeno" && (
        <form
          onSubmit={odesliJmeno}
          className={`relative z-10 flex w-[420px] max-w-[92vw] flex-col items-center text-white ${
            chyba ? "animate-[zatreseni_0.45s]" : ""
          }`}
        >
          <Ikona klic="uzivatel" velikost={112} className="drop-shadow-lg" />
          <h1 className="mt-4 text-[26px] font-light">{jmeno.trim() || "Přihlášení"}</h1>
          <p className="mt-1 max-w-[320px] text-center text-[13px] leading-relaxed text-white/75">
            Napiš své jméno a příjmení. Objeví se v kódu postupu, který na konci hodiny pošleš učiteli.
          </p>

          <div className="mt-5 flex w-full max-w-[300px] items-center gap-2 rounded-md border border-white/40 bg-black/35 px-3 backdrop-blur">
            <UserRound className="h-4 w-4 shrink-0 text-white/60" />
            <input
              ref={pole}
              value={jmeno}
              onChange={(e) => {
                nastavJmeno(e.target.value);
                nastavPtaSe(false);
              }}
              placeholder="Jméno a příjmení"
              aria-label="Jméno a příjmení"
              autoComplete="off"
              spellCheck={false}
              maxLength={60}
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/50"
            />
            <button
              type="submit"
              disabled={!jmeno.trim() || ptaSe}
              aria-label="Přihlásit se"
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

          {ptaSe && (
            <div className="mt-2 flex w-full max-w-[340px] flex-col items-center gap-2 rounded-lg bg-black/45 px-4 py-3 text-center">
              <p className="text-[13px] leading-relaxed text-white/85">
                Na tomhle počítači je rozdělaná práce pod jménem <b>{jmenoUctu}</b> – splněno {rozdelano.hotovo} z{" "}
                {rozdelano.celkem} úloh. Je tvoje?
              </p>
              {/* Žádné tlačítko není výchozí: Enter nesmí převzít cizí práci. */}
              <div className="flex flex-wrap justify-center gap-2">
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
                  className="rounded-md border border-white/50 px-3 py-1.5 text-[12px] text-white transition hover:bg-white/15"
                >
                  Ano, pokračovat
                </button>
              </div>
            </div>
          )}

          {/* Řekne se to na rovinu: jméno zůstává v prohlížeči a pryč odejde
              jen v kódu postupu, který žák sám zkopíruje. */}
          <p className="mt-8 max-w-[340px] text-center text-[12px] leading-relaxed text-white/65">
            Jméno ani práce se nikam neodesílají – zůstávají v tomhle prohlížeči. Učiteli je pošleš sám kódem postupu
            (panel Úkoly → Moje výsledky).{" "}
            {/* Druhá půlka téhož faktu, a pro žáka ta praktičtější. */}
            <strong className="font-semibold text-white/80">
              Na jiném počítači práci nenajdeš – pokračuješ tam z kódu postupu.
            </strong>{" "}
            {/* Odkaz je tady schválně, ne až v patičce webu: tvrzení „nic se
                neodesílá" má být doložitelné právě ve chvíli, kdy ho žák čte. */}
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
          <h1 className="mt-4 text-[26px] font-light">{volba.current.jmeno || jmenoUctu}</h1>
          <div className="mt-6 flex items-center gap-3 text-[15px]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Vítejte
          </div>
        </div>
      )}
    </div>
  );
}
