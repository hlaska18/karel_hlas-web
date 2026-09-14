"use client";

import { useLang } from "@/lib/i18n";

/**
 * Časová osa v sekci O mně: studium nad osou, praxe pod ní.
 *
 * PROČ JEDNA OSA A NE DVĚ KRABICE. Předchůdce byly dva svislé seznamy vedle
 * fotky. Karel na ně řekl „snadno se okoukají" a měl pravdu i v něčem, co
 * neřekl: dvě oddělené krabice schovávaly, že jde o TÝŽ čas. Studium běží
 * 2015–2026, práce od 2022 – překrývají se čtyři roky, tedy „učil jsem už
 * při studiu". To je zajímavější údaj než dva seznamy pod sebou a ze dvou
 * krabic se vyčíst nedal.
 *
 * PROČ PŘES CELOU ŠÍŘKU. Dřív to sedělo v pravém sloupci mřížky (0,55fr,
 * tedy asi 340 px). Na 340 px se jedenáct let vodorovně nevejde. Přesunem
 * pod fotku se mimochodem srovnala i nevyváženost sloupců, která měřením
 * vyšla na 2601 proti 572 px.
 *
 * POHYB. Karel chtěl něco, co se hýbe pořád, ne jen při najetí. Po ose plyne
 * světlo a značka „nyní" tepe – obojí jen `opacity` a `transform`, takže to
 * jede na GPU a nenutí stránku přepočítávat rozvržení. Zapíná se AŽ při
 * `prefers-reduced-motion: no-preference` (viz `globals.css`), takže bez
 * pohybu osa zůstane celá a jen stojí.
 *
 * ŠÍŘKA PRUHU NESE DÉLKU. Pruh je dlouhý podle toho, kolik let trvá, takže
 * je na první pohled vidět, že fakulta byla sedm let a Malšice dva.
 */

/** Kolik místa nechat za posledním rokem, ať má šipka „nyní" kam ukázat. */
const DOBEH = 0.06;

type Polozka = { period: string; place: string; detail: string; od: number; do: number | null };

export function CasovaOsa() {
  const { tr } = useLang();
  const a = tr.about;
  const letos = new Date().getFullYear();

  const vse = [...a.education, ...a.experience];
  const zacatek = Math.min(...vse.map((p) => p.od));
  const konec = Math.max(...vse.map((p) => p.do ?? letos));
  const rozsah = konec - zacatek;

  /** Rok → poloha v procentech šířky osy. */
  const kde = (rok: number) => ((rok - zacatek) / rozsah) * (1 - DOBEH) * 100;

  const roky: number[] = [];
  for (let r = zacatek; r <= konec; r += 1) roky.push(r);

  return (
    <div className="osa" aria-hidden={false}>
      <Stopa polozky={a.education} titul={a.eduTitle} kde={kde} letos={letos} nyni={a.nyni} nahore />

      {/* Vlastní osa */}
      <div className="osa__linka">
        <span className="osa__svetlo" />
        {roky.map((r) => (
          <span
            key={r}
            className={`osa__tik${r === zacatek || r === konec ? " osa__tik--velky" : ""}`}
            style={{ left: `${kde(r)}%` }}
          />
        ))}
        {/* Značka „nyní" na konci – tepe, aby bylo vidět, že osa pokračuje. */}
        <span className="osa__nyni" style={{ left: `${kde(konec)}%` }} />
      </div>

      {/* Popisky let. Krajní vždycky, prostřední až od `sm` – na mobilu by
          se jedenáct letopočtů slilo do šedé čáry. */}
      <div className="osa__roky">
        {roky.map((r) => (
          <span
            key={r}
            className={`osa__rok${r === zacatek || r === konec ? " osa__rok--krajni" : ""}`}
            style={{ left: `${kde(r)}%` }}
          >
            {r}
          </span>
        ))}
      </div>

      <Stopa polozky={a.experience} titul={a.expTitle} kde={kde} letos={letos} nyni={a.nyni} />
    </div>
  );
}

function Stopa({
  polozky,
  titul,
  kde,
  letos,
  nyni,
  nahore,
}: {
  polozky: Polozka[];
  titul: string;
  kde: (rok: number) => number;
  letos: number;
  nyni: string;
  nahore?: boolean;
}) {
  return (
    <div className={nahore ? "osa__stopa osa__stopa--nahore" : "osa__stopa"}>
      <p className="osa__titul">{titul}</p>
      <div className="osa__pruhy">
        {polozky.map((p) => {
          const doRok = p.do ?? letos;
          const levy = kde(p.od);
          const sirka = kde(doRok) - levy;
          return (
            <div
              key={p.place + p.od}
              className="osa__pruh"
              /* Poloha jde přes vlastní vlastnosti, ne přes `left`/`width`.
                 Nad zlomem je rozvržení použije, pod ním je prostě ignoruje
                 a pruhy tečou jako seznam – kdyby to byly přímo `left`
                 a `width`, musel by je mobil přebíjet přes `!important`. */
              style={{ "--levy": `${levy}%`, "--sirka": `${sirka}%` } as React.CSSProperties}
            >
              <span className="osa__pruh-obsah" title={`${p.period} · ${p.place}`}>
                {/* Rozsah letopočtů. Nad zlomem ho nese osa pod pruhy,
                    takže je schovaný; v seznamu na mobilu je jediný, kdo ho
                    řekne. */}
                <span className="osa__obdobi">{p.period}</span>
                <span className="osa__misto">{p.place}</span>
                <span className="osa__detail">{p.detail}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
