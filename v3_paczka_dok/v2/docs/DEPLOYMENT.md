# Wdrażanie — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v1 · Zapisano: 2026-08-01 23:33
> Zaktualizowano: 2026-08-09 — stan po pierwszym wdrożeniu produkcyjnym, patrz checklista
> niżej i `plan-pracy-claude-code.md`.

> Aplikacja jest **live w produkcji** od 2026-08-09: `https://karnet.asist.dropia.pro`
> (Vercel, projekt `karnet-asist-v3`; baza Supabase Postgres, region Irlandia; logowanie
> Google działa; RLS włączone i przetestowane na wszystkich 9 tabelach).

## Środowiska

- **Preview** — automatyczny deploy per pull request (np. Vercel Preview Deployments)
- **Staging** — gałąź `main`/`develop`, dane testowe
- **Production** — gałąź release, osobna baza danych i osobne sekrety

Nigdy nie wskazywać produkcyjnej bazy danych ze środowiska preview/staging.

## Hosting (faktyczny, od pierwszego wdrożenia 2026-08-09)

| Warstwa | Usługa |
|---|---|
| Frontend + API (Next.js) | Vercel, projekt `karnet-asist-v3` |
| Baza danych | Supabase (managed Postgres), region Irlandia |
| Pliki (vouchery, `ADR-009`) | Supabase Storage, ten sam projekt co baza; bucket dev `voucher-files-dev` już istnieje, bucket produkcyjny `voucher-files` **do założenia przy wdrożeniu tej funkcji** |
| Mapy / Places (`ADR-004`) | Google Maps Platform, klucz `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Doradca AI (`ADR-008`) | Groq (LLM) + Google Places API (New) server-side, klucze `GROQ_API_KEY` i `GOOGLE_PLACES_SERVER_KEY` |

**Next.js przypięty na `15.5.23`** (dist-tag "backport"), **nie** na `latest` 16.x —
build platform Vercela w momencie wdrożenia nie rozpoznawał outputu Next 16 ("No
framework detected", zero funkcji). Do rewizji, gdy wsparcie Vercela dla Next 16 dojrzeje
— sprawdzić aktualne dist-tagi `next` w npm, zanim założy się, że to nadal aktualne.

## Migracje bazy danych

- Migracje Prisma uruchamiane jako krok w pipeline CI/CD przed przełączeniem ruchu na
  nową wersję (nie ręcznie na produkcji)
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
