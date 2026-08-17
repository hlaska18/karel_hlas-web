import type { ReactNode } from "react";
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
    <Reveal>
      <SectionKicker no={no}>{kicker}</SectionKicker>
      <h2 className={headingClassName}>{heading}</h2>
      {intro != null && <p className={introClassName}>{intro}</p>}
    </Reveal>
  );
}
