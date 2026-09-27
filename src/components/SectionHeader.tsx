import type { ReactNode } from "react";
import { Mlhovina } from "@/components/Mlhovina";
import { Reveal } from "@/components/Reveal";
import { SectionKicker } from "@/components/SectionKicker";

/** Výchozí styl nadpisu sekce (h2). */
const HEADING = "mt-3 font-display text-3xl font-bold tracking-nadpis sm:text-4xl";
/** Výchozí styl úvodního odstavce pod nadpisem. */
const INTRO = "mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400";

/**
 * Sdílená hlavička sekce: kicker s pořadovým číslem + nadpis + volitelný úvod,
 * vše zabalené v Reveal. Sjednocuje opakovaný vzor napříč sekcemi homepage.
 */
export function SectionHeader({
  no,
  kicker,
  heading,
  intro,
  headingClassName = HEADING,
  introClassName = INTRO,
}: {
  no: string;
  kicker: ReactNode;
  heading: ReactNode;
  intro?: ReactNode;
  headingClassName?: string;
  introClassName?: string;
}) {
  return (
    // Stejná mlhovina jako za nadpisem úvodu (Hero), aby sekce 01–05
    // navazovaly (Karel 27. 9. 2026); nadpis je tu menší, tak i ona – na
    // tři čtvrtiny. `isolate` drží `-z-10` nad pozadím stránky; do strany ji
    // ořízne `overflow-x: clip` na `.sekce`.
    <div className="relative isolate">
      <Mlhovina className="-left-[150px] -top-[112px] h-[435px] w-[1020px]" />
      <Reveal>
        <SectionKicker no={no}>{kicker}</SectionKicker>
        <h2 className={headingClassName}>{heading}</h2>
        {intro != null && <p className={introClassName}>{intro}</p>}
      </Reveal>
    </div>
  );
}
