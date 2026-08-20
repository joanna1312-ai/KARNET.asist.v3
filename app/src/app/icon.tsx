import { ImageResponse } from "next/og";
import { loadIconFont } from "./icon-font";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Ikonka karty przeglądarki — litera „K” (Baloo 2, jak wordmark w Logo.tsx) na
// koralowej płytce. Uproszczony wariant redesignu (bez paska karnetu pod spodem):
// w 16–32px pasek zlewa się w plamę, więc na tym poziomie zostaje sama litera.
export default async function Icon() {
  const font = await loadIconFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f2825a",
          borderRadius: 7,
        }}
      >
        <span style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: 23, color: "#ffffff", lineHeight: 1 }}>
          K
        </span>
      </div>
    ),
    { ...size, fonts: [font] }
  );
}
