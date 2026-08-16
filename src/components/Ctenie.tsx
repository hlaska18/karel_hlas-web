"use client";

import { ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CLANKY } from "@/lib/content";

/**
 * Zajímavé články k digitálním technologiím – pod ukázkovými kartami v úvodu.
 *
 * Design i chování se drží stohu ukázkových karet nad tím: stejná karta, stejný
 * čtverec s ikonou vlevo, stejný štítek vpravo (u karet přípona souboru, tady
 * zdroj článku) a stejné natočení, které se při najetí myší srovná. `group` je
 * na celé sekci, takže se – jako u stohu – narovnají všechny karty naráz, ne
 * jen ta pod kurzorem.
 *
 * Barevně zůstávají šedé: zelený akcent nesou karty nad nimi a nástroje níž,
 * dvě zvýrazněné sekce vedle sebe by soupeřily o stejnou pozornost.
 *
 * Tři vědomá rozhodnutí, protože rada tuhle rubriku odmítala právě kvůli nim:
 *
 *  - BEZ DAT. Datum je to, co se po třech měsících bez zásahu čte jako
 *    „tady už nikdo nebydlí". Seznam odkazů bez data zestárne mnohem pomaleji.
 *  - CIZÍ ODKAZY, ne vlastní texty. Vlastní články by braly čas přímo
 *    materiálům, kvůli kterým sem učitel chodí.
 *  - Když je seznam prázdný, nevykreslí se nic. Rubrika tedy nikdy nesvítí
 *    prázdná – buď v ní něco je, nebo tam není vůbec.
 *
 * Odkazy vedou ven, proto `target="_blank"`: návštěvník o rozečtenou stránku
 * s materiály nepřijde.
 */

/** Natočení karet – volnější obdoba stohu výš, ať nevznikne pravidelný vzor. */
const NATOCENI = [
  "-rotate-[3deg] translate-x-0",
  "rotate-[2deg] translate-x-5",
  "-rotate-[1.5deg] translate-x-2",
  "rotate-[3deg] translate-x-6",
  "-rotate-[2deg] translate-x-1",
];

export function Ctenie() {
  const { tr, lang } = useLang();

  if (CLANKY.length === 0) return null;

  return (
    <section aria-labelledby="ctenie-nadpis" className="group">
      <p
        id="ctenie-nadpis"
        className="mb-3 pl-1 text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
      >
        {tr.hero.reading}
      </p>

      <ul className="space-y-2">
        {CLANKY.map((c, i) => {
          // Zdroj · jazyk (jen když je čtenáři cizí) · co po kliknutí čeká
          const podtitulek = [
            c.source,
            c.jazyk && c.jazyk !== lang ? (lang === "cs" ? "anglicky" : "in Czech") : null,
            c.pozor?.[lang],
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={c.url}>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass flex items-center gap-3 rounded-2xl p-2.5 transition duration-300 group-hover:rotate-0 group-hover:translate-x-0 ${NATOCENI[i % NATOCENI.length]}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/5">
                  <ExternalLink className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                </span>
                <span className="min-w-0 flex-1">
                  {/* Bez `block`: line-clamp potřebuje display:-webkit-box a `block` by ho přebil. */}
                  <span className="line-clamp-2 text-sm font-semibold leading-snug">
                    {c.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {podtitulek}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-black/[0.05] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                  {c.znacka}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
