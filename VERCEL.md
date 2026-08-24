ÚLOŽIŠTĚ POSTUPU NA VERCELU (nastavení krok za krokem)

Tenhle návod je pro Karla. Je potřeba jen jednou, než se zapne ukládání
postupu v úlohách virtuálních Windows napříč počítači.


K ČEMU TO JE
------------
Dnes si prostředí pamatuje splněné úlohy v prohlížeči (localStorage), takže kdo
začne ve škole, doma nenaváže. Aby postup přeskočil jinam, musí být uložený
někde venku. Na to slouží malé úložiště typu klíč–hodnota (Redis).

Uloží se do něj JEN dvě věci: přezdívka a seznam splněných úloh. Simulovaný
počítač (disk, soubory, nastavení) zůstává v prohlížeči a nikam neodchází.


DŮLEŽITÉ PŘEDEM
---------------
 - Web funguje i BEZ tohohle nastavení. Když proměnné nejsou, přihlášení řekne,
   že synchronizace neběží, a prostředí jede lokálně jako dosud. Nic se
   nerozbije, když se to udělá později nebo vůbec.
 - Tokeny ani hesla mi NEPOSÍLEJ. Nepotřebuju je vidět; Vercel je do projektu
   doplní sám a můj kód si je přečte z proměnných prostředí.
 - Vercel KV už neexistuje (v prosinci 2024 se přesunulo pod Upstash), takže se
   zřizuje přes Marketplace.


KROK 1 – ZŘÍDIT REDIS
---------------------
Nejdřív se podívej do Storage v levém sloupci, jestli tam nějaké úložiště
nemáš už z dřívějška. Když ano a je to Redis, přeskoč rovnou na krok 2.

POZOR: pokud tam Redis databáze je, ale patří k jinému projektu, NEPŘIPOJUJ ji
– založ novou. Klíče by se míchaly s tím, co v ní běží.

Když tam nic není:

 1. Otevři nástěnku Vercelu a v levém sloupci klikni na Integrations.
 2. Klikni na Browse Marketplace. (Nebo rovnou vercel.com/integrations.)
 3. V sekci Native Integrations najdi Upstash a otevři ho.
 4. Install → v dialogu se seznamem produktů vyber „Upstash for Redis"
    (popisek Redis Compatible Database). Ostatní produkty Upstashe jsou na něco
    jiného: QStash je fronta zpráv, Vector a Search jsou databáze pro AI
    vyhledávání. My potřebujeme klíč–hodnota.
 5. Region ber nejbližší, tedy Frankfurt. Free tarif bohatě stačí – ukládají se
    stovky bajtů na žáka. Continue.
 6. Vyplň Database Name (třeba „karelhlas-postup") a dej Create.

Kdyby Vercel hlásil „Integration already installed", znamená to, že Upstash na
účtu už je, jen v něm zatím není Redis. Pak jdi na Integrations → vedle Upstash
tlačítko Manage → sekce More Products → u „Upstash for Redis" dej Install.

Po vytvoření tě to hodí na stránku úložiště v sekci Storage.


KROK 2 – PŘIPOJIT K PROJEKTU
----------------------------
 1. Na stránce toho úložiště otevři záložku Projects.
 2. Connect Project → vyber projekt s webem.
 3. Custom Prefix nech PRÁZDNÝ. (Kdyby se vyplnil, proměnné dostanou předponu
    a kód je nenajde.)
 4. Connect.

Vercel tím do projektu sám doplní přihlašovací proměnné. Podívej se, jak se
jmenují – budou to buď KV_REST_API_URL a KV_REST_API_TOKEN, nebo
UPSTASH_REDIS_REST_URL a UPSTASH_REDIS_REST_TOKEN. Kód počítá s obojím, takže
se nemusí nic přepisovat; jen mi napiš, která dvojice to je, ať to můžu ověřit.


KROK 3 – PŘIDAT PODPIS
----------------------
Ještě jedna proměnná, kterou Vercel nedoplní, protože je naše: tajemství, kterým
se podepisuje přihlašovací lístek. Bez něj by šlo lístek zfalšovat a číst cizí
postup.

 1. Vygeneruj si dlouhý náhodný řetězec. V Terminálu na Macu:

        openssl rand -base64 48

 2. Zkopíruj, co to vypsalo.
 3. Ve Vercelu: projekt → Settings → Environment Variables.
 4. Name: POSTUP_PODPIS
    Value: ten řetězec
    Environments: zaškrtni Production, Preview i Development.
 5. Save.

Ten řetězec nikam neposílej a nikam si ho nepiš – když se ztratí, nic se
neděje, jen se vygeneruje nový a všichni se přihlásí znovu.


KROK 4 – NASADIT ZNOVU
----------------------
Proměnné se do běžícího webu nepropíšou samy. Buď pushni cokoli dalšího, nebo
ve Vercelu otevři Deployments, u posledního nasazení klikni na tři tečky
a dej Redeploy.


JAK POZNAT, ŽE TO JEDE
----------------------
Nejrychlejší kontrola – otevři si v prohlížeči adresu:

    https://karelhlas.vercel.app/api/postup/prihlaseni

Vypíše dvě ano/ne a co s tím. Žádné hodnoty, jen stav:

    Uloziste pripojene: ano
    Podpis nastaveny:   NE

    Chybi promenna POSTUP_PODPIS - viz krok 3 v VERCEL.md.

Když je někde NE a přitom sis myslel, že je hotovo, nejspíš chybí nové
nasazení (krok 4) – proměnné se do běžící stránky nepropíšou samy.

Potom už doopravdy:

 1. Otevři /windows a projdi přihlášení. Pod polem pro heslo NESMÍ být hláška
    o nedostupné synchronizaci.
 2. Založ si účet, splň jednu úlohu (třeba otevři Správce úloh).
 3. Otevři stejnou adresu v anonymním okně, přihlas se týmž jménem a heslem.
    Počet splněných úloh musí sedět.

Kdyby to nesedělo, napiš mi to a řeknu, kam se podívat – v Upstashi je konzole,
ve které je vidět, jestli tam záznam vůbec vznikl.


CO S TÍM DÁL
------------
 - Účty jsou přezdívky, ne jména žáků. Na serveru tedy leží dvojice
   přezdívka → splněné úlohy a záznam sám o sobě nikoho neidentifikuje.
 - Kdo si účet nechce zakládat, dá na přihlašovací obrazovce „Přeskočit" a
   prostředí mu běží s postupem jen v tom počítači.
 - Na konci školního roku má smysl úložiště vyprázdnit. Jde to jedním tlačítkem
   v konzoli Upstashe (Data Browser → Flush).
 - Žák si svůj postup smaže sám v Nastavení virtuálního počítače.
