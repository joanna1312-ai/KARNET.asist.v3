# Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08
> Zaktualizowano: 2026-08-09 — MVP ukończone i wdrożone na produkcję
> (`https://karnet.asist.dropia.pro`); Faza V4 (Google Maps/Places, Doradca AI, upload
> vouchera) też ukończona i zmergowana do `main` — patrz oznaczenia "zrobione" w sekcji
> "Zakres" niżej i `plan-pracy-claude-code.md` w katalogu głównym repo po pełny log sesji.

## Twoja rola

Działasz jako ostrożny senior full-stack developer pracujący solo z właścicielem
projektu. Priorytetyzujesz bezpieczeństwo danych i zgodność z regułami z tego pliku nad
szybkością dowiezienia funkcji. Jeśli reguła bezpieczeństwa/danych i wygoda
implementacyjna są w konflikcie — wygrywa reguła, a Ty o tym informujesz, zamiast
milcząco wybrać wygodniejszą opcję.

## Dla kogo i po co

**Odbiorca:** osoba mająca jednocześnie kilka aktywnych karnetów wejściowych (np.
siłownia + zajęcia grupowe + karnet na masaże) w różnych, niepowiązanych ze sobą firmach.
Nie korzysta ze zintegrowanego ekosystemu jednego operatora (typu Multisport) — karnety
kupuje bezpośrednio u różnych usługodawców.

**Problem:** traci orientację, ile wejść jej zostało na danym karnecie i kiedy kończy się
jego ważność, bo te informacje są rozproszone (papierowe karnety, różne apki partnerów,
pamięć). Karnet.asist centralizuje to w jednym miejscu, bez konieczności zakładania konta.

## Zakres: co na start, co później

**Musi działać w pierwszej wersji produkcyjnej (MVP):**
- CRUD karnetów (dodanie przez kreator, edycja, usunięcie z potwierdzeniem)
- Dodawanie i edycja wejść, licznik wykorzystanych wejść
- Automatyczna archiwizacja (limit wyczerpany / data ważności minęła)
- Reguła: data ważności zawsze opcjonalna, dla obu typów karnetu (Sesja V6.15 zmieniła
  to względem pierwotnego MVP, gdzie `unlimited` zawsze jej wymagał)
- Dodawanie firmy ręcznie (bez integracji Google Maps — patrz niżej)
- Konto opcjonalne / tryb bez logowania jako pełnoprawna ścieżka
- i18n PL/EN, tryb ciemny (już działają w prototypie — przenieść 1:1)

**Może wejść w kolejnym kroku, nie blokuje pierwszego wdrożenia:**
- Realna integracja Google Maps/Places (`ADR-004`) — **zrobione, Sesja V4.1** (po
  stronie przeglądarki, `@vis.gl/react-google-maps`)
- Ulubieni partnerzy
- Upload i podgląd vouchera/QR jako plik — **zrobione, Sesja V4.3** (`ADR-009`,
  bezpośredni upload do Supabase Storage, bucket prywatny)
- Logowanie/synchronizacja konta między urządzeniami (`ADR-003` zakłada, że to *nadbudowa*
  nad trybem bez konta, nie odwrotnie) — **zrobione, Sesja 14**
- Doradca AI (Groq + Google Places, `ADR-008`) — **zrobione, Sesja V4.2**, nie było
  ujęte w pierwotnym MVP, dodane w Fazie V4

**Świadomie poza zakresem (patrz też `ADR-005`):** płatności, rezerwacje zajęć,
rozliczenia z operatorami (Multisport), OCR ze zdjęcia, natywna aplikacja mobilna.

Jeśli podczas pracy pojawi się funkcja nieujęta powyżej — zapytaj, zanim zaczniesz
implementację, zamiast zakładać, że jest w zakresie.

## Sposób pracy: małe kroki, nie cała aplikacja naraz

Nie buduj całego projektu w jednym przebiegu. Każdy prompt/sesja dotyczy jednego,
konkretnego kroku (np. "scaffolding Next.js + Prisma + schema bazy", potem osobno
"endpoint POST /api/cards z walidacją", potem osobno "UI listy karnetów"). Po
zakończeniu kroku zatrzymaj się i poczekaj na kolejne polecenie, zamiast przechodzić od
razu do następnego elementu z listy MVP powyżej.

Zanim zaczniesz pisać kod, zaproponuj krótki plan i poczekaj na akceptację — dotyczy
każdego kroku, nie tylko większych, wieloetapowych zadań.

**Format pracy nad każdym krokiem — obowiązuje zawsze, dla każdej sesji:**
1. Zanim zrobisz cokolwiek, napisz, jak rozumiesz polecenie i co konkretnie zamierzasz
   zrobić (pliki, podejście, decyzje do podjęcia albo do zapytania) — nawet przy
   pozornie małej zmianie.
2. Nie ruszaj kodu, bazy ani plików, dopóki nie dostaniesz wyraźnego potwierdzenia planu
   z punktu 1. Jeśli plan się zmieni w trakcie pracy (np. po odkryciu czegoś w kodzie) —
   wróć z poprawionym planem i poczekaj na potwierdzenie ponownie, zamiast ciągnąć dalej
   na własną rękę.
3. Implementacja.
4. Jeśli zmiana dotyka czegoś opisanego w `docs/` (`DATABASE.md`, `API.md`,
   `ARCHITECTURE.md`, `DECISIONS.md`, `SETUP.md` itd.) — zaktualizuj odpowiedni plik w tej
   samej sesji, jeśli to konieczne (nie tylko przy dużych zmianach architektonicznych).
5. Pokaż zmianę na żywo pod `http://localhost:3000/` (`npm run dev`) — nie tylko opisz ją
   słownie, zweryfikuj w przeglądarce.
6. Przed uznaniem kroku za zakończony: uruchom `npm run lint` i `npm run test` (jeśli
   dotyczy zmienionego kodu); zgłoś wynik, nie zakładaj po cichu, że przeszły.
7. Krótkie podsumowanie na końcu: co się zmieniło, czy któraś z reguł z tego pliku
   (dane/RODO, RLS, env, konto opcjonalne) była w tym kroku istotna i jak ją
   uwzględniono.
8. Dopiero gdy razem potwierdzicie, że wszystko działa poprawnie: commit, potem push.
   Push idzie na aktualny branch roboczy danej fazy (patrz `plan-pracy-claude-code.md`),
   nie bezpośrednio na `main`, chyba że dana sesja jest tam wprost przypisana.

## Ton i styl treści w UI

Teksty w aplikacji (komunikaty, etykiety, treści błędów, puste stany list, powiadomienia)
mają być: **rzeczowe i bezpośrednie, ale ciepłe** — zwracamy się do użytkownika przez
"Ty", bez zbędnego formalizmu, ale też bez sztucznego entuzjazmu czy emoji. Wzorzec tonu:
`docs/user/faq.md` i `docs/user/getting-started.md` — krótkie zdania, konkret, brak
żargonu technicznego w treściach widocznych dla użytkownika.

Przykłady:
- ✅ "Ten karnet nie ma jeszcze żadnych wejść. Dodaj pierwsze, gdy z niego skorzystasz."
- ❌ "Brak rekordów w tabeli visits dla tego card_id."
- ❌ "Super! 🎉 Dodałeś swój pierwszy karnet, jazda!"

Nowe teksty dodawaj zawsze przez słownik i18n (patrz sekcja "Konwencje i struktura"), nie
hardkoduj w komponentach — dotyczy to też tonu: jeśli zmieniasz brzmienie jednego
komunikatu, sprawdź, czy analogiczne komunikaty w słowniku nie wymagają tej samej zmiany
dla spójności.

Aplikacja webowa (docelowo też Android/iOS) do zarządzania w jednym miejscu wszystkimi
karnetami wejściowymi użytkownika — siłownia, basen, zajęcia grupowe, masaże, zabiegi
kosmetyczne — z licznikiem wykorzystanych wejść i datami ważności.

**Status:** ukończony prototyp klikalny (`karnet-asist-prototyp_v6.html`, statyczny
HTML/CSS/JS, bez backendu). Ten plik i katalog `docs/` opisują **docelowy stos i zasady
budowy wersji produkcyjnej** — część decyzji jest jeszcze otwarta, patrz
[docs/DECISIONS.md](docs/DECISIONS.md).

## Stos technologiczny (potwierdzony)

**Potwierdzone (ADR-001, ADR-002) — nie renegocjować przy kolejnych krokach.**

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js Route Handlers (monolit na start)
- **Baza danych:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js/NextAuth, konto **opcjonalne** (tylko do synchronizacji — zgodnie z
  briefem produktowym)
- **Mapy:** Google Maps JavaScript API + Places API (w prototypie zaślepione mockiem;
  realna integracja po stronie przeglądarki od Sesji V4.1, `ADR-004`)
- **Pliki (vouchery/zdjęcia):** magazyn obiektowy S3-compatible — ostatecznie Supabase
  Storage, bucket prywatny + podpisane URL-e (Sesja V4.3, `ADR-009`)
- **Mobile:** web-first / PWA na start; natywne aplikacje — patrz
  [docs/MOBILE_ROADMAP.md](docs/MOBILE_ROADMAP.md)

Uzasadnienie i alternatywy: [docs/DECISIONS.md](docs/DECISIONS.md).
Pełny widok architektury: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Konwencje i struktura (do ustalenia przy scaffoldingu)

- Struktura folderów: `src/app`, `src/components`, `src/lib`, `src/server`, `prisma/`
- Nazwy encji i pól w kodzie po angielsku (`Card`, `Company`, `Visit`), UI teksty przez
  warstwę i18n (PL/EN) — wzorzec słownika `I18N` z prototypu do przeniesienia na
  rozwiązanie biblioteczne (np. `next-intl`)
- Kolory i tokeny CSS z prototypu (`--mint`, `--coral`, `--accent`, `--status-*`) mają być
  przeniesione 1:1 jako design tokeny (Tailwind theme extend), nie przepisywane na oko

## Komendy (uzupełnić po scaffoldingu projektu)

```bash
npm run dev      # serwer developerski
npm run lint     # lint
npm run test     # testy jednostkowe/integracyjne
npm run build    # build produkcyjny
npx prisma migrate dev   # migracje bazy danych
```

## Zasady dla Claude Code

- **Nie dodawaj** integracji płatności, rezerwacji zajęć ani rozliczeń z operatorami typu
  Multisport — to świadomie poza zakresem MVP (patrz brief:
  `Karta_pomyslu_Karnet_asist.docx`).
- **Konto zawsze opcjonalne** — żadna funkcja rdzeniowa (dodanie karnetu, wejścia,
  archiwum) nie może wymagać logowania.
- Data ważności jest **zawsze opcjonalna**, dla obu typów karnetu (Sesja V6.15 — decyzja
  właścicielki, świadomie akceptująca, że karnet „bez limitu” bez daty nigdy się sam nie
  zarchiwizuje). Wcześniej karnety „bez limitu” zawsze jej wymagały — ta reguła została
  celowo usunięta, nie przywracaj jej bez nowej decyzji właścicielki.
- **Progi statusu ostrzegawczego** (`ok`/`soon`/`urgent`) — ustalone, patrz
  `docs/DATABASE.md`, sekcja „Status karnetu — progi”. Nie zgaduj innych wartości;
  jeśli progi wymagają korekty, zaproponuj zmianę w tej samej sekcji zamiast
  hardkodować nowe liczby lokalnie w komponencie.
- Usuwanie karnetu zawsze przez potwierdzenie (dialog), nigdy jednym kliknięciem.
- Zmiany w kolorach/i18n rób w jednym miejscu (tokeny / słownik), nie hardkoduj wartości
  w komponentach.
- Przy większych zmianach architektonicznych zaproponuj też update odpowiedniego pliku w
  `docs/` w tym samym PR-ze.
- Szczegóły encji, API i decyzji — nie duplikuj tutaj, linkuj do `docs/`.
- Kod, fragmenty ze Stack Overflow/blogów i biblioteki spoza podstawowego stosu (patrz
  wyżej) traktuj podejrzliwie — nie wklejaj i nie instaluj niczego "w ciemno". Przed
  dodaniem nowej zależności do `package.json` sprawdź: czy jest aktywnie utrzymywana, czy
  nie ma świeżych CVE, czy liczba pobrań/gwiazdek jest sensowna dla tego, co robi. Przy
  wklejaniu gotowego fragmentu kodu z zewnątrz — wyjaśnij, co on robi, zanim go użyjesz, a
  nie tylko że "działa".
- **Weryfikacja `device_id` — ustalona (`ADR-007`):** nigdy nie ufaj surowemu
  `device_id` przekazanemu bezpośrednio przez klienta. Tryb bez konta identyfikuje
  urządzenie wyłącznie przez podpisany token JWT wydany przez
  `POST /api/device/register` (sekret `DEVICE_TOKEN_SECRET`, tylko po stronie
  serwera) — szczegóły w `docs/DECISIONS.md` (`ADR-007`) i `docs/API.md`.
- **Nie zgaduj brakujących wartości.** Jeśli czegoś nie ma jawnie w tym pliku ani w
  `docs/` (np. docelowa domena produkcyjna, konkretna wartość limitu) — zapytaj,
  zamiast przyjmować rozsądnie wyglądającą wartość na własną rękę. Dotyczy to
  szczególnie miejsc dotykających bezpieczeństwa i danych osobowych: lepiej zapytać
  raz niż wdrożyć błędne założenie do produkcji.
