"use client";

import Link from "next/link";
import { ArrowUp, Database, MonitorCog } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SITE } from "@/lib/content";
import { Mark } from "@/components/Mark";

/** Odkazy na samostatné nástroje – stejný tvar, ať se nerozejdou. */
const ODKAZ_NASTROJE =
  "inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition " +
  "hover:text-accent-700 dark:text-zinc-300 dark:hover:text-accent-300";

export function Footer() {
  const { tr, lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/5 py-10 dark:border-white/10">
      <div className="container-page flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <Mark />
          <div>
            <p className="font-display text-sm font-semibold tracking-podnadpis">{SITE.name}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{tr.footer.role}</p>
          </div>
        </div>

        {/* Samostatné nástroje webu. Bez těchhle odkazů k nim vede jen cesta
            přes banku materiálů – z úvodní stránky by o nich nikdo nevěděl. */}
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Link
            href={lang === "en" ? "/sql?z=en" : "/sql"}
            className={ODKAZ_NASTROJE}
          >
            <Database className="h-4 w-4 text-accent-700 dark:text-accent-400" />
            {tr.footer.sqlCourse}
          </Link>
          <Link href="/windows" className={ODKAZ_NASTROJE}>
            <MonitorCog className="h-4 w-4 text-accent-700 dark:text-accent-400" />
            {tr.footer.windows}
          </Link>
        </div>

        <div className="flex flex-col items-center gap-1 text-center sm:items-end sm:text-right">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            © {year} {SITE.name} · {tr.footer.rights}{" "}
            <a
              href={tr.footer.licenseHref}
              target="_blank"
              rel="license noopener noreferrer"
              className="font-semibold underline decoration-dotted underline-offset-2 transition hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-400"
            >
              {tr.footer.licenseName}
            </a>
          </p>
          {/* Vazba na školu. Ne kosmetika: bez ní web vypadá jako soukromá
              stránka učitele, který na SPŠ náhodou učí, a ne jako výstup
              vznikající v rámci jeho práce tam. */}
          <p className="max-w-[34rem] text-xs text-zinc-600 dark:text-zinc-400">
            {tr.footer.affiliation}
          </p>
          {/* Vercel Analytics neukládá cookies ani neidentifikuje návštěvníka,
              takže souhlas nepotřebuje – ale mlčet se o měření nemá. */}
          {/* Odkaz stojí hned za větou o měření: kdo se nad ní pozastaví,
              má odpověď na dosah a nemusí ji hledat jinde. */}
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {tr.footer.analytics}{" "}
            <Link
              href={lang === "en" ? "/en/soukromi" : "/soukromi"}
              className="font-semibold underline decoration-dotted underline-offset-2 transition hover:text-accent-700 dark:text-accent-400"
            >
              {tr.footer.soukromiOdkaz}
            </Link>
          </p>
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700 transition hover:text-accent-700 dark:text-accent-400"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            {tr.footer.top}
          </a>
        </div>
      </div>
    </footer>
  );
}
