/**
 * Malachitová „mlhovina“ za nadpisem úvodu a sekcí 01–05.
 *
 * Tři nepravidelné oblé mraky místo kruhové záře – Karlovi kruh přišel moc
 * kruhový a vybral si ze čtyř návrhů variantu „Mlhovina“, jen o kus
 * tmavší (27. 9. 2026). Tvary jsou oblé, ale záměrně ne kruh ani ovál.
 *
 * Souřadnice drží návrh 1 : 1: bod (200, 250) je levý horní roh nadpisu,
 * proto je SVG posunuté o −200 / −150 px (viewBox začíná na y = 100).
 * Rozmazání dělá CSS `blur`, ne SVG filtr – filtr by potřeboval id a ten se
 * na stránce s šesti mlhovinami nesmí opakovat.
 *
 * Rodič musí mít `relative` a stohovací kontext (`isolate`), jinak `-z-10`
 * propadne pod pozadí stránky. Přesah do strany ořízne `overflow-x: clip`
 * na `.sekce` (úvod má `overflow-hidden`).
 */
export function Mlhovina({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 100 1360 580"
      className={`pointer-events-none absolute -z-10 blur-[55px] ${className}`}
    >
      <path
        className="fill-accent-300/[0.34] dark:fill-accent-500/[0.24]"
        d="M120 300 C 180 170, 430 150, 570 225 C 700 295, 830 250, 875 355 C 920 470, 715 565, 525 525 C 360 490, 255 600, 150 520 C 55 445, 70 385, 120 300 Z"
      />
      <path
        className="fill-[#3fb8c9]/[0.16] dark:fill-[#3fb8c9]/[0.12]"
        d="M430 430 C 530 355, 715 375, 770 470 C 825 565, 640 650, 515 615 C 395 580, 335 490, 430 430 Z"
      />
      <path
        className="fill-accent-200/[0.3] dark:fill-accent-300/[0.09]"
        d="M905 175 C 1050 110, 1270 155, 1310 260 C 1350 365, 1185 425, 1060 385 C 935 345, 795 240, 905 175 Z"
      />
    </svg>
  );
}
