import fs from "fs";
import path from "path";
import { COURSES } from "@/lib/content";
import type { Material, Audience } from "@/lib/content";

/**
 * Načte materiály ze složek public/materialy/<kurz>/<čísloTématu>/…
 *  - soubor přímo ve složce tématu  → jednotlivý odkaz
 *  - PODSLOŽKA ve složce tématu      → rozbalovací skupina (název = název složky)
 * Běží při buildu na serveru (po pushnutí nových souborů Vercel přebuilduje).
 */

const ROOT = path.join(process.cwd(), "public", "materialy");

function kindFromExt(ext: string): Material["kind"] {
  const e = ext.toLowerCase();
  if ([".ppt", ".pptx", ".odp", ".key"].includes(e)) return "slides";
  if ([".mp4", ".mov", ".webm", ".m4v", ".avi"].includes(e)) return "video";
  if (
    [".py", ".js", ".ts", ".tsx", ".ipynb", ".html", ".css", ".json", ".java", ".c", ".cpp", ".sql"].includes(e)
  )
    return "code";
  if (
    [".pdf", ".doc", ".docx", ".odt", ".txt", ".rtf", ".xls", ".xlsx", ".xlsm", ".csv", ".accdb", ".pbix"].includes(e)
  )
    return "doc";
  return "link";
}

function isHidden(name: string): boolean {
  return name.startsWith(".") || /^_tema|^_autor|^readme/i.test(name);
}

/** Učitelská podsložka – její obsah se ukáže jen v učitelském pohledu. Konvence: „_ucitel". */
function isTeacherDir(name: string): boolean {
  return /^_?(u[čc]itel|pro[ _]u[čc]itel)/i.test(name);
}

/** Žákovská podsložka – odznak „žáci". Konvence: „_zaci" nebo „Pro žáky". */
function isStudentDir(name: string): boolean {
  return /^_(zaci|zaky|žáci|žáky|zak|student)|^pro[ _](žák|zak|student)/i.test(name);
}

/**
 * Zobrazovaný název. Řadicí prefix „1. " / „2) " na začátku se NEzobrazí
 * (slouží jen k pořadí). Podtržítka → mezery. Vnitřní čísla úloh („01_…",
 * „PracL01…") zůstávají, protože nemají tečku/závorku za číslem.
 */
function displayName(name: string): string {
  return name
    .replace(/^\d+[.)]\s+/, "")
    .replace(/_/g, " ")
    .replace(/ - /g, " – ") // spojovník jako oddělovač → česká pomlčka (jen zobrazení, cesta zůstává)
    .trim();
}

function cleanLabel(file: string): string {
  const ext = path.extname(file);
  return displayName(file.slice(0, file.length - ext.length)) || file;
}

/**
 * Anglické názvy viditelných materiálů/složek (klíč = český zobrazovaný název).
 * Soubory zůstávají pojmenované česky; když název v tabulce není, použije se čeština.
 * Nový materiál → sem doplnit anglický název (jinak se v EN zobrazí česky).
 */
const NAME_EN: Record<string, string> = {
  "Úlohy v Excelu": "Excel exercises",
  "Úlohy ve Wordu": "Word exercises",
  "Excel – materiály k úlohám": "Excel – exercise materials",
  "Word – materiály k úlohám": "Word – exercise materials",
  "Návod na stažení Microsoft 365 aplikací": "How to install Microsoft 365 apps",
  PowerBI: "Power BI",
  "Pracovní listy": "Worksheets",
  "Plány hodin": "Lesson plans",
  "Python – pracovní a metodické listy": "Python worksheets & teaching notes",
  "Python – testy z minulých let": "Python past tests",
  "Python – řešení testů": "Python test solutions",
  "Řešení 1 – věk": "Solution 1 – age",
  "Řešení 2A – vlajka Lotyšska": "Solution 2A – flag of Latvia",
  "Řešení 2B – vlajka Finska": "Solution 2B – flag of Finland",
  // Téma 8 je rozdělené na složky v pořadí výuky (číslo v cestě, ne v popisku).
  "Úvod do databází": "Introduction to databases",
  "Kurz SQL v prohlížeči": "SQL course in the browser",
  "Vlastní databáze v DB Browseru": "Your own database in DB Browser",
  "Databáze knihovny": "The library database",
  "Jak toto téma učit": "How to teach this topic",
  "Plán hodin – Kurz SQL": "Lesson plans – SQL course",
  "Pracovní list – SQL": "SQL worksheet",
  "Řešení – pracovní list": "Worksheet solutions",
  "Návod – DB Browser": "DB Browser guide",
  "Úlohy – DB Browser": "DB Browser exercises",
  "Řešení – úlohy": "Exercise solutions",
  knihovna: "Library",
  "Žákovský list": "Student worksheet",
  Metodika: "Teaching notes",
  "Plán hodiny": "Lesson plan",
  // Digitální gramotnost – jednotlivé hodiny a jejich plány
  "Kybernetická bezpečnost": "Cybersecurity",
  "Kybernetická bezpečnost – plán hodiny": "Cybersecurity – lesson plan",
  "Operační systém": "Operating system",
  "Operační systém – plán hodiny": "Operating system – lesson plan",
  "Počítačové sítě": "Computer networks",
  "Počítačové sítě – plán hodiny": "Computer networks – lesson plan",
  "Příkazový řádek": "Command line",
  "Příkazový řádek – plán hodiny": "Command line – lesson plan",
  "Řešení – Digitální gramotnost": "Solutions – Digital literacy",
  // Internet, bezpečnost a práce s informacemi (10 hodin)
  "Prezentace k hodinám": "Lesson presentations",
  "Pro žáky": "For students",
  "Začni zde": "Start here",
  "Podklady k aktivitám": "Activity materials",
  "Digitální pracovní sešit": "Digital workbook",
  "Plány hodin a metodika": "Lesson plans & teaching notes",
  "Testy A a B": "Tests A and B",
  "Klíč k testům A a B": "Answer key for tests A and B",
  "Bezpečné chování na internetu": "Safe behaviour online",
  "Hesla a dvoufaktorové ověření": "Passwords and two-factor authentication",
  "Kybernetické hrozby a phishing": "Cyber threats and phishing",
  "Šifrování, HTTPS, hash a zálohy": "Encryption, HTTPS, hashing and backups",
  "Efektivní vyhledávání": "Effective searching",
  "Ověřování zdrojů metodou 5P": "Verifying sources with the 5P method",
  "Fake news a obsah od AI": "Fake news and AI-generated content",
  "Sociální sítě a digitální stopa": "Social networks and digital footprint",
  "Soukromí, GDPR a autorská práva": "Privacy, GDPR and copyright",
  "Závěrečná bezpečnostní výzva": "Final security challenge",
  "Rizikové situace": "Risky situations",
  "Účty a faktory ověření": "Accounts and authentication factors",
  "Podezřelá schránka": "Suspicious inbox",
  "Zdroje k metodě 5P": "Sources for the 5P method",
  "Neověřený příspěvek": "Unverified post",
  "Profil Alex": "Alex's profile",
  "Incident mediálního klubu": "Media club incident",
  "Kontrola integrity – projekt A": "Integrity check – project A",
  "Kontrola integrity – projekt B": "Integrity check – project B",
  "Vyhledávací výzva": "Search challenge",
  "Díla a licence": "Works and licences",
  // Počítačová grafika a práce s multimédii (8 hodin)
  "Kontrola úplnosti": "Package completeness check",
  "Začni tady": "Start here",
  "Laboratoř grafiky": "Graphics lab",
  "Formáty a komprese": "Formats and compression",
  "Rastr a vektor": "Raster and vector",
  "Parametry médií": "Media parameters",
  "Úprava obrázku v GIMPu": "Editing an image in GIMP",
  "Vektor v Inkscapu": "Vectors in Inkscape",
  "Zvuk a video": "Audio and video",
  "Infografika v Canvě": "Infographics in Canva",
  "Závěrečný výstup": "Final piece",
  "Rastrová a vektorová grafika": "Raster and vector graphics",
  "Rozlišení, barvy a barevná hloubka": "Resolution, colour and colour depth",
  "Formáty obrázků a komprese": "Image formats and compression",
  "Úprava fotografie v GIMPu": "Editing a photo in GIMP",
  "Vektorová značka v Inkscapu": "A vector mark in Inkscape",
  "Infografika a prezentace": "Infographics and presentations",
  "Závěrečný výstup a obhajoba": "Final piece and defence",
  // Umělá inteligence a odpovědné používání (6 hodin, rámec AI Fluency)
  "Zdroje AI Fluency": "AI Fluency resources",
  "Doporučené čtení": "Recommended reading",
  "101 tipů, jak využít AI ve výuce": "101 tips for using AI in teaching (in Czech)",
  "Cvičné soubory i řešení úloh": "Practice files & solutions",
  "Licence a zdroj": "Licence and source",
  "Hodnocení, testy a řešení": "Assessment, tests and solutions",
  "Offline záloha hodin 4-6": "Offline backup for lessons 4–6",
  "Přenesení hodin na jiný AI nástroj": "Moving the lessons to another AI tool",
  "Kontrola úplnosti balíčku": "Package completeness check",
  "Laboratoř fungování AI": "How AI works – lab",
  "Trénovací data": "Training data",
  "Tokeny a predikce": "Tokens and prediction",
  "Odpovědi k ověření": "Answers to verify",
  "Delegační situace": "Delegation situations",
  "Promptová dílna": "Prompt workshop",
  "Výstup k opravě": "Output to correct",
  "Výstupy k posouzení": "Outputs to assess",
  "Zdrojový balíček – rekuperace": "Source pack – heat recovery",
  "Etické a právní situace": "Ethical and legal situations",
  "Závěrečná výzva": "Final challenge",
  "Základy AI a učení z dat": "AI basics and learning from data",
  "Jak jazykový model tvoří odpověď": "How a language model builds an answer",
  "Proč AI chybuje a jak ověřovat": "Why AI makes mistakes and how to verify",
  "Delegation a Description": "Delegation and Description",
  "Spolupráce s Copilotem a Discernment": "Working with Copilot and Discernment",
  "Diligence a závěrečná výzva": "Diligence and the final challenge",
};

/** Anglický popisek z tabulky (NFC kvůli macOS NFD názvům); fallback = čeština. */
function enLabel(cs: string): string {
  return NAME_EN[cs.normalize("NFC")] ?? cs;
}

const byName = (a: string, b: string) => a.localeCompare(b, "cs", { numeric: true });

/* ─────────────────────────── BANKA MATERIÁLŮ ───────────────────────────
 * Plochý seznam VŠECH souborů napříč kurzy/tématy + metadata (kurz, téma,
 * typ, velikost, publikum). Slouží stránce /pro-ucitele (vyhledávání + filtry).
 * Běží při buildu na serveru (čte filesystem). */

/** Pořadí dlaždic v galerii (dle pořadí témat ve výuce). */
export const TOOL_ORDER = [
  "Digitální gramotnost",
  "Word",
  "Excel",
  "Python",
  "Grafika a multimédia",
  "Internet a bezpečnost",
  "Umělá inteligence",
  "Databáze",
  "Power BI",
  "Ostatní",
];

export type BankItem = {
  href: string;
  label: { cs: string; en: string };
  /** Přípona bez tečky, malými písmeny (např. "docx"). */
  ext: string;
  kind: Material["kind"];
  sizeBytes: number;
  /** Nástroj/dovednost = dlaždice galerie (Excel, Word, Python, Power BI…). */
  tool: string;
  /** Číslo lekce z názvu (PracL01→1, MetodL07→7); pro párování do balíčků lekcí. */
  lessonNo?: number;
  /** Pořadové číslo tématu (1-based) reprezentativního výskytu. */
  topicNo: number;
  /** Název tématu z plánu (COURSES); fallback „Téma N". */
  topicLabel: { cs: string; en: string };
  /**
   * „teacher" = metodika/plány (složka „Pro učitele"), „student" = složka
   * „Pro žáky", „both" = neurčeno (většina materiálů). Odznak v bance se
   * ukazuje jen u prvních dvou – označuje výjimku, ne výchozí stav.
   */
  audience: Audience;
  /** Název podsložky, pokud soubor leží ve skupině. */
  group?: { cs: string; en: string };
  /**
   * Název složky tak, jak je na disku – včetně číselné předpony („3. Práce…“).
   * Popisek ji zahazuje (v UI by rušila), ale řazení ji potřebuje: bez ní by
   * složky jedné lekce vyšly abecedně, ne v pořadí, ve kterém se učí.
   */
  groupSort?: string;
  /** Autor celé skupiny ze souboru `_autor.txt` (např. převzatá cvičebnice). */
  groupAuthor?: string;
  /**
   * Vlastní vysvětlivka u převzatého odkazu (z `note` v `_zdroj.json`).
   * Nahradí obecné „Převzatý materiál – otevři u zdroje“ tam, kde je potřeba
   * říct něco konkrétnějšího – třeba že učebnice bez cvičných souborů nefunguje.
   */
  sourceNote?: { cs: string; en: string };
  /** Pořadí odkazu uvnitř `_zdroj.json` – učebnice má stát před cvičnými soubory. */
  sourceOrder?: number;
  /** Obory 1. ročníku, kde se materiál vyskytuje (po sloučení duplicit). */
  courseIds: string[];
  /** Lidsky čitelný rozsah oborů, např. „1. ročník · všechny obory". */
  coursesLabel: { cs: string; en: string };
  /**
   * Externí zdroj: převzatý materiál se NEhostuje, jen se odkazuje na originál
   * (autorská práva). `href` je pak externí URL, `ext="link"`. Vzniká z
   * `_zdroj.json` ve složce skupiny místo souborů.
   */
  external?: boolean;
};

// Obsah je napříč obory sdílený, ale jednotlivé obory mají v plánu různě
// úplné názvy témat. Pro banku bereme názvy z NEJÚPLNĚJŠÍHO plánu (1L), ať je
// kategorizace i popisek konzistentní u všech oborů (jinak se duplicity neslučí).
const TOPIC_SOURCE = [...COURSES].sort((a, b) => b.items.length - a.items.length)[0];

/**
 * Názvy témat, která nejsou v žádném plánu ročníku (`COURSES`). Slouží pro
 * ucelené balíčky, které se do plánu nevejdou nebo se učí napříč obory –
 * bez nich by se v bance zobrazilo jen „Téma 10". Klíč = číslo složky.
 */
/**
 * Ruční názvy témat. Mají PŘEDNOST před plánem: číslo složky je jen pořadí
 * v plánu 1L, takže téma 9 (Power BI) by se jinak jmenovalo „Časová rezerva
 * a opakování" – což je název devátého bodu plánu, ne toho, co ve složce je.
 */
const TOPIC_EXTRA: Record<number, { cs: string; en: string }> = {
  9: {
    cs: "Data a jejich vizualizace",
    en: "Data and its visualisation",
  },
  10: {
    cs: "Umělá inteligence a odpovědné používání",
    en: "Artificial intelligence and responsible use",
  },
};

function topicLabelOf(topicIndex: number): { cs: string; en: string } {
  const rucni = TOPIC_EXTRA[topicIndex + 1];
  if (rucni) return rucni;
  const item = TOPIC_SOURCE?.items[topicIndex] ?? COURSES.map((c) => c.items[topicIndex]).find(Boolean);
  if (item) return { cs: item.title.cs, en: item.title.en };
  return { cs: `Téma ${topicIndex + 1}`, en: `Topic ${topicIndex + 1}` };
}

/**
 * Dlaždice galerie podle OBSAHU (ne podle přípony): klíčová slova ve skupině,
 * tématu a názvu souboru. Pořadí pravidel je důležité (Databáze před Excelem
 * kvůli PowerQuery/Accessu).
 */
function toolOf(hay: string, ext: string): string {
  const h = hay.toLowerCase();
  if (/internet, bezpečnost|internet a bezpe/.test(h)) return "Internet a bezpečnost";
  if (/umělá inteligence|ai fluency|práce s ai/.test(h)) return "Umělá inteligence";
  if (/power\s?bi/.test(h) || ext === "pbix") return "Power BI";
  if (/databáz|databaz|powerquery|access/.test(h) || ext === "accdb") return "Databáze";
  // Nad Excelem schválně: obě tabulky grafiky jsou .csv, takže by je jinak
  // pohltilo pravidlo pro Excel (ověřeno – přesně to se dělo).
  if (/grafik|multimédi|multimedi|rastr|vektor/.test(h)) return "Grafika a multimédia";
  if (/excel|tabulkov/.test(h) || ["xlsx", "xlsm", "xls", "csv"].includes(ext)) return "Excel";
  if (/word|textov[ýy] procesor/.test(h)) return "Word";
  if (/python|programován|algoritm/.test(h) || ["py", "ipynb"].includes(ext)) return "Python";
  if (/digit[áa]ln[íi] gramotnost|[úu]vod do informatiky/.test(h)) return "Digitální gramotnost";
  return "Ostatní";
}

/** Číslo lekce z názvu souboru: „PracL01…"→1, „MetodL00…"→0, „1. …"→1. */
function lessonNoOf(file: string): number | undefined {
  const m = file.match(/(?:^|[a-zA-Z])0*(\d+)/);
  return m ? parseInt(m[1], 10) : undefined;
}

function coursesLabelOf(courseIds: string[], total: number): { cs: string; en: string } {
  if (total > 0 && courseIds.length >= total) {
    return { cs: "1. ročník · všechny obory", en: "Year 1 · all fields" };
  }
  const cs = courseIds.map((id) => COURSES.find((c) => c.id === id)?.field.cs ?? id).join(", ");
  const en = courseIds.map((id) => COURSES.find((c) => c.id === id)?.field.en ?? id).join(", ");
  return { cs: `1. ročník · ${cs}`, en: `Year 1 · ${en}` };
}

export function getBankItems(): BankItem[] {
  // Sloučení duplicit napříč obory (1L/1S/1P): klíč = nástroj+skupina+název+typ,
  // NE číslo tématu (Excel je v 1L téma 4, v 1S/1P téma 3). Soubory jsou
  // ve sdílených složkách byte-shodné, takže reprezentant = první výskyt.
  const seen = new Map<string, BankItem>();

  let courseDirs: string[];
  try {
    courseDirs = fs
      .readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort(); // 1L první = reprezentant po sloučení (má kompletní plán)
  } catch (err) {
    // Chybějící složka je legitimní stav (zatím nejsou materiály); cokoli jiného
    // (práva, poškozený FS) je ale chyba, kterou chceme vidět v build logu.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`[materials] Nepodařilo se přečíst složku materiálů (${ROOT}):`, err);
    }
    return [];
  }
  const totalCourses = courseDirs.length;

  for (const courseId of courseDirs) {
    const courseDir = path.join(ROOT, courseId);
    let topicDirs: string[];
    try {
      topicDirs = fs
        .readdirSync(courseDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch (err) {
      console.warn(`[materials] Nepodařilo se přečíst složku kurzu ${courseDir}:`, err);
      continue;
    }

    for (const topicDir of topicDirs) {
      const m = topicDir.match(/^(\d+)/);
      if (!m) continue;
      const topicIndex = parseInt(m[1], 10) - 1;
      if (topicIndex < 0) continue;

      const topicLabel = topicLabelOf(topicIndex);

      // Rekurzivně projde téma; sleduje publikum (_ucitel → teacher) a skupinu.
      const walk = (
        absDir: string,
        segs: string[],
        audience: Audience,
        group?: { cs: string; en: string },
        groupAuthor?: string,
        groupSort?: string,
      ) => {
        let ents: fs.Dirent[] = [];
        try {
          ents = fs.readdirSync(absDir, { withFileTypes: true }).filter((x) => !isHidden(x.name));
        } catch (err) {
          console.warn(`[materials] Nepodařilo se přečíst složku ${absDir}:`, err);
          return;
        }
        ents.sort((a, b) => byName(a.name, b.name));
        for (const e of ents) {
          if (e.isDirectory()) {
            let aud = audience;
            let grp = group;
            let grpSort = groupSort;
            if (isTeacherDir(e.name)) aud = "teacher";
            else if (isStudentDir(e.name)) aud = "student";
            else {
              const gl = displayName(e.name);
              grp = { cs: gl, en: enLabel(gl) };
              grpSort = e.name;
            }
            // `_autor.txt` ve složce = autor celé skupiny (dědí se dovnitř)
            let author = groupAuthor;
            try {
              const a = fs.readFileSync(path.join(absDir, e.name, "_autor.txt"), "utf8").trim();
              if (a) author = a;
            } catch {
              /* složka autora nemá – dědíme z nadřazené */
            }
            walk(path.join(absDir, e.name), [...segs, e.name], aud, grp, author, grpSort);
          } else if (e.isFile() && e.name === "_zdroj.json") {
            // Převzatá skupina: místo souborů jen odkaz na originál (autorská práva).
            // Smí být jeden odkaz, nebo pole – učebnice a cvičné soubory k ní
            // patří k sobě a mají být vidět jako dvě položky v jedné složce.
            type Zdroj = { cs?: string; en?: string; url?: string; note?: { cs: string; en: string } };
            let parsed: Zdroj | Zdroj[];
            try {
              parsed = JSON.parse(fs.readFileSync(path.join(absDir, e.name), "utf8"));
            } catch (err) {
              // Poškozený _zdroj.json by jinak tiše zahodil odkaz na materiál.
              console.warn(`[materials] Neplatný _zdroj.json v ${absDir}:`, err);
              continue;
            }
            const zdroje = Array.isArray(parsed) ? parsed : [parsed];
            for (const [poradi, src] of zdroje.entries()) {
              // URL je volitelná: bez ní je to jen informační atribuce (materiál
              // třetí strany, který tu nehostujeme ani neodkazujeme).
              if (!src.cs) continue;
              const tool = toolOf(`${group?.cs ?? ""} ${topicLabel.cs} ${src.cs}`, "");
              const key = [tool, audience, group?.cs ?? "", "__zdroj__", src.cs, "link"]
                .join("|")
                .normalize("NFC")
                .toLowerCase();
              const existing = seen.get(key);
              if (existing) {
                if (!existing.courseIds.includes(courseId)) existing.courseIds.push(courseId);
                continue;
              }
              seen.set(key, {
                href: src.url ?? "",
                label: { cs: src.cs, en: src.en ?? src.cs },
                ext: "link",
                kind: "link",
                sizeBytes: 0,
                tool,
                topicNo: topicIndex + 1,
                topicLabel,
                audience,
                group,
                groupAuthor,
                groupSort,
                external: true,
                sourceNote: src.note,
                sourceOrder: poradi,
                courseIds: [courseId],
                coursesLabel: { cs: "", en: "" },
              });
            }
          } else if (e.isFile()) {
            const file = e.name;
            const ext = path.extname(file).slice(1).toLowerCase();
            const label = cleanLabel(file);
            const tool = toolOf(`${group?.cs ?? ""} ${topicLabel.cs} ${label}`, ext);
            const key = [tool, audience, group?.cs ?? "", label, ext]
              .join("|")
              .normalize("NFC")
              .toLowerCase();

            const existing = seen.get(key);
            if (existing) {
              if (!existing.courseIds.includes(courseId)) existing.courseIds.push(courseId);
              continue;
            }

            const parts = [courseId, ...segs, file].map((s) => encodeURIComponent(s));
            let sizeBytes = 0;
            try {
              sizeBytes = fs.statSync(path.join(absDir, file)).size;
            } catch (err) {
              console.warn(`[materials] Nepodařilo se zjistit velikost souboru ${file}:`, err);
            }
            seen.set(key, {
              href: "/materialy/" + parts.join("/"),
              label: { cs: label, en: enLabel(label) },
              ext,
              kind: kindFromExt(path.extname(file)),
              sizeBytes,
              tool,
              lessonNo: lessonNoOf(file),
              topicNo: topicIndex + 1,
              topicLabel,
              audience,
              group,
              groupAuthor,
              groupSort,
              courseIds: [courseId],
              coursesLabel: { cs: "", en: "" },
            });
          }
        }
      };

      walk(path.join(courseDir, topicDir), [topicDir], "both");
    }
  }

  const items = [...seen.values()];
  for (const it of items) it.coursesLabel = coursesLabelOf(it.courseIds, totalCourses);

  const order = (t: string) => {
    const i = TOOL_ORDER.indexOf(t);
    return i < 0 ? 99 : i;
  };
  items.sort(
    (a, b) =>
      order(a.tool) - order(b.tool) ||
      a.audience.localeCompare(b.audience) ||
      a.topicNo - b.topicNo ||
      // soubory ze stejné složky (skupiny) drží u sebe, až pak podle názvu
      byName(a.groupSort ?? a.group?.cs ?? "", b.groupSort ?? b.group?.cs ?? "") ||
      (a.sourceOrder ?? 0) - (b.sourceOrder ?? 0) ||
      byName(a.label.cs, b.label.cs),
  );
  return items;
}

/** Počty materiálů na obor (dlaždice) + zda obor má i učitelskou část (metodika). */
export function getBankToolCounts(): { tool: string; count: number; hasTeacher: boolean }[] {
  const counts = new Map<string, number>();
  const teacher = new Map<string, boolean>();
  for (const it of getBankItems()) {
    counts.set(it.tool, (counts.get(it.tool) ?? 0) + 1);
    // „učitelská část" = metodika / plán / řešení (i když je řešení viditelné všem)
    const g = (it.group?.cs ?? "").normalize("NFC").toLowerCase();
    if (it.audience === "teacher" || /řešen|metod|pl[áa]n/.test(g)) teacher.set(it.tool, true);
  }
  return TOOL_ORDER.filter((t) => counts.has(t)).map((t) => ({
    tool: t,
    count: counts.get(t)!,
    hasTeacher: teacher.get(t) ?? false,
  }));
}
