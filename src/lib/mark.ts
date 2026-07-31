/**
 * Značka webu: lomené závorky „< >" – informatika bez terminálového klišé.
 *
 * Jeden zdroj pravdy pro všechna místa, kde se značka objevuje (hlavička,
 * patička, stránka kurzu, favicona, ikona pro iOS, karta pro sdílení).
 * Tvar je všude stejný, mění se jen povrch:
 *  - v webu     → sklo (`glass-accent`), stejný jazyk jako ikony témat,
 *  - samostatně → plná malachitová plocha s bílými závorkami, protože
 *    favicona v 16 px na neznámém pozadí musí mít kontrast.
 */

/** Tahy závorek ve výřezu 24×24 (stejná geometrie jako ikony lucide). */
export const MARK_PATHS = ["M8 6 3 12l5 6", "m16 6 5 6-5 6"] as const;

/** Samostatné SVG značky: zaoblený čtverec s pozadím a závorkami uvnitř. */
export function markSvg({
  size = 64,
  /** Barva podkladu; `null` = průhledno (jen závorky). */
  background = "#0b9273" as string | null,
  color = "#ffffff",
  /** Poloměr rohů v poměru ke straně (0.25 ≈ tvar iOS ikony). */
  radiusRatio = 0.25,
  /** Jak velké jsou závorky vůči celé ploše. */
  glyphRatio = 0.56,
  strokeWidth = 2.4,
} = {}): string {
  const scale = (size * glyphRatio) / 24;
  const offset = (size - 24 * scale) / 2;
  const rect =
    background === null
      ? ""
      : `<rect width="${size}" height="${size}" rx="${size * radiusRatio}" fill="${background}"/>`;
  const paths = MARK_PATHS.map((d) => `<path d="${d}"/>`).join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    rect +
    `<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${color}" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`
  );
}

/**
 * Značka jako data URI – pro next/og (Satori), kde se vykresluje přes <img>.
 * Záměrně `encodeURIComponent` místo base64: `Buffer` není v edge runtime.
 */
export function markDataUri(opts?: Parameters<typeof markSvg>[0]): string {
  return `data:image/svg+xml,${encodeURIComponent(markSvg(opts))}`;
}
