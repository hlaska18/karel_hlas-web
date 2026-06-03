import { ImageResponse } from "next/og";

export const alt = "Karel Hlas — Učitel informatiky a angličtiny";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "84px",
          background:
            "linear-gradient(135deg, #022c22 0%, #064e3b 55%, #047857 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* horní řada: monogram + škola */}
        <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
          <div
            style={{
              display: "flex",
              width: "104px",
              height: "104px",
              borderRadius: "26px",
              background: "#10b981",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "50px",
              fontWeight: 700,
              color: "#022c22",
            }}
          >
            KH
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "30px",
              color: "#a7f3d0",
              letterSpacing: "0.12em",
            }}
          >
            SPŠ TÁBOR
          </div>
        </div>

        {/* střed: jméno + role */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "118px", fontWeight: 800, lineHeight: 1 }}>
            Karel Hlas
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "46px",
              color: "#6ee7b7",
              marginTop: "22px",
            }}
          >
            Učitel informatiky a angličtiny
          </div>
        </div>

        {/* spodní řada: doména */}
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
          <div style={{ display: "flex", fontSize: "34px", color: "#d1fae5" }}>
            karelhlas.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
