import { ImageResponse } from "next/og";
import { loadIconFont } from "./icon-font";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Ikonka karty przeglądarki — litera „K” (Baloo 2, jak wordmark w Logo.tsx) nad
// paskiem trzech kropek karnetu (pierwsza wybita, dwie puste) na miętowym tle.
// Litera i kropki celowo trochę większe niż proste przeskalowanie z 512px —
// w 32px drobne szczegóły inaczej znikają.
export default async function Icon() {
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
          gap: 2,
          background: "#82d2b9",
          borderRadius: 7,
        }}
      >
        <span style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: 16, color: "#f2825a", lineHeight: 1 }}>
          K
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f2825a" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", border: "1.2px solid rgba(23,94,75,0.35)" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", border: "1.2px solid rgba(23,94,75,0.35)" }} />
        </div>
      </div>
    ),
    { ...size, fonts: [font] }
  );
}
