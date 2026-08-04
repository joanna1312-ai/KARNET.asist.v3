import { describe, expect, it } from "vitest";
import { CompanyCategory } from "@/generated/prisma/enums";
import { getCompanyInputErrors, parseCompanyInput } from "./company-rules";

describe("getCompanyInputErrors — ręczne dodanie firmy (Sesja 8)", () => {
  it("accepts a valid company", () => {
    expect(
      getCompanyInputErrors({ name: "FitZone", category: CompanyCategory.gym })
    ).toEqual([]);
  });

  it("rejects a company without a name", () => {
    expect(
      getCompanyInputErrors({ name: "", category: CompanyCategory.gym })
    ).toContain("nameRequired");
  });

  it("rejects a company with a whitespace-only name", () => {
    expect(
      getCompanyInputErrors({ name: "   ", category: CompanyCategory.gym })
    ).toContain("nameRequired");
  });

  it("rejects a company without a category", () => {
    expect(getCompanyInputErrors({ name: "FitZone", category: null })).toContain(
      "categoryRequired"
    );
  });
});

describe("parseCompanyInput", () => {
  it("trims the name and keeps a valid category", () => {
    expect(parseCompanyInput({ name: "  FitZone  ", category: "gym" })).toEqual({
      name: "FitZone",
      category: "gym",
    });
  });

  it("rejects an unknown category value", () => {
    expect(parseCompanyInput({ name: "FitZone", category: "not-a-category" })).toEqual({
      name: "FitZone",
      category: null,
    });
  });

  it("returns nulls for a missing body", () => {
    expect(parseCompanyInput(undefined)).toEqual({ name: null, category: null });
  });
});
