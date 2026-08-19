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

## Zasady ogólne dla każdej sesji

Obowiązują dla **wszystkich** sesji w tym pliku, niezależnie od fazy — dopisz je raz na
początku rozmowy z Claude Code (albo trzymaj w osobnym prompcie, który wklejasz przed każdą
sesją), zanim wkleisz właściwy prompt danej sesji:

1. **Najpierw zrozumienie, potem plan — dopiero potem kod.** Przed jakimkolwiek działaniem
   Claude Code ma napisać, jak rozumie polecenie i co konkretnie zamierza zrobić (pliki,
   podejście, decyzje, które podejmuje albo o które pyta). To rozszerza już istniejące
   „Najpierw krótki plan" na końcu każdego promptu sesji niżej — potwierdź na głos, że tak
   właśnie rozumiesz zakres, zanim padnie „ok, rób".
2. **Zero działań bez Twojego potwierdzenia.** Claude Code nie zaczyna zmieniać kodu, bazy
   ani plików, dopóki wyraźnie nie potwierdzisz planu z punktu 1. Dotyczy to też sytuacji,
   gdy w trakcie sesji plan się zmienia (np. po odkryciu czegoś w kodzie) — wraca do Ciebie
   z poprawionym planem, zanim ruszy dalej.
3. **Dokumentacja techniczna aktualna na bieżąco.** Jeśli zmiana dotyka czegoś opisanego w
   `docs/` (`DATABASE.md`, `API.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `SETUP.md` itd.) —
   zaktualizuj odpowiedni plik w tej samej sesji, nie później. Jeśli zmiana jest czysto
   kosmetyczna/lokalna i nic w `docs/` jej nie dotyczy, nie trzeba nic dopisywać na siłę.
4. **Pokaż zmianę na żywo pod `http://localhost:3000/`.** Zanim sesja zostanie uznana za
   skończoną, zmiana ma być zweryfikowana w przeglądarce na działającym `npm run dev` (nie
   tylko opisana słownie) — dokładnie tak, jak już zakłada workflow tej fazy
   (patrz [[faza_v4_dev_workflow]] — zawsze lokalna baza, nigdy produkcyjny Supabase).
5. **Kolejność na końcu: lint/test → Twoje potwierdzenie → commit → push.** Najpierw
   `npm run lint` i `npm run test` (i `npm run test:e2e`, jeśli sesja tego dotyczy) mają
   przejść czysto. Dopiero gdy wspólnie potwierdzicie, że wszystko działa poprawnie —
   commit, a potem push na GitHub. Push idzie na **aktualny branch roboczy tej fazy** (np.
   `Faza_V4`, `Faza_v5b` — patrz nagłówek danej fazy w tym pliku), nie bezpośrednio na
   `main`, chyba że dana sesja jest wprost przypisana do pracy na `main`.

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

> Uwaga (zaktualizowane 2026-08-09): Sesja 18 rzeczywiście zaktualizowała `next` do
> `16.3.0` (commit "Sesja 18: aktualizacja Next.js 16.2.12 -> 16.3.0..."), ale **to
> zostało później cofnięte** — commit "Cofnij Next.js do 15.5.23 (backport) -
> niekompatybilnosc 16.x z Vercel": build platform Vercela nie rozpoznawał outputu Next
> 16 przy wdrożeniu ("No framework detected", zero funkcji), patrz `DEPLOYMENT.md`.
> `package.json` obecnie pokazuje `"next": "^15.5.23"` (dist-tag "backport"), nie 16.x —
> ta checklista dotyczy więc stanu przejściowego, nieaktualnego względem produkcji.
> Rewizja do 16.x dopiero gdy wsparcie Vercela dla Next 16 dojrzeje.

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

- [x] Plan zaakceptowany
- [x] Ikona pomocy w nagłówku
- [x] Modal z instrukcją, treść w i18n PL/EN
- [x] lint/test + commit

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

- [x] Treść i dane kontaktowe ustalone
- [x] Plan zaakceptowany
- [x] `Footer.tsx` w layout, widoczny na każdej stronie
- [x] i18n uzupełnione, dark mode / mobile sprawdzone
- [x] lint/test + commit

## Przed pierwszym wdrożeniem produkcyjnym

Checklista z `docs/DEPLOYMENT.md`:

- [ ] Limit/budżet na Google Maps API ustawiony (N/A na razie — Maps jeszcze nie
      podłączone, poza zakresem MVP)
- [x] Automatyczne kopie zapasowe bazy danych — `pg_dump` przez GitHub Actions
      (`.github/workflows/db-backup.yml`), cron 02:00 UTC, szyfrowane AES-256,
      artifact z 30-dniową retencją (Supabase Free nie ma natywnych backupów)
- [ ] Monitoring błędów (np. Sentry) podłączony — **świadomie odłożone do kolejnej
      wersji aplikacji** (decyzja 2026-08-09)
- [ ] Polityka prywatności / regulamin gotowe (aplikacja przetwarza dane osobowe) —
      **świadomie odłożone do kolejnej wersji aplikacji** (decyzja 2026-08-09)
- [ ] Umowy powierzenia danych (DPA) z dostawcami hostingu/bazy/storage —
      **świadomie odłożone do kolejnej wersji aplikacji** (decyzja 2026-08-09)
- [ ] Techniczna możliwość usunięcia konta i danych na żądanie —
      **świadomie odłożone do kolejnej wersji aplikacji** (decyzja 2026-08-09)
- [x] Jeśli Supabase: RLS włączone na wszystkich tabelach z danymi użytkownika,
      przetestowane kluczem `anon` — zweryfikowane bezpośrednio w bazie
      (`relrowsecurity = true` na wszystkich 9 tabelach) i przez REST API
      (`users`/`cards`/`companies` zwracają `200` + pustą listę kluczem anon)
- [x] `service_role` (Supabase) tylko po stronie serwera, nigdy z prefiksem
      `NEXT_PUBLIC_` — aplikacja w ogóle nie używa klucza `service_role`
      (łączy się bezpośrednio przez `DATABASE_URL`)

---

## Faza V4 — po MVP (większe zmiany architektoniczne)

Uwaga: to osobny etap, odpalany po ukończeniu i wdrożeniu MVP (Sesje 19–23 wyżej + checklista
"Przed pierwszym wdrożeniem produkcyjnym"), nie ciąg dalszy tej samej numeracji. Każda z tych
sesji dotyka albo modelu danych, albo nowej integracji zewnętrznej (koszt, klucz API,
zewnętrzna zależność) — większe ryzyko niż kosmetyczne zmiany wyżej. Nowe zmienne
środowiskowe, które się pojawią w tej fazie: `GOOGLE_MAPS_API_KEY` (już w `.env.example`,
dziś nieużywany — V4.1), `GROQ_API_KEY` (V4.2), `STORAGE_BUCKET_URL`/`STORAGE_ACCESS_KEY`
(już w `.env.example`, dziś nieużywane — V4.3).

## Sesja V4.1 — Integracja Google Maps/Places (ADR-004)

Kontekst: `ADR-004` świadomie odkłada to do etapu produkcyjnego — ten etap właśnie się
zaczyna. `GOOGLE_MAPS_API_KEY` już istnieje w `.env.example`, ale nieużywany. Dziś dodawanie
nowej firmy to czyste pole tekstowe (`CardForm.tsx`, tryb `companyMode: "new"`), bez
wyszukiwania czy mapy.

Przed startem: załóż projekt w Google Cloud, włącz Maps JavaScript API + Places API (New),
ustaw limit budżetu (patrz checklista "Przed pierwszym wdrożeniem produkcyjnym" wyżej w tym
pliku) i pobierz klucz. Klucz ograniczony wg interfejsów do dokładnie tych dwóch API (nie
"wszystkie interfejsy Maps Platform") — zrobione 2026-08-09.

**Rozszerzenie zakresu (ustalone 2026-08-09):** oprócz wyszukiwania firmy i mapy jej
lokalizacji, sesja obejmuje też funkcję „firmy najbliżej mnie" na `/companies`. Używa
wbudowanego w przeglądarkę `navigator.geolocation` (darmowe, nie Google Geolocation API), za
zgodą użytkownika — to zawsze ulepszenie, nigdy wymóg: gdy użytkownik odmówi zgody lub
przeglądarka nie wspiera geolokalizacji, `/companies` działa dokładnie tak jak dziś (filtr/
sortowanie z Sesji 20), bez błędu. Ustalone:
- Sortowanie „Najbliżej mnie" to **nowa, trzecia opcja** w istniejącym przełączniku
  sortowania z Sesji 20 (obok „alfabetycznie"/„po kategorii"), a nie automatyczne
  przełączenie po samej zgodzie — użytkownik świadomie ją wybiera.
- Przy każdej firmie na liście widoczny dystans (np. „2,3 km"), liczony po stronie klienta
  z `lat`/`lng` firmy i aktualnej pozycji użytkownika (wzór haversine, bez wywołania do API).
- Lokalizacja użytkownika nigdzie nie jest zapisywana (tylko w pamięci przeglądarki na czas
  sesji) — mimo to warto dopisać tę nową formę przetwarzania danych osobowych wprost do
  `docs/DECISIONS.md`, sekcja RODO, skoro ta sekcja i tak dziś istnieje.

Prompt (skróć/dostosuj):
> Zaimplementuj wyszukiwanie firmy przez Google Places API (New) w `CardForm.tsx` (tryb
> dodawania nowej firmy) — autouzupełnianie nazwy + zapis lokalizacji (`lat`/`lng`, kolumny
> już istnieją w `companies`, patrz `docs/DATABASE.md`). Dodaj mapę (Google Maps JavaScript
> API) na `/companies/:id` pokazującą lokalizację firmy — firmy bez ustawionych `lat`/`lng`
> (dodane ręcznie przed tą sesją) po prostu nie pokazują mapy, bez błędu. Klucz API
> ograniczony do interfejsów Maps JavaScript API + Places API (New) w konsoli Google Cloud
> (już zrobione), ograniczenie do domeny dopiero przed produkcją — żadnych innych sekretów w
> `NEXT_PUBLIC_*`.
>
> Dodatkowo: na `/companies` dodaj trzecią opcję sortowania „Najbliżej mnie", korzystającą z
> `navigator.geolocation` (za zgodą przeglądarki, z sensowną obsługą odmowy/braku wsparcia —
> pozostałe opcje sortowania/filtrowania z Sesji 20 działają bez zmian). Przy każdej firmie
> na liście pokaż liczony po stronie klienta dystans (wzór haversine, `lat`/`lng` firmy vs.
> pozycja użytkownika), np. „2,3 km" — firmy bez `lat`/`lng` przy tym sortowaniu na koniec
> listy, bez dystansu. Dodaj klucze i18n (PL/EN) na nową opcję sortowania i komunikat przy
> odmowie/braku wsparcia geolokalizacji.
>
> Zaktualizuj `docs/ARCHITECTURE.md` (usuń notę, że Maps jest zaślepione), status `ADR-004`
> w `docs/DECISIONS.md` na "potwierdzone", i dopisz w sekcji RODO tego pliku nową formę
> przetwarzania: lokalizacja użytkownika z `navigator.geolocation`, tylko w pamięci
> przeglądarki, nigdzie nie zapisywana.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Projekt Google Cloud + klucz ograniczony do interfejsów (Maps JavaScript API +
      Places API (New), nie wszystkie 35)
- [ ] Limit budżetu (billing alert) w Google Cloud — **świadomie odłożone 2026-08-09**:
      projekt działa na darmowym okresie próbnym (środki do 8 listopada 2026), Google nie
      pobiera opłat automatycznie po jego zakończeniu bez ręcznej aktywacji pełnego konta.
      Wrócić do tego punktu przed aktywacją pełnego konta rozliczeniowego / przed
      wdrożeniem produkcyjnym (patrz checklista "Przed pierwszym wdrożeniem
      produkcyjnym" wyżej w tym pliku).
- [x] Plan zaakceptowany (architektura po stronie przeglądarki, nie serwerowy proxy —
      ustalone 2026-08-09, patrz `ADR-004`)
- [x] Autouzupełnianie firmy (Places) w `CardForm.tsx` — własny komponent
      `PlacesAutocomplete.tsx` na `google.maps.places.AutocompleteSuggestion`
      (`useMapsLibrary("places")`), nie gotowy web component `<gmp-place-autocomplete>`
      (wymagałby osobno włączonego "Places UI Kit")
- [x] Mapa lokalizacji na `/companies/:id` (`CompanyMap.tsx`; firmy bez `lat`/`lng` —
      bez błędu, bez mapy) — zwykły `Marker`, nie `AdvancedMarker` (bez potrzeby Map ID)
- [x] Sortowanie „Najbliżej mnie" na `/companies` + widoczny dystans przy firmach
      (`src/lib/distance.ts`, haversine)
- [x] Obsługa odmowy zgody/braku wsparcia geolokalizacji — baner + reszta strony działa
      bez zmian (zweryfikowane w przeglądarce: odmowa geolokalizacji nie psuje filtra/listy)
- [x] `docs/DECISIONS.md` (status ADR-004 → potwierdzone + nowa nota RODO) /
      `ARCHITECTURE.md` / `API.md` (usunięty niezaimplementowany `/api/places/search`) /
      `SETUP.md` zaktualizowane
- [x] i18n uzupełnione (PL/EN)
- [x] lint/test przechodzą (134/134); commit — do potwierdzenia z użytkowniczką

Nota implementacyjna: `@vis.gl/react-google-maps` nie ma w swoim buncie dyrektywy
`"use client"` — użyty bezpośrednio w `src/app/layout.tsx` (Server Component) łamał
granicę RSC (`createContext is not a function` przy `next build`). Naprawione przez
własny wrapper `src/components/GoogleMapsProvider.tsx` z jawnym `"use client"`.
Zweryfikowane end-to-end w przeglądarce 2026-08-09: wyszukiwanie Places zwraca realne
podpowiedzi, wybór zapisuje `lat`/`lng` w bazie (potwierdzone przez `GET /api/companies`),
mapa renderuje się na `/companies/:id`, sortowanie „najbliżej mnie" z prawidłowym
fallbackiem przy odmowie geolokalizacji.

## Sesja V4.2 — Integracja Groq AI (doradca miejsc) — rozbita na V4.2a/V4.2b (ustalone 2026-08-09)

Uwaga terminologiczna: **Groq** (szybkie API do inferencji modeli językowych), nie inna
marka o podobnej nazwie. Groq sam w sobie nie ma dostępu do internetu ani do danych o
miejscach — to czysta warstwa rozumowania/syntezy nad kontekstem, który mu sami złożymy
server-side (dane z własnej bazy + Google Places (New), już zintegrowanego w V4.1).

Pierwotny pomysł użytkowniczki (Sesja V4.2, 2026-08-09) obejmował 5 rzeczy: polecane
miejsca w okolicy z kategorii, opinie użytkowników o miejscach, sugestie dodatkowych
aktywności na bazie dotychczasowych karnetów, oraz porównanie cen karnetów z cenników na
stronach firm. Ustalone przy planowaniu: rozbić na mniejsze sesje (jedna decyzja/ryzyko na
sesję, jak reszta Fazy V4), i **porównanie cen wyciąć całkiem poza zakres Fazy V4** —
wymagałoby albo ręcznego katalogowania cen (nowy model danych, praca redakcyjna) albo
scrapowania cudzych stron z realnym ryzykiem pokazania złej ceny (pieniądze użytkownika) i
kruchości przy zmianach layoutu — osobna decyzja na przyszłość, nie teraz.

`ADR-005` wprost wyklucza OCR ze zdjęcia z zakresu MVP — AI do rozpoznawania
voucherów/zdjęć nadal jest poza zakresem, nie tylko tej sesji.

### V4.2a — Rekomendacje miejsc + sugestie na bazie historii karnetów

Zakres: (1) "polecane miejsca w okolicy z danej kategorii" i (2) "sugerowane dodatkowe
aktywności na podstawie dotychczasowych karnetów". Oba bez nowych zależności poza tym, co
już mamy: `Company`/`Category` z własnej bazy (przez Prisma) + Google Places (New) do
wyszukania miejsc w promieniu. Nowy endpoint serwerowy (np. `POST /api/ai/recommendations`)
składa kontekst (historia karnetów usera + wynik Places) i dopiero to wysyła do Groq z
promptem każącym trzymać się podanych faktów (bez zmyślania miejsc spoza wyniku Places).

Wymaga **osobnego klucza Google** ograniczonego po IP/serwerze (dzisiejszy
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` z V4.1 jest ograniczony do referrerów przeglądarki, nie
nadaje się do wywołań z backendu) — do ustalenia przy starcie tej sesji razem z kluczem
Groq.

### V4.2b — Link do profilu Google Maps przy nazwie miejsca

Pierwsza wersja tej podsesji (2026-08-09) pokazywała podsumowanie opinii z Place Details
(New) — użytkowniczka zdecydowała tego samego dnia, że jej się to nie podoba, i poprosiła o
całkowite usunięcie. **Zakres ostateczny:** nazwa każdego polecanego miejsca (sekcja
"Polecane w okolicy") linkuje wprost do jego profilu na Google Maps — przez pole
`googleMapsUri`, które Google Places Text Search zwraca w tej samej odpowiedzi co reszta
danych o miejscu (bez dodatkowego wywołania API, bez dodatkowego cache'a). Robione po
V4.2a, bo to mały dodatek do tego samego endpointu.

Wspólne dla obu podsesji:
- Wywołania Groq (i serwerowe wywołania Places) wyłącznie po stronie serwera, klucze tylko
  w zmiennych serwerowych, nigdy `NEXT_PUBLIC_*`.
- Brak odpowiedzi AI nigdy nie blokuje reszty aplikacji — to zawsze sekcja dodatkowa,
  degraduje się cicho przy błędzie/timeout Groq lub Places.
- Cache wyników (per lokalizacja+kategoria, TTL rzędu godziny) — obie zależności kosztują
  za wywołanie.
- `GROQ_API_KEY` (i nowy serwerowy klucz Google) do `.env.example` (puste wartości) +
  opis w `docs/SETUP.md`.

Przed startem V4.2a: **użytkowniczka jeszcze nie ma klucza Groq** (zakłada konto na
console.groq.com) — sesja nie startuje, dopóki klucz nie istnieje.

- [x] Klucz Groq założony
- [x] Osobny serwerowy klucz Google (Places, bez ograniczenia po IP na czas dev) założony
- [x] Plan V4.2a zaakceptowany
- [x] V4.2a: rekomendacje + sugestie z historii karnetów działają, degradują się łagodnie
      — zweryfikowane end-to-end w przeglądarce 2026-08-09 (prawdziwe wyniki z Google
      Places dla zapytania "Siłownia w pobliżu" w Warszawie + spójne uzasadnienie z Groq)
- [x] ~~V4.2b: opinie Google Places~~ — zbudowane, potem usunięte na życzenie
      użytkowniczki (2026-08-09, "nie podoba mi się"); patrz wersja ostateczna niżej
- [x] V4.2b (wersja ostateczna): nazwa polecanego miejsca linkuje do jego profilu Google
      Maps (`googleMapsUri` z Text Search, bez dodatkowego wywołania API) — zweryfikowane
      end-to-end w przeglądarce 2026-08-09
- [x] `.env`/`.env.example`/`docs/SETUP.md` zaktualizowane (`GROQ_API_KEY`,
      `GOOGLE_PLACES_SERVER_KEY`)
- [x] `docs/DECISIONS.md` (`ADR-008` + nowa nota RODO) / `docs/API.md` zaktualizowane
- [x] Cache wyników — TTL ~godzina w pamięci procesu dla wyszukiwania miejsc Google
      Places; Groq świadomie NIE cache'owany (zależy od historii konkretnego użytkownika,
      patrz `ADR-008`). Zastrzeżenie: cache per-proces, nie współdzielony między
      instancjami serverless — do rewizji przy realnym ruchu produkcyjnym.
- [x] lint (eslint) / test (151/151) / `next build` przechodzą — stan końcowy V4.2

## Sesja V4.3 — Prawdziwy upload plików/zdjęć voucherów (object storage) — wymaga decyzji przed startem

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
- [x] Tryb bucketa, dozwolone typy/rozmiar i los pola tekstowego ustalone: prywatny +
      signed URLs, JPG/PNG/WebP/PDF do 10 MB, pole tekstowe zostaje jako alternatywa
      (przełącznik tekst/plik, nie oba naraz)
- [x] Konto Supabase Storage: bucket `voucher-files-dev` założony (dev), `STORAGE_BUCKET_URL`/
      `STORAGE_ACCESS_KEY`/`STORAGE_BUCKET_NAME` uzupełnione realnymi wartościami w `app/.env`
- [x] Plan zaakceptowany
- [x] Upload pliku działa, zapisany w Supabase Storage, autoryzacja jak reszta `/api/cards`
      — zweryfikowane end-to-end w przeglądarce na realnym buckecie `voucher-files-dev`
      (upload → signed URL → pobranie bajt-w-bajt zgodne z wysłanym plikiem)
- [x] Podgląd pliku w `cards/[id]/page.tsx` (miniaturka obrazu / link do PDF wg rozszerzenia)
- [x] `docs/` i i18n zaktualizowane (w tym `voucherFileUrlHint`) — `DATABASE.md`, `API.md`,
      `SETUP.md`, `DECISIONS.md` (`ADR-009`, nowe odkrycie: limit ciała requestu na Vercel
      ~4.5 MB wymusił upload bezpośrednio do Supabase Storage przez signed URL, nie przez
      nasz endpoint)
- [ ] DPA z Supabase (storage) — dopisane/zweryfikowane w checkliście "Przed pierwszym
      wdrożeniem produkcyjnym" (bucket `voucher-files` produkcyjny jeszcze nie założony —
      do zrobienia przy wdrożeniu, analogicznie do `voucher-files-dev`)
- [x] lint (0 błędów) / test (180/180, w tym nowe testy sign-upload/confirm/GET
      voucher-file, cleanup w PATCH i czystych helperów `voucher-file.ts`) / `next build`
      przechodzą

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

---

## Faza V5b — przeprojektowanie mobilne (PWA) — ukończona 2026-08-16

Kontekst: różni się od Sesji 17 (tylko dopasowanie istniejącego web-owego layoutu do
wąskich ekranów) — to pełne przeprojektowanie doświadczenia mobilnego wg paczki handoffu
`v5b/design_handoff_mobile_pwa` (mockupy `.dc.html`, ekrany 1a–1r), plus realna warstwa PWA
(manifest, service worker, Web Push), której wcześniej świadomie nie było (patrz
`MOBILE_ROADMAP.md`, punkt 3 „Czy PWA wystarczy na start" — **odpowiedź: tak, na start
PWA wystarcza**, natywna aplikacja zostaje odłożona zgodnie z pierwotnym roadmapem).
Branch `Faza_v5b`, sześć etapów wg `PLAN_PRAC.md` z paczki handoffu, każdy pokazywany i
zatwierdzany z właścicielką projektu przed implementacją. Wariant nawigacji: **1b**
(dolny pasek zakładek + centralny FAB na `/cards`), wybrany świadomie zamiast 1a/1c/1d/1e.

Zakres:
- **Etap 1** — `BottomTabBar.tsx` (widoczny `md:hidden`, Header/Footer desktopowe dostają
  `hidden md:flex`/`md:block`), nowa trasa `/account` (przenosi treść dawnego
  `AccountMenu`/`SettingsMenu`/`HelpMenu`/`Footer` na jeden ekran), tryb wyglądu
  rozszerzony o „Auto" (`src/lib/theme.ts`, `AppearanceControl.tsx`) obok istniejącego
  jasny/ciemny.
- **Etap 2** — `VisitDots.tsx` (kropki + liczba), `QuickVisitButton.tsx` („+1" bezpośrednio
  na karcie listy, optymistyczna aktualizacja), `UndoToast.tsx`/`ToastProvider.tsx`
  (cofnięcie wejścia w 5 s), nowy nagłówek `/cards/[id]` (edycja/usuwanie karnetu
  przeniesione do ikon w nagłówku, historia wejść z kafelkiem daty).
- **Etap 3** — nagłówek `/cards` w stylu marki, zakładki Aktywne/Archiwum jako pigułki,
  `ArchivedCardItem.tsx` (płaska lista bez grupowania po kategorii), szkielety ładowania.
- **Etap 4** — `CardWizard/` (kreator karnetu jako trzy pełnoekranowe kroki, nowa trasa
  `/cards/new`) **tylko na mobile** — desktop (`md:` i wyżej) zachowuje dotychczasowy
  jednoformularzowy `CardForm.tsx` bez zmian, świadomie bez współdzielenia JSX między
  wariantami (różnią się zbyt mocno wizualnie — kafelki/stepper na mobile vs. radio/input
  na desktopie), tylko wspólnym typem stanu (`CardFormValues`) i tą samą walidacją
  (`getCardInputErrors` bez zmian).
- **Etap 5** — mapa zbiorcza (`CompaniesOverviewMap.tsx`) nad listą `/companies` (zwykłe
  `Marker`, nie `AdvancedMarker` — jak `CompanyMap.tsx`, bez kolorowych pinezek per
  kategoria, żeby nie wymagać Map ID), pigułki kategorii na `/recommendations` (dotknięcie
  od razu odpala geolokalizację + zapytanie), ekran onboardingu na `/`
  (`OnboardingScreen.tsx`) pokazywany tylko gościom bez konta i bez żadnego karnetu —
  decyzja zapada po stronie klienta (`deviceFetch("/api/cards")`), bo tożsamość
  urządzenia-gościa żyje tylko w `localStorage`, nie da się tego rozstrzygnąć na
  serwerze. Nowy `AppShell.tsx` ukrywa Header/Footer/BottomTabBar na tym jednym ekranie.
- **Etap 6** — PWA: `manifest.ts` + ikony 192/512 generowane dynamicznie (te same
  proporcje co `icon.tsx`), `public/sw.js` (`push`/`notificationclick`, bez
  cache'owania offline w tej fazie). Web Push: nowa tabela `push_subscriptions`
  (migracja `20260816154744_add_push_subscriptions`, ten sam rozłączny model własności
  `userId`/`deviceId` co `Favorite`/`Card`), `POST`/`DELETE /api/push/subscribe`,
  `GET /api/cron/reminders` (chroniony `CRON_SECRET`, wybiera karnety z terminem
  dokładnie za 7 albo 2 dni — `src/server/reminders.ts`, testowalne bez bazy),
  `src/server/push-sender.ts` (wysyłka przez `web-push`, sprząta subskrypcje unieważnione
  przez przeglądarkę). GitHub Actions `.github/workflows/reminders.yml`, codziennie
  7:00 UTC. Przełącznik przypomnień w `/account` podłączony pod prawdziwą subskrypcję;
  podpowiedź o instalacji na ekran główny dla iOS (Web Push tam wymaga trybu standalone).

Po drodze znalezione i naprawione błędy (warte odnotowania, bo mogą się powtórzyć w
podobnych miejscach):
- Klasa `hidden` łączona z komponentem, który ma **wbudowane** `inline-flex` (np.
  `Button.tsx`) nie działa niezawodnie — obie klasy mają tę samą specyficzność, kolejność
  w wygenerowanym CSS Tailwinda nie jest gwarantowana (ten sam problem, który komentarz w
  `ui/Select.tsx` już opisywał dla `pl-10` vs. `px-3`). Naprawa: `hidden`/`md:*` zawsze na
  **owijającym elemencie bez własnego `display`**, nie bezpośrednio na komponencie z
  zshardkodowaną klasą displaya.
- Endpoint `GET /api/cron/reminders` jawnie przekazywał dokładny czas wywołania
  (`new Date()`) zamiast początku dnia do `filterCardsForReminders` — psuło zaokrąglenie
  granicy 7/2 dni po południu (karnet z terminem za "7 dni" liczonych od północy wypadał
  jako "6.x dnia" po południu i nie łapał się w oknie przypomnienia). Naprawa: funkcja ma
  własny domyślny `referenceDate = startOfToday()`, wywołujący nie powinien go nadpisywać
  dokładnym czasem.
- Hydratacja `AppearanceControl.tsx` — SSR nie ma dostępu do `localStorage`, więc pierwszy
  render klienta czasem nie zgadzał się z serwerem, gdy w `localStorage` był już zapisany
  motyw inny niż domyślny. Naprawa: `useState` startuje zawsze od stałej wartości „auto",
  realny odczyt `localStorage` dopiero w `useEffect` po zamontowaniu (ten sam wzorzec co
  istniejący `ThemeToggle.tsx`, tam już rozwiązany przez `suppressHydrationWarning` na
  pojedynczej ikonie — tu potrzebne pełne odroczenie do efektu, bo różnica dotyczy kilku
  elementów naraz, nie jednej ikony).

Świadome odstępstwa od mockupów (v5b), zaakceptowane po drodze:
- Daty w liście/szczegółach karnetu zostają w dotychczasowym długim polskim formacie
  („30 listopada 2026”), nie w skróconym numerycznym z mockupu — spójność z resztą appki
  ważniejsza niż pikselowa wierność jednemu ekranowi.
- Brak liczby „X karnet(y)” przy firmie na `/companies` (wymagałoby zmiany API i jego
  testów — nieproporcjonalne do wartości tej jednej linijki UI).
- FAB w dolnym pasku pozostaje widoczny też w zakładce Archiwum na `/cards` (mockup 1i go
  tam nie pokazuje) — stan zakładki żyje lokalnie na stronie, nie w URL, więc nie ma go
  skąd odczytać w globalnym `BottomTabBar.tsx` bez rozszerzania zakresu.
- Widget na ekranie blokady (1o) pominięty — niewykonalne w PWA, potwierdzone w handoffie
  jako materiał na etap natywny.

**Do zrobienia zanim przypomnienia push zadziałają na produkcji** (poza zakresem tej
sesji — wymaga danych/dostępu, których nie miał Claude Code):
- [ ] `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
      `VAPID_SUBJECT`, `CRON_SECRET` w zmiennych środowiskowych Vercel (Production i
      Preview)
- [ ] Sekrety `CRON_TARGET_URL` i `CRON_SECRET` w GitHub → Settings → Secrets and
      variables → Actions (ta sama wartość `CRON_SECRET` co w Vercel)
- [ ] Przetestowany `reminders.yml` (`Run workflow` ręcznie) — kod 200, sensowny JSON
- [ ] Instalacja i realne powiadomienie sprawdzone na urządzeniu (Android i iPhone ≥ 16.4)
- [ ] Scalenie `Faza_v5b` → `main` po ręcznym teście na urządzeniu

- [x] Wszystkie 6 etapów zaakceptowane ekran po ekranie przed implementacją
- [x] `npm run lint` + `npx tsc --noEmit` + `npm run test` zielone po każdym etapie
      (180 → 187 testów, 23 pliki)
- [x] Migracja Prisma (`push_subscriptions`) uruchomiona na lokalnej bazie deweloperskiej,
      nigdy na produkcyjnej Supabase
- [x] Zweryfikowane w przeglądarce (podgląd mobile + desktop) na żywych danych, nie tylko
      w kodzie: lista/szczegóły/kreator/archiwum/onboarding/mapa firm/pigułki doradcy/cron
- [x] Commit + push na `origin/Faza_v5b` (main nietknięty)
- [x] `docs/` (ten wpis + `ARCHITECTURE.md`/`DATABASE.md`/`API.md`/`MOBILE_ROADMAP.md`)

---

## Faza V6 — logowanie

Uwaga: odpalana po Fazie V4 (nowe API) i Fazie V5 (grafika) — świadomie na końcu, bo to
rozszerzenie już działającego mechanizmu logowania (Google OAuth, Sesja 14), nie coś, od
czego zależą inne fazy. Nic w V4 ani V5 nie czeka na tę sesję.

## Sesja V6.1 — Logowanie: dodatkowe metody (hasło i/lub magic link) — wymaga decyzji przed startem

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

- [x] Metoda(y) logowania i pola profilu ustalone (login + hasło, rekomendacja z tej
      sekcji; magic link odłożony; bez dodatkowych pól profilu w tej sesji)
- [x] Plan zaakceptowany
- [x] Nowa metoda logowania działa obok Google OAuth (`CredentialsProvider`, `bcryptjs`,
      nowe ekrany `/login` i `/register` — oba wejścia logowania pokazane razem, nie
      osobno; `POST /api/auth/register` odrzuca e-mail już zajęty przez dowolne konto,
      w tym Google-owe bez hasła, świadomie bez auto-linkowania kont)
- [x] Zweryfikowane: konto nadal w pełni opcjonalne, przestrzenie danych nadal rozłączne
- [x] `docs/` zaktualizowane (`API.md`, `DATABASE.md`, `DECISIONS.md`/ADR-003)
- [x] lint/test (192/192) + build + commit — `Faza_V6`, commit `5ad1c1b`

---

## Faza V6b — poprawki UX i nowe funkcje (zestaw 21 zmian, ustalony 2026-08-17)

Uwaga: to lista życzeń z dwóch rozmów z właścicielką projektu (18 punktów + 3 dopiski),
rozbita na osobne sesje wg tej samej zasady co reszta pliku — jedna decyzja/ryzyko na sesję.
Punkt 1 z pierwotnej listy 18 ("dodatkowa metoda logowania") to już opisana wyżej
**Sesja V6.1** — nie duplikowana tu, odpalana tak jak jest (wymaga wcześniej ustalenia
metody logowania). Przy tytule każdej sesji niżej w nawiasie jest numer oryginalnego punktu
(„punkt N" dla pierwszych 18, „dopisek N" dla trzech dodanych później), dla łatwego
odnalezienia.

**Kolejność sesji niżej to szacowana pracochłonność, od największej do najmniejszej** — na
wyraźną prośbę, żeby dało się ocenić skalę całej fazy. To jednak szacunek, nie pomiar, i w
paru miejscach ustępuje realnej zależności technicznej — trzy sesje dotyczące zakładki
„Miejsca" (dodawanie nowych miejsc, filtr kategorii, dokończenie designu) i tak muszą
wyjść **po** zmianie nazewnictwa „Firmy → Miejsca", niezależnie od tego, że sama zmiana
nazewnictwa jest mniej pracochłonna — inaczej trzeba by pisać nowy kod raz pod starą, raz
pod nową nazwą. Każda taka sesja ma to wprost zaznaczone w treści („wymaga wcześniej..."/
„zależna od...") — jeśli wykonujesz sesje po kolei z tej listy, kieruj się tymi notatkami, a
nie samą pozycją na liście, gdy się rozjeżdżają. Numer wersji (ostatnia sesja) jest zawsze na
końcu z definicji — to nie przypadek, że wypada też najlżejsza.

### Sesja V6.2 (punkt 3) — Wiele plików/zdjęć vouchera na jednym karnecie — wymaga decyzji przed startem

Kontekst: `ADR-009`/Sesja V4.3 wprowadziła upload **jednego** pliku vouchera na karnet
(`cards.voucherFileUrl`, prefiks `storage:` odróżnia plik od zwykłego tekstu/linku, signed
URL z Supabase Storage, bucket prywatny). Właścicielka chce móc dodać **kilka** plików/zdjęć
do jednego karnetu (np. przód i tył karty klubowej, kilka voucherów naraz). To zmiana modelu
danych — pojedyncza kolumna tekstowa nie pomieści listy — więc zanim odpalisz tę sesję,
rozstrzygnij (zasada „nie zgaduj"):

- Limit liczby plików na karnet (np. 5)?
- Czy pole tekstowe/link (alternatywa „tekst" z dzisiejszego przełącznika tekst/plik)
  zostaje jako osobna, dodatkowa opcja obok listy plików, czy przełącznik tekst/plik znika
  całkowicie na rzecz samej listy plików? Rekomendacja: zostawić tekst/link jako osobną,
  jedną opcję obok (niezależną od listy plików) — to najmniejsza zmiana względem
  dzisiejszego UX i nie wymaga migracji istniejących wartości `voucherFileUrl` w trybie
  tekstowym.
- Czy przy „Odnów" (karnet z archiwum) nowy karnet dziedziczy wszystkie pliki źródłowego
  karnetu (jak dziś dziedziczy pojedynczy plik), czy zaczyna bez plików?

Rekomendacja architektoniczna: nowa tabela `CardVoucherFile` (wzorem `push_subscriptions` z
Fazy V5b) — `id`, `cardId` (FK do `cards`), `storagePath`, `createdAt` — zamiast próby
upakowania listy w jedną kolumnę tekstową. Kolumna `cards.voucherFileUrl` zostaje bez zmian
(dalej obsługuje tryb tekstowy, jeśli ustalono wyżej, że zostaje).

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Dodaj obsługę wielu plików/zdjęć vouchera na karnet: nowy model Prisma `CardVoucherFile`
> (`id`, `cardId` FK do `cards` z `onDelete: Cascade`, `storagePath`, `createdAt`), migracja
> na **lokalnej bazie deweloperskiej**. Rozszerz upload (wzorem istniejącego trójkrokowego
> flow z ADR-009: sign-upload → PUT bezpośrednio do Supabase Storage → confirm) o możliwość
> wielokrotnego wywołania dla tego samego karnetu, do limitu [ustalony wyżej] plików —
> `confirm` tworzy nowy wiersz `CardVoucherFile` zamiast nadpisywać `voucherFileUrl`. Nowy
> endpoint `DELETE /api/cards/:id/voucher-files/:fileId` (autoryzacja jak reszta
> `/api/cards/*`) usuwa jeden plik z bucketa i wiersz z bazy. `GET` zwraca listę świeżych
> signed URL-i dla wszystkich plików karnetu (nie jeden). W `CardForm.tsx`/`CardWizard/VoucherStep.tsx`
> zamień pojedynczy input pliku na siatkę miniaturek + przycisk „Dodaj kolejny plik" (do
> limitu) + usuwanie pojedynczego pliku. [Jeśli tekst/link zostaje:] osobna opcja, niezależna
> od listy plików, bez zmian względem dzisiejszego zachowania. „Odnów" z archiwum: [ustalona
> reguła dziedziczenia plików]. Zaktualizuj `docs/DATABASE.md`, `docs/API.md`,
> `docs/DECISIONS.md` (nowa nota przy `ADR-009` o wielu plikach) i i18n (PL/EN).
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Limit plików, los pola tekstowego i reguła dziedziczenia przy „Odnów" ustalone
      (limit **5**; tekst/link zostaje jako osobna, niezależna opcja; „Odnów" zaczyna bez
      plików, tekst/link nadal dziedziczony)
- [x] Plan zaakceptowany
- [x] Migracja `CardVoucherFile` na bazie lokalnej (`20260817220804_add_card_voucher_files`,
      z krokiem przenoszącym istniejące `storage:`-owe `voucherFileUrl` do nowej tabeli)
- [x] Upload/usuwanie wielu plików działa end-to-end (zweryfikowane w przeglądarce na
      realnym buckecie `voucher-files-dev`, nie tylko testami jednostkowymi — limit 5,
      usuwanie plików oczekujących i już zapisanych, niezależność tekst/pliki, „Odnów" bez
      dziedziczenia plików)
- [x] `docs/` i i18n zaktualizowane (`DATABASE.md`, `API.md`, `ARCHITECTURE.md`,
      `DECISIONS.md`, `messages/pl.json`, `messages/en.json`)
- [x] lint/test (195/195) — do potwierdzenia z użytkowniczką, potem commit

### Sesja V6.3 (dopisek 1) — Archiwizacja: wejścia z datą przyszłą — wymaga decyzji przed startem

Kontekst: `VisitForm.tsx` pozwala wpisać wejście z dowolną datą — także przyszłą (pole
`type="date"` bez ograniczenia `min`/`max`, domyślnie dzisiejsza data). `POST
/api/cards/:id/visits` (`src/app/api/cards/[id]/visits/route.ts`) inkrementuje
`cards.usedVisits` **natychmiast** przy zapisie wejścia, niezależnie od tego, czy
`visitDate` jest w przeszłości czy w przyszłości. `isCardArchived` (`src/server/card-status.ts`)
archiwizuje karnet typu `limit`, gdy `usedVisits >= totalVisits` — czyli **zaplanowane
wejście z przyszłą datą już dziś liczy się do limitu i może przedwcześnie zarchiwizować
karnet**, zanim to wejście faktycznie się odbędzie. Właścicielka chce, żeby karnet trafiał do
archiwum dopiero, gdy **ostatnie** (chronologicznie) wejście ma datę, która już minęła — nie
wcześniej, nawet jeśli licznik `usedVisits` już osiągnął limit.

To zmiana dobrze udokumentowanej reguły biznesowej (`docs/DATABASE.md`, formuła
archiwizacji: `used_visits >= total_visits`). Przed startem ustal:
- Czy licznik „X/Y" widoczny w UI (`VisitDots`, nagłówek szczegółów karnetu) ma dalej
  pokazywać **wszystkie** zapisane wejścia (w tym przyszłe, jak dziś), czy tylko
  zrealizowane? Rekomendacja: zostaw jak jest (widoczny licznik = wszystkie zapisane, bo to
  użyteczna informacja „ile mam zaplanowanych") — zmienia się tylko to, co decyduje o
  **archiwizacji**.
- Wpływ na status ostrzegawczy (`getCardWarningStatus`/`StatusBadge`, progi `soon`/`urgent`/
  `wygasł` wg pozostałych wejść) — dziś liczony z surowego `usedVisits`. Rekomendacja: licz
  go też na bazie **zrealizowanych** wejść (data ≤ dziś), żeby odznaka nie pokazywała
  „wygasł"/„urgent", gdy w rzeczywistości pozostały jeszcze zaplanowane, nieodbyte wejścia.
- Skąd brać „zrealizowane wejścia" po stronie serwera — rekomendacja: policz
  `COUNT(visits WHERE cardId = ... AND visitDate <= dziś)` zamiast (albo obok) kolumny
  `usedVisits`, w miejscach decydujących o archiwizacji/statusie (`isCardArchived`,
  `getCardWarningStatus`, endpoint blokujący dodanie wejścia do zarchiwizowanego karnetu,
  listing `GET /api/cards`/`GET /api/cards?archived=true`).

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Zmień regułę archiwizacji karnetu typu `limit`, żeby liczyła się liczba wejść
> **zrealizowanych** (`visitDate <= dziś`), nie surowy licznik `usedVisits` (który dziś
> rośnie natychmiast po zapisaniu wejścia, niezależnie od daty). Dodaj funkcję pomocniczą
> (np. rozszerzenie `isCardArchived` o przyjmowanie listy dat wejść albo wyniku zapytania do
> bazy) zwracającą liczbę wejść z datą ≤ dziś. Użyj jej we wszystkich miejscach dziś
> opierających się na `usedVisits` do decyzji o archiwizacji: `isCardArchived`
> (`src/server/card-status.ts`), listing `GET /api/cards`/`GET /api/cards?archived=true`,
> blokada dodania wejścia do zarchiwizowanego karnetu (`POST /api/cards/:id/visits`). [Jeśli
> ustalono, że status ostrzegawczy też ma się zmienić:] zastosuj tę samą logikę w
> `getCardWarningStatus`/`getRemainingVisitsStatus`. Licznik „X/Y" w UI (`VisitDots`,
> szczegóły karnetu) **zostaje bez zmian** — nadal pokazuje wszystkie zapisane wejścia, w
> tym przyszłe. Zaktualizuj `docs/DATABASE.md` (formuła archiwizacji) i dodaj/zaktualizuj
> testy w `src/server/card-status.test.ts` i testach API kart/wejść pod nowe zachowanie
> (karnet z limitem osiągniętym wyłącznie przyszłymi wejściami nie powinien być
> zarchiwizowany).
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Decyzje (zakres zmiany statusu ostrzegawczego, źródło „zrealizowanych" wejść) podjęte
      (obie rekomendacje z opisu sesji przyjęte: licznik „X/Y" bez zmian, status ostrzegawczy
      też liczony na bazie realizedVisits)
- [x] Plan zaakceptowany
- [x] Archiwizacja odroczona do momentu, aż ostatnie zaplanowane wejście ma datę w przeszłości
      (zweryfikowane end-to-end w przeglądarce 2026-08-18: wejście z datą 2099 nie
      archiwizuje karnetu z wyczerpanym limitem, zmiana tej daty na przeszłą — archiwizuje)
- [x] `docs/DATABASE.md` zaktualizowane (też `docs/API.md` — nowe pole `realizedVisits`)
- [x] Testy zaktualizowane (w tym scenariusz: limit osiągnięty przyszłymi wejściami ≠ archiwizacja)
      — `card-status.test.ts`, `cards/route.test.ts`, `cards/[id]/route.test.ts`,
      `visits/route.test.ts`, `companies/[id]/route.test.ts`
- [x] lint/test (200/200) + commit

Uwaga (2026-08-18): przy okazji weryfikacji `npm run test:e2e` odkryto 5 nieprzechodzących
testów (`archive.spec.ts` ×2, `card-crud.spec.ts`, `visits.spec.ts` ×2), niezwiązanych z tą
sesją — potwierdzone przez `git stash` na stanie sprzed Sesji V6.3 (identyczne błędy).
Dwie przyczyny, obie z wcześniejszych sesji: (1) przycisk na `cards/[id]/page.tsx` nazywa
się dziś „Zapisz wejście" (`saveVisitButton`), testy oczekują „Dodaj wejście"
(`addVisitButton` — martwy klucz i18n, nigdzie nieużywany w kodzie); (2) `VisitDots.tsx`
(Faza V5b) pokazuje „wejść" tylko w `aria-label`, nie w widocznym tekście DOM, więc
`getByText("X/Y wejść")` nigdy się nie dopasuje. Świadomie odłożone do osobnej sesji
(decyzja właścicielki) — nowy test w `archive.spec.ts` dodany w tej sesji jest tym samym
problemem zablokowany do czasu tamtej poprawki.

### Sesja V6.4 (punkt 14) — „Firmy" → „Miejsca" (zmiana nazewnictwa widocznego dla użytkownika)

Kontekst: pracochłonność tej sesji jest niewielka (czysty tekst), ale wykonywana jest tu, wyżej
niż sugerowałaby jej trudność, bo trzy kolejne sesje tej fazy (V6.5, V6.14, V6.8) dotyczą
zakładki „Miejsca" i mają sens dopiero po tej zmianie. To zmiana **tylko tekstu wyświetlanego
użytkownikowi** — nazwy wewnętrzne (model Prisma `Company`, trasa `/companies`, endpointy
`/api/companies*`, propsy typu `CompanyOption`/`companyMode`/`newCompanyName`) **zostają bez
zmian**, żeby nie robić niepotrzebnej, ryzykownej migracji nazw w kodzie/API dla czystej
zmiany słownej — to ten sam wzorzec, co rozdzielenie `categoryDisplayName` (etykieta
widoczna) od wewnętrznego `slug` enuma kategorii. Słowo „firma"/„firmy"/„firmę" w treści dla
użytkownika występuje w wielu miejscach `messages/pl.json` (np. `companiesNav`,
`companiesPage.title`, `companyDetailsPage.*`, `cardForm.companyLabel`/`companyModeOptions`/
`newCompanyNameLabel`, treść pomocy/FAQ) i analogicznie „company/companies" w
`messages/en.json` (→ „Place"/„Places").

Prompt (skróć/dostosuj):
> W `messages/pl.json` zamień każde wystąpienie słowa „firma" w jego odmianach
> (firma/firmy/firmę/firmie/firm) w tekstach widocznych dla użytkownika na odpowiednią formę
> „miejsce" (miejsce/miejsca/miejscu/miejsc) — obejmij co najmniej `header.companiesNav`,
> `companiesPage.*`, `companyDetailsPage.*`, `cardForm.companyLabel`,
> `cardForm.companyModeOptions`, `cardForm.newCompanyNameLabel` i pochodne placeholdery/błędy,
> oraz treść pomocy/FAQ (`helpDialog`/`faq`, jeśli tam też występuje). Zrób analogiczną zamianę
> w `messages/en.json` („company"/„companies" → „place"/„places", z zachowaniem naturalnej
> angielskiej gramatyki). **Nie zmieniaj** nazw kodowych: model Prisma `Company`, trasa
> `/companies`, endpointy `/api/companies*`, nazwy propsów/typów w komponentach (`CompanyOption`,
> `companyMode` itd.) — to wyłącznie zmiana tekstu w słowniku i18n. Przejrzyj też
> `docs/user/faq.md` i `getting-started.md`, jeśli mają być spójne z nową terminologią w
> UI (do potwierdzenia, czy dokumentacja użytkownika też ma się zmienić w tej sesji).
> Najpierw krótki plan (lista kluczy do zmiany), poczekaj na akceptację.

- [x] Plan zaakceptowany
- [x] `messages/pl.json`/`en.json` zaktualizowane, nazwy kodowe (model/trasy/API) nietknięte
- [x] Zweryfikowane wizualnie na `/companies`, `CardForm`, pomocy/FAQ — brak śladu „firma/company"
- [x] lint/test + commit

### Sesja V6.5 (punkt 15) — „Miejsca": dodawanie nowych miejsc z tej zakładki — wymaga decyzji przed startem, zależna od V6.4

Kontekst: dziś jedyny sposób dodania nowej firmy/miejsca to przy okazji dodawania karnetu
(`CardForm.tsx`, tryb „nowa firma" — wyszukiwarka Google Places lub wpisanie nazwy ręcznie,
plus wybór/utworzenie kategorii). `/companies` (po Sesji V6.4: „Miejsca") nie ma dziś żadnej
akcji dodawania. Model `Company` (`prisma/schema.prisma`) ma dziś tylko `name`, `lat`/`lng`,
`googlePlaceId` — **nie ma pola na tekstowy adres**. Prośba „pola adresowe automatycznie
uzupełniane" (przy wyszukiwarce) odnosi się więc dziś tylko do `lat`/`lng`/`googlePlaceId` z
Google Places — nie ma czego wyświetlić jako tekstowy adres bez dodania nowej kolumny.
Ręczne dodawanie „z opcjonalnymi polami adresowymi" wymaga więc decyzji o nowym polu.

Do ustalenia przed startem:
- Dodać nową, opcjonalną kolumnę `address` (tekst) do `Company`, wypełnianą albo ręcznie,
  albo (jeśli Google Places to zwraca w wyniku wyszukiwania) automatycznie przy wyborze
  podpowiedzi? Rekomendacja: tak — to jedyny sposób pokazać „adres" jako tekst, bo dziś
  istnieją tylko współrzędne.
- Czy dodawanie nowego miejsca z tego ekranu wymaga też wyboru/utworzenia kategorii (tak
  jak w `CardForm`, bo `Company.categoryId` jest wymagane w schemacie), czy miejsce może
  na start nie mieć kategorii (**wymagałoby** zmiany schematu — `categoryId` dziś nie jest
  nullable)? Rekomendacja: kategoria wymagana, ten sam UI co w `CardForm` (select + „dodaj
  własną").

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> [Jeśli dodajemy adres:] dodaj opcjonalną kolumnę `address` (String?) do modelu `Company`
> w `prisma/schema.prisma`, migracja na **lokalnej bazie deweloperskiej**. Dodaj na stronie
> „Miejsca" (`src/app/companies/page.tsx`) przycisk „Dodaj miejsce" otwierający formularz
> (modal albo panel inline, wzorem `CardForm`): pole nazwy przez istniejący
> `PlacesAutocomplete.tsx` (wybór z wyszukiwarki uzupełnia `lat`/`lng`/`googlePlaceId`
> [i `address`, jeśli pole Google Places je zwraca — sprawdź `formattedAddress` w odpowiedzi
> Text Search]), albo wpisanie nazwy ręcznie bez wyboru podpowiedzi (tak jak dziś w
> `CardForm`) — w trybie ręcznym pole adresu jako zwykły opcjonalny input tekstowy. Wybór/
> utworzenie kategorii — ten sam blok UI co w `CardForm.tsx` (`NEW_CATEGORY_SENTINEL`,
> paleta kolorów). Zapis przez istniejący `POST /api/companies` (rozszerzony o `address`).
> Po zapisaniu odśwież listę miejsc. Wyświetl adres (jeśli ustawiony) w
> `src/app/companies/[id]/page.tsx`. Zaktualizuj `docs/DATABASE.md`, `docs/API.md`, i18n
> (PL/EN, z terminologią „miejsce" z Sesji V6.4).
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Sesja V6.4 ukończona (wymagana zależność — nazewnictwo „Miejsca") — zrobiona w tej
      samej sesji, przed V6.5
- [x] Decyzje (pole adresu, wymagana kategoria) podjęte — adres: tak (kolumna `address`);
      kategoria: wymagana, ten sam UI co `CardForm`
- [x] Plan zaakceptowany
- [x] Migracja `address` na bazie lokalnej (jeśli dotyczy)
- [x] Formularz „Dodaj miejsce" (wyszukiwarka + ręcznie) na `/companies`
- [x] Adres widoczny w szczegółach miejsca, jeśli ustawiony
- [x] `docs/` i i18n zaktualizowane
- [x] lint/test + commit — `npm run test:e2e` ma 6 wcześniej istniejących niepowodzeń
      niezwiązanych z tą sesją (rozjazd testów z Sesji 13 z redesignem mobilnym Fazy v5b,
      `CardListItem.tsx` pokazuje dziś `VisitDots` zamiast tekstu „X/Y wejść") — zgłoszone
      jako osobne zadanie do naprawy

### Sesja V6.6 (dopisek 2) — Kolorowanie kropek: zrealizowane vs zaplanowane wejścia — wymaga decyzji przed startem, zależna od V6.3

Kontekst: `VisitDots.tsx` dziś przyjmuje tylko liczby (`used`/`total`), nie listę konkretnych
wejść z datami — wypełnione kropki mają jednolity kolor kategorii (`CATEGORY_COLOR_CLASS`),
bez rozróżnienia, które wejście już się odbyło, a które jest dopiero zaplanowane na
przyszłość. Pełna lista wejść z datami (`ApiVisit.visitDate`) jest dziś dostępna tylko na
stronie szczegółów karnetu (`src/app/cards/[id]/page.tsx`, `card.visits`) — `GET /api/cards`
(lista) zwraca tylko zbiorczy `usedVisits`/`totalVisits`, bez dat poszczególnych wejść.
Doprowadzenie tego rozróżnienia do kompaktowych kropek na `/cards` (`CardListItem.tsx`)
wymagałoby rozszerzenia listy API o dane każdego wejścia dla każdego karnetu — wyraźnie
większy koszt (payload) dla czysto dekoracyjnego rozróżnienia koloru małych kropek.

Przed startem ustal:
- Zakres: tylko duży widok kropek na szczegółach karnetu (`size="lg"`, dane już dostępne),
  czy też kompaktowy widok na liście `/cards` (`size="sm"`, wymaga rozszerzenia
  `GET /api/cards`)? Rekomendacja: tylko szczegóły karnetu na start — najmniejsze ryzyko, bez
  zmian w kształcie odpowiedzi listy kart.
- Kolor/styl dla wejść zaplanowanych (przyszła data) — np. ten sam kolor kategorii, ale w
  jaśniejszym odcieniu/z obniżoną nieprzezroczystością, czy inny wzór (np. obwódka zamiast
  pełnego wypełnienia)? Rekomendacja: pełne wypełnienie kolorem kategorii dla zrealizowanych
  (jak dziś), a dla zaplanowanych — ten sam kolor kategorii, ale z opacity ok. 40–50%, żeby
  różnica była czytelna bez wprowadzania nowego koloru do palety.

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> W `src/app/cards/[id]/page.tsx` przekaż do `VisitDots` informację, które z zapisanych
> wejść mają datę w przeszłości, a które w przyszłości (dane już są w `card.visits`, z
> polem `visitDate`) — np. nowy prop `futureCount` (liczba kropek z końca w stylu
> „zaplanowane") albo pełniejsza struktura z datami, zależnie od tego, co wygodniej
> zaimplementować bez łamania istniejącego API `VisitDots`. W `VisitDots.tsx` wypełnione
> kropki odpowiadające wejściom zrealizowanym (`visitDate <= dziś`) zostają w dzisiejszym
> stylu (`CATEGORY_COLOR_CLASS`), a kropki odpowiadające wejściom zaplanowanym
> (`visitDate > dziś`) dostają [ustalony wyżej styl — np. ta sama klasa koloru z
> `opacity-45`]. Zweryfikuj, czy `card.visits` z API przychodzi posortowane chronologicznie
> — jeśli nie, posortuj przed przekazaniem do `VisitDots`, żeby kolejność kropek (wypełnione
> od lewej) miała sens. [Jeśli zdecydowano rozszerzyć też `/cards`:] analogicznie w
> `CardListItem.tsx`, po rozszerzeniu `GET /api/cards` o niezbędne dane. Dodaj krótkie
> wyjaśnienie w `docs/user/faq.md`/`getting-started.md`, jeśli już opisują znaczenie kropek.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Sesja V6.3 ukończona (wymagana zależność — rozróżnienie zrealizowane/zaplanowane)
- [x] Zakres (szczegóły karnetu vs też lista) i styl koloru dla zaplanowanych wejść ustalone —
      obie rekomendacje przyjęte: tylko `cards/[id]/page.tsx` (`size="lg"`), opacity `.45`
- [x] Plan zaakceptowany
- [x] Kropki rozróżniają zrealizowane/zaplanowane wejścia w ustalonym zakresie —
      `VisitDots.tsx` dostał nowy opcjonalny prop `futureCount` (domyślnie `0`, więc
      `CardListItem.tsx`/`ArchivedCardItem.tsx` bez zmian zachowania); `cards/[id]/page.tsx`
      przekazuje `futureCount={card.usedVisits - card.realizedVisits}` — wykorzystuje już
      istniejące pole `realizedVisits` z Sesji V6.3 (COUNT wejść z `visitDate <= dziś`),
      zamiast liczyć daty ręcznie po stronie klienta
- [x] Sprawdzone w jasnym/ciemnym motywie — zweryfikowane end-to-end w przeglądarce
      2026-08-18: karnet z 1 wejściem zrealizowanym + 1 zaplanowanym pokazuje pierwszą kropkę
      pełną (`opacity: 1`), drugą przyciemnioną (`opacity: 0.45`), ten sam kolor kategorii w
      obu motywach
- [x] lint/test (206/206) + commit

### Sesja V6.7 (punkt 13) — Statystyki: raporty tygodniowe/miesięczne — wymaga decyzji przed startem

Kontekst: aplikacja zapisuje każde wejście (`Visit`, z datą) od Sesji 4, ale nigdzie nie ma
żadnego zbiorczego podsumowania — tylko licznik wykorzystanych wejść na pojedynczym karnecie.
Właścicielka chce „raporty wejść tygodniowe/miesięczne w formule przyjaznej i użytecznej" —
świadomie zostawiła to otwarte do zaprojektowania. Zanim odpalisz tę sesję, potwierdź zakres
(żeby Claude Code nie projektowało funkcji od zera bez akceptacji):

Rekomendowany zakres MVP tej funkcji (do potwierdzenia/skorygowania):
- Liczba wejść w bieżącym tygodniu i bieżącym miesiącu (suma po wszystkich kartach, aktywnych
  i archiwalnych).
- Rozbicie tej liczby po kategoriach (prosta lista/pasek: kategoria + liczba wejść + kropka
  koloru kategorii, tak jak grupowanie na `/cards`).
- Najczęściej odwiedzane miejsce w wybranym okresie (nazwa + liczba wejść).
- Bez wykresów/bibliotek do wizualizacji na start — proste liczby i listy, spójne stylistycznie
  z resztą UI (karty `rounded-[20px]`/`CARD_SURFACE_CLASS`).

Do ustalenia:
- Czy tydzień liczony kalendarzowo (pon–niedz) czy jako „ostatnie 7 dni"? Analogicznie
  miesiąc: kalendarzowy czy „ostatnie 30 dni"?
- Gdzie w nawigacji ma się pojawić — rekomendacja: nowy wiersz „Statystyki" w `/account`
  (ten sam wzorzec co istniejący wiersz „Pomoc", `helpRow`, prowadzący do nowej strony
  `/stats`), żeby nie dokładać piątej pozycji do `BottomTabBar.tsx` (dziś dokładnie 4 zakładki
  + FAB, dodanie piątej wymagałoby osobnej decyzji o układzie paska).

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Dodaj nowy endpoint `GET /api/stats?period=week|month` (autoryzacja jak reszta API —
> `deviceId`/`userId`), agregujący `Visit` bieżącej tożsamości w wybranym okresie
> [kalendarzowy/rolling — ustalone wyżej]: łączna liczba wejść, rozbicie po kategoriach,
> najczęściej odwiedzane miejsce. Dodaj stronę `/stats` w stylu wizualnym `/account`
> (karty `CARD_SURFACE_CLASS`, nagłówek z logo jak w Sesji V6.13) z przełącznikiem
> tydzień/miesiąc. Dodaj wiersz „Statystyki" w `/account` prowadzący do tej strony, wzorem
> istniejącego wiersza pomocy (`CircleHelp`/`helpRow`). Dodaj klucze i18n (PL/EN). Zaktualizuj
> `docs/API.md` i `docs/ARCHITECTURE.md` (nowy ekran).
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Zakres funkcji (metryki, granice okresu, miejsce w nawigacji) potwierdzony —
      rekomendowany zakres MVP przyjęty (łączna liczba wejść + rozbicie po kategoriach +
      najczęściej odwiedzane miejsce, bez wykresów); okresy kalendarzowo (pon–niedz,
      1.–ostatni dzień miesiąca), nie "ostatnie N dni"; wiersz „Statystyki" w `/account`
      prowadzący do `/stats`
- [x] Plan zaakceptowany
- [x] `GET /api/stats?period=week|month` z agregacją — uwzględnia wejścia ze wszystkich
      karnetów wywołującego (aktywnych i archiwalnych), filtr własności jak `/api/cards`
      (`ownerFilter`); bez rozróżnienia zrealizowane/zaplanowane (inaczej niż
      `realizedVisits` z Sesji V6.3) — pokazuje wszystko zapisane z datą w okresie
- [x] Strona `/stats` (przełącznik Tydzień/Miesiąc, karty w stylu `/account`), link z
      `/account` (wiersz nad „Pomoc")
- [x] i18n uzupełnione (PL/EN), `docs/API.md` i `docs/ARCHITECTURE.md` zaktualizowane
- [x] Zweryfikowane end-to-end w przeglądarce 2026-08-18: pusty stan na `/stats` (zakresy
      dat poprawne), potem testowy karnet + wejście pokazały poprawną agregację
      („Siłownia — 1", „FitZone Siłownia · 1 wejście") — testowe dane usunięte po weryfikacji
- [x] lint/test (221/221) + commit

### Sesja V6.8 (punkt 18) — Dokończenie designu „Miejsca" i „Doradca" analogicznie do „Karnety" — zależna od V6.4, V6.5, V6.13, V6.14

Kontekst: mimo wysokiej pracochłonności ta sesja powinna wyjść jedną z **ostatnich** w tej
fazie mimo swojej pozycji na liście — zależy od Sesji V6.4 (nazewnictwo), V6.5 (dodawanie
miejsc), V6.13 (logo) i V6.14 (filtr mobile), a te są niżej na tej liście, bo są mniej
pracochłonne. Nie stylować tych ekranów dwa razy — odpal tę sesję dopiero po tamtych
czterech. Dziś `/cards` ma spójny język wizualny (nagłówek z logo + `font-brand` tytuł 27px,
karty listy `rounded-[20px]` z cieniem — `CardListItem.tsx`, szkielety ładowania jako
pulsujące bloki). `/companies` i `/recommendations` mają dziś prostszy styl: zwykły
`text-2xl` nagłówek bez logo (do Sesji V6.13), elementy listy `rounded-2xl border` bez
cienia, stan ładowania jako sam tekst „…" zamiast szkieletu.

Prompt (skróć/dostosuj):
> Ujednolić wizualnie `/companies` i `/recommendations` względem `/cards`:
> 1) Nagłówek strony — `font-brand text-[27px] font-extrabold tracking-[-0.02em]` zamiast
>    dzisiejszego `text-2xl font-semibold`, logo nad tytułem (już dodane w Sesji V6.13).
> 2) Elementy list (miejsca na `/companies`, wyniki na `/recommendations`) — styl karty jak
>    `CardListItem.tsx` (`rounded-[20px] border border-black/[.07] shadow-[0_1px_2px_rgba(0,0,0,.04)]
>    bg-white dark:bg-zinc-900`) zamiast dzisiejszego `rounded-2xl border` bez cienia.
> 3) Stan ładowania — pulsujące szkielety (`animate-pulse rounded-[20px] bg-black/5`, wzorem
>    `/cards`) zamiast samego tekstu „…"/pustego stanu przed pierwszym wynikiem.
> Nie zmieniaj układu/logiki (filtrów, sortowania, pigułek kategorii, mapy) — to wyłącznie
> ujednolicenie stylu wizualnego. Zweryfikuj w przeglądarce (mobile i desktop, jasny/ciemny
> motyw) na wszystkich trzech ekranach obok siebie.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Sesje V6.4, V6.5 ukończone; V6.13 i V6.14 **nieukończone w momencie startu tej
      sesji** — zakres świadomie zawężony (patrz niżej), żeby nie blokować się na nich
- [x] Plan zaakceptowany (zawężony: bez punktu 1 — nagłówek z logo, zależny od V6.13;
      mobilny filtr kategorii na `/companies` zostaje osobno w V6.14)
- [x] Karty list i szkielety ładowania spójne z `/cards` na `/companies` i
      `/recommendations` (punkty 2 i 3 z pierwotnego promptu). Nagłówki stron **bez
      zmian** (`text-2xl font-semibold`, bez logo) — dorobić przy V6.13, żeby nie
      stylować dwa razy
- [x] Zweryfikowane wizualnie (mobile 375px + desktop, jasny + ciemny motyw) —
      `/companies` z realnymi danymi, `/recommendations` z zamockowaną geolokalizacją
      (lokalnie brak klucza Groq, więc realny wynik AI niedostępny — sam styl karty i
      szkielet zweryfikowane niezależnie od treści)
- [x] lint (czysty) / test (221/221) + commit — do potwierdzenia z użytkowniczką

### Sesja V6.9 (punkt 10) — Węższy układ na desktopie (wrażenie ekranu telefonu) — wymaga decyzji przed startem

Kontekst: dziś na desktopie treść stron jest już ograniczona (`max-w-screen-lg` w stopce,
`max-w-2xl` na `/cards`/`/companies`/`/recommendations`, `max-w-screen-sm` na `/account"),
ale **nagłówek** (`Header.tsx`) rozciąga się na pełną szerokość ekranu — stąd całość nie
sprawia wrażenia wąskiej „ramki telefonu", tylko szerokiego paska na górze i węższej treści
pod spodem. Żeby uzyskać spójne wrażenie wąskiego okna (jak na telefonie) na całej wysokości,
trzeba ograniczyć też pasek nagłówka, nie tylko treść, i zdecydować, jak potraktować
przestrzeń po bokach (inny odcień tła jako „ramka", czy po prostu pusty margines).

Przed startem ustal:
- Docelowa szerokość kolumny na desktopie (np. 480px — zbliżone do proporcji makiet z
  `v5b/design_handoff_mobile_pwa`, czy inna wartość)?
- Tło poza kolumną: neutralne/inny odcień (efekt „ramki telefonu" jak w niektórych
  emulatorach), czy zwykłe tło strony bez wyróżnienia?
- Czy zmiana dotyczy wszystkich stron (w tym `Header.tsx`/`Footer.tsx`), czy tylko
  głównych ekranów treści?

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Ogranicz szerokość całej aplikacji na desktopie (`md:` i wyżej) do [ustalona szerokość],
> wyśrodkowanej w poziomie — obejmij `Header.tsx` i `Footer.tsx` (dziś pełnej szerokości),
> nie tylko kontenery treści stron. [Jeśli ustalono tło-ramkę:] dodaj [ustalony
> kolor/odcień] tła na `<body>` poza tą kolumną, żeby całość sprawiała wrażenie wąskiego
> okna/telefonu na szerokim ekranie. Zweryfikuj na kilku szerokościach desktopowych (np.
> 1280px, 1920px) i upewnij się, że nic nie łamie się przy przejściu mobile/desktop (768px).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Docelowa szerokość i sposób potraktowania tła poza kolumną ustalone
- [ ] Plan zaakceptowany
- [ ] Header/Footer/treść ograniczone do tej samej szerokości na desktopie
- [ ] Sprawdzone na kilku szerokościach ekranu, w tym granica mobile/desktop (768px)
- [ ] lint/test + commit

### Sesja V6.10 (punkt 7) — Wyczyszczenie danych karnetów w ustawieniach (czyste konto)

Kontekst: `src/app/account/page.tsx` ma już wzorzec „wiersza" ustawień z ikoną i akcją
(przypomnienia, język, wygląd, pomoc — sekcja `CARD_SURFACE_CLASS` z `divide-y`). Właścicielka
chce dodać tam akcję kasującą **wszystkie karnety** (aktywne i archiwalne) bieżącej
tożsamości (`deviceId` lub zalogowany `userId` — ten sam mechanizm własności co reszta
`/api/cards/*`, `src/server/card-owner.ts`). To celowo dotyczy tylko karnetów (`Card` +
kaskadowo powiązane `Visit`, pliki voucherów w Storage) — **nie** kasuje firm/miejsc,
kategorii własnych ani ulubionych, bo te mogą być współdzielone z innymi urządzeniami/kontem
inaczej niż karnety.

To akcja nieodwracalna i niszcząca dane — zgodnie z zasadami bezpieczeństwa tego projektu
wymaga wyraźnego potwierdzenia, silniejszego niż zwykły `ConfirmDialog` używany np. przy
usuwaniu pojedynczego karnetu (np. wpisanie słowa potwierdzającego albo dodatkowy checkbox
„rozumiem, że to nieodwracalne") — rozstrzygnij formę potwierdzenia przy akceptacji planu.

Prompt (skróć/dostosuj):
> Dodaj nowy endpoint `DELETE /api/cards/all` (albo `POST /api/account/reset-cards` — wybierz
> konwencję spójną z resztą `docs/API.md`), autoryzowany jak reszta `/api/cards/*`, kasujący
> wszystkie karnety (i kaskadowo wejścia, pliki voucherów w Supabase Storage pod
> `cards/{id}/`) należące do bieżącej tożsamości (`deviceId`/`userId`) — nie dotyka firm,
> kategorii ani ulubionych. Dodaj w `src/app/account/page.tsx` nową sekcję/wiersz „Wyczyść
> dane karnetów" (osobno od pozostałych ustawień, wizualnie oznaczony jako destrukcyjny —
> wzorem `variant="danger"` z `Button.tsx`), z potwierdzeniem [ustalona forma wyżej,
> silniejsza niż zwykły `ConfirmDialog`]. Po potwierdzeniu: wywołanie endpointu, komunikat o
> sukcesie/błędzie, przekierowanie/odświeżenie widoku `/cards` jeśli użytkownik tam wróci.
> Dodaj klucze i18n (PL/EN). Zaktualizuj `docs/API.md`.
> Najpierw krótki plan (w tym dokładna forma potwierdzenia), poczekaj na akceptację.

- [ ] Forma potwierdzenia ustalona
- [ ] Plan zaakceptowany
- [ ] Endpoint kasujący karnety (+ wejścia + pliki voucherów) bieżącej tożsamości
- [ ] Akcja w `/account`, potwierdzenie silniejsze niż zwykłe usuwanie pojedynczego karnetu
- [ ] Zweryfikowane: firmy/kategorie/ulubione nietknięte po użyciu tej akcji
- [ ] `docs/API.md` i i18n zaktualizowane
- [ ] lint/test + commit

### Sesja V6.11 (punkt 2) — Usuń pole „Sposób pokazywania vouchera"

Kontekst: `CardForm.tsx` ma dziś dwa niezależne pola dotyczące vouchera, łatwe do pomylenia:
`voucherMode` (enum Prisma `single`/`per_visit`, etykieta „Sposób pokazywania vouchera",
select) i osobno `voucherInputMode` (tylko po stronie klienta: „tekst" albo „plik", pod
nagłówkiem „Voucher"). Sprawdzone w kodzie: **`voucherMode` nie steruje dziś żadnym realnym
zachowaniem ani wyświetlaniem** — jest zapisywany i odczytywany (`src/app/cards/[id]/page.tsx`),
ale nic nie różnicuje `single` od `per_visit` w UI. To właśnie to pole właścicielka chce
usunąć — zostaje tylko wybór tekst/plik (`voucherInputMode`), który realnie coś robi. (Nie
mylić z Sesją V6.12 niżej — ta dotyczy zupełnie innej części ekranu: podglądu pliku, nie tego
usuwanego pola.)

To zmiana schematu bazy (kolumna `voucher_mode` w `cards`, `docs/DATABASE.md` wiersz
`voucher_mode`) — wymaga migracji Prisma. Ponieważ pole i tak nie ma dziś żadnego efektu
widocznego dla użytkownika, rekomendacja: usunąć całkowicie (kolumna + enum + walidacja),
a nie tylko ukryć w UI — zgodnie z konwencją tego projektu, żeby nie zostawiać martwego kodu
(patrz Sesja 9, usunięcie zduplikowanego `isArchived`).

Prompt (skróć/dostosuj):
> Usuń pole `voucherMode` całkowicie: migracja Prisma usuwająca kolumnę `voucher_mode` z
> `cards` i enum `VoucherMode` ze schematu (`prisma/schema.prisma`), uruchomiona na **lokalnej
> bazie deweloperskiej, nigdy na produkcyjnym Supabase** (patrz zasada pracy tej fazy — local
> Postgres w Dockerze). Usuń pole z `CardFormValues`/`CardForm.tsx` (select „Sposób pokazywania
> vouchera" i cały ten blok), z `src/server/card-rules.ts` (`voucherModeRequired`, `readVoucherMode`,
> `voucherMode` z `CardInputCandidate`), z `CardWizard` i wszystkich miejsc budujących payload
> `POST`/`PATCH /api/cards` (`src/app/cards/page.tsx`, `src/app/cards/new/page.tsx`,
> `src/app/cards/[id]/page.tsx`). Usuń nieużywane klucze i18n (`voucherModeLabel`,
> `voucherModeOptions`, `errors.voucherModeRequired`) z `messages/pl.json`/`en.json`.
> Zaktualizuj `docs/DATABASE.md` (usuń wiersz `voucher_mode`) i `docs/API.md`, jeśli go
> wymienia. Zaktualizuj testy (`card-rules.test.ts`, testy API kart), które dziś zakładają
> obecność `voucherMode` w payloadzie.
> Najpierw krótki plan, poczekaj na akceptację.

- [x] Plan zaakceptowany
- [x] Migracja Prisma na bazie lokalnej (nie produkcyjnej)
- [x] Pole usunięte z formularza, walidacji, API, i18n, dokumentacji
- [x] Testy zaktualizowane, lint/test + commit

### Sesja V6.12 (dopisek 3) — Otwieranie pliku/zdjęcia vouchera na pełen ekran

Kontekst: mimo że w pierwotnej prośbie ten punkt nosił nazwę „Sposób pokazywania vouchera",
**nie** dotyczy pola `voucherMode` usuwanego w Sesji V6.11 wyżej — to inna część aplikacji:
podgląd wgranego pliku/zdjęcia vouchera na szczegółach karnetu (`VoucherFilePreview` w
`src/app/cards/[id]/page.tsx`). Dziś zdjęcie renderuje się jako mały, ograniczony podgląd
(`<img className="mt-2 max-h-64 rounded-lg" />`), bez możliwości powiększenia — plik PDF już
dziś otwiera się w pełni w nowej karcie (`target="_blank"`), więc dotyczy to praktycznie
tylko zdjęć (JPG/PNG/WebP).

Prompt (skróć/dostosuj):
> W `VoucherFilePreview` (`src/app/cards/[id]/page.tsx`) dodaj możliwość otwarcia zdjęcia
> vouchera na pełnym ekranie po kliknięciu w miniaturkę — prosty overlay/lightbox (nowy
> komponent, np. `ImageLightbox.tsx`) pokazujący zdjęcie w pełnym rozmiarze na ciemnym tle,
> zamykany kliknięciem poza obrazem, przyciskiem „X" i klawiszem Escape (ten sam wzorzec co
> `ConfirmDialog.tsx`/`HelpDialog.tsx` — zamykanie klik-poza/Escape). Miniaturka dostaje
> `role="button"`/`cursor-pointer` i czytelny `aria-label` sugerujący powiększenie. Plik PDF
> zostaje bez zmian (już otwiera się w pełni w nowej karcie). Dodaj klucze i18n (PL/EN) na
> `aria-label` miniaturki i przycisku zamknięcia. Sprawdź w przeglądarce na realnym pliku z
> bucketa `voucher-files-dev`, w jasnym i ciemnym motywie, na mobile i desktopie.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Kliknięcie w zdjęcie vouchera otwiera pełnoekranowy podgląd, zamykany klik-poza/Escape/X
- [ ] Sprawdzone na realnym pliku, mobile + desktop, jasny/ciemny motyw
- [ ] lint/test + commit

### Sesja V6.13 (punkty 5+17) — Logo: powiększenie i spójna obecność w nagłówku każdej zakładki

Kontekst: `Logo.tsx` renderuje nazwę marki poprawnie (`KARNET` wersalikami + `.asist`), ale
w kilku miejscach nazwa jest wpisana wprost jako tekst i to niekonsekwentnie: `Karnet.asist`
(małe „a" w "Karnet") występuje w `messages/pl.json`/`en.json` (treść pomocy, FAQ, podpowiedź
instalacji na iOS), `prisma/schema.prisma` (komentarz nagłówkowy), `README.md`,
`public/sw.js` (komentarz), `src/server/push-sender.ts` (**tytuł prawdziwego powiadomienia
push**, więc to realnie widoczne dla użytkownika), `src/app/manifest.ts` (`name`/`short_name`
PWA — widoczne przy instalacji na ekran główny) i `src/server/ai-recommendations.ts`
(fragment promptu do Groq, niewidoczny dla użytkownika, ale warto ujednolicić przy okazji).

Prompt (skróć/dostosuj):
> Znajdź wszystkie wystąpienia zapisu „Karnet.asist" (małe „a") w repo i zamień na
> „KARNET.asist" (wersaliki w części „KARNET"), zgodnie z `Logo.tsx` i tytułem w
> `layout.tsx` (`metadata.title`), które już mają poprawny zapis. Obejmij co najmniej:
> `messages/pl.json`, `messages/en.json`, `src/server/push-sender.ts` (tytuł powiadomienia
> push — realnie widoczny użytkownikowi), `src/app/manifest.ts` (`name`/`short_name` PWA),
> `public/sw.js`, `prisma/schema.prisma`, `README.md`, `src/server/ai-recommendations.ts`.
> Nie zmieniaj samego adresu e-mail/domeny, jeśli gdzieś występuje jako `karnet.asist...`
> (adresy/URL-e zwykle są małymi literami z innych powodów — sprawdź kontekst przed zmianą).
> Najpierw krótki plan (lista plików), poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Wszystkie wystąpienia poprawione, w tym tytuł powiadomienia push i manifest PWA
- [ ] lint/test + commit

### Sesja V6.14 (punkt 16) — „Miejsca": filtr po kategoriach na mobile

Kontekst: filtr po kategorii na `/companies` **już istnieje, ale tylko na desktopie**
(`<select>` w bloku `hidden ... md:flex`, `src/app/companies/page.tsx`). Wersja mobilna
(`md:hidden`) ma dziś tylko pole szukania po nazwie i pigułkę „Najbliżej mnie" — bez filtra
kategorii. To głównie brakujący element mobilnego UI, nie nowa logika (`filterCategoryId` i
`categoryOptions` już są policzone i używane przez desktop).

Prompt (skróć/dostosuj):
> Dodaj na mobilnej wersji `/companies` (`src/app/companies/page.tsx`, blok `md:hidden`)
> filtr po kategorii — wzorem poziomo przewijalnych pigułek kategorii z `/recommendations`
> (`selectCategory`/pigułki w tym pliku), korzystając z istniejącego stanu `filterCategoryId`
> i policzonych `categoryOptions`. Wybranie pigułki filtruje listę tak samo jak dzisiejszy
> select na desktopie — bez zmian w logice filtrowania/sortowania, tylko nowy element UI.
> Zweryfikuj w przeglądarce z emulacją mobilną (~375px) w jasnym i ciemnym motywie.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Filtr kategorii dostępny na mobile, działa tak samo jak dzisiejszy select desktopowy
- [ ] Sprawdzone w jasnym/ciemnym motywie na wąskim ekranie
- [ ] lint/test + commit

### Sesja V6.15 (punkty 8+9) — Data ważności zawsze opcjonalna + kolor karnetu bez limitu wg kategorii

Kontekst: dziś reguła biznesowa (`src/server/card-rules.ts`, `getCardInputErrors`,
`docs/DATABASE.md`) wymusza datę ważności dla typu `unlimited` (`expiryDateRequiredForUnlimited`)
— karnet bez limitu wejść bez daty ważności nigdy by się automatycznie nie zarchiwizował, stąd
ten wymóg. Właścicielka chce, żeby data ważności była zawsze opcjonalna, dla obu typów —
świadomie akceptując, że karnet `unlimited` bez daty po prostu nigdy się sam nie
zarchiwizuje (to nie błąd, tylko konsekwencja tej zmiany). Powiązane: `VisitDots.tsx`
renderuje dla karnetu bez limitu ikonę nieskończoności na **stałe w kolorze
`text-status-urgent` (czerwony)**, niezależnie od realnego statusu karnetu — to osobny
kolor niż `StatusBadge` obok nazwy (który już poprawnie liczy status z `getCardWarningStatus`).
Właścicielka chce, żeby ta ikona/etykieta używała koloru kategorii (`CATEGORY_COLOR_CLASS`,
tak jak kropki `VisitDots` dla karnetów z limitem), a nie czerwieni. (Nie mylić z Sesją V6.6 —
tam chodzi o kolor poszczególnych kropek wg daty wejścia u karnetów **z** limitem; tu chodzi
o ikonę nieskończoności u karnetów **bez** limitu).

Prompt (skróć/dostosuj):
> 1) W `src/server/card-rules.ts` usuń warunek `expiryDateRequiredForUnlimited` z
> `getCardInputErrors` (data ważności opcjonalna dla `limit` i `unlimited`). Usuń błąd
> `expiryDateRequiredForUnlimited` z `CardInputErrorCode` i wszystkich miejsc, które go
> używają (`CardForm.tsx` — `FIELD_FOR_ERROR`, hint pod polem daty (`expiryDateHintRequired`
> już niepotrzebny, zostaje tylko `expiryDateHintOptional` dla obu typów), `CardWizard/index.tsx`
> — `validateStep2`, i18n klucz błędu). W `src/server/card-status.ts`, `getExpiryStatus` —
> dla `expiryDate == null` zwróć `"brak terminu"` niezależnie od `type` (dziś tylko dla
> `limit`; ścieżka dla `unlimited` była martwa, bo reguła i tak wymuszała datę). Zaktualizuj
> `docs/DATABASE.md` (reguła `unlimited ⇒ expiryDate wymagane` → `zawsze opcjonalna`) i
> `docs/API.md`, jeśli opisuje ten sam wymóg. Zaktualizuj/dodaj testy w
> `src/server/card-rules.test.ts` i `src/server/card-status.test.ts` (jeśli istnieje) pod
> nowe zachowanie.
>
> 2) W `src/components/VisitDots.tsx` — dla `unlimited`/`total == null` zamień na stałe
> `text-status-urgent` na klasę koloru kategorii (`CATEGORY_COLOR_CLASS[color]`, ten sam
> mechanizm co przy kropkach karnetu z limitem), żeby ikona nieskończoności i etykieta
> „Bez limitu" miały kolor kategorii firmy/miejsca, nie czerwony. `StatusBadge` obok nazwy
> zostaje bez zmian — to on nadal odpowiada za realny status (ok/soon/urgent/wygasł/brak
> terminu).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Data ważności opcjonalna dla obu typów karnetu (backend + UI + walidacja klienta)
- [ ] `docs/DATABASE.md`/`docs/API.md` zaktualizowane
- [ ] Ikona/etykieta „Bez limitu" w kolorze kategorii, nie czerwonym
- [ ] Testy zaktualizowane, lint/test + commit

### Sesja V6.16 (punkt 4) — Ukryj zakładki „Aktywne"/„Archiwum" podczas dodawania/edycji karnetu

Kontekst: na desktopie `src/app/cards/page.tsx` renderuje przełącznik pigułek
„Aktywne"/„Archiwum" (linie ok. 375–390) i **pod nim**, na tej samej stronie, otwiera
formularz `CardForm` po kliknięciu „Dodaj karnet"/edycji/odnowienia (`formOpen`). Pigułki
zostają wtedy widoczne nad formularzem, mimo że nie mają znaczenia w trakcie wypełniania —
to o to chodzi w prośbie „usuń z ekranu Nowy karnet przyciski Aktywne/Archiwum". Na mobile
problem nie występuje — tam dodawanie karnetu to osobna trasa `/cards/new` (`CardWizard`,
bez pigułek).

Prompt (skróć/dostosuj):
> W `src/app/cards/page.tsx` ukryj wiersz z przełącznikiem pigułek „Aktywne"/„Archiwum",
> gdy `formOpen` jest `true` (formularz dodawania/edycji/odnowienia karnetu jest otwarty).
> Po zamknięciu formularza (`closeForm`) pigułki wracają. Nie zmieniaj samego zachowania
> zakładek ani stanu `tab` — to wyłącznie kwestia widoczności podczas edycji.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Pigułki niewidoczne, gdy formularz otwarty; wracają po zamknięciu
- [ ] lint/test + commit

### Sesja V6.17 (punkt 6) — Skróć tekst stopki — wymaga ustalenia treści przed startem

Kontekst: dzisiejsza stopka (`Footer.tsx` i analogiczny blok w `src/app/account/page.tsx`,
klucze `footer.*` w i18n) to: „Aplikację stworzyła Joanna Dropia, z pomocą AI (Claude
Sonnet 5)." + „Kontakt: [e-mail]" + „Wersja [numer]". Zanim odpalisz tę sesję, ustal
docelową treść (żeby Claude Code nie skracało na wyczucie) — np.:
- Zostaje tylko „Joanna Dropia" bez wzmianki o AI?
- Kontakt zostaje w pełnej formie, czy skrócony (sama ikona/link „mailto" bez widocznego
  adresu)?
- Wersja zostaje w obecnym formacie?

Prompt (skróć/dostosuj, po ustaleniu powyższego):
> Skróć treść stopki (`footer.authorLine` i sąsiednie klucze w `messages/pl.json`/`en.json`)
> do: [ustalona treść]. Zastosuj zmianę w obu miejscach, które dziś renderują tę treść:
> `Footer.tsx` (desktop/wspólna stopka) i stopka w `src/app/account/page.tsx` (mobile) — to
> ten sam zestaw kluczy i18n, więc zmiana w słowniku wystarczy dla obu, ale zweryfikuj
> wizualnie oba miejsca po zmianie.
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Docelowa treść stopki ustalona
- [ ] Plan zaakceptowany
- [ ] Stopka skrócona w obu miejscach (`Footer.tsx`, `/account`), i18n PL/EN
- [ ] lint/test + commit

### Sesja V6.18 (punkt 11) — Ujednolicenie pisowni „KARNET.asist"

Kontekst: `Logo.tsx` renderuje nazwę marki poprawnie (`KARNET` wersalikami + `.asist`), ale
w kilku miejscach nazwa jest wpisana wprost jako tekst i to niekonsekwentnie: `Karnet.asist`
(małe „a" w "Karnet") występuje w `messages/pl.json`/`en.json` (treść pomocy, FAQ, podpowiedź
instalacji na iOS), `prisma/schema.prisma` (komentarz nagłówkowy), `README.md`,
`public/sw.js` (komentarz), `src/server/push-sender.ts` (**tytuł prawdziwego powiadomienia
push**, więc to realnie widoczne dla użytkownika), `src/app/manifest.ts` (`name`/`short_name`
PWA — widoczne przy instalacji na ekran główny) i `src/server/ai-recommendations.ts`
(fragment promptu do Groq, niewidoczny dla użytkownika, ale warto ujednolicić przy okazji).

Prompt (skróć/dostosuj):
> Znajdź wszystkie wystąpienia zapisu „Karnet.asist" (małe „a") w repo i zamień na
> „KARNET.asist" (wersaliki w części „KARNET"), zgodnie z `Logo.tsx` i tytułem w
> `layout.tsx` (`metadata.title`), które już mają poprawny zapis. Obejmij co najmniej:
> `messages/pl.json`, `messages/en.json`, `src/server/push-sender.ts` (tytuł powiadomienia
> push — realnie widoczny użytkownikowi), `src/app/manifest.ts` (`name`/`short_name` PWA),
> `public/sw.js`, `prisma/schema.prisma`, `README.md`, `src/server/ai-recommendations.ts`.
> Nie zmieniaj samego adresu e-mail/domeny, jeśli gdzieś występuje jako `karnet.asist...`
> (adresy/URL-e zwykle są małymi literami z innych powodów — sprawdź kontekst przed zmianą).
> Najpierw krótki plan (lista plików), poczekaj na akceptację.

- [ ] Plan zaakceptowany
- [ ] Wszystkie wystąpienia poprawione, w tym tytuł powiadomienia push i manifest PWA
- [ ] lint/test + commit

### Sesja V6.19 (punkt 12) — Numer wersji `V6_260817`

Kontekst: **odpalana jako ostatnia sesja całej Fazy V6b**, po wszystkich powyższych — numer
wersji ma sens dopiero, gdy oznacza faktyczny stan po zakończeniu tego zestawu zmian. Stała
`APP_VERSION` jest dziś duplikowana w dwóch miejscach (`src/components/Footer.tsx` i
`src/app/account/page.tsx`, obie `"v5_260809"`) — przy okazji warto to scalić w jedno źródło,
żeby kolejna aktualizacja numeru nie wymagała pamiętania o dwóch plikach.

Prompt (skróć/dostosuj):
> Przenieś stałą `APP_VERSION` do jednego wspólnego miejsca (np. `src/lib/app-version.ts`),
> importowanego przez `Footer.tsx` i `src/app/account/page.tsx` zamiast dwóch osobnych
> lokalnych stałych. Ustaw wartość na `"V6_260817"`. Zweryfikuj, że numer wersji wyświetla
> się poprawnie w obu miejscach (stopka desktopowa i `/account` na mobile).
> Najpierw krótki plan, poczekaj na akceptację.

- [ ] Wszystkie sesje V6.2–V6.18 ukończone (ten numer wersji ma sens dopiero po nich)
- [ ] Plan zaakceptowany
- [ ] `APP_VERSION` w jednym wspólnym miejscu, wartość `V6_260817`
- [ ] Zweryfikowane w obu miejscach wyświetlania
- [ ] lint/test + commit

---

### Podsumowanie Fazy V6b — wszystkie sesje od najbardziej do najmniej pracochłonnej

Dla orientacji przed rozpoczęciem — pełna lista w kolejności szacowanej pracochłonności
(Sesja V6.1 jest fizycznie opisana wyżej, pod „Faza V6 — logowanie", ale w tym rankingu
należy do najcięższej grupy):

**Bardzo duże:**
1. **Sesja V6.1 — Dodatkowa metoda logowania.** Hasło i/lub magic link obok Google OAuth,
   nowe ekrany rejestracji/logowania, rozszerzenie `User` w Prisma.
2. **Sesja V6.2 — Wiele plików/zdjęć vouchera na karnet.** Nowy model `CardVoucherFile`,
   migracja, wielokrotny upload/usuwanie, siatka miniaturek w formularzu.
3. **Sesja V6.3 — Archiwizacja: wejścia z datą przyszłą.** Karnet trafia do archiwum
   dopiero, gdy minie data ostatniego (nawet zaplanowanego) wejścia, nie od razu po
   osiągnięciu limitu.
4. **Sesja V6.5 — Miejsca: dodawanie nowych miejsc.** Nowe pole adresu w bazie, formularz
   „Dodaj miejsce" z wyszukiwarką Google Places lub ręcznie, wybór/tworzenie kategorii.

**Duże:**
5. **Sesja V6.6 — Kolorowanie kropek: zrealizowane vs zaplanowane wejścia.** Kropki wejść na
   szczegółach karnetu w innym odcieniu dla wejść z przyszłą datą.
6. **Sesja V6.7 — Statystyki: raporty tygodniowe/miesięczne.** Nowy endpoint agregujący
   wejścia + strona `/stats` z podsumowaniem, link z `/account`.
7. **Sesja V6.8 — Dokończenie designu „Miejsca" i „Doradca".** Nagłówki, karty list i
   szkielety ładowania ujednolicone z `/cards`.

**Średnie:**
8. **Sesja V6.9 — Węższy układ na desktopie.** Header/Footer/treść ograniczone do wspólnej
   szerokości, żeby całość wyglądała jak wąskie okno telefonu.
9. **Sesja V6.10 — Wyczyszczenie danych karnetów w ustawieniach.** Nowy endpoint kasujący
   wszystkie karnety bieżącej tożsamości, z silnym potwierdzeniem.
10. **Sesja V6.11 — Usuń pole „Sposób pokazywania vouchera".** Migracja usuwająca
    nieużywany enum `voucherMode` z `CardForm`, API i bazy.
11. **Sesja V6.4 — „Firmy" → „Miejsca".** Zmiana tekstu w i18n (PL/EN) w wielu miejscach,
    bez zmian nazw kodowych.
12. **Sesja V6.12 — Otwieranie pliku/zdjęcia vouchera na pełen ekran.** Nowy lightbox po
    kliknięciu w miniaturkę zdjęcia na szczegółach karnetu.

**Małe:**
13. **Sesja V6.13 — Logo: powiększenie i spójna obecność w nagłówku każdej zakładki.**
14. **Sesja V6.14 — Miejsca: filtr po kategoriach na mobile.**
15. **Sesja V6.15 — Data ważności zawsze opcjonalna + kolor karnetu bez limitu wg kategorii.**

**Bardzo małe:**
16. **Sesja V6.16 — Ukryj zakładki „Aktywne"/„Archiwum" podczas dodawania/edycji karnetu.**
17. **Sesja V6.17 — Skróć tekst stopki.**
18. **Sesja V6.18 — Ujednolicenie pisowni „KARNET.asist".**
19. **Sesja V6.19 — Numer wersji `V6_260817`.** Zawsze ostatnia — niezależnie od
    pracochłonności, ma sens dopiero po wszystkich pozostałych.

---

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
