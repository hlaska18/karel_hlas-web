/**
 * Vtíravé okno, které nejde zavřít.
 *
 * PROČ TO TU JE. Ze všech nepříjemností, na které člověk u počítače narazí,
 * je tahle nejčastější a nejmíň pochopená: vyskočí okno, člověk ho zavře, ono
 * se vrátí – a on ho zavírá pořád dokola. Lekce je jedna věta: KŘÍŽEK ZAVÍRÁ
 * OKNO, NE PROGRAM. Dokud běží proces, okno se může vracet donekonečna, a
 * jediné, co pomůže, je najít ten proces a ukončit ho.
 *
 * Napsat to na tabuli trvá deset vteřin a nikdo si to nezapamatuje. Nechat
 * žáka pětkrát zmáčknout křížek a pak mu nabídnout Správce úloh je totéž
 * sdělení, jenže si ho odnese.
 *
 * NENÍ TO VIR. Vir (`virus.ts`) sahá na soubory a je to vlastní hodina.
 * Tohle je otravný software – nic nerozbije, jen nejde pryč. Proto vlastní
 * soubor a vlastní proces, ne přílepek k viru.
 *
 * SPOUŠTÍ HO SCÉNÁŘ, ne výchozí disk. Kdyby vyskakovalo pokaždé, vyskočí
 * i v hodině o zipech a o příkazové řádce, kde jen zdržuje – a podruhé už
 * neučí nic. Volí se adresou: `/windows?scenar=reklama`.
 */

/**
 * Název procesu. Tváří se jako užitečný nástroj, protože přesně tak se tenhle
 * druh softwaru do počítače dostává – člověk si ho nainstaluje sám, většinou
 * přibalený k něčemu jinému.
 */
export const PROCES = "WinOptimizer.exe";

/** Titulek okna. */
export const TITULEK = "WinOptimizer Pro – kontrola systému";

/** Kolik procent si proces ukusuje z procesoru. Schválně nápadně moc. */
export const CPU = 43.8;

/** Text v okně. Pár vět, ať se dá přečíst dřív, než ho žák zavře. */
export const HLASKA = {
  nadpis: "Váš počítač je zpomalený o 47 %",
  podnadpis: "Nalezeno 1 293 chyb v registru a 84 nepotřebných souborů.",
  tlacitkoAno: "OPRAVIT TEĎ",
  tlacitkoNe: "Ne, chci mít pomalý počítač",
  /** Co se stane po kliknutí na kterékoli tlačítko – tedy nic. */
  poKliknuti: "Zkontrolujte připojení a zkuste to znovu.",
  /* Stejný důvod jako u výzvy k výkupnému: na fotce obrazovky není vidět
     nic než tohle okno, a bez téhle řádky vypadá jako skutečná nákaza.
     Druhá řádka říká to, na co se ptal i Karel: děje se to jen tady. */
  patka: "CVIČENÍ · výuková simulace, SPŠ strojní a stavební Tábor",
  patka2: "Běží jen v této záložce – tvého skutečného počítače se to netýká.",
};
