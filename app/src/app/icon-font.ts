// Font dla litery „K” w ikonach (favicon/PWA) — satori (silnik ImageResponse) nie
// wspiera next/font/google ani WOFF2, więc krój ładowany jest ręcznie z lokalnego
// pliku WOFF1 (ta sama waga 800 co wordmark w Logo.tsx/layout.tsx).
export async function loadIconFont() {
  const data = await fetch(new URL("./baloo2-extrabold.woff", import.meta.url)).then((res) =>
    res.arrayBuffer()
  );
  return { name: "Baloo 2", data, weight: 800 as const, style: "normal" as const };
}
