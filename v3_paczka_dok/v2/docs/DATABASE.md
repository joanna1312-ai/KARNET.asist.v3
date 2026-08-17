# Schemat danych — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

> Zaktualizowano: 2026-08-16 — opisuje faktyczny schemat Prisma wersji produkcyjnej (po
> Fazie V4 i Fazie V5b — PWA/Web Push), nie propozycję.

## Tabele

### `users` (opcjonalne)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `email` | text, unique, nullable | konto opcjonalne — brak konta = brak wiersza |
| `name` | text, nullable | z profilu Google (Sesja 14) |
| `image` | text, nullable | URL zdjęcia profilowego z Google (Sesja 14) |
| `email_verified` | timestamptz, nullable | wymagane przez interfejs adaptera Auth.js/NextAuth (Sesja 14); przy OAuth Google zawsze `null` — providerzy OAuth nie przekazują tej informacji do next-auth v4 |
| `password_hash` | text, nullable | hash bcrypt (Sesja V6.1), tylko dla kont e-mail+hasło — `null` przy kontach Google |
| `created_at` | timestamptz | |

### `accounts`, `sessions`, `verification_tokens` (Auth.js/NextAuth — Sesja 14)

Standardowy schemat wymagany przez adapter Prisma (`@auth/prisma-adapter`), niemodyfikowalny
bez utraty kompatybilności z biblioteką — stąd pola `access_token`/`refresh_token`/itd. w
`accounts` odstają od reszty konwencji nazewnictwa w tym dokumencie (patrz komentarz w
`prisma/schema.prisma`). `sessions` istnieje tylko dlatego, że wymaga jej interfejs
adaptera — w praktyce pusta, bo logowanie używa `session: { strategy: "jwt" }` (sesja to
podpisany token, nie wiersz w tabeli — patrz `ADR-003` w `DECISIONS.md`).
`verification_tokens` jest nieużywana (logowanie tylko przez Google OAuth, bez magic linku).

### `companies` (partnerzy)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `category_id` | uuid FK → categories | Sesja 16: dawniej enum `gym, pool, group_classes, massage, beauty`, teraz FK do tabeli `categories` (patrz niżej) |
| `lat`, `lng` | double, nullable | z Google Places, `null` dopóki nie ustawione |
| `google_place_id` | text, nullable | do integracji z realnym Google Maps |
| `created_by_user_id` | uuid FK → users, nullable | kto dodał „nową firmę” ręcznie |

W prototypie `partners[]` ma sztuczne `x`/`y` (procent na schematycznej mapie) i `dist`
(mockowany dystans) — oba znikają na rzecz prawdziwych `lat`/`lng` i liczonego
dystansu względem lokalizacji użytkownika.

### `categories` (kategorie firm — Sesja 16)

Zastępuje dawny enum `company_category`. Umożliwia użytkownikom dodawanie własnych
kategorii obok 5 systemowych, bez zmiany typu w bazie przy każdej nowej kategorii.

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | dla 5 kategorii systemowych — stałe, deterministyczne id (patrz seed w migracji i `src/server/system-categories.ts`), nie generowane |
| `slug` | text, unique, nullable | ustawiony **tylko** dla kategorii systemowych (`gym`, `pool`, `group_classes`, `massage`, `beauty`) — stały klucz do tłumaczenia i18n (`companyCategory.<slug>`), niezależny od `id` |
| `name` | text | dla kategorii systemowych: nazwa referencyjna (UI i tak tłumaczy po `slug`); dla kategorii użytkownika: nazwa wpisana przez niego, wyświetlana wprost, bez tłumaczenia |
| `color` | enum: `mint, coral, accent, sky, violet, slate` | zamknięta paleta (decyzja Sesji 16) — wybierana z gotowego zestawu, nie dowolny kolor; determinuje wygląd (kolorowa kropka przy nazwie) analogicznie do dawnego „stylu/ikony” z `ARCHITECTURE.md` |
| `is_system` | boolean, default `false` | `true` dla 5 kategorii startowych — nieedytowalne/nieusuwalne przez użytkowników, zawsze widoczne wszystkim |
| `created_by_device_id` | text, nullable | **decyzja Sesji 16: kategoria użytkownika jest prywatna dla urządzenia, które ją dodało** (w odróżnieniu od `companies`, które są współdzielone globalnie) — `null` dla kategorii systemowych |
| `created_at` | timestamptz | |

Widoczność przy odczycie (`GET /api/categories`): kategorie systemowe (`is_system = true`)
zawsze + kategorie, gdzie `created_by_device_id` = zweryfikowany `deviceId` wywołującego
(ADR-007). Bez tokena widać tylko systemowe.

### `cards` (karnety)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users, **nullable** | brak konta = karnet lokalny/urządzeniowy |
| `device_id` | text, nullable | identyfikator lokalny, gdy brak konta |
| `company_id` | uuid FK → companies | |
| `type` | enum: `limit`, `unlimited` | |
| `total_visits` | int, nullable | wymagane, gdy `type = limit` |
| `used_visits` | int, default 0 | |
| `expiry_date` | date, **nullable** | **opcjonalna dla `limit`, wymagana dla `unlimited`** — reguła z v5/v6 |
| `voucher_mode` | enum: `single`, `per_visit` | |
| `voucher_file_url` | text, nullable | treść/link (Sesja 11) **albo** plik w Supabase Storage (Sesja V4.3, `ADR-009`) — plik rozpoznawany po prefiksie `storage:` przed ścieżką w buckecie (np. `storage:cards/{cardId}/{uuid}.jpg`); bez prefiksu to zwykły tekst/link. Nigdy trwały publiczny URL — bucket jest prywatny, odczyt/zapis idzie przez podpisane URL-e z `/api/cards/:id/voucher-file*` |
| `deleted_at` | timestamptz, nullable | miękkie usuwanie (rekomendacja) |
| `created_at`, `updated_at` | timestamptz | |

**`user_id` i `device_id` to trwale rozłączne przestrzenie danych, nigdy oba naraz
(Sesja 14, decyzja po korekcie ADR-003):** karnet ma ustawione dokładnie jedno z nich, nigdy
oba. Logowanie/wylogowanie **nie przenosi** karnetów między `user_id` a `device_id` w
żadną stronę — dane wprowadzone bez konta zostają widoczne wyłącznie bez konta (na tym
samym urządzeniu) na zawsze, dane wprowadzone na koncie zostają widoczne wyłącznie na
koncie na zawsze. Logika wyboru właściwej kolumny do zapytania: `src/server/card-owner.ts`
(`ownerFilter`), używana identycznie przy odczycie i przy tworzeniu nowego karnetu.

Reguła biznesowa (constraint aplikacyjny, najlepiej też CHECK w DB):
`type = 'unlimited' ⇒ expiry_date IS NOT NULL`.

Status „aktywny / w archiwum” **nie jest** osobną kolumną w MVP — liczony w locie:
`archived = used_visits >= total_visits (dla limit) OR (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE)`.
Jeśli lista rośnie i przeliczanie w locie zacznie boleć wydajnościowo, dodać generowaną
kolumnę / materializowany widok.

### `visits` (wejścia)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `card_id` | uuid FK → cards | |
| `visit_date` | date | |
| `visit_time` | time, nullable | |
| `note` | text, nullable | max ~80 znaków w UI |
| `created_at` | timestamptz | |

### `favorites`

| Kolumna | Typ | Uwagi |
|---|---|---|
| `user_id` | uuid FK → users, nullable | jak wyżej — może być `device_id` zamiast |
| `company_id` | uuid FK → companies | |

Klucz główny złożony `(user_id, company_id)` lub `(device_id, company_id)`.

### `push_subscriptions` (Web Push — Faza V5b)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users, nullable | jak w `cards`/`favorites` — dokładnie jedno z `user_id`/`device_id`, nigdy oba |
| `device_id` | text, nullable | jak wyżej |
| `endpoint` | text, unique | identyfikuje kanał push konkretnej przeglądarki/urządzenia (nie użytkownika) — ponowna rejestracja tej samej przeglądarki robi upsert po tej kolumnie, nie duplikuje wiersza |
| `p256dh`, `auth` | text | klucze publiczne subskrypcji, zwracane przez `PushManager.subscribe()` w przeglądarce, wymagane do szyfrowania treści powiadomienia (spec Web Push) |
| `locale` | text, default `pl` | do wyboru języka treści przypomnienia w `src/server/push-sender.ts` |
| `created_at` | timestamptz | |

Subskrypcje unieważnione przez przeglądarkę (serwer push odpowiada `404`/`410` przy
wysyłce) są usuwane automatycznie przy najbliższej próbie wysyłki — nie ma osobnego
zadania porządkującego.

## Relacje

```
users 1───N cards N───1 companies N───1 categories
cards 1───N visits
users/device N───N companies  (favorites)
users/device 1───N push_subscriptions
device 1───N categories  (własne kategorie, prywatne per urządzenie)
```

## Status karnetu — progi (etykieta ostrzegawcza)

Status liczony w locie (analogicznie do `archived`), nie jest osobną kolumną w MVP.
Do potwierdzenia przed implementacją — patrz zastrzeżenie niżej.

**Wymiar 1 — data ważności** (dotyczy `unlimited` zawsze, `limit` jeśli ustawiona):

| Status | Próg |
|---|---|
| `ok` | więcej niż 7 dni do wygaśnięcia |
| `soon` | 3–7 dni do wygaśnięcia |
| `urgent` | 0–2 dni do wygaśnięcia |
| `wygasł` | data minęła |
| `brak terminu` | `expiry_date IS NULL` (możliwe tylko dla `limit`) |

**Wymiar 2 — pozostałe wejścia** (dotyczy tylko `limit`):

| Status | Próg |
|---|---|
| `ok` | pozostało więcej niż 2 wejścia |
| `soon` | pozostały 2 wejścia |
| `urgent` | pozostało 1 wejście |
| `wygasł` | `used_visits >= total_visits` |

**Reguła łączenia:** gdy karnet `limit` ma ustawione oba wymiary, status końcowy to
gorszy (bliższy `urgent`/`wygasł`) z dwóch wyliczonych statusów.

**Zastrzeżenie:** powyższe progi to punkt startowy (typowy wzorzec UX „kończącego się
zasobu”), nie wartość wynikająca z briefu produktowego — do potwierdzenia lub korekty
przed implementacją, np. jeśli różne kategorie (siłownia miesięczna vs. 5 masaży)
powinny mieć różną skalę pilności.

## Indeksy (na start)

- `cards(user_id)`, `cards(device_id)`, `cards(company_id)`
- `visits(card_id, visit_date DESC)` — lista historii sortowana malejąco jak w prototypie
- `companies(category_id)`, opcjonalnie indeks przestrzenny (PostGIS) na `(lat,lng)` gdy
  wyszukiwanie „w pobliżu” zacznie być realne, nie mockowe
- `categories(created_by_device_id)` — filtrowanie własnych kategorii urządzenia w
  `GET /api/categories`
- `push_subscriptions(user_id)`, `push_subscriptions(device_id)` — wyszukiwanie
  subskrypcji właściciela karnetu przy wysyłce przypomnień; `endpoint` ma unikalny
  indeks przez samo `@unique` w Prisma

## Dostęp do danych i RLS (jeśli Supabase)

Jeśli baza danych lub storage voucherów zostaną uruchomione na Supabase (jedna z opcji w
`DEPLOYMENT.md`), obowiązuje zasada:

- **Cały dostęp do bazy idzie przez własne API (Next.js Route Handlers), nie bezpośrednio
  z frontendu przez klienta Supabase.** Klucz `service_role` (pełny dostęp, omija RLS)
  używany jest wyłącznie po stronie serwera i nigdy nie trafia do kodu klienckiego.
- Mimo to **RLS (Row Level Security) musi być włączone na wszystkich tabelach** zawierających
  dane użytkownika (`cards`, `visits`, `favorites`, `push_subscriptions`) — jako druga warstwa zabezpieczenia,
  na wypadek błędu w API, przyszłej zmiany architektury (np. bezpośredni dostęp z
  frontendu) lub pomyłkowego użycia klucza `anon` zamiast `service_role`.
- Minimalna polityka RLS na start: wiersz widoczny/edytowalny tylko wtedy, gdy
  `user_id = auth.uid()` (dla kont zalogowanych) **lub** dopasowanie po `device_id`
  przekazywanym w bezpieczny sposób.
- **Mechanizm weryfikacji `device_id` — ustalony (`ADR-007`):** surowy `device_id` nigdy
  nie jest przyjmowany bezpośrednio od klienta jako podstawa dostępu do danych. Klient
  posiada podpisany token urządzenia (JWT, `HS256`, sekret `DEVICE_TOKEN_SECRET`
  po stronie serwera), wydany przez `POST /api/device/register` przy pierwszym
  uruchomieniu aplikacji. Każde żądanie API weryfikuje podpis tokena i dopiero wtedy
  wyciąga z niego zaufany `deviceId`, którego API używa do zapytań do bazy — `deviceId`
  z ciała/nagłówka żądania **nigdy** nie jest ufany bezpośrednio. Cały dostęp do bazy
  nadal idzie przez własne API (nie z klienta bezpośrednio przez Supabase) — RLS oparte
  o `device_id` pozostaje **drugą warstwą** zabezpieczenia na wypadek błędu w tej
  logice, nie jedyną. Szczegóły implementacji: `ADR-007` w `DECISIONS.md`.
- `companies` (dane partnerów, nie dane osobowe użytkownika) — może mieć RLS z dostępem
  do odczytu dla wszystkich, zapis ograniczony do API.
- `categories` — kategorie systemowe (`is_system = true`) czytelne dla wszystkich;
  kategorie użytkownika widoczne tylko dla `device_id`, które je utworzyło (Sesja 16:
  prywatność per urządzenie, w odróżnieniu od `companies`) — analogicznie do reguły
  `device_id` dla `cards`/`visits`/`favorites` wyżej.
- Storage voucherów (Supabase Storage) — analogicznie: polityki bucketa ograniczające
  odczyt/zapis pliku do właściciela karnetu, nie publiczny odczyt po samym URL.

**Do zrobienia przed pokazaniem komukolwiek środowiska z prawdziwymi/realistycznymi
danymi:** RLS włączone i przetestowane (np. próba odczytu cudzego karnetu kluczem `anon`
powinna zwracać pustą listę, nie błąd i nie dane).
