import { ImageResponse } from "next/og";
import { ogCard, OG_SIZE } from "@/lib/ogCard";
import { SITE } from "@/lib/content";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Materiály pro výuku informatiky — Karel Hlas";

export default function Image() {
  return new ImageResponse(
    ogCard({
      headline: "Hotové materiály do hodin informatiky",
      sub: "Pracovní listy, testy, metodika a plány hodin — zdarma ke stažení",
      byline: "Karel Hlas",
      domain: SITE.domain,
    }),
    { ...size },
  );
}
