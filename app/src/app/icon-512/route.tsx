import { ImageResponse } from "next/og";
import { loadIconFont } from "../icon-font";

export const runtime = "edge";

// Ikona 512×512 do manifest.ts (PWA) — patrz icon-192/route.tsx.
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
          gap: 28,
          background: "#82d2b9",
          borderRadius: 112,
        }}
      >
        <span style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: 218, color: "#f2825a", lineHeight: 1 }}>
          K
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f2825a" }} />
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "16px solid rgba(23,94,75,0.35)" }} />
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "16px solid rgba(23,94,75,0.35)" }} />
        </div>
      </div>
    ),
    { width: 512, height: 512, fonts: [font] }
  );
}
