# API — KARNET.asist

> Nazwa projektu: KARNET.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

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
  "realizedVisits": 6,
  "expiryDate": "2026-09-15",
  "voucherFileUrl": null,
  "visits": [
    { "id": "v1", "date": "2026-07-26", "time": null, "note": null }
  ]
}
```

`realizedVisits` (Sesja V6.3, tylko w odpowiedzi — nie przyjmowane w `POST`/`PATCH`):
liczba wejść z `visitDate` w przeszłości lub dziś, licząca się do archiwizacji i statusu
ostrzegawczego (`DATABASE.md`). `usedVisits` to nadal surowy licznik wszystkich zapisanych
wejść (w tym przyszłych) — zasila wyłącznie widoczny w UI licznik „X/Y”.

`voucherFileUrl` przyjmowane w `POST`/`PATCH /api/cards` jako zwykły string: **wyłącznie**
treść/link wpisany ręcznie (Sesja 11), niezależny od plików niżej (Sesja V6.2) — można
ustawić jedno, drugie albo oba naraz.

### Pliki/zdjęcia vouchera (Sesja V4.3 `ADR-009`, wiele plików od Sesji V6.2)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/cards/:id/voucher-files/sign-upload` | krok 1: zwraca podpisany URL do zapisu w Supabase Storage + docelową ścieżkę |
| `POST` | `/api/cards/:id/voucher-files/confirm` | krok 3: potwierdza udany upload, dodaje nowy wiersz `CardVoucherFile` |
| `GET` | `/api/cards/:id/voucher-files` | świeże podpisane URL-e wszystkich plików karnetu (bucket prywatny — nigdy trwały link) |
| `DELETE` | `/api/cards/:id/voucher-files/:fileId` | usuwa jeden plik (obiekt z bucketa + wiersz z bazy) |

Krok 2 (sam upload pliku) idzie **bezpośrednio do Supabase Storage**, z pominięciem naszego
backendu — patrz `ADR-009` (limit ciała requestu na Vercel).

Karnet może mieć maksymalnie **5 plików** (`VOUCHER_FILE_MAX_COUNT`,
`src/server/voucher-file.ts`) — egzekwowane zarówno w `sign-upload`, jak i ponownie w
`confirm` (zabezpieczenie przed wyścigiem dwóch równoległych uploadów).

`POST .../sign-upload` — body `{ "contentType": "image/jpeg" }` (dozwolone:
`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). Odpowiedź:
```json
{ "uploadUrl": "https://...supabase.co/storage/v1/object/upload/sign/...", "path": "cards/c1/6f1b...-uuid.jpg" }
```
`400 { "error": "unsupported_content_type" }` dla niedozwolonego typu, `400 { "error":
"limit_reached" }` przy już istniejących 5 plikach.

`POST .../confirm` — body `{ "path": "cards/c1/6f1b...-uuid.jpg" }` (ścieżka zwrócona przez
`sign-upload`). Tworzy nowy wiersz `CardVoucherFile` (nie nadpisuje żadnego istniejącego).
`400 { "error": "invalid_path" }`, gdy ścieżka nie leży pod `cards/:id/` tego karnetu;
`400 { "error": "limit_reached" }` jak wyżej.

`GET .../voucher-files` — `200 { "files": [{ "id": "...", "url": "https://...signed...", "kind": "image" | "pdf" }] }`
(URL-e ważne 5 minut, w kolejności dodania).

`DELETE .../voucher-files/:fileId` — `200 { "ok": true }`; `404`, gdy plik nie należy do
tego karnetu. Usuwanie obiektu z bucketa jest best-effort (nie blokuje usunięcia wiersza z
bazy, jeśli storage akurat zawiedzie).

Wszystkie cztery endpointy autoryzowane identycznie jak reszta `/api/cards/*`
(`findOwnedCard`/`ownerFilter`) — `401`/`404` na tych samych zasadach.

„Odnów” z archiwum (`POST /api/cards`) świadomie **nie** kopiuje plików źródłowego
karnetu — nowy karnet zaczyna bez nich (inaczej niż tekst/link, który nadal jest
dziedziczony, patrz `renewFormValues` w `cards/page.tsx`).

## Wejścia (visits)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/cards/:id/visits` | dodaj wejście (dziś, opcjonalnie z datą/godziną/notatką) |
| `PATCH` | `/api/cards/:id/visits/:visitId` | edycja daty/godziny/notatki |
| `DELETE` | `/api/cards/:id/visits/:visitId` | usunięcie błędnie dodanego wejścia |

`POST /api/cards/:id/visits` zwraca `409 { "error": "card_archived" }`, gdy karnet jest już
zarchiwizowany (limit **zrealizowanych** wejść wyczerpany lub minęła data ważności —
formuła `archived` w `DATABASE.md`) — nie da się dodać wejścia do wykorzystanego/
przeterminowanego karnetu. Wejście z przyszłą datą, które tylko osiąga limit surowego
licznika `usedVisits`, jeszcze nie blokuje dodawania kolejnych (Sesja V6.3) — blokada
zadziała dopiero, gdy te wejścia faktycznie się zrealizują.
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

`GET /api/companies` i `GET /api/companies/:id` zwracają też `address` (`string | null`,
Sesja V6.5) — tekstowy adres, niezależny od `lat`/`lng`.

`POST /api/companies` przyjmuje opcjonalnie `lat`/`lng` (oba razem albo żadne — połówkowa
para to `400 { "errors": ["locationIncomplete"] }`), `googlePlaceId` i `address` (Sesja
V6.5, tekst, przycinany, puste → `null`). Wszystkie te pola puste = firma dodana ręcznie
bez wyboru z podpowiedzi Google Places, dokładnie jak przed Sesją V4.1. UI wypełnia
`address` automatycznie z `formattedAddress` zwróconego przez Google Places przy wyborze
podpowiedzi (patrz `PlacesAutocomplete.tsx`), albo pozwala wpisać go ręcznie na formularzu
„Dodaj miejsce" na `/companies` (Sesja V6.5) — endpoint sam nie woła Google Places.

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

## Statystyki (Sesja V6.7)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/stats?period=week\|month` | raport wejść wywołującego w wybranym okresie |

Wymaga `Authorization: Device <token>` albo zalogowanej sesji (jak `/api/cards`) —
inaczej `401 { "error": "unauthorized" }`. `period` domyślnie `week`, gdy pominięty;
inna wartość niż `week`/`month` → `400 { "error": "invalid_period" }`. Okresy liczone
**kalendarzowo** (tydzień pon–niedz, miesiąc 1.–ostatni dzień), nie jako "ostatnie 7/30
dni" — ustalone przed sesją. Odpowiedź:

```json
{
  "period": "week",
  "rangeStart": "2026-08-17",
  "rangeEnd": "2026-08-23",
  "totalVisits": 5,
  "byCategory": [
    { "id": "uuid", "slug": "gym", "name": "Siłownia", "color": "mint", "isSystem": true, "count": 3 }
  ],
  "topCompany": { "id": "uuid", "name": "FitZone", "count": 2 }
}
```

Uwzględnia wejścia ze wszystkich karnetów wywołującego (aktywnych i archiwalnych, filtr
własności jak `/api/cards` — `userId`/`deviceId`), bez rozróżnienia zrealizowane/
zaplanowane (inaczej niż `realizedVisits` z Sesji V6.3) — pokazuje wszystko zapisane z
datą w danym okresie. `byCategory` posortowane malejąco po `count`; `topCompany` to
firma z największą liczbą wejść w okresie, `null` gdy `totalVisits` wynosi `0`.

## Konto (Sesja V6.10)

| Metoda | Ścieżka | Opis |
|---|---|---|
| `POST` | `/api/account/reset-cards` | wyczyszczenie danych karnetów bieżącej tożsamości (ustawienia → „Wyczyść dane karnetów") |

Wymaga `Authorization: Device <token>` albo zalogowanej sesji (jak `/api/cards`) — inaczej
`401 { "error": "unauthorized" }`. Miękko usuwa (`deletedAt`, ten sam mechanizm co
`DELETE /api/cards/:id`) **wszystkie** karnety wywołującego — aktywne i archiwalne, filtr
własności identyczny jak reszta `/api/cards/*` (`userId`/`deviceId`). Dodatkowo, w
odróżnieniu od usunięcia pojedynczego karnetu, kasuje też powiązane pliki voucherów: wiersze
`CardVoucherFile` z bazy i odpowiadające im obiekty w Supabase Storage (best-effort, tak jak
`DELETE .../voucher-files/:fileId` — błąd usunięcia z bucketa nie blokuje odpowiedzi). **Nie**
kasuje `Visit` (zostają w bazie, ale nieosiągalne przez API, bo nadrzędny karnet jest
odfiltrowany wszędzie po `deletedAt: null`) ani `Company`/kategorii/ulubionych — te mogą być
współdzielone z innymi urządzeniami/kontem. Odpowiedź zawsze `200`:

```json
{ "ok": true, "count": 3 }
```

`count` — liczba skasowanych karnetów (`0`, gdy wywołujący nie miał żadnego). UI wymaga
silniejszego potwierdzenia niż zwykłe usuwanie pojedynczego karnetu (checkbox „rozumiem, że
tej operacji nie da się cofnąć" w dialogu, patrz `ConfirmDialog.tsx`) — sama operacja jest
nieodwracalna z poziomu aplikacji.

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

**Zaimplementowane (Sesja 14):** logowanie przez Google OAuth, Auth.js/NextAuth v4,
`session: { strategy: "jwt" }` (sesja jako podpisany token, nie rekord w bazie —
najbliższe realnie dostępne w NextAuth podejście do ADR-003 "token-based, nie cookie
sesyjne"; sam handshake OAuth w przeglądarce z natury korzysta z cookie, tego nie da się
całkowicie ominąć w web-owym flow).

**Zaimplementowane (Sesja V6.1):** druga metoda logowania — e-mail+hasło (Credentials
provider), obok Google, bez nowej zależności zewnętrznej (hasła hashowane przez
`bcryptjs`, wybrany zamiast natywnego `bcrypt`, żeby uniknąć kompilacji natywnej na
Vercelu — patrz nota o Next 16 w `plan-pracy-claude-code.md`). Magic link e-mail **nie**
jest zaimplementowany — nadal świadomie odłożone (brak zdecydowanego dostawcy wysyłki
maili).

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET`/`POST` | `/api/auth/[...nextauth]` | wbudowane endpointy Auth.js/NextAuth (sign-in, callback, sign-out, session) — Google i Credentials jako providery |
| `POST` | `/api/auth/register` | Zakłada konto e-mail+hasło. Body: `{ email, password }`. `400` przy nieprawidłowym formacie e-maila albo haśle krótszym niż 8 znaków (`errors: [...]`), `409` gdy e-mail jest już zajęty przez dowolne konto — w tym Google-owe bez hasła (świadomie bez auto-linkowania kont istniejącym e-mailem, ryzyko przejęcia konta). Nie loguje samo — klient woła `signIn("credentials", ...)` po sukcesie. |

Ekrany `/login` i `/register` (Sesja V6.1) pokazują obie metody logowania na jednym
widoku — przycisk Google obok formularza e-mail/hasło — zamiast wymuszać wybór z góry.

Zmienne środowiskowe: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (domena, na `localhost:3000` w
dev), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — patrz `.env.example` i instrukcja
założenia projektu w Google Cloud Console (przekazana osobno przy Sesji 14). Metoda
e-mail+hasło nie wymaga nowych zmiennych środowiskowych.

Konto pozostaje w pełni opcjonalne (CLAUDE.md) — żaden endpoint w tym dokumencie nie
wymaga sesji, wszystkie działają też z samym tokenem urządzenia.

## Uwagi

- `expiryDate` jest zawsze opcjonalna, dla obu typów karnetu (Sesja V6.15) — karnet
  `unlimited` bez ustawionej daty po prostu nigdy się sam nie zarchiwizuje, to świadoma
  konsekwencja, nie błąd. Wcześniej `unlimited` wymagał `expiryDate`; ta reguła została
  usunięta.
- `DELETE /api/cards/:id` — rozważyć miękkie usuwanie (`deletedAt`) zamiast trwałego, przy
  zachowaniu w API zachowania „znika z list” tak jak w prototypie.
