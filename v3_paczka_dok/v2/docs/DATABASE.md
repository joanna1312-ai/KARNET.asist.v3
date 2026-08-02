# Schemat danych — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

> DRAFT — nazwy/typy do potwierdzenia przy implementacji Prisma schema.

## Tabele

### `users` (opcjonalne)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `email` | text, unique, nullable | konto opcjonalne — brak konta = brak wiersza |
| `created_at` | timestamptz | |

### `companies` (partnerzy)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `category` | enum: `gym, pool, group_classes, massage, beauty` | odpowiednik `cat` w prototypie |
| `lat`, `lng` | double, nullable | z Google Places, `null` dopóki nie ustawione |
| `google_place_id` | text, nullable | do integracji z realnym Google Maps |
| `created_by_user_id` | uuid FK → users, nullable | kto dodał „nową firmę” ręcznie |

W prototypie `partners[]` ma sztuczne `x`/`y` (procent na schematycznej mapie) i `dist`
(mockowany dystans) — oba znikają na rzecz prawdziwych `lat`/`lng` i liczonego
dystansu względem lokalizacji użytkownika.

### `cards` (karnety)

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users, **nullable** | brak konta = karnet lokalny/urządzeniowy |
| `device_id` | text, nullable | identyfikator lokalny, gdy brak konta (do sync po zalogowaniu) |
| `company_id` | uuid FK → companies | |
| `type` | enum: `limit`, `unlimited` | |
| `total_visits` | int, nullable | wymagane, gdy `type = limit` |
| `used_visits` | int, default 0 | |
| `expiry_date` | date, **nullable** | **opcjonalna dla `limit`, wymagana dla `unlimited`** — reguła z v5/v6 |
| `voucher_mode` | enum: `single`, `per_visit` | |
| `voucher_file_url` | text, nullable | plik w object storage |
| `deleted_at` | timestamptz, nullable | miękkie usuwanie (rekomendacja) |
| `created_at`, `updated_at` | timestamptz | |

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

## Relacje

```
users 1───N cards N───1 companies
cards 1───N visits
users/device N───N companies  (favorites)
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
- `companies(category)`, opcjonalnie indeks przestrzenny (PostGIS) na `(lat,lng)` gdy
  wyszukiwanie „w pobliżu” zacznie być realne, nie mockowe

## Dostęp do danych i RLS (jeśli Supabase)

Jeśli baza danych lub storage voucherów zostaną uruchomione na Supabase (jedna z opcji w
`DEPLOYMENT.md`), obowiązuje zasada:

- **Cały dostęp do bazy idzie przez własne API (Next.js Route Handlers), nie bezpośrednio
  z frontendu przez klienta Supabase.** Klucz `service_role` (pełny dostęp, omija RLS)
  używany jest wyłącznie po stronie serwera i nigdy nie trafia do kodu klienckiego.
- Mimo to **RLS (Row Level Security) musi być włączone na wszystkich tabelach** zawierających
  dane użytkownika (`cards`, `visits`, `favorites`) — jako druga warstwa zabezpieczenia,
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
- Storage voucherów (Supabase Storage) — analogicznie: polityki bucketa ograniczające
  odczyt/zapis pliku do właściciela karnetu, nie publiczny odczyt po samym URL.

**Do zrobienia przed pokazaniem komukolwiek środowiska z prawdziwymi/realistycznymi
danymi:** RLS włączone i przetestowane (np. próba odczytu cudzego karnetu kluczem `anon`
powinna zwracać pustą listę, nie błąd i nie dane).
