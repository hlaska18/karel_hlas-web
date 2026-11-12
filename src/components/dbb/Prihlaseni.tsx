"use client";

/**
 * Přihlášení do kurzu SQL (Karel 11. 11. 2026): na začátku nové karty napíše
 * žák jméno, nebo vloží kód postupu z jiného počítače. Stejně jako ve Windows,
 * na Macu a v labech. Co se s textem stane, rozhoduje `odesli` v DbBrowseru.
 */

import { useState } from "react";
import { t } from "@/lib/dbb/jazyk";
import { pisemka } from "@/lib/dbb/pisemka";
import { vypadaJakoKod } from "@/lib/dbb/prihlaseni";
import { Okno, Paticka, Tlacitko } from "@/components/dbb/okna";

export function PrihlaseniKurzu({
  odesli,
  zavrit,
}: {
  /** Vrátí chybu k zobrazení, nebo `null`, když přihlášení proběhlo (dialog si pak zavře sám). */
  odesli: (text: string) => { cs: string; en: string } | null;
  zavrit: () => void;
}) {
  const [text, nastavText] = useState("");
  const [chyba, nastavChybu] = useState("");
  const vPisemce = !!pisemka();
  const posli = () => {
    const c = odesli(text);
    if (c) nastavChybu(t(c.cs, c.en));
  };
  return (
    <Okno titulek={t("Přihlášení", "Sign In")} zavrit={zavrit} sirka={480}>
      <div className="px-5 py-4 text-[12px] leading-relaxed">
        <p>
          {vPisemce
            ? t(
                "Než začneš písemku, napiš své jméno a příjmení. Bude v kódu, který na konci pošleš učiteli.",
                "Before you start the test, type your first and last name. It goes into the code you send your teacher at the end.",
              )
            : t(
                "Jsi tu poprvé? Napiš své jméno a příjmení. Pokračuješ z jiného počítače? Vlož místo jména svůj kód postupu (začíná SQLKURZ1-) a hotové lekce se ti odškrtnou.",
                "Is this your first time here? Type your first and last name. Carrying on from another computer? Paste your progress code instead of your name (it starts with SQLKURZ1-) and your finished lessons are ticked off.",
              )}
        </p>
        <label className="mt-3 block">
          <span className="mb-1 block font-semibold">
            {vPisemce ? t("Jméno a příjmení", "First and last name") : t("Jméno a příjmení, nebo kód postupu", "Name, or progress code")}
          </span>
          <input
            value={text}
            onChange={(e) => {
              nastavText(e.target.value);
              nastavChybu("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                posli();
              }
            }}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!chyba}
            className={`h-[28px] w-full border bg-dbb-povrch px-2 text-dbb-text focus:border-dbb-akcent ${
              vypadaJakoKod(text) ? "dbb-kod text-[11px]" : "text-[13px]"
            } ${chyba ? "border-[#c42b1c]" : "border-dbb-linka"}`}
          />
        </label>
        <p role="alert" className="mt-1 min-h-[1.5em] text-[#a4262c]">
          {chyba}
        </p>
        <p className="text-dbb-slaby">
          {t(
            "Jméno ani práce se nikam neodesílají, zůstávají v tomhle prohlížeči. Učiteli je pošleš sám kódem postupu z Moje výsledky.",
            "Your name and work are not sent anywhere; they stay in this browser. You send them to your teacher yourself with the progress code in My Results.",
          )}
        </p>
      </div>
      <Paticka>
        <Tlacitko primarni akce={posli} zakazano={!text.trim()}>
          {t("Přihlásit se", "Sign In")}
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}
