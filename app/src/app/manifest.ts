import type { MetadataRoute } from "next";

// PWA manifest (Etap 6) — instalacja na ekranie głównym. Ikony generowane dynamicznie
// przez icon-192/route.tsx i icon-512/route.tsx (te same proporcje co icon.tsx).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KARNET.asist",
    short_name: "KARNET.asist",
    description: "Twoje karnety zawsze pod ręką.",
    start_url: "/cards",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
