/**
 * Čtyři čtverce – táž značka, jakou má tlačítko Start uvnitř simulace.
 *
 * Bydlí v samostatném souboru jako `ZnakJablko`: potřebuje ji patička webu
 * i tlačítko simulátoru v úvodu a obě mají kreslit stejný tvar.
 * Obecná ikona monitoru tu dřív o prostředí neřekla nic; tohle člověk pozná.
 */
export function ZnakWindows({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      {/* Stejný tvar jako Start ve windowsové simulaci: zakulacené jen
          vnější rohy, takže čtyři díly drží jeden čtverec. */}
      <g fill="currentColor">
        <path d="M3.5 1H9v8H1V3.5A2.5 2.5 0 0 1 3.5 1Z" />
        <path d="M11 1h5.5A2.5 2.5 0 0 1 19 3.5V9h-8V1Z" />
        <path d="M1 11h8v8H3.5A2.5 2.5 0 0 1 1 16.5V11Z" />
        <path d="M11 11h8v5.5a2.5 2.5 0 0 1-2.5 2.5H11v-8Z" />
      </g>
    </svg>
  );
}
