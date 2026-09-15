"use client";

import type { CSSProperties } from "react";

import { useLang } from "@/lib/i18n";

/**
 * Časová osa v sekci O mně: svisle, vzdělání vlevo, praxe vpravo.
 *
 * PROČ JEDNA OSA A NE DVĚ KRABICE. Předchůdce byly dva svislé seznamy vedle
 * fotky. Karel je označil za okoukané a chtěl něco, co se hýbe – ale hlavní
 * vada byla jinde: dvě oddělené krabice schovávaly, že jde o TÝŽ čas. Na jedné
 * ose je vidět, co z nich vyčíst nešlo – mezi bakalářem (do 2022) a magistrem
 * (od 2024) je dvouletá mezera a přesně ji vyplňují Malšice.
 *
 * PROČ PŘES CELOU ŠÍŘKU. Karel chtěl vzdělání vlevo a praxi vpravo. V pravém
 * sloupci, kde osa chvíli stála, má strana jen ~135 px – a samotný detail
 * („Bc. – učitelství informatiky a angličtiny pro 2. stupeň") potřebuje na
 * jeden řádek 296 px. Přes celou šířku má strana ~560 px a vejde se na řádek.
 *
 * PROČ SE NA ŠIROKÉM POPISKY NEPŘETISKNOU. Magistr i SPŠ Tábor začínají týmž
 * rokem 2024. Jednostranná verze je skládala do jednoho sloupce a přetiskly se
 * o 2 px; tady padne každý na svou stranu a potkat se nemá jak.
 *
 * PROČ SE NA ÚZKÉM NESKLÁDÁ PODLE ROKU. Pod 1024 px není místo na dvě strany,
 * takže by obě spadly do jednoho sloupce – a tím se vrátí přesně ta srážka,
 * které se dvoustranné uspořádání vyhnulo. Změřeno na 375 px: Mgr. a SPŠ se
 * překryly o 73 px. Úzká verze proto položky NEPOLOHUJE podle roku, ale nechá
 * je téct pod sebou (Vzdělání, pak Praxe); roky nese popisek období a délku
 * nese text, ne svislá vzdálenost. Kolejnice, světlo i značka „nyní" zůstávají,
 * takže se to pořád hýbe.
 *
 * PROČ PŘES CSS PROMĚNNÉ. Polohy musí jít na úzkém displeji vypnout, jenže
 * `style={{ top }}` z komponenty by `@media` přebilo jen přes `!important`.
 * Komponenta proto dodá jen čísla (`--y`, `--h`, `--osa-vyska`) a o to, jestli
 * se použijí, se rozhodne v `globals.css`.
 *
 * POHYB. Po ose stéká světlo a značka „nyní" dole tepe – obojí jen `opacity`
 * a `transform`, takže to jede na GPU. Zapíná se AŽ při
 * `prefers-reduced-motion: no-preference` (viz `globals.css`): bez pohybu osa
 * zůstane celá a jen stojí.
 */

/** Výška jednoho roku v `rem`. Na tom stojí celá výška osy i polohy pruhů. */
const ROK = 3.6;

/** Doběh pod posledním rokem, ať má značka „nyní" kam dosednout. */
const DOBEH = 1.2;

type Polozka = { period: string; place: string; detail: string; od: number; do: number | null };

/** CSS proměnná v `style`. TypeScript vlastní vlastnosti v `CSSProperties` nezná. */
function prom(jmeno: string, hodnota: string): CSSProperties {
  return { [jmeno]: hodnota } as CSSProperties;
}

export function CasovaOsa() {
  const { tr } = useLang();
  const a = tr.about;
  const letos = new Date().getFullYear();

  const vse: Polozka[] = [...a.education, ...a.experience];
  const zacatek = Math.min(...vse.map((p) => p.od));
  const konec = Math.max(...vse.map((p) => p.do ?? letos));

  /** Rok → odsazení shora v `rem`. */
  const kde = (rok: number) => (rok - zacatek) * ROK;

  const roky: number[] = [];
  for (let r = zacatek; r <= konec; r += 1) roky.push(r);

  return (
    <div className="osa" style={prom("--osa-vyska", `${kde(konec) + DOBEH}rem`)}>
      <Strana
        titul={a.eduTitle}
        polozky={a.education}
        kde={kde}
        letos={letos}
        strana="vlevo"
        nyni={a.nyni}
      />

      {/* Osa uprostřed */}
      <div className="osa__stred">
        <div className="osa__linka">
          <span className="osa__svetlo" />
          {roky.map((r) => (
            <span key={r} className="osa__tik" style={prom("--y", `${kde(r)}rem`)} />
          ))}
          <span className="osa__nyni" style={prom("--y", `${kde(konec)}rem`)} />
        </div>

        {/* Letopočty. Poslední se vynechá – sedí na něm značka „nyní" a dva
            popisky u jednoho bodu jsou navíc. */}
        {roky.map((r) =>
          r === konec ? null : (
            <span key={r} className="osa__rok" style={prom("--y", `${kde(r)}rem`)}>
              {r}
            </span>
          ),
        )}
        <span className="osa__rok osa__rok--nyni" style={prom("--y", `${kde(konec)}rem`)}>
          {a.nyni}
        </span>
      </div>

      <Strana
        titul={a.expTitle}
        polozky={a.experience}
        kde={kde}
        letos={letos}
        strana="vpravo"
        nyni={a.nyni}
      />
    </div>
  );
}

function Strana({
  titul,
  polozky,
  kde,
  letos,
  strana,
  nyni,
}: {
  titul: string;
  polozky: Polozka[];
  kde: (rok: number) => number;
  letos: number;
  strana: "vlevo" | "vpravo";
  nyni: string;
}) {
  return (
    <div className={`osa__strana osa__strana--${strana}`}>
      <p className="osa__titul">{titul}</p>
      {polozky.map((p) => {
        const horni = kde(p.od);
        const vyska = kde(p.do ?? letos) - horni;
        return (
          <div key={p.place + p.od} className="osa__polozka" style={prom("--y", `${horni}rem`)}>
            {/* Pruh nese DÉLKU období – z něj je na širokém vidět, že fakulta
                běží tři roky a že mezi bakalářem a magistrem je díra. Na úzkém
                se roztáhne na výšku textu, protože tam se podle roku nepolohuje. */}
            <span className="osa__pruh" style={prom("--h", `${vyska}rem`)} />
            <span className="osa__text">
              <span className="osa__obdobi">
                {p.do === null ? p.period.replace(/\s*[–-]\s*\S+$/, ` – ${nyni}`) : p.period}
              </span>
              <span className="osa__misto">{p.place}</span>
              <span className="osa__detail">{p.detail}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
