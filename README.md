# KARNET.asist

Aplikacja webowa do trzymania w jednym miejscu wszystkich karnetów wejściowych —
siłownia, basen, zajęcia grupowe, masaże, zabiegi kosmetyczne — z licznikiem
wykorzystanych wejść i datami ważności. Dla osób, które kupują karnety bezpośrednio u
różnych, niepowiązanych ze sobą usługodawców (nie korzystają z jednego zintegrowanego
ekosystemu typu Multisport) i tracą orientację, gdzie i ile wejść im zostało.

**Wersja produkcyjna: [karnet.asist.dropia.pro](https://karnet.asist.dropia.pro)**
— działa bez zakładania konta (dane zapisane lokalnie na urządzeniu); logowanie przez
Google jest opcjonalne i służy tylko do trwałego zapisu danych na koncie.

> Praca zaliczeniowa kursu Vibe Coding Summer School. Aplikację stworzyła
> **Joanna Dropia**, z pomocą AI (Claude Code, Claude Sonnet 5).
> Kontakt: [ai.joanna.dropia@gmail.com](mailto:ai.joanna.dropia@gmail.com)

## Funkcje

- CRUD karnetów przez kreator (firma → typ karnetu → voucher), edycja, usunięcie z
  potwierdzeniem
- Licznik wykorzystanych wejść i automatyczna archiwizacja (limit wyczerpany / data
  ważności minęła)
- Konto opcjonalne (logowanie Google) — tryb bez konta jest pełnoprawną ścieżką, nie
  ograniczoną wersją
- Integracja Google Maps/Places — wyszukiwanie firmy z podpowiedziami, mapa lokalizacji,
  sortowanie listy firm „najbliżej mnie”
- Doradca AI (Groq + Google Places) — rekomendacje miejsc w okolicy na podstawie
  dotychczasowych karnetów użytkownika
- Voucher jako plik/zdjęcie — bezpośredni upload do Supabase Storage (bucket prywatny,
  podpisane, wygasające URL-e)
- i18n (PL/EN) i tryb ciemny
- Codzienny automatyczny, szyfrowany backup bazy danych (GitHub Actions)

## Stack technologiczny

Next.js (App Router) + TypeScript + Tailwind CSS · PostgreSQL + Prisma ORM ·
Auth.js/NextAuth (Google OAuth) · Supabase (Postgres + Storage) ·
Google Maps JavaScript API + Places API (New) · Groq (`llama-3.3-70b-versatile`) ·
Vitest (jednostkowe/integracyjne) + Playwright (e2e) · hosting: Vercel

## Struktura repozytorium

```
app/                          kod aplikacji (Next.js)
docs/                         dokumentacja techniczna wersji produkcyjnej
  ARCHITECTURE.md              widok systemu i przepływy
  DATABASE.md                  schemat danych
  API.md                       endpointy
  DECISIONS.md                 decyzje architektoniczne (ADR)
  SETUP.md                     pełna instrukcja uruchomienia lokalnego
  DEPLOYMENT.md                wdrażanie, hosting, checklista produkcyjna
  TESTING.md                   strategia testów
  MOBILE_ROADMAP.md            plan Web → Android/iOS
  user/                        dokumentacja dla użytkowników końcowych (FAQ, pierwsze kroki)
v3_paczka_dok/                 materiały historyczne (punkt wyjścia projektu)
  karnet-asist-prototyp_v6.html   pierwotny klikalny prototyp
  Karta_pomyslu_Karnet_asist.docx brief produktowy
  v2/                          archiwalny CLAUDE.md/README.md sprzed wydzielenia docs/
plan-pracy-claude-code.md     chronologiczny log sesji rozwojowych (co, kiedy, dlaczego)
docker-compose.yml            lokalny Postgres (dev + baza testowa) do developmentu
.github/workflows/            automatyczny codzienny backup bazy produkcyjnej
```

## Uruchomienie lokalne

Pełna instrukcja (zmienne środowiskowe, konfiguracja Supabase Storage, Google OAuth):
[`docs/SETUP.md`](docs/SETUP.md). Skrót:

```bash
docker compose up -d db        # lokalny Postgres
cd app
npm install
cp .env.example .env           # uzupełnij wartości, patrz docs/SETUP.md
npx prisma migrate dev
npm run dev                    # http://localhost:3000
```

## Testy

```bash
cd app
npm run lint
npm run test       # Vitest — jednostkowe/integracyjne
npm run test:e2e   # Playwright — e2e (docker compose up -d db_test)
```

Testy jednostkowe/integracyjne i e2e przechodzą przy każdym uruchomieniu lokalnym — nie
utrzymujemy tu zamrożonej liczby testów, bo szybko się dezaktualizuje (brak jeszcze CI,
patrz `docs/AUDIT_2026-08-20.md`, pkt 5). Szczegóły środowiska testowego:
[`docs/TESTING.md`](docs/TESTING.md).

## Dokumentacja

Pełna dokumentacja techniczna znajduje się w
[`docs/`](docs/): architektura, schemat bazy danych,
API, decyzje architektoniczne (ADR), setup, wdrażanie, strategia testów. Chronologiczny
przebieg prac (sesja po sesji, z uzasadnieniami decyzji) —
[`plan-pracy-claude-code.md`](plan-pracy-claude-code.md). Dokumentacja dla użytkowników
końcowych (FAQ, pierwsze kroki) —
[`docs/user/`](docs/user/).
