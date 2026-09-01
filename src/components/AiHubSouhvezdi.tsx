/**
 * Souhvězdí hvězdiček vedle nadpisu sekce AI Hub.
 *
 * Vychází z toho, co Karlovi padlo do oka: „líbí se mi, jak v horním menu je
 * ta hvězdička u AI Hubu". Je to `Sparkles` z lucide — čtyřcípá hvězda, kterou
 * web už používá pro AI Hub v hlavičce a pro téma Umělá inteligence v bance.
 * Tady je to rozvedené do souhvězdí, aby sekce navazovala na svou položku
 * v menu, ne aby si vymýšlela nový obrázek.
 *
 * TVAR JE PŘEVZATÝ DOSLOVA z lucide `sparkles` (ISC licence, stejný balíček,
 * který web už používá). Kdyby se ikona v knihovně změnila, tahle kopie se
 * s ní nezmění — a je to tak lepší: souhvězdí je grafika, ne ikona rozhraní.
 *
 * ŠIROKÉ A NÍZKÉ SCHVÁLNĚ. Předchůdce téhle grafiky, ciferník, padl na tom, že
 * byl vyšší než všechno kolem a dělal kolem sebe díry. Souhvězdí se roztáhne
 * do šířky a k výšce řady nepřidá nic.
 *
 * ŽÁDNÝ JAVASCRIPT ani obrázek. Pohyb dělá CSS (`.souhvezdi*` v globals.css).
 */

/** Velká hvězda z lucide `sparkles`, ve své původní soustavě 24 × 24. */
const HVEZDA =
  "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z";

/**
 * Rozmístění. Nepravidelné schválně — na mřížce by z toho byl vzor, ne
 * souhvězdí. `k` je měřítko vůči původním 24 dílkům, `f` pořadí probliknutí
 * (pět různých rytmů, aby dvě sousední nezhasínaly zároveň).
 */
const HVEZDY = [
  { x: 148, y: 30, k: 1.65, f: 1 },
  { x: 60, y: 22, k: 1.0, f: 3 },
  { x: 214, y: 56, k: 0.85, f: 2 },
  { x: 104, y: 62, k: 0.6, f: 5 },
  { x: 18, y: 58, k: 0.5, f: 4 },
  { x: 186, y: 16, k: 0.45, f: 5 },
  { x: 246, y: 26, k: 0.55, f: 3 },
  { x: 130, y: 12, k: 0.4, f: 2 },
];

export function AiHubSouhvezdi() {
  return (
    <div className="souhvezdi" aria-hidden>
      <svg viewBox="0 0 268 84" className="souhvezdi__plocha" focusable="false">
        {HVEZDY.map((h, i) => (
          <path
            key={i}
            className={`souhvezdi__hvezda souhvezdi__hvezda--${h.f}`}
            d={HVEZDA}
            /* `-12` posune střed tvaru do zadaného bodu: hvězda je v původní
               soustavě 24 dílků, takže její střed leží na 12. */
            transform={`translate(${h.x} ${h.y}) scale(${h.k}) translate(-12 -12)`}
            /* Bez tohohle by drobné hvězdy měly tenčí čáru než velké – měřítko
               škáluje i tloušťku tahu. Takhle mají všechny stejnou. */
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}
