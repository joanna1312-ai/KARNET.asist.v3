# API — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

> DRAFT. Gdy implementacja ruszy, wygenerować i utrzymywać specyfikację OpenAPI obok kodu
> (Claude Code potrafi ją wygenerować z route handlerów i pilnować spójności).

Konwencja: JSON, autoryzacja opcjonalna — jeśli brak sesji/tokenu, żądania działają
na `deviceId` odczytanym z **podpisanego** tokena urządzenia (nagłówek
`Authorization: Device <token>`), nie z surowej wartości `device_id` (patrz `ADR-007` w
[DECISIONS.md](DECISIONS.md), mechanizm współdzielony z auth token-based pod kątem
mobile).

## Karnety

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/cards` | lista aktywnych karnetów użytkownika/urządzenia |
| `GET` | `/api/cards?archived=true` | lista zarchiwizowanych |
| `POST` | `/api/cards` | dodanie karnetu (kreator krok 1–3 z prototypu); używane też przez „Odnów” z widoku archiwum — nie ma osobnego endpointu na odnowienie |
| `GET` | `/api/cards/:id` | szczegóły karnetu + historia wejść |
| `PATCH` | `/api/cards/:id` | edycja (m.in. `expiry_date`, w tym ustawienie na `null`) |
| `DELETE` | `/api/cards/:id` | usunięcie (po potwierdzeniu w UI) |

Przykład odpowiedzi `GET /api/cards/:id`:

```json
{
  "id": "c1",
  "company": { "id": "co1", "name": "FitZone Siłownia", "category": "gym" },
  "type": "limit",
  "totalVisits": 12,
  "usedVisits": 8,
  "expiryDate": "2026-09-15",
  "voucherMode": "single",
  "voucherFileUrl": null,
  "visits": [
    { "id": "v1", "date": "2026-07-26", "time": null, "note": null }
  ]
}
```

`voucherFileUrl` przyjmowane w `POST`/`PATCH /api/cards` jako zwykły string (treść lub link
do vouchera) — na start bez uploadu pliku/object storage, patrz `CLAUDE.md`.

## Wejścia (visits)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/cards/:id/visits` | dodaj wejście (dziś, opcjonalnie z datą/godziną/notatką) |
| `PATCH` | `/api/cards/:id/visits/:visitId` | edycja daty/godziny/notatki |
| `DELETE` | `/api/cards/:id/visits/:visitId` | usunięcie błędnie dodanego wejścia |

`POST /api/cards/:id/visits` zwraca `409 { "error": "card_archived" }`, gdy karnet jest już
zarchiwizowany (limit wejść wyczerpany lub minęła data ważności — formuła `archived` w
`DATABASE.md`) — nie da się dodać wejścia do wykorzystanego/przeterminowanego karnetu.
`PATCH`/`DELETE` na istniejącym wpisie **nie** mają tego ograniczenia — korektę lub
usunięcie błędnie dodanego wejścia można wykonać także po archiwizacji karnetu.

## Firmy / partnerzy

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/companies?query=&near=lat,lng` | lista/wyszukiwanie partnerów |
| `GET` | `/api/companies?favorites=true` | tylko ulubione partnery zweryfikowanego urządzenia (wymaga tokena) |
| `GET` | `/api/companies/:id` | szczegóły + karnety użytkownika w tej firmie |
| `POST` | `/api/companies` | dodanie nowej firmy ręcznie |
| `POST` | `/api/companies/favorites/:id` / `DELETE` | oznaczenie/zdjęcie ulubionego partnera (idempotentne, wymaga tokena) |

`GET /api/companies` przyjmuje opcjonalny nagłówek `Authorization: Device <token>` — bez
niego lista działa jak dotąd (publiczny odczyt), z nim każda firma ma dodatkowo pole
`isFavorite` (ulubione są prywatne per urządzenie/konto, nigdy globalne).

## Wyszukiwanie miejsc (Google Maps)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/places/search?query=` | proxy do Google Places API (klucz API trzymany po stronie serwera, nie w kliencie) |

## Urządzenie (tryb bez konta)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/device/register` | wywoływane raz, przy pierwszym uruchomieniu aplikacji na urządzeniu; generuje `deviceId` i zwraca go jako podpisany token JWT (`ADR-007`) |

Przykład odpowiedzi:

```json
{
  "deviceId": "a1b2c3d4-...",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Klient przechowuje `token` (nie surowy `deviceId`) i wysyła go w nagłówku
`Authorization: Device <token>` przy każdym kolejnym żądaniu. Token ma TTL ok. 180 dni,
odnawiany automatycznie w tle przed wygaśnięciem.

## Auth (opcjonalne)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/auth/sign-in` | np. magic link / OAuth |
| `POST` | `/api/auth/link-device` | weryfikuje podpisany token urządzenia, wyciąga zaufany `deviceId` i przypina powiązane karnety do konta po zalogowaniu (`userId = ...`, `deviceId = null`) |

## Uwagi

- Wszystkie mutacje na `Card`/`Visit` muszą utrzymywać regułę „`unlimited` wymaga
  `expiryDate`” po stronie serwera, nie tylko w UI.
- `DELETE /api/cards/:id` — rozważyć miękkie usuwanie (`deletedAt`) zamiast trwałego, przy
  zachowaniu w API zachowania „znika z list” tak jak w prototypie.
