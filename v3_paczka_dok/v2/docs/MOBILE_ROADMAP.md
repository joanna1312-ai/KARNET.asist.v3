# Plan przejścia Web → Android/iOS

> Nazwa projektu: Karnet.asist · Wersja: v1 · Zapisano: 2026-08-01 23:33

> Brief produktowy zakłada start jako aplikacja webowa i natywne aplikacje mobilne w
> kolejnym kroku. Ten dokument spisuje, co zrobić już teraz, żeby to przejście nie
> wymagało przepisywania rdzenia aplikacji.

## Decyzje do podjęcia

1. **Technologia mobilna:** React Native (rekomendacja — współdzielenie logiki
   biznesowej i typów TS z web) vs Flutter (osobny język/ekosystem, ale bardzo dojrzałe
   UI natywne) vs w pełni natywne (Swift/Kotlin — najdroższe w utrzymaniu dla małego
   zespołu). **Rekomendacja: React Native**, głównie dlatego że backend i typy danych są
   już w TypeScript.
2. **Zakres współdzielenia kodu:** czy tylko API/typy, czy też logika (np. wyliczanie
   `archived`, walidacja „unlimited wymaga expiry”) w osobnym pakiecie (`packages/core`
   w monorepo) używanym i przez web, i przez mobile.
3. **Czy PWA wystarczy na start** zamiast pierwszej natywnej wersji — szybszy time-to-market,
   ale bez części funkcji natywnych (powiadomienia push, aparat offline-first).

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
- Nie projektować integracji push notifications/aparatu, dopóki decyzja z pkt 1 nie
  zapadnie (inny SDK w zależności od wyboru).
