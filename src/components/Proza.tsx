import { Children, type ReactNode } from "react";
import { sazba } from "@/lib/sazba";

/**
 * Česká sazba pro text psaný přímo v JSX.
 *
 * Na homepage jde všechna próza přes slovník, takže tam stačí `sazba()` nad
 * řetězcem. Stránka kurzu má ale odstavce napsané rovnou v JSX a proložené
 * `<b>`, `<i>` a odkazy – ručně vkládat nezlomitelné mezery by znamenalo
 * 38 neviditelných znaků ve zdroji, které při první úpravě textu zmizí.
 *
 * Tahle komponenta projde přímé textové děti a nechá značky být.
 */
export function Proza({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.map(children, (dite) =>
        typeof dite === "string" ? sazba(dite, "cs") : dite,
      )}
    </>
  );
}
