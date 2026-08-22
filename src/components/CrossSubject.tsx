"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Folder,
  Info,
  Plus,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { sazba } from "@/lib/sazba";
import type { Lang } from "@/lib/content";
import type { BankItem } from "@/lib/materials";
import { fmtSize, countMaterials } from "@/lib/bankLabels";
import { SITE } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";

type Subject = ReturnType<typeof useLang>["tr"]["cross"]["items"][number];

/**
 * „Nejen do informatiky" – dlaždice PŘEDMĚTŮ, ne témat informatiky.
 *
 * Proč dlaždice a ne popisné karty: oba cíloví učitelé v councilu shodně
 * řekli, že nadpis „Word – práce s textem" čtou jako název programu, kdežto
 * „ČEŠTINA" na dlaždici je věta „někdo myslel na mě".
 *
 * Dlaždice se rozbalí na místě (one-page), uvnitř jsou dvě různé věci:
 *  - MATERIÁLY – Karlovy vlastní soubory, vedou do banky,
 *  - NÁSTROJE – cizí služby, vedou ven. U každé je poznámka s tím, co
 *    učitele zaskočí (účet, jazyk, expirace odkazu, limity) – to je ta část,
 *    kterou běžné katalogy odkazů neuvádějí.
 */
export function CrossSubject({ items = [] }: { items?: BankItem[] }) {
  const { tr, lang } = useLang();
  const c = tr.cross;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="jinam" className="sekce">
      <div className="container-page">
        <SectionHeader
          no="02"
          kicker={c.kicker}
          intro={sazba(c.intro, lang)}
          heading={
            <>
              {c.heading}
              {/* Přiznaný stav rovnou u nadpisu, ne poznámkou pod čarou –
                  „nová sekce" se čte jako živá, mlčení jako zanedbaná. */}
              <span className="glass-accent ml-3 inline-block whitespace-nowrap rounded-full px-3 py-1 align-middle font-sans text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                {c.badge}
              </span>
            </>
          }
        />

        <ul className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((it, i) => (
            <Reveal as="li" key={it.subject} delay={0.05 * i} className="flex">
              <SubjectTile
                item={it}
                items={items}
                open={open === it.subject}
                onToggle={() => setOpen((cur) => (cur === it.subject ? null : it.subject))}
              />
            </Reveal>
          ))}

          {/* Výzva jako plnohodnotná dlaždice: mřížka je celá a sběr od kolegů
              je vidět tam, kde se člověk rozhoduje. */}
          <Reveal as="li" delay={0.05 * c.items.length} className="flex">
            <a
              href={`mailto:${SITE.email}`}
              className="povrch group flex w-full flex-col rounded-karta border border-dashed border-black/10 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15 dark:border-white/15"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ovladac bg-black/[0.04] text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="font-display text-lg font-semibold tracking-podnadpis text-zinc-700 dark:text-zinc-200">
                  {c.inviteTitle}
                </span>
              </span>
              {/* E-mail je součástí věty, ne samostatný řádek pod ní. Jako dva
                  bloky byla tahle dlaždice o 27 px vyšší než ostatní v mřížce
                  a v řádku vyčnívala; `items-start` na mřížce zůstat musí,
                  protože dlaždice předmětu se rozbaluje. */}
              <span className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {c.inviteText}{" "}
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-700 transition group-hover:gap-1.5 group-hover:text-accent-700 dark:text-zinc-300 dark:group-hover:text-accent-300">
                  {SITE.email}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </span>
            </a>
          </Reveal>
        </ul>

        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {sazba(c.note, lang)}
        </p>

        <SectionJump href="#about" label={tr.nav.about} />
      </div>
    </section>
  );
}

function SubjectTile({
  item,
  items,
  open,
  onToggle,
}: {
  item: Subject;
  items: BankItem[];
  open: boolean;
  onToggle: () => void;
}) {
  const { tr, lang } = useLang();
  const c = tr.cross;
  // Materiály toho tématu z banky – dedup přes obory už udělal getBankItems.
  // Vlastní soubory napřed, odkaz na cizí zdroj až za nimi: hlavní věc je to,
  // co si učitel stáhne, ne rozcestník.
  const files = item.tool
    ? items
        .filter((i) => i.tool === item.tool)
        .sort((a, b) => Number(a.external ?? false) - Number(b.external ?? false))
    : [];

  // Stejné gesto jako u dlaždic témat v bance: nadzvednutí a smaragdová záře.
  // Karta se rozbaluje, takže nadzvednutí platí i otevřené – chová se pak jako
  // jeden kus, ne jako panel, co se rozjel.
  return (
    <div className="povrch flex w-full flex-col rounded-karta transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 p-5 text-left transition active:scale-[0.99] active:duration-100"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center">
          <Image
            src={`/images/subjects/${item.icon}.png`}
            alt=""
            width={224}
            height={224}
          sizes="(min-width: 640px) 112px, 96px"
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold tracking-podnadpis text-zinc-900 dark:text-white">
            {item.subject}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {item.what}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-black/10 px-5 py-4 dark:border-white/10">
          {item.tool && files.length > 0 && (
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                {c.materialsLabel}
              </p>
              {/* Dřív tu byl jen odkaz „Otevřít materiály“ – učitel netušil, co za
                  ním je. Teď jsou soubory vidět rovnou, i s autorem, a odkaz do
                  banky tu není: složka ukazuje celé téma, takže by vedl na tu
                  samou dvojici souborů o sekci výš. */}
              <MaterialFolder name={item.tool} items={files} lang={lang} c={c} />
            </div>
          )}

          {item.tools && item.tools.length > 0 && (
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                {c.toolsLabel}
              </p>
              <ul className="mt-2 space-y-3">
                {item.tools.map((t) => (
                  <li key={t.name}>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 transition hover:text-accent-700 dark:text-accent-400 dark:text-white dark:hover:text-accent-300"
                    >
                      {t.name} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {t.why}
                    </p>
                    {/* Co učitele zaskočí – účty, jazyk, expirace, limity. */}
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {sazba(t.note, lang)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Rolovací složka s materiály přímo v dlaždici předmětu.
 *
 * Vědomě jednodušší než složka v bance: žádný náhled v modálu, jen co to je,
 * od koho a stáhnout. Učitel, který sem přijde z „Český jazyk", potřebuje
 * vidět obsah, ne prohlížeč – ten je o sekci výš v bance.
 */
function MaterialFolder({
  name,
  items,
  lang,
  c,
}: {
  name: string;
  items: BankItem[];
  lang: Lang;
  c: ReturnType<typeof useLang>["tr"]["cross"];
}) {
  const [open, setOpen] = useState(false);
  // Autor celé skupiny (_autor.txt) – u převzatých cvičebnic je to podstatné.
  const author = items.find((i) => i.groupAuthor)?.groupAuthor;

  return (
    <div className="povrch mt-2 overflow-hidden rounded-ovladac">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition active:scale-[0.99] active:duration-100"
      >
        <Folder className="h-4 w-4 shrink-0 text-accent-700 dark:text-accent-400" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {name}
          </span>
          <span className="block text-xs text-zinc-600 dark:text-zinc-400">
            {countMaterials(items.length, lang)}
          </span>
        </span>
        {author && (
          <span className="shrink-0 text-xs text-zinc-600 dark:text-zinc-400">{author}</span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="space-y-1.5 border-t border-black/10 px-3 py-2.5 dark:border-white/10">
          {items.map((it) => {
            const label = it.label[lang];
            // Převzatý materiál se nehostuje – vede na originál, ne ke stažení.
            if (it.external) {
              return (
                <li key={`${it.href}|${label}`}>
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-stitek px-1 py-1 text-sm text-zinc-700 transition hover:text-accent-700 dark:text-accent-400 dark:text-zinc-200 dark:hover:text-accent-300"
                  >
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block">{label}</span>
                      {/* Bez téhle věty učitel stáhne učebnici a nepochopí,
                          proč úlohy odkazují na soubory, které nemá. */}
                      {it.sourceNote && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {it.sourceNote[lang]}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              );
            }
            return (
              <li key={`${it.href}|${label}`}>
                <a
                  href={it.href}
                  download
                  className="group flex items-center gap-2 rounded-stitek px-1 py-1 text-sm text-zinc-700 transition hover:text-accent-700 dark:text-accent-400 dark:text-zinc-200 dark:hover:text-accent-300"
                  title={c.download}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <span className="shrink-0 text-xs text-zinc-600">{fmtSize(it.sizeBytes, lang)}</span>
                  <Download className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition group-hover:text-accent-700 dark:text-accent-400 dark:group-hover:text-accent-400" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
