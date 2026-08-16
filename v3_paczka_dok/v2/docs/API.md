# API — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

> Zaktualizowano: 2026-08-16 — opisuje faktycznie zaimplementowane endpointy wersji
> produkcyjnej (po Fazie V4 i Fazie V5b — PWA/Web Push), nie propozycję. Specyfikacja
> OpenAPI obok kodu — do rozważenia w kolejnej wersji, nie zrobione.

Konwencja: JSON, autoryzacja opcjonalna — jeśli brak sesji/tokenu, żądania działają
na `deviceId` odczytanym z **podpisanego** tokena urządzenia (nagłówek
`Authorization: Device <token>`), nie z surowej wartości `device_id` (patrz `ADR-007` w
[DECISIONS.md](DECISIONS.md), mechanizm współdzielony z auth token-based pod kątem
mobile).

**Własność karnetów/wejść przy zalogowanym koncie (Sesja 14):** konto i urządzenie to
**dwie trwale rozłączne przestrzenie danych, bez żadnego mostu między nimi**
(`src/server/caller-identity.ts`, `src/server/card-owner.ts`). Zalogowany widzi i zapisuje
wyłącznie karnety konta (`userId`) — token urządzenia jest wtedy ignorowany, nawet jeśli
jest wysłany. Niezalogowany widzi i zapisuje wyłącznie karnety bieżącego urządzenia
(`deviceId`). Karnet dodany w trakcie bycia zalogowanym nigdy nie staje się widoczny po
wylogowaniu, i odwrotnie — **nie ma automatycznej ani ręcznej migracji** danych między tymi
dwiema przestrzeniami (świadoma decyzja — wcześniejsza wersja tej sesji miała
`POST /api/auth/link-device` do jednorazowego przenoszenia karnetów urządzenia na konto
przy logowaniu; usunięte, bo kolidowało z zasadą braku mieszania). Ponieważ dane
niezalogowanego użytkownika istnieją tylko na jednym urządzeniu i nigdy nie trafią na
konto, UI pokazuje w tym trybie stały komunikat o tym wprost (`GuestNotice.tsx`).

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
  "company": {
    "id": "co1",
    "name": "FitZone Siłownia",
    "category": { "id": "...", "slug": "gym", "name": "Siłownia", "color": "mint", "isSystem": true }
  },
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

`voucherFileUrl` przyjmowane w `POST`/`PATCH /api/cards` jako zwykły string: treść/link
(Sesja 11) **albo** ścieżka pliku w Supabase Storage z prefiksem `storage:` (Sesja V4.3,
`ADR-009`) — ten drugi format nie jest ustawiany bezpośrednio przez `POST`/`PATCH`, tylko
przez `.../voucher-file/confirm` niżej, po udanym uploadzie.

### Upload pliku/zdjęcia vouchera (Sesja V4.3, `ADR-009`)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/cards/:id/voucher-file/sign-upload` | krok 1: zwraca podpisany URL do zapisu w Supabase Storage + docelową ścieżkę |
| `POST` | `/api/cards/:id/voucher-file/confirm` | krok 3: potwierdza udany upload, zapisuje ścieżkę w `voucherFileUrl` |
| `GET` | `/api/cards/:id/voucher-file` | świeży podpisany URL do odczytu (bucket prywatny — nigdy trwały link) |

Krok 2 (sam upload pliku) idzie **bezpośrednio do Supabase Storage**, z pominięciem naszego
backendu — patrz `ADR-009` (limit ciała requestu na Vercel).

`POST .../sign-upload` — body `{ "contentType": "image/jpeg" }` (dozwolone:
`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). Odpowiedź:
```json
{ "uploadUrl": "https://...supabase.co/storage/v1/object/upload/sign/...", "path": "cards/c1/6f1b...-uuid.jpg" }
```
`400 { "error": "unsupported_content_type" }` dla niedozwolonego typu.

`POST .../confirm` — body `{ "path": "cards/c1/6f1b...-uuid.jpg" }` (ścieżka zwrócona przez
`sign-upload`). Zapisuje `voucherFileUrl = "storage:" + path`; sprząta poprzedni plik
karnetu, jeśli jakiś miał. `400 { "error": "invalid_path" }`, gdy ścieżka nie leży pod
`cards/:id/` tego karnetu.

`GET .../voucher-file` — `200 { "url": "https://...signed..." }` (ważny 5 minut).
`404 { "error": "not_a_file" }`, gdy `voucherFileUrl` karnetu nie jest plikiem (pusty albo
zwykły tekst/link).

Wszystkie trzy endpointy autoryzowane identycznie jak reszta `/api/cards/*`
(`findOwnedCard`/`ownerFilter`) — `401`/`404` na tych samych zasadach.

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
| `GET` | `/api/companies` | lista partnerów |
| `GET` | `/api/companies?favorites=true` | tylko ulubione partnery zweryfikowanego urządzenia (wymaga tokena) |
| `GET` | `/api/companies/:id` | szczegóły + karnety użytkownika w tej firmie |
| `POST` | `/api/companies` | dodanie nowej firmy ręcznie lub przez wyszukiwanie Google Places |
| `POST` | `/api/companies/favorites/:id` / `DELETE` | oznaczenie/zdjęcie ulubionego partnera (idempotentne, wymaga tokena) |

`GET /api/companies` przyjmuje opcjonalny nagłówek `Authorization: Device <token>` — bez
niego lista działa jak dotąd (publiczny odczyt), z nim każda firma ma dodatkowo pole
`isFavorite` (ulubione są prywatne per urządzenie/konto, nigdy globalne).

`GET /api/companies` i `GET /api/companies/:id` zwracają dodatkowo `lat`/`lng`
(`number | null`) — lokalizacja z Google Places (Sesja V4.1, `ADR-004`), `null` dla firm
dodanych bez wyboru podpowiedzi. Wyszukiwanie/sortowanie po dystansie od użytkownika
(„najbliżej mnie" na `/companies`) dzieje się w całości po stronie klienta na już
pobranej liście — nie ma osobnego parametru `near=lat,lng` ani serwerowego endpointu do
tego celu.

`POST /api/companies` przyjmuje opcjonalnie `lat`/`lng` (oba razem albo żadne — połówkowa
para to `400 { "errors": ["locationIncomplete"] }`) i `googlePlaceId`. Wszystkie trzy pola
puste = firma dodana ręcznie bez wyboru z podpowiedzi Google Places, dokładnie jak przed
Sesją V4.1.

## Kategorie firm (Sesja 16)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/categories` | 5 kategorii systemowych + własne kategorie zweryfikowanego urządzenia |
| `POST` | `/api/categories` | dodanie własnej kategorii (nazwa + kolor z zamkniętej palety), zawsze prywatnej dla urządzenia wywołującego |

`POST /api/categories` wymaga `Authorization: Device <token>` (ADR-007), analogicznie do
`POST /api/companies`. `GET /api/companies` i `GET /api/companies/:id` zwracają `category`
jako obiekt (`{ id, slug, name, color, isSystem }`), nie string — `slug` jest ustawiony
tylko dla kategorii systemowych i służy do tłumaczenia i18n; kategorie użytkownika
wyświetla się wprost po `name`. `POST /api/companies` przyjmuje `categoryId` (uuid), nie
nazwę kategorii — musi wskazywać kategorię systemową albo własną kategorię wywołującego
urządzenia, inaczej `400 { "errors": ["categoryRequired"] }`.

## Doradca AI (Sesja V4.2a, `ADR-008`)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/ai/recommendations` | rekomendacje miejsc w okolicy (Google Places (New) + Groq) i sugestie na bazie dotychczasowych karnetów wywołującego |

Wymaga `Authorization: Device <token>` albo zalogowanej sesji (jak `/api/cards`) — inaczej
`401 { "error": "unauthorized" }`. Body:

```json
{ "lat": 52.2297, "lng": 21.0122, "categoryId": "uuid (opcjonalnie)", "categoryName": "Siłownia (opcjonalnie)", "locale": "pl" }
```

Brak `lat`/`lng` → `400 { "error": "locationRequired" }`. Odpowiedź zawsze `200`:

```json
{
  "recommendations": {
    "recommendations": [{ "name": "...", "reason": "...", "mapsUrl": "https://maps.google.com/?cid=..." }],
    "relatedSuggestions": [{ "name": "...", "reason": "..." }]
  }
}
```

`recommendations` (pole zewnętrzne) jest `null`, gdy brak klucza API, błąd/timeout Groq
lub Google Places, albo po prostu brak wystarczających danych (nic w okolicy i pusta
historia karnetów) — to zawsze sekcja dodatkowa, nigdy błąd 5xx. Model dostaje twardy
zakaz wymyślania nazw miejsc spoza dostarczonego kontekstu (patrz `ADR-008`). `mapsUrl`
(opcjonalny, tylko w `recommendations`, nigdy w `relatedSuggestions`) to link do profilu
miejsca na Google Maps, wzięty wprost z pola `googleMapsUri` zwróconego przez Google
Places Text Search — bez dodatkowego wywołania API (V4.2b).

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

## Web Push (Faza V5b)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/push/subscribe` | zapisuje/aktualizuje subskrypcję push wywołującego (upsert po `endpoint`) |
| `DELETE` | `/api/push/subscribe` | usuwa subskrypcję (wyłączenie przypomnień w `/account`) |
| `GET` | `/api/cron/reminders` | wysyła przypomnienia (7/2 dni przed `expiry_date`) do wszystkich subskrypcji trafionych karnetów — wywoływane z zewnątrz (cron), nie z aplikacji |

Autoryzacja `POST`/`DELETE /api/push/subscribe` identyczna jak reszta API bez konta —
`Authorization: Device <token>` albo zalogowana sesja (`getCallerIdentity`), `401`, gdy
brak obu.

`POST /api/push/subscribe` — body:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": { "p256dh": "...", "auth": "..." },
  "locale": "pl"
}
```
`400 { "error": "invalid_subscription" }`, gdy brakuje `endpoint` albo któregoś z kluczy.
`204` przy sukcesie. Subskrypcja zapisywana pod `userId` (zalogowany) albo `deviceId`
(gość) — ten sam rozłączny model co `cards`/`favorites` (`DATABASE.md`).

`DELETE /api/push/subscribe` — body `{ "endpoint": "..." }`. Idempotentne — usunięcie
nieistniejącej subskrypcji też zwraca `204`.

`GET /api/cron/reminders` — chroniony nagłówkiem `Authorization: Bearer <CRON_SECRET>`
(zmienna środowiskowa, **nie** ten sam sekret co `DEVICE_TOKEN_SECRET`), `401` bez niego
albo z błędną wartością. Wywoływany codziennie z GitHub Actions
(`.github/workflows/reminders.yml`, 7:00 UTC) — nie ma limitu częstotliwości po stronie
endpointu, więc sekret jest jedyną ochroną przed masową wysyłką na żądanie. Odpowiedź:
```json
{ "matched": 2, "sent": 3, "failed": 0 }
```
`matched` — liczba karnetów z terminem dokładnie za 7 albo 2 dni; `sent`/`failed` liczą
się per subskrypcja (jeden karnet może mieć kilka subskrypcji — kilka przeglądarek/urządzeń
tego samego właściciela). Subskrypcje, dla których wysyłka zwróciła `404`/`410` (przeglądarka
je unieważniła), są usuwane automatycznie w trakcie tego samego wywołania.

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

Zmienne środowiskowe: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (domena, na `localhost:3000` w
dev), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — patrz `.env.example` i instrukcja
założenia projektu w Google Cloud Console (przekazana osobno przy Sesji 14).

Konto pozostaje w pełni opcjonalne (CLAUDE.md) — żaden endpoint w tym dokumencie nie
wymaga sesji, wszystkie działają też z samym tokenem urządzenia.

## Uwagi

- Wszystkie mutacje na `Card`/`Visit` muszą utrzymywać regułę „`unlimited` wymaga
  `expiryDate`” po stronie serwera, nie tylko w UI.
- `DELETE /api/cards/:id` — rozważyć miękkie usuwanie (`deletedAt`) zamiast trwałego, przy
  zachowaniu w API zachowania „znika z list” tak jak w prototypie.
