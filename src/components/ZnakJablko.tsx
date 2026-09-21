/**
 * Obrysové jablko – značka Macu.
 *
 * Bydlí v samostatném souboru bez závislostí, protože ho potřebuje jak
 * horní lišta simulace (`mac/HorniLista.tsx`), tak patička webu u odkazu na
 * macOS. Dřív měla každá svoje: lišta kreslené, patička obecné plné jablko
 * z lucide – a obě se lišily. Teď je tvar na jednom místě.
 *
 * Obrysové na Karlovo přání podle vzoru z itshover.com. Tvar je kreslený
 * jako obrysový od začátku, se širokými zákruty: když jsem nejdřív obtáhl
 * čarou plné jablko, čára ve 15 px úzké zákruty ucpala a zbyla skvrna.
 * Zářez je vpravo a lístek odtržený, jako na skutečném logu.
 */
export function ZnakJablko({ className = "h-[15px] w-[15px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 7.4C10.9 6.4 9 5.9 7.3 6.4 4.6 7.2 3.3 10 3.8 13.4 4.3 16.9 6.4 20.4 8.9 20.9 10.1 21.1 10.9 20.4 12 20.4 13.1 20.4 13.9 21.1 15.1 20.9 17 20.5 18.7 18.2 19.6 15.9 17.8 15.1 16.6 13.6 16.6 11.8 16.6 10.1 17.6 8.8 18.9 8.2 17.7 6.6 15.9 6 14.5 6.3 13.6 6.5 12.7 7 12 7.4Z" />
      <path d="M12.4 5.2C12.3 3.6 13.5 2.2 15.3 2 15.4 3.6 14.2 5 12.4 5.2Z" />
    </svg>
  );
}
