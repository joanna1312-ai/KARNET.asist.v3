-- Sesja 16: enum `company_category` (5 stałych wartości) -> tabela `categories`,
-- żeby użytkownicy mogli dodawać własne kategorie. Kolejność kroków ma znaczenie:
-- najpierw nowa tabela + dane systemowe, potem backfill istniejących firm, dopiero
-- na końcu usunięcie starej kolumny/enuma (żeby nigdy nie było okna z utratą danych).

-- CreateEnum
CREATE TYPE "category_color" AS ENUM ('mint', 'coral', 'accent', 'sky', 'violet', 'slate');

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "color" "category_color" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_created_by_device_id_idx" ON "categories"("created_by_device_id");

-- Seed: 5 kategorii systemowe, id stałe (żeby backfill niżej mógł się do nich odwołać
-- deterministycznie), zgodne z src/server/system-categories.ts.
INSERT INTO "categories" ("id", "slug", "name", "color", "is_system") VALUES
    ('00000000-0000-0000-0000-000000000001', 'gym', 'Siłownia', 'mint', true),
    ('00000000-0000-0000-0000-000000000002', 'pool', 'Basen', 'sky', true),
    ('00000000-0000-0000-0000-000000000003', 'group_classes', 'Zajęcia grupowe', 'accent', true),
    ('00000000-0000-0000-0000-000000000004', 'massage', 'Masaż', 'violet', true),
    ('00000000-0000-0000-0000-000000000005', 'beauty', 'Uroda', 'coral', true);

-- AlterTable: dodaj nową kolumnę jako nullable, żeby dało się ją wypełnić przed
-- ustawieniem NOT NULL (istniejące firmy mają dziś wartość w starej kolumnie `category`).
ALTER TABLE "companies" ADD COLUMN "category_id" UUID;

-- Backfill z enuma na id kategorii systemowej o tym samym `slug`.
UPDATE "companies" SET "category_id" = (CASE "category"
    WHEN 'gym' THEN '00000000-0000-0000-0000-000000000001'
    WHEN 'pool' THEN '00000000-0000-0000-0000-000000000002'
    WHEN 'group_classes' THEN '00000000-0000-0000-0000-000000000003'
    WHEN 'massage' THEN '00000000-0000-0000-0000-000000000004'
    WHEN 'beauty' THEN '00000000-0000-0000-0000-000000000005'
END)::UUID;

ALTER TABLE "companies" ALTER COLUMN "category_id" SET NOT NULL;

-- DropIndex
DROP INDEX "companies_category_idx";

-- AlterTable: stara kolumna/enum nie są już potrzebne.
ALTER TABLE "companies" DROP COLUMN "category";
DROP TYPE "company_category";

-- CreateIndex
CREATE INDEX "companies_category_id_idx" ON "companies"("category_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
