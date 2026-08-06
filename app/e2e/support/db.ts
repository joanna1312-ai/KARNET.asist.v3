import { randomUUID } from "node:crypto";
import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";
import { SYSTEM_CATEGORY_IDS } from "@/server/system-categories";

dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

// Bezpośrednio przez `pg`, nie przez wygenerowanego klienta Prisma (@/lib/db) — output
// generatora "prisma-client" używa `import.meta`, którego transform Playwrighta (CJS)
// nie potrafi załadować w plikach testowych. Tu wystarczy surowe SQL (truncate + jeden
// insert), więc ORM nie jest potrzebny.
function createClient(): Client {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// Czyści wszystkie tabele domenowe przed każdym testem, żeby przypadki się nie
// zanieczyszczały nawzajem — dotyczy zwłaszcza `companies`, które (w odróżnieniu od
// `cards`/`visits`) nie są scope'owane per urządzenie, tylko globalnie współdzielone.
// `categories` celowo NIE jest tu czyszczone — 5 kategorii systemowych (Sesja 16)
// pochodzi z migracji, nie z seeda per-test, a `companies.category_id` na nie wskazuje.
export async function resetDatabase(): Promise<void> {
  const client = createClient();
  await client.connect();
  try {
    await client.query(
      'TRUNCATE TABLE "visits", "favorites", "cards", "companies", "users" RESTART IDENTITY CASCADE'
    );
  } finally {
    await client.end();
  }
}

export interface SeededCompany {
  id: string;
  name: string;
  categoryId: string;
}

export async function seedCompany(
  overrides: Partial<{ name: string; categoryId: string }> = {}
): Promise<SeededCompany> {
  const company: SeededCompany = {
    id: randomUUID(),
    name: overrides.name ?? "Studio Pilates Centrum",
    categoryId: overrides.categoryId ?? SYSTEM_CATEGORY_IDS.gym,
  };

  const client = createClient();
  await client.connect();
  try {
    await client.query(
      'INSERT INTO "companies" (id, name, category_id) VALUES ($1, $2, $3)',
      [company.id, company.name, company.categoryId]
    );
  } finally {
    await client.end();
  }

  return company;
}
