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

**Supabase + `DATABASE_URL` — dopisz `?sslmode=require&uselibpqcompat=true`.** Sam
`?sslmode=require` nie wystarczy: nowsza wersja sterownika `pg` (używanego przez
`@prisma/adapter-pg`, wymagany driver adapter w Prisma 7 — patrz niżej) traktuje
`sslmode=require` jako pełną weryfikację łańcucha certyfikatów (`verify-full`), a
certyfikat Supabase jej nie przechodzi (błąd: `self-signed certificate in certificate
chain` / `TlsConnectionError`). Parametr `uselibpqcompat=true` przywraca dawne,
"łagodniejsze" zachowanie `sslmode=require` (szyfrowanie bez pełnej weryfikacji
certyfikatu) — to jest to, czego Supabase faktycznie oczekuje. Przykład:
```
DATABASE_URL=postgresql://postgres:HASŁO@db.<project-ref>.supabase.co:5432/postgres?sslmode=require&uselibpqcompat=true
```
Na stronie "Connect to your project" w Supabase wybieraj **Direct connection** (nie
pooler) — `npx prisma migrate dev` wymaga bezpośredniego połączenia, poolery (zwłaszcza
transaction pooler) go nie obsługują.

**Prisma 7 wymaga jawnego driver adaptera** — sam `DATABASE_URL` w `.env` nie
wystarczy, żeby `PrismaClient` się połączył (Prisma 7 nie ma już wbudowanego silnika
zapytań). W kodzie musi być zainstalowany i skonfigurowany `@prisma/adapter-pg` +
`pg` (patrz `src/lib/db.ts`) oraz `@prisma/client` w zależnościach — bez tego kompilacja
się nie powiedzie (`Module not found: Can't resolve '@prisma/client/runtime/client'`).

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
