# Strategia testów — KARNET.asist

> Nazwa projektu: KARNET.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08 · Sekcja e2e
> zaktualizowana: 2026-08-06 (Sesja 13) · Stan e2e Google Maps/Places zaktualizowany:
> 2026-08-09 (Faza V4)

Next.js + Vitest (jednostkowe/integracyjne) + Playwright (e2e), zgodnie z pozostałymi
projektami z tego kursu.

## Testy jednostkowe (logika biznesowa)

Priorytet — to reguły, które w prototypie są łatwe do przypadkowego popsucia przy
refaktorze:

- `isArchived(card)` — karnet limit w pełni wykorzystany LUB data ważności minęła
- Walidacja: `expiryDate` zawsze opcjonalna, dla obu typów karnetu (Sesja V6.15)
- Liczenie dni do końca ważności / etykiety statusu (`ok`/`soon`/`urgent`/`wygasł`/
  `brak terminu`) wg progów z `DATABASE.md` („Status karnetu — progi”), w tym reguła
  łączenia dla karnetów `limit` z ustawioną datą ważności (gorszy z dwóch wymiarów wygrywa)
- Dodanie/usunięcie wejścia poprawnie aktualizuje `usedVisits` (nie schodzi poniżej 0)

## Testy integracyjne (API)

- `POST /api/cards` z brakującą datą ważności dla `unlimited` → błąd walidacji
- `POST /api/cards` z brakującą datą ważności dla `limit` → sukces (opcjonalność)
- `DELETE /api/cards/:id` bez potwierdzenia po stronie API nie jest wymagane (to UX na
  froncie), ale endpoint powinien być idempotentny i zwracać sensowny status przy
  usuwaniu nieistniejącego zasobu
- Filtrowanie `GET /api/cards` vs `GET /api/cards?archived=true` — karnet nie powinien
  nigdy pojawić się w obu jednocześnie

## Testy e2e (Playwright) — kluczowe ścieżki z prototypu

1. Dodanie nowego karnetu przez kreator (firma istniejąca → typ → voucher → zapis) —
   zaimplementowane: `app/e2e/card-crud.spec.ts`
2. Dodanie karnetu przez wybór firmy z Google Maps (mock w środowisku testowym, żeby nie
   zależeć od realnego API w CI) — integracja Google Maps/Places jest zaimplementowana od
   Sesji V4.1 (ADR-004, potwierdzone), ale **ten e2e test wciąż nie istnieje**: brakuje
   mocka `@vis.gl/react-google-maps`/Places w środowisku Playwright — pozostaje realną
   luką w pokryciu, nie tylko odłożoną formalnością
3. Zalogowanie wejścia i weryfikacja aktualizacji licznika wykorzystanych wejść —
   zaimplementowane: `app/e2e/visits.spec.ts`
4. Edycja i usunięcie wejścia z historii — zaimplementowane: `app/e2e/visits.spec.ts`
5. Edycja daty ważności, w tym wyczyszczenie jej dla karnetu typu `limit` —
   zaimplementowane: `app/e2e/card-expiry.spec.ts`
6. Usunięcie karnetu — sprawdzenie, że dialog potwierdzający się pojawia i anulowanie
   nie usuwa danych — zaimplementowane: `app/e2e/card-delete.spec.ts`
7. Karnet automatycznie znika z listy głównej i pojawia się w archiwum po osiągnięciu
   limitu wejść / dacie ważności — zaimplementowane: `app/e2e/archive.spec.ts`
8. Przełączenie języka PL/EN i trybu ciemnego — brak błędów, teksty się zmieniają —
   zaimplementowane: `app/e2e/locale-theme.spec.ts`

Uruchomienie: `npm run test:e2e` (katalog `app/`). Chromium jako jedyna przeglądarka na
start (`npx playwright install --with-deps chromium`) — wystarcza do pokrycia ścieżek
biznesowych powyżej; rozszerzenie o Firefox/WebKit do rozważenia, gdyby pojawiły się
regresje specyficzne dla silnika.

## Środowisko testowe

- **Baza testowa odizolowana od dev/staging/prod**: osobny kontener Postgres
  `db_test` w `docker-compose.yml` (port 5433, osobny wolumin) — nigdy ten sam, co baza
  dev (`db`, port 5432). Uruchomienie: `docker compose up -d db_test`.
- Konfiguracja: skopiuj `app/.env.test.example` do `app/.env.test` (niecommitowane, jak
  `.env`) i uzupełnij `DEVICE_TOKEN_SECRET` (`openssl rand -base64 32`) — osobny sekret
  niż w `.env`, żeby środowiska się nie mieszały.
- Playwright (`app/playwright.config.ts`) sam odpala `next dev` na porcie 3100 z env z
  `.env.test` i przed całym przebiegiem nakłada migracje Prisma na `db_test`
  (`app/e2e/global-setup.ts`) — nie trzeba tego robić ręcznie.
- **Reset danych**: każdy test (nie tylko każdy plik) czyści (`TRUNCATE ... CASCADE`)
  wszystkie tabele domenowe przed startem (`app/e2e/support/db.ts`, fixture `resetDb` w
  `app/e2e/support/fixtures.ts`) — istotne zwłaszcza dla `companies`, bo w odróżnieniu od
  `cards`/`visits` nie są scope'owane per urządzenie, tylko globalnie współdzielone.
  Konsekwencja: testy działają na jednym workerze (`workers: 1`) — równoległe czyściłyby
  sobie nawzajem dane.
- Google Maps/Places API **nie jest** obecnie mockowane w e2e (patrz punkt 2 wyżej) — do
  zrobienia, żeby nie zużywać limitu/budżetu realnego klucza w CI i nie robić testów
  zależnymi od zewnętrznej usługi. Groq i Google Places (server-side, Doradca AI, ADR-008)
  też nie mają dedykowanego e2e ani mocka — pokryte tylko testami jednostkowymi
  `ai-recommendations.ts` (patrz repo, `src/server/ai-recommendations.ts` i test obok).
