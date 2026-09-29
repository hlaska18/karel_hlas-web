"use client";

/**
 * Pruh nahoře, když se práce nedaří uložit do prohlížeče (viz `lib/ulozeni`).
 * Je v kořenovém layoutu, takže platí pro web, simulátory Windows a macOS
 * i kurz SQL. Zmizí sám, jakmile se další uložení povede.
 */

import { useEffect, useState } from "react";
import { UDALOST_ULOZENI } from "@/lib/ulozeni";

export function UpozorneniUlozeni() {
  const [selhalo, nastav] = useState(false);
  const [skryto, nastavSkryto] = useState(false);

  useEffect(() => {
    const h = (e: Event) => {
      const ok = (e as CustomEvent<boolean>).detail;
      nastav(!ok);
      if (!ok) nastavSkryto(false);
    };
    window.addEventListener(UDALOST_ULOZENI, h);
    return () => window.removeEventListener(UDALOST_ULOZENI, h);
  }, []);

  if (!selhalo || skryto) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[2147483000] flex items-start justify-center gap-3 bg-[#a4262c] px-4 py-2.5 text-sm leading-snug text-white shadow-lg"
    >
      <p className="max-w-3xl">
        <b>Tvoje práce se neukládá.</b> Úložiště prohlížeče je plné nebo zakázané (třeba
        anonymní okno). Když stránku zavřeš nebo obnovíš, rozdělaná práce zmizí. Pošli si
        kód postupu (Moje výsledky) nebo si soubor stáhni, dokud je okno otevřené.
      </p>
      <button
        type="button"
        onClick={() => nastavSkryto(true)}
        className="shrink-0 rounded px-2 py-0.5 font-semibold underline-offset-2 hover:underline"
        aria-label="Zavřít upozornění"
      >
        Rozumím
      </button>
    </div>
  );
}
