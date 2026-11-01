"use client";

/**
 * Panel úkolů.
 *
 * Není to test a nic neblokuje – prostředí zůstává celou dobu volné. Panel
 * jen ukazuje, co se povedlo, a odškrtne se sám ve chvíli, kdy je výsledek
 * na počítači vidět. Dá se zabalit do proužku, aby nepřekážel, a rozbalit
 * zpátky, když žák neví, co dál.
 *
 * ZABALIT SE DÁ, ZAVŘÍT NE. Dřív tu vedle šipky býval ještě křížek, který
 * panel schoval do konce hodiny – a byla to past: žáci ho mačkali v dobré
 * víře a pak neměli jak úkoly vrátit, museli načíst celý simulátor znovu
 * a přišli o rozdělanou práci. Zbyla proto jediná ovládací věc, a ta vždycky
 * jen zabalí do proužku, ze kterého se panel vrátí jedním kliknutím.
 *
 * KROKY JSOU SCHOVANÉ. Návod ke každému úkolu se rozbalí až po kliknutí.
 * Kdyby byly kroky vidět pořád, je z panelu zeď textu, ve které se nedá
 * najít, co ještě zbývá – a rozhled po tom, co všechno jde zkusit, je to
 * hlavní, co má panel dávat.
 */

import { useMemo, useState } from "react";
import { Check, ChevronDown, ListChecks } from "lucide-react";
import { useSystem } from "./system";
import { SITUACE, SKUPINY_SIT, postup, skupinyPro, ukolyNavic, ukolyPro, type Ukol } from "@/lib/win/ukoly";
import { aktivniPorucha, CHYBY_SITE, type Situace } from "@/lib/win/sit";
import { SCENAR_SIT } from "@/lib/win/scenare";
import { RouterAKabely } from "./RouterAKabely";
import { MojeVysledkySimulatoru, PrehledTridySimulatoru, type Vzhled } from "@/components/postup/VysledkySimulatoru";

/** Barvy oken Moje výsledky a Přehled třídy – ať vypadají jako Windows. */
const VZHLED: Vzhled = {
  okno: "rounded-lg border border-win-linka bg-win-povrch shadow-[var(--win-stin)] win-bezvyberu",
  text: "text-win-text",
  slaby: "text-win-slaby",
  linka: "border-win-linka",
  najeti: "hover:bg-win-zvyrazneny",
  akcent: "bg-win-akcent",
  akcentText: "text-win-akcent-text",
  akcentPismo: "text-win-akcent",
  pole: "border border-win-linka bg-win-povrch text-win-text",
};

export function PanelUkolu() {
  const { stav, poslat } = useSystem();
  const [otevreny, nastavOtevreny] = useState(false);
  /** Otevřené okno: Moje výsledky, nebo Přehled třídy (pro učitele). */
  const [okno, nastavOkno] = useState<null | "vysledky" | "prehled" | "router">(null);
  const [rozbaleneSkupiny, nastavSkupiny] = useState<string[]>(() => [skupinyPro(stav.scenar)[0]]);
  const [rozbaleneUkoly, nastavUkoly] = useState<string[]>([]);

  // Cvičení „Síť a poruchy“ (`?scenar=sit`) má vlastní sadu úloh i kód WSIT1-.
  const { hotovo, celkem } = postup(stav.splneno, stav.scenar);
  // Síťové úlohy jsou v běžném seznamu, ale do „x/33“ se nepočítají (Karel 1. 11. 2026).
  const navic = ukolyNavic(stav.scenar);
  const hotovoNavic = navic.filter((u) => stav.splneno.includes(u.id)).length;
  const podleSkupin = useMemo(() => {
    const zakladni = ukolyPro(stav.scenar);
    const dalsi = ukolyNavic(stav.scenar);
    return [
      ...skupinyPro(stav.scenar).map((skupina) => ({ skupina, ukoly: zakladni.filter((u) => u.skupina === skupina), prvniNavic: false })),
      ...(dalsi.length ? SKUPINY_SIT : []).map((skupina, i) => ({
        skupina,
        ukoly: dalsi.filter((u) => u.skupina === skupina),
        prvniNavic: i === 0,
      })),
    ];
  }, [stav.scenar]);

  const okna =
    okno === "vysledky" ? (
      <MojeVysledkySimulatoru
        simulator={stav.scenar === SCENAR_SIT ? "sit" : "windows"}
        chyby={stav.chyby}
        jmeno={stav.nastaveni.jmenoUctu}
        nastavJmeno={(jmeno) => poslat({ typ: "nastaveni/zmen", zmena: { jmenoUctu: jmeno } })}
        splneno={stav.splneno}
        obnov={(ids) => poslat({ typ: "ukoly/splneno", ids })}
        otevriPrehled={() => nastavOkno("prehled")}
        zavri={() => nastavOkno(null)}
        vzhled={VZHLED}
      />
    ) : okno === "prehled" ? (
      <PrehledTridySimulatoru zavri={() => nastavOkno(null)} vzhled={VZHLED} />
    ) : okno === "router" && stav.sit ? (
      <RouterAKabely sit={stav.sit} zavri={() => nastavOkno(null)} />
    ) : null;

  if (!otevreny) {
    return (
      <button
        type="button"
        onClick={() => nastavOtevreny(true)}
        className="win-bezvyberu absolute bottom-4 right-4 z-[550] flex items-center gap-2.5 rounded-full border border-win-linka bg-win-povrch px-4 py-2 text-[12px] text-win-text shadow-[var(--win-stin)] hover:bg-win-zvyrazneny"
      >
        <ListChecks className="h-4 w-4 text-win-akcent" />
        Úkoly
        <span className="rounded-full bg-win-akcent px-2 py-0.5 text-[11px] font-semibold text-win-akcent-text">
          {hotovo} / {celkem}
        </span>
      </button>
    );
  }

  return (
    <>
      <aside
        aria-label="Úkoly"
        className="win-bezvyberu absolute bottom-4 right-4 z-[550] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-win-linka bg-win-povrch text-win-text shadow-[var(--win-stin)]"
      >
        <header className="shrink-0 border-b border-win-linka px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <ListChecks className="h-4 w-4 text-win-akcent" /> Úkoly
            </h2>
            <button
              type="button"
              aria-label="Zabalit úkoly"
              title="Zabalit do proužku"
              onClick={() => nastavOtevreny(false)}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-win-zvyrazneny"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-win-linka">
              <div
                className="h-full rounded-full bg-win-akcent transition-all"
                style={{ width: `${(hotovo / celkem) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] text-win-slaby">
              {hotovo} / {celkem}
            </span>
          </div>
        </header>

        <div className="win-posuv min-h-0 flex-1 overflow-auto p-2">
          {podleSkupin.map(({ skupina, ukoly, prvniNavic }) => {
            const hotoveVeSkupine = ukoly.filter((u) => stav.splneno.includes(u.id)).length;
            const rozbalena = rozbaleneSkupiny.includes(skupina);
            return (
              <section key={skupina} className="mb-1">
                {prvniNavic && (
                  <p className="mx-2 mb-1 mt-3 flex justify-between border-t border-win-linka pt-2 text-[11px] text-win-slaby">
                    <span>Navíc: síť</span>
                    <span>
                      {hotovoNavic}/{navic.length}
                    </span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() =>
                    nastavSkupiny((s) =>
                      s.includes(skupina) ? s.filter((x) => x !== skupina) : [...s, skupina],
                    )
                  }
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] font-semibold hover:bg-win-zvyrazneny"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      rozbalena ? "" : "-rotate-90"
                    }`}
                  />
                  <span className="flex-1 truncate">{skupina}</span>
                  <span className="shrink-0 text-[11px] font-normal text-win-slaby">
                    {hotoveVeSkupine}/{ukoly.length}
                  </span>
                </button>
                {rozbalena && prvniNavic && !stav.sit && <StartDomov />}
                {rozbalena && ukoly[0]?.situace && <StartSituace situace={ukoly[0].situace} />}
                {rozbalena &&
                  ukoly.map((u) => {
                    const splneno = stav.splneno.includes(u.id);
                    const navod = rozbaleneUkoly.includes(u.id);
                    return (
                      <div key={u.id}>
                        <button
                          type="button"
                          aria-expanded={navod}
                          onClick={() =>
                            nastavUkoly((s) =>
                              s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id],
                            )
                          }
                          className="flex w-full gap-2.5 rounded px-2 py-1.5 pl-7 text-left hover:bg-win-zvyrazneny"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              splneno
                                ? "border-win-akcent bg-win-akcent"
                                : "border-win-slaby"
                            }`}
                          >
                            {splneno && (
                              <Check className="h-2.5 w-2.5 text-win-akcent-text" strokeWidth={4} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-[12px] leading-snug ${
                                splneno ? "text-win-slaby line-through" : ""
                              }`}
                            >
                              {u.nazev}
                            </span>
                            {/* Věta pod názvem ustoupí, jakmile je rozbalený návod –
                                stojí v něm rovnou nahoře a dvakrát být nemusí. */}
                            {!splneno && !navod && (
                              <span className="mt-0.5 block text-[11px] leading-snug text-win-slaby">
                                {u.popis}
                              </span>
                            )}
                          </span>
                          <ChevronDown
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-win-slaby transition-transform ${
                              navod ? "" : "-rotate-90"
                            }`}
                          />
                        </button>

                        {navod && u.porucha && <Porucha ukol={u} />}
                        {navod && !u.porucha && (
                          <div className="mb-1.5 ml-[2.4rem] mr-2 border-l-2 border-win-akcent pl-3">
                            <p className="text-[11px] leading-snug text-win-slaby">{u.popis}</p>
                            <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-[11px] leading-snug marker:text-win-slaby">
                              {u.kroky.map((k, i) => (
                                <li key={i}>{k}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </section>
            );
          })}
        </div>

        {stav.scenar === SCENAR_SIT && (
          <a
            href="/windows"
            className="shrink-0 border-t border-win-linka px-4 py-2 text-[12px] text-win-akcent hover:bg-win-zvyrazneny"
          >
            Zpět na běžné úlohy Windows
          </a>
        )}
        {stav.sit && (
          // Fyzický router vedle počítače: kabely, kontrolky, štítek.
          <button
            type="button"
            onClick={() => nastavOkno("router")}
            className="shrink-0 border-t border-win-linka px-4 py-2 text-left text-[12px] text-win-akcent hover:bg-win-zvyrazneny"
          >
            Router a kabely – podívat se, co je zapojené
          </button>
        )}
        {stav.sit && stav.scenar !== SCENAR_SIT && (
          <button
            type="button"
            onClick={() => poslat({ typ: "sit/skola" })}
            className="shrink-0 border-t border-win-linka px-4 py-2 text-left text-[12px] text-win-akcent hover:bg-win-zvyrazneny"
          >
            Vrátit počítač do školy
          </button>
        )}
        <footer className="shrink-0 border-t border-win-linka px-4 py-2 text-[11px] text-win-slaby">
          Úkoly se odškrtávají samy podle toho, co je v počítači vidět.
          {/* Kód postupu místo vstupního kódu (25. 9. 2026): na konci hodiny
              ho žák zkopíruje do Teams, učitel ho vloží do Přehledu třídy. */}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => nastavOkno("vysledky")}
              className="rounded bg-win-akcent px-3 py-1.5 text-[12px] font-semibold text-win-akcent-text hover:opacity-90"
            >
              Moje výsledky
            </button>
            <button type="button" onClick={() => nastavOkno("prehled")} className="text-win-akcent hover:underline">
              Pro učitele: Přehled třídy
            </button>
          </div>
        </footer>
      </aside>
      {okna}
    </>
  );
}

/** Které chyby patří k poruše – jejich radu žák uvidí u úlohy. */
const CHYBY_PORUCHY: Partial<Record<string, string[]>> = { brana: ["db", "rr"], dns: ["id", "rr"] };

/** Poruchy v počítači (Nastavení) a poruchy v síti (kabely, router). */
const V_POCITACI = ["brana", "dns"];

/** Síťové úlohy běží na domácí síti, běžný počítač simulátoru stojí ve škole. */
function StartDomov() {
  const { poslat } = useSystem();
  return (
    <div className="mb-1.5 ml-7 mr-2 rounded border border-win-linka px-2.5 py-2 text-[11px] leading-snug">
      <p className="text-win-slaby">
        Tyhle úlohy se dělají doma, kde je počítač za routerem. Terminál, Nastavení a prohlížeč pak ukážou domácí síť. Zpátky
        do školy ho vrátíš tlačítkem dole.
      </p>
      <button
        type="button"
        onClick={() => poslat({ typ: "sit/domov" })}
        className="mt-1.5 rounded bg-win-akcent px-2.5 py-1 font-semibold text-win-akcent-text hover:opacity-90"
      >
        Přenést počítač domů
      </button>
    </div>
  );
}

/**
 * Začátek scénáře (nový router, cizí zařízení): tlačítko postaví síť od
 * začátku. Úlohy skupiny se počítají až potom – výchozí síť je zapojená.
 */
function StartSituace({ situace }: { situace: Situace }) {
  const { stav, poslat } = useSystem();
  const [ptamSe, nastavPtamSe] = useState(false);
  const spusteno = stav.stopy.includes(`situace:${situace}:spustena`);
  const { popis, tlacitko } = SITUACE[situace];
  const spust = () => {
    poslat({ typ: "sit/situace", situace });
    nastavPtamSe(false);
  };
  return (
    <div className="mb-1.5 ml-7 mr-2 rounded border border-win-linka px-2.5 py-2 text-[11px] leading-snug">
      <p className="text-win-slaby">{popis}</p>
      {!spusteno ? (
        <button
          type="button"
          onClick={spust}
          className="mt-1.5 rounded bg-win-akcent px-2.5 py-1 font-semibold text-win-akcent-text hover:opacity-90"
        >
          {tlacitko}
        </button>
      ) : ptamSe ? (
        <span className="mt-1.5 flex flex-wrap items-center gap-2">
          Router se vrátí na začátek scénáře.
          <button type="button" onClick={spust} className="text-win-akcent hover:underline">
            Ano, znovu
          </button>
          <button type="button" onClick={() => nastavPtamSe(false)} className="hover:underline">
            Ne
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => nastavPtamSe(true)} className="mt-1.5 text-win-akcent hover:underline">
          Začít scénář znovu
        </button>
      )}
    </div>
  );
}

/**
 * Úloha s poruchou: místo návodu tlačítko, které počítač schválně pokazí,
 * a nápovědy po jedné. Počet otevřených nápověd vidí jen žák – do kódu
 * postupu nejde (rada 31. 10. 2026: počítaná nápověda by se stala trestem).
 */
function Porucha({ ukol }: { ukol: Ukol }) {
  const { stav, poslat } = useSystem();
  const porucha = ukol.porucha!;
  const bezi = stav.sit ? aktivniPorucha(stav.sit) === porucha : false;
  const otevreno = Math.min(stav.napovedy?.[ukol.id] ?? 0, ukol.kroky.length);
  const rady = (CHYBY_PORUCHY[porucha] ?? []).filter((id) => stav.chyby?.[id]);
  const pocitac = V_POCITACI.includes(porucha);

  return (
    <div className="mb-1.5 ml-[2.4rem] mr-2 border-l-2 border-win-akcent pl-3 text-[11px] leading-snug">
      <p className="text-win-slaby">{ukol.popis}</p>
      {bezi ? (
        <p className="mt-1.5 font-semibold">
          {pocitac ? "Tento počítač je schválně pokažený – najdi proč." : "Tahle síť je schválně pokažená – najdi proč."}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => poslat({ typ: "sit/porucha", porucha })}
          className="mt-1.5 rounded bg-win-akcent px-2.5 py-1 font-semibold text-win-akcent-text hover:opacity-90"
        >
          {pocitac ? "Pokazit počítač" : "Pokazit síť"}
        </button>
      )}
      {otevreno > 0 && (
        <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 marker:text-win-slaby">
          {ukol.kroky.slice(0, otevreno).map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ol>
      )}
      {otevreno < ukol.kroky.length && (
        <button
          type="button"
          onClick={() => poslat({ typ: "napoveda", id: ukol.id })}
          className="mt-1.5 text-win-akcent hover:underline"
        >
          {otevreno ? "Další nápověda" : "Nápověda"} ({otevreno + 1}/{ukol.kroky.length})
        </button>
      )}
      {rady.map((id) => (
        <p key={id} className="mt-1.5 text-win-slaby">
          {CHYBY_SITE[id].rada}
        </p>
      ))}
      <p className="mt-1.5 text-win-slaby">Nápovědy vidíš jen ty, učitel je v kódu postupu nedostane.</p>
    </div>
  );
}
