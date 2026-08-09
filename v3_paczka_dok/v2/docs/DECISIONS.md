# Decyzje architektoniczne (ADR) — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

Format: co zdecydowano, dlaczego, jakie były alternatywy. Wpisy dodawane chronologicznie,
nie edytowane wstecz — jeśli decyzja się zmienia, dopisywany jest nowy wpis z odnośnikiem
do poprzedniego.

## ADR-001 — Next.js + TypeScript jako baza stosu

**Status:** potwierdzone.
**Decyzja:** frontend i backend (API) w jednym projekcie Next.js (App Router), TypeScript.
**Uzasadnienie:** jeden framework upraszcza start małego projektu solo; TypeScript ułatwia
późniejsze współdzielenie typów z aplikacją mobilną (React Native).
**Alternatywy rozważone:** osobny SPA (Vite/React) + osobne API (Node/Express) — odrzucone
jako niepotrzebna złożoność na start; Remix — porównywalne, ale mniejsza społeczność.

## ADR-002 — PostgreSQL + Prisma

**Status:** potwierdzone.
**Decyzja:** relacyjna baza PostgreSQL, dostęp przez Prisma ORM.
**Uzasadnienie:** dane domenowe (Karnet–Firma–Wejście) są relacyjne z jasnymi kluczami
obcymi; Prisma daje typowany dostęp spójny z resztą kodu TS.
**Alternatywy rozważone:** baza dokumentowa (Firestore/Mongo) — łatwiejszy start, ale
gorzej pasuje do zapytań typu „karnety danej firmy”, „historia wejść karnetu” z filtrami.

## ADR-003 — Konto opcjonalne, auth token-based

**Status:** potwierdzone (wynika wprost z briefu produktowego); zaimplementowane w Sesji
14 (Google OAuth przez Auth.js/NextAuth).
**Decyzja:** żadna funkcja rdzeniowa nie wymaga logowania; karnety mogą istnieć przypięte
do `device_id` zamiast `user_id`. Auth (gdy używane) — tokeny JWT, nie cookie sesyjne, pod
kątem przyszłej aplikacji mobilnej.
**Konsekwencja:** model danych (`cards.user_id` nullable) i cała logika API muszą wspierać
tryb „bez konta” jako pełnoprawny, nie jako wyjątek.
**Nota implementacyjna (Sesja 14):** NextAuth skonfigurowany z `session: { strategy: "jwt" }`
— sesja to podpisany token, nie wiersz w tabeli `sessions` (ta tabela istnieje w schemacie
tylko dlatego, że wymaga jej interfejs adaptera Prisma, w praktyce pusta). To najbliższe
realnie dostępne w NextAuth podejście do „token-based, nie cookie sesyjne” — sam handshake
OAuth w przeglądarce z natury i tak przechodzi przez cookie w trakcie logowania, czego nie
da się całkowicie wyeliminować w web-owym flow logowania.
**Konto i tryb bez konta to trwale rozłączne przestrzenie danych (poprawka po Sesji 14):**
pierwsza wersja tej sesji miała `POST /api/auth/link-device`, jednorazowo przenoszący przy
logowaniu karnety bieżącego urządzenia na konto. Usunięte — okazało się to sprzeczne z
oczekiwaniem, że dane wprowadzone bez konta pozostają dostępne bez konta na zawsze, a dane
wprowadzone na koncie nigdy nie przeciekają do trybu bez konta (patrz `API.md`, sekcja
"Karnety"). Synchronizacji między urządzeniami dla danych wprowadzonych **przed**
założeniem konta świadomie nie ma — to by wymagało jakiejś formy migracji, a każda migracja
łamie rozłączność przestrzeni.

## ADR-004 — Google Maps: integracja realna, po stronie przeglądarki

**Status:** potwierdzone (Sesja V4.1, 2026-08-09).
**Decyzja:** w prototypie mapa i wybór firmy z Google Maps były zaślepione (statyczna
siatka + mockowa lista miejsc). W wersji produkcyjnej: wyszukiwanie firmy przez Google
Places API (New) w kreatorze karnetu (`CardForm.tsx`) i mapa lokalizacji (Google Maps
JavaScript API) na `/companies/:id`, oba po stronie przeglądarki przez oficjalną
bibliotekę `@vis.gl/react-google-maps` — nie przez serwerowy proxy. Klucz
(`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) trafia więc do klienta z natury; bezpieczeństwo
zapewnia ograniczenie klucza w Google Cloud Console do dokładnie dwóch interfejsów (Maps
JavaScript API, Places API (New)), a przed produkcją dodatkowo do domeny produkcyjnej
(HTTP referrer restriction) — nie tajność samego klucza. Sortowanie/filtrowanie po
dystansie od użytkownika dzieje się w całości po stronie klienta, bez wywołań do API.
**Uzasadnienie:** integracja wymagała klucza API, billingu i limitów kosztowych —
świadomie odłożona do etapu produkcyjnego, żeby nie blokować reszty budowy MVP; ten etap
właśnie się zaczął. Architektura po stronie przeglądarki wybrana zamiast wcześniej
rozważanego serwerowego proxy — mniej własnego kodu do utrzymania, standardowa,
powszechna praktyka dla tego typu integracji, wspierana natywnie przez oficjalną
bibliotekę Google.
**RODO (Sesja V4.1):** sortowanie „najbliżej mnie" na `/companies` korzysta z
`navigator.geolocation` (wbudowana w przeglądarkę, nie Google Geolocation API), wyłącznie
za zgodą użytkownika (natywny prompt przeglądarki). Pozycja użytkownika żyje tylko w
pamięci przeglądarki (stan React) na czas sesji — nigdy nie jest wysyłana do API ani
zapisywana w bazie. Odmowa zgody lub brak wsparcia przeglądarki nie blokuje żadnej innej
funkcji strony.
**Zrobione przed produkcją:** projekt Google Cloud założony, Maps JavaScript API +
Places API (New) włączone, klucz ograniczony do tych dwóch interfejsów.
**Do zrobienia przed produkcją:** ustawić budżet/limit na koncie Google Cloud (świadomie
odłożone na czas developmentu — projekt działa na darmowym okresie próbnym, patrz
`plan-pracy-claude-code.md`), ograniczyć klucz do domeny produkcyjnej.

## ADR-005 — Zakres MVP: bez płatności, rezerwacji i integracji z operatorami

**Status:** potwierdzone (wprost z briefu:
`Karta_pomyslu_Karnet_asist.docx`, sekcja „czego świadomie NIE robię”).
**Decyzja:** brak integracji płatności/sprzedaży karnetów w aplikacji, brak rezerwacji
zajęć, brak natywnej aplikacji mobilnej na starcie, brak automatycznego rozliczania z
operatorami typu Multisport, brak rozpoznawania zdjęć (OCR) w MVP.
**Uzasadnienie:** utrzymanie zakresu MVP wąskiego i wykonalnego; funkcje te wymagałyby
integracji z zewnętrznymi systemami płatności/partnerów, co znacząco zwiększa złożoność i
czas wdrożenia.

## ADR-006 — Usuwanie karnetu: potwierdzenie w UI, rekomendacja soft-delete w danych

**Status:** proponowane (UI już potwierdzone w prototypie v5+).
**Decyzja:** usunięcie karnetu zawsze poprzedzone dialogiem potwierdzającym. W bazie
danych rekomendowane miękkie usuwanie (`deleted_at`) zamiast trwałego `DELETE`, aby
umożliwić odzyskanie przy pomyłce użytkownika.

## ADR-007 — Weryfikacja `device_id`: podpisany token urządzenia (JWT)

**Status:** potwierdzone.
**Decyzja:** tryb bez konta nie identyfikuje urządzenia po surowym `device_id`
przekazywanym w nagłówku. Zamiast tego: przy pierwszym uruchomieniu aplikacji klient
wywołuje `POST /api/device/register`, który generuje `deviceId` (UUID) i zwraca go
**podpisany** jako JWT (`HS256`, sekret `DEVICE_TOKEN_SECRET`, wyłącznie po stronie
serwera, TTL ok. 180 dni z auto-odnowieniem w tle). Klient przechowuje ten token
lokalnie i wysyła go w nagłówku `Authorization: Device <token>` przy każdym żądaniu.
API weryfikuje podpis tokena (np. w `middleware.ts`) i dopiero po pozytywnej
weryfikacji wyciąga z niego zaufany `deviceId`, używany dalej do zapytań do bazy i
polityk RLS.
**Uzasadnienie:** surowy `device_id` nie jest sekretem — może wyciec przez logi,
referer, podsłuchanie ruchu na niezaufanej sieci lub podejrzenie na współdzielonym
urządzeniu; sam UUID v4, mimo trudnej zgadywalności, nie chroni przed użyciem
przechwyconej wartości. Podpis kryptograficzny sprawia, że sfałszowanie tokena wymaga
znajomości sekretu serwera, nie tylko poznania wartości `deviceId`.
**Alternatywy rozważone:**
- surowy `device_id` bez podpisu — odrzucone, brak realnej ochrony (patrz wyżej);
- sesja/cookie httpOnly — bezpieczniejsze wobec XSS niż token w `localStorage`, ale
  gorzej pasuje pod przyszłą aplikację natywną (React Native nie ma tych samych
  mechanizmów cookie co przeglądarka) — odrzucone jako niespójne z `ADR-003`
  (auth token-based pod kątem mobile).
**Konsekwencja:** ten sam mechanizm tokenowy będzie później współdzielony z auth dla
kont zalogowanych (`ADR-003`), więc mobile (patrz `MOBILE_ROADMAP.md`) dostaje go bez
dodatkowej pracy. Wymaga nowego endpointu `POST /api/device/register` (patrz
`API.md`) oraz zmiennej środowiskowej `DEVICE_TOKEN_SECRET` (patrz `SETUP.md`).

## RODO — dane osobowe przetwarzane przez aplikację

**Status:** proponowane, do potwierdzenia przed pierwszym wdrożeniem produkcyjnym.
Nie jest to porada prawna — przed publikacją zweryfikować z prawnikiem/specjalistą RODO,
szczególnie zakres klauzuli informacyjnej i ewentualną potrzebę DPIA.

**Jakie dane aplikacja przetwarza:**

| Dana | Gdzie (tabela) | Charakter |
|---|---|---|
| E-mail | `users.email` | dane osobowe, tylko przy założeniu konta (opcjonalne) |
| Zdjęcie/plik vouchera lub QR | `cards.voucher_file_url` | może pośrednio zawierać dane osobowe (np. imię i nazwisko na voucherze, numer karty klubowej) |
| Notatka do wejścia | `visits.note` | tekst dowolny wpisywany przez użytkownika — **potencjalnie wrażliwa**, jeśli użytkownik wpisze tam informację o stanie zdrowia (np. przy wejściu na fizjoterapię/masaż) |
| Lokalizacja firmy (`lat`/`lng`) | `companies` | dane firmy/partnera, nie dane osobowe użytkownika |
| `device_id` | `cards.device_id` | identyfikator urządzenia, dana osobowa pośrednia (podobnie jak IP) |

**Podstawa prawna przetwarzania (art. 6 RODO):**
- Tryb bez konta (`device_id`): realizacja funkcji aplikacji, na której użytkownik
  świadomie polega — art. 6 ust. 1 lit. b (niezbędność do wykonania usługi, na którą
  użytkownik się umówił, korzystając z aplikacji) lub lit. f (uzasadniony interes, przy
  minimalnym zakresie danych).
- Konto (e-mail): art. 6 ust. 1 lit. b — niezbędne do świadczenia usługi synchronizacji,
  o którą użytkownik świadomie prosi zakładając konto.
- Zgoda (art. 6 ust. 1 lit. a) nie jest tu podstawą domyślną — dane rdzeniowe (karnety,
  wejścia) nie wymagają zgody, bo są niezbędne do działania funkcji, z której użytkownik
  korzysta z własnej inicjatywy.

**Minimalizacja danych (art. 25 RODO — privacy by design/default):**
- Konto pozostaje opcjonalne (`ADR-003`) — to już realizuje zasadę minimalizacji: kto nie
  chce zostawiać e-maila, nie musi.
- Notatka do wejścia (`visits.note`) nie powinna być polem sugerującym wpisywanie danych
  wrażliwych — rozważyć krótki placeholder w UI typu "np. 'zmiana godziny'" zamiast
  otwartego "dodaj notatkę", żeby nie zachęcać do wpisywania informacji o zdrowiu.
- Nie zbierać żadnych danych, które nie są potrzebne do samej funkcji śledzenia karnetu
  (np. brak trackingu analitycznego bez osobnej zgody, jeśli zostanie dodany w przyszłości).

**Podmioty przetwarzające (art. 28 RODO) — wymagają umowy powierzenia danych (DPA):**
- Hosting bazy danych (Neon/Supabase) i hosting aplikacji (Vercel) — przechowują dane
  osobowe użytkowników.
- Storage plików (Supabase Storage / Cloudflare R2) — przechowuje zdjęcia voucherów.
- Google (Maps/Places API) — otrzymuje zapytania o lokalizację/nazwę firmy; **nie**
  powinien otrzymywać danych osobowych użytkownika (e-mail, notatki) w treści zapytań.

Przed pierwszym wdarożeniem produkcyjnym: sprawdzić, czy wybrani dostawcy oferują
standardową umowę powierzenia (większość dużych dostawców cloud ma gotowy DPA do
zaakceptowania online) i czy przetwarzają dane w UE/EOG lub na podstawie odpowiedniego
mechanizmu transferu poza EOG.

**Retencja i usuwanie danych:**
- Konto i powiązane karnety: usuwane na żądanie użytkownika (prawo do usunięcia, art. 17).
- Soft-delete (`deleted_at`, `ADR-006`) — ustalić docelowy czas, po którym dane są
  usuwane trwale (np. 30 dni od `deleted_at`), a nie trzymane bezterminowo "na wszelki
  wypadek".

**Prawa osoby, której dane dotyczą:** dostęp, sprostowanie, usunięcie, ograniczenie
przetwarzania, przenoszenie danych, sprzeciw — muszą być technicznie możliwe do
zrealizowania (np. eksport/usunięcie konta z poziomu UI lub przez kontakt), nie tylko
zapisane w regulaminie.

**Model AI:** aplikacja **nie wysyła** danych użytkownika do zewnętrznego modelu AI w
runtime — Google Maps/Places to nie jest model AI. Jeśli w przyszłości pojawi się funkcja
oparta o LLM (np. rozpoznawanie danych ze zdjęcia vouchera), wymaga to osobnego wpisu ADR
z jawną informacją: jakie dane trafiają do dostawcy modelu, w jakim celu, oraz komunikatu
dla użytkownika przed użyciem tej funkcji (nie retroaktywnie w regulaminie).
