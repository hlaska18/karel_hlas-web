JAK PŘIDAT MATERIÁL (bez cloudu, bez editace kódu):

1) Otevři složku kurzu a v ní číslo tématu, např.:
   public/materialy/1L/4/      (1L = 1. ročník Technické lyceum, 4 = 4. téma)
   Které číslo je které téma → viz _TEMATA.txt v každé složce kurzu.

2) Přetáhni do ní soubor (PDF, prezentaci, …). Název souboru = popisek na webu.

3) V GitHub Desktopu klikni Push. Za ~1–2 min se materiál objeví u tématu.

POJMENOVÁNÍ: název složky i souboru je zároveň popisek na webu, takže se píše
česky, s diakritikou a velkým počátečním písmenem ("Výstupy k posouzení", ne
"vystupy_k_posouzeni"). Výjimka jsou soubory, jejichž název nese parametry ke
zkoumání (video_1280x720_30fps.mp4) – ty zůstávají technické schválně.

PODSLOŽKY:
 - Obyčejná podsložka (např. "Pracovní listy/") = rozbalovací skupina materiálů.
 - Podsložka "_ucitel/" = UČITELSKÉ materiály. Dostanou odznak "Pro učitele"
   a vypadnou z indexu vyhledávačů (robots.txt).
   POZOR: v bance je vidí a stáhne KAŽDÝ. Přepínač Žák/Učitel na webu není,
   odznak je jen popisek. Když chceš něco schovat před žáky, nedávej to sem.
   Příklad: public/materialy/1L/8/_ucitel/Metodika.pdf
   Uvnitř "_ucitel/" může být i podsložka = rozbalovací učitelská skupina, např.
   public/materialy/1L/5/_ucitel/Python - metodické listy/MetodL00.pdf
 - Podsložka "_zaci/" = materiály s odznakem "Pro žáky" (vidí je všichni).

ODZNAKY (jen v učitelském pohledu): u každého materiálu se ukáže "Pro učitele",
"Pro žáky", nebo "Pro učitele i žáky". Přiřadí se automaticky podle názvu
(metodika→učitel, pracovní list/úloha/žák→žáci, jinak oba) nebo přes složky
_ucitel/_zaci. Když chceš jinak, napiš mi a nastavím to natvrdo.

ANGLICKÁ VERZE: názvy viditelných materiálů/složek mají anglický překlad
(tabulka v src/lib/materials.ts). Nový materiál se v EN verzi zobrazí česky,
dokud mi nedáš vědět – pak doplním anglický název. (Vnitřní číslované listy
zůstávají česky.)

Kurzy:  1L = Technické lyceum · 1S = Strojírenství · 1P = Pozemní stavitelství
Tip: velká videa sem nedávej (radši YouTube odkaz) – web má mít rozumnou velikost.
