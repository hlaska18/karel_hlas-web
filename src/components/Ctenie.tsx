"use client";

import { ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CLANKY } from "@/lib/content";

/**
 * Odkazy na čtení k digitálním technologiím – pod ukázkovými kartami v úvodu.
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
        {CLANKY.map((c) => (
          <li key={c.url}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-soft group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition hover:-translate-y-0.5"
            >
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition group-hover:text-accent-600 dark:group-hover:text-accent-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
                  {c.title}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  {c.source}
                  {/* Angličana upozorníme, že text je česky, ať neklikne naslepo. */}
                  {lang === "en" && c.cesky ? " · in Czech" : ""}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
