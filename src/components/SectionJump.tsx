import { ArrowDown, ArrowUp } from "lucide-react";

/**
 * Decentní „přejít na další sekci" ukazatel – stejný styl jako v hero
 * (šipka + název sekce), umístěný pod každou sekcí.
 */
export function SectionJump({
  href,
  label,
  direction = "down",
  className = "mt-10 flex sm:mt-12",
}: {
  href: string;
  label: string;
  direction?: "down" | "up";
  /** Ovládá vnější okraj / zobrazení (display). Výchozí = okraj nahoře + flex. */
  className?: string;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <a
      href={href}
      className={`w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400 dark:hover:text-accent-400 ${className}`}
    >
      <Icon className="h-4 w-4 animate-bounce" />
      {label}
    </a>
  );
}
