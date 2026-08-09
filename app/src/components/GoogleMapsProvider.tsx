"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import type { ReactNode } from "react";

// @vis.gl/react-google-maps nie ma w swoim buncie dyrektywy "use client" — użyty wprost
// w src/app/layout.tsx (Server Component) łamie granicę RSC (błąd builda: "createContext
// is not a function" przy zbieraniu danych strony). Ten cienki wrapper wymusza granicę
// klienta w jednym, kontrolowanym miejscu.
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      {children}
    </APIProvider>
  );
}
