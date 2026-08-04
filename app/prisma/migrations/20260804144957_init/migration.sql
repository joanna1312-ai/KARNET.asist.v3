-- CreateEnum
CREATE TYPE "company_category" AS ENUM ('gym', 'pool', 'group_classes', 'massage', 'beauty');

-- CreateEnum
CREATE TYPE "card_type" AS ENUM ('limit', 'unlimited');

-- CreateEnum
CREATE TYPE "voucher_mode" AS ENUM ('single', 'per_visit');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "company_category" NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "google_place_id" TEXT,
    "created_by_user_id" UUID,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "device_id" TEXT,
    "company_id" UUID NOT NULL,
    "type" "card_type" NOT NULL,
    "total_visits" INTEGER,
    "used_visits" INTEGER NOT NULL DEFAULT 0,
    "expiry_date" DATE,
    "voucher_mode" "voucher_mode" NOT NULL,
    "voucher_file_url" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "visit_time" TIME,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "device_id" TEXT,
    "company_id" UUID NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "companies_category_idx" ON "companies"("category");

-- CreateIndex
CREATE INDEX "cards_user_id_idx" ON "cards"("user_id");

-- CreateIndex
CREATE INDEX "cards_device_id_idx" ON "cards"("device_id");

-- CreateIndex
CREATE INDEX "cards_company_id_idx" ON "cards"("company_id");

-- CreateIndex
CREATE INDEX "visits_card_id_visit_date_idx" ON "visits"("card_id", "visit_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_company_id_key" ON "favorites"("user_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_device_id_company_id_key" ON "favorites"("device_id", "company_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
