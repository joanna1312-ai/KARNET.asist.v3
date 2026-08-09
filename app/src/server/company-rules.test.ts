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

describe("getCompanyInputErrors — lokalizacja z Google Places (Sesja V4.1)", () => {
  it("accepts a company without any location", () => {
    expect(
      getCompanyInputErrors({ name: "FitZone", categoryId: GYM_CATEGORY_ID })
    ).toEqual([]);
  });

  it("accepts a company with a full lat/lng pair", () => {
    expect(
      getCompanyInputErrors({
        name: "FitZone",
        categoryId: GYM_CATEGORY_ID,
        lat: 52.2297,
        lng: 21.0122,
      })
    ).toEqual([]);
  });

  it("rejects a company with only lat set", () => {
    expect(
      getCompanyInputErrors({
        name: "FitZone",
        categoryId: GYM_CATEGORY_ID,
        lat: 52.2297,
        lng: null,
      })
    ).toContain("locationIncomplete");
  });

  it("rejects a company with only lng set", () => {
    expect(
      getCompanyInputErrors({
        name: "FitZone",
        categoryId: GYM_CATEGORY_ID,
        lat: null,
        lng: 21.0122,
      })
    ).toContain("locationIncomplete");
  });
});

describe("parseCompanyInput", () => {
  it("trims the name and keeps a valid categoryId", () => {
    expect(
      parseCompanyInput({ name: "  FitZone  ", categoryId: GYM_CATEGORY_ID })
    ).toEqual({
      name: "FitZone",
      categoryId: GYM_CATEGORY_ID,
      lat: null,
      lng: null,
      googlePlaceId: null,
    });
  });

  it("rejects an empty categoryId", () => {
    expect(parseCompanyInput({ name: "FitZone", categoryId: "" })).toEqual({
      name: "FitZone",
      categoryId: null,
      lat: null,
      lng: null,
      googlePlaceId: null,
    });
  });

  it("returns nulls for a missing body", () => {
    expect(parseCompanyInput(undefined)).toEqual({
      name: null,
      categoryId: null,
      lat: null,
      lng: null,
      googlePlaceId: null,
    });
  });

  it("parses lat/lng/googlePlaceId when present", () => {
    expect(
      parseCompanyInput({
        name: "FitZone",
        categoryId: GYM_CATEGORY_ID,
        lat: 52.2297,
        lng: 21.0122,
        googlePlaceId: "ChIJ_test",
      })
    ).toEqual({
      name: "FitZone",
      categoryId: GYM_CATEGORY_ID,
      lat: 52.2297,
      lng: 21.0122,
      googlePlaceId: "ChIJ_test",
    });
  });

  it("ignores non-numeric lat/lng and non-string googlePlaceId", () => {
    expect(
      parseCompanyInput({
        name: "FitZone",
        categoryId: GYM_CATEGORY_ID,
        lat: "52.2297",
        lng: Number.NaN,
        googlePlaceId: 123,
      })
    ).toEqual({
      name: "FitZone",
      categoryId: GYM_CATEGORY_ID,
      lat: null,
      lng: null,
      googlePlaceId: null,
    });
  });
});
