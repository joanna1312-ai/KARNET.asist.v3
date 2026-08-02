# Uruchomienie projektu lokalnie

> Nazwa projektu: Karnet.asist · Wersja: v2 · Zapisano: 2026-08-02 00:08

> DRAFT — do uzupełnienia komendami rzeczywistymi po scaffoldingu Next.js. Poniżej zakres
> i kolejność, nie gotowe polecenia.

## Wymagania

- Node.js LTS
- PostgreSQL (lokalnie albo przez Docker / usługę typu Neon/Supabase)
- Klucz Google Maps/Places API (z ograniczeniem do domeny/adresu, billing włączony)
- (opcjonalnie) konto na object storage (Supabase Storage / Cloudflare R2) dla voucherów

## Zmienne środowiskowe (`.env`)

```
DATABASE_URL=postgresql://...
GOOGLE_MAPS_API_KEY=...
NEXTAUTH_SECRET=...
DEVICE_TOKEN_SECRET=...
STORAGE_BUCKET_URL=...
STORAGE_ACCESS_KEY=...
```

`DEVICE_TOKEN_SECRET` — sekret do podpisywania tokenów urządzenia w trybie bez konta
(`ADR-007`); losowy, min. 32 bajty (np. `openssl rand -base64 32`), używany wyłącznie
po stronie serwera.

`.env.example` powinien być commitowany z pustymi/placeholderowymi wartościami;
`.env` — nigdy.

## Kroki

1. `git clone ...`
2. `npm install`
3. `cp .env.example .env` i uzupełnić wartości
4. `npx prisma migrate dev` — utworzenie schematu w lokalnej bazie
5. (opcjonalnie) `npx prisma db seed` — dane demo analogiczne do tych w prototypie
   (`cards`/`partners` z `karnet-asist-prototyp_v6.html`) do szybkiego testowania
6. `npm run dev` — start serwera developerskiego
7. `npm run test` — testy jednostkowe/integracyjne przed commitem

## Weryfikacja, że działa

- Lista karnetów ładuje się bez błędów w konsoli
- Dodanie karnetu przez kreator zapisuje się i pojawia po odświeżeniu (dowód, że dane są
  w bazie, nie tylko w pamięci JS jak w prototypie)
- Przełącznik PL/EN i tryb ciemny działają tak samo jak w prototypie
