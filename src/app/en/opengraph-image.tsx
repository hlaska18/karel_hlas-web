import { ImageResponse } from "next/og";
import { ogCard, OG_SIZE } from "@/lib/ogCard";
import { SITE } from "@/lib/content";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Ready-made materials for CS lessons — Karel Hlas";

export default function Image() {
  return new ImageResponse(
    ogCard({
      headline: "Ready-made materials for CS lessons",
      sub: "Worksheets, tests, teaching notes and lesson plans — free to download",
      byline: "Karel Hlas",
      domain: SITE.domain,
    }),
    { ...size },
  );
}
