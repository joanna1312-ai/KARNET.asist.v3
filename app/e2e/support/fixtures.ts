import { test as base, expect } from "@playwright/test";
import { resetDatabase, seedCompany } from "./db";

type Fixtures = {
  resetDb: void;
  company: Awaited<ReturnType<typeof seedCompany>>;
};

// Reset bazy testowej (truncate) przed KAŻDYM testem — automatyczny, żeby żaden spec nie
// mógł o nim zapomnieć. `company` seeduje jedną firmę wprost przez Prisma (zamiast przez
// UI), bo w testach kreatora karnetu chcemy scenariusz "firma już istnieje" (patrz
// docs/TESTING.md, punkt 1) — dodawanie nowej firmy nie jest tu przedmiotem testu.
export const test = base.extend<Fixtures>({
  resetDb: [
    // Parametr celowo nie nazywa się `use` — eslint-plugin-react-hooks (via
    // eslint-config-next) traktuje każde wywołanie funkcji o tej nazwie jak React 19
    // `use()` i zgłasza fałszywy alarm poza komponentem/hookiem.
    async ({}, runFixture) => {
      await resetDatabase();
      await runFixture();
    },
    { auto: true },
  ],
  // Destructuring `resetDb` (even unused otherwise) tells Playwright this fixture
  // depends on it, so the reset always runs before the company is seeded.
  company: async ({ resetDb }, runFixture) => {
    void resetDb;
    const company = await seedCompany();
    await runFixture(company);
  },
});

export { expect };
