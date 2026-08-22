/**
 * Formátování čísel, velikostí a časů přesně tak, jak je ukazuje česká
 * lokalizace Windows. Je to detail, ale právě podle něj žák pozná, že se dívá
 * na něco povědomého – a hlavně na tom stojí učivo o jednotkách: v Průzkumníku
 * je 1 kB = 1024 bajtů, kdežto výrobce disku počítá s 1000.
 */

/** Pevná mezera mezi řády, jak to dělá Windows: `1 048 576`. */
export function cislo(n: number): string {
  return Math.round(n).toLocaleString("cs-CZ").replace(/ /g, " ");
}

/** Skloňování „bajt / bajty / bajtů". */
export function bajtu(n: number): string {
  if (n === 1) return "bajt";
  if (n >= 2 && n <= 4) return "bajty";
  return "bajtů";
}

/**
 * Velikost pro dialog Vlastnosti: `12,3 kB (12 632 bajtů)`.
 * Windows dělí 1024 a zaokrouhluje na jedno desetinné místo.
 */
export function velikostText(bajty: number): string {
  if (bajty < 1024) return `${cislo(bajty)} ${bajtu(bajty)}`;
  const jednotky = ["kB", "MB", "GB", "TB"];
  let hodnota = bajty / 1024;
  let i = 0;
  while (hodnota >= 1024 && i < jednotky.length - 1) {
    hodnota /= 1024;
    i += 1;
  }
  const desetinne = hodnota < 10 ? 1 : hodnota < 100 ? 1 : 0;
  return `${hodnota.toFixed(desetinne).replace(".", ",")} ${jednotky[i]}`;
}

/** Plný zápis do Vlastností: `12,3 kB (12 632 bajtů)`. */
export function velikostPodrobne(bajty: number): string {
  if (bajty < 1024) return `${cislo(bajty)} ${bajtu(bajty)}`;
  return `${velikostText(bajty)} (${cislo(bajty)} ${bajtu(bajty)})`;
}

/**
 * Sloupec Velikost v Průzkumníku: vždy v kB a vždy zaokrouhleno nahoru,
 * takže i jednobajtový soubor hlásí `1 kB`. Ano, i to je věrné.
 */
export function velikostSloupec(bajty: number): string {
  return `${cislo(Math.max(1, Math.ceil(bajty / 1024)))} kB`;
}

const dvojmisti = (n: number) => String(n).padStart(2, "0");

/** `22.08.2026 13:50` – tvar sloupce Datum změny. */
export function datumCas(ms: number): string {
  const d = new Date(ms);
  return `${dvojmisti(d.getDate())}.${dvojmisti(d.getMonth() + 1)}.${d.getFullYear()} ${dvojmisti(d.getHours())}:${dvojmisti(d.getMinutes())}`;
}

/** `22. srpna 2026 13:50:04` – tvar v dialogu Vlastnosti. */
const MESICE = [
  "ledna", "února", "března", "dubna", "května", "června",
  "července", "srpna", "září", "října", "listopadu", "prosince",
];

export function datumDlouhy(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()}. ${MESICE[d.getMonth()]} ${d.getFullYear()} ${dvojmisti(d.getHours())}:${dvojmisti(d.getMinutes())}:${dvojmisti(d.getSeconds())}`;
}

/** Hodiny na hlavním panelu: `13:50`. */
export function hodiny(d: Date): string {
  return `${dvojmisti(d.getHours())}:${dvojmisti(d.getMinutes())}`;
}

/** Datum na hlavním panelu: `22.08.2026`. */
export function datum(d: Date): string {
  return `${dvojmisti(d.getDate())}.${dvojmisti(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const DNY = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];

/** `pátek 22. srpna 2026` – záhlaví kalendáře v oznámeních. */
export function datumSlovy(d: Date): string {
  return `${DNY[d.getDay()]} ${d.getDate()}. ${MESICE[d.getMonth()]} ${d.getFullYear()}`;
}
