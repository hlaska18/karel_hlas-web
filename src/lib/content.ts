export type Lang = "cs" | "en";

export const SITE = {
  name: "Karel Hlas",
  fullName: "Mgr. Karel Hlas",
  initials: "KH",
  // Web zatím běží zdarma na Vercelu. Až koupíš doménu karelhlas.xyz,
  // vrať tyto dvě hodnoty na "karelhlas.xyz" a přidej doménu ve Vercelu.
  domain: "karelhlas.vercel.app",
  url: "https://karelhlas.vercel.app",
  email: "hlas@sps-tabor.cz",
  emailPersonal: "hlaska18@gmail.com",
  phoneDisplay: "381 500 025",
  phoneHref: "+420381500025",
  cabinet: "A252",
  address: "Komenského 1670, 390 41 Tábor",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "Střední průmyslová škola strojní a stavební Tábor, Komenského 1670, Tábor",
    ),
  eduPageUrl: "https://sps-tabor.edupage.org/",
  photo: "/images/karel.jpg",
};

export type Social = {
  network: "instagram" | "youtube";
  handle: string;
  href: string;
};

/**
 * Čtení k digitálním technologiím – odkazy v úvodní sekci (komponenta `Ctenie`).
 *
 * Schválně BEZ DATA: seznam odkazů bez data zestárne pomaleji než rubrika,
 * u které je vidět, že poslední přírůstek je z května. Když je pole prázdné,
 * sekce se vůbec nevykreslí – nikdy tedy nesvítí prázdná.
 *
 * Nový odkaz = jeden řádek sem. STROP JSOU ČTYŘI POLOŽKY (viz `KOLIK_CLANKU`
 * v `Ctenie.tsx`); delší seznam v úvodu přebíjí tlačítko k materiálům.
 * Když přibude pátý, vyhoď nejstarší.
 *
 * `jazyk` se ukazuje jen tomu, komu je cizí – Čech vidí u anglických textů
 * „anglicky", Angličan u českých „in Czech".
 *
 * `pozor` říká, co člověka po kliknutí čeká (přihlášení, předplatné, limit).
 * Stejná konvence jako u nástrojů v sekci „Nejen do informatiky" a u převzatých
 * odkazů v bance (`note` v `_zdroj.json`). Úvod tuhle podmínku schválně
 * neslibuje paušálně: moje vlastní soubory přihlášení nechtějí, ale cizí kurz
 * nebo cvičebnice ano, a to patří k té konkrétní položce – ať to člověk ví
 * dřív, než na odkaz klikne, a ne až po něm.
 */
export type Clanek = {
  title: string;
  source: string;
  url: string;
  /** Jazyk článku. Ukazuje se jako štítek vpravo – protějšek přípony
   *  u ukázkových karet. Čtenář tak na první pohled pozná, do čeho jde. */
  jazyk: Lang;
  pozor?: { cs: string; en: string };
  /**
   * Značka zdroje jako jednobarevná silueta v `public/images/clanky/`.
   * Používá se jako CSS maska, ne jako obrázek – barvu tak určuje styl
   * (šedá, po najetí zelená) a stačí jeden soubor místo dvou.
   * `pomer` je šířka/výška ořezané značky; bez něj by se široký nápis
   * (InfoQ 3,23) vtěsnal do čtverce a scvrkl se na nečitelnou šmouhu.
   */
  logo: { src: string; pomer: number };
};

/**
 * Rubrika je KOLOTOČ, ne archiv – ukazují se jen čtyři nejnovější (viz
 * `KOLIK_CLANKU` v `Ctenie.tsx`) a ranní rutina sem nové přidává NAHORU
 * a stejný počet nejstarších maže.
 *
 * Značky zdrojů v `public/images/clanky/` se přitom NEMAŽOU s článkem.
 * Wired, HN nebo InfoQ se v rubrice střídají dokola, takže je to zásobník,
 * ne mrtvý soubor – stahovat je pokaždé znovu by byla zbytečná práce.
 */
export const CLANKY: Clanek[] = [
  {
    title: "AI Literacy: A Framework to Understand, Evaluate, and Use Emerging Technology",
    source: "Digital Promise",
    url: "https://digitalpromise.org/2024/06/18/ai-literacy-a-framework-to-understand-evaluate-and-use-emerging-technology/",
    logo: { src: "/images/clanky/digitalpromise.png", pomer: 2.813 },
    jazyk: "en",
  },
  {
    title: "The Anthropic AI Course Schools Should Be Teaching",
    source: "Lifewire",
    url: "https://www.lifewire.com/anthropic-free-ai-fluency-course-11757129",
    logo: { src: "/images/clanky/lifewire.png", pomer: 4.267 },
    jazyk: "en",
  },
  {
    title: "An Open Letter to TikTok and YouTube to Join Us in Supporting Teens",
    source: "Meta Newsroom",
    url: "https://about.fb.com/news/2026/08/open-letter-to-tiktok-and-youtube-to-join-us-in-supporting-teens/",
    logo: { src: "/images/clanky/meta.png", pomer: 1.506 },
    jazyk: "en",
  },
  {
    title: "20 výzev a 10 myšlenek pro školní rok 2026/2027",
    source: "RVP.cz",
    url: "https://clanky.rvp.cz/clanek/24473/20-VYZEV-A-10-MYSLENEK-NEJEN-PRO-SKOLNI-ROK-2026-2027.html",
    logo: { src: "/images/clanky/rvp.png", pomer: 1.842 },
    jazyk: "cs",
  },
];

export const SOCIALS: Social[] = [
  { network: "youtube", handle: "@karelhlas", href: "https://www.youtube.com/@karelhlas" },
  { network: "instagram", handle: "@karelbowls", href: "https://instagram.com/karelbowls" },
  { network: "instagram", handle: "@viewsbykarel", href: "https://instagram.com/viewsbykarel" },
];

/**
 * Certifikáty / odznaky (sekce O mně). `circle: true` = kruhový odznak,
 * který se ořízne do kruhu (skryje plné rohové pozadí). Nový odznak: vlož
 * obrázek do public/images/badges/ a přidej sem řádek.
 */
export type Badge = { src: string; alt: string; circle?: boolean; href?: string };

export const BADGES: Badge[] = [
  {
    src: "/images/badges/anthropic-claude-code-101.png",
    alt: "Anthropic: Claude Code 101",
    href: "https://verify.skilljar.com/c/wi2fekyfwr83",
  },
  {
    src: "/images/badges/anthropic-claude-platform-101.png",
    alt: "Anthropic: Claude Platform 101",
    href: "https://verify.skilljar.com/c/wsj95ri2n3ut",
  },
  {
    src: "/images/badges/anthropic-teaching-ai-fluency.png",
    alt: "Anthropic: Teaching AI Fluency",
    href: "https://verify.skilljar.com/c/v7uvcqdjfgm9",
  },
  {
    src: "/images/badges/ai-skills-for-students.png",
    alt: "Canva: AI skills for students",
    href: "https://www.canva.com/design-school/courses/ai-skills-for-students-course",
  },
  {
    src: "/images/badges/ai-ve-vyuce.png",
    alt: "Microsoft: Úvod do konceptů AI",
    href: "https://learn.microsoft.com/cs-cz/training/modules/get-started-ai-fundamentals/",
  },
  {
    src: "/images/badges/ai-kniha.png",
    alt: "Microsoft: Umožnit vyučujícím prozkoumat potenciál umělé inteligence",
    href: "https://learn.microsoft.com/cs-cz/training/modules/empower-educators-explore-potential-artificial-intelligence/",
  },
  {
    src: "/images/badges/copilot.png",
    alt: "Microsoft: Návrh cíle snů pomocí Microsoft Copilotu",
    href: "https://learn.microsoft.com/cs-cz/training/modules/design-dream-destination-ai-copilot/",
  },
  {
    src: "/images/badges/copilot-vyuka.png",
    alt: "Microsoft: Vylepšení výuky a učení pomocí Microsoft 365 Copilot Chat",
    href: "https://learn.microsoft.com/cs-cz/training/modules/enhance-teaching-learning-microsoft-copilot/",
  },
  {
    src: "/images/badges/kyberbezpecnost.png",
    alt: "Microsoft: Build cybersecurity resilience in K-12 classrooms with Microsoft tools",
    href: "https://learn.microsoft.com/cs-cz/training/modules/build-cybersecurity-resilience-k-12-classrooms-microsoft-tools/",
  },
  {
    src: "/images/badges/accessibility.png",
    alt: "Microsoft: Umožněte každému studentu inkluzivní učebnu",
    href: "https://learn.microsoft.com/cs-cz/training/modules/empower-every-student-with-inclusive-classroom/",
  },
  {
    src: "/images/badges/accessibility-kontakty.png",
    alt: "Microsoft: Přístupnost – Vytvoření základu inkluzivního učení",
    href: "https://learn.microsoft.com/cs-cz/training/modules/accessibility-build-foundation-inclusive-learning/",
  },
  {
    src: "/images/badges/minecraft.png",
    alt: "Microsoft: Minecraft Trainer Academy",
    href: "https://learn.microsoft.com/cs-cz/training/modules/minecraft-trainer-academy-minecraft-education-classroom/",
  },
  {
    src: "/images/badges/oceneni.png",
    alt: "Microsoft: Build an initial agent with Microsoft Copilot Studio",
    href: "https://learn.microsoft.com/cs-cz/training/modules/create-copilots-copilot-studio/",
  },
  { src: "/images/badges/veo.png", alt: "Coursiv: Master of Veo", href: "/certs/master-of-veo.pdf" },
  {
    src: "/images/badges/perplexity.png",
    alt: "Coursiv: Master of Perplexity",
    href: "/certs/master-of-perplexity.pdf",
  },
  {
    src: "/images/badges/claude.png",
    alt: "Coursiv: Master of Claude",
    href: "/certs/master-of-claude.pdf",
  },
  {
    src: "/images/badges/midjourney.png",
    alt: "Coursiv: Master of Midjourney",
    href: "/certs/master-of-midjourney.pdf",
  },
];

/* ───────────────────────── VÝUKA / ČASOVÁ OSA ─────────────────────────
 * Kurzy (ročníky) s tematickým plánem. Materiály doplňuj postupně do pole
 * `materials` u jednotlivých témat:
 *   { label: { cs: "Název", en: "Title" }, href: "https://...", kind: "doc" }
 * kind: "doc" | "slides" | "video" | "code" | "link"
 * Materiál s href "#" se zobrazí jako „brzy" (zástupný odkaz doplníš později).
 * Další ročník přidáš jako další objekt do pole COURSES.
 * ─────────────────────────────────────────────────────────────────────── */

/** Pro koho je materiál určený (odznak v učitelském pohledu). */
export type Audience = "teacher" | "student" | "both";

export type Material = {
  label: { cs: string; en: string };
  href: string;
  kind?: "doc" | "slides" | "video" | "code" | "link";
  /** Jen pro učitelský pohled (žáci ho nevidí). */
  teacherOnly?: boolean;
  /** Vynutí odznak publika; jinak se odvodí automaticky z názvu. */
  audience?: Audience;
};

/** Skupina materiálů = podsložka (rozbalí se po kliknutí). */
export type MaterialGroup = {
  label: { cs: string; en: string };
  items: Material[];
  /** Jen pro učitelský pohled (žáci ho nevidí). */
  teacherOnly?: boolean;
  /** Vynutí odznak publika; jinak se odvodí automaticky z názvu. */
  audience?: Audience;
};

/** Položka v seznamu materiálů: buď jeden soubor/odkaz, nebo skupina. */
export type MaterialEntry = Material | MaterialGroup;

export type CurriculumItem = {
  month: { cs: string; en: string };
  title: { cs: string; en: string };
  goal: { cs: string; en: string };
  topics: { cs: string[]; en: string[] };
  /** Metodická poznámka / časování – zobrazí se jen v učitelském pohledu. */
  teacherNote?: { cs: string; en: string };
  materials: Material[];
};

export type Course = {
  id: string;
  year: { cs: string; en: string };
  field: { cs: string; en: string };
  schoolYear: string;
  items: CurriculumItem[];
};

export const COURSES: Course[] = [
  {
    id: "1L",
    year: { cs: "1. ročník", en: "Year 1" },
    field: { cs: "Technické lyceum", en: "Technical Lyceum" },
    schoolYear: "2025/2026",
    items: [
      {
        month: { cs: "Září", en: "September" },
        title: {
          cs: "Organizace, bezpečnost a školní informační systémy",
          en: "Organisation, safety & school IT systems",
        },
        goal: {
          cs: "Zorientovat se ve školních systémech a zásadách bezpečné práce.",
          en: "Get oriented in the school systems and safe-working rules.",
        },
        topics: {
          cs: [
            "Organizace výuky, BOZP",
            "Školní informační systém, web školy",
            "Systém pro online výuku a komunikaci",
            "Cloudové disky a přístupy, školní licence",
          ],
          en: [
            "Lesson organisation, health & safety",
            "School information system, school website",
            "Online learning & communication system",
            "Cloud drives & access, school licences",
          ],
        },
        materials: [
          {
            label: { cs: "Školní řád a BOZP (PDF)", en: "School rules & safety (PDF)" },
            href: "https://www.sps-tabor.cz/wp-content/uploads/2026/02/2025_Skolni-rad_akt.pdf",
            kind: "doc",
          },
        ],
      },
      {
        month: { cs: "Září – Říjen", en: "September – October" },
        title: {
          cs: "Úvod do informatiky a digitální gramotnost",
          en: "Introduction to informatics & digital literacy",
        },
        goal: {
          cs: "Znát základy práce s počítačem, operačním systémem a kybernetickou bezpečností.",
          en: "Know the basics of the computer, operating system and cybersecurity.",
        },
        topics: {
          cs: [
            "Práce s operačním systémem a základní nastavení",
            "Správa souborů a složek, cloudové úložiště",
            "Zásady kybernetické bezpečnosti, ochrana osobních údajů",
            "Základní principy počítačových sítí",
            "Typy softwaru, licence a autorská práva",
            "Základy práce v příkazovém řádku (Windows)",
          ],
          en: [
            "Working with the operating system & basic settings",
            "File & folder management, cloud storage",
            "Cybersecurity principles, personal data protection",
            "Basic principles of computer networks",
            "Types of software, licences & copyright",
            "Basics of the command line (Windows)",
          ],
        },
        materials: [
          {
            label: {
              cs: "Microsoft Learn: Příkazový řádek – syntaxe",
              en: "Microsoft Learn: Command-line syntax",
            },
            href: "https://learn.microsoft.com/cs-cz/dotnet/standard/commandline/syntax",
            kind: "doc",
          },
        ],
      },
      {
        month: { cs: "Říjen", en: "October" },
        title: {
          cs: "Textový procesor a práce s dokumenty",
          en: "Word processing & working with documents",
        },
        goal: {
          cs: "Umět efektivně vytvářet, formátovat a sdílet textové dokumenty.",
          en: "Create, format and share text documents effectively.",
        },
        topics: {
          cs: [
            "Popis pracovního prostředí, základní operace",
            "Formátování textu a pokročilé úpravy dokumentů",
            "Vkládání tabulek, grafiky a multimediálních prvků",
            "Export, sdílení a spolupráce na dokumentech",
            "Automatizace formátování, styly a šablony",
          ],
          en: [
            "The workspace & basic operations",
            "Text formatting & advanced document editing",
            "Inserting tables, graphics & multimedia",
            "Export, sharing & document collaboration",
            "Formatting automation, styles & templates",
          ],
        },
        materials: [],
      },
      {
        month: { cs: "Listopad", en: "November" },
        title: {
          cs: "Tabulkové procesory a práce s daty",
          en: "Spreadsheets & working with data",
        },
        goal: {
          cs: "Ovládat tabulkový procesor pro analýzu a vizualizaci dat.",
          en: "Use a spreadsheet for data analysis and visualisation.",
        },
        topics: {
          cs: [
            "Základní operace v tabulkovém procesoru (Excel)",
            "Formátování tabulek, vzorce a základní funkce",
            "Vytváření grafů a vizualizace dat",
            "Úvod do analýzy dat",
            "Podmíněné formátování a pokročilé vzorce",
            "Automatizace úloh pomocí maker",
          ],
          en: [
            "Basic operations in a spreadsheet (Excel)",
            "Table formatting, formulas & basic functions",
            "Charts & data visualisation",
            "Introduction to data analysis",
            "Conditional formatting & advanced formulas",
            "Task automation with macros",
          ],
        },
        materials: [],
      },
      {
        month: { cs: "Prosinec – Leden", en: "December – January" },
        title: {
          cs: "Programování a algoritmizace",
          en: "Programming & algorithms",
        },
        goal: {
          cs: "Chápat základy algoritmizace a blokového programování.",
          en: "Understand the basics of algorithms and block-based programming.",
        },
        topics: {
          cs: [
            "Myšlení v algoritmech, vývojové diagramy",
            "Blokové programování (Scratch, Minecraft Education Edition)",
            "Podmínky, cykly a proměnné v programování",
            "Tvorba jednoduchých projektů v Minecraft Education Edition",
            "Úvod do textového programování (Python, JavaScript)",
            "Práce s proměnnými, funkcemi a vstupně-výstupní operace",
          ],
          en: [
            "Algorithmic thinking, flowcharts",
            "Block-based programming (Scratch, Minecraft Education Edition)",
            "Conditions, loops & variables",
            "Simple projects in Minecraft Education Edition",
            "Introduction to text-based programming (Python, JavaScript)",
            "Variables, functions & input/output operations",
          ],
        },
        materials: [
          {
            label: { cs: "Crash Course: Computer Science", en: "Crash Course: Computer Science" },
            href: "https://thecrashcourse.com/topic/computerscience/",
            kind: "video",
          },
          {
            label: {
              cs: "Minecraft Education: Coding Fundamentals",
              en: "Minecraft Education: Coding Fundamentals",
            },
            href: "https://education.minecraft.net/en-us/resources/computer-science/coding-fundamentals",
            kind: "code",
          },
          {
            label: { cs: "Minecraft Education: Python 101", en: "Minecraft Education: Python 101" },
            href: "https://education.minecraft.net/en-us/resources/computer-science/python-101",
            kind: "code",
          },
          {
            label: {
              cs: "Jak naimportovat svět do Minecraft Education Edition",
              en: "How to import a world into Minecraft Education Edition",
            },
            href: "https://edusupport.minecraft.net/hc/en-us/articles/360047555391-Import-Export-and-Manage-Worlds",
            kind: "link",
          },
        ],
      },
      {
        month: { cs: "Únor – Březen", en: "February – March" },
        title: {
          cs: "Počítačová grafika a práce s multimédii",
          en: "Computer graphics & multimedia",
        },
        goal: {
          cs: "Znát principy počítačové grafiky a umět tvořit grafiku a pracovat s multimédii.",
          en: "Know the principles of computer graphics and create graphics and multimedia.",
        },
        topics: {
          cs: [
            "Rozdíl mezi vektorovou a rastrovou grafikou",
            "Úprava obrázků v jednoduchých editorech (Canva, GIMP)",
            "Základy práce s videem a zvukem",
            "Formáty obrázků a komprese dat",
            "Vytváření infografiky a prezentací",
          ],
          en: [
            "Vector vs. raster graphics",
            "Editing images in simple editors (Canva, GIMP)",
            "Basics of video & audio",
            "Image formats & data compression",
            "Creating infographics & presentations",
          ],
        },
        materials: [
          {
            label: { cs: "Canva: Základy grafického designu", en: "Canva: Graphic design basics" },
            href: "https://www.canva.com/design-school/courses/graphic-design-basics-from-the-experts",
            kind: "video",
          },
        ],
      },
      {
        month: { cs: "Duben", en: "April" },
        title: {
          cs: "Internet, bezpečnost a práce s informacemi",
          en: "Internet, safety & information literacy",
        },
        goal: {
          cs: "Znát zásady bezpečného využívání internetu a ověřování informací.",
          en: "Know the principles of safe internet use and verifying information.",
        },
        topics: {
          cs: [
            "Zásady bezpečného chování na internetu",
            "Vyhledávání informací a ověřování zdrojů",
            "Sociální sítě, digitální stopa a fake news",
            "Ochrana soukromí, GDPR, autorská práva",
            "Šifrování dat a dvoufaktorová autentizace",
            "Hrozby v kyberprostoru a prevence útoků",
          ],
          en: [
            "Principles of safe behaviour online",
            "Searching for information & verifying sources",
            "Social media, digital footprint & fake news",
            "Privacy protection, GDPR, copyright",
            "Data encryption & two-factor authentication",
            "Cyberspace threats & attack prevention",
          ],
        },
        materials: [
          {
            label: {
              cs: "Kybertest.cz – test kybernetické bezpečnosti",
              en: "Kybertest.cz – cybersecurity test",
            },
            href: "https://www.kybertest.cz",
            kind: "link",
          },
          {
            label: { cs: "Kyberpříběhy (PDF)", en: "Cyber stories (PDF)" },
            href: "https://digitalizace.rvp.cz/files/aidig-kyberpribehy.pdf",
            kind: "doc",
          },
          {
            label: { cs: "Kyberbezpečnost a anonymita (PDF)", en: "Cybersecurity & anonymity (PDF)" },
            href: "https://digitalizace.rvp.cz/files/aidigi-kyberbsanon.pdf",
            kind: "doc",
          },
          {
            label: { cs: "Bezpečná hesla (PDF)", en: "Safe passwords (PDF)" },
            href: "https://digitalizace.rvp.cz/files/bezpecna-hesla.pdf",
            kind: "doc",
          },
          {
            label: { cs: "DigiVýuka: Digitální stopa", en: "DigiVýuka: Digital footprint" },
            href: "https://www.digivyuka.cz/mod/book/view.php?id=71",
            kind: "link",
          },
        ],
      },
      {
        month: { cs: "Květen", en: "May" },
        title: {
          cs: "Základy databází a práce s informacemi",
          en: "Database basics & working with information",
        },
        goal: {
          cs: "Chápat principy databází a umět pracovat se základními SQL dotazy.",
          en: "Understand database principles and work with basic SQL queries.",
        },
        topics: {
          cs: [
            "Co je databáze a jak funguje",
            "Struktura databázových tabulek, základní operace",
            "Práce se základními dotazy v SQL",
            "Tvorba jednoduché databáze a propojení s aplikací",
          ],
          en: [
            "What a database is and how it works",
            "Database table structure & basic operations",
            "Working with basic SQL queries",
            "Building a simple database & connecting it to an app",
          ],
        },
        materials: [],
      },
      {
        month: { cs: "Červen", en: "June" },
        title: {
          cs: "Časová rezerva a opakování",
          en: "Reserve time & revision",
        },
        goal: {
          cs: "Prostor na dokončení projektů, opakování a aktuální témata.",
          en: "Time to finish projects, revise and cover current topics.",
        },
        topics: { cs: [], en: [] },
        materials: [],
      },
    ],
  },

  {
    id: "1S",
    year: { cs: "1. ročník", en: "Year 1" },
    field: { cs: "Strojírenství", en: "Mechanical Engineering" },
    schoolYear: "2025/2026",
    items: [
      {
        month: { cs: "Září", en: "September" },
        title: {
          cs: "Organizace, bezpečnost a školní informační systémy",
          en: "Organisation, safety & school IT systems",
        },
        goal: {
          cs: "Zorientovat se ve školních systémech a zásadách bezpečné práce.",
          en: "Get oriented in the school systems and safe-working rules.",
        },
        topics: {
          cs: [
            "Organizace výuky, BOZP",
            "Školní informační systém, web školy",
            "Systém pro online výuku a komunikaci",
            "Cloudové disky a přístupy, školní licence",
          ],
          en: [
            "Lesson organisation, health & safety",
            "School information system, school website",
            "Online learning & communication system",
            "Cloud drives & access, school licences",
          ],
        },
        materials: [
          {
            label: { cs: "Školní řád a BOZP (PDF)", en: "School rules & safety (PDF)" },
            href: "https://www.sps-tabor.cz/wp-content/uploads/2026/02/2025_Skolni-rad_akt.pdf",
            kind: "doc",
          },
        ],
      },
      {
        month: { cs: "Září – Říjen", en: "September – October" },
        title: {
          cs: "Operační systémy a práce se soubory",
          en: "Operating systems & working with files",
        },
        goal: {
          cs: "Ovládat správu souborů a složek, chápat fungování operačního systému a umět zabezpečit data.",
          en: "Manage files and folders, understand how the OS works and secure data.",
        },
        topics: {
          cs: ["Struktura OS", "Správa souborů", "Cloudové služby", "Zabezpečení dat"],
          en: ["OS structure", "File management", "Cloud services", "Data security"],
        },
        materials: [],
      },
      {
        month: { cs: "Říjen – Prosinec", en: "October – December" },
        title: { cs: "Kancelářské aplikace", en: "Office applications" },
        goal: {
          cs: "Umět pracovat s textovými a tabulkovými dokumenty a ovládat tvorbu prezentací.",
          en: "Work with text and spreadsheet documents and create presentations.",
        },
        topics: {
          cs: ["Textový editor", "Tabulkový procesor", "Prezentační software"],
          en: ["Word processor", "Spreadsheet software", "Presentation software"],
        },
        materials: [],
      },
      {
        month: { cs: "Leden – Únor", en: "January – February" },
        title: {
          cs: "Základy programování a algoritmizace (Minecraft Education Edition)",
          en: "Programming & algorithm basics (Minecraft Education Edition)",
        },
        goal: {
          cs: "Chápat základní principy algoritmizace a umět vytvářet jednoduché programy v Minecraftu.",
          en: "Understand the basics of algorithms and create simple programs in Minecraft.",
        },
        topics: {
          cs: [
            "Algoritmy, sekvence, cykly, podmínky",
            "Tvorba skriptů pro automatizaci v Pythonu",
            "Programování a simulace technických procesů v Minecraft Education Edition",
            "Využití Minecraftu pro modelování výrobních systémů",
          ],
          en: [
            "Algorithms, sequences, loops, conditions",
            "Writing automation scripts in Python",
            "Programming & simulating technical processes in Minecraft Education Edition",
            "Using Minecraft to model production systems",
          ],
        },
        materials: [
          {
            label: { cs: "Crash Course: Computer Science", en: "Crash Course: Computer Science" },
            href: "https://thecrashcourse.com/topic/computerscience/",
            kind: "video",
          },
          {
            label: {
              cs: "Minecraft Education: Coding Fundamentals",
              en: "Minecraft Education: Coding Fundamentals",
            },
            href: "https://education.minecraft.net/en-us/resources/computer-science/coding-fundamentals",
            kind: "code",
          },
          {
            label: { cs: "Minecraft Education: Python 101", en: "Minecraft Education: Python 101" },
            href: "https://education.minecraft.net/en-us/resources/computer-science/python-101",
            kind: "code",
          },
          {
            label: {
              cs: "Jak naimportovat svět do Minecraft Education Edition",
              en: "How to import a world into Minecraft Education Edition",
            },
            href: "https://edusupport.minecraft.net/hc/en-us/articles/360047555391-Import-Export-and-Manage-Worlds",
            kind: "link",
          },
        ],
      },
      {
        month: { cs: "Březen", en: "March" },
        title: {
          cs: "Základy skriptování a automatizace",
          en: "Scripting & automation basics",
        },
        goal: {
          cs: "Psát a spouštět jednoduché skripty, používat proměnné a výpočty, rozumět základnímu zápisu algoritmu v textovém jazyce.",
          en: "Write and run simple scripts, use variables and calculations, and understand basic algorithm notation in a text language.",
        },
        topics: {
          cs: [
            "Úvod do textového programování",
            "Proměnné a datové typy",
            "Vstup a výstup, výrazy a výpočty",
            "Základní algoritmické struktury",
            "Psaní a spouštění jednoduchých skriptů",
            "Automatizace běžných úloh",
          ],
          en: [
            "Introduction to text-based programming",
            "Variables & data types",
            "Input/output, expressions & calculations",
            "Basic algorithmic structures",
            "Writing & running simple scripts",
            "Automating routine tasks",
          ],
        },
        materials: [],
      },
      {
        month: { cs: "Duben", en: "April" },
        title: {
          cs: "Vyhledávání a ověřování informací, práce s AI",
          en: "Finding & verifying information, working with AI",
        },
        goal: {
          cs: "Vyhledávat technické informace, ověřovat jejich důvěryhodnost, vytvářet citace a seznam použité literatury.",
          en: "Find technical information, verify its credibility, and create citations and a bibliography.",
        },
        topics: {
          cs: [
            "Práce s informacemi na internetu",
            "Vyhledávače, hodnocení zdrojů",
            "Citace a bibliografie",
            "Fake news",
          ],
          en: [
            "Working with information online",
            "Search engines & evaluating sources",
            "Citations & bibliography",
            "Fake news",
          ],
        },
        materials: [
          {
            label: {
              cs: "Kybertest.cz – test kybernetické bezpečnosti",
              en: "Kybertest.cz – cybersecurity test",
            },
            href: "https://www.kybertest.cz",
            kind: "link",
          },
        ],
      },
      {
        month: { cs: "Květen", en: "May" },
        title: {
          cs: "Úvod do internetu věcí (IoT)",
          en: "Introduction to the Internet of Things (IoT)",
        },
        goal: {
          cs: "Popsat, jak probíhá přenos a zpracování dat v IoT, rozlišit základní části systému a chápat význam datového formátu a zabezpečení.",
          en: "Describe how data is transferred and processed in IoT, identify the basic parts of a system, and understand data formats and security.",
        },
        topics: {
          cs: [
            "Přenos a zpracování dat mezi zařízeními v síti",
            "Informační tok v IoT – zařízení, brána, cloud",
            "Datové formáty (např. JSON)",
            "Přístupová práva a zabezpečení",
          ],
          en: [
            "Data transfer & processing between networked devices",
            "Information flow in IoT – device, gateway, cloud",
            "Data formats (e.g. JSON)",
            "Access rights & security",
          ],
        },
        materials: [],
      },
      {
        month: { cs: "Květen – Červen", en: "May – June" },
        title: {
          cs: "Grafika a technická dokumentace",
          en: "Graphics & technical documentation",
        },
        goal: {
          cs: "Umět pracovat s grafickými nástroji.",
          en: "Work with graphics tools.",
        },
        topics: {
          cs: ["Základy bitmapové a vektorové grafiky", "Práce s technickými výkresy"],
          en: ["Basics of bitmap & vector graphics", "Working with technical drawings"],
        },
        materials: [],
      },
      {
        month: { cs: "Červen", en: "June" },
        title: { cs: "Časová rezerva a opakování", en: "Reserve time & revision" },
        goal: {
          cs: "Prostor na dokončení projektů, opakování a aktuální témata.",
          en: "Time to finish projects, revise and cover current topics.",
        },
        topics: { cs: [], en: [] },
        materials: [],
      },
    ],
  },

  {
    id: "1P",
    year: { cs: "1. ročník", en: "Year 1" },
    field: { cs: "Pozemní stavitelství", en: "Building Construction" },
    schoolYear: "2025/2026",
    items: [
      {
        month: { cs: "Září", en: "September" },
        title: {
          cs: "Organizace, bezpečnost a školní informační systémy",
          en: "Organisation, safety & school IT systems",
        },
        goal: {
          cs: "Zorientovat se ve školních systémech a zásadách bezpečné práce.",
          en: "Get oriented in the school systems and safe-working rules.",
        },
        topics: {
          cs: [
            "Organizace výuky, BOZP",
            "Školní informační systém, web školy",
            "Systém pro online výuku a komunikaci",
            "Cloudové disky a přístupy, školní licence",
          ],
          en: [
            "Lesson organisation, health & safety",
            "School information system, school website",
            "Online learning & communication system",
            "Cloud drives & access, school licences",
          ],
        },
        materials: [
          {
            label: { cs: "Školní řád a BOZP (PDF)", en: "School rules & safety (PDF)" },
            href: "https://www.sps-tabor.cz/wp-content/uploads/2026/02/2025_Skolni-rad_akt.pdf",
            kind: "doc",
          },
        ],
      },
      {
        month: { cs: "Září – Říjen", en: "September – October" },
        title: {
          cs: "Operační systémy a práce se soubory",
          en: "Operating systems & working with files",
        },
        goal: {
          cs: "Ovládat správu souborů a složek, chápat fungování operačního systému a umět zabezpečit data.",
          en: "Manage files and folders, understand how the OS works and secure data.",
        },
        topics: {
          cs: ["Struktura OS", "Správa souborů", "Cloudové služby", "Zabezpečení dat"],
          en: ["OS structure", "File management", "Cloud services", "Data security"],
        },
        materials: [],
      },
      {
        month: { cs: "Říjen – Prosinec", en: "October – December" },
        title: { cs: "Kancelářské aplikace", en: "Office applications" },
        goal: {
          cs: "Umět pracovat s textovými a tabulkovými dokumenty a ovládat tvorbu prezentací.",
          en: "Work with text and spreadsheet documents and create presentations.",
        },
        topics: {
          cs: ["Textový editor", "Tabulkový procesor", "Prezentační software"],
          en: ["Word processor", "Spreadsheet software", "Presentation software"],
        },
        materials: [],
      },
      {
        month: { cs: "Leden – Únor", en: "January – February" },
        title: {
          cs: "Základy programování a algoritmizace (Minecraft Education Edition)",
          en: "Programming & algorithm basics (Minecraft Education Edition)",
        },
        goal: {
          cs: "Chápat základní principy algoritmizace a umět vytvářet jednoduché programy v Minecraftu.",
          en: "Understand the basics of algorithms and create simple programs in Minecraft.",
        },
        topics: {
          cs: [
            "Algoritmy, sekvence, cykly, podmínky",
            "Tvorba skriptů pro automatizaci v Pythonu",
            "Programování a simulace technických procesů v Minecraft Education Edition",
            "Využití Minecraftu pro modelování výrobních systémů",
          ],
          en: [
            "Algorithms, sequences, loops, conditions",
            "Writing automation scripts in Python",
            "Programming & simulating technical processes in Minecraft Education Edition",
            "Using Minecraft to model production systems",
          ],
        },
        materials: [
          {
            label: { cs: "Crash Course: Computer Science", en: "Crash Course: Computer Science" },
            href: "https://thecrashcourse.com/topic/computerscience/",
            kind: "video",
          },
          {
            label: {
              cs: "Minecraft Education: Coding Fundamentals",
              en: "Minecraft Education: Coding Fundamentals",
            },
            href: "https://education.minecraft.net/en-us/resources/computer-science/coding-fundamentals",
            kind: "code",
          },
          {
            label: { cs: "Minecraft Education: Python 101", en: "Minecraft Education: Python 101" },
            href: "https://education.minecraft.net/en-us/resources/computer-science/python-101",
            kind: "code",
          },
          {
            label: {
              cs: "Jak naimportovat svět do Minecraft Education Edition",
              en: "How to import a world into Minecraft Education Edition",
            },
            href: "https://edusupport.minecraft.net/hc/en-us/articles/360047555391-Import-Export-and-Manage-Worlds",
            kind: "link",
          },
        ],
      },
      {
        month: { cs: "Březen", en: "March" },
        title: {
          cs: "Základy skriptování a automatizace",
          en: "Scripting & automation basics",
        },
        goal: {
          cs: "Psát a spouštět jednoduché skripty, používat proměnné a výpočty, rozumět základnímu zápisu algoritmu v textovém jazyce.",
          en: "Write and run simple scripts, use variables and calculations, and understand basic algorithm notation in a text language.",
        },
        topics: {
          cs: [
            "Úvod do textového programování",
            "Proměnné a datové typy",
            "Vstup a výstup, výrazy a výpočty",
            "Základní algoritmické struktury",
            "Psaní a spouštění jednoduchých skriptů",
            "Automatizace běžných úloh",
          ],
          en: [
            "Introduction to text-based programming",
            "Variables & data types",
            "Input/output, expressions & calculations",
            "Basic algorithmic structures",
            "Writing & running simple scripts",
            "Automating routine tasks",
          ],
        },
        materials: [],
      },
      {
        month: { cs: "Duben", en: "April" },
        title: {
          cs: "Vyhledávání a ověřování informací, práce s AI",
          en: "Finding & verifying information, working with AI",
        },
        goal: {
          cs: "Vyhledávat technické informace, ověřovat jejich důvěryhodnost, vytvářet citace a seznam použité literatury.",
          en: "Find technical information, verify its credibility, and create citations and a bibliography.",
        },
        topics: {
          cs: [
            "Práce s informacemi na internetu",
            "Vyhledávače, hodnocení zdrojů",
            "Citace a bibliografie",
            "Fake news",
          ],
          en: [
            "Working with information online",
            "Search engines & evaluating sources",
            "Citations & bibliography",
            "Fake news",
          ],
        },
        materials: [
          {
            label: {
              cs: "Kybertest.cz – test kybernetické bezpečnosti",
              en: "Kybertest.cz – cybersecurity test",
            },
            href: "https://www.kybertest.cz",
            kind: "link",
          },
        ],
      },
      {
        month: { cs: "Květen", en: "May" },
        title: {
          cs: "Úvod do internetu věcí (IoT)",
          en: "Introduction to the Internet of Things (IoT)",
        },
        goal: {
          cs: "Popsat, jak probíhá přenos a zpracování dat v IoT, rozlišit základní části systému a chápat význam datového formátu a zabezpečení.",
          en: "Describe how data is transferred and processed in IoT, identify the basic parts of a system, and understand data formats and security.",
        },
        topics: {
          cs: [
            "Přenos a zpracování dat mezi zařízeními v síti",
            "Informační tok v IoT – zařízení, brána, cloud",
            "Datové formáty (např. JSON)",
            "Přístupová práva a zabezpečení",
          ],
          en: [
            "Data transfer & processing between networked devices",
            "Information flow in IoT – device, gateway, cloud",
            "Data formats (e.g. JSON)",
            "Access rights & security",
          ],
        },
        materials: [],
      },
      {
        month: { cs: "Květen – Červen", en: "May – June" },
        title: {
          cs: "Grafika a technická dokumentace",
          en: "Graphics & technical documentation",
        },
        goal: {
          cs: "Umět pracovat s grafickými nástroji.",
          en: "Work with graphics tools.",
        },
        topics: {
          cs: ["Základy bitmapové a vektorové grafiky", "Práce s technickými výkresy"],
          en: ["Basics of bitmap & vector graphics", "Working with technical drawings"],
        },
        materials: [],
      },
      {
        month: { cs: "Červen", en: "June" },
        title: { cs: "Časová rezerva a opakování", en: "Reserve time & revision" },
        goal: {
          cs: "Prostor na dokončení projektů, opakování a aktuální témata.",
          en: "Time to finish projects, revise and cover current topics.",
        },
        topics: { cs: [], en: [] },
        materials: [],
      },
    ],
  },
];

/* ───────────────────────────── PŘEKLADY UI ───────────────────────────── */

type TimelineItem = { period: string; place: string; detail: string };

type Dict = {
  nav: {
    about: string;
    lessons: string;
    contact: string;
    bank: string;
    /** Logo v hlavičce: čím web JE (nahoře) a kdo za ním stojí (pod tím). */
    brand: string;
    brandSub: string;
  };
  hero: {
    badge: string;
    headline: string;
    role: string;
    tagline: string;
    byline: string;
    /** Důkazní řádek. `{files}` a `{topics}` se nahradí reálnými čísly. */
    stats: string;
    sample: string;
    /** Popisek nad odkazy na čtení (komponenta `Ctenie`). */
    reading: string;
    ctaLessons: string;
    ctaContact: string;
    scroll: string;
  };
  about: {
    kicker: string;
    heading: string;
    paragraphs: string[];
    eduTitle: string;
    expTitle: string;
    interestsTitle: string;
    badgesTitle: string;
    interests: string[];
    education: TimelineItem[];
    experience: TimelineItem[];
  };
  /** Pozn.: sekce „Výuka" byla z homepage odstraněna (duplicitní plány 1S/1P,
      pro cizího učitele bez užitku). Texty i COURSES zůstávají – COURSES
      dodává bance názvy témat a oborů, takže se NESMÍ smazat.

      POZOR: řetězce v `lessons` se dnes NIKDE nevykreslují (`tr.lessons` nikdo
      nečte, vlastní texty má i stránka 404). Než se sekce vrátí, projdi je –
      tón se mezitím posunul k tykání a k prvnímu člověku. */
  lessons: {
    kicker: string;
    heading: string;
    intro: string;
    subject: string;
    pick: string;
    goalLabel: string;
    topicsLabel: string;
    materialsLabel: string;
    noMaterials: string;
    soon: string;
    teacherNoteLabel: string;
    audienceTeacher: string;
    audienceStudent: string;
    audienceBoth: string;
  };
  /** Sekce „Nejen do informatiky" – hodiny z banky použitelné i v jiných předmětech. */
  aihub: {
    kicker: string;
    heading: string;
    badge: string;
    intro: string;
    /** Prázdný stav – dokud projekt nezačal, sekce musí říct proč. */
    emptyTitle: string;
    emptyText: string;
    /** Popisky polí šablony z kapitoly 10.1 projektového záměru. */
    labelCil: string;
    labelNastroj: string;
    labelOvereni: string;
    /** Kolik času postup ušetřil – měřítko, podle kterého se sem věci vybírají. */
    labelUspora: string;
    labelReflexe: string;
    labelDoporuceni: string;
    labelPrilohy: string;
    /** Nadpisy tří fází, podle kterých se sekce dělí. */
    fazePred: string;
    fazePo: string;
    /** Štítek na kartě: vyplatilo se, nebo ne. */
    vysledekVyplatilo: string;
    vysledekNevyplatilo: string;
    /** Řádek o označení a licenci pod seznamem. */
    licenceNote: string;
    countOne: string;
    countFew: string;
    countMany: string;
  };
  cross: {
    kicker: string;
    heading: string;
    /** Odznak u nadpisu – přizná, že sekce teprve vzniká. */
    badge: string;
    intro: string;
    note: string;
    /** Výzva v poslední (šedé) dlaždici – sběr od kolegů přímo ve vizuálu. */
    inviteTitle: string;
    inviteText: string;
    materialsLabel: string;
    toolsLabel: string;
    download: string;
    /**
     * Dlaždice = PŘEDMĚT. `tool` odkazuje na téma v bance (vlastní materiály),
     * `tools` jsou ověřené externí nástroje – u každého je `note` s tím, co
     * učitele může zaskočit (účty, jazyk, expirace odkazu, limity).
     */
    items: {
      subject: string;
      what: string;
      icon: string;
      tool?: string;
      tools?: { name: string; url: string; why: string; note: string }[];
    }[];
  };
  /**
   * Nástroje uvnitř AI Hubu – ROZCESTNÍK vedle ověřených výstupů.
   *
   * Vykresluje se v `AiHub.tsx` pod výstupy, ne jako vlastní sekce: Karel to
   * chtěl mít pohromadě („Vlož to do AI Hubu a AI nástroje smaž“).
   *
   * Hub si tím ale musí ohlídat vlastní slib. Stojí na tom, že se do něj
   * dostane jen změřená práce – tenhle blok se proto od výstupů viditelně
   * odděluje čarou a `disclaimer` hned pod nadpisem říká, že tady měřené nic
   * není. Nepadne tu ani slovo o ušetřeném čase; to patří jen nahoru.
   *
   * `navod` je stručný první krok: čím začít, aby to dalo použitelný výsledek.
   * `note` drží konvenci celého webu – co člověka po kliknutí čeká: účet,
   * jazyk, limit, cookies.
   */
  nastroje: {
    heading: string;
    disclaimer: string;
    /** Popisky nad dvěma texty u nástroje – bez nich karta splyne v odstavec. */
    labelNavod: string;
    labelPouziti: string;
    /** Atribuce: výběr kategorií vznikl podle databáze na aidetem.cz. */
    credit: string;
    creditUrl: string;
    items: {
      kategorie: string;
      what: string;
      icon: "chat" | "obraz" | "trida";
      tools: {
        name: string;
        url: string;
        why: string;
        /** Čím začít, aby první pokus dal použitelný výsledek. */
        navod: string;
        /** Na co to učitel reálně nasadí – konkrétní situace z jeho týdne. */
        pouziti: string;
        note: string;
      }[];
    }[];
  };
  /**
   * Stránka o zpracování údajů (`/soukromi`).
   *
   * Nestojí na homepage jako sekce, i když web je jinak one-page: tohle se
   * nečte při procházení, ale když někdo hledá konkrétní odpověď, a odkazuje
   * se na to z patičky i ze zamykací obrazovky prostředí.
   *
   * Text vychází z `NAVRH-ZPRACOVANI-UDAJU.md` a popisuje SKUTEČNOST, ne
   * záměr: účty žáků byly zrušené (`2a29fef`) a Karel 4. 9. 2026 smazal
   * i databázi v Upstashi. Kdyby se na web někdy vrátilo cokoli, co se ukládá
   * na server, musí se tenhle text změnit DŘÍV, než to půjde ven.
   *
   * Poštovní adresa tu není schválně – Karel to jako provozovatel rozhodl
   * 6. 9. 2026 a kontaktem je e-mail.
   */
  soukromi: {
    title: string;
    intro: string;
    updated: string;
    zpet: string;
    sekce: { nadpis: string; odstavce: string[] }[];
  };
  materials: {
    kicker: string;
    heading: string;
    sub: string;
  };
  contact: {
    kicker: string;
    heading: string;
    intro: string;
    school: string;
    addressLabel: string;
    emailLabel: string;
    emailPersonalLabel: string;
    phoneLabel: string;
    cabinetLabel: string;
    consultLabel: string;
    consultValue: string;
    mapLink: string;
    socialsTitle: string;
  };
  footer: {
    role: string;
    /** Uvozuje odkaz na licenci, proto končí bez tečky. */
    rights: string;
    affiliation: string;
    licenseName: string;
    /** Odkaz na text licence – česká i anglická verze mají vlastní „deed“. */
    licenseHref: string;
    analytics: string;
    /** Odkaz na `/soukromi`. V patičce schválně hned za větou o měření. */
    soukromiOdkaz: string;
    top: string;
    sqlCourse: string;
    windows: string;
  };
  ui: { theme: string };
};

export const t: Record<Lang, Dict> = {
  cs: {
    nav: {
      about: "O mně",
      lessons: "Výuka",
      contact: "Kontakt",
      bank: "Materiály do informatiky",
      brand: "Materiály do výuky",
      brandSub: "Karel Hlas · SPŠ Tábor",
    },
    hero: {
      badge: "Materiály do výuky · zdarma",
      headline: "Hotové přípravy a materiály nejen do informatiky",
      role: "Učitel informatiky a angličtiny",
      tagline:
        "Pro střední školy. Moje soubory si stáhneš i upravíš zdarma; kurz SQL a virtuální Windows běží rovnou v prohlížeči. U převzatých cvičebnic vede odkaz k jejich původnímu autorovi.",
      byline: "Připravuje Karel Hlas · učitel informatiky na SPŠ Tábor",
      stats: "{files} souborů · {topics} témat · všechny ročníky SŠ",
      sample: "Ukázka materiálů",
      reading: "Zajímavé články",
      ctaLessons: "Procházet materiály",
      ctaContact: "O mně",
      scroll: "Materiály",
    },
    about: {
      kicker: "O mně",
      heading: "Učitel, kterého baví technologie",
      paragraphs: [
        "Učím informatiku a angličtinu na SPŠ strojní a stavební v Táboře. Vystudoval jsem zdejší Technické lyceum a učitelství na Pedagogické fakultě Jihočeské univerzity.",
        "Ve výuce hledám praktické a srozumitelné cesty, jak žákům přiblížit moderní technologie. Mimo školu mě baví tvorba webů, programování a bowling.",
      ],
      eduTitle: "Vzdělání",
      expTitle: "Praxe",
      interestsTitle: "Co mě baví",
      badgesTitle: "Certifikáty a odznaky",
      interests: ["Moderní technologie", "Vzdělávání", "Tvorba webů", "Programování", "Bowling"],
      education: [
        {
          period: "2006–2015",
          place: "ZŠ a MŠ Sezimovo Ústí",
          detail: "9. května 489, okres Tábor",
        },
        {
          period: "2015–2019",
          place: "SPŠ strojní a stavební, Tábor",
          detail: "Technické lyceum – programování a robotika",
        },
        {
          period: "2019–2026",
          place: "Pedagogická fakulta JČU",
          detail: "Bc. i Mgr. – učitelství informatiky a angličtiny pro 2. stupeň",
        },
      ],
      experience: [
        {
          period: "Začátky",
          place: "ZŠ a MŠ Malšice, okres Tábor",
          detail: "Asistent pedagoga, poté učitel informatiky na 2. stupni",
        },
        {
          period: "Nyní",
          place: "SPŠ strojní a stavební, Tábor",
          detail: "Učitel informatiky a angličtiny",
        },
      ],
    },
    lessons: {
      kicker: "Ověřeno ve výuce",
      heading: "Výuka informatiky",
      intro:
        "Takhle vypadá moje výuka v praxi – vyber si ročník a rozbalí se časová osa témat, kterými se svými třídami během roku projdeme.",
      subject: "Informatika",
      pick: "Klikni pro zobrazení časové osy",
      goalLabel: "Cíl",
      topicsLabel: "Co probereme",
      materialsLabel: "Materiály",
      noMaterials: "Materiály sem postupně doplním.",
      soon: "brzy",
      teacherNoteLabel: "Pro učitele",
      audienceTeacher: "Pro učitele",
      audienceStudent: "Pro žáky",
      audienceBoth: "Pro učitele i žáky",
    },
    aihub: {
      kicker: "AI Hub",
      heading: "Jak si s AI ušetřit čas kolem hodiny",
      badge: "Nová sekce",
      intro:
        "Návody na učitelovu vlastní práci, ne na hodinu: čím si pomoct při přípravě a co potom – při opravování, vyhodnocování a reflexi. Nic teoretického a nic pro studenty. U každého návodu stojí, na čem jsem ho zkusil, kolik času ušetřil a jestli se vůbec vyplatil.",
      emptyTitle: "Ověřené postupy tu zatím nejsou, a je to tak správně.",
      emptyText:
        "První přibudou, až si je sám vyzkouším na přípravě a opravování. Tipy na AI, které nikdo nezkusil, najdeš na internetu tisíckrát – a pár jich máš i kousek níž. Smysl tohohle místa je, že u postupů tady nahoře bude navíc napsané, kolik času doopravdy ušetřily. A klidně i to, že se nevyplatily vůbec.",
      labelCil: "Co bylo potřeba udělat",
      labelNastroj: "AI nástroj a postup",
      labelOvereni: "Na čem jsem to zkusil",
      labelUspora: "Kolik času to ušetřilo",
      labelReflexe: "Co fungovalo a co ne",
      labelDoporuceni: "Za jakých podmínek to převzít",
      labelPrilohy: "Přílohy",
      vysledekVyplatilo: "Vyplatilo se",
      vysledekNevyplatilo: "Nevyplatilo se",
      fazePred: "Před hodinou",
      fazePo: "Po hodině",
      licenceNote:
        "AI Hub vzniká na Střední průmyslové škole strojní a stavební Tábor v rámci mé práce koordinátora ICT. Vkládám sem vlastní materiály, nebo cizí se svolením autora; sdílejí se pod stejnou licencí jako zbytek webu.",
      countOne: "výstup",
      countFew: "výstupy",
      countMany: "výstupů",
    },
    cross: {
      kicker: "Pro ostatní předměty",
      heading: "Nejen do informatiky",
      badge: "Nová sekce",
      intro:
        "Digitální dovednosti se podle nových osnov učí napříč předměty, ne jen v informatice. Klikni na svůj předmět – u většiny najdeš nástroje do hodiny, u češtiny a matematiky navíc cvičebnice Karla Klatovského na jeho OneDrivu. U každého nástroje je napsané, jestli potřebuje účet, jestli je česky a co tě při první hodině zaskočí.",
      note:
        "Nástroje jsou ověřené k srpnu 2026 – u cloudových služeb se podmínky mění, před hodinou si je proklikni. Učíš jiný předmět a něco ve výuce používáš? Napiš mi, rád to sem doplním a uvedu tě jako autora.",
      inviteTitle: "Chybí tu tvůj předmět?",
      inviteText: "Napiš mi, co ve svých hodinách používáš.",
      // Ne „ke stažení“: v téhle sekci jsou zatím jen odkazy k autorovi.
      materialsLabel: "Materiály k předmětu",
      toolsLabel: "Nástroje do hodin",
      download: "Stáhnout",
      items: [
        {
          subject: "Český jazyk",
          icon: "cesky-jazyk",
          what: "Formátování, styly a dlouhý dokument – k seminární a ročníkové práci.",
          tool: "Word",
        },
        {
          subject: "Matematika",
          icon: "matematika",
          what: "Tabulky, vzorce a grafy. Data, na kterých je vidět, k čemu funkce a procenta jsou.",
          tool: "Excel",
          tools: [
            {
              name: "GeoGebra",
              url: "https://www.geogebra.org/calculator",
              why: "Grafy funkcí, geometrie a dynamické konstrukce.",
              note: "Zdarma, bez účtu, celé česky. Web si vyžádá souhlas s reklamou – u nezletilých to zvaž předem.",
            },
            {
              name: "Desmos",
              url: "https://www.desmos.com/calculator",
              why: "Rychlá grafická kalkulačka a regrese z naměřených dat.",
              note: "Zdarma, bez účtu. Rozhraní je česky jen zčásti, přihlašování zůstává anglicky.",
            },
          ],
        },
        {
          subject: "Fyzika",
          icon: "fyzika",
          what: "Simulace, na kterých žák mění jednu veličinu a sleduje, co to udělá.",
          tools: [
            {
              name: "PhET",
              url: "https://phet.colorado.edu/cs/",
              why: "Mechanika, elektřina, optika, termika – simulace k měření a hypotézám.",
              note: "Zdarma, bez účtu, od University of Colorado. Všech 119 simulací je česky.",
            },
            {
              name: "Falstad Circuit Simulator",
              url: "https://www.falstad.com/circuit/",
              why: "Elektrické obvody s okamžitým průběhem napětí a proudu.",
              note: "Zdarma, bez účtu. Výchozí je angličtina; češtinu přepneš v nabídce Možnosti → Change Language, ale překlad není úplný.",
            },
            {
              name: "GeoGebra",
              url: "https://www.geogebra.org/calculator",
              why: "Zpracování naměřených dat, graf a regrese.",
              note: "Zdarma, bez účtu, česky. Web si vyžádá souhlas s reklamou.",
            },
          ],
        },
        {
          subject: "Chemie",
          icon: "chemie",
          what: "Virtuální laboratoř a odborná databáze látek – příprava před reálným pokusem.",
          tools: [
            {
              name: "PubChem",
              url: "https://pubchem.ncbi.nlm.nih.gov/",
              why: "Databáze látek: vzorce, vlastnosti, bezpečnostní údaje, 3D modely molekul.",
              note: "Zdarma, bez účtu, provozuje americké NCBI. Jen anglicky.",
            },
            {
              name: "ChemCollective",
              url: "https://chemcollective.org/vlabs",
              why: "Virtuální laboratoř: roztoky, titrace, pH, stechiometrie.",
              note: "Zdarma, bez účtu, běží v prohlížeči (žádná Java). Anglicky; licence nedovoluje úpravy ani překlad.",
            },
            {
              name: "MolView",
              url: "https://app.molview.com/",
              why: "Nakreslený vzorec převede rovnou do 3D modelu molekuly.",
              note: "Zdarma, bez účtu. Načítá Google Analytics – při práci s nezletilými to zvaž předem.",
            },
          ],
        },
        {
          subject: "Deskriptivní geometrie",
          icon: "deskriptivni-geometrie",
          what: "Řezy a průniky, které si žák může otočit a ověřit proti rysu.",
          tools: [
            {
              name: "GeoGebra 3D",
              url: "https://www.geogebra.org/3d",
              why: "Průniky rovin s tělesy, řezy, sítě těles, transformace.",
              note: "Zdarma, bez účtu, česky. Ukládání konstrukcí chce přihlášení.",
            },
            {
              name: "SketchUp for Schools",
              url: "https://edu.sketchup.com/",
              why: "Model tělesa a kontrola řezu proti ručně vytvořenému nárysu.",
              note: "Zdarma pro školy, ale musí ho povolit správce školní domény – učitel si to sám nezapne.",
            },
          ],
        },
        {
          subject: "Strojírenství",
          icon: "strojirenstvi",
          what: "Cloudový CAD, čtení cizího modelu a simulace elektroniky.",
          tools: [
            {
              name: "Onshape",
              url: "https://www.onshape.com/en/education/",
              why: "Parametrický CAD v prohlížeči, sestavy a týmová práce nad jedním modelem.",
              note: "Pro školy zdarma, ale každý žák potřebuje vlastní účet. Přihlášení školním Microsoftem je až v placené verzi.",
            },
            {
              name: "Autodesk Viewer",
              url: "https://viewer.autodesk.com/",
              why: "Prohlížení a měření cizího CAD modelu – role technologa nebo zákazníka.",
              note: "Model nahraje učitel s účtem, žák si ho otevře odkazem bez přihlášení. Pozor: odkaz platí 30 dnů.",
            },
            {
              name: "Wokwi",
              url: "https://wokwi.com/",
              why: "Simulace Arduina a ESP32 – zapojení i program bez fyzického hardwaru.",
              note: "Spustí se bez přihlášení. Bez účtu je projekt vázaný na jedno zařízení a je veřejný.",
            },
          ],
        },
        {
          subject: "Stavebnictví",
          icon: "stavebnictvi",
          what: "3D model stavby, kontrola cizí dokumentace a rychlý výpočet nosníku.",
          tools: [
            {
              name: "SketchUp for Schools",
              url: "https://edu.sketchup.com/",
              why: "3D modelování staveb a konstrukčních detailů v prohlížeči.",
              note: "Zdarma pro školy, ale musí ho povolit správce školní domény.",
            },
            {
              name: "Autodesk Viewer",
              url: "https://viewer.autodesk.com/",
              why: "Prohlížení modelů a výkresů včetně IFC a Revitu, měření a připomínky.",
              note: "Nahrání vyžaduje účet, prohlížení odkazem ne. Odkaz platí 30 dnů.",
            },
            {
              name: "SkyCiv Beam",
              url: "https://skyciv.com/free-tools/",
              why: "Kontrola ručního výpočtu nosníku – reakce, momenty, průhyb.",
              note: "Základní výpočet bez registrace, ale s limitem, bez uložení a s rozmazanými výsledky napětí.",
            },
          ],
        },
        {
          subject: "Hudební výchova",
          icon: "hudebni-vychova",
          what: "Nástroj, na kterém je harmonie vidět a cítit v rukou dřív, než ji žák umí pojmenovat.",
          tools: [
            {
              name: "Gesture Synth",
              url: "https://gesture-synth-weld.vercel.app/",
              why: "Hraní akordů rukama před kamerou. Levá ruka určuje stupeň (počet prstů I–VII) a náklonem dur nebo moll, pravá obrat a septakord; výška ruky je hlasitost. Do hodiny se hodí přesně na to, co se z tabule vysvětluje těžko – že akord má stupeň, pohlaví a obrat. Žák si vyzkouší I–IV–V–I, uslyší rozdíl mezi durem a mollem jako otočení dlaně a na obratech pozná, že jde pořád o tentýž akord. Vybrat jde tónina i nástroj (smyčce, žestě, tři syntezátory), takže se dá ukázat i to, jak stejná harmonie zní jinou barvou.",
              note: "Zdarma, bez účtu, potřebuje ale povolit kameru a slušné světlo. Rozhraní je anglicky. Sledování rukou běží v prohlížeči (MediaPipe od Googlu) – obraz z kamery se nikam neodesílá, jen se jednorázově stáhne model. Autorem je Eric Wei. Je i režim pro jednu ruku.",
            },
          ],
        },
      ],
    },
    nastroje: {
      heading: "Čím začít, než něco vyzkouším",
      disclaimer:
        "Tohle ještě nejsou ověřené postupy nahoře – tyhle nástroje jsem sám nezměřil, takže ti neřeknu, kolik času ušetří. Je to mapa, kde co hledat, s čím u toho počítat a jak se do toho pustit. Co z toho projde mou vlastní přípravou, popíšu výš i s časem.",
      labelNavod: "Jak začít",
      labelPouziti: "K čemu to použiješ",
      credit: "Výběr kategorií vznikl podle databáze AI nástrojů na aidetem.cz.",
      creditUrl: "https://aidetem.cz/databaze-ai-nastroju-a-aplikaci-s-navody/",
      items: [
        {
          kategorie: "Čím psát",
          what: "Univerzální pomocník na text. Rozdíl mezi nimi je hlavně v tom, k jakému účtu tě pustí škola.",
          icon: "chat",
          tools: [
            {
              name: "Microsoft Copilot",
              url: "https://copilot.microsoft.com",
              why: "Nejblíž tomu, co škola nejspíš už má – přihlásíš se školním účtem a zůstaneš v prostředí Microsoftu.",
              navod:
                "Přihlas se školním účtem, ne osobním – ochrana dat platí jen u toho školního. Do prvního zadání dej vždycky tři věci: kdo jsi, pro koho to je a kolik na to máš času („Učím informatiku v prvním ročníku SŠ, potřebuju aktivitu na 20 minut na…“). Bez nich dostaneš obecnou vatu, kterou stejně přepíšeš.",
              pouziti:
                "Na přípravy, které se opakují: z osnovy tématu vygeneruješ pět kontrolních otázek na konec hodiny, zadání navíc pro rychlíky nebo shrnutí na tabuli. Práce žáků do něj neposílej – ani se školním účtem k tomu není důvod.",
              note: "Zdarma, česky. Se školním účtem nabízí Microsoft ochranu dat, ale zapíná ji správce – ověř si u něj, jak to má vaše škola nastavené.",
            },
            {
              name: "Google Gemini",
              url: "https://gemini.google.com",
              why: "Volba pro školy, které jedou na Google Workspace; česky umí a drží se v témže účtu jako Disk a Učebna.",
              navod:
                "Přihlas se školním účtem Google. Hlavní výhoda je, že mu můžeš povolit přístup na svůj Disk – pak nemusíš nic vkládat a rovnou řekneš, ať z existujícího materiálu udělá osnovu, otázky nebo shrnutí pro žáky.",
              pouziti:
                "Máš na Disku loňskou prezentaci a potřebuješ z ní letos pracovní list? Necháš ho sáhnout přímo na ten soubor a přepsat ho do úkolů. Ušetří to přepisování, ne přemýšlení – obsah si stejně projdi.",
              note: "Chce účet Google. U žákovských účtů rozhoduje nastavení školy a věková hranice – sám si to žák neodemkne.",
            },
            {
              name: "ChatGPT",
              url: "https://chatgpt.com",
              why: "Nejrozšířenější, takže ho žáci nejspíš už znají. Zvládne text i obrázky a česky mluví dobře.",
              navod:
                "Zkusíš ho i bez účtu, jen se ti neuloží historie. Nejrychlejší zisk pro učitele není psaní od nuly, ale úpravy: vlož vlastní hotové zadání a nech si k němu udělat variantu B, klíč nebo tři těžší otázky. S cizím textem si poradí líp než s prázdnou stránkou.",
              pouziti:
                "Nejlíp poslouží na varianty: z hotového testu uděláš skupinu B, z jednoho zadání tři obtížnosti, z dlouhého textu verzi pro žáka, který čte pomaleji.",
              note: "Bez účtu jen omezeně, plné funkce chtějí registraci. Podmínky žádají věk 13+ a u nezletilých souhlas rodiče.",
            },
          ],
        },
        {
          kategorie: "Čím to ukázat",
          what: "Když potřebuješ vizuál do materiálu a nechceš ho hledat ve fotobance ani řešit licenci cizí fotky.",
          icon: "obraz",
          tools: [
            {
              name: "Zoner AI",
              url: "https://zonerai.com/cs/image-creator/",
              why: "Generátor obrázků od české firmy. Zadáš popis česky a hned generuješ – nejnižší práh ze všech tady.",
              navod:
                "Nic nezakládáš – napiš popis česky rovnou do pole na stránce a dej Generovat. Popiš scénu, styl i to, co má být v popředí; jedno slovo („traktor“) dá obrázek, který stejně nepoužiješ.",
              pouziti:
                "Když do pracovního listu potřebuješ obrázek, který ve fotobance není – konkrétní stroj v konkrétní situaci, ilustrace přesně k tvému zadání, obrázek na titulní stranu.",
              note: "Zdarma a bez registrace, celé česky. Po otevření vyskočí lišta se souhlasem s cookies.",
            },
            {
              name: "Napkin AI",
              url: "https://www.napkin.ai/",
              why: "Vložíš hotový text a on z něj udělá diagram nebo schéma. Nic se nepromptuje, což je při přípravě rychlejší.",
              navod:
                "Zkopíruj do něj hotový odstavec a on nabídne několik diagramů, ze kterých vybereš. Nejlíp funguje na text, který už strukturu má – kroky postupu, srovnání dvou věcí, příčina a následek. Na souvislé vyprávění je krátký.",
              pouziti:
                "Máš odstavec teorie a chceš z něj schéma na snímek. Vložíš text z vlastní přípravy a vybereš si diagram – rychlejší než skládat tvary v PowerPointu.",
              note: "Chce účet, rozhraní je anglicky.",
            },
            {
              name: "Ideogram",
              url: "https://ideogram.ai",
              why: "Z generátorů obrázků nejlíp zvládá čitelný text uvnitř obrázku – použitelné na plakát nebo nadpis.",
              navod:
                "Text, který má být v obrázku, dej do popisu v uvozovkách – jinak si ho model přepíše po svém. Sahej po něm jen tam, kde má být nápis součástí obrázku; na běžnou ilustraci ti stačí Zoner a nemusíš zakládat účet.",
              pouziti:
                "Plakát na dveře učebny, titulek do prezentace, cedule na projektový den. Všude, kde má být nápis součástí obrázku a nemá vypadat jako slepenec.",
              note: "Chce účet, zdarma s denním limitem. Anglicky.",
            },
            {
              name: "Adobe Firefly",
              url: "https://firefly.adobe.com",
              why: "Trénovaný na licencovaném obsahu, takže je u výstupů nejmenší riziko sporu o autorská práva.",
              navod:
                "Přihlas se účtem Adobe a hlídej si kredity – po vyčerpání měsíčního přídělu generování zpomalí. Ber ho na obrázky, které půjdou ven ze školy (web, ročenka, plakát na dveře), právě kvůli tomu nižšímu riziku.",
              pouziti:
                "Obrázky, které opustí školu: web školy, ročenka, plakát na den otevřených dveří. Tam se nižší nejistota kolem práv vyplatí víc než rychlost.",
              note: "Chce účet Adobe, zdarma s měsíčním přídělem kreditů. Anglicky.",
            },
            {
              name: "Gamma",
              url: "https://gamma.app",
              why: "Z osnovy udělá celou prezentaci i s obsahem, ne jen prázdnou šablonu.",
              navod:
                "Vlož osnovu po bodech, ne jedno téma – z bodů postaví strukturu, ze samotného tématu si obsah vymyslí. Výstup ber jako první verzi a projdi fakta: doplňuje je i tam, kde jsi nic nezadal.",
              pouziti:
                "První verze prezentace k tématu, které učíš poprvé. Dá ti strukturu a rozvržení snímků; obsah pak přepíšeš po svém, ale nezačínáš od prázdné stránky.",
              note: "Chce účet, zdarma s omezeným počtem kreditů. Anglicky.",
            },
          ],
        },
        {
          kategorie: "Co pustit žákům",
          what: "Dvě věci, které nejsou o generování, ale o tom, aby žák pochopil, jak se AI učí.",
          icon: "trida",
          tools: [
            {
              name: "Teachable Machine",
              url: "https://teachablemachine.withgoogle.com",
              why: "Žák natrénuje z webkamery vlastní model za pár minut. Nejnázornější způsob, jak ukázat, co je trénovací sada – a co se stane, když je jednostranná.",
              navod:
                "Get Started → Image Project → Standard. Nasbírej dvě třídy asi po třiceti snímcích z webkamery, natrénuj a hned zkoušej. Nejsilnější moment hodiny přijde, když model natrénuješ schválně jen na jednom žákovi a pak před třídou ukážeš, že ostatní nepozná.",
              pouziti:
                "Patnáct minut hodiny o strojovém učení: dvojice natrénují model, který rozezná dvě věci na lavici, a pak si zkusí, čím ho dokážou rozbít.",
              note: "Zdarma, běží v prohlížeči a k trénování účet nepotřebuje; uložení modelu do cloudu už účet Google chce. Rozhraní anglicky.",
            },
            {
              name: "Experiments with Google",
              url: "https://experiments.withgoogle.com",
              why: "Sbírka hravých pokusů, ze které se dá vybrat pětiminutová ukázka na začátek hodiny.",
              navod:
                "Nevybírej za pochodu před třídou – projdi si to předem a vyber jeden pokus. Do hodiny o strojovém učení sedí Quick, Draw!: žáci kreslí, model hádá a je na tom vidět, z čeho se učí a kde má mezery.",
              pouziti:
                "Pětiminutová rozcvička na začátek hodiny nebo výplň času, který zbyde po písemce.",
              note: "Zdarma, bez účtu, anglicky. Kvalita se kus od kusu liší – vyber a vyzkoušej si to předem.",
            },
          ],
        },
      ],
    },
    soukromi: {
      title: "Co web ukládá",
      intro:
        "Krátce a bez právničiny: nic, podle čeho by šlo poznat, kdo jsi. Níž je napsané, co to znamená u každé části webu, kdo ho provozuje a kde technicky běží.",
      updated: "Naposledy upraveno 6. 9. 2026.",
      zpet: "Zpátky na web",
      sekce: [
        {
          nadpis: "Kdo web provozuje",
          odstavce: [
            "Web provozuje Mgr. Karel Hlas jako fyzická osoba. Není to web školy, i když materiály vznikají a ověřují se ve výuce na Střední průmyslové škole strojní a stavební Tábor.",
            "Kontakt: hlas@sps-tabor.cz",
          ],
        },
        {
          nadpis: "Materiály",
          odstavce: [
            "Prohlížet i stahovat můžeš bez přihlášení. Nic se při tom neodesílá a nic se o tobě neukládá.",
          ],
        },
        {
          nadpis: "Virtuální Windows",
          odstavce: [
            "Do prostředí se vstupuje kódem, který dostaneš od učitele. Kód není účet: neváže se k tobě, nic si k němu neukládáme a je společný pro celou třídu.",
            "Co v prostředí uděláš – jaká okna otevřeš, co nakreslíš v Malování, jak daleko dojdeš v úlohách – zůstává v tomhle prohlížeči a na server se neodesílá. Když si smažeš data prohlížeče, zmizí to i tobě.",
            "Dřív si tu žáci mohli zakládat účet a postup se ukládal na server. To bylo 1. 9. 2026 zrušené a 4. 9. 2026 bylo smazané i úložiště včetně účtů, které do té doby vznikly.",
          ],
        },
        {
          nadpis: "SQL hřiště",
          odstavce: ["Rozepsané dotazy zůstávají v tomhle prohlížeči. Na server se neodesílají."],
        },
        {
          nadpis: "Návštěvnost",
          odstavce: [
            "Web měří návštěvnost přes Vercel Analytics. Nepoužívá cookies a data jsou souhrnná – kolik lidí kterou stránku otevřelo, odkud přišli, na jakém zařízení. Jednotliví návštěvníci se z toho nepoznají a nespojují se s ničím jiným.",
          ],
        },
        {
          nadpis: "Kde web technicky běží",
          odstavce: [
            "Web běží na Vercelu. Požadavek nejdřív obslouží nejbližší okraj sítě – z Česka je to Frankfurt – ale serverová část běží ve Spojených státech (oblast iad1, Washington). Vercel je americká společnost.",
            "Znamená to, že technické údaje, které vzniknou při každém požadavku na jakýkoli web (IP adresa, čas, typ prohlížeče), se zpracují i mimo Evropskou unii. Vercel k tomu má standardní smluvní doložky.",
            "Data se nikomu neprodávají ani nepředávají dál.",
          ],
        },
        {
          nadpis: "Jak dlouho",
          odstavce: [
            "Na serveru se o návštěvnících nedrží nic. Souhrnnou návštěvnost si uchovává Vercel podle svých podmínek.",
            "Co je uložené v tvém prohlížeči, tam zůstane, dokud si to nesmažeš.",
          ],
        },
        {
          nadpis: "Co s tím můžeš udělat",
          odstavce: [
            "Protože o tobě nic neukládáme, není co vymazat ani opravit. Kdyby ti přesto něco vrtalo hlavou, napiš na hlas@sps-tabor.cz.",
            "Data, která si prostředí uložilo u tebe, smažeš v nastavení prohlížeče (historie → data webů) nebo přímo v prostředí.",
          ],
        },
        {
          nadpis: "Nezletilí",
          odstavce: [
            "Prostředí používají žáci střední školy. Proto je postavené tak, aby se nezadávalo nic osobního: žádný účet, žádné jméno, žádný e-mail, jen kód od učitele.",
          ],
        },
      ],
    },
    materials: {
      kicker: "Materiály do informatiky",
      heading: "Vyber si téma",
      sub: "Hotové materiály ke stažení a úpravě – klikni na téma a procházej.",
    },
    contact: {
      kicker: "Kontakt",
      heading: "Ozvi se mi",
      intro:
        "Nejraději vše domluvíme osobně nebo e-mailem. Konzultace si rezervuj přes EduPage.",
      school: "Střední průmyslová škola strojní a stavební Tábor",
      addressLabel: "Adresa",
      emailLabel: "Školní e-mail",
      emailPersonalLabel: "Osobní e-mail",
      phoneLabel: "Telefon",
      cabinetLabel: "Kabinet",
      consultLabel: "Konzultace",
      consultValue: "Rezervace přes EduPage",
      mapLink: "Zobrazit na mapě",
      socialsTitle: "Sleduj mě",
    },
    footer: {
      role: "Učitel informatiky a angličtiny · SPŠ Tábor",
      // „Všechna práva vyhrazena“ tu stálo proti slibu pod bankou, že se
      // materiály smí volně používat i upravovat. Navíc téma AI vychází
      // z materiálů pod CC BY-NC-SA, jejíž podmínka „zachovej licenci“
      // se s vyhrazenými právy vylučuje.
      rights: "Materiály sdílím pod licencí",
      // Vazba na školu stojí v patičce schválně: z webu se dá jinak vyčíst
      // jen to, KDE autor učí, ne že materiály vznikají v rámci té práce.
      // Pro čtenáře je to jedna věta navíc, pro posuzovatele projektu je to
      // ten rozdíl mezi soukromou stránkou a výstupem školy.
      affiliation:
        "Materiály vznikají a ověřují se ve výuce na Střední průmyslové škole strojní a stavební Tábor.",
      licenseName: "CC BY-NC-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.cs",
      analytics: "Návštěvnost měřím anonymně, bez cookies.",
      soukromiOdkaz: "Co web ukládá",
      top: "Nahoru",
      // Kurz je vlastní stránka mimo jednostránkový web – bez tohohle odkazu
      // se k němu dá dojít jen přes dlaždici Databáze v bance.
      sqlCourse: "Kurz SQL v prohlížeči",
      windows: "Virtuální Windows 11",
    },
    ui: { theme: "Přepnout světlý/tmavý režim" },
  },

  en: {
    nav: {
      about: "About",
      lessons: "Lessons",
      contact: "Contact",
      bank: "Materials for CS",
      brand: "Teaching materials",
      brandSub: "Karel Hlas · SPŠ Tábor",
    },
    hero: {
      badge: "Teaching materials · free",
      headline: "Ready-made lesson plans and materials, not just for CS",
      role: "Computer Science & English teacher",
      tagline:
        "For secondary schools. My own files are free to download and edit; the SQL course and virtual Windows run right in the browser. Workbooks by other authors link to the original.",
      byline: "Curated by Karel Hlas · CS teacher at SPŠ Tábor",
      stats: "{files} files · {topics} topics · all secondary years",
      sample: "Sample materials",
      reading: "Interesting articles",
      ctaLessons: "Browse the materials",
      ctaContact: "About me",
      scroll: "Materials",
    },
    about: {
      kicker: "About me",
      heading: "A teacher who loves technology",
      paragraphs: [
        "I teach Computer Science and English at the Secondary Technical School of Mechanical and Civil Engineering in Tábor, Czech Republic. I studied at the Technical Lyceum here and went on to a teaching degree at the Faculty of Education, University of South Bohemia.",
        "In my lessons I look for practical, clear ways to make modern technology click for students. Outside school I enjoy web development, programming and bowling.",
      ],
      eduTitle: "Education",
      expTitle: "Experience",
      interestsTitle: "What I enjoy",
      badgesTitle: "Certificates & badges",
      interests: ["Modern technology", "Education", "Web development", "Programming", "Bowling"],
      education: [
        {
          period: "2006–2015",
          place: "Primary & Nursery School Sezimovo Ústí",
          detail: "9. května 489, Tábor district",
        },
        {
          period: "2015–2019",
          place: "Secondary Technical School of Mechanical and Civil Engineering",
          detail: "Technical Lyceum – programming & robotics",
        },
        {
          period: "2019–2026",
          place: "Faculty of Education, University of South Bohemia",
          detail: "Bachelor's & Master's – teaching Computer Science & English, lower secondary",
        },
      ],
      experience: [
        {
          period: "Early on",
          place: "Primary & Nursery School Malšice",
          detail: "Teaching assistant, then Computer Science teacher (lower secondary)",
        },
        {
          period: "Now",
          place: "Secondary Technical School of Mechanical and Civil Engineering",
          detail: "Computer Science & English teacher",
        },
      ],
    },
    lessons: {
      kicker: "Proven in the classroom",
      heading: "Computer Science lessons",
      intro:
        "This is what my teaching looks like in practice. Pick a year and you get a timeline of the topics I actually cover with my classes.",
      subject: "Computer Science",
      pick: "Click to reveal the timeline",
      goalLabel: "Goal",
      topicsLabel: "What we'll cover",
      materialsLabel: "Materials",
      noMaterials: "Materials will be added gradually.",
      soon: "soon",
      teacherNoteLabel: "For teachers",
      audienceTeacher: "For teachers",
      audienceStudent: "For students",
      audienceBoth: "For teachers & students",
    },
    aihub: {
      kicker: "AI Hub",
      heading: "Using AI to save time around the lesson",
      badge: "New section",
      intro:
        "Guides for a teacher's own work, not for the lesson: what helps when preparing, and what comes afterwards — marking, evaluating and reflecting. Nothing theoretical and nothing aimed at students. Each guide says what I tried it on, how much time it saved, and whether it was worth it at all.",
      emptyTitle: "No verified write-ups yet, and that is correct.",
      emptyText:
        "The first ones will appear once I have tried them on my own prep and marking. AI tips nobody has actually tried are all over the internet — and you will find a few just below. The point of this place is that the write-ups up here also say how much time they really saved. Including the ones that saved none.",
      labelCil: "What needed doing",
      labelNastroj: "AI tool and method",
      labelOvereni: "What I tried it on",
      labelUspora: "Time saved",
      labelReflexe: "What worked and what did not",
      labelDoporuceni: "When it transfers",
      labelPrilohy: "Attachments",
      vysledekVyplatilo: "Worth it",
      vysledekNevyplatilo: "Not worth it",
      fazePred: "Before the lesson",
      fazePo: "After the lesson",
      licenceNote:
        "The AI Hub is run at Střední průmyslová škola strojní a stavební Tábor as part of my work as the school's ICT coordinator. I publish my own materials here, or other people's with their permission; everything is shared under the same licence as the rest of the site.",
      countOne: "output",
      countFew: "outputs",
      countMany: "outputs",
    },
    cross: {
      kicker: "For other subjects",
      heading: "Not just for CS lessons",
      badge: "New section",
      intro:
        "Under the revised Czech curriculum, digital skills are taught across all subjects, not only in computer science. Open your subject and you will find tools for the lesson; Czech and Maths also link to Karel Klatovský's workbooks on his OneDrive. Each tool says whether it needs an account, whether it is in Czech, and what will catch you out the first time.",
      note:
        "Tools verified as of August 2026 – cloud services change their terms, so click through before the lesson. Teach another subject and use something good in class? Email me and I will add it here, credited to you.",
      inviteTitle: "Missing your subject?",
      inviteText: "Tell me what you use in your lessons.",
      // Not „to download": this section only links to the author so far.
      materialsLabel: "Materials for this subject",
      toolsLabel: "Tools for lessons",
      download: "Download",
      items: [
        {
          subject: "Czech language",
          icon: "cesky-jazyk",
          what: "Formatting, styles and long documents – for term papers and essays.",
          tool: "Word",
        },
        {
          subject: "Maths",
          icon: "matematika",
          what: "Tables, formulas and charts on data that actually mean something.",
          tool: "Excel",
          tools: [
            {
              name: "GeoGebra",
              url: "https://www.geogebra.org/calculator",
              why: "Function graphs, geometry and dynamic constructions.",
              note: "Free, no account, fully in Czech. The site shows an advertising consent dialog.",
            },
            {
              name: "Desmos",
              url: "https://www.desmos.com/calculator",
              why: "Fast graphing calculator and regression from measured data.",
              note: "Free, no account. Czech localisation is only partial.",
            },
          ],
        },
        {
          subject: "Physics",
          icon: "fyzika",
          what: "Simulations where students change one variable and watch what happens.",
          tools: [
            {
              name: "PhET",
              url: "https://phet.colorado.edu/cs/",
              why: "Mechanics, electricity, optics, thermodynamics – built for measuring and hypotheses.",
              note: "Free, no account, by the University of Colorado. Every simulation is available in Czech.",
            },
            {
              name: "Falstad Circuit Simulator",
              url: "https://www.falstad.com/circuit/",
              why: "Electric circuits with live voltage and current traces.",
              note: "Free, no account. English by default; Czech can be switched on but is incomplete.",
            },
            {
              name: "GeoGebra",
              url: "https://www.geogebra.org/calculator",
              why: "Processing measured data, graphs and regression.",
              note: "Free, no account, in Czech. The site shows an advertising consent dialog.",
            },
          ],
        },
        {
          subject: "Chemistry",
          icon: "chemie",
          what: "A virtual lab and a real chemical database – preparation before the real experiment.",
          tools: [
            {
              name: "PubChem",
              url: "https://pubchem.ncbi.nlm.nih.gov/",
              why: "Database of substances: formulas, properties, safety data, 3D models.",
              note: "Free, no account, run by the US NCBI. English only.",
            },
            {
              name: "ChemCollective",
              url: "https://chemcollective.org/vlabs",
              why: "Virtual lab: solutions, titration, pH, stoichiometry.",
              note: "Free, no account, runs in the browser (no Java). English; the licence forbids edits and translation.",
            },
            {
              name: "MolView",
              url: "https://app.molview.com/",
              why: "Turns a drawn formula straight into a 3D model of the molecule.",
              note: "Free, no account. Loads Google Analytics.",
            },
          ],
        },
        {
          subject: "Descriptive geometry",
          icon: "deskriptivni-geometrie",
          what: "Sections and intersections students can rotate and check against their drawing.",
          tools: [
            {
              name: "GeoGebra 3D",
              url: "https://www.geogebra.org/3d",
              why: "Plane–solid intersections, sections, nets, transformations.",
              note: "Free, no account, in Czech. Saving constructions requires sign-in.",
            },
            {
              name: "SketchUp for Schools",
              url: "https://edu.sketchup.com/",
              why: "Model a solid and check the section against a hand-drawn view.",
              note: "Free for schools, but the domain administrator must enable it.",
            },
          ],
        },
        {
          subject: "Mechanical engineering",
          icon: "strojirenstvi",
          what: "Cloud CAD, reading someone else's model and simulating electronics.",
          tools: [
            {
              name: "Onshape",
              url: "https://www.onshape.com/en/education/",
              why: "Parametric CAD in the browser, assemblies and teamwork on one model.",
              note: "Free for education, but every student needs a personal account. Signing in with a school Microsoft account only works in the paid tier.",
            },
            {
              name: "Autodesk Viewer",
              url: "https://viewer.autodesk.com/",
              why: "Viewing and measuring someone else's CAD model.",
              note: "Uploading needs an account, viewing via link does not. The link expires after 30 days.",
            },
            {
              name: "Wokwi",
              url: "https://wokwi.com/",
              why: "Arduino and ESP32 simulation – wiring and code without hardware.",
              note: "Runs without sign-in. Without an account a project stays on one device and is public.",
            },
          ],
        },
        {
          subject: "Civil engineering",
          icon: "stavebnictvi",
          what: "3D building models, checking documentation and quick beam calculations.",
          tools: [
            {
              name: "SketchUp for Schools",
              url: "https://edu.sketchup.com/",
              why: "3D modelling of buildings and construction details in the browser.",
              note: "Free for schools, but the domain administrator must enable it.",
            },
            {
              name: "Autodesk Viewer",
              url: "https://viewer.autodesk.com/",
              why: "Viewing models and drawings including IFC and Revit, measuring and commenting.",
              note: "Uploading needs an account, viewing via link does not. The link expires after 30 days.",
            },
            {
              name: "SkyCiv Beam",
              url: "https://skyciv.com/free-tools/",
              why: "Checking a hand-calculated beam – reactions, moments, deflection.",
              note: "Basic calculation without registration, but limited, nothing saved and stress results blurred.",
            },
          ],
        },
        {
          subject: "Music",
          icon: "hudebni-vychova",
          what: "An instrument where harmony is visible and felt in the hands before a pupil can name it.",
          tools: [
            {
              name: "Gesture Synth",
              url: "https://gesture-synth-weld.vercel.app/",
              why: "Playing chords with your hands in front of the camera. The left hand sets the scale degree (fingers I–VII) and major or minor by tilt, the right hand the inversion and seventh; hand height is volume. It suits exactly what is hard to explain from the board – that a chord has a degree, a quality and an inversion. A pupil plays I–IV–V–I, hears major turn to minor as a turn of the palm, and discovers through inversions that it is still the same chord. Key and timbre are selectable (strings, horns, three synths), so you can also show the same harmony in a different colour.",
              note: "Free, no account, but it needs camera permission and decent light. The interface is in English. Hand tracking runs in the browser (Google's MediaPipe) – the camera image is never uploaded, only the model is downloaded once. Created by Eric Wei. There is also a one-handed mode.",
            },
          ],
        },
      ],
    },
    nastroje: {
      heading: "Where to start, before I have tested anything",
      disclaimer:
        "These are not the verified write-ups above – I have not measured these tools myself, so I cannot tell you how much time they save. This is a map: where to find them, what to expect, and how to get going. Whatever survives my own lesson prep moves up there, with the numbers.",
      labelNavod: "How to start",
      labelPouziti: "What you use it for",
      credit: "The categories follow the AI tool database at aidetem.cz.",
      creditUrl: "https://aidetem.cz/databaze-ai-nastroju-a-aplikaci-s-navody/",
      items: [
        {
          kategorie: "For writing",
          what: "The general-purpose helper for text. What mostly separates them is which account your school lets you use.",
          icon: "chat",
          tools: [
            {
              name: "Microsoft Copilot",
              url: "https://copilot.microsoft.com",
              why: "Closest to what your school probably already has – you sign in with the school account and stay inside Microsoft.",
              navod:
                "Sign in with the school account, not a personal one – the data protection only applies to the school one. Always give your first prompt three things: who you are, who it is for, and how long you have. Without them you get generic filler you will rewrite anyway.",
              pouziti:
                "For the prep that repeats: turn a topic outline into five check questions for the end of the lesson, an extra task for the fast finishers, or a summary for the board. Do not put pupils' work into it – even with a school account there is no reason to.",
              note: "Free. With a school account Microsoft offers data protection, but an administrator switches it on – check how your school has it set.",
            },
            {
              name: "Google Gemini",
              url: "https://gemini.google.com",
              why: "The choice for schools on Google Workspace; it stays in the same account as Drive and Classroom.",
              navod:
                "Sign in with the school Google account. The real advantage is that you can grant it access to your Drive – then you paste nothing and simply ask it to turn an existing handout into an outline, questions or a summary.",
              pouziti:
                "You have last year's deck on Drive and need a worksheet from it? Let it reach the file directly and turn it into tasks. It saves the retyping, not the thinking – check the content anyway.",
              note: "Needs a Google account. For pupil accounts the school's settings and age limits decide – a pupil cannot unlock it alone.",
            },
            {
              name: "ChatGPT",
              url: "https://chatgpt.com",
              why: "The most widely used one, so your pupils likely know it already. Handles both text and images.",
              navod:
                "You can try it without an account; you just lose your history. The fastest win is not writing from scratch but editing: paste your own finished assignment and ask for a variant B, an answer key, or three harder questions.",
              pouziti:
                "It serves best for variants: turn a finished test into a group B, one task into three difficulty levels, a long text into a version for a pupil who reads more slowly.",
              note: "Limited without an account; full features need signing up. The terms require age 13+ and a parent's consent for minors.",
            },
          ],
        },
        {
          kategorie: "For showing it",
          what: "For when a handout needs a visual and you would rather not hunt through a stock library or sort out someone's licence.",
          icon: "obraz",
          tools: [
            {
              name: "Zoner AI",
              url: "https://zonerai.com/cs/image-creator/",
              why: "An image generator from a Czech company. You type the description and generate straight away – the lowest barrier here.",
              navod:
                "Nothing to set up – type the description straight into the field on the page and hit generate. Describe the scene, the style and what belongs in the foreground; a single word gives you a picture you will not use.",
              pouziti:
                "When a worksheet needs a picture no stock library has – a specific machine in a specific situation, an illustration matching your exact task, a cover image.",
              note: "Free, no sign-up, entirely in Czech. A cookie consent bar appears when you open it.",
            },
            {
              name: "Napkin AI",
              url: "https://www.napkin.ai/",
              why: "You paste finished text and it turns it into a diagram. No prompting, which is faster when preparing.",
              navod:
                "Paste in a finished paragraph and it offers several diagrams to choose from. It works best on text that already has a shape – steps of a procedure, a comparison, cause and effect. On flowing prose it falls short.",
              pouziti:
                "You have a paragraph of theory and want a diagram from it for a slide. Paste the text from your own prep and pick a diagram – faster than assembling shapes in PowerPoint.",
              note: "Needs an account; the interface is in English.",
            },
            {
              name: "Ideogram",
              url: "https://ideogram.ai",
              why: "Of the image generators it handles legible text inside the picture best – usable for a poster or a heading.",
              navod:
                "Put the text you want inside the image in quotation marks – otherwise the model rewrites it its own way. Reach for it only when the lettering is part of the picture; for an ordinary illustration Zoner is enough.",
              pouziti:
                "A poster for the classroom door, a title slide, a sign for a project day. Anywhere the lettering belongs to the picture and should not look glued on.",
              note: "Needs an account, free with a daily limit. In English.",
            },
            {
              name: "Adobe Firefly",
              url: "https://firefly.adobe.com",
              why: "Trained on licensed content, so its output carries the lowest risk of a copyright dispute.",
              navod:
                "Sign in with an Adobe account and watch your credits – once the monthly allowance runs out, generating slows down. Use it for images that leave the school, precisely because of that lower risk.",
              pouziti:
                "Images that leave the school: the school website, a yearbook, an open-day poster. There the lower uncertainty about rights matters more than speed.",
              note: "Needs an Adobe account, free with a monthly credit allowance. In English.",
            },
            {
              name: "Gamma",
              url: "https://gamma.app",
              why: "Turns an outline into a whole deck including the content, not just an empty template.",
              navod:
                "Give it a bulleted outline rather than a single topic – from bullets it builds your structure, from a bare topic it invents its own. Treat the result as a first draft and check the facts.",
              pouziti:
                "A first draft of a deck for a topic you are teaching for the first time. It gives you the structure and the slide layout; you rewrite the content yourself, but not from a blank page.",
              note: "Needs an account, free with limited credits. In English.",
            },
          ],
        },
        {
          kategorie: "For putting in front of a class",
          what: "Two things that are not about generating, but about pupils understanding how AI learns.",
          icon: "trida",
          tools: [
            {
              name: "Teachable Machine",
              url: "https://teachablemachine.withgoogle.com",
              why: "A pupil trains their own model from the webcam in minutes. The clearest way to show what a training set is – and what happens when it is one-sided.",
              navod:
                "Get Started → Image Project → Standard. Collect two classes of about thirty webcam shots each, train, and test right away. The strongest moment comes when you deliberately train it on one pupil only and then show that it fails to recognise anyone else.",
              pouziti:
                "Fifteen minutes of a lesson on machine learning: pairs train a model that tells apart two objects on the desk, then try to find what breaks it.",
              note: "Free, runs in the browser and needs no account to train; saving the model to the cloud does need a Google account. Interface in English.",
            },
            {
              name: "Experiments with Google",
              url: "https://experiments.withgoogle.com",
              why: "A collection of playful experiments to pick a five-minute opener from.",
              navod:
                "Do not browse it in front of the class – go through it beforehand and pick one. For a lesson on machine learning, Quick, Draw! fits: pupils draw, the model guesses, and you can see what it learned from.",
              pouziti:
                "A five-minute warm-up at the start of a lesson, or something to fill the time left after a test.",
              note: "Free, no account, in English. Quality varies from one to the next – pick and try yours in advance.",
            },
          ],
        },
      ],
    },
    soukromi: {
      title: "What this site stores",
      intro:
        "Briefly and without legalese: nothing that could identify you. Below is what that means for each part of the site, who runs it and where it technically runs.",
      updated: "Last updated 6 September 2026.",
      zpet: "Back to the site",
      sekce: [
        {
          nadpis: "Who runs this site",
          odstavce: [
            "The site is run by Karel Hlas as a private individual. It is not a school website, although the materials are created and tested in lessons at the Secondary Technical School of Mechanical Engineering and Construction in Tábor.",
            "Contact: hlas@sps-tabor.cz",
          ],
        },
        {
          nadpis: "Materials",
          odstavce: [
            "You can browse and download them without signing in. Nothing is sent and nothing about you is stored.",
          ],
        },
        {
          nadpis: "Virtual Windows",
          odstavce: [
            "You enter the environment with a code from your teacher. The code is not an account: it is not tied to you, nothing is stored against it, and it is shared by the whole class.",
            "What you do inside – which windows you open, what you draw in Paint, how far you get in the tasks – stays in this browser and is never sent to a server. Clear your browser data and it is gone for you too.",
            "Pupils used to be able to create an account here, with progress stored on a server. That was removed on 1 September 2026, and on 4 September 2026 the storage itself was deleted, including the accounts created until then.",
          ],
        },
        {
          nadpis: "SQL playground",
          odstavce: ["Queries you are writing stay in this browser. They are not sent to a server."],
        },
        {
          nadpis: "Analytics",
          odstavce: [
            "The site measures traffic through Vercel Analytics. It uses no cookies and the data is aggregated – how many people opened which page, where they came from, on what device. Individual visitors cannot be identified from it and it is not linked to anything else.",
          ],
        },
        {
          nadpis: "Where the site technically runs",
          odstavce: [
            "The site runs on Vercel. A request is first handled by the nearest edge – from the Czech Republic that is Frankfurt – but the server part runs in the United States (region iad1, Washington). Vercel is an American company.",
            "This means the technical data produced by any request to any website (IP address, time, browser type) is also processed outside the European Union. Vercel has standard contractual clauses in place for this.",
            "No data is sold or passed on to anyone.",
          ],
        },
        {
          nadpis: "For how long",
          odstavce: [
            "Nothing about visitors is kept on the server. Aggregated traffic is retained by Vercel under its own terms.",
            "Whatever is stored in your browser stays there until you delete it.",
          ],
        },
        {
          nadpis: "What you can do about it",
          odstavce: [
            "Since nothing about you is stored, there is nothing to erase or correct. If something still bothers you, write to hlas@sps-tabor.cz.",
            "Data the environment saved on your device can be cleared in your browser settings (history → site data) or from inside the environment.",
          ],
        },
        {
          nadpis: "Minors",
          odstavce: [
            "The environment is used by secondary school pupils. That is why it is built so that nothing personal is ever entered: no account, no name, no e-mail, just a code from the teacher.",
          ],
        },
      ],
    },
    materials: {
      kicker: "Materials for CS",
      heading: "Pick a topic",
      sub: "Ready-made materials to download and edit – click a topic to browse.",
    },
    contact: {
      kicker: "Contact",
      heading: "Get in touch",
      intro:
        "I prefer to arrange things in person or by e-mail. Book a consultation via EduPage.",
      school: "Secondary Technical School of Mechanical and Civil Engineering, Tábor",
      addressLabel: "Address",
      emailLabel: "School e-mail",
      emailPersonalLabel: "Personal e-mail",
      phoneLabel: "Phone",
      cabinetLabel: "Office",
      consultLabel: "Consultations",
      consultValue: "Book via EduPage",
      mapLink: "View on map",
      socialsTitle: "Follow me",
    },
    footer: {
      role: "Computer Science & English teacher · SPŠ Tábor",
      rights: "Materials shared under",
      affiliation:
        "The materials are created and classroom-tested at Střední průmyslová škola strojní a stavební Tábor (Secondary Technical School, Tábor, Czechia).",
      licenseName: "CC BY-NC-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en",
      analytics: "Traffic is measured anonymously, without cookies.",
      soukromiOdkaz: "What this site stores",
      top: "Top",
      // Kurz je jen česky – ať to Angličan pozná dřív, než klikne.
      sqlCourse: "SQL course in the browser (in Czech)",
      windows: "Virtual Windows 11 (in Czech)",
    },
    ui: { theme: "Toggle light/dark mode" },
  },
};
