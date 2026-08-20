# Wdrażanie — KARNET.asist

> Nazwa projektu: KARNET.asist · Wersja: v1 · Zapisano: 2026-08-01 23:33
> Zaktualizowano: 2026-08-09 — stan po pierwszym wdrożeniu produkcyjnym, patrz checklista
> niżej i `plan-pracy-claude-code.md`.

> Aplikacja jest **live w produkcji** od 2026-08-09: `https://karnet.asist.dropia.pro`
> (Vercel, projekt `karnet-asist-v3`; baza Supabase Postgres, region Irlandia; logowanie
> Google działa; RLS włączone i przetestowane na wszystkich 9 tabelach).

## Środowiska

- **Preview** — automatyczny deploy per pull request (Vercel Preview Deployments)
- **Production** — gałąź `main` (Vercel Git integration, auto-deploy na push)

> **Stan faktyczny (sprawdzone 2026-08-19), nie plan:** Preview i Production współdzielą
> tę samą bazę Supabase (`eewrubcmfeeuoikmddhh`) — pierwotny plan poniżej ("nigdy nie
> wskazywać produkcyjnej bazy z preview/staging", osobna gałąź "release" ze swoją bazą)
> **nie został wdrożony**. Nie ma osobnej bazy dev/staging. To realne ryzyko: build z
> dowolnego pull requestu (Preview) łączy się z tą samą produkcyjną bazą, na której są
> prawdziwe dane użytkowników — błąd w kodzie na branchu feature (np. zły `DELETE`/
> `updateMany` bez filtra) mógłby uszkodzić dane produkcyjne, nie testowe. Świadomie
> zostawione tak przez właścicielkę na małą/prywatną skalę użycia — do rewizji (osobny
> projekt Supabase pod Preview) przy realnym wzroście ruchu albo liczby współpracujących
> osób.
>
> Pierwotny plan (zanim wdrożono produkcję, zachowany dla kontekstu):
> - Preview — dane testowe
> - Production — gałąź release, osobna baza danych i osobne sekrety
> - Zasada "nigdy nie wskazywać produkcyjnej bazy z preview/staging" — **obecnie
>   złamana w praktyce, patrz wyżej**

## Hosting (faktyczny, od pierwszego wdrożenia 2026-08-09)

| Warstwa | Usługa |
|---|---|
| Frontend + API (Next.js) | Vercel, projekt `karnet-asist-v3` |
| Baza danych | Supabase (managed Postgres), region Irlandia |
| Pliki (vouchery, `ADR-009`) | Supabase Storage, ten sam projekt co baza; oba buckety założone i działają — dev `voucher-files-dev`, produkcyjny `voucher-files` |
| Mapy / Places (`ADR-004`) | Google Maps Platform, klucz `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Doradca AI (`ADR-008`) | Groq (LLM) + Google Places API (New) server-side, klucze `GROQ_API_KEY` i `GOOGLE_PLACES_SERVER_KEY` |

**Next.js przypięty na `15.5.23`** (dist-tag "backport"), **nie** na `latest` 16.x —
build platform Vercela w momencie wdrożenia nie rozpoznawał outputu Next 16 ("No
framework detected", zero funkcji). Do rewizji, gdy wsparcie Vercela dla Next 16 dojrzeje
— sprawdzić aktualne dist-tagi `next` w npm, zanim założy się, że to nadal aktualne.

## Migracje bazy danych

- `npx prisma migrate deploy` wpięte w skrypt `build` w `app/package.json`
  (`prisma migrate deploy && next build`) — uruchamia się automatycznie na Vercelu przy
  każdym buildzie (Production i Preview), przed `next build`, więc nowa wersja kodu nigdy
  nie idzie na produkcję bez zastosowanych migracji.
- `prisma.config.ts` (używany tylko przez Prisma CLI, nie przez runtime aplikacji — patrz
  `src/lib/db.ts`) czyta connection string z `MIGRATE_DATABASE_URL`, z fallbackiem do
  `DATABASE_URL`. Powód: `DATABASE_URL` w Vercelu wskazuje Supabase **transaction pooler**
  (port 6543) — dobry dla zapytań w serverless, ale `prisma migrate deploy` potrzebuje
  advisory locków na poziomie sesji, których transaction pooling nie wspiera (migracja
  wisi w nieskończoność zamiast się wykonać albo zakończyć błędem). `MIGRATE_DATABASE_URL`
  wskazuje **session pooler** (port 5432) tej samej bazy. Ustawione w Vercelu dla
  Production i Preview 2026-08-19 (patrz też uwaga w sekcji "Środowiska" — obie wskazują
  tę samą bazę).
- Migracje muszą być kompatybilne wstecz przez jeden deploy (rolling deploy) — nie usuwać
  kolumny w tym samym release, w którym przestaje być używana

## Sekrety

- Zmienne środowiskowe trzymane w panelu hostingu (nie w repo)
- Rotacja `GOOGLE_MAPS_API_KEY` i kluczy storage przy podejrzeniu wycieku

## Checklist przed pierwszym wdrożeniem produkcyjnym

Stan na 2026-08-09 (pierwsze wdrożenie produkcyjne). Część punktów została **świadomie
odłożona do kolejnej wersji aplikacji** (decyzja użytkowniczki 2026-08-09) — to nie są
przeoczenia, ale oznaczają realne ryzyko przy realnym wzroście liczby użytkowników, patrz
uwaga pod listą.

- [ ] Ustawiony limit/budżet na Google Maps API (żeby nieoczekiwany ruch nie wygenerował
      wysokiego rachunku) — do potwierdzenia w Google Cloud Console
- [x] Kopie zapasowe bazy danych — automatyczne, codziennie 02:00 UTC, przez GitHub
      Actions (`.github/workflows/db-backup.yml`): `pg_dump` przez Docker (obraz
      `postgres:17`, żeby wersja zawsze pasowała do serwera Supabase), szyfrowane GPG
      (AES-256), przechowywane jako artefakt workflow 30 dni
- [ ] Monitoring błędów (np. Sentry) — **świadomie odłożone do kolejnej wersji
      aplikacji**, nie podłączone
- [ ] Polityka prywatności / regulamin (RODO) — **świadomie odłożone do kolejnej wersji
      aplikacji**, mimo że aplikacja przetwarza dane osobowe (e-mail przy koncie, zdjęcia
      voucherów, notatki do wejść, a od Fazy V4 też przybliżoną pozycję użytkownika przy
      korzystaniu z Doradcy AI/sortowania po dystansie) — patrz sekcja "RODO — dane
      osobowe przetwarzane przez aplikację" w [DECISIONS.md](DECISIONS.md)
- [ ] Umowy powierzenia danych (DPA) z dostawcami hostingu, bazy danych i storage plików
      — **świadomie odłożone do kolejnej wersji aplikacji** — patrz sekcja RODO w
      DECISIONS.md
- [ ] Zrealizowana techniczna możliwość usunięcia konta i danych na żądanie użytkownika —
      **świadomie odłożone do kolejnej wersji aplikacji**
- [x] RLS włączone na wszystkich 9 tabelach Supabase i przetestowane kluczem `anon` —
      zrobione przed uruchomieniem produkcji — patrz sekcja "Dostęp do danych i RLS" w
      DATABASE.md
- [x] Klucz `service_role`/`STORAGE_ACCESS_KEY` (Supabase) używany wyłącznie po stronie
      serwera (`src/server/storage.ts`), nigdy w kodzie klienckim ani w zmiennych
      środowiskowych z prefiksem `NEXT_PUBLIC_`

**Ważne przy skalowaniu:** dopóki aplikacja ma małą/prywatną skalę użycia, powyższe
odłożenie Sentry/RODO/DPA/usuwania konta było świadomą decyzją, nie przeoczeniem. Gdy
liczba realnych użytkowników i ich danych osobowych wzrośnie, obowiązek RODO staje się
mniej odkładalny — wtedy te punkty wracają jako priorytet, nie tylko "kolejna wersja".
