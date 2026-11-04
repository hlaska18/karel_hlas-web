@AGENTS.md

# Předávka pro Clauda – web karelhlas.vercel.app

Tenhle soubor si Claude načte sám na začátku každé relace v této složce.
Je v něm všechno, co předchozí (cloudová) relace věděla. Drž se ho a na
konci práce ho aktualizuj, ať ví i další relace.

## Kdo a co

- Karel Hlas, učitel informatiky na SPŠ Tábor (1. ročník, strojní a stavební
  obory, žáci ~15 let). Web je veřejná dvojjazyčná banka materiálů pro
  učitele + výukové simulátory v prohlížeči.
- Next.js 16, React 19, Node **22.x** (package.json engines), Vercel.
  Push na main = okamžité nasazení na web.

## Pravidla (Karlova)

- Piš česky a tykej. Odpovídej věcně, bez omáčky.
- Commity česky **bez diakritiky**, na konci řádek
  `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Na main pushuje Karel přes GitHub Desktop. Bez jeho výslovného pokynu
  na main nepushuj (každý push jde rovnou na web).
- **Simulátor Windows neměň** bez výslovné žádosti (ani sdílené komponenty,
  které používá, např. src/components/postup/VysledkySimulatoru.tsx).
- Web je one-page: nové věci patří do sekcí homepage, ne na samostatné stránky.
- Nespouštěj prettier na celé soubory. .claude/launch.json neměň natrvalo.
- Ve výuce a materiálech vždy jen **Office 365**, nikdy LibreOffice (ani jako
  příklad – v hodině 5 Digitální gramotnosti je místo něj VLC).
- Před velkým rozhodnutím nebo pushem Karel rád „pošle věc do rady“
  (skill llm-council): 5 poradců, anonymní vzájemné hodnocení, verdikt.
  Pak obvykle řekne „udělej vše, co rada napsala“.

## Pravidla laboratoří (samostatné HTML v public/materialy)

- Čisté HTML bez internetu. JavaScript jen **ES5**: žádné `?.` `??` `=>`
  `let` `const` ani šablonové řetězce (starší prohlížeče). Ověř:
  vytáhni `<script>` a `npx -y acorn --ecma5 --silent soubor.js`.
- Respektovat prefers-reduced-motion (ve škole zapnuté – obálka pak skáče
  po uzlech).
- Styl jako laboratoře v public/materialy/1L/6/Podklady k aktivitám/:
  tyrkysová #0c8a83, Segoe UI, moduly „MODUL 0X“, karty „Nový pojem“,
  rychlá kontrola. Žákům tykat.
- IP adresy v internetu jen z ukázkových rozsahů 198.51.100.x a 203.0.113.x.
  Domácí síť 192.168.1.x, škola 10.x.
- Zjednodušovat smí, **nepravdivé ne**. Zjednodušení označovat
  („Zjednodušeno.“).
- Přirovnání drž v jednom „poštovním světě“: IP = adresa domu,
  router = třídírna na poště (Karel si ji výslovně přál nechat),
  DNS = telefonní seznam, paket = obálka, přepínač = domovní schránky.
- Na telefonu (375 px) nesmí stránka přetékat do strany; schémata se
  posouvají jen uvnitř rámečku (.pane, min-width 640 px).
- Nové laboratoře: soubor „N. Laboratoř – …html“ do Podklady k aktivitám,
  anglický název do NAME_EN v src/lib/materials.ts.

## Kde co je

- Banka: src/lib/materials.ts (čte public/materialy, NAME_EN = anglické
  názvy), src/components/BankBrowser.tsx (LESSON_CONFIG: které skupiny
  tvoří kartu lekce – u Digitální gramotnosti „Pracovní listy“ i
  „Podklady k aktivitám“).
- Téma Digitální gramotnost (1L/2): Pracovní listy/, _ucitel/ (plány hodin
  .docx), Podklady k aktivitám/. Hodiny: 1 OS, 2 soubory a cloud,
  3 kyberbezpečnost, 4 sítě, 5 software, 6 příkazový řádek.
- Simulátor macOS: src/components/mac/, src/lib/mac/ (ukoly.ts = 14 úloh).
- Simulátor Windows: src/components/win/, src/lib/win/ (neměnit).
- DB Browser (kurz SQL): src/components/dbb/, src/lib/dbb/.
- Úpravy .docx: plány a listy upravuj přímo v word/document.xml (kopíruj
  sousední odstavec, ať zůstane formátování) nebo python-docx; ověř, že se
  soubor otevře (python-docx). Vzhled ve Wordu kontroluje Karel.

## Co se udělalo (září 2026)

### Laboratoř „Cesta dat sítí“ (hodina 4)
Soubor: public/materialy/1L/2/Podklady k aktivitám/4. Laboratoř – cesta dat sítí.html
- Moduly: 01 síť a paket, 02 adresy a router, 03 klient a server,
  04 DNS, 05 všechno dohromady (5 kroků z pracovního listu),
  06 navíc: zapojení LAN (sběrnice, hvězda, kruh, strom, každý s každým;
  „Pošli zprávu z A do D“ a „Přeruš kabel“), 07 bonus: vnitřní × veřejná
  adresa (NAT), slovníček (sbírá karty Nový pojem sám).
- Žáci musí přemýšlet (Karlova připomínka „moc naservírované“):
  „Tipni si nejdřív“ v 02/03/04/07 (akce se spustí až po tipu, po animaci
  vyhodnocení s vysvětlením), v 05 nejdřív seřadí pět kroků (učitel může
  přeskočit), v 06 tip „dostane D zprávu?“ po přetržení kabelu.
- Nahoře řádek „Jak laboratoř použít“: v hodině 05, opakování 01–04,
  navíc 06 a 07.
- Opravy po radách: tracert (poslední řádek je server), neoznačená
  zjednodušení, příkazy přesunuty k hodině 6, v 06 bez Token Ringu,
  přepínač a hromadné zprávy, Wi-Fi jako sdílené rádio, bug s přepnutím
  topologie během animace.
- Plán hodiny 4 (_ucitel/4. Počítačové sítě - plán hodiny.docx): pomůcky +
  metodická poznámka (fáze 14–22 = modul 05 se seřazením, ~7 min; tipy
  nechat třídu hlasovat; 06 topologie, 07 bonus).
- Karel NECHCE topologie v pracovním listu 4 ani v klíčových pojmech plánu.

### Stránka „6. Síť naostro v příkazovém řádku.html“ (hodina 6)
ipconfig, nslookup, tracert, ping; varování, že školní síť ping/tracert
blokuje. Bonus pro rychlíky, uvedeno v plánu hodiny 6.

### Simulátor macOS
- Rada: simulátor je bonus ke srovnání s Windows, ne kurz Macu. Po opravách
  ho **zmrazit** a nic dalšího nestavět (pokud Karel sám nechce).
- Opravené nepravdy: macOS má i příznak skrytý (ale většinu skrývá tečka),
  položky s tečkou jen zkratkou (⇧⌘., v simulaci Ctrl+Shift+.) – ne v menu,
  Finder název s tečkou odmítne (zakládá se `mkdir` v Terminálu),
  Vynutit ukončení má u Finderu „Spustit znovu“, TextEdit místo Poznámek
  (id aplikace zůstalo `poznamky`), Finder.app v /System/Library/CoreServices,
  Terminál v /Applications/Utilities, Windows má podokno náhledu Alt+P,
  dir/cls → „zsh: command not found“ + označená nápověda simulace.
- Uložený disk žáků dostane nové systémové složky (obnovSystemoveSlozky
  v stav.ts) bez ztráty postupu.
- Okna se otvírají vpravo od panelu úkolů; titulek okna česky.
- Nabídka jablka: Uspat, Restartovat…, Vypnout… (potvrzení s odpočtem 60 s),
  Zamknout obrazovku. Zámek a spánek nechávají plochu běžet pod zámkem.
- Ukotvení: bonus „Totéž, jinak“ v listu a plánu hodiny 1, „Totéž na Macu“
  v listu a plánu hodiny 6, popis v public/materialy/1L/11/_nastroj.json.

### Lokální relace 25. 9. 2026 odpoledne
- **Vstupní kódy do simulátorů jsou zrušené** (commit 7ef2a3f, ráno v lokální
  relaci): žák se do /windows i /macos přihlásí jménem a učiteli pošle kód
  postupu. Zbylé zmínky o „kódu od vyučujícího“ jsou opravené (stránka
  /windows, Nastavení ve Windows i na Macu, pracovní list 1).
- Laboratoř sítí prošla na webu s plnými animacemi, na telefonu nepřetéká.
  Tip v modulu 02 je obecný („jinému zařízení v síti“), protože žák může
  poslat obálku kterémukoli zařízení.
- Plány 4 a 6: odkaz do banky je „banka → Digitální gramotnost → lekce 4/6“,
  harmonogram hodiny 4 ve fázi 14–22 odpovídá metodické poznámce (promítá se
  modul 05). Plány a listy 1, 4, 6 jsou vyexportované z Wordu a zkontrolované.
- **Codex jako druhý názor:** skill ~/.claude/skills/codex-druhy-nazor (jen
  pro čtení). Existuje jen na Karlově Macu, v cloudu není.
- **Simulátor macOS ověřený na skutečném Macu** (macOS 27, česky): úlohy věcně
  sedí, opravené byly jen české názvy – Monitor aktivity, „Spustit znovu“ u
  Finderu, v postranním panelu „Místa“ a „Stahování“, „Zobrazit řádek s
  cestou“, Utilities = Utility, nabídka „Otevřít“ (Go) s položkami Domov a
  Otevřít složku…, hláška o názvu s tečkou podle skutečného znění.
- **Pracovní soubory Wordu a Excelu** se jmenují jako v zadání
  (`01_tabulka.xlsx`, `olympiada1.docx` …). Banka je pozná podle vzoru
  `PRACOVNI_SOUBOR` v src/lib/materials.ts a ukáže jako „Pracovní soubor
  (01_tabulka.xlsx)“. Nový pracovní soubor pojmenuj stejně jako v zadání.
  Podklady, které zadání jmenuje (CSV, XML, .accdb, zdroj dat, anotace),
  se jmenují taky podle zadání a jsou vyjmenované v `PODKLADY_ULOH`.

### Vzhled webu 27. 9. 2026 (lokální relace)
- Tečky na pozadí zrušené. Za nadpisy úvodu a sekcí 01–05 a pod mřížkami
  dlaždic je `src/components/Mlhovina.tsx`: tři oblé mraky (ne kruh), každá
  mlhovina jiná (`varianta`), mraky pomalu „dýchají“ (CSS transform;
  s „omezit pohyb“ stojí). Rozmazání SVG filtrem uvnitř obrázku – CSS
  `filter: blur` na SVG dělal v Safari fialový pruh. Sílu měnit jen tam.
- Dlaždice (`.dlazdice`: témata, předměty, karty simulátorů a článků
  v úvodu) jsou matné sklo (visionOS). Seznamy souborů, náhled a mobilní
  menu zůstávají neprůhledné (výkon a čitelnost na školních PC).
- Řešení úloh cvičebnice má štítek „učitelé“ jako ostatní učitelské
  položky, žádné vlastní pozadí.
- Revize frontendu Codexem (commit c428857): klávesnice v bance, fokus po
  kotvách, kontrast, pojistka bez JS, omezit pohyb, `sizes` u obrázků.

### Vlastní databáze z Excelu (28. 9. 2026)
- Téma Databáze (1L/8) má lekci „2. Vlastní databáze z Excelu“: žákovský
  návod, ukázková data filmy.csv (štítek „Podklad (filmy.csv)“ přes
  PODKLADY_ULOH) a v _ucitel návod pro učitele (průběh hodiny, hodnocení,
  limity). Oba .docx generuje scripts/dbb-dokumenty/vlastni-data.js
  (zak|ucitel), tabulka FILMY v něm musí sedět s filmy.csv.
- Postup je ověřený v simulátoru: Nová databáze → okno Upravit definici
  tabulky zavřít Zrušit → Soubor → Importovat tabulku z CSV → Zapsat změny
  → dotazy → Uložit výsledek do CSV. CSV z českého Excelu (středník,
  Windows-1250) i CSV UTF-8 s čárkami projdou.
- Logo v hlavičce zabalí všechny rozbalené složky, lekce a dlaždice
  (src/lib/zabalit.ts, událost web:zabalit-vse).

### Šíření a audit webu (28.–29. 9. 2026)
- Karel 29. 9. poprvé sdílel web ve FB skupinách „Učitelský kabinet: Učit
  jinak“ a „Učíme informatiku“. Rada 29. 9.: do listopadu nic nestavět,
  jen opravovat chyby od skutečných uživatelů, pushovat večer mimo výuku;
  vyhodnocení začátkem listopadu (kritérium 5 cizích učitelů).
- Audit podle 42 bodů SEO/výkon s Codexem: náhledy pro sdílení podstránek
  skládá `sdileni()` v src/lib/sdileni.ts (Open Graph i X), canonical
  /soukromi, public/llms.txt, sitemap bez lastModified, odebrán Upstash.
  Karel nechce: vlastní doménu (zatím), stránkování hledání, změnu psacího
  stroje, AI asistenta ani nové hledání.
- Cizí weby do banky jen přes `_zdroj.json` ve vlastní složce (test hlídá,
  že `_nastroj.json` míří jen dovnitř webu). Linuxhrou.cz je v 1L/11.
- Vercel: úložiště nasazení (10 GB zdarma) plnily kopie webu (~100 MB)
  z každého pushe; retence nastavená na 1 den. Pushovat radši jednou denně.
  Ověřeno 1. 10.: Deployment Storage 7,9 GB → 535 MB, Functions Storage
  7,6 GB → 323 MB (koš se do limitu nepočítá).
- Bezpečnost (Codex + rada 29. 9.): SRI u všech knihoven z CDN, export do
  Excelu přes `bezVzorce()` (src/lib/dbb/csv.ts, i ve sdíleném přehledu
  Windows/macOS), limity CSV importu, Ctrl+R v DB Browseru nespouští SQL.
  Nedělat: povinné PR, CSP, SQL ve Workeru. Historie Gitu bez tajemství.
- **Simulátory Windows, macOS i kurz SQL běží jen na počítači** (Karel
  29. 9. 2026): `src/components/JenNaPocitaci.tsx` (obrazovka ≥1024 px a myš).
  Na telefonu a tabletu vysvětlení; u /sql zůstává popis pro učitele, místo
  kurzu věta „Kurz běží jen na počítači s myší“. Webová podoba SQL jen pro
  počítač v úzkém okně. Dokumenty (Jak toto téma učit, návody, plán hodin)
  už „plán B v telefonu“ neslibují.
- **Všechno musí fungovat i na Linuxu** (Karel): cíl Firefox 111 nemá
  `inert`, proto `.sbalitelny[inert] { visibility: hidden }` v globals.css.
- Vercel Function Storage: `outputFileTracingExcludes` v next.config.mjs
  drží public/materialy mimo serverové funkce (dřív ~75 MB v každé).
- Neukládá-li se práce (plné/zakázané úložiště), ukáže se pruh
  `UpozorneniUlozeni` (src/lib/ulozeni.ts – ukládat přes `ulozDoProhlizece`).
- Simulátor Windows: Správce úloh Shift+F8, Start Shift+F4; skutečné
  zkratky Windows jsou v závorce u úlohy a v bublině Startu (Karel 29. 9.).
- Na iPhonu ověřeno 30. 9.: simulátory ukazují „jen na počítači“.

### Grafika a multimédia podle D. Tyla (1. 10. 2026)
- Podnět Dominika Tyla (učitel grafiky) prošel dvěma radami a Codexem.
  Hodiny 7 a 8 (1L/6) stojí na smyčce pro koho → udělej → test pěti sekund
  u spolužáka (tři pevné věty) → oprav. H7: tři principy (hierarchie,
  blízkost a kontrast, poctivý graf) nejdřív otázkou, jedna sada dat,
  graf v Excelu + snímek v PowerPointu, Canva volitelně. H8: „Určeno pro…“,
  vlastní téma uvnitř variant, pravidlo pro AI (přizná se v technickém
  listu), v rubrice kritérium Srozumitelnost. Měření: 5s test na ukázce B
  na začátku h7 a na konci h8. H4 a H5 jen věta „pro koho“.
- Každá hodina = 5 souborů (pptx s poznámkami, Plány hodin a metodika,
  Digitální pracovní sešit, Hodnocení, zadání .txt) – měnit vždy všechny.
  Texty v .docx/.pptx mají pevné mezery; po úpravě spustit
  `zpracuj_ooxml` ze scripts/pevne-mezery.py.
- Soubor „7. Infografika v Canvě.txt“ se schválně nepřejmenoval.
  „Co se změnilo“ je v Začni zde.txt a v `_popis.json` (popis v bance).
- Hodiny grafiky zatím nikdo neodučil (Kontrola úplnosti.txt). Karel je
  podle tematického plánu odučí nejdřív za půl roku (kolem dubna 2027).

### Excel: Sbírka úloh (2. 10. 2026)
- `public/materialy/1L/4/Sbírka úloh/` (+ `_stejne.txt` v 1S/3 a 1P/3): 8 sešitů
  z Katedry informatiky PF JU (Leipert, Bureš…), každý `Zadání.xlsx` +
  `Řešení.xlsx` (štítek „učitelé“). Zadání byla vyčištěná od řešení (originály
  a skripty mimo repo). Pokročilé sešity mají „(pokročilé)“ v názvu složky.
- Pozor na název: slovo „databáz…“ ve složce by ji přesunulo do tématu
  Databáze (`toolOf`), proto „5 – Řazení, funkce DSUMA a souhrny“.
- Složka bez vlastních souborů teď ukáže svůj `_popis.json` (`popisySlozek`).
- Licenční věta pod bankou má výjimku i pro tuto sbírku. Karel: autorům nepsat.

### Náhled Excelu a PowerPointu v bance (4. 10. 2026)
- Karel chce v náhledu vidět, „co tam skutečně je“, jako u Wordu
  (docx-preview). Vše se kreslí v prohlížeči, soubor nikam neodchází
  (cizí prohlížeč Microsoftu Karel nechce).
- Excel: vlastní vykreslování `src/lib/xlsxPreview.ts` (JSZip + SSF ze
  SheetJS z CDN se SRI). Umí formáty čísel česky, styly, sloučené buňky,
  podmíněné formátování (kromě typu vzorec), tabulky, kontingenční tabulky,
  komentáře, obrázky, tvary a textová pole, grafy (sloupcový, pruhový,
  spojnicový, plošný, XY, výsečový, vedlejší osa, spojnice trendu s R²,
  chybové úsečky), skryté řádky a sloupce, záložky listů.
  Vzorce nepřepočítává (bere uložené hodnoty), list ořízne na 600 × 60
  (žlutá poznámka). Bez Calibri zmenší písmo na 0,9 (měření na canvasu).
  Ověřeno na všech 84 sešitech tématu Excel proti PDF z Excelu.
- PowerPoint: `pptx-preview` (CDN, SRI); `normalizePptx` předtím kopíruje
  `a:defRPr` do `a:rPr` (jinak malé nadpisy). Pod snímkem rozbalovací
  poznámky. Když selže, zůstane starý textový náhled (`PptxTextView`).

### Ikony témat a předmětů (4. 10. 2026)
- Nová jednotná sada z Higgsfieldu: matné pískované smaragdové sklo podle
  původní ikony databáze, čelem, zjednodušené tvary (čitelné v 56 px).
  Mozek u umělé inteligence je z původní sady (Karel). Python = logo Pythonu
  ve dvou odstínech zelené, matematika ±, chemie baňka, hudební výchova dvě
  noty, strojírenství ozubené kolo, Power BI sloupce bez podstavy.
- **Postup, zadání a skript: scripts/ikony/README.md** (`normalizuj.py`
  ořízne, vyčistí a opticky vyrovná). Novou ikonu dělej jen tak, motiv
  neměň bez Karla a ukaž mu varianty ve skutečné velikosti na webu.
- V patičce věta „Ikony … vznikly s pomocí AI“ (`footer.ikonyAI`).
- Po výměně PNG pod stejným jménem drží lokální server staré ikony –
  smazat `.next/cache/images` a `.next/dev/cache/images`. Produkce ikony
  posílá s `max-age=0`, tam to nehrozí.
- Ikony jsou do listopadu zmrazené (rada 29. 9.: nic nestavět).

### Úpravy podle auditu (4.–5. 10. 2026)
- Audit webu (Downloads/Audit_webu_Karel_Hlas_2026-10-04.txt) Karel chtěl
  udělat celý. Vynechané body: oslovování učitelů (5.8, 8.2 – Karel nikoho
  nekontaktuje).
- Hotovo: README a WINDOWS.md podle skutečnosti, GitHub Actions „Kontrola“
  (Node 22: npm ci, test, build), `lang` a „Přeskočit na obsah“ na /sql
  a /macos, přesnější texty (hledání, počty, AI Hub, Ideogram, Firefly,
  Copilot), datum ověření u každého nástroje (`overeno`, `overenoText`),
  nástroje v bance (Python Tutor, JupyterLite, Teachable Machine, TensorFlow
  Playground), sekce **Angličtina** a první vlna nástrojů k předmětům,
  ochrana dvou karet v macOS, rozpočet úložiště a přísnější kód postupu
  v kurzu SQL, náhledy z vlastní kopie knihoven (`public/vendor`,
  `src/lib/knihovny.ts`, CDN záloha) s rušením stahování, náhledy
  vyčleněné do `src/components/bank/Nahled.tsx`.
- Windows (Karel povolil 5. 10.): „Přeskočit na obsah“ míří na `#main`,
  hlídač dvou karet (`win11-vyuka-karta` v win/system.tsx) a přísnější
  `dekodujSimulator` (jen id úloh `a-z0-9-`, platné datum, celkem do 500).
- Známé limity a co se dělá průběžně: **ZNAME-LIMITY.md**. Návrh výukové
  cesty Pythonem a AI (neodučený, k Karlově recenzi): `navrhy/`.
- Nový nástroj k předmětu: ověř podmínky na webu provozovatele a dej mu
  `overeno: "RRRR-MM"`. Druhá vlna z auditu (OneZoom, USGS, SimScale,
  CyberChef, Photopea, diagrams.net, Content Credentials) čeká na zájem.
- AI Hub, „Kde se to naučit“ (vlastní kategorie od 3. 11.): kniha Karla Klatovského „133 tipů – Jak využít AI
  (nejen) ve školství“ (7. 10. 2026), jen odkaz na online příručku u autora klatovsky.cz/ai/ (s www je 404; PDF má 40 MB a v Safari se dlouho otevírá; licence
  neuvedená, nehostovat). Autor je zmíněný v textu karty.
- Stránka 404 u překlepů v adrese simulátoru (/windovs, /mac, /sqll…)
  nabídne tlačítko „Chtěl jsi simulátor Windows?“ (src/lib/preklep.ts,
  12. 10. 2026 podle Analytics: žáci adresu přepisují ručně). Schválně
  tlačítko, ne přesměrování. Vercel posílá 404 předpřipravenou, proto se
  adresa čte až po hydrataci (jinak React chyba #418). Stejnou chybu má
  zatím SkipLink na /en/… 404 (starší, neškodná).

- Google Search Console (13. 10. 2026): služba „Předpona adresy URL“
  https://karelhlas.vercel.app/, ověřená značkou `verification.google`
  v src/app/layout.tsx – nemazat. Pro Gemini a AI Overviews žádný zvláštní
  krok ani „certifikát“ neexistuje, stačí běžné indexování v Googlu.
- Bing Webmaster Tools (13. 10. 2026, kvůli ChatGPT a Copilotu): import ze
  Search Console selhal, web přidaný ručně a ověřený značkou `msvalidate.01`
  ve stejném `verification` – nemazat. OAI-SearchBot, GPTBot i bingbot
  robots.txt pouští.

## REŽIM ÚDRŽBY do 28. 2. 2027 (rada 26. 10. 2026)

- Vyhodnocení podzimního měření vyšlo „mezi tím“ (3 signály, ale jen z
  Classroomu; simulátory ~25 lidí ve všední den, všechno cizí uživatelé).
  Rada: web je služba pro cizí učitele → **nestavět nic nového, nešířit**,
  strop ~2 h měsíčně jen na chyby od skutečných uživatelů.
- **Simulátory Windows, macOS a kurz SQL do konce pololetí neměnit**: id,
  pořadí ani texty úloh, formát kódu postupu (`postupSimulatoru.ts`,
  `dbb/kodPostupu.ts`) – cizí učitelé je mají v zadáních v Teams a Classroomu
  a čtou jimi odevzdané kódy. Pushovat jen večer mimo výuku; v lednu
  (uzávěrka pololetí) jen nouzové opravy.
- Měsíční rutina aktualizací dělá do 28. 2. jen opravné a bezpečnostní verze
  a na kód simulátorů nesahá. Node 22 končí v dubnu 2027 → přechod na Node 24
  v březnu.
- Deník hodin rada zrušila. Stavbu znovu otevřít, až sám napíše cizí učitel,
  nebo až Karel simulátor použije ve své hodině a narazí na mezeru.
- Hotové z rady: návod „Jak zadat simulátor žákům“ s tlačítky „Zkopírovat
  zadání“ pod dlaždicemi simulátorů v úvodu (`HeroSimulatory.tsx`, texty
  `hero.zadat*`; adresa v zadání na samostatném řádku, ať se v Teams
  neslepí), 404 i pro `/sq`. Měřit kliknutí na tlačítko 404 nejde – vlastní
  události Vercel Analytics jsou jen v placeném Pro.
- Meta popisy pro vyhledávače, nová sekce, Slovensko/RVP rada nedoporučila.

### Cvičení „Síť a poruchy“ ve Windows (31. 10. 2026)
- **Výjimka z režimu údržby:** Karel se vědomě rozhodl stavět hned (inspirace
  eduKuba.cz), strop ~2 h měsíčně tím překročil. Rada 31. 10. řekla jak:
  samostatná sada, výchozí nic nerozbít.
- Adresa `/windows?scenar=sit` (`SCENAR_SIT` v src/lib/win/scenare.ts), vlastní
  úložiště `win11-vyuka-sit`, 8 úloh `UKOLY_SIT` s předponou `sit-`
  (ukoly.ts, `ukolyPro`/`skupinyPro`), vlastní kód **WSIT1-** (Simulator `sit`
  v postupSimulatoru.ts). Výchozích 33 úloh, jejich texty a kód WIN1-/MAC1-
  se nezměnily – hlídá to `postupSimulatoru.zmrazene.test.ts` (kódy z 31. 10.
  se nesmí přegenerovat).
- Síť je v src/lib/win/sit.ts: domácí síť 192.168.1.x, router 192.168.1.1,
  internet jen 198.51.100.x a 203.0.113.x, weby `skola.example`,
  `zpravy.example`, `mojeip.example` (veřejná 203.0.113.57, CGNAT jen větou).
  Bez `sit` (výchozí simulace) příkazy pracují se školní sítí 10.20.x a
  `ipconfig` dává přesně starý výpis. Opravy pravdivosti platí i ve výchozí
  simulaci: ping odpovídá z adresy cíle (dřív vždy z brány), nově nslookup,
  tracert, ipconfig /all.
- Poruchy: tlačítko „Pokazit počítač“ v panelu (`sit/porucha`), oprava
  v Nastavení → Síť a internet → Upravit (`NastaveniSite.tsx`, `sit/nastav`).
  Úloha se splní jen stopou `porucha:X:opravena` (reset ji nedá). Nápovědy
  po jedné, počet jen u žáka (`napovedy`), NE v kódu. Tři chyby `db`, `id`,
  `rr` (`CHYBY_SITE`) jdou v kódu jako `ch`; Přehled třídy je píše jako popis
  chování, u kódu bez pole „neměřeno“. Sebehodnocení 1–5 rada vyškrtla.
- Přehled třídy (sdílený s macOS) má jen přidanou sekci „Windows – síť“
  a sloupec v CSV, jen když jsou v textu kódy WSIT1. Na úvodní stránce je
  „Co je nového v simulátorech“ (`hero.novinky` v content.ts, cs i en).
- **Ověřit na skutečných českých Windows** (psáno podle znalosti, ne opsáno):
  nslookup (časový limit, neexistující doména), tracert (nelze přeložit
  název), tvar řádku statistiky ping, popisky v Nastavení Ethernet
  („Přiřazení IP“, „Upravit nastavení IP/DNS“, „Upřednostňovaný server DNS“).
- Návrat zpět: na Vercelu „Redeploy“ předchozího nasazení. Termín 18. 12.,
  pushovat večer mimo výuku.

### Router, další poruchy a Wi-Fi ve cvičení sítě (1. 11. 2026)
- Karel chtěl „něco jako síťovou dílnu na eduKuba“ – postavené vlastní
  návrh, ne kopie. Úloh WSIT1 je 20 místo 8 (kód je podle id, staré platí).
  Skupiny `SKUPINY_SIT`: Jak je počítač připojený, Nový router, Poruchy,
  Cizí zařízení ve Wi-Fi.
- `SitStav` má `kabely` (napájení, WAN, port LAN počítače) a `router`
  (heslo správy, Wi-Fi, WPS, síť pro hosty, DHCP, zařízení, blokované MAC);
  starší uložený stav doplní `doplnSit`. Smyšlený router DR-300, údaje ze
  štítku v `STITEK` (správa admin / Q7m-4kzR).
- Scénáře (`situace` u úlohy, `SITUACE` v ukoly.ts) startuje tlačítko nahoře
  ve skupině (`sit/situace`): nastaví síť (`sitProSituaci`), smaže stopy
  `overeno:` a zapíše `situace:X:spustena` – bez ní se úlohy routeru na
  zapojené síti nesplní. Nový router zná jen počítač na kabelu.
- „Router a kabely“ (`RouterAKabely.tsx`, tlačítko v panelu úloh): kontrolky,
  porty, štítek. Správa routeru na 192.168.1.1 je React komponenta
  `SpravaRouteru.tsx` místo iframe (iframe je bez skriptů); dostupná jen
  s adresou z domácí sítě. Formuláře připomínají „cvičné heslo“.
- Nové poruchy (`Pokazit síť`): kabel (lan null → Médium odpojeno), dhcp
  (APIPA 169.254.23.115, bez brány; oprava = ručně dočasně .200 → správa →
  zapnout DHCP → zpět Automaticky, ruční obejití se nepočítá), wan (router
  odpoví, dál časový limit). Silné heslo Wi-Fi = aspoň 12 znaků + WPA3 nebo
  WPA2/WPA3.
- Do pokynů na plochu přibyl „Pokyny od poskytovatele.txt“ (jen na novém disku).
- **Ověřit na skutečných českých Windows:** „Stav média … Médium odpojeno“,
  „Adresa IPv4 automatické konfigurace“, ping bez sítě „Selhání obecné.“,
  stav v Nastavení u APIPA („Žádné připojení k síti“?).

### Programování a dlaždice cvičení sítě (1. 11. 2026)
- Dlaždice Python se v bance jmenuje **Programování** (Programming). Klíč tématu
  zůstal `Python`, protože je v adresách `?tema=Python`. Ikona `python.png` má
  motiv `</>`, vybral ji Karel ze tří návrhů.
- Karel výslovně nechce samostatnou dlaždici cvičení sítě v úvodu.
- První vstup na `?scenar=sit` ve stejné kartě jde přes přihlášení
  (`jePrihlasen` + `nacti` ve VirtualniPocitac.tsx), jinak by byl kód pod „Žák“.
- Zelený rámeček kolem polí v tmavém motivu: `.dark :focus-visible` přebíjel
  průhlednou barvu z `outline-none` (Tailwind 3). Pravidlo je teď `:where(.dark)`
  (globals.css), stejná váha, fokus klávesnicí na odkazech a tlačítkách zůstává.
  Pole ve Windows bez `outline-none` hlídá `.win input/textarea:focus-visible`.

### Síťové úlohy v běžném seznamu Windows (1. 11. 2026)
- Karel: „Úkoly navíc ve Windows přidej normálně do úkolů.“ Na `/windows` je pod
  výchozími skupinami „Navíc: síť“ s 20 úlohami (`ukolyNavic`), bez přepínání adresy.
- **Do „x/33“ se nepočítají a `c` v kódu zůstává 33**: cizí učitelé čtou x/33.
  Sloučený počet 53 je Karlova volba, zatím nechtěl. Kód WIN1- nese id `sit-*` (a `ch`),
  Přehled je přes `oddelSit` ukáže v sekci Windows – síť a sečte se starým WSIT1-.
- Počítač je ve škole (`stav.sit` chybí, výpisy 10.20.x), dokud žák neklikne
  „Přenést počítač domů“, „Vybalit“ nebo „Pokazit“; zpět „Vrátit počítač do školy“.
  Bez `stav.sit` se síťové úlohy nepočítají, školní příkazy se při přenosu smažou
  (`stopyDoma`). Výměna sítě ukončí běžící scénář (`bezScenare`).
- `/windows?scenar=sit` funguje dál (vlastní úložiště, WSIT1-), nevede na něj odkaz.
- Doma je to vidět: tapeta `tapetaPlochy` v obrazky.ts (večer s domem, Karel vybral ze
  tří; není v `TAPETY`, ukáže se jen místo výchozí, žákovu volbu nepřepíše), štítek
  „Doma“ na hlavním panelu, název DOMACI-PC v Nastavení, domácí Wi-Fi v rychlém nastavení.

### Fyzika: oPhysics a Vaščák (kolega Petr, 2. 11. 2026)
- Doporučil je Karlův kolega, učitel fyziky s PhD. Ověřeno v prohlížeči: oPhysics bez
  reklam, simulace z geogebra.org. Vaščák: reklama v bočních sloupcích (Google, i
  bulvární), souhlas s cookies. Česky funguje `?l=cz` (`?l=cs` dá angličtinu); Petr psal,
  že funguje jen anglicky, u mě se česky otevřely katalog a dvě animace.

### Ostatní předměty: otevření jako u témat (3. 11. 2026)
- Karel: rolovací nabídka přestává stačit, nástrojů přibývá. Klik na dlaždici předmětu
  schová mřížku a ukáže obsah předmětu s „Zpět na předměty“ (`CrossSubject.tsx`), nástroje
  jsou karty a klikací je celá karta. Adresa `?predmet=fyzika#jinam` (klíč je `icon`, stejný
  v obou jazycích). Výška dlaždic je teď z CSS (`auto-rows-fr`), měření v JS je pryč.

### AI Hub: stejně velké karty (3. 11. 2026)
- Popisek karty nástroje (`why`) drž na 100–125 znacích (cs i en) a název na jednom řádku,
  jinak karta vyčnívá nebo zeje prázdnotou. Kniha má proto na kartě zkrácený název, celý
  je v poznámce. Výšku drží `min-h` podle šířky v `KartaNastroje`, ne mřížka (rozbalení).

### Rychlost úvodní stránky: jen aktuální jazyk (3. 11. 2026)
- Texty `t` jdou do `LanguageProvider` jako prop ze serveru (`tr={t[lang]}`), ne importem,
  takže v JavaScriptu nejsou oba jazyky. Klientská komponenta nesmí importovat `t` jako hodnotu.
- Banka přes `polozkyProJazyk` (materials.ts). Na /en zůstává české `label` a `group`, skládají
  se podle nich lekce a složky. Důsledek: na české stránce nenajde hledání anglický název.
- `LangToggle` bez předběžného načítání, psací stroj 25 ms na znak.
- Největší zbytek: položky banky v HTML (~300 KB nekomprimovaně, 361 položek). Zásadní úspora
  by bylo načítat je až po otevření tématu nebo hledání; zatím neudělané.

### Síťová dílna: vlastní prostředí místo sítě ve Windows (3. 11. 2026)
- Karel: „z windows síť vyřadíme“. **`/sitova-dilna`** (`src/components/dilna/`, `src/lib/dilna/`) má
  20 úloh se stejnými id `sit-*` jako dřív, kód zůstává **WSIT1-**. Vstup je banner v tématech
  Digitální gramotnost a Internet a bezpečnost (`TOOL_INTERACTIVE`) a od 3. 11. na Karlovo přání
  karta pod simulátory v úvodu (`HeroSimulatory.tsx`, „Simulátory a dílny v prohlížeči“; nahrazuje
  starší „nechce dlaždici“). „Jak zadat simulátor nebo dílnu žákům“ má pro dílnu vlastní zadání
  (`zadatTextDilna`), protože tlačítko Úkoly ani Moje výsledky v ní nejsou. Návrh:
  https://claude.ai/artifact/X2Vp54cXmxSDH9SVzZCewJ. Běží jen na počítači (`JenNaPocitaci`).
- `/windows` je zase jen 33 úloh, bez domova, poruch a tapety. Terminál tam pracuje se školní sítí
  10.20.x. Model sítě zůstal v `src/lib/win/sit.ts`, používá ho i dílna; `obrazky`, `pristup` a
  `postupSimulatoru` jsou sdílené. Starší sekce výše popisují Windows před přesunem.
- Staré věci žijí dál: `/windows?scenar=sit` přesměruje do dílny (next.config.mjs), rozdělaná práce
  se jednou přenese z `win11-vyuka-stav` a `win11-vyuka-sit` do `sitova-dilna` (`nactiDilnu`),
  Přehled třídy čte staré WSIT1- i WIN1- se síťovými úlohami, dílna je umí načíst, Windows WSIT1-
  odmítne s vysvětlením.
- Úloha o poruše se splní až po ověření (`overuje`, stopa `porucha:X:overena`). DNS se musí ověřit
  názvem (`ping:nazev:ok`, nslookup, web), jinak by prošel ping na adresu. Prohlížeč na skryté
  záložce nic neověřuje (`aktivni`). Tip ve schématu vyhodnocuje `lib/dilna/tipy.ts` podle toho,
  co žák opravdu zjistil. Čáry při poruše schválně zůstávají plné, jinak by prozradily odpověď.
- Správa routeru se otevírá v Prohlížeči dílny na 192.168.1.1, ne vlastní záložkou (návrh ji měl).
- Plány hodin 4 a 6 (.docx) dílnu nezmiňují, to je na Karlovi. **Ověřit na českých Windows** zůstává
  ze sekcí výše. V Přehledu je věta „jsem … vyndal“ (hlas Karla), `hero.novinky` taky.
- Hlášky proti českým výpisům z webu (3. 11.): ping opravený podle Wikipedie a dsl.cz (Karel povolil
  i pro `/windows`, `sit.ts` je sdílený). Jediný český `ipconfig /all` je z Windows 7 a liší se u IPv6,
  „(Preferované)“, směrování IP, NetBIOS a stavu média; to čeká na fotky z Windows 11 od Karla.
  Firefox 111 s dílnou nikdo nezkoušel.
- Na ostrém webu prošlo 3. 11. (commit 315c4a1): všech 20 zakázek, kódy, Přehled třídy, omezit pohyb,
  telefon. Známé a záměrně neměněné: hledání ve Startu Windows chce přesnou diakritiku („terminal“ ani
  „cmd“ nic nenajde, Enter výsledek neotevře); bylo to tak už dřív, Karel zatím nerozhodl.
- Obálka ve schématu (4. 11.): na Windows se sekala, proto jedna animace `transform` na celou cestu
  (`pohybObalky` v `lib/dilna/obalka.ts`, `JedouciObalka` v `Schema.tsx`), stejná rychlost na kabelu i
  přípojce. Dřív `left` po úsecích s časovači a přípojka jela dvakrát rychleji. Na Windows ověřuje Karel.

## Otevřené / nápady (nic naléhavého)

- Karel si může projít PDF náhledy plánů a listů hodin 1, 4, 6 (vyexportované
  z Wordu 25. 9.); formátování sedí.
- Hláška „Zkopíruj ho do Teams“ ve VysledkySimulatoru.tsx je sdílená
  s Windows – neměnit bez Karlova pokynu.
- Další velký projekt (simulátor sítí, Python/Pyodide, cvičná pošta) rada
  23. 9. zamítla; znovu se otevře, až se ozve 5 cizích učitelů.
- Lokální kopie: ~/CascadeProjects/karel_hlas-web (git stash obsahuje staré
  rozdělané změny z doby commitu d074ba4 – nejspíš nepotřebné).
- Karlův Mac: Node 22.23.3 (nainstalováno 25. 9. 2026). Vercel má od 18. 10. 2026
  v nastavení projektu taky Node 22.x (dřív 24.x → varování). Přechod na
  Node 24 = package.json engines + kontrola.yml + Mac najednou; Node 22 má
  podporu do dubna 2027.
