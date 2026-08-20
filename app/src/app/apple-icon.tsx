import { ImageResponse } from "next/og";
import { loadIconFont } from "./icon-font";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ikona do ekranu głównego iOS — te same proporcje co icon.tsx, w większym
// rozmiarze (bez przezroczystości, iOS sam maskuje rogi).
export default async function AppleIcon() {
  const font = await loadIconFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "#82d2b9",
        }}
      >
        <span style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: 78, color: "#f2825a", lineHeight: 1 }}>
          K
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#f2825a" }} />
          <div style={{ width: 23, height: 23, borderRadius: "50%", border: "5.5px solid rgba(23,94,75,0.35)" }} />
          <div style={{ width: 23, height: 23, borderRadius: "50%", border: "5.5px solid rgba(23,94,75,0.35)" }} />
        </div>
      </div>
    ),
    { ...size, fonts: [font] }
  );
}
