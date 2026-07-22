import { SITE } from "@/lib/content";

/**
 * Monogram (iniciály) v smaragdovém čtverci – sdílený mezi hlavičkou, patičkou
 * a stránkou kurzu. `className` umožní doplnit stavové styly (stín, hover).
 */
export function Monogram({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 font-display text-sm font-bold text-white ${className}`.trim()}
    >
      {SITE.initials}
    </span>
  );
}
