import { describe, expect, it } from "vitest";
import { ownerFilter } from "./card-owner";

describe("ownerFilter (Sesja 14 — konto i urządzenie to rozłączne przestrzenie danych)", () => {
  it("matches only the device when there is no session", () => {
    expect(ownerFilter({ deviceId: "device-1", userId: null })).toEqual({
      deviceId: "device-1",
    });
  });

  it("matches only the account when there is no device token", () => {
    expect(ownerFilter({ deviceId: null, userId: "user-1" })).toEqual({
      userId: "user-1",
    });
  });

  it("scopes strictly to the account when logged in, ignoring the device token entirely — no mixing the two spaces", () => {
    expect(ownerFilter({ deviceId: "device-1", userId: "user-1" })).toEqual({
      userId: "user-1",
    });
  });
});
