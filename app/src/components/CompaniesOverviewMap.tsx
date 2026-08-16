"use client";

import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

type CompanyPin = { id: string; name: string; lat: number; lng: number };

const DEFAULT_ZOOM = 12;

// Dopasowuje widok mapy do wszystkich pinezek naraz — jeden pin dostaje po prostu
// wycentrowanie na sobie (fitBounds na jednym punkcie nie ma sensownego zoomu).
function FitToMarkers({ pins }: { pins: CompanyPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || pins.length === 0) return;
    if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      map.setZoom(DEFAULT_ZOOM);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const pin of pins) bounds.extend({ lat: pin.lat, lng: pin.lng });
    map.fitBounds(bounds, 32);
  }, [map, pins]);

  return null;
}

// Mapa zbiorcza na /companies (Etap 5) — placeholder z mockupu 1j zastąpiony prawdziwą
// mapą Google. Zwykłe `Marker`y (nie `AdvancedMarker`) z tego samego powodu co
// CompanyMap.tsx: brak potrzeby konfigurowania Map ID tylko po to, żeby pokolorować
// pinezki na kolor kategorii — świadome uproszczenie względem mockupu.
export function CompaniesOverviewMap({ pins }: { pins: CompanyPin[] }) {
  if (pins.length === 0) return null;

  return (
    <div className="h-[180px] w-full overflow-hidden rounded-[22px] border border-black/10 dark:border-white/10">
      <Map
        defaultCenter={{ lat: pins[0].lat, lng: pins[0].lng }}
        defaultZoom={DEFAULT_ZOOM}
        disableDefaultUI
        gestureHandling="cooperative"
        reuseMaps
      >
        <FitToMarkers pins={pins} />
        {pins.map((pin) => (
          <Marker key={pin.id} position={{ lat: pin.lat, lng: pin.lng }} title={pin.name} />
        ))}
      </Map>
    </div>
  );
}
