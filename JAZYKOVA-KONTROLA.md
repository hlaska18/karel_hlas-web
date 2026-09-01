# Jazyková a logická kontrola

Stav k 1. 9. 2026. Prošel jsem texty webu v obou jazycích a materiály —
111 souborů, zhruba 723 tisíc znaků prózy.

Seznam je řazený podle závažnosti. Většina toho, co automatické kontroly
vyhodily, byly plané poplachy z mého vlastního nástroje, ne chyby v textech;
píšu je sem taky, aby bylo vidět, co se prověřovalo a proč to prošlo.

---

## Opraveno

### 1 · Klíč k Digitální gramotnosti popisoval starší verzi listu

`_ucitel/Řešení - Digitální gramotnost.docx` u lekce 3 citoval domény, které
v pracovním listu **nejsou**. List byl někdy dřív předělaný na vyhrazenou
doménu `.example`, klíč se s ním neposunul:

| klíč tvrdil | v listu doopravdy je |
|---|---|
| `ceska-posta-dorucenii.xyz` | `ceska-posta-dorucenii.example` |
| `posta-platba.xyz` | `posta-platba.example` |
| `-team.com` | `micros0ft-team.example` |
| zkrácený odkaz `bit.ly` | **nic** — e-mail C obsahuje `overeni-uctu.example` |

Ten poslední je nejhorší: klíč popisoval důkaz, který v listu neexistuje.
Učitel by ho hledal a mohl strhnout bod za správnou odpověď. Opraveno, včetně
náhrady bit.ly za to, co v e-mailu skutečně je.

Změna `.xyz`/`.com` → `.example` v listu byla správná a zůstává: `.example`
je pro ukázky vyhrazená, kdežto `.xyz` a `.com` si někdo může zaregistrovat.

### 2 · `cd Dokumenty` na českých Windows spadne

Pracovní list 6 (Příkazový řádek) začínal misi krokem `cd Dokumenty`. Jenže
„Dokumenty" je jen **lokalizovaný popisek**, který ukazuje Průzkumník —
složka se na disku jmenuje `Documents` a příkazový řádek zná jen skutečný
název. Mise tedy padala hned na druhém kroku, v hodině, jejímž smyslem je
ukázat, že příkazová řádka je spolehlivá.

Že jde o chybu v listu a ne o nejasnost, potvrzuje Karlovo vlastní virtuální
prostředí: `src/lib/win/seed.ts` má na disku `Documents`, `Desktop`
i `Downloads` anglicky a v próze píše „složka Dokumenty" — tedy správně.

Opraveno v listu 6, v plánu hodiny 6 i v klíči (`dir /w Documents`).
Do mise jsem doplnil větu, která ten rozdíl vysvětluje — je to užitečné
zjištění samo o sobě a žák na něj narazí přesně tam.

### 3 · Web tvrdil o virtuálním prostředí dvě věci, které přestaly platit

Po zrušení účtů žáků zůstaly na webu dvě věty z původního stavu:

- `src/app/windows/page.tsx` — *„Otevře se rovnou, **bez kódu** i bez
  instalace… kdo si **založí účet**, odešle se o něm jen přezdívka
  a seznam splněných úloh."* Obojí je dnes naopak: kód se vrátil a účty
  zanikly.
- `src/components/BankBrowser.tsx` — *„Kdo chce, aby se mu postup přenesl
  i na jiný počítač, **zvolí si přezdívku a heslo**."* (a totéž anglicky).

To není jen zastaralý text — je to tvrzení o zpracování údajů, a právě
takové věty musí sedět. Opraveno česky i anglicky.

### 4 · Jedna výzva vypadla z rozkazovacího způsobu

Digitální pracovní sešit, lekce 5: pět výzev začíná rozkazem („Najdi…",
„Přeformuluj…"), šestá oznamovacím *„Dohledáš původní stránku ÚOOÚ…"*.
Opraveno na „Dohledej".

### 5 · Rozcestník tématu Umělá inteligence mlčel o jedné složce

`1L/10/Začni zde.txt` vyjmenovával v sekci STRUKTURA pět složek, ale složka
**`Doporučené čtení`** mezi nimi nebyla — přestože na disku je a vede z ní
odkaz na příručku „101 tipů, jak využít AI ve výuce" Karla Klatovského.
Doplněno, včetně poznámky, že je to čtení navíc, ne součást hodin.

### 6 · Časování na dvou prezentacích nesedělo s metodikou

Prezentace tématu 7 mají na každém snímku časové pásmo (`13–42 MIN · PRÁCE`)
a devět z deseti drží tentýž vzor: `PRÁCE` začíná tam, kde končí `MINIMUM`.

**Hodina 8 měla `5–43 MIN · PRÁCE`**, tedy start v páté minutě — uvnitř
vlastního bloku `MINIMUM` (5–21) a v rozporu s metodikou, kde praktická část
začíná ve 21. minutě. Opraveno na `21–43`.

Druhá věc: závěrečný snímek nese štítek `POSLEDNÍ 3 MINUTY`. U osmi hodin
odpovídá metodice přesně, u dvou ne — hodina 2 má exit ticket 41–45 (čtyři
minuty) a hodina 8 má 43–45 (dvě). Že to osmkrát sedí, ukazuje, že je to
myšlené doslova, ne jako obecné heslo. Opraveno podle metodiky, protože její
minutové scénáře pokrývají 0→45 bez děr a překryvů — jsou tedy autoritativní,
štítek je z nich odvozený.

---

## Na zvážení — neopravuji sám

### A · Digitální gramotnost nedodává složku `CHAOS`

Pracovní list 2 posílá žáky: *„Stáhni si ze sdíleného umístění (řekne
učitel) složku CHAOS se soubory."* Metodika to učiteli ukládá — *„připravit
složku CHAOS s 8–10 chaoticky pojmenovanými soubory různých typů"* — takže
to není opomenutí v dokumentaci.

Je to ale jediná aktivita v obou tématech, kde si musí učitel podklad vyrobit
sám. Téma Internet a bezpečnost má na totéž složku `Podklady k aktivitám`
s jedenácti hotovými soubory. Osm až deset souborů, které se dají roztřídit
do `Informatika` / `Matematika` / `Cestina` / `Odborne_predmety`, je práce
na pár minut a ušetří ji každému, kdo si materiál stáhne.

**Neudělal jsem to** — je to nový výukový obsah a ten píšeš ty. Řekni a dodám
ho jako ZIP ve tvaru, jaký má téma 7.

### B · Nikde nejsou pevné mezery

Změřeno na všech materiálech i na webu:

| | jednopísmenné předložky | z toho s pevnou mezerou |
|---|---:|---:|
| materiály (111 souborů) | 4 824 | **0** |
| web (`src/`) | 2 344 | **0** |

Česká sazba (ČSN 01 6910) nemá nechávat `k`, `s`, `v`, `z`, `o`, `u`, `a`,
`i` na konci řádku. Je to stejnoměrné — nikde to udělané není, takže to není
nedůslednost, jen to zatím nikdo neřešil. Word ani prohlížeč to sám neopraví.

Na webu je to vidět víc: text se přelévá podle šířky okna, takže na mobilu
osamocená předložka vyskočí tam, kde na počítači není.

**Neopravuji plošně** — je to sedm tisíc zásahů do 111 souborů a ve Wordu by
z toho byl obrovský rozdíl proti tvým originálům. Dávalo by smysl začít
webem, kde je jich čtvrtina a jde o jeden soubor s texty.

---

## Prověřeno a v pořádku

### Testy A a B počítají správně

| kontrola | výsledek |
|---|---|
| součet bodů, varianta A | 1+2+2+2+3+2+2+3+1+2 = **20** ✓ |
| součet bodů, varianta B | totéž rozložení = **20** ✓ |
| rozpis v klíči („1 a 9 po 1 b, 2/3/4/6/7/10 po 2 b, 5 a 8 po 3 b") | 2 + 12 + 6 = **20** ✓ |
| známkovací stupnice 20–18 / 17–15 / 14–11 / 10–9 / ≤8 | bez děr i překryvů ✓ |
| „metodika doporučuje alespoň 45 %, tedy 9 bodů" | 45 % z 20 = 9 ✓, a metodika to opravdu říká ✓ |

### Kontrola integrity souborů funguje přesně tak, jak má

Podklady `4. Kontrola integrity - projekt A/B.txt` se liší jedinou číslicí
(`125000` × `125900`) a jsou **stejně dlouhé** — přesně to, co aktivita
potřebuje, aby žák viděl, že drobná změna překlopí celý otisk:

```
A  6d2b842a20e3d8f4e1ff6779cca93a633eaa7b09b331c7e4fd1a14a0618e65a8
B  f74207f076946cd45f8356f51a820bfba7a70531dc69a61631f0beea53331c51
```

Klíč to i takhle vysvětluje: *„liší se částka rozpočtu; hash sám neřekne,
která verze je správná."*

### Prezentace popisují studii přesně

Prezentace 6 shrnuje fiktivní studii jako *„32 účastníků, tři podmínky a tři
krátké úlohy; rozdíl se projevil pouze v jedné úloze."* Sešit mluví jen
o „krátkodobém testu paměti", takže „tři úlohy" vypadaly jako přidané. Zdroj
je ale potvrzuje doslova — `Zdroj C.html` v podkladech k 5P má v oddílu
Method: *„Třicet dva účastníků absolvovalo tři krátké úlohy pracovní paměti
ve třech podmínkách"* a v Results *„Rozdíl mezi podmínkami byl pozorován
pouze v jedné úloze."*

### Metodika záměrně nemá položkové klíče

Chvíli to vypadalo jako díra — šest tvrzení Pravda/Omyl bez odpovědí. Ale
metodika je celá stavěná na oddílu **„Očekávané závěry"** a výslovně říká:
*„Správnou odpověď zveřejni až po krátké obhajobě skupin."* Všech šest
tvrzení z těch závěrů odvodit jde. Je to postoj, ne opomenutí.

### Odkazované úřední weby žijí

Hodina 5 staví na vyhledávání na konkrétních doménách. Ověřeno:
`nukib.gov.cz`, `nukib.cz`, `uoou.gov.cz` i `uoou.cz` odpovídají (a starší
i novější tvar míří na tutéž adresu, takže žákovi projde obojí).

### Žádný materiál neposílá žáky zakládat účet

Po zrušení účtů jsem prošel všech 111 souborů. Jediná zmínka o prostředí je
v listu 1: *„vejdeš tam kódem od vyučujícího"* — správně. Zastaralé věty byly
jen na webu (nález 3).

### Klíče citují to, co v listech opravdu je

Po opravě nálezu 1 souhlasí každá citace v uvozovkách s textem listů. Dvě
zbylé neshody v Digitální gramotnosti jsou parafráze — klíč píše *„do 24
hodin, jinak zničena"* s diakritikou, kterou podvodné e-maily schválně
nemají. Tři neshody v klíči k testům (*„je to bezpečné"*, *„Našel jsem to na
Googlu"*, *„vizuální vada není důkaz"*) jsou **vymyšlené špatné odpovědi**,
u kterých klíč říká „= 0 b". Ty nikde být nemají.

### Čeština a angličtina na webu si odpovídají

216 klíčů v každém jazyce, **strom sedí přesně**. Prošel jsem i všech osm
popisů předmětů v sekci „Pro ostatní předměty" po dvojicích: český
i anglický text mluví o tomtéž předmětu a překlady jsou idiomatické.

### Čísla v dokumentech odpovídají skutečnosti

| téma | tvrzení | skutečnost |
|---|---|---|
| Umělá inteligence | 6 prezentací po 7 snímcích, 6 hodin | 6 × 7 ✓ |
| Grafika a multimédia | 8 prezentací po 7 snímcích, celkem 56 · 5 modulů ve 4 laboratořích | 8 × 7 = 56 ✓ · 5 modulů ve 4 ✓ |
| Internet a bezpečnost | 10 hodin, každá 7 snímků | 10 × 7 ✓ |

### Texty nejsou slepené

Automatická kontrola nejdřív ohlásila 62 míst, kde věta navazuje bez mezery.
**Všechna byla planá** — v dokumentu je mezi nimi `<w:br/>` a ve Wordu se to
zobrazí správně na dvou řádcích; jen můj extraktor zalomení zahazoval.

### Tykání sedí

Vykání se našlo ve čtyřech prezentacích, ale ve všech případech jde o **přímou
řeč učitele ke třídě** („Napište si svou odpověď…"), kde je množné číslo
správně.

### Dlaždice jsou všude stejně vysoké

Změřeno na 768 a 1440 px: **žádná mřížka nemá v řádku různě vysoké karty.**
Ta v „Pro ostatní předměty" byla jediná a je opravená (`3895a40`).

---

## Kde jsem se sám spletl

Píšu to sem, protože to říká, jak spolehlivá tahle kontrola je.

- **62 „slepených vět"** — můj extraktor zahazoval `<w:br/>`.
- **Neshoda předmětů cs/en** — bral jsem první výskyt klíče v každém stromě
  a nebyly to tytéž.
- **„Zdvojená předpona `-webkit--webkit-`"** — můj regulární výraz si ji
  vyrobil sám tím, že vykousl `mask-image:` zevnitř `-webkit-mask-image:`.
- **„Hranice 45 % v metodice není"** — byla, na řádku 791. Můj `head -8` ji
  uřízl dřív, než se stihla vypsat.
- **„Materiály nepoužívají pevné mezery" napodruhé** — první dvě měření byla
  bezcenná, protože jsem oběma větvím dal omylem tentýž vzor. Až třetí,
  s pevnou mezerou zapsanou jako ` `, něco měřilo.

Čtyři z těch pěti jsem chytil dřív, než jsem je ohlásil jako závadu. Pátou
(45 %) jsem ohlásit stihl a opravuju ji tady.

---

## Co zbývá

**Nic.** Pozorné čtení věta po větě je hotové u všech čtyř velkých témat —
Grafika, Umělá inteligence, Internet a bezpečnost i Digitální gramotnost —
včetně všech deseti prezentací tématu 7 (70 snímků, 70 stran poznámek).

Otevřené zůstávají jen dvě věci z oddílu „Na zvážení", a obě jsou tvoje
rozhodnutí, ne nález: složka `CHAOS` a pevné mezery.
