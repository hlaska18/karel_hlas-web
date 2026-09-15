"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Briefcase } from "lucide-react";

import { useLang } from "@/lib/i18n";

/**
 * Časová osa v sekci O mně: svislá kolejnice v pravém sloupci, kde stávaly
 * dlaždice Vzdělání/Praxe. Obě skupiny se po čase STŘÍDAJÍ.
 *
 * KDE STOJÍ A PROČ. Karel ji chce přesně tam, kde byly původní dlaždice –
 * v úzkém pravém sloupci mřížky (~286 px). Verze přes celou šířku (vzdělání
 * vlevo, praxe vpravo) se tam nevešla a Karel ji odmítl.
 *
 * PROČ SE STŘÍDÁ. Karlův úplně první požadavek byl „něco, co se neustále
 * hýbe". Střídání ho plní líp než samotné světlo po kolejnici a zároveň
 * zkracuje sloupec: místo dvou seznamů pod sebou je vidět vždy jeden.
 *
 * PROČ SE NEPOLOHUJE PODLE ROKU. Magistr i SPŠ Tábor začínají týmž rokem
 * 2024, takže v jednom sloupci na sebe nalezly vždycky – žádná konstanta to
 * neřeší (změřeno -2 px, na úzkém displeji -73 px). Položky proto tečou pod
 * sebou a roky nese popisek období.
 *
 * CO SE VÁŽE NA CO. Přepínač a překrývání panelů se řídí třídou
 * `.js-reveal` na `<html>`, tedy tím, jestli běží JavaScript – tu třídu
 * nasazuje vložený skript v `layout.tsx` ještě před vykreslením, takže nic
 * neposkočí a bez JS zůstanou obě skupiny čitelné pod sebou.
 *
 * Střídání běží i při omezeném pohybu a prolíná se průhledností; za
 * `prefers-reduced-motion: no-preference` je schované jen POSOUVÁNÍ panelů
 * (a v `globals.css` světlo po kolejnici s tepem značky „nyní"). Posun je
 * to, co dělá lidem s vestibulárními potížemi zle, ne měknoucí
 * průhlednost. Že se obsah mění sám, je v pořádku potud, pokud jde
 * zastavit – a jde, viz níže.
 *
 * DÁ SE ZASTAVIT. Samo se to přepíná jen tak dlouho, dokud do toho někdo
 * nezasáhne: najetí myší nebo klávesnicí střídání pozastaví a kliknutí na
 * přepínač ho vypne úplně. Obsah, který se mění sám a nejde zastavit, je
 * vada přístupnosti (WCAG 2.2.2), ne ozdoba.
 */

/** Jak dlouho zůstane jedna skupina vidět. Tři položky se za tu dobu přečtou. */
const STRIDANI_MS = 7000;

type Polozka = { period: string; place: string; detail: string; od: number; do: number | null };

export function CasovaOsa() {
  const { tr } = useLang();
  const a = tr.about;

  const [aktivni, setAktivni] = useState(0);
  /** Uživatel si vybral sám – od té chvíle se nepřepíná. */
  const [vybral, setVybral] = useState(false);
  /** Myš nebo klávesnice uvnitř – jen pozastavit. */
  const [pauza, setPauza] = useState(false);

  useEffect(() => {
    if (vybral || pauza) return;
    const id = window.setInterval(() => setAktivni((i) => (i + 1) % 2), STRIDANI_MS);
    return () => window.clearInterval(id);
  }, [vybral, pauza]);

  const skupiny = [
    {
      titul: a.eduTitle,
      ikona: <GraduationCap className="h-4 w-4" aria-hidden />,
      polozky: a.education,
      druh: "studium" as const,
    },
    {
      titul: a.expTitle,
      ikona: <Briefcase className="h-4 w-4" aria-hidden />,
      polozky: a.experience,
      druh: "praxe" as const,
    },
  ];

  return (
    <div
      className="osa"
      /* Stav střídání je vidět i v DOM. Není to ozdoba: jinak nejde zvenčí
         ověřit, jestli se pauza opravdu chytla, a tichá vada v přístupnosti
         se pozná až u někoho, kdo si nestíhá číst. */
      data-strida={vybral ? "vypnuto" : pauza ? "pauza" : "bezi"}
      /* Myší události, ne `onPointerEnter`: Pointer Events neumí Safari 12,
         které je pořád v cíli webu (viz `.browserslistrc`). */
      onMouseEnter={() => setPauza(true)}
      onMouseLeave={() => setPauza(false)}
      onFocusCapture={() => setPauza(true)}
      onBlurCapture={() => setPauza(false)}
    >
      {/* Přepínač je vidět jen tam, kde se opravdu střídá – jinak by to byla
          dvě tlačítka, která nic nedělají. */}
      <div className="osa__prepinace">
        {skupiny.map((s, i) => (
          <button
            key={s.druh}
            type="button"
            className={`osa__prepinac${i === aktivni ? " osa__prepinac--aktivni" : ""}`}
            aria-pressed={i === aktivni}
            onClick={() => {
              setAktivni(i);
              setVybral(true);
            }}
          >
            {s.ikona}
            <span>{s.titul}</span>
          </button>
        ))}
      </div>

      <div className="osa__telo">
        <div className="osa__panely">
          {skupiny.map((s, i) => (
            <div
              key={s.druh}
              className={`osa__panel osa__strana--${s.druh}${
                i === aktivni ? " osa__panel--aktivni" : ""
              }`}
            >
              {/* Přímka má svou skupinu, ne celý blok: sahá přesně od prvního
                  bodu k poslednímu. Když vedla přes celé tělo, zbývalo pod
                  posledním bodem 148 px holé čáry, a u Praxe – která má jen
                  dvě položky – dokonce 142 px. Přímka pak vypadala, že někam
                  pokračuje a nedopadne.

                  Na jejím konci sedělo ještě kolečko „nyní". To dávalo smysl,
                  dokud se sázelo podle letopočtů a stál vedle něj popisek;
                  v tekoucím seznamu z něj zbyl puntík, který neoznačoval nic.
                  „Nyní" je dnes v popisku posledního období. */}
              <div className="osa__linka">
                <span className="osa__svetlo" />
              </div>

              {/* Nadpis uvnitř panelu je pro případ, kdy se nestřídá a přepínač
                  je schovaný – jinak by skupiny nebyly rozlišené. */}
              <p className="osa__titul">
                {s.ikona}
                <span>{s.titul}</span>
              </p>
              {s.polozky.map((p) => (
                <Radek key={p.place + p.od} p={p} nyni={a.nyni} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Radek({ p, nyni }: { p: Polozka; nyni: string }) {
  return (
    <div className="osa__polozka">
      <span className="osa__tecka" />
      <span className="osa__obdobi">
        {p.do === null ? p.period.replace(/\s*[–-]\s*\S+$/, ` – ${nyni}`) : p.period}
      </span>
      <span className="osa__misto">{p.place}</span>
      <span className="osa__detail">{p.detail}</span>
    </div>
  );
}
