import { ImageResponse } from "next/og";
import { loadIconFont } from "../icon-font";

export const runtime = "edge";

// Ikona 512×512 do manifest.ts (PWA) — patrz icon-192/route.tsx. Wymiary 1:1 z
// referencji redesignu (canvas 512, promienie 114/78/52, płytka 288, pasek 268×104).
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
          gap: 26,
          background: "#ffffff",
          borderRadius: 114,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 288,
            height: 288,
            borderRadius: 78,
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(150deg, #f5a07f, #f2825a)",
          }}
        >
          <span
            style={{
              fontFamily: "Baloo 2",
              fontWeight: 800,
              fontSize: 210,
              letterSpacing: -4,
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            K
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            width: 268,
            height: 104,
            borderRadius: 52,
            background: "linear-gradient(140deg, #9adcc6, #3f9c86)",
          }}
        >
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#f2825a" }} />
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#ffffff" }} />
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#ffffff" }} />
        </div>
      </div>
    ),
    { width: 512, height: 512, fonts: [font] }
  );
}
