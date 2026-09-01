# NÁVRH: Zpracování údajů

> **Tohle není hotový dokument.** Je to návrh sepsaný z toho, co web podle
> kódu doopravdy dělá. Než půjde na web, měl by ho projít někdo, kdo na to
> má razítko.
>
> **Popisuje CÍLOVÝ stav po zrušení účtů** (Karel, 1. 9. 2026: *„držet účty
> žáků nakonec vůbec nebudeme, uděláme to na ten kód WIN11"*). Dokud se účty
> z kódu neodstraní, text neodpovídá skutečnosti a **nesmí se zveřejnit** —
> odstranění je popsané na konci.
>
> Zbývá doplnit jedinou věc: `⟨adresu pro doručování⟩`.

---

## Kdo web provozuje

Web provozuje **Mgr. Karel Hlas** jako fyzická osoba. Není to web školy,
i když materiály vznikají a ověřují se ve výuce na Střední průmyslové škole
strojní a stavební Tábor.

⟨Doplnit adresu pro doručování. U fyzické osoby stačí kontaktní adresa,
nemusí to být adresa bydliště — dá se uvést adresa školy, pokud s tím škola
souhlasí.⟩

Kontakt: hlas@sps-tabor.cz

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

# Co je potřeba udělat v kódu, než to půjde ven

Dnešní stav tomuhle textu **neodpovídá**. Ve virtuálním Windows si žáci
zakládají účty a postup se jim ukládá na server — a na produkci to běží.

1. **Odstranit serverovou část postupu:** `src/lib/postup/`,
   `src/app/api/postup/`, klienta v `Prihlaseni.tsx`.
2. **Vrátit vstupní kód**, tentokrát i s kódy pro třídy. Pozor na to, proč
   se ten původní rušil (`de570c6`): kontroloval se **jen v prohlížeči**,
   a protože zůstával výchozí, přihlašovací obrazovka ho sama nabízela
   tlačítkem. Zábrana, kterou obsluha otevírá návštěvníkovi sama. Nový kód
   má smysl jako **organizační opatření** — „tohle je pro moji třídu" —
   a je poctivé to tak i pojmenovat, ne vydávat ho za zabezpečení.
3. **Smazat, co v úložišti zbylo.** Účty, které si žáci stihli založit,
   je potřeba odstranit — jinak text lže i po odstranění kódu.
4. **Odpojit úložiště** od projektu ve Vercelu (proměnné `KV_REST_API_URL`
   a `POSTUP_PODPIS`), ať se nedá omylem oživit.

Teprve pak text výše popisuje pravdu.

## Kdyby ses přece jen rozhodl účty ponechat

Pak je potřeba doplnit ještě dvě věci, které z kódu vyčíst nejde:

- **Kde leží úložiště Upstash.** Ve Vercelu: projekt → *Storage* → klikni na
  databázi → *Region*. Nebo na console.upstash.com u té databáze. Region je
  potřeba znát, protože u Upstashe jde vybrat i evropský a to je rozdíl.
- **Jak dlouho účty držet.** Dnes se nemažou nikdy.
