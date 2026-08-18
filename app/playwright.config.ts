import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Baza i sekrety dla e2e są odizolowane od dev (.env) — patrz .env.test.example i
// docker-compose.yml (serwis db_test). Testy resetują (truncate) tabele przed każdym
// przebiegiem (e2e/support/db.ts), więc uruchamianie ich przeciwko bazie dev byłoby
// niebezpieczne — stąd osobny plik zamiast .env.
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  // Firmy (`companies`) są danymi współdzielonymi globalnie, nie per-urządzenie (patrz
  // schema Prisma) — testy resetują całą bazę przed każdym przypadkiem, więc równoległe
  // workery rywalizowałyby o te same wiersze. Jeden worker = przewidywalność zamiast
  // szybkości, uzasadnione rozmiarem tego zestawu testów.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  // `next dev` (nie `next build`) kompiluje trasę na żądanie przy pierwszej nawigacji po
  // niej (kilka cykli Fast Refresh) — obserwowane do ~20s przy zupełnie "zimnym" starcie
  // serwera, mimo że funkcja pod testem działa poprawnie (płaci to głównie pierwszy test w
  // przebiegu). Domyślne 5s dla `expect()` i 30s na cały test było za krótkie.
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      DEVICE_TOKEN_SECRET: process.env.DEVICE_TOKEN_SECRET ?? "",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
      NEXTAUTH_URL: baseURL,
    },
  },
});
