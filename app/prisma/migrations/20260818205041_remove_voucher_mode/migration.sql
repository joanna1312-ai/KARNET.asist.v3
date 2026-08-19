-- Sesja V6.11 (punkt 2): usunięcie nieużywanego pola voucherMode.
-- Nie steruje dziś żadnym realnym zachowaniem/wyświetlaniem w UI.
ALTER TABLE "cards" DROP COLUMN "voucher_mode";

DROP TYPE "voucher_mode";
