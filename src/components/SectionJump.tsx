import { ArrowDown, ArrowUp } from "lucide-react";

/**
 * Decentní „přejít na další sekci" ukazatel – stejný styl jako v hero
 * (šipka + název sekce), umístěný pod každou sekcí.
 */
export function SectionJump({
  href,
  label,
  direction = "down",
}: {
  href: string;
  label: string;
  direction?: "down" | "up";
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <a
      href={href}
      className="mt-10 flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-400 transition hover:text-accent-600 dark:text-zinc-500 dark:hover:text-accent-400 sm:mt-12"
    >
      <Icon className="h-4 w-4 animate-bounce" />
      {label}
    </a>
  );
}
