# Známé limity a vědomé kompromisy

Věci, o kterých víme a které jsou zatím vědomě takhle. Každá má důvod a
podmínku, kdy ji otevřít znovu. Vychází z auditu ze 4. 10. 2026.

## `npm audit`: 5× „high“ ve vývojovém řetězci Tailwindu

- **Co hlásí:** `braces` → `micromatch` / `chokidar` → `fast-glob` →
  `tailwindcss 3.4.13`. Jde o jeden problém (GHSA-vfj7-8cjw-p6xm:
  vyčerpání zásobníku v `braces` při zpracování zlomyslného vzoru), který se
  propisuje řetězcem. `npm audit --omit=dev` je čistý: na webu, který běží
  u návštěvníků, nic z toho není.
- **Proč to webu nehrozí:** Tailwind tyhle knihovny používá jen při sestavení
  ke hledání souborů podle vzoru `./src/**/*.{ts,tsx}` z
  `tailwind.config.ts`. Ten vzor píšeme my, ne návštěvník. Žádný cizí vstup
  se do něj nedostane.
- **Proč ne `npm audit fix --force`:** oprava je jen v Tailwindu 4 (major
  verze, jiná konfigurace i část tříd). Migrace by mohla rozbít vzhled webu
  i simulátorů, takže patří do samostatné změny s vizuální kontrolou.
- **Kdy znovu:** až vyjde opravená verze v řetězci Tailwindu 3, nebo při
  plánovaném přechodu na Tailwind 4.

## SQL běží v hlavním vlákně prohlížeče

- `src/lib/dbb/prikazy.ts` spouští dotaz synchronně (`prepare` a `step`) bez
  limitu řádků. Obrovský kartézský součin nebo nekonečná rekurze proto
  zamrazí záložku. Tlačítko zastavení nefunguje, protože synchronní SQLite
  přerušit nejde.
- Přesun do Web Workeru Karel odmítl (29. 9. 2026). Výukové databáze jsou
  malé, takže to v praxi nevadí.
- **Kdy znovu:** až by se ve výuce opakovaně stávalo, že žákům zamrzne
  záložka.

## Jazyk `/en` v HTML ze serveru

- Jeden kořenový layout má `<html lang="cs">`; na `/en` ho na `en` přepíše
  skript v `src/app/layout.tsx` hned na začátku načítání. Bez JavaScriptu
  (a pro roboty, kteří ho nespouštějí) zůstává `cs`.
- Pořádné řešení (dva kořenové layouty pro češtinu a angličtinu) by v Nextu
  16 potřebovalo pro vlastní stránku 404 experimentální `global-not-found`.
- **Kdy znovu:** až `global-not-found` přestane být experimentální.

## Bez Content Security Policy

- Rozhodnutí rady a Codexu 29. 9. 2026. Web nemá přihlašování, formuláře ani
  údaje uživatelů. Knihovny z CDN mají podpis SRI. Přísná CSP by se musela
  vypořádat s vloženými skripty, Nextem, CDN a WebAssembly (nonce v Nextu
  vypíná statické vykreslování).
- **Kdy znovu:** kdyby web začal pracovat s účty nebo údaji.

## Úložiště v prohlížeči

- Simulátory i kurz SQL ukládají práci do `localStorage` (asi 5 MB na web).
  Kurz SQL povolí import 12 souborů po 2 MB a ukládá je jako base64, takže
  součet se do úložiště vejít nemusí. Když se práce neuloží, ukáže se pruh
  `UpozorneniUlozeni` a v kurzu SQL i upozornění před velkým importem.
- `localStorage` není záloha: jiný počítač, anonymní okno nebo vyčištění
  prohlížeče práci smaže. Výsledek se učiteli předává kódem postupu.
- **Kdy znovu:** kdyby třídy pracovaly s většími vlastními databázemi
  (přesun souborů do IndexedDB).

## Kód postupu je přehled, ne důkaz

- Kód postupu se dá přepsat a nic nepodepisuje. Podpis by vyžadoval server;
  tajný klíč v JavaScriptu by nic nezajistil. Učitel ho bere jako orientační
  přehled a důležité hodnocení ověřuje jinak (vysvětlení, obměna úlohy).

## Simulátor Windows

- Úpravy simulátoru Windows a jeho sdílených částí
  (`src/components/postup/VysledkySimulatoru.tsx`,
  `src/lib/postupSimulatoru.ts`) dělat jen na Karlův výslovný pokyn. Z auditu
  tam čekají: cíl odkazu „Přeskočit na obsah“ na `/windows`, ochrana proti
  dvěma otevřeným záložkám (u macOS a SQL hotová) a přísnější kontrola kódu
  postupu simulátorů v `postupSimulatoru.ts` (u kurzu SQL hotová,
  `src/lib/dbb/kodPostupu.ts`).

## Co z auditu se dělá průběžně, ne najednou

- **Dělení velkých souborů** (`BankBrowser.tsx`, `DbBrowser.tsx`,
  `xlsxPreview.ts`, `content.ts`): po malých krocích při běžných změnách.
  Hotové je vyčlenění náhledů do `src/components/bank/Nahled.tsx`. Další
  na řadě: u DB Browseru řízení disku a kurzu, z `content.ts` data nástrojů.
- **Stabilnější metadata** (id tématu a lekce, licence, datum úpravy v
  `_popis.json`), až se budou přidávat nové celky.
- **Měření rychlosti** hlavní stránky na slabším školním počítači (prázdná
  a plná mezipaměť) – před dalším dělením dat.
- **Historie témat v prohlížeči** (tlačítko Zpět): jen kdyby to uživatelům
  vadilo.
