import { ImageResponse } from "next/og";
import { markDataUri } from "@/lib/mark";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b9273, #0a745d)",
        }}
      >
        {/* Značka jako <img> s data URI – Satori vlastní <svg> tahy nevykreslí. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={markDataUri({ size: 512, background: null, color: "#ffffff", glyphRatio: 0.62 })}
          alt=""
          width={512}
          height={512}
        />
      </div>
    ),
    { ...size },
  );
}
