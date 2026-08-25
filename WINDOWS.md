VIRTUÁLNÍ WINDOWS 11 (stránka /windows)

Výuková simulace prostředí Windows 11 pro hodiny informatiky. Běží celá
v prohlížeči žáka a nic se neinstaluje. Bez účtu se neodesílá nic; kdo si
účet založí, posílá na server přezdívku a seznam splněných úloh – nic víc.


CO TO JE A CO TO NENÍ
---------------------
Je to VĚRNÁ SIMULACE, ne skutečný operační systém. Vypadá a ovládá se jako
Windows 11, ale běží jako webová stránka. Proto:

 - nespustí se v ní žádný .exe ani nic nenainstaluje,
 - není v ní Word, Excel ani PowerPoint (a je to schválně – soubory .docx,
   .xlsx a .pptx tam jsou právě proto, aby si žák zkusil, co se stane, když
   pro příponu není nainstalovaná aplikace),
 - není připojená k internetu; prohlížeč zná jen několik vymyšlených stránek
   ve vnitřní síti (skola.local, ucebnice.local, stahovani.local).

Co v ní naopak funguje doopravdy: souborový systém (Průzkumník i příkazový
řádek sahají na tentýž disk), přípony, vlastnosti souborů, koš, archivy ZIP,
nastavení systému, Malování ukládá skutečné PNG a prohlížeč vykreslí HTML,
které si žák sám napíše v Poznámkovém bloku.


ÚČET A POSTUP
-------------
Cesta dovnitř: zamykací obrazovka → účet → plocha. Žádný přístupový kód se
nezadává; dřív tu byl, ale kontroloval se jen v prohlížeči, takže nic
nechránil, a byl z něj jen krok navíc na začátku hodiny.

Účet je DOBROVOLNÝ. Žák si zvolí přezdívku a heslo a jeho splněné úlohy se
k nim uloží, takže může pokračovat i na jiném počítači. Kdo nechce, klikne
na „Přeskočit" a jede dál – postup mu zůstane jen v tomhle prohlížeči.

Na server jde POUZE přezdívka a seznam ID splněných úloh. Nic z toho, co žák
v prostředí vytvoří – soubory, obrázky, texty, nastavení – server nikdy
nevidí; to všechno zůstává v prohlížeči.

Přezdívku si žák vymýšlí, nemá to být jeho jméno; přihlašovací obrazovka na
to upozorňuje. Heslo se ukládá zahashované (scrypt, vlastní sůl u každého
účtu), takže z úložiště se přečíst nedá.

Po přihlášení si karta prohlížeče pamatuje, že sezení běží, takže obnovení
stránky nevyhodí žáka ven. Zavřením prohlížeče se zapomene.


KDE SE UKLÁDÁ PRÁCE ŽÁKA
------------------------
Všechno, co žák v prostředí vytvoří, je v jeho prohlížeči (localStorage).
Klíč závisí na tom, jestli je přihlášený:

  bez účtu     win11-vyuka-stav
  s účtem      win11-vyuka-stav:<přezdívka>

To znamená:

 - práce přežije obnovení stránky, přestávku i vypnutí prohlížeče,
 - na JINÉM počítači po ní nezbyde nic – i u přihlášeného žáka se přenáší
   jenom seznam splněných úloh, ne jeho soubory,
 - v anonymním okně se nic neuloží,
 - ty jako učitel nevidíš, CO kdo vytvořil. Na server jde jen přezdívka
   a seznam splněných úloh, a dnes není nic, čím by sis to přečetl.

Vyčistit prostředí (vrátit výchozí stav): Start → Napájení → Vypnout a pak
Zapnout znovu NEZABERE – to jen zhasne obrazovku. Stav se maže smazáním dat
webu v prohlížeči (Ctrl+Shift+Del → Data webů), nebo z konzole:

  Object.keys(localStorage)
    .filter(k => k.startsWith("win11-vyuka-stav"))
    .forEach(k => localStorage.removeItem(k))

POZOR na dvě věci. Smazání dat webu v prohlížeči vymaže i stavy ostatních
tříd, které na tom počítači pracovaly – na sdíleném školním PC je to
hrubý nástroj. A samotný  localStorage.removeItem("win11-vyuka-stav")
smaže jen stav BEZ účtu; přihlášenému žákovi nechá ten jeho jmenný, proto
je výš ten delší příkaz.

Postup uložený na serveru si žák smaže sám: ve virtuálních Windows
Nastavení → Účty. Smaže se tím celý záznam včetně hesla.


ÚKOLOVNÍK
---------
Vpravo dole je odkládací panel „Úkoly". 34 úkolů v šesti skupinách. Nic
nezakazuje ani nevynucuje – jen se sám odškrtne, když je výsledek na počítači
vidět. Kontroluje se výsledek, ne cesta k němu: složku jde založit myší
i příkazem  md  a platí obojí.

Prvních 26 je na rozjezd – jeden krok, jedna nabídka. Skupina DELŠÍ ÚLOHY
je jinde: odpověď se zapisuje názvem složky, takže se kontroluje, jestli žák
došel ke správnému číslu, ne jestli prošel správnou cestu.

  Kolik fotek na 1 GB   správně 436. Kdo počítá s 1000 místo 1024, dostane
                        406 a složka se mu neodškrtne. O to přesně jde.
  Rok dvojkově          2026 = 11111101010
  Adresa počítače       poslední část IPv4 z ipconfig
  Co se zabalením       text se zmenší na dvě pětiny, fotka skoro vůbec –
  zmenší víc            JPEG je uvnitř zabalený už sám
  Kolize jmen           dvakrát Vzorce.txt ve dvou složkách; sloučit je jde
                        jen přejmenováním
  Skrytá zpráva         v Dokumentech je .pokyn.txt, který je vidět až po
                        zapnutí skrytých položek
  Web o dvou stránkách  index.html s nadpisem, třemi položkami a odkazem
  Úklid po viru         viz níž


CVIČNÝ ŠKODLIVÝ PROGRAM
-----------------------
Ve Stažených souborech leží  Fotky_z_vyletu.jpg.exe . Při výchozím nastavení
Windows, kdy jsou přípony skryté, se v seznamu tváří jako obyčejná fotka –
ale sloupec Typ už hlásí „Aplikace".

NIC SE NESPOUŠTÍ. Je to naskriptovaná změna stavu simulace. Po potvrzení
dialogu se připraveným souborům změní přípona na .zasifrovano, na plochu
spadne výzva k výkupnému a ve Správci úloh začne běžet  svhost.exe  (překlep
proti skutečnému svchost.exe je schválně – je to to, co má žák najít).

Co se NEZMĚNÍ: soubory, které si žák za hodinu vytvořil. Zasažené jsou jen
položky, které na disku byly od začátku. Nikdo tedy nepřijde o vlastní práci.

Jak z toho ven:
 - Správce úloh (Ctrl+Shift+Esc) → svhost.exe → Ukončit úlohu,
 - komu se povedlo Dokumenty předtím zazálohovat do ZIPu, rozbalí si je zpátky.

DOPORUČENÉ POŘADÍ V HODINĚ: nejdřív nechat žáky udělat zálohu, teprve potom
je pustit k té „fotce". Rozdíl mezi tím, kdo zálohu má a kdo ne, je ta
nejsilnější věc na celé lekci a nedá se odvyprávět.

Prostředí se vrátí do výchozího stavu smazáním dat webu v prohlížeči.

Splněný úkol zůstává splněný, i když po sobě žák uklidí.

Úpravy úkolů: soubor  src/lib/win/ukoly.ts . Každý úkol má název, popis
a funkci hotovo(stav), která vrací true/false. Testy v ukoly.test.ts hlídají,
že se seznam nerozbije.


CO V PROSTŘEDÍ JE
-----------------
Průzkumník souborů  karty, navigační podokno, adresní řádek (dá se do něj
                    psát cesta ručně), hledání, zobrazení Podrobnosti /
                    Ikony, řazení, přípony a skryté položky, Vlastnosti,
                    komprese do ZIP a rozbalení, koš s obnovením
Poznámkový blok     nabídky Soubor/Úpravy/Zobrazení, Uložit jako, stavový
                    řádek s pozicí kurzoru
Malování            tužka, štětec, guma, plechovka, čára, obdélník, elipsa,
                    barvy, tloušťka, zpět; ukládá skutečné PNG
Kalkulačka          standardní a programátorská (HEX/DEC/OCT/BIN a bity
                    ke klikání – nejnázornější věc na číselné soustavy)
Nastavení           Systém (obrazovka, zvuk, úložiště, Informace), Bluetooth,
                    Síť, Přizpůsobení (pozadí, barvy, motiv, hlavní panel),
                    Aplikace, Účty, Čas a jazyk, Usnadnění, Windows Update
Terminál            karty s příkazovým řádkem a PowerShellem nad TÝMŽ diskem
                    jako Průzkumník (dir, cd, md, rd, del, copy, move, ren,
                    type, tree, ipconfig, ping, systeminfo, help; v PowerShellu
                    Get-ChildItem, Set-Location, New-Item, Remove-Item…)
Správce úloh        běžící aplikace (Ukončit úlohu je opravdu zavře), Výkon
                    s grafy, Aplikace po spuštění
Fotky               prohlížeč obrázků se zvětšením, otočením a informacemi
Microsoft Edge      karty, adresní řádek, tři vnitřní stránky, stahování
                    souboru do složky Stažené soubory; otevře i .html soubor
                    z disku, který si žák sám napsal
Ovládací panely     starší rozcestník, který vede do nových Nastavení

Plocha: pravé tlačítko (Nový, Vložit, Zobrazit, Přizpůsobit), přejmenování
F2, mazání Delete. Hlavní panel: Start, hledání, běžící aplikace, rychlá
nastavení, hodiny s kalendářem. Okna: tažení, změna velikosti za všechny
okraje, maximalizace, přichycení k půlce nebo do rohu (i podržením tlačítka
maximalizace), Ctrl+Shift+Esc otevře Správce úloh.


NA CO SE ŽÁCI PTAJÍ (a co je dobré vědět předem)
------------------------------------------------
„Proč se složka v terminálu jmenuje Desktop, když v okně je Plocha?"
   Protože tak to má i skutečný Windows. Na disku je anglický název, český
   je jen popisek pro Průzkumník. Je to jedna z nejužitečnějších věcí, které
   si z toho odnesou.

„Proč nejde otevřít Rozvrh.docx?"
   Není nainstalovaný Word. Přípona neurčuje, co je uvnitř – určuje, kterou
   aplikaci Windows zkusí zavolat.

„Proč je disk 255 GB, ale Windows píše míň?"
   Průzkumník počítá 1 kB = 1024 B, výrobce disku 1000 B. Vysvětlení je
   i na stránce ucebnice.local uvnitř prohlížeče.

„Smazal jsem to příkazem del a není to v koši."
   Správně. del maže natrvalo, myš maže do koše. Je to jedna z mála věcí,
   kde je příkazový řádek tvrdší.


TECHNICKÉ POZNÁMKY
------------------
Kód je v  src/lib/win/  (logika, bez Reactu – dá se testovat) a
v  src/components/win/  (prostředí). Stránka je  src/app/windows/page.tsx .

Ikony ani tapety nejsou z Windows – jsou kreslené v kódu. Systémová grafika
Microsoftu je chráněná a do školního webu ji kopírovat nejde.

Testy:  npm test  (spustí i 80 testů k tomuhle prostředí).
