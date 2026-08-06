import { SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import {
  extractDeviceTokenFromHeader,
  signDeviceToken,
  verifyDeviceToken,
} from "./device-token";

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

describe("signDeviceToken / verifyDeviceToken (ADR-007)", () => {
  it("verifies a token back to the deviceId it was signed with", async () => {
    const deviceId = "11111111-1111-4111-8111-111111111111";
    const token = await signDeviceToken(deviceId);

    await expect(verifyDeviceToken(token)).resolves.toBe(deviceId);
  });

  it("rejects a token signed with a different secret", async () => {
    const deviceId = "22222222-2222-4222-8222-222222222222";
    const token = await signDeviceToken(deviceId);

    const originalSecret = process.env.DEVICE_TOKEN_SECRET;
    process.env.DEVICE_TOKEN_SECRET = "a-completely-different-secret-value";
    const verified = await verifyDeviceToken(token);
    process.env.DEVICE_TOKEN_SECRET = originalSecret;

    expect(verified).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const deviceId = "33333333-3333-4333-8333-333333333333";
    const token = await signDeviceToken(deviceId);
    // Flips the second-to-last character, not the last one: base64url's last character
    // of a group can carry unused padding bits, so swapping it sometimes decodes to the
    // same byte and leaves the signature valid — that made this test flaky (it was
    // observed passing only ~4 times out of 5). The second-to-last character always
    // encodes real signature bits, so this deterministically invalidates it.
    const tampered =
      token.slice(0, -2) + (token.at(-2) === "a" ? "b" : "a") + token.at(-1);

    await expect(verifyDeviceToken(tampered)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const deviceId = "44444444-4444-4444-8444-444444444444";
    const secretKey = new TextEncoder().encode(process.env.DEVICE_TOKEN_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(deviceId)
      .setIssuer("karnet-asist")
      .setAudience("device")
      .setIssuedAt(now - 60 * 60)
      .setExpirationTime(now - 1)
      .sign(secretKey);

    await expect(verifyDeviceToken(expiredToken)).resolves.toBeNull();
  });

  it("throws a clear error when DEVICE_TOKEN_SECRET is missing", async () => {
    const originalSecret = process.env.DEVICE_TOKEN_SECRET;
    delete process.env.DEVICE_TOKEN_SECRET;

    await expect(signDeviceToken("any-id")).rejects.toThrow(/DEVICE_TOKEN_SECRET/);

    process.env.DEVICE_TOKEN_SECRET = originalSecret;
  });
});

describe("extractDeviceTokenFromHeader", () => {
  it("extracts the token from a well-formed Device header", () => {
    expect(extractDeviceTokenFromHeader("Device abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("returns null for a missing header", () => {
    expect(extractDeviceTokenFromHeader(null)).toBeNull();
  });

  it("returns null for a header using a different scheme", () => {
    expect(extractDeviceTokenFromHeader("Bearer abc.def.ghi")).toBeNull();
  });

  it("returns null for a malformed header", () => {
    expect(extractDeviceTokenFromHeader("Device")).toBeNull();
  });
});
