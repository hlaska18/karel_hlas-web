import { ReactNode } from "react";

/**
 * Jednoduchý wrapper – obsah se vykreslí OKAMŽITĚ, bez animace, která by
 * blokovala jeho zobrazení (důležité pro rychlé načtení na mobilu).
 * Parametry delay/y jsou ponechány kvůli zpětné kompatibilitě, ale ignorují se.
 */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
