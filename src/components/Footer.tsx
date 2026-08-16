"use client";

import Link from "next/link";
import { ArrowUp, Database } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SITE } from "@/lib/content";
import { Mark } from "@/components/Mark";

export function Footer() {
  const { tr } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/5 py-10 dark:border-white/10">
      <div className="container-page flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <Mark />
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">{SITE.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tr.footer.role}</p>
          </div>
        </div>

        {/* Jediná další stránka webu. Bez tohohle odkazu vede ke kurzu jen
            cesta přes dlaždici Databáze v bance – z úvodu o něm nikdo neví. */}
        <Link
          href="/sql"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-accent-700 dark:text-zinc-300 dark:hover:text-accent-300"
        >
          <Database className="h-4 w-4 text-accent-600 dark:text-accent-400" />
          {tr.footer.sqlCourse}
        </Link>

        <div className="flex flex-col items-center gap-1 text-center sm:items-end sm:text-right">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © {year} {SITE.name} · {tr.footer.rights}{" "}
            <a
              href={tr.footer.licenseHref}
              target="_blank"
              rel="license noopener noreferrer"
              className="font-semibold underline decoration-dotted underline-offset-2 transition hover:text-accent-600 dark:hover:text-accent-400"
            >
              {tr.footer.licenseName}
            </a>
          </p>
          {/* Vercel Analytics neukládá cookies ani neidentifikuje návštěvníka,
              takže souhlas nepotřebuje – ale mlčet se o měření nemá. */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tr.footer.analytics}</p>
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-600 transition hover:text-accent-500 dark:text-accent-400"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            {tr.footer.top}
          </a>
        </div>
      </div>
    </footer>
  );
}
