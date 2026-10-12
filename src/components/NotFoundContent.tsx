"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Library } from "lucide-react";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import { odhadniSimulator, type Simulator } from "@/lib/preklep";

const SIMULATOR: Record<Simulator, { cs: string; en: string; href: string; hrefEn: string }> = {
  windows: { cs: "Chtěl jsi simulátor Windows?", en: "Looking for the Windows simulator?", href: "/windows", hrefEn: "/windows" },
  macos: { cs: "Chtěl jsi simulátor macOS?", en: "Looking for the macOS simulator?", href: "/macos", hrefEn: "/macos" },
  sql: { cs: "Chtěl jsi kurz SQL?", en: "Looking for the SQL course?", href: "/sql", hrefEn: "/sql?z=en" },
};

/**
 * Obsah stránky 404. Jazyk se pozná z adresy (/en/… → angličtina), proto je to
 * klientská komponenta – a proto je oddělená od `not-found.tsx`: ten musí
 * zůstat serverový, aby mohl vyexportovat `metadata` s titulkem záložky.
 */
export function NotFoundContent() {
  const pathname = usePathname() ?? "/";
  const en = pathname === "/en" || pathname.startsWith("/en/");

  const t = en
    ? {
        title: "Page not found",
        desc: "This page doesn't exist – maybe a typo in the address, or it has moved.",
        home: "Back to homepage",
        lessons: "Teaching materials",
      }
    : {
        title: "Stránka nenalezena",
        desc: "Tahle stránka neexistuje – možná překlep v adrese, nebo se přestěhovala.",
        home: "Zpět na úvod",
        lessons: "Materiály do výuky",
      };
  const home = en ? "/en" : "/";
  // Žáci adresu simulátoru přepisují z tabule (/windovs, /mac…) – viz preklep.ts.
  const odhad = odhadniSimulator(pathname);
  const nabidka = odhad ? SIMULATOR[odhad] : null;

  return (
    <main id="main" className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      {/* dekorativní pozadí jako na hlavní stránce */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent-400/20 blur-[120px] dark:bg-accent-500/20" />
        <div className="absolute bottom-[-10%] right-[-8%] h-[320px] w-[320px] rounded-full bg-accent-300/20 blur-[110px] dark:bg-accent-700/20" />
      </div>

      <div className="povrch w-full max-w-lg rounded-[2rem] p-10 text-center sm:p-12">
        <p className="font-display text-7xl font-bold tracking-hero text-accent-700 dark:text-accent-400 sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-nadpis text-zinc-900 dark:text-white sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">{t.desc}</p>

        {nabidka && (
          <a
            href={en ? nabidka.hrefEn : nabidka.href}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-accent-700 px-7 py-3 font-semibold text-white shadow-lg shadow-accent-700/30 transition hover:bg-accent-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 dark:bg-accent-500 dark:text-zinc-950 dark:hover:bg-accent-400"
          >
            {en ? nabidka.en : nabidka.cs}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <InteractiveHoverButton href={home} text={t.home} icon={<ArrowLeft className="h-4 w-4" />} />
          <InteractiveHoverButton
            href={`${home}#banka`}
            text={t.lessons}
            icon={<Library className="h-4 w-4" />}
          />
        </div>
      </div>
    </main>
  );
}
