"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";

export interface PlaceSelection {
  name: string;
  lat: number;
  lng: number;
  googlePlaceId: string;
  address: string | null;
}

interface PlacesAutocompleteProps {
  id: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  noResultsLabel: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceSelection) => void;
}

// Wyszukiwanie firmy przez Google Places API (New) — Sesja V4.1 (ADR-004). Zamiast
// gotowego web componentu <gmp-place-autocomplete> (wymaga osobno włączonego "Places UI
// Kit" w Google Cloud) budujemy własną, cienką listę podpowiedzi na
// google.maps.places.AutocompleteSuggestion, część już włączonego "Places API (New)".
// Pole działa też bez wyboru podpowiedzi — użytkownik może po prostu wpisać nazwę ręcznie,
// wtedy lat/lng/googlePlaceId zostają puste (jak przed tą sesją).
export function PlacesAutocomplete({
  id,
  value,
  disabled,
  placeholder,
  noResultsLabel,
  onChange,
  onPlaceSelect,
}: PlacesAutocompleteProps) {
  const placesLibrary = useMapsLibrary("places");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>(
    []
  );
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // Nazwa ostatnio wybranej podpowiedzi — bez tego, ustawienie `value` po wyborze
  // (onPlaceSelect zmienia `newCompanyName` u rodzica) ponownie odpalałoby ten sam efekt
  // wyszukiwania dla nowej wartości i natychmiast otwierało listę od nowa.
  const lastSelectedNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (value === lastSelectedNameRef.current) {
      setSuggestions([]);
      return;
    }
    if (!placesLibrary || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
      }
      try {
        const { suggestions: results } =
          await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            sessionToken: sessionTokenRef.current,
          });
        if (!cancelled) {
          setSuggestions(results);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [placesLibrary, value]);

  async function handleSelect(suggestion: google.maps.places.AutocompleteSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    setOpen(false);
    setSuggestions([]);

    const place = prediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "location", "id", "formattedAddress"],
    });
    sessionTokenRef.current = null;

    if (!place.location) return;
    const name = place.displayName ?? prediction.text.text;
    lastSelectedNameRef.current = name;
    onPlaceSelect({
      name,
      lat: place.location.lat(),
      lng: place.location.lng(),
      googlePlaceId: place.id,
      address: place.formattedAddress ?? null,
    });
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white text-sm shadow-lg dark:border-white/10 dark:bg-zinc-900">
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-zinc-500 dark:text-zinc-400">{noResultsLabel}</li>
          ) : (
            suggestions.map((suggestion) => {
              const prediction = suggestion.placePrediction;
              if (!prediction) return null;
              return (
                <li key={prediction.placeId}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(suggestion)}
                    className="block w-full px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {prediction.text.text}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
