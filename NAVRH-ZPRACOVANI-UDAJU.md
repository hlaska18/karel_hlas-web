# NÁVRH: Zpracování údajů

> **Tohle není hotový dokument.** Je to návrh sepsaný z toho, co web podle
> kódu doopravdy dělá — ověřoval jsem `src/lib/postup/`, `src/app/api/postup/`
> a `src/app/layout.tsx`. Než to půjde na web, musí to projít někdo, kdo na
> to má razítko, a musí se doplnit dvě věci, které z kódu vyčíst nejdou:
> **kdo je správce** (Karel jako fyzická osoba, nebo škola) a **jak dlouho
> se účty drží**.
>
> Místa k doplnění jsou označená `⟨takto⟩`.

---

## Kdo web provozuje

⟨Doplnit: jméno nebo škola, adresa.⟩

Kontakt: hlas@sps-tabor.cz

---

## Co web ukládá

### Většina webu neukládá nic

Materiály si můžeš prohlížet a stahovat bez přihlášení. Nic se při tom
neodesílá a nic se neukládá.

### Virtuální Windows — jen když se přihlásíš

V prostředí virtuálního Windows si můžeš založit účet, aby ti zůstal
splněný postup i po zavření prohlížeče. **Je to dobrovolné.** Když klikneš
na *Přeskočit*, postup zůstane jen v tomhle počítači a na server nejde nic.

Když se přihlásíš, uloží se:

| co | proč |
|---|---|
| přezdívka | aby se ti postup našel |
| otisk hesla | aby se dalo ověřit heslo, aniž by se ukládalo |
| seznam splněných úloh | vlastní postup |
| kdy jsi účet založil a kdy ses naposled přihlásil | úklid starých účtů |

**Heslo se neukládá.** Ukládá se z něj jen otisk (scrypt se solí), ze
kterého heslo zpátky nesestavíš.

**Přezdívku si vymysli.** Na přihlašovací obrazovce to stojí a platí to:
když nepoužiješ svoje jméno, nikdo z toho, co je uložené, nepozná, kdo jsi.

Nic dalšího z prostředí se neukládá — jaká okna jsi otevřel, co jsi
nakreslil v Malování ani co sis nastavil zůstává v tomhle prohlížeči.

### Ochrana proti hádání hesla

Aby nešlo hesla zkoušet dokola, počítá se počet neúspěšných pokusů podle
přezdívky a podle IP adresy. Tahle počítadla **se sama mažou** po patnácti
minutách, respektive po deseti.

### Návštěvnost

Web měří návštěvnost přes Vercel Analytics. **Nepoužívá cookies** a data
jsou souhrnná — kolik lidí kterou stránku otevřelo. Jednotliví návštěvníci
se z toho nepoznají.

### SQL hřiště

Rozepsané dotazy zůstávají v tomhle prohlížeči. Na server se neodesílají.

---

## Kdo se k tomu dostane

| kdo | k čemu |
|---|---|
| ⟨správce⟩ | k účtům v prostředí |
| Vercel | provoz webu a měření návštěvnosti |
| Upstash | úložiště, ve kterém účty leží |

Data se nikomu neprodávají ani nepředávají dál.

⟨Doplnit: kde servery leží — u Vercelu i Upstashe jde region nastavit
a je potřeba ověřit, jak je nastavený tenhle projekt.⟩

---

## Jak dlouho

⟨Doplnit. Dnes účty **žádnou expiraci nemají** a to je potřeba změnit —
navrhuju smazat účet, na který se rok nikdo nepřihlásil. Počítadla pokusů
se mažou sama, viz výše.⟩

---

## Co s tím můžeš udělat

Napiš na hlas@sps-tabor.cz a:

- řeknu ti, co je u tvé přezdívky uložené,
- smažu to,
- opravím, co je špatně.

Když si nepamatuješ přezdívku, nemám jak účet najít — a to je záměr, ne
chyba. Nic jiného, podle čeho by šel dohledat, uložené není.

---

## Nezletilí

Prostředí používají žáci střední školy. Proto je to postavené tak, aby
**nebylo potřeba nic osobního**: vymyšlená přezdívka, žádný e-mail, žádné
jméno, a přihlášení je dobrovolné.

⟨Zvážit: jestli o tom mají vědět zákonní zástupci, a jestli to nemá být
součástí školní dokumentace.⟩

---

## Změny

Až se tenhle text změní, bude tu datum poslední úpravy.
