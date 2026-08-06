import { execFileSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

// Uruchamia się raz przed całym przebiegiem Playwrighta: nakłada migracje Prisma na bazę
// testową (db_test, patrz docker-compose.yml), żeby schema była aktualna niezależnie od
// tego, czy ktoś ją wcześniej ręcznie zainicjował.
export default async function globalSetup(): Promise<void> {
  const root = path.resolve(__dirname, "..");
  dotenv.config({ path: path.join(root, ".env.test") });

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL nie jest ustawiony dla testów e2e. Skopiuj .env.test.example do " +
        ".env.test i uzupełnij (patrz też docker-compose.yml, serwis db_test)."
    );
  }

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });
}
