"use client";

import { Map, Marker } from "@vis.gl/react-google-maps";

interface CompanyMapProps {
  lat: number;
  lng: number;
}

const COMPANY_MAP_ZOOM = 15;

// Mapa lokalizacji firmy na /companies/:id (Sesja V4.1, ADR-004). Zwykły `Marker`
// zamiast `AdvancedMarker`, żeby nie wymagać osobno skonfigurowanego Map ID w Google
// Cloud — wystarcza samo Maps JavaScript API, już włączone.
export function CompanyMap({ lat, lng }: CompanyMapProps) {
  const position = { lat, lng };

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
      <Map
        defaultCenter={position}
        defaultZoom={COMPANY_MAP_ZOOM}
        disableDefaultUI={false}
        gestureHandling="cooperative"
        reuseMaps
      >
        <Marker position={position} />
      </Map>
    </div>
  );
}
