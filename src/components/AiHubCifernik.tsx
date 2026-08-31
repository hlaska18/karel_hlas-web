/**
 * Ciferník vyučovací hodiny vedle prázdné sekce AI Hub.
 *
 * Není to ozdoba. Sekce dělí obsah na tři fáze učitelovy práce (`FAZE`
 * v `aihubLabels.ts`) a tohle je jejich legenda: ručička obchází ciferník,
 * rozsvěcí fázi, ve které zrovna je, a uprostřed stojí její jméno. Kdo sem
 * přijde, než přibude první návod, aspoň uvidí, podle čeho budou seřazené.
 *
 * UKAZUJE SE JEN U PRÁZDNÉ SEKCE. Až tu budou karty výstupů, díru po pravé
 * straně zaplní ony a ciferník by s nimi jen soupeřil o pozornost.
 *
 * ŽÁDNÝ JAVASCRIPT. Pohyb dělá CSS (viz `.cifernik*` v globals.css).
 *
 * Proč viewBox začíná v `-100 -100`: střed soustavy je v nule, takže
 * `transform: rotate()` se otáčí kolem středu SAM OD SEBE. Kdyby viewBox
 * začínal v nule, bylo by potřeba `transform-origin` a `transform-box`,
 * a `transform-box: fill-box` umí až Safari 14 – tohle projde i na Mojave.
 *
 * `pathLength="100"` normalizuje obvod na sto dílků, takže výseče se zadávají
 * v procentech a nic se nepřepočítává podle poloměru.
 */

import { FAZE } from "@/lib/aihubLabels";

/** Kolik dílků ze sta zabere jedna výseč a jaká mezera je mezi nimi. */
const VYSEC = 30;
const MEZERA = 100 / 3 - VYSEC;

export function AiHubCifernik({ popisky }: { popisky: Record<(typeof FAZE)[number], string> }) {
  return (
    <div className="cifernik" aria-hidden>
      {/* Výška je větší než šířka schválně: ciferník zabírá horní čtverec
          a pod ním zbývá pruh na jméno fáze. Uvnitř kruhu být nemůže –
          ručička jde ze středu ven a při pohledu dolů by text přeškrtla. */}
      <svg viewBox="-100 -100 200 232" className="cifernik__plocha" focusable="false">
        {/* Rysky po obvodu – bez nich je to kruh, ne ciferník. */}
        <g className="cifernik__rysky">
          {Array.from({ length: 36 }, (_, i) => (
            <line key={i} x1="0" y1="-88" x2="0" y2={i % 3 === 0 ? -80 : -84}
              transform={`rotate(${i * 10})`} />
          ))}
        </g>

        {/* Tři výseče = tři fáze. Každá je tatáž kružnice, jen posunutá
            o třetinu obvodu přes `stroke-dashoffset`. */}
        {FAZE.map((f, i) => (
          <circle
            key={f}
            className={`cifernik__vysec cifernik__vysec--${i + 1}`}
            cx="0" cy="0" r="70"
            pathLength="100"
            strokeDasharray={`${VYSEC} ${100 - VYSEC}`}
            strokeDashoffset={-(i * (VYSEC + MEZERA)) + 25}
            strokeLinecap="round"
          />
        ))}

        {/* Ručička. Otáčí se celá skupina, aby špička držela s čárou. */}
        <g className="cifernik__rucicka">
          <line x1="0" y1="0" x2="0" y2="-58" strokeLinecap="round" />
          <circle cx="0" cy="-70" r="5" className="cifernik__spicka" />
        </g>
        <circle cx="0" cy="0" r="3.5" className="cifernik__stred" />

        {/* Jméno fáze pod ciferníkem. Tři texty přes sebe, každý svítí svou třetinu. */}
        {FAZE.map((f, i) => (
          <text
            key={f}
            className={`cifernik__popisek cifernik__popisek--${i + 1}`}
            x="0" y="116" textAnchor="middle"
          >
            {popisky[f]}
          </text>
        ))}
      </svg>
    </div>
  );
}
