import { ImageResponse } from "next/og";

// Ikona 512×512 do manifest.ts (PWA) — patrz icon-192/route.tsx.
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
          borderRadius: 112,
        }}
      >
        <div
          style={{
            width: 224,
            height: 224,
            borderRadius: "50%",
            background: "#f2825a",
          }}
        />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
