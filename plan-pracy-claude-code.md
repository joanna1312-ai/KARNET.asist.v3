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

## Sesja 9 — Widok archiwum karnetów + porządek w regule `archived`

Kontekst: `GET /api/cards?archived=true` już istnieje, ale UI (`/cards`) nigdy go nie
wywołuje — zarchiwizowany karnet po prostu znika bez możliwości podglądu. Przy okazji:
`src/app/cards/[id]/page.tsx` ma własną, zduplikowaną kopię `isArchived()` zamiast
importować `isCardArchived` z `@/server/card-status` — ryzyko rozjazdu, jeśli reguła się
kiedyś zmieni.

Prompt (skróć/dostosuj):
> Dodaj w widoku listy karnetów (`/cards`) przełącznik/zakładkę "Aktywne" / "Archiwum",
> korzystający z istniejącego `GET /api/cards?archived=true`. Karnety w archiwum widoczne
> tylko do odczytu — bez przycisku dodania wejścia (API i tak zwraca `409 card_archived`,
> ale UI nie powinno w ogóle proponować tej akcji). Przy okazji zamień lokalną kopię
> `isArchived()` w `src/app/cards/[id]/page.tsx` na import `isCardArchived` z
> `@/server/card-status`, żeby reguła archiwizacji żyła w jednym miejscu.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Plan zaakceptowany
- [x] Zakładka/przełącznik archiwum w UI
- [x] Duplikat `isArchived` usunięty na rzecz wspólnej funkcji
- [x] lint/test + commit

Dodatkowo (na wyraźną prośbę, poza pierwotnym opisem sesji): przycisk „Odnów” przy
zarchiwizowanym karnecie (nowy karnet POST-em, wstępnie wypełniony danymi z karnetu
archiwalnego, bez daty ważności) i potwierdzenie przed usunięciem karnetu z archiwum
(ten sam współdzielony `ConfirmDialog`, co przy usuwaniu z listy aktywnych).

## Sesja 10 — Ekran firm/partnerów + podgląd partnera

Kontekst: `ARCHITECTURE.md` (sekcja "Przepływy najważniejszych operacji") opisuje
przepływ "Podgląd partnera" jako jeden z kluczowych, prototyp ma go w całości
(`openPartnerDetail()`), ale w `CLAUDE.md` nie jest on wprost wymieniony na liście "musi
działać w MVP" ani na liście "może wejść później" — **to nie jest jednoznacznie
rozstrzygnięte w dokumentacji**. Zanim odpalisz tę sesję w Claude Code, zdecyduj, czy ma
wejść teraz, czy poczekać.

Prompt (skróć/dostosuj):
> Dodaj `GET /api/companies/:id` wg `docs/API.md` (szczegóły firmy + karnety
> użytkownika/urządzenia powiązane z tą firmą — filtr po `companyId`, nie po nazwie jak w
> prototypie). Dodaj ekran `/companies` z listą firm (z danych z `GET /api/companies`) oraz
> `/companies/:id` pokazujący karnety danej firmy, analogicznie do `openPartnerDetail()` w
> `karnet-asist-prototyp_v6.html`. Bez integracji Google Maps/Places (ADR-004 nadal
> odłożone) — tylko lista tekstowa, bez mapy/pinezek. Dodaj link do tego ekranu w
> nawigacji (`Header.tsx` lub podobne miejsce).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Zakres potwierdzony (czy ta funkcja wchodzi teraz)
- [ ] Plan zaakceptowany
- [ ] `GET /api/companies/:id`
- [ ] Ekrany `/companies` i `/companies/:id`
- [ ] lint/test + commit

## Sesja 11 — Voucher jako pole tekstowe (placeholder, bez uploadu pliku)

Kontekst: `CLAUDE.md` dopuszcza wprost, żeby na start voucher/QR był "polem
tekstowym/placeholderem" zamiast realnego uploadu. Kolumna `voucherFileUrl` już istnieje
w schemacie, ale nigdzie nie jest ustawiana ani wyświetlana.

Prompt (skróć/dostosuj):
> Dodaj w formularzu karnetu (`CardForm.tsx`) opcjonalne pole tekstowe na treść/link
> vouchera, zapisywane do istniejącej kolumny `voucherFileUrl` (bez uploadu pliku, bez
> object storage — to świadomie odłożone, patrz `CLAUDE.md`). Wyświetl tę wartość w
> widoku szczegółów karnetu (`cards/[id]/page.tsx`), jeśli jest ustawiona. Dodaj brakujące
> klucze w słowniku i18n (PL/EN), zgodnie z tonem z `docs/user/faq.md`.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Pole vouchera w formularzu + zapis do API
- [ ] Wyświetlenie w szczegółach karnetu
- [ ] i18n uzupełnione
- [ ] lint/test + commit

## Sesja 12 — Ulubieni partnerzy (favorites)

Kontekst: `CLAUDE.md` wprost stawia to na liście "może wejść w kolejnym kroku, nie
blokuje MVP". Model `Favorite` już istnieje w schemacie, ale bez tego jest martwym kodem.
**Zależy od Sesji 10** (potrzebny ekran listy firm, żeby było gdzie pokazać gwiazdkę).

Prompt (skróć/dostosuj):
> Dodaj `POST /api/companies/favorites/:id` i `DELETE /api/companies/favorites/:id` wg
> `docs/API.md`, oparte o zweryfikowany `deviceId` (ADR-007, ten sam mechanizm co
> `/api/cards`). Dodaj przycisk/gwiazdkę ulubionych na ekranie `/companies` (Sesja 10),
> analogicznie do `star-btn` w prototypie. Rozważ też opcjonalny filtr
> `GET /api/companies?favorites=true`, jeśli lista firm ma pokazywać ulubione osobno.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Sesja 10 ukończona (wymagana zależność)
- [x] Plan zaakceptowany
- [x] Endpointy favorites
- [x] Gwiazdka w UI listy firm
- [x] lint/test + commit

## Sesja 13 — Testy e2e (Playwright)

Kontekst: `docs/TESTING.md` zakłada testy jednostkowe + integracyjne (już są, Vitest) +
e2e (Playwright) dla kluczowych ścieżek z prototypu. Playwright nie jest jeszcze
zależnością projektu — nowy pakiet, więc przy dodawaniu sprawdzić (zgodnie z regułą z
`CLAUDE.md`), że jest aktywnie utrzymywany, zanim wejdzie do `package.json`.

Prompt (skróć/dostosuj):
> Skonfiguruj Playwright wg `docs/TESTING.md`. Napisz testy e2e dla ścieżek wymienionych w
> tym dokumencie, które są już zaimplementowane: (1) dodanie karnetu przez kreator/formularz
> (firma istniejąca), (2) zalogowanie wejścia i aktualizacja licznika, (3) edycja i
> usunięcie wejścia z historii, (4) edycja daty ważności, w tym wyczyszczenie jej dla
> karnetu typu `limit`, (5) usunięcie karnetu — dialog potwierdzający, anulowanie nie
> usuwa danych, (6) karnet znika z listy głównej i trafia do widoku archiwum po
> wyczerpaniu limitu/dacie ważności (patrz Sesja 9), (7) przełączenie PL/EN i trybu
> ciemnego. Pomiń na razie punkty dotyczące Google Maps (nie zaimplementowane, ADR-004).
> Baza testowa odizolowana od dev, resetowana przed przebiegiem — zaproponuj podejście,
> zanim zaczniesz pisać testy.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Plan zaakceptowany (w tym: nowa zależność sprawdzona pod kątem utrzymania/CVE)
- [x] Playwright skonfigurowany, baza testowa izolowana
- [x] Testy z listy wyżej napisane i przechodzą
- [x] commit

## Sesja 14 — Logowanie/synchronizacja konta (NextAuth) — wymaga decyzji przed startem

Kontekst: `ADR-003` zakłada auth token-based (JWT, nie cookie sesyjne) jako *nadbudowę*
nad trybem bez konta, `API.md` opisuje `/api/auth/sign-in` (np. magic link/OAuth) i
`/api/auth/link-device`. Obecnie nie ma żadnego z tego — `next-auth` nawet nie jest
zainstalowany, `NEXTAUTH_SECRET` w `.env.example` jest niewykorzystany.

**Nie odpalaj tej sesji bez wcześniejszej odpowiedzi na poniższe — to rzeczy "do
pytania, nie zgadywania" wg `CLAUDE.md`:**
- Metoda logowania: magic link e-mail (wymaga dostawcy wysyłki maili — Resend/Postmark/
  inny) czy OAuth (Google?) — czy oba?
- Jeśli magic link: jaki dostawca e-mail i czy masz już do niego klucz API?
- Docelowa domena produkcyjna (potrzebna do `NEXTAUTH_URL` i konfiguracji OAuth redirect)

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Dodaj logowanie przez [ustalona metoda] z użyciem Auth.js/NextAuth, zgodnie z
> `ADR-003` (token-based, nie cookie sesyjne — pod kątem przyszłego mobile) i
> `docs/API.md`. Dodaj `POST /api/auth/link-device`: weryfikuje istniejący podpisany
> token urządzenia (ADR-007), wyciąga zaufany `deviceId` i przypina powiązane karnety do
> zalogowanego konta (`userId = ...`, `deviceId = null`) — nie dotykaj kart innych
> urządzeń. Zaloguj, jeśli reguła "konto zawsze opcjonalne" (CLAUDE.md) jest gdziekolwiek
> zagrożona tym API.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Decyzje z listy wyżej podjęte i potwierdzone (Google OAuth, brak domeny produkcyjnej
      na razie, klucze Google dostarczy właściciel projektu później)
- [x] Plan zaakceptowany
- [x] Logowanie + `/api/auth/link-device`
- [x] Zweryfikowane: żadna funkcja rdzeniowa nadal nie wymaga logowania
- [x] lint/test + commit

## Sesja 15 — Logo w headerze prowadzi do strony głównej

Kontekst: `Header.tsx` renderuje logo (kropka + nazwa marki) jako statyczny `<span>`, bez
linku — kliknięcie nic nie robi.

Prompt (skróć/dostosuj):
> W `Header.tsx` opakuj logo (kropkę + nazwę marki) w link do strony głównej (`/`, która
> i tak przekierowuje do `/cards` — `src/app/page.tsx`). Zachowaj dotychczasowy wygląd,
> dodaj tylko sensowny `aria-label`/`title` jeśli potrzebne dla dostępności.

- [x] Logo klikalne, wraca na `/`
- [x] lint/test + commit

## Sesja 16 — Własne kategorie firm dodawane przez użytkowników

Kontekst: `CompanyCategory` jest obecnie enumem Prisma o ustalonych 5 wartościach
(`gym`, `pool`, `group_classes`, `massage`, `beauty`), zgodnym z `DATABASE.md` —
kategoria "determinuje styl (sport/relax) i ikonę" (`ARCHITECTURE.md`). Umożliwienie
użytkownikom dodawania własnych kategorii to **zmiana modelu danych**, nie tylko UI
(enum → coś bardziej otwartego, np. tabela `categories`), więc zanim odpalisz tę sesję,
rozstrzygnij (zasada "nie zgaduj" z `CLAUDE.md`):

- Czy własna kategoria jest prywatna dla urządzenia, czy widoczna globalnie (tak jak
  `companies` są dziś współdzielone między urządzeniami)?
- Czy przy tworzeniu własnej kategorii użytkownik wybiera styl/kolor/ikonę ręcznie, czy
  nowa kategoria dostaje zawsze domyślny wygląd?
- Czy 5 obecnych kategorii zostaje jako "systemowe" obok kategorii użytkownika, czy
  wszystko przechodzi na w pełni dynamiczny model bez rozróżnienia?

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Zamień enum `CompanyCategory` na tabelę `categories` w Prisma (pola: `id`, `name`,
> reprezentacja stylu/koloru [ustalona wyżej], `createdByDeviceId` nullable — na wzór
> `companies.createdByUserId`), z danymi początkowymi (seed) dla 5 obecnych kategorii
> jako [ustalone: systemowe/zwykłe]. Dodaj `POST /api/categories` do tworzenia własnej
> kategorii (autoryzacja jak w `/api/companies` — zweryfikowany device token, ADR-007) i
> `GET /api/categories`. Zaktualizuj `CardForm.tsx`, słownik i18n oraz każde miejsce
> hardkodujące dotychczasowy enum. Zaktualizuj też `docs/DATABASE.md` i
> `docs/ARCHITECTURE.md` opisem tej zmiany w tym samym kroku (`CLAUDE.md`: przy większych
> zmianach architektonicznych aktualizować odpowiedni plik w `docs/`).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Decyzje z listy wyżej podjęte
- [ ] Plan zaakceptowany
- [ ] Migracja `categories` + seed danych systemowych
- [ ] `POST`/`GET /api/categories`
- [ ] UI i i18n zaktualizowane
- [ ] `docs/DATABASE.md` i `docs/ARCHITECTURE.md` zaktualizowane
- [ ] lint/test + commit

## Sesja 17 — Widok dostosowany do przeglądarek mobilnych (Android/iOS)

Kontekst: to **nie** jest natywna aplikacja mobilna ani PWA (`MOBILE_ROADMAP.md` — to
nadal poza zakresem) — chodzi o to, żeby istniejąca wersja webowa dobrze działała w
przeglądarce na telefonie (Safari iOS, Chrome Android). Layout nie był jeszcze
systematycznie sprawdzony pod kątem wąskich ekranów.

Prompt (skróć/dostosuj):
> Przejrzyj i dostosuj layout aplikacji (Header, lista karnetów, formularz karnetu,
> formularz wejścia, dialogi potwierdzenia) pod kątem wąskich ekranów telefonów (od ok.
> 375px szerokości wzwyż). Sprawdź: rozmiar obszarów klikalnych na przyciskach (min.
> ok. 44px, wytyczne dostępności dotykowej), zachowanie pól `select`/`date`/`number` na
> mobilnym Safari i Chrome, brak poziomego przewijania strony, czytelność w trybie
> ciemnym na małym ekranie. Zweryfikuj w przeglądarce z emulacją mobilną (np. viewport
> 375×812) w jasnym i ciemnym motywie.
> Najpierw krótki plan (które ekrany/komponenty wymagają zmian), poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Ekrany dostosowane, zweryfikowane przy szerokości ~375px
- [ ] Sprawdzone w jasnym i ciemnym motywie
- [ ] lint/test + commit

## Sesja 18 — Aktualizacja Next.js (CVE w postcss/sharp)

Kontekst: `npm audit` w `app/` zgłasza 3 podatności wysokiego ryzyka — PostCSS (XSS przez
nieescapowany `</style>`, arbitrary file read przez `sourceMappingURL` — kilka GHSA) i
sharp (CVE-2026-33327/33328/35590/35591, dziedziczone z libvips) — wciągnięte tranzytywnie
przez obecną wersję `next` (`16.2.12`, `node_modules/next/node_modules/postcss` i
`node_modules/sharp`). `npm audit fix --force` proponuje `next@16.3.0`, co wykracza poza
obecny zakres semver w `package.json`, więc to świadoma aktualizacja, nie automatyczny fix.
Zauważone przy okazji Sesji 13 (konfiguracja Playwrighta), poza jej zakresem.

Prompt (skróć/dostosuj):
> Sprawdź release notes Next.js 16.3.0 pod kątem breaking changes względem 16.2.12.
> Zaktualizuj `next` w `app/package.json`, `npm install`, potem `npm run lint`,
> `npm run test`, `npm run test:e2e` i `npm run build` — zaraportuj wynik. Zwróć uwagę,
> czy `next-intl` (`^4.13.5`) i `@prisma/adapter-pg` nie wymagają dociągnięcia razem z tą
> zmianą. Po aktualizacji uruchom `npm audit` ponownie i potwierdź, że te 3 podatności
> zniknęły. Nie dotykaj kodu biznesowego — tylko wersja zależności i ewentualne
> dostosowania wynikające z upgrade'u.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany (breaking changes 16.2→16.3 sprawdzone)
- [ ] `next` zaktualizowany, `npm install`
- [ ] `npm audit` czysty (3 podatności zniknęły)
- [ ] lint/test/test:e2e/build przechodzą + commit

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
