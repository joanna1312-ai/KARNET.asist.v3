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
- [x] Logowanie Google (Auth.js/NextAuth)
- [x] Zweryfikowane: żadna funkcja rdzeniowa nadal nie wymaga logowania
- [x] lint/test + commit

Dodatkowo, w dwóch kolejnych poprawkach po ręcznym teście logowania end-to-end (poza
pierwotnym opisem sesji):

1. `GET/PATCH/DELETE /api/cards*` filtrowały karnety wyłącznie po `deviceId`, więc po
   zalogowaniu karnety całkiem znikały z widoku. Pierwsza poprawka wprowadziła
   `POST /api/auth/link-device` + filtr `deviceId LUB userId`.
2. Po dalszym teście okazało się, że to złe rozwiązanie: pokazywało zalogowanemu też
   surowe dane urządzenia, a nowe karnety i tak zawsze zapisywało pod `deviceId` — czyli
   dane dodane w trakcie bycia zalogowanym i tak zostawały widoczne po wylogowaniu.
   **Finalna wersja:** konto i urządzenie to trwale rozłączne przestrzenie danych, bez
   żadnego mostu — `link-device` usunięty całkowicie, `ownerFilter` używa `userId`, jeśli
   sesja jest obecna (ignorując token urządzenia), w przeciwnym razie `deviceId`; nowy
   karnet zapisywany pod tożsamością, z której się czyta (`src/server/caller-identity.ts`,
   `src/server/card-owner.ts`). Dodany stały pasek `GuestNotice.tsx` informujący
   niezalogowanego, że jego dane są zapisane tylko na tym urządzeniu. Zweryfikowane
   bezpośrednio przez API z realną sesją (nie tylko testami jednostkowymi).

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

- [x] Decyzje z listy wyżej podjęte (kategoria prywatna per urządzenie; kolor z gotowej
      palety; 5 obecnych kategorii jako systemowe obok kategorii użytkownika)
- [x] Plan zaakceptowany
- [x] Migracja `categories` + seed danych systemowych
- [x] `POST`/`GET /api/categories`
- [x] UI i i18n zaktualizowane
- [x] `docs/DATABASE.md` i `docs/ARCHITECTURE.md` zaktualizowane (też `docs/API.md`)
- [x] lint/test + commit

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

- [x] Plan zaakceptowany
- [x] Ekrany dostosowane, zweryfikowane przy szerokości ~375px
- [x] Sprawdzone w jasnym i ciemnym motywie
- [x] lint/test + commit

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

> Uwaga: `package.json` już pokazuje `"next": "16.3.0"` i jest commit
> "Sesja 18: aktualizacja Next.js 16.2.12 -> 16.3.0 (CVE w postcss/sharp)" w historii
> gita — najpewniej ukończone, tylko checklista wyżej nie została odhaczona. Potwierdź
> `npm audit` przed odhaczeniem, zamiast zakładać.

---

## Kolejne sesje — drobne poprawki do MVP (Sesje 19–23)

Kontekst całej grupy: to dopięcie MVP o rzeczy z listy użytkownika (ustawienia,
filtrowanie firm, grupowanie karnetów, pomoc, stopka). Sesje związane ze zmianami
graficznymi (4 warianty kolorystyczne, logo, ikony) zostały wydzielone na sam koniec jako
**Faza V5** — mają inny charakter pracy (branding/design, nie tylko logika UI) i nie
blokują reszty MVP.

## Sesja 19 — Panel ustawień (ikona koła zębatego): język + tryb ciemny

Kontekst: dziś `LocaleToggle.tsx` i `ThemeToggle.tsx` to dwie osobne kontrolki w
`Header.tsx`, obok `AccountMenu.tsx`. Zebranie ich pod jedną ikoną koła zębatego robi też
miejsce na przyszły wybór wariantu kolorystycznego (Sesja V5.2, na końcu tego pliku) bez
zaśmiecania nagłówka kolejnymi przyciskami. `AccountMenu` (logowanie) zostaje osobno — to
nie jest "ustawienie wyglądu".

Prompt (skróć/dostosuj):
> W `Header.tsx` zastąp osobno wyrenderowane `LocaleToggle` i `ThemeToggle` jednym
> przyciskiem z ikoną koła zębatego, otwierającym panel/dropdown ustawień (nowy komponent
> `SettingsMenu.tsx`, wzorowany na sposobie otwierania/zamykania z `AccountMenu.tsx` —
> klik poza obszarem, klawisz Escape). W panelu: sekcja "Język" (logika z
> `LocaleToggle.tsx`) i sekcja "Tryb" (logika z `ThemeToggle.tsx`) — przenieś/zaimportuj tę
> logikę, nie duplikuj jej. Dodaj brakujące klucze i18n (PL/EN) na przycisk ustawień i
> nagłówki sekcji. Zachowaj min. 44px obszaru klikalnego (konwencja z Sesji 17).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] `SettingsMenu.tsx` z sekcjami Język / Tryb ciemny
- [ ] `Header.tsx` zaktualizowany, brak duplikacji starych kontrolek
- [ ] i18n uzupełnione
- [ ] lint/test + commit

## Sesja 20 — Firmy: filtr i sortowanie

Kontekst: `/companies` (`src/app/companies/page.tsx`) dziś pokazuje pełną listę firm bez
możliwości filtrowania czy sortowania — `GET /api/companies` już zwraca wszystko na raz,
więc to zmiana czysto po stronie klienta.

Prompt (skróć/dostosuj):
> Na `/companies` dodaj pole tekstowe do filtrowania po nazwie firmy oraz select do
> filtrowania po kategorii (kategorie już dostępne w pobranych danych — `company.category`).
> Dodaj przełącznik sortowania: alfabetycznie po nazwie / po kategorii. Filtrowanie i
> sortowanie po stronie klienta, bez zmian w API. Zachowaj istniejące ulubione/gwiazdki i
> link do `/companies/:id`. Dodaj klucze i18n (PL/EN) na etykiety filtra/sortowania oraz
> osobny pusty stan "brak wyników dla filtra" (odróżnij od istniejącego `emptyState` = brak
> firm w ogóle).
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Plan zaakceptowany
- [x] Filtr po nazwie i kategorii
- [x] Sortowanie po nazwie i kategorii
- [x] i18n uzupełnione (w tym osobny pusty stan dla filtra)
- [x] lint/test + commit

## Sesja 21 — Ekran główny: grupowanie karnetów po kategorii

Kontekst: `/cards` (`src/app/cards/page.tsx`) renderuje dziś płaską listę karnetów.
Kategoria firmy jest już dostępna na każdym karnecie (`card.company.category`), a
`categoryDisplayName`/`CATEGORY_COLOR_CLASS` z `@/lib/category-display` są już używane w
analogiczny sposób na `/companies`.

Prompt (skróć/dostosuj):
> Zmień renderowanie listy karnetów na `/cards`, żeby grupować je po kategorii firmy —
> nagłówek sekcji z nazwą kategorii i kropką jej koloru (jak na `/companies`), karnety pod
> spodem w dotychczasowej kolejności. Zachowaj bez zmian zakładki Aktywne/Archiwum oraz
> przyciski edycji/odnowienia/usunięcia i logikę statusów — to wyłącznie zmiana układu
> listy. Kategoria bez karnetów w bieżącej zakładce nie powinna się w ogóle pokazywać.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Plan zaakceptowany
- [x] Lista karnetów grupowana po kategorii, z nagłówkami sekcji
- [x] Zakładki Aktywne/Archiwum i akcje na karnetach działają bez zmian
- [x] lint/test + commit

## Sesja 22 — Ekran główny: pomoc (ikona + instrukcja obsługi)

Kontekst: `v3_paczka_dok/v2/docs/user/getting-started.md` i `faq.md` już istnieją jako
treść źródłowa (to samo źródło tonu, którym kierowała się Sesja 6), ale nic w UI do nich
nie odsyła.

Prompt (skróć/dostosuj):
> Dodaj ikonę pomocy ("?") w `Header.tsx`, obok panelu ustawień z Sesji 19, otwierającą
> modal/panel z instrukcją obsługi aplikacji. Oprzyj treść na
> `v3_paczka_dok/v2/docs/user/getting-started.md` i `faq.md` — przenieś kluczowe punkty
> (nie kopiuj całych dokumentów 1:1) do słownika i18n (PL/EN), tonem rzeczowym i ciepłym,
> bez żargonu i emoji. Użyj tego samego wzorca modala co `ConfirmDialog.tsx` (zamykanie
> Escape, klik poza obszarem).
> Najpierw krótki plan (struktura treści pomocy — sekcje), poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Ikona pomocy w nagłówku
- [ ] Modal z instrukcją, treść w i18n PL/EN
- [ ] lint/test + commit

## Sesja 23 — Stopka: autorzy aplikacji i dane kontaktowe — wymaga danych przed startem

Kontekst: `layout.tsx` dziś nie renderuje żadnej stopki. Zanim odpalisz tę sesję,
przygotuj treść (żeby Claude Code nie wymyślało danych kontaktowych):
- Nazwa autora/zespołu do wyświetlenia
- Adres e-mail kontaktowy (i ew. inne kanały)
- Czy ma się pojawić numer wersji aplikacji / rok

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Dodaj komponent `Footer.tsx`, renderowany w `layout.tsx` pod `{children}` (globalnie na
> każdej stronie). Zawiera: ikonę — jeśli Sesja V5.1 (logo/ikony, na końcu tego pliku) jest
> już zrobiona, użyj tamtej identyfikacji wizualnej; jeśli nie, zostaw dzisiejszą
> kropkę/nazwę marki z `Header.tsx` — oraz informację o autorach/zespole aplikacji z
> danymi kontaktowymi: [dane ustalone wyżej].
> Teksty przez i18n (PL/EN). Zachowaj spójność z resztą UI (te same tokeny kolorów, dark
> mode, mobile z Sesji 17).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Treść i dane kontaktowe ustalone
- [ ] Plan zaakceptowany
- [ ] `Footer.tsx` w layout, widoczny na każdej stronie
- [ ] i18n uzupełnione, dark mode / mobile sprawdzone
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

---

## Faza V4 — po MVP (większe zmiany architektoniczne)

Uwaga: to osobny etap, odpalany po ukończeniu i wdrożeniu MVP (Sesje 19–23 wyżej + checklista
"Przed pierwszym wdrożeniem produkcyjnym"), nie ciąg dalszy tej samej numeracji. Każda z tych
sesji dotyka albo modelu danych, albo nowej integracji zewnętrznej (koszt, klucz API,
zewnętrzna zależność) — większe ryzyko niż kosmetyczne zmiany wyżej. Nowe zmienne
środowiskowe, które się pojawią w tej fazie: ewentualny klucz dostawcy e-mail (V4.1),
`GOOGLE_MAPS_API_KEY` (już w `.env.example`, dziś nieużywany — V4.2), `GROQ_API_KEY` (V4.3),
`STORAGE_BUCKET_URL`/`STORAGE_ACCESS_KEY` (już w `.env.example`, dziś nieużywane — V4.4).

## Sesja V4.1 — Logowanie: dodatkowe metody (hasło i/lub magic link) — wymaga decyzji przed startem

Kontekst: dziś jedyna metoda logowania to Google OAuth (Sesja 14, `ADR-003`), skonfigurowana
przez Auth.js/NextAuth (`src/server/auth.ts`). Konto pozostaje **zawsze opcjonalne** — to
architektoniczny fundament apki (patrz poprawki opisane przy Sesji 14: konto i tryb bez
konta to trwale rozłączne przestrzenie danych), nie tylko sugestia do zachowania.

Do wyboru, w kolejności rosnącej złożoności:
1. **Login + hasło (Credentials provider w NextAuth)** — nie wymaga żadnej zewnętrznej
   usługi/API, najszybsze do wdrożenia. Wymaga hashowania haseł (bcrypt/argon2), ekranu
   rejestracji, resetu hasła (reset z kolei wymaga wysyłki e-maili — patrz punkt 2). Najlepiej
   pasuje do celu "użytkownik rozwija profil o dodatkowe pola" — masz już tabelę `User`
   (Prisma) do rozbudowy.
2. **Magic link (e-mail bez hasła)** — wygodniejsze, ale wymaga dostawcy wysyłki e-mail
   (Resend/Postmark/SES) i klucza API, czyli nowej zależności zewnętrznej i kosztu.
3. **Oba naraz** — najwięcej pracy, ale daje użytkownikowi wybór.

Rekomendacja: login + hasło jako pierwszy krok (zero nowych zależności zewnętrznych,
najmniejsze ryzyko), magic link jako osobna sesja później, jeśli faktycznie potrzebny. To
jednak decyzja produktowa — potwierdź przed uruchomieniem sesji:
- Którą metodę(y) wdrażamy teraz?
- Jeśli magic link: który dostawca e-mail i czy masz już klucz API?
- Jakie dodatkowe pola profilu użytkownika mają się pojawić od razu (imię, telefon,
  preferencje), a jakie mogą poczekać na osobną sesję?

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Dodaj [ustalona metoda] logowania obok istniejącego Google OAuth, przez NextAuth
> (`src/server/auth.ts`), zgodnie z `ADR-003` (konto zawsze opcjonalne — zweryfikuj, że
> żadna funkcja rdzeniowa dalej nie wymaga logowania) i
> `v3_paczka_dok/v2/docs/API.md`. [Jeśli hasło:] rozszerz model `User` w Prisma o pole na
> hash hasła, dodaj ekran rejestracji/logowania e-mail+hasło, hashowanie przez
> bcrypt/argon2 (sprawdź aktywne utrzymanie paczki przed dodaniem do `package.json` —
> zasada z Sesji 13). [Jeśli magic link:] skonfiguruj Email provider NextAuth z [dostawca],
> dodaj zmienną w `.env.example` na klucz API. Rozszerz `User` o pola profilu: [ustalona
> lista]. Zaktualizuj `docs/ARCHITECTURE.md`/`docs/DATABASE.md` o opis zmiany (konwencja z
> Sesji 16).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Metoda(y) logowania i pola profilu ustalone
- [ ] Plan zaakceptowany
- [ ] Nowa metoda logowania działa obok Google OAuth
- [ ] Zweryfikowane: konto nadal w pełni opcjonalne, przestrzenie danych nadal rozłączne
- [ ] `docs/` zaktualizowane
- [ ] lint/test + commit

## Sesja V4.2 — Integracja Google Maps/Places (ADR-004)

Kontekst: `ADR-004` świadomie odkłada to do etapu produkcyjnego — ten etap właśnie się
zaczyna. `GOOGLE_MAPS_API_KEY` już istnieje w `.env.example`, ale nieużywany. Dziś dodawanie
nowej firmy to czyste pole tekstowe (`CardForm.tsx`, tryb `companyMode: "new"`), bez
wyszukiwania czy mapy.

Przed startem: załóż projekt w Google Cloud, włącz Maps JavaScript API + Places API, ustaw
limit budżetu (patrz checklista "Przed pierwszym wdrożeniem produkcyjnym" wyżej w tym
pliku) i pobierz klucz.

Prompt (skróć/dostosuj):
> Zaimplementuj wyszukiwanie firmy przez Google Places API w `CardForm.tsx` (tryb dodawania
> nowej firmy) — autouzupełnianie nazwy + zapis lokalizacji (`lat`/`lng`, kolumny już
> istnieją w `companies`, patrz `docs/DATABASE.md`). Dodaj mapę (Google Maps JavaScript API)
> na `/companies/:id` pokazującą lokalizację firmy. Klucz API ograniczony do domeny w
> konsoli Google Cloud (to ustawiasz Ty, nie kod) — żadnych innych sekretów w
> `NEXT_PUBLIC_*`. Zaktualizuj `docs/ARCHITECTURE.md` (usuń notę, że to zaślepione) i status
> `ADR-004` w `docs/DECISIONS.md` na "potwierdzone".
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Projekt Google Cloud + limit budżetu + klucz ograniczony do domeny
- [ ] Plan zaakceptowany
- [ ] Autouzupełnianie firmy (Places) w `CardForm.tsx`
- [ ] Mapa lokalizacji na `/companies/:id`
- [ ] `docs/DECISIONS.md`/`ARCHITECTURE.md` zaktualizowane
- [ ] lint/test + commit

## Sesja V4.3 — Integracja Groq AI — wymaga decyzji przed startem

Uwaga terminologiczna: zakładam, że chodzi o **Groq** (szybkie API do inferencji modeli
językowych), nie o inną markę o podobnej nazwie — popraw, jeśli chodziło o coś innego.

Kontekst: to nowa zależność zewnętrzna (koszt, klucz API, ryzyko halucynacji modelu) —
zanim wejdzie do kodu, potrzebny konkretny przypadek użycia, samo "połączenie z AI" nic nie
robi. `ADR-005` wprost wyklucza OCR ze zdjęcia z zakresu MVP — AI do rozpoznawania
voucherów/zdjęć byłoby świadomym rozszerzeniem tego zakresu, nie czymś do przemycenia przy
okazji tej sesji.

Propozycje konkretnych zastosowań (wybierz jedno na sesję, nie wszystkie naraz):
1. **Chatbot pomocy** — odpowiada na pytania użytkownika na bazie `faq.md`/
   `getting-started.md`, jako rozszerzenie statycznego modala z Sesji 22.
2. **Sugestia kategorii przy dodawaniu firmy** — użytkownik wpisuje nazwę firmy, AI
   proponuje najbardziej pasującą kategorię z listy (systemowej + własnych, Sesja 16).
3. **Krótkie podsumowanie przy karnecie ze statusem `urgent`** — np. wygenerowany tekst
   "kończy się za X dni, historycznie wykorzystujesz Y wejść/tydzień".

Przed startem potwierdź: który przypadek użycia, i czy masz już klucz API Groq.

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Dodaj integrację z Groq API dla przypadku: [ustalony]. Wywołania wyłącznie po stronie
> serwera (nowy endpoint w `src/app/api/`, klucz `GROQ_API_KEY` tylko w zmiennych
> serwerowych, nigdy `NEXT_PUBLIC_*`). Obsłuż błędy/timeout API tak, żeby brak odpowiedzi AI
> nigdy nie blokował podstawowej funkcji (np. dodania firmy) — to zawsze ulepszenie, nigdy
> wymóg. Dodaj `GROQ_API_KEY` do `.env.example` (pusta wartość) i opisz w `docs/SETUP.md`.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Przypadek użycia i klucz API ustalone
- [ ] Plan zaakceptowany
- [ ] Integracja działa, degraduje się łagodnie przy błędzie API
- [ ] `.env.example`/`docs/SETUP.md` zaktualizowane
- [ ] lint/test + commit

## Sesja V4.4 — Prawdziwy upload plików/zdjęć voucherów (object storage) — wymaga decyzji przed startem

Kontekst: Sesja 11 świadomie wprowadziła `voucherFileUrl` jako zwykłe pole tekstowe
(treść/link), bez uploadu pliku — `docs/DATABASE.md` i `CLAUDE.md` wprost mówią, że to
tymczasowe, docelowo plik w object storage. Podpowiedź w UI (`voucherFileUrlHint`,
`messages/pl.json`/`en.json`) już dziś zapowiada użytkownikowi "dołączanie pliku/zdjęcia
planujemy w kolejnej wersji" — to ta sesja. `.env.example` ma już (nieużywane)
`STORAGE_BUCKET_URL`/`STORAGE_ACCESS_KEY`. `docs/DECISIONS.md` (sekcja RODO) już dziś
oznacza plik vouchera jako potencjalnie zawierający dane osobowe (imię/nazwisko na
voucherze, numer karty klubowej) — wymaga to DPA z dostawcą storage (patrz checklista
"Przed pierwszym wdrożeniem produkcyjnym" wyżej w tym pliku).

**Dostawca ustalony: Supabase Storage.** Spójne z resztą projektu — `docker-compose.yml`
(komentarz przy usłudze `db`) już dziś zakłada, że produkcja celuje w Supabase, więc storage
w tym samym miejscu co baza to jeden dostawca/jedna umowa DPA zamiast dwóch. Supabase
Storage jest S3-compatible, więc nadal pasuje pod istniejące `STORAGE_BUCKET_URL`/
`STORAGE_ACCESS_KEY` w `.env.example` — do uzupełnienia realnymi wartościami z projektu
Supabase przed startem sesji (URL projektu + `service_role` key do operacji zapisu po
stronie serwera, nigdy jako `NEXT_PUBLIC_*`).

Pozostałe kwestie do rozstrzygnięcia przed startem:
- Bucket prywatny z podpisanymi, wygasającymi URL-ami do wyświetlania (bezpieczniejsze, bo
  dane mogą być wrażliwe — rekomendacja, Supabase Storage wspiera to natywnie przez signed
  URLs), czy publiczny bucket z trwałymi linkami (prostsze, ale bez kontroli dostępu)?
- Dozwolone typy plików (zdjęcie: JPG/PNG/WebP, czy też PDF?) i maksymalny rozmiar pliku?
- Czy pole tekstowe (treść/link) z Sesji 11 zostaje jako alternatywa dla uploadu (np. ktoś
  ma tylko kod rabatowy, nie plik), czy upload całkowicie je zastępuje?

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Dodaj prawdziwy upload pliku/zdjęcia vouchera w `CardForm.tsx`, zapisywany w Supabase
> Storage (klient Supabase JS lub S3-compatible SDK — wybierz, co lepiej pasuje do już
> używanych zależności w projekcie), zgodnie z `STORAGE_BUCKET_URL`/`STORAGE_ACCESS_KEY` z
> `.env.example` (uzupełnij tam realne zmienne, jeśli brakuje; `service_role` key tylko po
> stronie serwera). Nowy endpoint serwerowy do uploadu (np.
> `POST /api/cards/:id/voucher-file`), autoryzowany tak samo jak reszta `/api/cards/*`
> (zweryfikowany właściciel karnetu — `deviceId`/`userId`, ADR-007/ADR-003), walidujący typ
> pliku i rozmiar: [ustalone wyżej]. Bucket [prywatny z podpisanymi URL / publiczny —
> ustalone wyżej]. Zapisz wynikowy URL/ścieżkę w istniejącej kolumnie `voucherFileUrl` — nie
> zmieniaj jej typu, jeśli się da tego uniknąć. [Jeśli pole tekstowe zostaje:] pozwól
> użytkownikowi wybrać w formularzu: wklej link/tekst albo wgraj plik, nie oba naraz.
> Wyświetl podgląd (miniaturkę dla obrazu, link dla PDF) w `cards/[id]/page.tsx`. Zaktualizuj
> `docs/DATABASE.md`, `docs/API.md` i `docs/SETUP.md` (konwencja z Sesji 16) oraz
> usuń/zaktualizuj `voucherFileUrlHint` w i18n, żeby nie zapowiadał już czegoś, co właśnie
> wdrożono.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Dostawca: Supabase Storage
- [ ] Tryb bucketa, dozwolone typy/rozmiar i los pola tekstowego ustalone
- [ ] Konto Supabase Storage: bucket założony, `STORAGE_BUCKET_URL`/`STORAGE_ACCESS_KEY`
      uzupełnione realnymi wartościami
- [ ] Plan zaakceptowany
- [ ] Upload pliku działa, zapisany w Supabase Storage, autoryzacja jak reszta `/api/cards`
- [ ] Podgląd pliku w `cards/[id]/page.tsx`
- [ ] `docs/` i i18n zaktualizowane (w tym `voucherFileUrlHint`)
- [ ] DPA z Supabase (storage) — dopisane/zweryfikowane w checkliście "Przed pierwszym
      wdrożeniem produkcyjnym"
- [ ] lint/test + commit

---

## Faza V5 — grafika i identyfikacja wizualna

Uwaga: odpalana na samym końcu, po MVP (Sesje 19–23) i po Fazie V4 — świadomie na końcu, bo
to praca projektowa (branding/design), nie logika aplikacji, i nic w MVP ani w V4 od niej
technicznie nie zależy (Sesja 19 — panel ustawień — zostawia tylko miejsce w UI na
przełącznik wariantu, nie wymaga, żeby warianty już istniały). Jeśli po drodze zdecydujesz
się zrobić to wcześniej, śmiało zmień kolejność — nic w pozostałych sesjach na to nie
czeka.

## Sesja V5.1 — Kierunek graficzny: 4 warianty (neutral/women/men/child) + logo + ikony — wymaga decyzji przed startem

Kontekst: to zadanie projektowe (branding), nie tylko kod. Claude Code nie generuje
grafiki rastrowej/ilustracji — dobrze koduje natomiast system tokenów kolorystycznych (na
wzór istniejącego `--mint`/`--coral`/`--accent` w `globals.css`) oraz logo/ikony jako SVG w
płaskim, geometrycznym stylu spójnym z resztą UI. Bogatsza grafika ilustracyjna (postacie,
sceny) wymaga grafika/designera albo osobnego narzędzia do generowania obrazów — to poza
tym, co kodujący agent zrobi sam.

Zanim odpalisz tę sesję, rozstrzygnij (żeby Claude Code nie zgadywało brandingu):
- Czym różnią się 4 warianty — tylko paletą barw (odcienie tego samego mint/coral/accent,
  cieplejsze/chłodniejsze, bardziej stonowane dla "neutral"), czy też kształtem elementów
  UI (np. bardziej zaokrąglone rogi dla "child")?
- Czy warianty mają nazwy widoczne dla użytkownika ("Neutralny"/"Kobiecy"/"Męski"/
  "Dziecięcy"), czy mają być czysto wizualne, bez etykiet sugerujących płeć wprost?
- Styl logo: rozwinięcie dzisiejszej kropki/plamy w symbol, czy inicjał/monogram "K"?

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Zaprojektuj i zakoduj w `globals.css` 4 palety kolorystyczne (warianty: neutral, women,
> men, child), analogicznie do istniejącego mechanizmu jasny/ciemny
> (`:root[data-theme="..."]`) — dodaj atrybut `data-variant` z 4 wartościami, każda z
> własnym zestawem `--mint`/`--coral`/`--accent`/`--status-*`. Zachowaj kontrast WCAG AA
> tekstu na `--background` w każdym wariancie, w obu trybach jasny/ciemny (8 kombinacji do
> sprawdzenia). Zaprojektuj logo (SVG) i podstawowy zestaw ikon (favicon/ikona aplikacji,
> ikona pustego stanu listy karnetów) w stylu [ustalonym wyżej] — zapisz jako komponenty w
> `src/components/icons/` lub pliki w `public/`. Nie podłączaj jeszcze przełącznika w UI
> (to Sesja V5.2) — na razie tylko tokeny i assets.
> Najpierw krótki plan (w tym konkretne wartości hex per wariant), poczekaj na akceptację.

- [ ] Decyzje z listy wyżej podjęte
- [ ] Plan (w tym palety hex) zaakceptowany
- [ ] 4 warianty kolorystyczne w `globals.css`, kontrast sprawdzony
- [ ] Logo + ikony jako SVG
- [ ] lint/test + commit

## Sesja V5.2 — Przełącznik wariantu kolorystycznego w panelu ustawień

Kontekst: dowiązanie palet z Sesji V5.1 do UI. **Zależy od Sesji 19** (potrzebny
`SettingsMenu.tsx`) **i Sesji V5.1** (potrzebne gotowe palety/hex).

Prompt (skróć/dostosuj):
> Dodaj sekcję "Wygląd" w `SettingsMenu.tsx` (Sesja 19) z wyborem jednego z 4 wariantów z
> Sesji V5.1. Zapisuj wybór w `localStorage` (klucz np. `variant`), ustawiaj atrybut
> `data-variant` na `<html>` — dodaj inline-script inicjujący wariant przed pierwszym
> renderem (analogicznie do `THEME_INIT_SCRIPT` w `layout.tsx`), żeby uniknąć mignięcia
> domyślnym stylem. Domyślny wariant: neutral. Jeśli warianty z Sesji V5.1 różnią się też
> logo, podmień je w `Header.tsx`/`layout.tsx` zależnie od wybranego wariantu.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Sesje 19 i V5.1 ukończone (wymagane zależności)
- [ ] Plan zaakceptowany
- [ ] Przełącznik wariantu w `SettingsMenu.tsx`
- [ ] `data-variant` + inline init script, brak mignięcia przy ładowaniu
- [ ] lint/test + commit

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
