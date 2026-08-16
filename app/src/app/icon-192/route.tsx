import { ImageResponse } from "next/og";

// Ikona 192×192 do manifest.ts (PWA) — te same proporcje co icon.tsx/apple-icon.tsx
// (kropka-akcent na miętowym tle), po prostu w rozmiarze wymaganym przez manifest.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#82d2b9",
          borderRadius: 42,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            background: "#f2825a",
          }}
        />
      </div>
    ),
    { width: 192, height: 192 }
  );
}
