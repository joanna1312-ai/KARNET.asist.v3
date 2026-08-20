import { ImageResponse } from "next/og";
import { loadIconFont } from "../icon-font";

export const runtime = "edge";

// Ikona 192×192 do manifest.ts (PWA) — te same proporcje co apple-icon.tsx (płytka
// z literą „K” nad paskiem karnetu na białym kaflu), przeskalowane do 192px.
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
          gap: 9.75,
          background: "#ffffff",
          borderRadius: 42.75,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 108,
            height: 108,
            borderRadius: 29.25,
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(150deg, #f5a07f, #f2825a)",
          }}
        >
          <span
            style={{
              fontFamily: "Baloo 2",
              fontWeight: 800,
              fontSize: 78.75,
              letterSpacing: -1.5,
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
            gap: 9,
            width: 100.5,
            height: 39,
            borderRadius: 19.5,
            background: "linear-gradient(140deg, #9adcc6, #3f9c86)",
          }}
        >
          <div style={{ width: 17.25, height: 17.25, borderRadius: "50%", background: "#f2825a" }} />
          <div style={{ width: 17.25, height: 17.25, borderRadius: "50%", background: "#ffffff" }} />
          <div style={{ width: 17.25, height: 17.25, borderRadius: "50%", background: "#ffffff" }} />
        </div>
      </div>
    ),
    { width: 192, height: 192, fonts: [font] }
  );
}
