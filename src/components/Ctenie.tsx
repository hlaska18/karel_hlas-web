"use client";

import { useLang } from "@/lib/i18n";
import { CLANKY } from "@/lib/content";

/**
 * Zajímavé články k digitálním technologiím – pod ukázkovými kartami v úvodu.
 *
 * Design i chování se drží stohu ukázkových karet nad tím: stejná karta, stejný
 * čtverec s ikonou vlevo, stejný štítek vpravo a stejné natočení, které se při
 * najetí myší srovná. `group` je na celé sekci, takže se – jako u stohu –
 * narovnají všechny karty naráz, ne jen ta pod kurzorem.
 *
 * Ve štítku je JAZYK, ne zdroj. U souboru je nejdůležitější, co to je za formát;
 * u článku, jestli ho čtenář vůbec přečte. Zdroj je vedle v podtitulku, kde se
 * smí ořezat – jazyk na pevném místě vpravo se ořezat nemůže.
 *
 * Barevně zůstávají šedé: zelený akcent nesou karty nad nimi a nástroje níž,
 * dvě zvýrazněné sekce vedle sebe by soupeřily o stejnou pozornost.
 *
 * Tři vědomá rozhodnutí, protože rada tuhle rubriku odmítala právě kvůli nim:
 *
 *  - BEZ DAT. Datum je to, co se po třech měsících bez zásahu čte jako
 *    „tady už nikdo nebydlí". Seznam odkazů bez data zestárne mnohem pomaleji.
 *  - CIZÍ ODKAZY, ne vlastní texty. Vlastní články by braly čas přímo
 *    materiálům, kvůli kterým sem učitel chodí.
 *  - Když je seznam prázdný, nevykreslí se nic. Rubrika tedy nikdy nesvítí
 *    prázdná – buď v ní něco je, nebo tam není vůbec.
 *
 * Odkazy vedou ven, proto `target="_blank"`: návštěvník o rozečtenou stránku
 * s materiály nepřijde.
 */

/** Šířka značky zdroje ve čtverci 44 px. Výška se dopočítá z poměru stran. */
const SIRKA_LOGA = 28;

/**
 * Kolik článků se ukáže. Rubrika je KOLOTOČ, ne archiv: ráno přibydou nové
 * a stejný počet nejstarších vypadne, takže jich na webu nikdy není víc.
 *
 * Strop je tady v komponentě schválně, i když ranní rutina pole `CLANKY`
 * zároveň zkracuje. Kdyby rutina jednou selhala nebo Karel přidal článek
 * ručně, seznam by se natáhl a sekce by přerostla sloupec vedle nadpisu.
 * Takhle je nejhorší možný následek pár řádků navíc v souboru, ne rozbitý web.
 */
const KOLIK_CLANKU = 5;

/** Natočení karet – volnější obdoba stohu výš, ať nevznikne pravidelný vzor. */
const NATOCENI = [
  "-rotate-[3deg] translate-x-0",
  "rotate-[2deg] translate-x-5",
  "-rotate-[1.5deg] translate-x-2",
  "rotate-[3deg] translate-x-6",
  "-rotate-[2deg] translate-x-1",
];

export function Ctenie() {
  const { tr, lang } = useLang();

  // Nejnovější jsou v `CLANKY` nahoře, takže se ořezává odspodu.
  const clanky = CLANKY.slice(0, KOLIK_CLANKU);

  if (clanky.length === 0) return null;

  return (
    <section aria-labelledby="ctenie-nadpis" className="group">
      <p
        id="ctenie-nadpis"
        className="mb-3 pl-1 text-xs font-medium uppercase tracking-widest text-zinc-600 dark:text-zinc-400"
      >
        {tr.hero.reading}
      </p>

      <ul className="space-y-2">
        {clanky.map((c, i) => {
          // Zdroj · co po kliknutí čeká. Jazyk sem nepatří: řádek se ořezává,
          // takže by u delších poznámek zmizel právě on.
          const podtitulek = [c.source, c.pozor?.[lang]].filter(Boolean).join(" · ");

          return (
            <li key={c.url}>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                /* Dvě úrovně: najetí kamkoli do sekce srovná všechny karty
                   (`group` na sekci), karta pod kurzorem se navíc rozsvítí
                   smaragdovým okrajem a září – stejné gesto jako tlačítko
                   „Procházet materiály" a pilulky v hlavičce. Vlastní jméno
                   skupiny `karta`, aby si obě úrovně nelezly do zelí.
                   `dark:hover:` je nutné, jinak `dark:border-*` hover přebije. */
                className={`glass group/karta flex items-center gap-3 rounded-karta p-2.5 transition duration-300 hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-600/30 group-hover:rotate-0 group-hover:translate-x-0 dark:hover:border-accent-500/40 ${NATOCENI[i % NATOCENI.length]}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ovladac bg-black/[0.04] transition duration-300 group-hover/karta:bg-accent-500/15 dark:bg-white/5 dark:group-hover/karta:bg-accent-500/20">
                  {/* Značka zdroje jako maska, ne obrázek: barvu tak řídí styl
                      (šedá → zelená po najetí) a stačí jeden soubor. Šířka je
                      pevná, výška dopočtená z poměru – jinak by se široký nápis
                      InfoQ vtěsnal do čtverce a scvrkl se na šmouhu. */}
                  <span
                    aria-hidden
                    className="block bg-zinc-500 transition duration-300 group-hover/karta:bg-accent-700 dark:bg-zinc-400 dark:group-hover/karta:bg-accent-300"
                    style={{
                      width: SIRKA_LOGA,
                      height: Math.round(SIRKA_LOGA / c.logo.pomer),
                      WebkitMaskImage: `url(${c.logo.src})`,
                      maskImage: `url(${c.logo.src})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  {/* Bez `block`: line-clamp potřebuje display:-webkit-box a `block` by ho přebil. */}
                  <span className="line-clamp-2 text-sm font-semibold leading-snug">
                    {c.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {podtitulek}
                  </span>
                </span>
                <span
                  title={
                      // Bublina se řídí jazykem WEBU, ne jazykem článku –
                      // anglickému návštěvníkovi nemá co vysvětlovat česky.
                      lang === "cs"
                        ? c.jazyk === "cs" ? "Článek je česky" : "Článek je anglicky"
                        : c.jazyk === "cs" ? "The article is in Czech" : "The article is in English"
                    }
                  className="shrink-0 rounded-stitek bg-black/[0.05] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-600 transition duration-300 group-hover/karta:bg-accent-500/15 group-hover/karta:text-accent-700 dark:text-accent-400 dark:bg-white/10 dark:text-zinc-400 dark:group-hover/karta:text-accent-300">
                  {c.jazyk === "cs" ? "cz" : "en"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
