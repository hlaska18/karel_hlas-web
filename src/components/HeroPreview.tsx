"use client";

import { useEffect, useState } from "react";
import { BarChart3, Database, Files, FileCode2, FileSpreadsheet, FileText, Image as ImageIcon, Laptop } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { toolLabel } from "@/lib/bankLabels";
import { pickHeroHighlights } from "@/lib/heroPick";
import { ToolGlassIcon, hasToolGlassIcon } from "@/components/ToolGlassIcon";
import { PreviewModal } from "@/components/BankBrowser";
import { NAHLED_STR } from "@/lib/nahled";
import type { BankItem } from "@/lib/materials";

/**
 * Stoh karet se SKUTEČNÝMI materiály z banky vedle nadpisu.
 *
 * Záměrně to není dekorativní obrázek: karty nesou reálné názvy souborů,
 * takže je to zároveň ukázka i důkaz („tohle si fakt odnesu"). Drží skleněný
 * jazyk webu, ale nesoupeří s ikonami témat níž – ukazuje soubory, ne témata.
 *
 * Při každém načtení se losuje jiná trojice, takže banka působí živě
 * (a stálý návštěvník uvidí i materiály, na které by jinak nenarazil).
 *
 * Na mobilu se neukazuje: tam se počítá každý pixel nad ohybem a tlačítko
 * musí zůstat vidět bez scrollování.
 */

function toolIcon(tool: string) {
  switch (tool) {
    case "Excel":
      return FileSpreadsheet;
    case "Word":
      return FileText;
    case "Python":
      return FileCode2;
    case "Power BI":
      return BarChart3;
    case "Databáze":
      return Database;
    case "Digitální gramotnost":
      return Laptop;
    case "Grafika a multimédia":
      return ImageIcon;
    default:
      return Files;
  }
}

/** Náklon a odsazení jednotlivých karet – shora dolů, jako rozhozený stoh. */
const LAYOUT = [
  "-rotate-[5deg] translate-x-0",
  "rotate-[2.5deg] translate-x-8",
  "-rotate-[1.5deg] translate-x-3",
];

export function HeroPreview({ pool }: { pool: BankItem[] }) {
  const { lang, tr } = useLang();

  // Server i první vykreslení musí dát stejnou trojici (jinak neshoda při
  // hydrataci); teprve po připojení se losuje doopravdy.
  const [items, setItems] = useState(() => pickHeroHighlights(pool));
  useEffect(() => {
    setItems(pickHeroHighlights(pool, 3, Math.random));
  }, [pool]);

  /* Náhled se otevírá rovnou tady, ne až v bance. Dřív celý stoh vedl na
     `#banka`: karta slibovala konkrétní materiál a doručila seznam témat. */
  const [nahled, setNahled] = useState<BankItem | null>(null);
  const n = NAHLED_STR[lang];

  if (items.length === 0) return null;

  /* Modifikátory nechává prohlížeči (stejně jako `SmoothScroll`): Cmd+klik
     otevře soubor v nové kartě, pravé tlačítko nabídne zkopírování adresy.
     Prostý klik ukáže náhled. */
  const klik = (e: React.MouseEvent, it: BankItem) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setNahled(it);
  };

  return (
    /* Skrytí na mobilu a šířku sloupce řeší obal v Hero.tsx – vedle karet
       v něm stojí ještě odkazy na čtení.

       `<div>`, ne `<a>`: karty jsou nově samy odkazy a odkaz v odkazu je
       nevalidní HTML. `group-hover:` funguje na jakémkoli elementu, takže
       srovnání stohu při najetí zůstává. */
    <div className="group block">
      <p className="mb-4 pl-1 text-xs font-medium uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
        {tr.hero.sample}
      </p>

      {/* Seznam, ne řada divů: čtečka pak ohlásí „3 položky" a projde je
          šipkami. Dřív to byl jeden odkaz, takže se předčítal jako jeden cíl. */}
      <ul className="space-y-4">
        {items.map((it, i) => {
          const Icon = toolIcon(it.tool);
          const nazev = lang === "en" ? it.label.en : it.label.cs;
          return (
            <li key={it.href}>
            <a
              href={it.href}
              onClick={(e) => klik(e, it)}
              title={`${n.previewTitle}: ${nazev}`}
              aria-label={`${n.previewTitle}: ${nazev}`}
              /* Dvě úrovně jako u článků níž: najetí kamkoli do stohu srovná
                 všechny karty, karta pod kurzorem se navíc rozsvítí smaragdovým
                 okrajem a září – stejné gesto jako tlačítko „Procházet materiály".
                 Funguje i uvnitř jednoho odkazu: `:hover` na kartě je vlastní.
                 `dark:hover:` je nutné, jinak `dark:border-*` hover přebije. */
              className={`glass group/karta flex items-center gap-3 rounded-karta p-4 transition duration-300 hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-600/30 group-hover:rotate-0 group-hover:translate-x-0 dark:hover:border-accent-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${LAYOUT[i % LAYOUT.length]}`}
            >
              {/* Barevná skleněná ikona tématu, TÁŽ jako na dlaždicích v bance –
                  ukázka tak rovnou říká, odkud materiál je.

                  V klidu ODBARVENÁ, po najetí na kartu se rozsvítí. Karty
                  mají být tiché, ale silueta na to byla špatný nástroj: na
                  24 px z ní zbyla šedá šmouha (paleta bez důlků, sloupce
                  Power BI slité do bloku) a dvakrát se kvůli tomu ladila.
                  `grayscale` drží obojí – prokreslení zůstane, klid taky.

                  Bez šedého podkladu: skleněné ikony jsou dělané jako plovoucí
                  objekt bez rámu a v bance se kreslí stejně. Čtverec zůstává
                  jen kvůli zarovnání s textem. */}
              <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                {hasToolGlassIcon(it.tool) ? (
                  <ToolGlassIcon
                    tool={it.tool}
                    className="h-9 w-9 object-contain grayscale group-hover/karta:grayscale-0"
                    hoverClassName="group-hover/karta:scale-110"
                    sizes="36px"
                  />
                ) : (
                  <Icon className="h-5 w-5 text-zinc-600 transition duration-300 group-hover/karta:text-accent-700 dark:text-accent-400 dark:text-zinc-400 dark:group-hover/karta:text-accent-300" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {nazev}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-600 dark:text-zinc-400">
                  {toolLabel(it.tool, lang)}
                </span>
              </span>

              <span className="shrink-0 rounded-stitek bg-black/[0.05] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-600 transition duration-300 group-hover/karta:bg-accent-500/15 group-hover/karta:text-accent-700 dark:text-accent-400 dark:bg-white/10 dark:text-zinc-400 dark:group-hover/karta:text-accent-300">
                {it.ext}
              </span>
            </a>
            </li>
          );
        })}
      </ul>

      {nahled && <PreviewModal item={nahled} lang={lang} onClose={() => setNahled(null)} />}
    </div>
  );
}
