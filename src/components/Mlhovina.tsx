import { useId } from "react";

/**
 * Malachitová „mlhovina“ za nadpisem úvodu a sekcí 01–05.
 *
 * Tři nepravidelné oblé mraky místo kruhové záře – Karlovi kruh přišel moc
 * kruhový a vybral si ze čtyř návrhů variantu „Mlhovina“, jen o kus
 * tmavší (27. 9. 2026). Tvary jsou oblé, ale záměrně ne kruh ani ovál.
 * U každého nadpisu je mlhovina jiná (`varianta`) a mraky pomalu mění tvar.
 *
 * Proč takhle:
 *  - Rozmazání dělá SVG filtr UVNITŘ obrázku, ne CSS `filter: blur()`.
 *    Safari s CSS rozmazáním na SVG kreslilo za okrajem prvku fialovorůžový
 *    pruh. viewBox má proto rezervu na rozmazání (≈ 3 × stdDeviation).
 *  - Každý mrak je SAMOSTATNÉ SVG a hýbe se celé (natažení, stlačení,
 *    pootočení kolem vlastního středu). Kdyby se tvar měnil uvnitř filtru,
 *    prohlížeč by rozmazání počítal znovu v každém snímku – na školních PC
 *    by to bylo znát. Takhle se rozmaže jednou a pohyb dělá grafická karta.
 *  - Při „omezit pohyb“ mraky stojí (globals.css, `.mlhovina-mrak`).
 *
 * Souřadnice: bod (200, 250) viewBoxu je levý horní roh nadpisu. viewBox
 * začíná na (−120, −70), proto se celek posouvá o −320 / −320 px (v sekcích
 * o tři čtvrtiny). Rodič musí mít `relative` a `isolate`; přesah do strany
 * ořízne `overflow-x: clip` na `.sekce` (úvod má `overflow-hidden`).
 */

type Mrak = {
  /** Obrys mraku v souřadnicích viewBoxu. */
  d: string;
  /** Přibližný střed – kolem něj se mrak deformuje. */
  stred: [number, number];
};

/** Barvy podle role mraku: hlavní malachit, modrozelený, světlý. */
const BARVY = [
  "fill-accent-300/[0.34] dark:fill-accent-500/[0.24]",
  "fill-[#3fb8c9]/[0.16] dark:fill-[#3fb8c9]/[0.12]",
  "fill-accent-200/[0.3] dark:fill-accent-300/[0.09]",
];

/** 0 = úvod, 1–5 = sekce 01–05. Každá má jiné rozložení tří mraků. */
const VARIANTY: [Mrak, Mrak, Mrak][] = [
  [
    { d: "M120 300 C 180 170, 430 150, 570 225 C 700 295, 830 250, 875 355 C 920 470, 715 565, 525 525 C 360 490, 255 600, 150 520 C 55 445, 70 385, 120 300 Z", stred: [500, 370] },
    { d: "M430 430 C 530 355, 715 375, 770 470 C 825 565, 640 650, 515 615 C 395 580, 335 490, 430 430 Z", stred: [600, 500] },
    { d: "M905 175 C 1050 110, 1270 155, 1310 260 C 1350 365, 1185 425, 1060 385 C 935 345, 795 240, 905 175 Z", stred: [1110, 270] },
  ],
  [
    { d: "M60 330 C 150 230, 380 240, 560 280 C 760 325, 980 260, 1120 330 C 1250 395, 1080 480, 880 470 C 660 460, 520 520, 330 500 C 140 480, -20 420, 60 330 Z", stred: [590, 370] },
    { d: "M140 170 C 230 110, 400 130, 430 210 C 460 290, 330 330, 230 300 C 130 270, 60 220, 140 170 Z", stred: [270, 225] },
    { d: "M700 470 C 800 420, 960 450, 990 520 C 1020 590, 890 640, 790 610 C 690 580, 610 510, 700 470 Z", stred: [830, 530] },
  ],
  [
    { d: "M100 470 C 90 380, 250 300, 420 260 C 590 220, 760 150, 880 200 C 1000 250, 930 360, 780 400 C 620 440, 480 520, 300 540 C 170 555, 110 530, 100 470 Z", stred: [500, 370] },
    { d: "M520 150 C 620 90, 800 100, 840 170 C 880 240, 760 290, 650 270 C 540 250, 440 200, 520 150 Z", stred: [680, 190] },
    { d: "M180 560 C 260 520, 420 540, 440 600 C 460 660, 330 690, 240 670 C 150 650, 110 600, 180 560 Z", stred: [300, 610] },
  ],
  [
    { d: "M80 280 C 140 180, 330 170, 430 250 C 520 320, 500 440, 380 480 C 260 520, 120 470, 80 380 C 60 340, 60 310, 80 280 Z", stred: [280, 340] },
    { d: "M560 300 C 660 220, 850 230, 930 310 C 1000 380, 930 470, 800 480 C 680 490, 560 460, 530 390 C 510 350, 520 330, 560 300 Z", stred: [730, 370] },
    { d: "M400 480 C 480 440, 600 460, 620 520 C 640 580, 540 610, 460 590 C 380 570, 340 510, 400 480 Z", stred: [500, 530] },
  ],
  [
    { d: "M260 200 C 380 120, 620 130, 740 210 C 860 290, 820 400, 680 430 C 540 460, 460 540, 320 540 C 180 540, 90 450, 120 360 C 140 290, 180 250, 260 200 Z", stred: [460, 340] },
    { d: "M20 420 C 90 360, 230 380, 260 450 C 290 520, 180 580, 90 560 C 0 540, -40 470, 20 420 Z", stred: [135, 470] },
    { d: "M820 180 C 920 140, 1060 170, 1080 240 C 1100 310, 990 340, 900 320 C 810 300, 740 220, 820 180 Z", stred: [920, 240] },
  ],
  [
    { d: "M40 380 C 120 300, 300 330, 440 300 C 600 265, 700 200, 820 250 C 940 300, 900 420, 760 450 C 600 485, 420 470, 260 490 C 110 510, -20 450, 40 380 Z", stred: [460, 380] },
    { d: "M300 180 C 380 130, 530 150, 560 220 C 590 290, 480 320, 390 300 C 300 280, 230 230, 300 180 Z", stred: [420, 235] },
    { d: "M900 380 C 990 340, 1130 360, 1150 430 C 1170 500, 1060 530, 970 510 C 880 490, 820 420, 900 380 Z", stred: [1010, 440] },
  ],
];

const VIEW = { x: -120, y: -70, w: 1640, h: 900 };
/** Animace mraků. Názvy celé, ne skládané – Tailwind by jinak třídy
 *  v globals.css při sestavení vyhodil jako nepoužité. */
const ANIMACE = ["mlhovina-mrak--1", "mlhovina-mrak--2", "mlhovina-mrak--3"];
/** Délky „nádechu“ jednotlivých mraků – různé, ať se nikdy nesejdou. */
const DELKY = [19, 24, 29];

export function Mlhovina({
  varianta = 0,
  className = "",
}: {
  /** 0 = úvod, 1–5 = sekce 01–05. */
  varianta?: number;
  className?: string;
}) {
  const zaklad = `mlhovina-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const mraky = VARIANTY[((varianta % VARIANTY.length) + VARIANTY.length) % VARIANTY.length];
  return (
    <div aria-hidden className={`pointer-events-none absolute -z-10 ${className}`}>
      {mraky.map((m, i) => {
        const id = `${zaklad}-${i}`;
        const ox = ((m.stred[0] - VIEW.x) / VIEW.w) * 100;
        const oy = ((m.stred[1] - VIEW.y) / VIEW.h) * 100;
        return (
          <svg
            key={id}
            viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
            className={`mlhovina-mrak ${ANIMACE[i]} absolute inset-0 h-full w-full`}
            style={{
              transformOrigin: `${ox.toFixed(1)}% ${oy.toFixed(1)}%`,
              animationDuration: `${DELKY[i]}s`,
              // Záporné zpoždění = každá mlhovina začíná v jiné fázi.
              animationDelay: `-${varianta * 4 + i * 7}s`,
            }}
          >
            <defs>
              <filter
                id={id}
                filterUnits="userSpaceOnUse"
                x={VIEW.x}
                y={VIEW.y}
                width={VIEW.w}
                height={VIEW.h}
              >
                <feGaussianBlur stdDeviation="55" />
              </filter>
            </defs>
            <path className={BARVY[i]} filter={`url(#${id})`} d={m.d} />
          </svg>
        );
      })}
    </div>
  );
}
