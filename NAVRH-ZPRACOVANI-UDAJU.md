# NÁVRH: Zpracování údajů

> **Tohle není hotový dokument.** Je to návrh sepsaný z toho, co web podle
> kódu doopravdy dělá. Než půjde na web, měl by ho projít někdo, kdo na to
> má razítko.
>
> **Od 4. 9. 2026 popisuje skutečnost.** Účty žáků byly zrušené (Karel,
> 1. 9. 2026: *„držet účty žáků nakonec vůbec nebudeme, uděláme to na ten kód
> WIN11"*), serverová část je pryč z kódu a Karel smazal i databázi v Upstashi
> a proměnné ve Vercelu. Ověřeno: `/api/postup/*` vrací 404.
>
> **Zveřejněno 6. 9. 2026** na `/soukromi` a `/en/soukromi`.

---

## Kdo web provozuje

Web provozuje **Mgr. Karel Hlas** jako fyzická osoba. Není to web školy,
i když materiály vznikají a ověřují se ve výuce na Střední průmyslové škole
strojní a stavební Tábor.

Kontakt: hlas@sps-tabor.cz

Poštovní adresu tu neuvádím. Karel to jako provozovatel rozhodl 6. 9. 2026
s tím, že za web odpovídá on a spojit se s ním jde e-mailem. Je to jeho
volba, ne opomenutí — kdyby se někdy ukázalo, že je adresa potřeba,
doplní se sem jedna věta.

---

## Co web ukládá

**Nic, podle čeho by šlo poznat, kdo jsi.**

Materiály si můžeš prohlížet a stahovat bez přihlášení. Nic se při tom
neodesílá a nic se o tobě neukládá.

### Virtuální Windows

Do prostředí se vstupuje **kódem**, který dostaneš od učitele. Kód není
účet: neváže se k tobě, nic si k němu neukládáme a je společný pro celou
třídu.

Co v prostředí uděláš — jaká okna otevřeš, co nakreslíš v Malování, jak
daleko dojdeš v úlohách — **zůstává v tomhle prohlížeči** a na server se
neodesílá. Když si smažeš data prohlížeče, zmizí to i tobě.

### SQL hřiště

Rozepsané dotazy zůstávají v tomhle prohlížeči. Na server se neodesílají.

### Návštěvnost

Web měří návštěvnost přes **Vercel Analytics**. Nepoužívá cookies a data
jsou souhrnná — kolik lidí kterou stránku otevřelo, odkud přišli, na jakém
zařízení. Jednotliví návštěvníci se z toho nepoznají a nespojují se
s ničím jiným.

---

## Kdo web provozuje technicky a kde běží

Web běží na **Vercelu**. Požadavek nejdřív obslouží nejbližší okraj sítě —
z Česka je to Frankfurt — ale **serverová část běží ve Spojených státech**
(oblast `iad1`, Washington). Vercel je americká společnost.

Znamená to, že technické údaje, které vzniknou při každém požadavku na
jakýkoli web (IP adresa, čas, typ prohlížeče), se zpracují i mimo Evropskou
unii. Vercel k tomu má standardní smluvní doložky.

Data se nikomu neprodávají ani nepředávají dál.

---

## Jak dlouho

Na serveru se **nic o návštěvnících nedrží**. Souhrnná návštěvnost si
uchovává Vercel podle svých podmínek.

Co je uložené v tvém prohlížeči, tam zůstane, dokud si to nesmažeš.

---

## Co s tím můžeš udělat

Protože o tobě nic neukládáme, není co vymazat ani opravit. Kdyby ti přesto
něco vrtalo hlavou, napiš na hlas@sps-tabor.cz.

Data, která si prostředí uložilo u tebe, smažeš v nastavení prohlížeče
(historie → data webů) nebo přímo v prostředí.

---

## Nezletilí

Prostředí používají žáci střední školy. Proto je postavené tak, aby se
**nezadávalo nic osobního**: žádný účet, žádné jméno, žádný e-mail, jen kód
od učitele.

---

## Změny

Až se tenhle text změní, bude tu datum poslední úpravy.

---
---

# Co bylo potřeba udělat, než to mohlo ven

Všechno hotovo. Nechávám tu pro dohledatelnost, co se muselo stát, aby text
výše popisoval pravdu:

1. **Odstranit serverovou část postupu** — `src/lib/postup/`,
   `src/app/api/postup/`, klienta v `Prihlaseni.tsx`. ✓ `2a29fef`
2. **Vrátit vstupní kód**, tentokrát i s kódy pro třídy. ✓ `2a29fef`
   Pozor na to, proč se ten původní rušil (`de570c6`): kontroloval se **jen
   v prohlížeči**, a protože zůstával výchozí, přihlašovací obrazovka ho sama
   nabízela tlačítkem. Nový kód je proto pojmenovaný jako **organizační
   opatření** — „tohle je pro moji třídu" — a nevydává se za zabezpečení.
3. **Smazat, co v úložišti zbylo.** ✓ 4. 9. 2026 — Karel smazal celou
   databázi v Upstash konzoli, takže s ní zanikly i účty žáků.
4. **Odpojit úložiště od projektu ve Vercelu.** ✓ 4. 9. 2026 — `POSTUP_PODPIS`
   i všechny proměnné `KV_*` odstraněné.

Ověřeno zvenčí: `/api/postup/prihlaseni` i `/api/postup/ulozit` vracejí 404
a v `src/` není jediná zmínka o `KV_REST_API`, `POSTUP_PODPIS` ani `UPSTASH`.

**Hotovo.** Karel 6. 9. 2026 rozhodl, že poštovní adresa se uvádět nebude
a kontaktem zůstává e-mail. Text tím ztratil poslední `⟨…⟩` a je zveřejněný
na `/soukromi` (a `/en/soukromi`), odkazovaný z patičky a ze zamykací
obrazovky virtuálního prostředí.
