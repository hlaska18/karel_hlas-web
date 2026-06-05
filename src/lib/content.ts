export type Lang = "cs" | "en";

/**
 * Odkaz na sdílenou složku „Odevzdávárna" (školní SharePoint).
 * Necháváme pro případ, že bys ho chtěl znovu někam přidat.
 */
export const SUBMIT_URL =
  "https://spstabor-my.sharepoint.com/:f:/g/personal/hlas_sps-tabor_cz/IgBFhy4xgmXCRodNGHmGXstxAQ-g55Ax54MF6g1gE4AT0GA?e=cYZCrQ";

export const SITE = {
  name: "Karel Hlas",
  fullName: "Mgr. Karel Hlas",
  initials: "KH",
  // Web zatím běží zdarma na Vercelu. Až koupíš doménu karelhlas.xyz,
  // vrať tyto dvě hodnoty na "karelhlas.xyz" a přidej doménu ve Vercelu.
  domain: "karelhlas.vercel.app",
  url: "https://karelhlas.vercel.app",
  email: "hlas@sps-tabor.cz",
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

export const SOCIALS: Social[] = [
  { network: "instagram", handle: "@karelbowls", href: "https://instagram.com/karelbowls" },
  { network: "instagram", handle: "@viewsbykarel", href: "https://instagram.com/viewsbykarel" },
  { network: "youtube", handle: "@karelhlas", href: "https://www.youtube.com/@karelhlas" },
];

/* ───────────────────────── VÝUKA / ČASOVÁ OSA ─────────────────────────
 * Kurzy (ročníky) s tematickým plánem. Materiály doplňuj postupně do pole
 * `materials` u jednotlivých témat:
 *   { label: { cs: "Název", en: "Title" }, href: "https://...", kind: "doc" }
 * kind: "doc" | "slides" | "video" | "code" | "link"
 * Materiál s href "#" se zobrazí jako „brzy" (nečekateľný odkaz doplníš později).
 * Další ročník přidáš jako další objekt do pole COURSES.
 * ─────────────────────────────────────────────────────────────────────── */

export type Material = {
  label: { cs: string; en: string };
  href: string;
  kind?: "doc" | "slides" | "video" | "code" | "link";
};

/** Skupina materiálů = podsložka (rozbalí se po kliknutí). */
export type MaterialGroup = {
  label: { cs: string; en: string };
  items: Material[];
};

/** Položka v seznamu materiálů: buď jeden soubor/odkaz, nebo skupina. */
export type MaterialEntry = Material | MaterialGroup;

export type CurriculumItem = {
  month: { cs: string; en: string };
  title: { cs: string; en: string };
  goal: { cs: string; en: string };
  topics: { cs: string[]; en: string[] };
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
        materials: [],
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
        materials: [],
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
            "Information flow in IoT — device, gateway, cloud",
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
        materials: [],
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
            "Information flow in IoT — device, gateway, cloud",
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
  nav: { about: string; lessons: string; contact: string };
  hero: {
    badge: string;
    role: string;
    tagline: string;
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
    interests: string[];
    education: TimelineItem[];
    experience: TimelineItem[];
  };
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
  };
  contact: {
    kicker: string;
    heading: string;
    intro: string;
    school: string;
    addressLabel: string;
    emailLabel: string;
    phoneLabel: string;
    cabinetLabel: string;
    consultLabel: string;
    consultValue: string;
    mapLink: string;
    socialsTitle: string;
  };
  footer: { role: string; rights: string; top: string };
  ui: { theme: string };
};

export const t: Record<Lang, Dict> = {
  cs: {
    nav: { about: "O mně", lessons: "Výuka", contact: "Kontakt" },
    hero: {
      badge: "SPŠ Tábor · Informatika & Angličtina",
      role: "Učitel informatiky a angličtiny",
      tagline:
        "Hledám praktické a srozumitelné cesty, jak žákům přiblížit moderní technologie a jazyky.",
      ctaLessons: "Výuka a materiály",
      ctaContact: "Kontaktujte mě",
      scroll: "O mně",
    },
    about: {
      kicker: "O mně",
      heading: "Učitel, kterého baví technologie i lidé",
      paragraphs: [
        "Jsem učitel informatiky a angličtiny na Střední průmyslové škole strojní a stavební v Táboře. Vystudoval jsem zdejší Technické lyceum se zaměřením na programování a robotiku a poté bakalářské i magisterské studium na Pedagogické fakultě Jihočeské univerzity.",
        "Začínal jsem jako asistent pedagoga a učitel informatiky na druhém stupni základní školy, dnes učím na střední škole. Zajímají mě moderní technologie, vzdělávání, tvorba webových stránek a programování. Ve výuce hledám praktické a srozumitelné způsoby, jak žákům přiblížit nové poznatky. Ve volném čase mě baví bowling, ve kterém se pořád snažím zlepšovat — a tato stránka je prostor, kde představuji své zájmy, projekty a práci.",
      ],
      eduTitle: "Vzdělání",
      expTitle: "Praxe",
      interestsTitle: "Co mě baví",
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
          detail: "Technické lyceum — programování a robotika",
        },
        {
          period: "2019–2026",
          place: "Pedagogická fakulta JČU",
          detail: "Bc. i Mgr. — učitelství pro 2. stupeň",
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
          place: "SPŠ Tábor",
          detail: "Učitel informatiky a angličtiny",
        },
      ],
    },
    lessons: {
      kicker: "Pro studenty",
      heading: "Výuka informatiky",
      intro:
        "Vyber si svůj ročník — rozbalí se časová osa témat, kterými během roku projdeme, a materiály ke studiu.",
      subject: "Informatika",
      pick: "Klikni pro zobrazení časové osy",
      goalLabel: "Cíl",
      topicsLabel: "Co probereme",
      materialsLabel: "Materiály",
      noMaterials: "Materiály budou postupně doplňovány.",
      soon: "brzy",
    },
    contact: {
      kicker: "Kontakt",
      heading: "Ozvěte se mi",
      intro:
        "Nejraději vše domluvíme osobně nebo e-mailem. Konzultace si rezervujte přes EduPage.",
      school: "Střední průmyslová škola strojní a stavební, Tábor",
      addressLabel: "Adresa",
      emailLabel: "E-mail",
      phoneLabel: "Telefon",
      cabinetLabel: "Kabinet",
      consultLabel: "Konzultace",
      consultValue: "Rezervace přes EduPage",
      mapLink: "Zobrazit na mapě",
      socialsTitle: "Sledujte mě",
    },
    footer: {
      role: "Učitel informatiky a angličtiny · SPŠ Tábor",
      rights: "Všechna práva vyhrazena",
      top: "Nahoru",
    },
    ui: { theme: "Přepnout světlý / tmavý režim" },
  },

  en: {
    nav: { about: "About", lessons: "Lessons", contact: "Contact" },
    hero: {
      badge: "SPŠ Tábor · CS & English",
      role: "Computer Science & English Teacher",
      tagline:
        "Finding practical, easy-to-grasp ways to bring modern technology and languages closer to students.",
      ctaLessons: "Lessons & materials",
      ctaContact: "Get in touch",
      scroll: "About",
    },
    about: {
      kicker: "About me",
      heading: "A teacher who loves technology and people",
      paragraphs: [
        "I'm a teacher of Computer Science and English at the Secondary Technical School of Engineering and Construction in Tábor, Czech Republic. I studied the Technical Lyceum here, specialising in programming and robotics, and then completed both my Bachelor's and Master's degrees at the Faculty of Education, University of South Bohemia.",
        "I started out as a teaching assistant and Computer Science teacher at lower-secondary school; today I teach at upper-secondary level. I'm passionate about modern technology, education, web development and programming. In my lessons I look for practical, clear ways to introduce new ideas. In my free time I enjoy bowling, always trying to improve — and this site is a space where I present my interests, projects and work.",
      ],
      eduTitle: "Education",
      expTitle: "Experience",
      interestsTitle: "What I enjoy",
      interests: ["Modern technology", "Education", "Web development", "Programming", "Bowling"],
      education: [
        {
          period: "2006–2015",
          place: "Primary & Nursery School Sezimovo Ústí",
          detail: "9. května 489, Tábor District",
        },
        {
          period: "2015–2019",
          place: "Technical School, Tábor",
          detail: "Technical Lyceum — programming & robotics",
        },
        {
          period: "2019–2026",
          place: "Faculty of Education, USB",
          detail: "Bachelor's & Master's — teaching",
        },
      ],
      experience: [
        {
          period: "Early on",
          place: "Primary & Nursery School Malšice",
          detail: "Teaching assistant, then Computer Science teacher",
        },
        {
          period: "Now",
          place: "SPŠ Tábor",
          detail: "Computer Science & English teacher",
        },
      ],
    },
    lessons: {
      kicker: "For students",
      heading: "Computer Science lessons",
      intro:
        "Pick your year — a timeline of the topics we'll cover during the year and the study materials will unfold.",
      subject: "Computer Science",
      pick: "Click to reveal the timeline",
      goalLabel: "Goal",
      topicsLabel: "What we'll cover",
      materialsLabel: "Materials",
      noMaterials: "Materials will be added gradually.",
      soon: "soon",
    },
    contact: {
      kicker: "Contact",
      heading: "Get in touch",
      intro:
        "I prefer to arrange things in person or by e-mail. Book a consultation via EduPage.",
      school: "Secondary Technical School of Engineering and Construction, Tábor",
      addressLabel: "Address",
      emailLabel: "E-mail",
      phoneLabel: "Phone",
      cabinetLabel: "Office",
      consultLabel: "Consultations",
      consultValue: "Book via EduPage",
      mapLink: "View on map",
      socialsTitle: "Follow me",
    },
    footer: {
      role: "CS & English Teacher · SPŠ Tábor",
      rights: "All rights reserved",
      top: "Top",
    },
    ui: { theme: "Toggle light / dark mode" },
  },
};
