import { ReactNode } from "react";

/**
 * Lehký „nájezd" obsahu čistě přes CSS – animace se spustí ihned při
 * vykreslení (nečeká na JavaScript), takže obsah je na mobilu hned vidět.
 * Při systémovém nastavení „omezit pohyb" se animace vypne (viz globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-up ${className}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
