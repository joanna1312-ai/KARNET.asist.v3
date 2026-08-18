// Company.address to wolny tekst — najczęściej formattedAddress z Google Places
// (np. "Wołoska 12, 02-675 Warszawa, Polska"), czasem ręcznie wpisany przez
// użytkownika. Nie ma osobnej kolumny "miasto" (patrz DATABASE.md), więc do filtra
// "po mieście" (Sesja V6.6) wyciągamy miasto z adresu heurystycznie.
export function extractCity(address: string | null): string | null {
  if (!address) return null;

  const postalMatch = address.match(/\d{2}-\d{3}\s+([^,]+)/);
  if (postalMatch) return postalMatch[1].trim();

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;

  // Brak kodu pocztowego (adres wpisany ręcznie). Przy 3+ członach zakładamy
  // format "ulica, miasto, kraj" (ostatni to kraj); przy 2 — "ulica, miasto"
  // (tak jak podpowiada placeholder pola adresu).
  return (parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1]) || null;
}
