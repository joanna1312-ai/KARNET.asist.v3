# Uruchomienie projektu lokalnie

> Nazwa projektu: KARNET.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

> Zaktualizowano: 2026-08-09 — opisuje faktyczny setup wersji produkcyjnej (po Fazie V4),
> nie propozycję. Komendy poniżej są gotowe do uruchomienia.

## Wymagania

- Node.js LTS
- PostgreSQL (lokalnie albo przez Docker / usługę typu Neon/Supabase)
- Klucz Google Maps/Places API (z ograniczeniem do domeny/adresu, billing włączony)
- Konto Supabase (ten sam projekt co `DATABASE_URL`) z bucketem Supabase Storage dla
  uploadu voucherów (Sesja V4.3, `ADR-009`) — patrz niżej

## Zmienne środowiskowe (`.env`)

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
GOOGLE_PLACES_SERVER_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DEVICE_TOKEN_SECRET=...
GROQ_API_KEY=...
STORAGE_BUCKET_URL=...
STORAGE_ACCESS_KEY=...
STORAGE_BUCKET_NAME=...
VAPID_PUBLIC_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=...
CRON_SECRET=...
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — klucz Google Maps JavaScript API + Places API (New)
(Sesja V4.1, `ADR-004`). Prefiks `NEXT_PUBLIC_` jest tu celowy: mapa i wyszukiwanie firmy
działają po stronie przeglądarki (`@vis.gl/react-google-maps`), więc klucz z natury trafia
do klienta — bezpieczeństwo zapewnia nie tajność klucza, a jego ograniczenie w Google
Cloud Console do dokładnie dwóch interfejsów (Maps JavaScript API, Places API (New)) oraz,
**przed wdrożeniem produkcyjnym**, do domeny produkcyjnej (HTTP referrer restriction) —
patrz `ADR-004` i checklista w `plan-pracy-claude-code.md`. W deweloperskim `.env` klucz
może zostać bez ograniczenia domeny, żeby `localhost` działał.

`GOOGLE_PLACES_SERVER_KEY` — osobny klucz Google Places API (New), używany wyłącznie po
stronie serwera przez doradcę AI (Sesja V4.2a, endpoint `POST /api/ai/recommendations`).
Musi być **innym** kluczem niż `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — ten drugi jest
ograniczony do referrerów przeglądarki (Application restrictions), więc wywołanie z
backendu by go odrzuciło. Ograniczony w Google Cloud Console do interfejsu Places API
(New) (API restrictions); Application restrictions na razie "None" (dev na zmiennym IP
domowym) — ograniczenie po adresie IP serwera dopiero przed wdrożeniem produkcyjnym.

`GROQ_API_KEY` — klucz do [Groq](https://console.groq.com) (szybka inferencja modeli
językowych), używany wyłącznie po stronie serwera przez doradcę AI (Sesja V4.2a). Brak
klucza albo błąd/timeout wywołania nigdy nie blokuje reszty aplikacji — `POST
/api/ai/recommendations` zawsze zwraca `200` z `recommendations: null` w takim
przypadku, strona `/recommendations` pokazuje wtedy tylko łagodny komunikat.

`STORAGE_BUCKET_URL` / `STORAGE_ACCESS_KEY` / `STORAGE_BUCKET_NAME` — Supabase Storage dla
uploadu voucherów (Sesja V4.3, `ADR-009`). Wszystkie trzy tylko po stronie serwera
(`@/server/storage.ts`, biblioteka `@supabase/supabase-js`), nigdy z prefiksem
`NEXT_PUBLIC_`. Skąd je wziąć w Supabase Dashboard (interfejs bywa przenoszony między
wersjami — jeśli poniższe ścieżki nie zgadzają się z tym, co widzisz, szukaj po nazwie
sekcji):
- `STORAGE_BUCKET_URL` — Project Settings → API Keys (lub bezpośrednio
  `/project/<project-ref>/settings/api-keys`) → **Data API** → pole "API URL", bez
  końcówki `/rest/v1/` (sam origin, np. `https://<project-ref>.supabase.co`). Można też
  wyliczyć z Project ID (Project Settings → General): `https://<project-id>.supabase.co`.
- `STORAGE_ACCESS_KEY` — ta sama strona API Keys, sekcja **Secret keys** (dawniej
  `service_role`; nowy format klucza to `sb_secret_...`, stary JWT-owy `service_role`
  nadal działa, jeśli projekt go jeszcze ma pod zakładką "Legacy anon, service_role API
  keys"). **Nie** `anon`/`Publishable key` — ten ma za mało uprawnień do zapisu w
  prywatnym buckecie.
- `STORAGE_BUCKET_NAME` — nazwa bucketa w Storage (lewe menu → **Storage**), np.
  `voucher-files-dev` lokalnie, `voucher-files` na produkcji (patrz niżej).

**Założenie bucketa (raz, w Supabase Dashboard → Storage → New bucket):**
- Nazwa: `voucher-files-dev` (dev) / `voucher-files` (produkcja) — **osobne buckety**,
  żeby dane testowe nie mieszały się z prawdziwymi plikami użytkowników (`ADR-009`).
- **Public bucket: wyłączone** (musi zostać prywatny — dostęp tylko przez podpisane URL-e).
- Allowed MIME types: `image/jpeg,image/png,image/webp,application/pdf`.
- File size limit: `10 MB`.
Jeśli formularz tworzenia bucketa nie ma pól na MIME types/file size limit, utwórz bucket
bez nich i ustaw je edycją bucketa (ikona ołówka) zaraz potem — to jedyne miejsce, które
faktycznie egzekwuje typ/rozmiar pliku, nie da się tego obejść manipulując requestem.

`DEVICE_TOKEN_SECRET` — sekret do podpisywania tokenów urządzenia w trybie bez konta
(`ADR-007`); losowy, min. 32 bajty (np. `openssl rand -base64 32`), używany wyłącznie
po stronie serwera.

`NEXTAUTH_SECRET` — losowy, min. 32 bajty (np. `openssl rand -base64 32`), jak wyżej.
`NEXTAUTH_URL` — origin aplikacji (`http://localhost:3000` w dev; docelowa domena
produkcyjna przed wdrożeniem). `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` — z Google Cloud
Console (projekt + OAuth Client ID typu "Web application", redirect URI
`<NEXTAUTH_URL>/api/auth/callback/google`) — patrz osobna instrukcja krok po kroku
przekazana przy Sesji 14 (`ADR-003`, `docs/API.md`, sekcja "Auth").

`.env.example` powinien być commitowany z pustymi/placeholderowymi wartościami;
`.env` — nigdy.

**Supabase + `DATABASE_URL` — dopisz `?sslmode=require&uselibpqcompat=true`.** Sam
`?sslmode=require` nie wystarczy: nowsza wersja sterownika `pg` (używanego przez
`@prisma/adapter-pg`, wymagany driver adapter w Prisma 7 — patrz niżej) traktuje
`sslmode=require` jako pełną weryfikację łańcucha certyfikatów (`verify-full`), a
certyfikat Supabase jej nie przechodzi (błąd: `self-signed certificate in certificate
chain` / `TlsConnectionError`). Parametr `uselibpqcompat=true` przywraca dawne,
"łagodniejsze" zachowanie `sslmode=require` (szyfrowanie bez pełnej weryfikacji
certyfikatu) — to jest to, czego Supabase faktycznie oczekuje. Przykład:
```
DATABASE_URL=postgresql://postgres:HASŁO@db.<project-ref>.supabase.co:5432/postgres?sslmode=require&uselibpqcompat=true
```
Na stronie "Connect to your project" w Supabase wybieraj **Direct connection** (nie
pooler) — `npx prisma migrate dev` wymaga bezpośredniego połączenia, poolery (zwłaszcza
transaction pooler) go nie obsługują.

**Prisma 7 wymaga jawnego driver adaptera** — sam `DATABASE_URL` w `.env` nie
wystarczy, żeby `PrismaClient` się połączył (Prisma 7 nie ma już wbudowanego silnika
zapytań). W kodzie musi być zainstalowany i skonfigurowany `@prisma/adapter-pg` +
`pg` (patrz `src/lib/db.ts`) oraz `@prisma/client` w zależnościach — bez tego kompilacja
się nie powiedzie (`Module not found: Can't resolve '@prisma/client/runtime/client'`).

`VAPID_PUBLIC_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
— Web Push (Faza V5b, przypomnienia 7 i 2 dni przed końcem karnetu). Para kluczy
generowana lokalnie: `npx web-push generate-vapid-keys`. Klucz publiczny istnieje w
dwóch wersjach — bez prefiksu używany po stronie serwera przy wysyłce, z prefiksem
trafia do przeglądarki przy subskrypcji (`src/lib/push-client.ts`). `VAPID_SUBJECT` to
`mailto:` z adresem kontaktowym (wymóg specyfikacji Web Push).

`CRON_SECRET` — chroni `GET /api/cron/reminders` przed wywołaniem z zewnątrz; cron
(`.github/workflows/reminders.yml`) wysyła go w nagłówku
`Authorization: Bearer <CRON_SECRET>`. Wygeneruj lokalnie: `openssl rand -hex 32`.

## Kroki

1. `git clone ...`
2. `npm install`
3. `cp .env.example .env` i uzupełnić wartości
4. `npx prisma migrate dev` — utworzenie schematu w lokalnej bazie
5. (opcjonalnie) `npx prisma db seed` — dane demo analogiczne do tych w prototypie
   (`cards`/`partners` z `karnet-asist-prototyp_v6.html`) do szybkiego testowania
6. `npm run dev` — start serwera developerskiego
7. `npm run test` — testy jednostkowe/integracyjne przed commitem

## Weryfikacja, że działa

- Lista karnetów ładuje się bez błędów w konsoli
- Dodanie karnetu przez kreator zapisuje się i pojawia po odświeżeniu (dowód, że dane są
  w bazie, nie tylko w pamięci JS jak w prototypie)
- Przełącznik PL/EN i tryb ciemny działają tak samo jak w prototypie
