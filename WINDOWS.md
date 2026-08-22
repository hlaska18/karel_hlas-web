VIRTUÁLNÍ WINDOWS 11 (stránka /windows)

Výuková simulace prostředí Windows 11 pro hodiny informatiky. Běží celá
v prohlížeči žáka, nic se neinstaluje a nic se neodesílá.


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


PŘÍSTUPOVÝ KÓD
--------------
Výchozí kód je  WIN11  (nezáleží na velikosti písmen, mezerách ani pomlčkách).

Změna kódu: soubor  src/lib/win/pristup.ts , řádek

    export const PRISTUPOVY_KOD = "WIN11";

Přepiš řetězec, ulož, v GitHub Desktopu klikni Push. Za ~1–2 minuty platí
nový kód. Nic jiného měnit netřeba.

POZOR: kód je závora, ne zámek. Je součástí stránky, takže kdo se umí
podívat do zdrojového kódu, najde ho. Má držet pohromadě třídu, ne bránit
útočníkovi – nic citlivého za ním není.

Po zadání kódu si ho karta prohlížeče pamatuje, takže obnovení stránky
nevyhodí žáka ven. Zavřením prohlížeče se zapomene.


KDE SE UKLÁDÁ PRÁCE ŽÁKA
------------------------
V prohlížeči žáka (localStorage), pod klíčem  win11-vyuka-stav . To znamená:

 - práce přežije obnovení stránky, přestávku i vypnutí prohlížeče,
 - na JINÉM počítači po ní nic nezbyde,
 - v anonymním okně se nic neuloží,
 - ty jako učitel nevidíš, co kdo udělal – nic se nikam neodesílá.

Vyčistit prostředí (vrátit výchozí stav): Start → Napájení → Vypnout
a pak Zapnout znovu nezabere; stav se maže smazáním dat webu v prohlížeči
(Ctrl+Shift+Del → Data webů) nebo z konzole příkazem
  localStorage.removeItem("win11-vyuka-stav")


ÚKOLOVNÍK
---------
Vpravo dole je odkládací panel „Úkoly". 26 úkolů v pěti skupinách. Nic
nezakazuje ani nevynucuje – jen se sám odškrtne, když je výsledek na počítači
vidět. Kontroluje se výsledek, ne cesta k němu: složku jde založit myší
i příkazem  md  a platí obojí.

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
