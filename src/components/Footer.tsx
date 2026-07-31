"use client";

import { ArrowUp } from "lucide-react";
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

        <div className="flex flex-col items-center gap-1 text-center sm:items-end sm:text-right">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © {year} {SITE.name} · {tr.footer.rights}
          </p>
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
