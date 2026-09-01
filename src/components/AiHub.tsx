"use client";

/**
 * Sekce AI Hub.
 *
 * Karta výstupu schválně ukazuje REFLEXI a OVĚŘENÍ hned, ne až po rozkliknutí.
 * Přesně tím se ověřený výstup liší od souboru v bance: cizí učitel se má
 * dozvědět, co nefungovalo, dřív než si to stáhne.
 */

import { AiHubSouhvezdi } from "@/components/AiHubSouhvezdi";
import { useLang } from "@/lib/i18n";
import { sazba } from "@/lib/sazba";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";
import { FAZE, OZNACENI_VYSTUPU, type Faze, type Vystup } from "@/lib/aihubLabels";

/** Český tvar podle počtu: 1 výstup, 2–4 výstupy, 5+ výstupů. */
function pocetSlovy(n: number, a: { countOne: string; countFew: string; countMany: string }) {
  if (n === 1) return a.countOne;
  if (n >= 2 && n <= 4) return a.countFew;
  return a.countMany;
}

function nazevFaze(f: Faze, a: { fazePred: string; fazePo: string }) {
  return f === "pred" ? a.fazePred : a.fazePo;
}

function Pole({ popisek, text }: { popisek: string; text: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
        {popisek}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{text}</dd>
    </div>
  );
}

type Texty = ReturnType<typeof useLang>["tr"]["aihub"];

function Karta({ v, a }: { v: Vystup; a: Texty }) {
  return (
    <li className="povrch rounded-karta p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{v.nazev}</h3>
        {/* Vyplatilo se, nebo ne. Neúspěch je plnohodnotný záznam Hubu, ale
            nesmí vypadat jako doporučení – proto barva, ne jen slovo. */}
        <span
          className={
            v.vysledek === "vyplatilo"
              ? "rounded-stitek bg-accent-500/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300"
              : "rounded-stitek bg-amber-500/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300"
          }
        >
          {v.vysledek === "vyplatilo" ? a.vysledekVyplatilo : a.vysledekNevyplatilo}
        </span>
        {/* Milník jen tehdy, když opravdu je – prázdný štítek by lhal. */}
        {v.milnik && (
          <span className="rounded-stitek bg-accent-500/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
            {v.milnik}
          </span>
        )}
      </div>

      {/* Označení, autor a zařazení. Škola a role jsou jednou pod seznamem,
          ne u každé karty – na třiceti kartách by se to četlo jako výplň. */}
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {OZNACENI_VYSTUPU} · {v.autor} · {v.predmet} · {v.cilovaSkupina}
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Pole popisek={a.labelCil} text={v.cil} />
        <Pole popisek={a.labelNastroj} text={v.nastroj} />
        <Pole popisek={a.labelOvereni} text={v.overeni} />
        <Pole popisek={a.labelUspora} text={v.uspora} />
        <Pole popisek={a.labelReflexe} text={v.reflexe} />
      </dl>

      <div className="mt-4">
        <Pole popisek={a.labelDoporuceni} text={v.doporuceni} />
      </div>

      {v.prilohy.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            {a.labelPrilohy}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {v.prilohy.map((p) => (
              <li key={p.soubor}>
                <a
                  href={`${v.href}/${encodeURIComponent(p.soubor)}`}
                  download
                  className="inline-flex items-center rounded-full bg-accent-500/10 px-3 py-1 text-sm font-medium text-accent-700 transition hover:bg-accent-500/20 dark:text-accent-300"
                >
                  {p.nazev}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">{v.publikovano}</p>
    </li>
  );
}

export function AiHub({ vystupy }: { vystupy: Vystup[] }) {
  const { tr, lang } = useLang();
  const a = tr.aihub;

  return (
    <section id="ai-hub" className="sekce">
      <div className="container-page">
        {/* Text vlevo, hvězdičky vpravo. Vpravo od úvodního odstavce (`max-w-2xl`)
            je jediné místo, které v sekci zeje prázdnotou, a souhvězdí je nízké,
            takže k výšce řady nepřidá nic — na tom padl jeho předchůdce.
            Ukazuje se i s výstupy: není to výplň prázdné sekce, ale navázání
            na hvězdičku, kterou má AI Hub v menu. */}
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
          <SectionHeader
            no="03"
            kicker={a.kicker}
            intro={sazba(a.intro, lang)}
            heading={
              <>
                {a.heading}
                {/* Stejně jako u sekce s nástroji do ostatních předmětů:
                    „nová sekce" se čte jako živá, mlčení jako zanedbaná. */}
                <span className="glass-accent ml-3 inline-block whitespace-nowrap rounded-full px-3 py-1 align-middle font-sans text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                  {a.badge}
                </span>
              </>
            }
          />
          <AiHubSouhvezdi />
        </div>

        {vystupy.length === 0 ? (
          <div className="povrch mt-6 rounded-karta p-6">
            <p className="font-medium text-zinc-900 dark:text-white">{a.emptyTitle}</p>
            <p className="mt-2 max-w-[46rem] text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {sazba(a.emptyText, lang)}
            </p>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {vystupy.length} {pocetSlovy(vystupy.length, a)}
            </p>

            {/* Dělení podle fáze učitelovy práce. Prázdná fáze se vynechá –
                nadpis nad prázdnem vypadá jako chyba. */}
            {FAZE.map((f) => {
              const skupina = vystupy.filter((v) => v.faze === f);
              if (skupina.length === 0) return null;
              return (
                <div key={f} className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                    {nazevFaze(f, a)}
                  </h3>
                  <ul className="mt-3 grid gap-4">
                    {skupina.map((v) => (
                      <Karta key={v.id} v={v} a={a} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </>
        )}

        <p className="mt-6 max-w-[46rem] text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {sazba(a.licenceNote, lang)}
        </p>

        {/* Bez tohohle řetěz šipek u této sekce končil a další se přeskočila. */}
        <SectionJump href="#ai-nastroje" label={tr.nastroje.kicker} />
      </div>
    </section>
  );
}
