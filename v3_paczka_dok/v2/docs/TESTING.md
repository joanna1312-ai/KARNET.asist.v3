# Strategia testów — Karnet.asist

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

> DRAFT — dostosować narzędzia do wybranego stosu (zakładając Next.js + Vitest +
> Playwright, zgodnie z pozostałymi projektami z tego kursu).

## Testy jednostkowe (logika biznesowa)

Priorytet — to reguły, które w prototypie są łatwe do przypadkowego popsucia przy
refaktorze:

- `isArchived(card)` — karnet limit w pełni wykorzystany LUB data ważności minęła
- Walidacja: `type === 'unlimited'` zawsze wymaga `expiryDate`; `type === 'limit'` — nie
- Liczenie dni do końca ważności / etykiety statusu (`ok`/`soon`/`urgent`/`wygasł`/
  `brak terminu`) wg progów z `DATABASE.md` („Status karnetu — progi”), w tym reguła
  łączenia dla karnetów `limit` z ustawioną datą ważności (gorszy z dwóch wymiarów wygrywa)
- Dodanie/usunięcie wejścia poprawnie aktualizuje `usedVisits` (nie schodzi poniżej 0)

## Testy integracyjne (API)

- `POST /api/cards` z brakującą datą ważności dla `unlimited` → błąd walidacji
- `POST /api/cards` z brakującą datą ważności dla `limit` → sukces (opcjonalność)
- `DELETE /api/cards/:id` bez potwierdzenia po stronie API nie jest wymagane (to UX na
  froncie), ale endpoint powinien być idempotentny i zwracać sensowny status przy
  usuwaniu nieistniejącego zasobu
- Filtrowanie `GET /api/cards` vs `GET /api/cards?archived=true` — karnet nie powinien
  nigdy pojawić się w obu jednocześnie

## Testy e2e (Playwright) — kluczowe ścieżki z prototypu

1. Dodanie nowego karnetu przez kreator (firma istniejąca → typ → voucher → zapis)
2. Dodanie karnetu przez wybór firmy z Google Maps (mock w środowisku testowym, żeby nie
   zależeć od realnego API w CI)
3. Zalogowanie wejścia i weryfikacja aktualizacji paska postępu/pierścienia
4. Edycja i usunięcie wejścia z historii
5. Edycja daty ważności, w tym wyczyszczenie jej dla karnetu typu `limit`
6. Usunięcie karnetu — sprawdzenie, że dialog potwierdzający się pojawia i anulowanie
   nie usuwa danych
7. Karnet automatycznie znika z listy głównej i pojawia się w archiwum po osiągnięciu
   limitu wejść / dacie ważności
8. Przełączenie języka PL/EN i trybu ciemnego — brak błędów, teksty się zmieniają

## Środowisko testowe

- Baza testowa odizolowana od dev/staging/prod, resetowana przed każdym przebiegiem CI
- Google Maps/Places API mockowane w testach (nie zużywać limitu/budżetu w CI)
