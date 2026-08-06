import { describe, expect, it } from "vitest";
import { getCompanyInputErrors, parseCompanyInput } from "./company-rules";

const GYM_CATEGORY_ID = "00000000-0000-0000-0000-000000000001";

describe("getCompanyInputErrors — ręczne dodanie firmy (Sesja 8)", () => {
  it("accepts a valid company", () => {
    expect(
      getCompanyInputErrors({ name: "FitZone", categoryId: GYM_CATEGORY_ID })
    ).toEqual([]);
  });

  it("rejects a company without a name", () => {
    expect(
      getCompanyInputErrors({ name: "", categoryId: GYM_CATEGORY_ID })
    ).toContain("nameRequired");
  });

  it("rejects a company with a whitespace-only name", () => {
    expect(
      getCompanyInputErrors({ name: "   ", categoryId: GYM_CATEGORY_ID })
    ).toContain("nameRequired");
  });

  it("rejects a company without a category", () => {
    expect(getCompanyInputErrors({ name: "FitZone", categoryId: null })).toContain(
      "categoryRequired"
    );
  });
});

describe("parseCompanyInput", () => {
  it("trims the name and keeps a valid categoryId", () => {
    expect(
      parseCompanyInput({ name: "  FitZone  ", categoryId: GYM_CATEGORY_ID })
    ).toEqual({
      name: "FitZone",
      categoryId: GYM_CATEGORY_ID,
    });
  });

  it("rejects an empty categoryId", () => {
    expect(parseCompanyInput({ name: "FitZone", categoryId: "" })).toEqual({
      name: "FitZone",
      categoryId: null,
    });
  });

  it("returns nulls for a missing body", () => {
    expect(parseCompanyInput(undefined)).toEqual({ name: null, categoryId: null });
  });
});
