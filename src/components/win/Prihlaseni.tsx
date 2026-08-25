"use client";

/**
 * Uzamykací a přihlašovací obrazovka.
 *
 * První, co žák uvidí. Kromě zadání kódu má ještě jednu úlohu: říct rovnou
 * a bez kliků navíc, co to je. Nikdo nemá strávit první minutu hodiny
 * hádáním, jestli se dívá na skutečné Windows, nebo na výukovou simulaci.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Lock, UserRound } from "lucide-react";
import { Ikona } from "./Ikona";
import { TAPETY, vybranaTapeta } from "@/lib/win/obrazky";
import { datumSlovy, hodiny } from "@/lib/win/format";
import { prihlas } from "@/lib/postup/klient";

/**
 * Kroky: zámek → vlastní účet → vítejte.
 *
 * Třídní kód tu býval jako závora, ale nic nedržel. Kontroloval se jen
 * v prohlížeči – API o něm vůbec nevědělo, takže účty nechránil – a dokud
 * zůstával výchozí, obrazovka ho sama nabízela tlačítkem, které ho vyplnilo.
 * Zbyl z něj krok navíc na začátku hodiny. Žák se teď rovnou dostane k účtu,
 * na který se váže postup v úlohách, aby pokračoval i na jiném počítači.
 */
type Faze = "zamek" | "ucet" | "vitejte";

export function Prihlaseni({
  jmenoUctu,
  tapetaId,
  onHotovo,
}: {
  jmenoUctu: string;
  tapetaId: string;
  /** Přezdívka a postup ze serveru; bez synchronizace přijde `null`. */
  onHotovo: (ucet: { prezdivka: string; splneno: string[] } | null) => void;
}) {
  const [faze, nastavFazi] = useState<Faze>("zamek");
  const [chyba, nastavChybu] = useState(false);
  const [prezdivka, nastavPrezdivku] = useState("");
  const [heslo, nastavHeslo] = useState("");
  const [ceka, nastavCekani] = useState(false);
  const [hlaska, nastavHlasku] = useState("");
  /** Výsledek přihlášení – předá se dál, až doběhne uvítání. */
  const ucet = useRef<{ prezdivka: string; splneno: string[] } | null>(null);
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
    const dal = () => nastavFazi("ucet");
    window.addEventListener("keydown", dal);
    window.addEventListener("pointerdown", dal);
    return () => {
      window.removeEventListener("keydown", dal);
      window.removeEventListener("pointerdown", dal);
    };
  }, [faze]);

  useEffect(() => {
    if (faze === "ucet") window.setTimeout(() => pole.current?.focus(), 60);

    if (faze === "vitejte") {
      // Krátká pauza jako při skutečném přihlašování – ne kvůli efektu,
      // ale aby bylo poznat, že se přechází do jiného prostředí.
      const id = window.setTimeout(() => onHotovo(ucet.current), 1400);
      return () => window.clearTimeout(id);
    }
  }, [faze, onHotovo]);

  /**
   * Přihlášení k vlastnímu účtu. Když synchronizace neběží nebo se nepovede,
   * žák jde DÁL a postup se drží jen v tomhle prohlížeči – prostředí se kvůli
   * nedostupnému serveru nesmí zavřít.
   */
  const odesliUcet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ceka) return;
    nastavCekani(true);
    nastavHlasku("");

    const vysledek = await prihlas(prezdivka, heslo);
    nastavCekani(false);

    if (vysledek.stav === "nesedi") {
      nastavHlasku("K téhle přezdívce patří jiné heslo.");
      nastavChybu(true);
      window.setTimeout(() => nastavChybu(false), 700);
      return;
    }
    // Strop na počet pokusů. Nepouští dál stejně jako špatné heslo – jinak by
    // se žák octl na ploše s prázdným postupem a myslel si, že o něj přišel.
    // „Přeskočit" zůstává vedle a funguje, takže z hodiny nikdo nevypadne.
    if (vysledek.stav === "pockej") {
      nastavHlasku("Moc pokusů po sobě. Zkus to za chvíli, nebo klikni na Přeskočit.");
      nastavChybu(true);
      window.setTimeout(() => nastavChybu(false), 700);
      return;
    }
    if (vysledek.stav === "ok") {
      ucet.current = { prezdivka: vysledek.prezdivka, splneno: vysledek.splneno };
    }
    // „nenastaveno" i „chyba" pouštějí dál s postupem jen v prohlížeči.
    nastavFazi("vitejte");
  };

  const prezdivkaSedi = /^[\p{L}\p{N}._-]{2,32}$/u.test(prezdivka.trim());
  const lzeOdeslat = prezdivkaSedi && heslo.length >= 4 && !ceka;

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
            <p className="animate-pulse text-center text-[14px] text-white/85 drop-shadow">
              Klikni nebo stiskni libovolnou klávesu
            </p>
          </div>
        </div>
      )}

      {faze === "ucet" && (
        <form
          onSubmit={odesliUcet}
          className={`relative z-10 flex w-[min(92vw,420px)] flex-col items-center text-white ${
            chyba ? "animate-[zatreseni_0.45s]" : ""
          }`}
        >
          <Ikona klic="uzivatel" velikost={112} className="drop-shadow-lg" />
          <h1 className="mt-4 text-[26px] font-light">Tvůj postup</h1>
          <p className="mt-1 max-w-[320px] text-center text-[13px] leading-relaxed text-white/75">
            Zvol si přezdívku a heslo. Splněné úlohy se k nim uloží, takže můžeš
            pokračovat i na jiném počítači.
          </p>

          <div className="mt-5 flex w-full max-w-[300px] items-center gap-2 rounded-md border border-white/40 bg-black/35 px-3 backdrop-blur">
            <UserRound className="h-4 w-4 shrink-0 text-white/60" />
            <input
              ref={pole}
              value={prezdivka}
              onChange={(e) => nastavPrezdivku(e.target.value)}
              placeholder="Přezdívka"
              aria-label="Přezdívka"
              autoComplete="username"
              spellCheck={false}
              maxLength={32}
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/50"
            />
          </div>

          <div className="mt-2 flex w-full max-w-[300px] items-center gap-2 rounded-md border border-white/40 bg-black/35 px-3 backdrop-blur">
            <Lock className="h-4 w-4 shrink-0 text-white/60" />
            <input
              value={heslo}
              onChange={(e) => nastavHeslo(e.target.value)}
              type="password"
              placeholder="Heslo"
              aria-label="Heslo"
              autoComplete="current-password"
              maxLength={128}
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/50"
            />
            <button
              type="submit"
              disabled={!lzeOdeslat}
              aria-label="Pokračovat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/35 disabled:opacity-40"
            >
              {ceka ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>

          <p
            className={`mt-3 h-5 text-[13px] transition-opacity ${
              hlaska ? "text-[#ff9a9a] opacity-100" : "opacity-0"
            }`}
          >
            {hlaska || "\u00a0"}
          </p>

          {/* Přeskočení je tu schválně. Prostředí se kvůli přihlášení nesmí
              zavřít – kdo nechce účet, nebo komu zrovna neběží síť, jde dál
              a postup mu zůstane v tomhle prohlížeči. */}
          <button
            type="button"
            onClick={() => nastavFazi("vitejte")}
            className="mt-1 text-[12px] text-white/60 underline decoration-dotted underline-offset-2 hover:text-white/85"
          >
            Přeskočit – postup nechám jen v tomhle počítači
          </button>

          <p className="mt-8 max-w-[340px] text-center text-[12px] leading-relaxed text-white/65">
            Přezdívku si vymysli, nepoužívej svoje jméno. Na server se uloží jen
            ona a seznam splněných úloh – všechno ostatní, co v prostředí
            uděláš, zůstává v tomhle prohlížeči.
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
