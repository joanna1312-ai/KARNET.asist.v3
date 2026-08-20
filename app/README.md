# KARNET.asist — app/

Kod aplikacji Next.js (App Router) + TypeScript + Tailwind CSS. Pełny opis projektu,
funkcje, stack i linki do dokumentacji technicznej: [README.md w katalogu głównym
repozytorium](../README.md).

## Uruchomienie lokalne

Skrót (pełna instrukcja: [`../docs/SETUP.md`](../docs/SETUP.md)):

```bash
npm install
cp .env.example .env   # uzupełnij wartości, patrz docs/SETUP.md
npx prisma migrate dev
npm run dev             # http://localhost:3000
```

## Testy

```bash
npm run lint
npm run test       # Vitest — jednostkowe/integracyjne
npm run test:e2e   # Playwright — e2e
```
