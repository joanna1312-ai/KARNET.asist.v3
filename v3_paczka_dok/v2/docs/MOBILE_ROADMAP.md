# Plan przejścia Web → Android/iOS

> Nazwa projektu: KARNET.asist · Wersja: v1 · Zapisano: 2026-08-01 23:33
> Zaktualizowano: 2026-08-16 (Faza V5b) — punkt 3 rozstrzygnięty, patrz niżej.

> Brief produktowy zakłada start jako aplikacja webowa i natywne aplikacje mobilne w
> kolejnym kroku. Ten dokument spisuje, co zrobić już teraz, żeby to przejście nie
> wymagało przepisywania rdzenia aplikacji.

## Decyzje do podjęcia

1. **Technologia mobilna:** React Native (rekomendacja — współdzielenie logiki
   biznesowej i typów TS z web) vs Flutter (osobny język/ekosystem, ale bardzo dojrzałe
   UI natywne) vs w pełni natywne (Swift/Kotlin — najdroższe w utrzymaniu dla małego
   zespołu). **Rekomendacja: React Native**, głównie dlatego że backend i typy danych są
   już w TypeScript. Wciąż otwarte — nie podjęte przy Fazie V5b.
2. **Zakres współdzielenia kodu:** czy tylko API/typy, czy też logika (np. wyliczanie
   `archived`, progi statusu ostrzegawczego) w osobnym pakiecie (`packages/core`
   w monorepo) używanym i przez web, i przez mobile. Wciąż otwarte.
3. ~~**Czy PWA wystarczy na start** zamiast pierwszej natywnej wersji — szybszy
   time-to-market, ale bez części funkcji natywnych (powiadomienia push, aparat
   offline-first).~~ **Rozstrzygnięte w Fazie V5b (2026-08-16): tak.** Aplikacja
   przeszła pełne przeprojektowanie mobilne (branch `Faza_v5b`, wg
   `v5b/design_handoff_mobile_pwa`) + PWA (`manifest.ts`, `public/sw.js`, instalacja na
   ekran główny) + Web Push (`/api/push/subscribe`, `/api/cron/reminders` — patrz
   `API.md`, `ARCHITECTURE.md`). Powiadomienia push, które miały być argumentem
   przeciwko PWA, jednak **działają** przez Web Push API (z zastrzeżeniem: na iOS
   wymagają zainstalowania do ekranu głównego, tryb standalone — ograniczenie
   Safari/WebKit). Aparat offline-first i cache offline świadomie **nie** wchodzą w tej
   fazie (`sw.js` obsługuje tylko `push`/`notificationclick`) — jeśli w przyszłości
   okaże się to niewystarczające, to jest argument za natywną wersją, nie za
   rozbudową PWA o offline.

## Co zrobić w architekturze webowej już teraz

- **Auth przez tokeny (JWT), nie cookie sesyjne** — mobile nie ma tych samych mechanizmów
  cookie co przeglądarka; token-based auth działa identycznie na obu platformach.
- **Cała logika biznesowa w warstwie API/`core`, nie w komponentach UI** — reguły typu
  „karnet limit ma opcjonalną datę ważności”, „archiwizacja po przekroczeniu limitu lub
  dacie” muszą żyć w jednym miejscu używanym przez web i (później) mobile, a nie być
  przepisane osobno.
- **API zaprojektowane i udokumentowane od dnia pierwszego** (patrz [API.md](API.md)) —
  mobile będzie tylko kolejnym klientem tego samego API, nie osobnym systemem.
- **Upload plików (vouchery) przez presigned URL / dedykowany endpoint**, a nie
  bezpośrednio z frontendu do bazy — ten sam mechanizm musi działać z aparatu telefonu.
- **Kategorie, kolory, i18n jako dane/konfiguracja, nie zahardkodowane w komponentach
  webowych** — łatwiej przenieść do React Native, gdy są w wspólnym pakiecie.

## Co NIE robić teraz

- Nie budować natywnej aplikacji równolegle z web MVP — brief świadomie odracza to na
  kolejny etap.
- ~~Nie projektować integracji push notifications/aparatu, dopóki decyzja z pkt 1 nie
  zapadnie (inny SDK w zależności od wyboru).~~ Nieaktualne dla powiadomień push — patrz
  punkt 3 wyżej: zaimplementowane przez Web Push API, niezależnie od wyboru SDK
  natywnego z punktu 1 (Web Push nie wymaga React Native/Flutter/Swift/Kotlin). Aparat
  (integracja natywna, nie `<input capture>` już używany w kreatorze karnetu na
  mobile) wciąż czeka na decyzję z punktu 1.
- Nie budować cache'owania offline w service workerze, dopóki nie okaże się to realną
  potrzebą — świadomie pominięte w Fazie V5b (patrz punkt 3 wyżej).
