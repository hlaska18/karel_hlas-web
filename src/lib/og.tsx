import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

/** Společný náhledový obrázek (OG/Twitter) – foto + jméno + role + doména. */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Fotku načteme jednou jako data-URI (Satori neumí číst z disku za běhu).
const photoDataUri = (() => {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "images", "karel.jpg"));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
})();

export function renderOgImage(role: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 55%, #047857 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* text */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "80px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
            <div
              style={{
                display: "flex",
                width: "100px",
                height: "100px",
                borderRadius: "26px",
                background: "#10b981",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: 700,
                color: "#022c22",
              }}
            >
              KH
            </div>
            <div style={{ display: "flex", fontSize: "29px", color: "#a7f3d0", letterSpacing: "0.12em" }}>
              SPŠ TÁBOR
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: "96px", fontWeight: 800, lineHeight: 1 }}>
              Karel Hlas
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "40px",
                color: "#6ee7b7",
                marginTop: "20px",
                maxWidth: "560px",
              }}
            >
              {role}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                width: "16px",
                height: "16px",
                borderRadius: "9999px",
                background: "#34d399",
              }}
            />
            <div style={{ display: "flex", fontSize: "31px", color: "#d1fae5" }}>karelhlas.vercel.app</div>
          </div>
        </div>

        {/* foto */}
        {photoDataUri && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "64px 64px 64px 0",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoDataUri}
              width={384}
              height={502}
              style={{
                width: "384px",
                height: "502px",
                objectFit: "cover",
                borderRadius: "36px",
                border: "5px solid rgba(255,255,255,0.20)",
              }}
            />
          </div>
        )}
      </div>
    ),
    { ...ogSize },
  );
}
