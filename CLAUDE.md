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
  Vynutit ukončení má u Finderu „Znovu spustit“, TextEdit místo Poznámek
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

## Otevřené / nápady (nic naléhavého)

- Karel si může projít PDF náhledy plánů a listů hodin 1, 4, 6 (vyexportované
  z Wordu 25. 9.); formátování sedí.
- Úlohy simulátoru macOS by měl jednou projít někdo se skutečným Macem.
- Hláška „Zkopíruj ho do Teams“ ve VysledkySimulatoru.tsx je sdílená
  s Windows – neměnit bez Karlova pokynu.
- Dřívější rada zvažovala další velký projekt: A) simulátor sítí,
  B) interaktivní Python (Pyodide), C) jiné. Nerozhodnuto.
- Lokální kopie: ~/CascadeProjects/karel_hlas-web (git stash obsahuje staré
  rozdělané změny z doby commitu d074ba4 – nejspíš nepotřebné).
- Karlův Mac: Node 22.23.3 (nainstalováno 25. 9. 2026).
