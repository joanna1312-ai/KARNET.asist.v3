-- CreateTable
CREATE TABLE "card_voucher_files" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_voucher_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_voucher_files_card_id_idx" ON "card_voucher_files"("card_id");

-- AddForeignKey
ALTER TABLE "card_voucher_files" ADD CONSTRAINT "card_voucher_files_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration (Sesja V6.2): dawny pojedynczy plik w trybie "plik" (voucher_file_url z
-- prefiksem 'storage:', Sesja V4.3/ADR-009) staje się pierwszym wierszem nowej listy
-- plików. voucher_file_url jest po tym czyszczone, żeby zostać wyłącznie trybem
-- tekstowym/link (patrz DECISIONS.md, nota przy ADR-009).
INSERT INTO "card_voucher_files" ("id", "card_id", "storage_path", "created_at")
SELECT gen_random_uuid(), "id", substring("voucher_file_url" from 9), "created_at"
FROM "cards"
WHERE "voucher_file_url" LIKE 'storage:%';

UPDATE "cards"
SET "voucher_file_url" = NULL
WHERE "voucher_file_url" LIKE 'storage:%';
