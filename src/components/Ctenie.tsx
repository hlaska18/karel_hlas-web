"use client";

import { ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CLANKY } from "@/lib/content";

/**
 * Zajímavé články k digitálním technologiím – pod ukázkovými kartami v úvodu.
 *
 * Design schválně kopíruje stoh ukázkových karet nad tím: stejná skleněná
 * karta, stejný akcentní čtverec s ikonou vlevo, stejný štítek vpravo (u karet
 * přípona souboru, tady zdroj článku). Jediné, co se nepřebírá, je natočení
 * karet – to je gesto vázané na „stoh" a u pěti řádků pod sebou by z toho byl
 * nepořádek. Karty jsou proto o něco nižší, aby se sloupec vešel nad ohyb.
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
export function Ctenie() {
  const { tr, lang } = useLang();

  if (CLANKY.length === 0) return null;

  return (
    <section aria-labelledby="ctenie-nadpis">
      <p
        id="ctenie-nadpis"
        className="mb-3 pl-1 text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
      >
        {tr.hero.reading}
      </p>

      <ul className="space-y-2">
        {CLANKY.map((c) => {
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
                className="glass group flex items-center gap-3 rounded-2xl p-2.5 transition duration-300 hover:-translate-y-0.5"
              >
                <span className="glass-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                  <ExternalLink className="h-5 w-5 text-accent-700 dark:text-accent-300" />
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
                <span className="shrink-0 rounded-lg bg-accent-500/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-accent-700 dark:text-accent-300">
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
