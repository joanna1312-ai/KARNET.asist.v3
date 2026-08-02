# Wdrażanie — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v1 · Zapisano: 2026-08-01 23:33

> DRAFT — proponowana konfiguracja dla MVP, niska złożoność operacyjna.

## Środowiska

- **Preview** — automatyczny deploy per pull request (np. Vercel Preview Deployments)
- **Staging** — gałąź `main`/`develop`, dane testowe
- **Production** — gałąź release, osobna baza danych i osobne sekrety

Nigdy nie wskazywać produkcyjnej bazy danych ze środowiska preview/staging.

## Proponowany hosting

| Warstwa | Usługa (propozycja) |
|---|---|
| Frontend + API (Next.js) | Vercel |
| Baza danych | Neon lub Supabase (managed Postgres) |
| Pliki (vouchery) | Supabase Storage lub Cloudflare R2 |
| Mapy | Google Maps Platform (wymaga karty płatniczej, limit budżetu do ustawienia) |

## Migracje bazy danych

- Migracje Prisma uruchamiane jako krok w pipeline CI/CD przed przełączeniem ruchu na
  nową wersję (nie ręcznie na produkcji)
- Migracje muszą być kompatybilne wstecz przez jeden deploy (rolling deploy) — nie usuwać
  kolumny w tym samym release, w którym przestaje być używana

## Sekrety

- Zmienne środowiskowe trzymane w panelu hostingu (nie w repo)
- Rotacja `GOOGLE_MAPS_API_KEY` i kluczy storage przy podejrzeniu wycieku

## Checklist przed pierwszym wdrożeniem produkcyjnym

- [ ] Ustawiony limit/budżet na Google Maps API (żeby nieoczekiwany ruch nie wygenerował
      wysokiego rachunku)
- [ ] Kopie zapasowe bazy danych (automatyczne, zgodne z planem hostingu)
- [ ] Monitoring błędów (np. Sentry) podłączony przed pierwszym publicznym udostępnieniem
- [ ] Polityka prywatności / regulamin — konieczne, bo aplikacja przetwarza dane osobowe
      (e-mail przy koncie, zdjęcia voucherów, notatki do wejść) — patrz sekcja
      "RODO — dane osobowe przetwarzane przez aplikację" w [DECISIONS.md](DECISIONS.md)
- [ ] Umowy powierzenia danych (DPA) podpisane/zaakceptowane z dostawcami hostingu, bazy
      danych i storage plików — patrz sekcja RODO w DECISIONS.md
- [ ] Zrealizowana techniczna możliwość usunięcia konta i danych na żądanie użytkownika
- [ ] Jeśli baza/storage na Supabase: RLS włączone na wszystkich tabelach z danymi
      użytkownika i przetestowane kluczem `anon` przed pokazaniem komukolwiek środowiska
      z realistycznymi danymi — patrz sekcja "Dostęp do danych i RLS" w DATABASE.md
- [ ] Klucz `service_role` (Supabase) używany wyłącznie po stronie serwera, nigdy w
      kodzie klienckim ani w zmiennych środowiskowych z prefiksem `NEXT_PUBLIC_`
