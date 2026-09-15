"use client";

import { GraduationCap, Briefcase } from "lucide-react";

import { useLang } from "@/lib/i18n";

/**
 * Časová osa v sekci O mně: svislá kolejnice v pravém sloupci, na ní vzdělání
 * a pod ním praxe.
 *
 * KDE STOJÍ A PROČ. Karel ji chce přesně tam, kde byly původní dlaždice
 * Vzdělání/Praxe – tedy v úzkém pravém sloupci mřížky. Ten měří ~286 px.
 * Verze přes celou šířku (vzdělání vlevo, praxe vpravo) se tam nevešla a Karel
 * ji odmítl; místo vyhrálo nad rozdělením na dvě strany.
 *
 * PROČ SE NEPOLOHUJE PODLE ROKU. Dřívější pokus sázel položky na svislou
 * osu podle letopočtu a dorovnával srážky konstantou. Jenže magistr i SPŠ
 * Tábor začínají TÝMŽ rokem 2024, takže v jednom sloupci na sebe nalezly
 * vždycky – žádná konstanta to neřeší, změřeno -2 px a na úzkém až -73 px.
 * Položky proto normálně tečou pod sebou a roky nese popisek období.
 *
 * CO SE TÍM ZTRATILO. Že mezi bakalářem (do 2022) a magistrem (od 2024) je
 * dvouletá mezera, kterou přesně vyplňují Malšice, už není vidět jako díra –
 * dá se to jen vyčíst z letopočtů. V 286 px široké koleji na to není místo.
 *
 * POHYB. Po kolejnici stéká světlo a značka „nyní" dole tepe – obojí jen
 * `opacity` a `transform`, takže to jede na GPU. Zapíná se AŽ při
 * `prefers-reduced-motion: no-preference` (viz `globals.css`): bez pohybu
 * kolejnice zůstane celá a jen stojí.
 */

type Polozka = { period: string; place: string; detail: string; od: number; do: number | null };

export function CasovaOsa() {
  const { tr } = useLang();
  const a = tr.about;

  return (
    <div className="osa">
      {/* Kolejnice vede přes obě skupiny, aby to byl jeden čas, ne dva seznamy. */}
      <div className="osa__linka">
        <span className="osa__svetlo" />
        <span className="osa__nyni" />
      </div>

      <Strana
        titul={a.eduTitle}
        ikona={<GraduationCap className="h-4 w-4" aria-hidden />}
        polozky={a.education}
        strana="studium"
        nyni={a.nyni}
      />
      <Strana
        titul={a.expTitle}
        ikona={<Briefcase className="h-4 w-4" aria-hidden />}
        polozky={a.experience}
        strana="praxe"
        nyni={a.nyni}
      />
    </div>
  );
}

function Strana({
  titul,
  ikona,
  polozky,
  strana,
  nyni,
}: {
  titul: string;
  ikona: React.ReactNode;
  polozky: Polozka[];
  strana: "studium" | "praxe";
  nyni: string;
}) {
  return (
    <div className={`osa__strana osa__strana--${strana}`}>
      <p className="osa__titul">
        {ikona}
        <span>{titul}</span>
      </p>
      {polozky.map((p) => (
        <div key={p.place + p.od} className="osa__polozka">
          <span className="osa__tecka" />
          <span className="osa__obdobi">
            {p.do === null ? p.period.replace(/\s*[–-]\s*\S+$/, ` – ${nyni}`) : p.period}
          </span>
          <span className="osa__misto">{p.place}</span>
          <span className="osa__detail">{p.detail}</span>
        </div>
      ))}
    </div>
  );
}
