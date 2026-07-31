/**
 * Sdílené třídy pro opakované UI prvky (Tailwind). Drží styl na jednom místě,
 * ať se varianty nerozejdou mezi komponentami.
 */

/**
 * Kulaté ikonové tlačítko v hlavičce (jazyk, motiv, hamburger).
 *
 * Povrch i chování při najetí je schválně shodné s pilulkovými tlačítky
 * navigace (`InteractiveHoverButton`) – v jednom řádku hlavičky nemůžou být
 * tři různé materiály. Liší se jen tvar: kolečko místo pilulky.
 */
export const ICON_BUTTON =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 " +
  "bg-white/60 text-zinc-700 backdrop-blur-md transition-all duration-300 " +
  "hover:-translate-y-0.5 hover:border-accent-500/40 hover:text-accent-600 " +
  "hover:shadow-lg hover:shadow-accent-600/30 " +
  "dark:border-white/15 dark:bg-white/10 dark:text-zinc-200 " +
  // `dark:border-*` se generuje az za `hover:border-*` a pri shodne
  // specificite vyhrava – bez `dark:hover:` by okraj v tmavu zustal seda.
  "dark:hover:border-accent-500/40 dark:hover:text-accent-300";
