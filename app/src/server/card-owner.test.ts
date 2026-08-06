import { describe, expect, it } from "vitest";
import { ownerFilter } from "./card-owner";

describe("ownerFilter (Sesja 14 — dostęp przez urządzenie i/lub konto)", () => {
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

  it("matches device OR account when both are present, so linked and not-yet-linked cards both show", () => {
    expect(ownerFilter({ deviceId: "device-1", userId: "user-1" })).toEqual({
      OR: [{ deviceId: "device-1" }, { userId: "user-1" }],
    });
  });
});
