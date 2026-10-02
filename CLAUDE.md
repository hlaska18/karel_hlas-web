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
- Hodiny grafiky zatím nikdo neodučil (Kontrola úplnosti.txt).

### Excel: Sbírka úloh (2. 10. 2026)
- `public/materialy/1L/4/Sbírka úloh/` (+ `_stejne.txt` v 1S/3 a 1P/3): 8 sešitů
  z Katedry informatiky PF JU (Leipert, Bureš…), každý `Zadání.xlsx` +
  `Řešení.xlsx` (štítek „učitelé“). Zadání byla vyčištěná od řešení (originály
  a skripty mimo repo). Pokročilé sešity mají „(pokročilé)“ v názvu složky.
- Pozor na název: slovo „databáz…“ ve složce by ji přesunulo do tématu
  Databáze (`toolOf`), proto „5 – Řazení, funkce DSUMA a souhrny“.
- Složka bez vlastních souborů teď ukáže svůj `_popis.json` (`popisySlozek`).
- Licenční věta pod bankou má výjimku i pro tuto sbírku. Karel: autorům nepsat.

## Otevřené / nápady (nic naléhavého)

- Karel si může projít PDF náhledy plánů a listů hodin 1, 4, 6 (vyexportované
  z Wordu 25. 9.); formátování sedí.
- Hláška „Zkopíruj ho do Teams“ ve VysledkySimulatoru.tsx je sdílená
  s Windows – neměnit bez Karlova pokynu.
- Další velký projekt (simulátor sítí, Python/Pyodide, cvičná pošta) rada
  23. 9. zamítla; znovu se otevře, až se ozve 5 cizích učitelů.
- Lokální kopie: ~/CascadeProjects/karel_hlas-web (git stash obsahuje staré
  rozdělané změny z doby commitu d074ba4 – nejspíš nepotřebné).
- Karlův Mac: Node 22.23.3 (nainstalováno 25. 9. 2026).
