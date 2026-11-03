"use client";

import { Mlhovina } from "@/components/Mlhovina";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useZabalit } from "@/lib/zabalit";
import Image from "next/image";
import {
  ArrowLeft,
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
import { zaznamenejStazeni } from "@/lib/mereni";
import { fmtSize, countMaterials } from "@/lib/bankLabels";
import { SITE, overenoText } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { SectionJump } from "@/components/SectionJump";

type Subject = ReturnType<typeof useLang>["tr"]["cross"]["items"][number];

/** Materiály předmětu z banky. Dedup přes obory už udělal getBankItems. */
function souboryPredmetu(item: Subject, items: BankItem[]) {
  // Vlastní soubory napřed, odkaz na cizí zdroj až za nimi: hlavní věc je to,
  // co si učitel stáhne, ne rozcestník.
  return item.tool
    ? items
        .filter((i) => i.tool === item.tool)
        .sort((a, b) => Number(a.external ?? false) - Number(b.external ?? false))
    : [];
}

/**
 * „Nejen do informatiky" – dlaždice PŘEDMĚTŮ, ne témat informatiky.
 *
 * Proč dlaždice a ne popisné karty: oba cíloví učitelé v councilu shodně
 * řekli, že nadpis „Word – práce s textem" čtou jako název programu, kdežto
 * „ČEŠTINA" na dlaždici je věta „někdo myslel na mě".
 *
 * Klik na dlaždici vymění mřížku za obsah předmětu, stejně jako dlaždice témat
 * v bance (one-page). Rozbalování na místě přestalo stačit, jak nástrojů
 * přibývá (Karel 3. 11. 2026). Uvnitř jsou dvě různé věci:
 *  - MATERIÁLY – Karlovy vlastní soubory, vedou do banky,
 *  - NÁSTROJE – cizí služby, vedou ven. U každé je poznámka s tím, co
 *    učitele zaskočí (účet, jazyk, expirace odkazu, limity) – to je ta část,
 *    kterou běžné katalogy odkazů neuvádějí.
 */
export function CrossSubject({ items = [] }: { items?: BankItem[] }) {
  const { tr, lang } = useLang();
  const c = tr.cross;
  // Klíčem je `icon`: na rozdíl od názvu předmětu je stejný v obou jazycích,
  // takže adresa ?predmet=fyzika přežije i přepnutí jazyka.
  const [otevreny, setOtevreny] = useState<string | null>(null);
  const mrizkaRef = useRef<HTMLUListElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const nadpisRef = useRef<HTMLHeadingElement | null>(null);
  // Kam po přepnutí pohledu s fokusem. Jen z kliknutí, ne ze sdíleného odkazu.
  const fokusPoZmene = useRef<{ kam: "detail" } | { kam: "dlazdice"; icon: string } | null>(null);

  const zapisDoAdresy = (icon: string | null) => {
    try {
      const url = new URL(window.location.href);
      if (icon) {
        url.searchParams.set("predmet", icon);
        // Zkopírovaná adresa pak přistane u předmětu, ne v úvodu stránky.
        url.hash = "jinam";
      } else {
        url.searchParams.delete("predmet");
      }
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    } catch {
      /* bez History API zůstane adresa, jak byla */
    }
  };
  const otevri = (icon: string) => {
    fokusPoZmene.current = { kam: "detail" };
    setOtevreny(icon);
    zapisDoAdresy(icon);
  };
  const zpet = () => {
    if (otevreny) fokusPoZmene.current = { kam: "dlazdice", icon: otevreny };
    setOtevreny(null);
    zapisDoAdresy(null);
  };
  useZabalit(() => {
    setOtevreny(null);
    zapisDoAdresy(null);
  });

  useEffect(() => {
    const cil = fokusPoZmene.current;
    fokusPoZmene.current = null;
    if (!cil) return;
    if (cil.kam === "detail") {
      // Mřížka zmizela a stránka se zkrátila: bez posunu by učitel od spodních
      // dlaždic skončil někde pod obsahem předmětu.
      detailRef.current?.scrollIntoView({ block: "start" });
      nadpisRef.current?.focus({ preventScroll: true });
    } else {
      mrizkaRef.current
        ?.querySelector<HTMLElement>(`[data-predmet="${CSS.escape(cil.icon)}"]`)
        ?.focus();
    }
  }, [otevreny]);

  // Sdílený odkaz: ?predmet=fyzika rovnou otevře předmět.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("predmet");
      if (p && tr.cross.items.some((it) => it.icon === p)) setOtevreny(p);
    } catch {
      /* ignore */
    }
    // Jen po načtení; po přepnutí jazyka přijde nová stránka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const predmet = c.items.find((it) => it.icon === otevreny);

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

        {/* Mlhovina pod dlaždicemi – matné sklo potřebuje, co rozmazat.
            Mřížka se při otevření předmětu jen schová (`hidden`): po návratu
            se dlaždice znovu neodhalují s animací a fokus má kam skočit. */}
        <div hidden={Boolean(predmet)} className="relative isolate mt-8">
        <Mlhovina varianta={5} className="-left-[12%] -top-[130px] h-[1000px] w-[125%]" />
        {/* `auto-rows-fr`: všechny dlaždice stejně vysoké (Karel 28. 9. 2026). */}
        <ul ref={mrizkaRef} className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((it, i) => (
            <Reveal as="li" key={it.icon} delay={0.05 * i} className="flex">
              <SubjectTile item={it} items={items} onOpen={() => otevri(it.icon)} />
            </Reveal>
          ))}

          {/* Výzva jako plnohodnotná dlaždice: mřížka je celá a sběr od kolegů
              je vidět tam, kde se člověk rozhoduje. */}
          <Reveal as="li" delay={0.05 * c.items.length} className="flex">
            <a
              href={`mailto:${SITE.email}`}
              className="povrch dlazdice group flex w-full flex-col justify-center rounded-karta border border-dashed border-black/10 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15 dark:border-white/15"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ovladac bg-black/[0.04] text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="font-display text-lg font-semibold tracking-podnadpis text-zinc-700 dark:text-zinc-200">
                  {c.inviteTitle}
                </span>
              </span>
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
        </div>

        {predmet && (
          <div ref={detailRef} className="mt-8 scroll-mt-24">
            <button
              type="button"
              onClick={zpet}
              className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:text-accent-700 dark:text-zinc-200 dark:hover:text-accent-400"
            >
              <ArrowLeft className="h-4 w-4" /> {c.back}
            </button>
            <DetailPredmetu item={predmet} items={items} nadpisRef={nadpisRef} />
          </div>
        )}

        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {sazba(c.note, lang)}
        </p>

        <SectionJump href="#ai-hub" label={tr.aihub.kicker} />
      </div>
    </section>
  );
}

function SubjectTile({
  item,
  items,
  onOpen,
}: {
  item: Subject;
  items: BankItem[];
  onOpen: () => void;
}) {
  /**
   * Je co otevírat? Předmět, který nemá ani materiály, ani nástroje, se
   * otevírat nesmí – otevřel by se prázdný pohled. Stalo se to ve chvíli,
   * kdy z češtiny odešla dlaždice Wordu a nic jiného v ní nezbylo.
   */
  const maObsah = souboryPredmetu(item, items).length > 0 || (item.tools?.length ?? 0) > 0;

  // Stejné gesto jako u dlaždic témat v bance: nadzvednutí a smaragdová záře.
  const Zahlavi = maObsah ? "button" : "div";
  return (
    <Zahlavi
      {...(maObsah ? { type: "button" as const, onClick: onOpen } : {})}
      data-predmet={item.icon}
      className="povrch dlazdice group flex w-full items-center gap-3 rounded-karta p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15 active:scale-[0.99] active:duration-100"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center">
        <Image
          src={`/images/subjects/${item.icon}.png`}
          alt=""
          width={224}
          height={224}
          // Ikona se vykresluje v rámečku 56 × 56 px (h-14 w-14); ostrost
          // na Retině si prohlížeč dopočítá z `sizes` sám (Codex 27. 9. 2026).
          sizes="56px"
          className="ikona-sklo h-full w-full object-contain transition duration-300 motion-safe:group-hover:scale-105"
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
    </Zahlavi>
  );
}

/** Obsah otevřeného předmětu: název, materiály a nástroje do hodin. */
function DetailPredmetu({
  item,
  items,
  nadpisRef,
}: {
  item: Subject;
  items: BankItem[];
  nadpisRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { tr, lang } = useLang();
  const c = tr.cross;
  const files = souboryPredmetu(item, items);
  const pocetNastroju = item.tools?.length ?? 0;

  return (
    <>
      <div className="mt-5 flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center">
          <Image
            src={`/images/subjects/${item.icon}.png`}
            alt=""
            width={224}
            height={224}
            sizes="56px"
            className="ikona-sklo h-full w-full object-contain"
          />
        </span>
        <div className="min-w-0">
          {/* `tabIndex={-1}`: sem skočí fokus po otevření předmětu. */}
          <h3
            ref={nadpisRef}
            tabIndex={-1}
            className="font-display text-xl font-semibold tracking-podnadpis text-zinc-900 dark:text-white"
          >
            {item.subject}
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {item.what}
          </p>
        </div>
      </div>

      {item.tool && files.length > 0 && (
        <div className="mt-6">
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

      {pocetNastroju > 0 && (
        <div className="mt-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            {c.toolsLabel} · {pocetNastroju}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {item.tools?.map((t) => (
              // Celá karta je klikací přes `after:`, ale název odkazu pro
              // čtečku zůstává krátký – jen jméno nástroje.
              <li
                key={t.name}
                className="povrch relative rounded-karta p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-600/15"
              >
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 transition after:absolute after:inset-0 after:rounded-karta hover:text-accent-700 dark:text-white dark:hover:text-accent-300"
                >
                  {t.name} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {t.why}
                </p>
                {/* Co učitele zaskočí – účty, jazyk, expirace, limity. */}
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {sazba(t.note, lang)}{" "}
                  <span className="whitespace-nowrap">· {overenoText(t.overeno, lang)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/**
 * Rolovací složka s materiály v otevřeném předmětu.
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
  useZabalit(() => setOpen(false));
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
                  onClick={() => zaznamenejStazeni(it)}
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
