import { describe, expect, it } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { getCardInputErrors } from "./card-rules";

const validLimitCard = {
  companyId: "company-1",
  type: CardType.limit,
  totalVisits: 10,
  expiryDate: null,
  voucherMode: VoucherMode.single,
};

const validUnlimitedCard = {
  companyId: "company-1",
  type: CardType.unlimited,
  totalVisits: null,
  expiryDate: new Date("2026-12-31"),
  voucherMode: VoucherMode.per_visit,
};

describe("getCardInputErrors — reguła limit/unlimited (docs/DATABASE.md)", () => {
  it("accepts a valid limit card without expiryDate", () => {
    expect(getCardInputErrors(validLimitCard)).toEqual([]);
  });

  it("accepts a valid limit card with expiryDate set (optional, not forbidden)", () => {
    expect(
      getCardInputErrors({ ...validLimitCard, expiryDate: new Date("2026-12-31") })
    ).toEqual([]);
  });

  it("accepts a valid unlimited card with expiryDate", () => {
    expect(getCardInputErrors(validUnlimitedCard)).toEqual([]);
  });

  it("rejects an unlimited card without expiryDate", () => {
    expect(
      getCardInputErrors({ ...validUnlimitedCard, expiryDate: null })
    ).toContain("expiryDateRequiredForUnlimited");
  });

  it("rejects a limit card without totalVisits", () => {
    expect(
      getCardInputErrors({ ...validLimitCard, totalVisits: null })
    ).toContain("totalVisitsRequiredForLimit");
  });

  it("rejects a limit card with totalVisits <= 0", () => {
    expect(
      getCardInputErrors({ ...validLimitCard, totalVisits: 0 })
    ).toContain("totalVisitsPositive");
  });

  it("rejects a card without companyId", () => {
    expect(
      getCardInputErrors({ ...validLimitCard, companyId: null })
    ).toContain("companyRequired");
  });

  it("rejects a card without type", () => {
    expect(
      getCardInputErrors({ ...validLimitCard, type: null })
    ).toContain("typeRequired");
  });

  it("rejects a card without voucherMode", () => {
    expect(
      getCardInputErrors({ ...validLimitCard, voucherMode: null })
    ).toContain("voucherModeRequired");
  });

  it("does not require totalVisits for an unlimited card", () => {
    expect(getCardInputErrors(validUnlimitedCard)).not.toContain(
      "totalVisitsRequiredForLimit"
    );
  });
});
