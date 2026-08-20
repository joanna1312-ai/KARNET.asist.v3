import { ImageResponse } from "next/og";
import { loadIconFont } from "../icon-font";

export const runtime = "edge";

// Ikona 192×192 do manifest.ts (PWA) — te same proporcje co icon.tsx/apple-icon.tsx
// (litera „K” nad paskiem trzech kropek na miętowym tle), po prostu w rozmiarze
// wymaganym przez manifest.
export async function GET() {
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
          gap: 11,
          background: "#82d2b9",
          borderRadius: 42,
        }}
      >
        <span style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: 82, color: "#f2825a", lineHeight: 1 }}>
          K
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 27, height: 27, borderRadius: "50%", background: "#f2825a" }} />
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "6px solid rgba(23,94,75,0.35)" }} />
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "6px solid rgba(23,94,75,0.35)" }} />
        </div>
      </div>
    ),
    { width: 192, height: 192, fonts: [font] }
  );
}
