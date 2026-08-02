# Karnet.asist — plan pracy z Claude Code (v2 → produkcja)

> Ten plik to checklista sesji. Każda sekcja = osobna sesja/prompt do Claude Code.
> Nie wklejaj całej checklisty naraz jako jeden prompt — używaj jej jako mapy,
> a do Claude Code wklejaj po jednym punkcie na raz.

## Zanim zaczniesz

- [ ] Repo zawiera `CLAUDE.md`, `README.md`, `docs/` — potwierdź, że nic nie brakuje
- [ ] Dorzuć do repo `karnet-asist-prototyp_v6.html` (referencyjny do przenoszenia
      design tokenów i tekstów i18n — wspomniany w README, ale nie było go w zipie)
- [ ] Dorzuć `Karta_pomyslu_Karnet_asist.docx` (brief produktowy, jeśli masz)
- [ ] `git init` + pierwszy commit
- [ ] Uruchom `claude` w katalogu projektu
- [ ] Poproś Claude Code o streszczenie zasad z `CLAUDE.md` (zakres MVP, sposób
      pracy, reguły bezpieczeństwa) i potwierdź, że się zgadza, zanim zaczniesz

## Środowisko (raz, na początku)

- [ ] Postgres — lokalnie przez Docker albo od razu Neon/Supabase
- [ ] `.env` na bazie `docs/SETUP.md`:
      `DATABASE_URL`, `GOOGLE_MAPS_API_KEY`, `NEXTAUTH_SECRET`,
      `DEVICE_TOKEN_SECRET` (`openssl rand -base64 32`),
      `STORAGE_BUCKET_URL`, `STORAGE_ACCESS_KEY`
- [ ] `.env.example` do repo (puste wartości), `.env` — nigdy do repo

## Sesja 1 — Scaffolding

Prompt (skróć/dostosuj):
> Zbuduj scaffolding projektu: Next.js (App Router) + TypeScript + Tailwind,
> struktura `src/app`, `src/components`, `src/lib`, `src/server`, `prisma/`.
> Zainicjuj Prisma i przygotuj schema bazy wg `docs/DATABASE.md`.
> Przenieś tokeny kolorów (`--mint`, `--coral`, `--accent`, `--status-*`)
> z prototypu do `tailwind.config` jako `theme.extend`.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Kod wygenerowany
- [ ] `npm run lint`, `npm run test` uruchomione i zaraportowane
- [ ] Commit

## Sesja 2 — Device token (ADR-007)

- [ ] Endpoint `POST /api/device/register`
- [ ] Podpisywanie/weryfikacja JWT przez `DEVICE_TOKEN_SECRET` (tylko server-side)
- [ ] Nigdy nie ufać surowemu `device_id` z klienta
- [ ] lint/test + commit

## Sesja 3 — CRUD karnetów

- [ ] Kreator dodawania karnetu
- [ ] Edycja
- [ ] Usuwanie zawsze przez dialog potwierdzenia (nigdy jednym kliknięciem)
- [ ] Reguła: `unlimited` → data ważności wymagana; `limit` → opcjonalna
- [ ] lint/test + commit

## Sesja 4 — Wejścia (visits)

- [ ] Dodawanie/edycja wejść
- [ ] Licznik wykorzystanych wejść
- [ ] lint/test + commit

## Sesja 5 — Automatyczna archiwizacja

- [ ] Limit wyczerpany → archiwizacja
- [ ] Data ważności minęła → archiwizacja
- [ ] Progi statusu `ok`/`soon`/`urgent` dokładnie wg `docs/DATABASE.md`
      (nie zgadywać nowych wartości)
- [ ] lint/test + commit

## Sesja 6 — UI listy karnetów + statusy

- [ ] Lista z widocznym statusem ok/soon/urgent
- [ ] Puste stany, komunikaty błędów w tonie z `docs/user/faq.md` i
      `getting-started.md` (rzeczowo, ciepło, bez żargonu i emoji)
- [ ] lint/test + commit

## Sesja 7 — i18n PL/EN + dark mode

- [ ] Przeniesienie słownika i18n z prototypu (np. do `next-intl`)
- [ ] Dark mode 1:1 z prototypu
- [ ] Wszystkie nowe teksty przez słownik, nic hardkodowane w komponentach
- [ ] lint/test + commit

## Sesja 8 — Dodawanie firmy ręcznie (bez Google Maps API)

- [ ] Ręczne dodawanie firmy z listy/nazwą
- [ ] Miejsce w UI pod przyszłą integrację Google Places, ale bez podłączonego API
- [ ] lint/test + commit

## Przed pierwszym wdrożeniem produkcyjnym

Checklista z `docs/DEPLOYMENT.md`:

- [ ] Limit/budżet na Google Maps API ustawiony
- [ ] Automatyczne kopie zapasowe bazy danych
- [ ] Monitoring błędów (np. Sentry) podłączony
- [ ] Polityka prywatności / regulamin gotowe (aplikacja przetwarza dane osobowe)
- [ ] Umowy powierzenia danych (DPA) z dostawcami hostingu/bazy/storage
- [ ] Techniczna możliwość usunięcia konta i danych na żądanie
- [ ] Jeśli Supabase: RLS włączone na wszystkich tabelach z danymi użytkownika,
      przetestowane kluczem `anon`
- [ ] `service_role` (Supabase) tylko po stronie serwera, nigdy z prefiksem
      `NEXT_PUBLIC_`

## Rzeczy, o które trzeba pytać, a nie zgadywać

- Docelowa domena produkcyjna
- Konkretne wartości limitów, jeśli nie są jawnie zapisane w `CLAUDE.md`/`docs/`
- Wszystko, co dotyka danych osobowych i bezpieczeństwa — pytać zawsze, zanim
  wdroży się założenie na produkcję

## Rzeczy świadomie poza zakresem MVP (nie dodawać bez pytania)

- Płatności
- Rezerwacje zajęć
- Rozliczenia z operatorami typu Multisport
- OCR ze zdjęcia
- Natywna aplikacja mobilna
- Realna integracja Google Maps/Places (ADR-004) — dopiero po MVP
