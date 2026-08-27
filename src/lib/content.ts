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
 * Nový odkaz = jeden řádek sem. Drž se čtyř až pěti položek; delší seznam
 * v úvodu přebíjí tlačítko k materiálům. Když přibude šestý, vyhoď nejstarší.
 *
 * `jazyk` se ukazuje jen tomu, komu je cizí – Čech vidí u anglických textů
 * „anglicky", Angličan u českých „in Czech".
 *
 * `pozor` říká, co člověka po kliknutí čeká (přihlášení, předplatné, limit).
 * Stejná konvence jako u nástrojů v sekci „Nejen do informatiky": web slibuje
 * materiály bez přihlašování, takže odkaz vedoucí na zeď musí být přiznaný
 * dřív, než na něj někdo klikne.
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
    title: "20 výzev a 10 myšlenek pro školní rok 2026/2027",
    source: "RVP.cz",
    url: "https://clanky.rvp.cz/clanek/24473/20-VYZEV-A-10-MYSLENEK-NEJEN-PRO-SKOLNI-ROK-2026-2027.html",
    logo: { src: "/images/clanky/rvp.png", pomer: 1.842 },
    jazyk: "cs",
  },
  {
    title: "AliExpress potají vytvářel zvukový otisk návštěvníků",
    source: "E-Bezpečí",
    url: "https://www.e-bezpeci.cz/index.php/clanky/5145-aliexpress-potaji-vytvarel-zvukovy-otisk-navstevniku-prozradila-ho-zavada-sluchatek",
    logo: { src: "/images/clanky/ebezpeci.png", pomer: 1.64 },
    jazyk: "cs",
  },
  {
    title: "Obrazovka jako digitální dudlík: varují pediatři",
    source: "E-Bezpečí",
    url: "https://www.e-bezpeci.cz/index.php/clanky/5138-obrazovka-jako-digitalni-dudlik-pediatri-varuji-pred-zavislosti-uz-u-nejmensich-deti",
    logo: { src: "/images/clanky/ebezpeci.png", pomer: 1.64 },
    jazyk: "cs",
  },
  {
    title: "Když pravidla používání AI ve školách vytvoří teenageři",
    source: "RVP.cz",
    url: "https://clanky.rvp.cz/clanek/24471/KDYZ-PRAVIDLA-POUZIVANI-AI-VE-SKOLACH-VYTVORI-TEENAGERI.html",
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
    licenseName: string;
    /** Odkaz na text licence – česká i anglická verze mají vlastní „deed“. */
    licenseHref: string;
    analytics: string;
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
        "Pro střední školy. Moje soubory si stáhneš i upravíš zdarma a bez přihlašování; kurz SQL a virtuální Windows běží rovnou v prohlížeči. U převzatých cvičebnic vede odkaz k jejich původnímu autorovi.",
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
      licenseName: "CC BY-NC-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.cs",
      analytics: "Návštěvnost měřím anonymně, bez cookies.",
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
        "For secondary schools. My own files are free to download and edit, no sign-up; the SQL course and virtual Windows run right in the browser. Workbooks by other authors link to the original.",
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
      licenseName: "CC BY-NC-SA 4.0",
      licenseHref: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en",
      analytics: "Traffic is measured anonymously, without cookies.",
      top: "Top",
      // Kurz je jen česky – ať to Angličan pozná dřív, než klikne.
      sqlCourse: "SQL course in the browser (in Czech)",
      windows: "Virtual Windows 11 (in Czech)",
    },
    ui: { theme: "Toggle light/dark mode" },
  },
};
