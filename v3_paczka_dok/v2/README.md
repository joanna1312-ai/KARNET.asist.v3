# Karnet.asist

Gdy masz kilka karnetów w różnych miejscach, łatwo stracić orientację, ile wejść
zostało i kiedy który wygasa. Karnet.asist to centralizuje w jednym miejscu — bez
zakładania konta.

Aplikacja do trzymania w jednym miejscu wszystkich karnetów wejściowych — siłownia,
basen, zajęcia grupowe, masaże, zabiegi kosmetyczne — z licznikiem wykorzystanych wejść i
datami ważności. Niezależna od konkretnych klubów/salonów; konto opcjonalne.

## Status projektu

Ukończony **prototyp klikalny** (statyczny HTML/CSS/JS, bez backendu i bez trwałego
zapisu danych) — kolejne wersje `v1`–`v6` dokumentują iteracje nad designem i zakresem
funkcji. Aktualna wersja: **`karnet-asist-prototyp_v6.html`** (otwórz bezpośrednio w
przeglądarce).

Ten katalog zawiera też **draft dokumentacji technicznej** pod przyszłą wersję
produkcyjną — patrz [`CLAUDE.md`](CLAUDE.md) i [`docs/`](docs/).

## Zawartość repo

- `Karta_pomyslu_Karnet_asist.docx` — pierwotny brief produktowy
- `dokumentacja_techniczna_fitness_app.pdf` — wzorzec struktury dokumentacji, na którym
  oparty jest `docs/`
- `karnet-asist-prototyp_v6.html` — aktualny prototyp (poprzednie wersje zachowane dla
  historii iteracji)
- `CLAUDE.md` — kontekst i zasady dla Claude Code przy budowie wersji produkcyjnej
- `docs/` — dokumentacja techniczna (architektura, baza danych, API, setup, wdrożenie,
  plan mobile, decyzje architektoniczne, strategia testów)
- `docs/user/` — dokumentacja dla użytkowników końcowych (FAQ, pierwsze kroki)

## Uruchomienie prototypu

Otwórz `karnet-asist-prototyp_v6.html` bezpośrednio w przeglądarce — to pojedynczy plik
bez zależności ani serwera.

## Dokumentacja

- [CLAUDE.md](CLAUDE.md) — kontekst projektu i zasady dla Claude Code
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — widok systemu i przepływy
- [docs/DATABASE.md](docs/DATABASE.md) — schemat danych
- [docs/API.md](docs/API.md) — endpointy
- [docs/SETUP.md](docs/SETUP.md) — uruchomienie lokalne (wersja produkcyjna)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — wdrażanie
- [docs/MOBILE_ROADMAP.md](docs/MOBILE_ROADMAP.md) — plan Web → Android/iOS
- [docs/DECISIONS.md](docs/DECISIONS.md) — decyzje architektoniczne (ADR)
- [docs/TESTING.md](docs/TESTING.md) — strategia testów
- [docs/user/](docs/user/) — dokumentacja dla użytkowników
