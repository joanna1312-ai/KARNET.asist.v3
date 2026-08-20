import { ImageResponse } from "next/og";
import { loadIconFont } from "./icon-font";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ikona do ekranu głównego iOS — pełny redesign (koralowa płytka z literą „K” nad
// paskiem karnetu z trzema polami) na białym kaflu, wariant jasny (iOS sam maskuje
// rogi, więc bez przezroczystości i bez zaokrąglenia kafla). Geometria to proste
// przeskalowanie referencji 512px z paczki redesignu (współczynnik 180/512).
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
          gap: 9.14,
          background: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 101.25,
            height: 101.25,
            borderRadius: 27.42,
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(150deg, #f5a07f, #f2825a)",
          }}
        >
          <span
            style={{
              fontFamily: "Baloo 2",
              fontWeight: 800,
              fontSize: 73.83,
              letterSpacing: -1.41,
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
            gap: 8.44,
            width: 94.22,
            height: 36.56,
            borderRadius: 18.28,
            background: "linear-gradient(140deg, #9adcc6, #3f9c86)",
          }}
        >
          <div style={{ width: 16.17, height: 16.17, borderRadius: "50%", background: "#f2825a" }} />
          <div style={{ width: 16.17, height: 16.17, borderRadius: "50%", background: "#ffffff" }} />
          <div style={{ width: 16.17, height: 16.17, borderRadius: "50%", background: "#ffffff" }} />
        </div>
      </div>
    ),
    { ...size, fonts: [font] }
  );
}
