import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ikona do ekranu głównego iOS — te same proporcje co icon.tsx, w większym
// rozmiarze (bez przezroczystości, iOS sam maskuje rogi).
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
          background: "#82d2b9",
        }}
      >
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: "50%",
            background: "#f2825a",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
