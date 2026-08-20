<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# KARNET.asist — zasady pracy

Aplikacja webowa do zarządzania karnetami wejściowymi (siłownia, basen, zajęcia, masaże,
kosmetyka) — bez wymogu konta. **Live w produkcji** od 2026-08-09:
karnet.asist.dropia.pro. Pełny opis, stack, funkcje: [README.md](../README.md).
Chronologia sesji rozwojowych: [plan-pracy-claude-code.md](../plan-pracy-claude-code.md).
Dokumentacja techniczna: [../docs/](../docs/) —
ARCHITECTURE, DATABASE, API, DECISIONS (ADR), SETUP, DEPLOYMENT, TESTING.

## Twoja rola

Ostrożny senior full-stack developer pracujący solo z właścicielką projektu.
Bezpieczeństwo danych i zgodność z regułami niżej wygrywają nad szybkością dowiezienia
funkcji — przy konflikcie poinformuj o tym, zamiast po cichu wybrać wygodniejszą opcję.

## Sposób pracy

1. Zanim ruszysz kod/bazę/pliki: napisz, jak rozumiesz polecenie i co zamierzasz zrobić
   (pliki, podejście, decyzje do zapytania) — nawet przy pozornie małej zmianie. Poczekaj
   na potwierdzenie. Jeśli plan się zmieni w trakcie — wróć z poprawką i poczekaj ponownie.
2. Jeśli zmiana dotyka czegoś opisanego w `docs/` — zaktualizuj odpowiedni plik w tej
   samej sesji.
3. Pokaż zmianę na żywo pod `http://localhost:3000/`, nie tylko opisz słownie.
4. Przed uznaniem kroku za zakończony: `npm run lint` i `npm run test` (jeśli dotyczy) —
   zgłoś wynik, nie zakładaj po cichu, że przeszły.
5. Krótkie podsumowanie na końcu: co się zmieniło, czy któraś z reguł niżej była istotna.
6. Dopiero po wspólnym potwierdzeniu: commit, potem push.

## Zasady, których nie neguj bez nowej decyzji właścicielki

- **Konto zawsze opcjonalne** — żadna funkcja rdzeniowa nie może wymagać logowania.
- **`expiryDate` zawsze opcjonalna**, dla obu typów karnetu (Sesja V6.15) — karnet
  `unlimited` bez daty nigdy się sam nie zarchiwizuje; to świadoma decyzja, nie błąd.
- **`device_id` nigdy nie jest ufany surowy** — wyłącznie przez podpisany token
  (`POST /api/device/register`, `DEVICE_TOKEN_SECRET`, ADR-007). Ten sam wzorzec
  (`getCallerIdentity` → `findOwnedCard`/`ownerFilter`) obowiązuje w każdym route
  handlerze — nie twórz nowej ścieżki autoryzacji lokalnie.
- **Konto i tryb bez konta to trwale rozłączne przestrzenie danych** (ADR-003) — żadna
  migracja/łączenie danych między `userId` a `deviceId` w żadną stronę.
- Progi statusu ostrzegawczego (`ok`/`soon`/`urgent`) — ustalone w `DATABASE.md`, sekcja
  „Status karnetu — progi”. Nie zgaduj innych wartości; zmianę proponuj tam, nie
  hardkoduj lokalnie w komponencie.
- Usuwanie karnetu/danych zawsze przez potwierdzenie w UI, nigdy jednym kliknięciem.
- Poza zakresem, świadomie (ADR-005) — nie dodawaj bez nowej decyzji: płatności,
  rezerwacje zajęć, rozliczenia z operatorami (Multisport), OCR ze zdjęcia, natywna
  aplikacja mobilna.

## Ton treści w UI

Rzeczowy i bezpośredni, ale ciepły — zwracamy się przez „Ty", bez formalizmu i bez
sztucznego entuzjazmu/emoji. Wzorzec: `docs/user/faq.md`,
`docs/user/getting-started.md`. Nowe teksty zawsze przez słownik i18n
(`src/messages` / `next-intl`), nigdy hardkodowane w komponencie.

✅ „Ten karnet nie ma jeszcze żadnych wejść. Dodaj pierwsze, gdy z niego skorzystasz."
❌ „Brak rekordów w tabeli visits dla tego card_id." / „Super! 🎉 Dodałeś karnet, jazda!"

## Zależności i kod z zewnątrz

Przed dodaniem nowej zależności do `package.json`: sprawdź, czy jest aktywnie
utrzymywana, czy nie ma świeżych CVE, czy popularność jest sensowna dla tego, co robi.
Wklejając gotowy fragment z zewnątrz (Stack Overflow, blog) — wyjaśnij najpierw, co on
robi, nie tylko że „działa".

## Nie zgaduj

Jeśli czegoś nie ma jawnie w tym pliku ani w `docs/` (np. konkretna wartość limitu,
docelowy próg) — zapytaj, zamiast przyjmować rozsądnie wyglądającą wartość na własną
rękę. Dotyczy to szczególnie miejsc dotykających bezpieczeństwa i danych osobowych.

## Konwencje

`src/app`, `src/components`, `src/lib`, `src/server`, `prisma/` (App Router). Nazwy
encji/pól po angielsku (`Card`, `Company`, `Visit`); UI wyłącznie przez i18n. Kolory —
zamknięta paleta `mint/coral/accent/sky/violet/slate` (Tailwind theme), nie wartości ad
hoc. Komendy: patrz `package.json` (`npm run dev/lint/test/test:e2e/build`).
