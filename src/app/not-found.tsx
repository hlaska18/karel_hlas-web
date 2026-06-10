"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";

/**
 * Vlastní 404 ve stylu webu. Jazyk se pozná z adresy (/en/... → angličtina);
 * vykresluje se uvnitř root layoutu, takže funguje světlý i tmavý režim.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const en = pathname === "/en" || pathname.startsWith("/en/");

  const t = en
    ? {
        title: "Page not found",
        desc: "This page doesn't exist — maybe a typo in the address, or it has moved.",
        home: "Back to homepage",
        lessons: "Lessons & materials",
      }
    : {
        title: "Stránka nenalezena",
        desc: "Tahle stránka neexistuje — možná překlep v adrese, nebo se přestěhovala.",
        home: "Zpět na úvod",
        lessons: "Výuka a materiály",
      };
  const home = en ? "/en" : "/";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      {/* dekorativní pozadí jako na hlavní stránce */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent-400/20 blur-[120px] dark:bg-accent-500/20" />
        <div className="absolute bottom-[-10%] right-[-8%] h-[320px] w-[320px] rounded-full bg-accent-300/20 blur-[110px] dark:bg-accent-700/20" />
        <div className="absolute inset-0 text-black/[0.04] bg-dots dark:text-white/[0.05]" />
      </div>

      <div className="glass w-full max-w-lg rounded-[2rem] p-10 text-center sm:p-12">
        <p className="font-display text-7xl font-bold tracking-tight text-accent-600 dark:text-accent-400 sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">{t.desc}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={home}
            className="group inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-600/20 transition hover:bg-accent-500 hover:shadow-accent-500/30"
          >
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            {t.home}
          </Link>
          <Link
            href={`${home}#vyuka`}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:border-accent-400 hover:text-accent-600 dark:border-white/15 dark:text-zinc-100 dark:hover:text-accent-400"
          >
            <GraduationCap className="h-4 w-4" />
            {t.lessons}
          </Link>
        </div>
      </div>
    </main>
  );
}
