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

**Zaimplementowane (Sesja 14):** logowanie wyłącznie przez Google OAuth, Auth.js/NextAuth
v4, `session: { strategy: "jwt" }` (sesja jako podpisany token, nie rekord w bazie —
najbliższe realnie dostępne w NextAuth podejście do ADR-003 "token-based, nie cookie
sesyjne"; sam handshake OAuth w przeglądarce z natury korzysta z cookie, tego nie da się
całkowicie ominąć w web-owym flow). Magic link e-mail **nie** jest zaimplementowany —
świadomie odłożone (brak zdecydowanego dostawcy wysyłki maili).

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET`/`POST` | `/api/auth/[...nextauth]` | wbudowane endpointy Auth.js/NextAuth (sign-in, callback, sign-out, session) — Google jako jedyny provider |
| `POST` | `/api/auth/link-device` | wymaga jednocześnie: zalogowanej sesji NextAuth i podpisanego tokena urządzenia w nagłówku `Authorization: Device <token>` (ADR-007). Przypina **tylko karnety tego urządzenia** do konta (`userId = <zalogowany>`, `deviceId = null`); inne urządzenia nietknięte. Odpowiedź: `{ "linkedCount": number }`. `401` jeśli brak sesji lub tokena. |

Zmienne środowiskowe: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (domena, na `localhost:3000` w
dev), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — patrz `.env.example` i instrukcja
założenia projektu w Google Cloud Console (przekazana osobno przy Sesji 14).

Konto pozostaje w pełni opcjonalne (CLAUDE.md) — żaden inny endpoint w tym dokumencie nie
wymaga sesji, tylko `/api/auth/link-device`.

## Uwagi

- Wszystkie mutacje na `Card`/`Visit` muszą utrzymywać regułę „`unlimited` wymaga
  `expiryDate`” po stronie serwera, nie tylko w UI.
- `DELETE /api/cards/:id` — rozważyć miękkie usuwanie (`deletedAt`) zamiast trwałego, przy
  zachowaniu w API zachowania „znika z list” tak jak w prototypie.
