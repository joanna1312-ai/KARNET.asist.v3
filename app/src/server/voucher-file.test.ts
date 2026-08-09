import { describe, expect, it } from "vitest";
import {
  isAllowedVoucherContentType,
  isStorageVoucherFileUrl,
  isVoucherPathOwnedByCard,
  toStorageVoucherFileUrl,
  voucherFileKindFromPath,
  voucherObjectPath,
  voucherStoragePath,
} from "./voucher-file";

describe("isAllowedVoucherContentType", () => {
  it("accepts the four allowed types", () => {
    expect(isAllowedVoucherContentType("image/jpeg")).toBe(true);
    expect(isAllowedVoucherContentType("image/png")).toBe(true);
    expect(isAllowedVoucherContentType("image/webp")).toBe(true);
    expect(isAllowedVoucherContentType("application/pdf")).toBe(true);
  });

  it("rejects anything else, including non-strings", () => {
    expect(isAllowedVoucherContentType("application/zip")).toBe(false);
    expect(isAllowedVoucherContentType(null)).toBe(false);
    expect(isAllowedVoucherContentType(undefined)).toBe(false);
  });
});

describe("storage: prefix marker helpers", () => {
  it("round-trips a path through toStorageVoucherFileUrl/voucherStoragePath", () => {
    const path = "cards/card-1/abc.jpg";
    expect(voucherStoragePath(toStorageVoucherFileUrl(path))).toBe(path);
  });

  it("distinguishes a storage marker from plain text/link", () => {
    expect(isStorageVoucherFileUrl("storage:cards/card-1/abc.jpg")).toBe(true);
    expect(isStorageVoucherFileUrl("10% zniżki - kod ABC123")).toBe(false);
    expect(isStorageVoucherFileUrl("https://example.com/voucher")).toBe(false);
    expect(isStorageVoucherFileUrl(null)).toBe(false);
    expect(isStorageVoucherFileUrl(undefined)).toBe(false);
  });
});

describe("voucherObjectPath", () => {
  it("builds a path scoped under cards/{cardId}/ with the right extension", () => {
    const path = voucherObjectPath("card-1", "image/png");
    expect(path).toMatch(/^cards\/card-1\/.+\.png$/);
  });

  it("falls back to .bin for an unrecognized content type", () => {
    const path = voucherObjectPath("card-1", "application/octet-stream");
    expect(path).toMatch(/^cards\/card-1\/.+\.bin$/);
  });
});

describe("isVoucherPathOwnedByCard", () => {
  it("accepts a path under the card's own folder", () => {
    expect(isVoucherPathOwnedByCard("cards/card-1/abc.jpg", "card-1")).toBe(true);
  });

  it("rejects a path belonging to a different card", () => {
    expect(isVoucherPathOwnedByCard("cards/card-2/abc.jpg", "card-1")).toBe(false);
  });

  it("rejects path traversal attempts", () => {
    expect(isVoucherPathOwnedByCard("cards/card-1/../card-2/abc.jpg", "card-1")).toBe(false);
  });
});

describe("voucherFileKindFromPath", () => {
  it("recognizes image extensions", () => {
    expect(voucherFileKindFromPath("cards/c1/a.jpg")).toBe("image");
    expect(voucherFileKindFromPath("cards/c1/a.jpeg")).toBe("image");
    expect(voucherFileKindFromPath("cards/c1/a.png")).toBe("image");
    expect(voucherFileKindFromPath("cards/c1/a.webp")).toBe("image");
  });

  it("recognizes pdf", () => {
    expect(voucherFileKindFromPath("cards/c1/a.pdf")).toBe("pdf");
  });

  it("returns null for anything else", () => {
    expect(voucherFileKindFromPath("cards/c1/a.exe")).toBeNull();
  });
});
