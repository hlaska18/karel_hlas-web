import { MARK_PATHS } from "@/lib/mark";

/**
 * Značka webu ve skleněném provedení – sdílená mezi hlavičkou, patičkou
 * a stránkou kurzu. `className` umožní doplnit stavové styly (stín, hover).
 *
 * Povrch je `glass-accent`, tedy stejný jazyk jako skleněné ikony u témat;
 * samostatné ikony (favicona, iOS, karta pro sdílení) používají plnou plochu
 * kvůli kontrastu – viz `src/lib/mark.ts`.
 */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`glass-accent flex h-9 w-9 items-center justify-center rounded-xl text-accent-700 dark:text-accent-300 ${className}`.trim()}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}
