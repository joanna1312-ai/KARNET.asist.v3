import { beforeAll, describe, expect, it } from "vitest";
import { verifyDeviceToken } from "@/server/device-token";
import { POST } from "./route";

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

const endpoint = "http://localhost/api/device/register";

describe("POST /api/device/register (ADR-007)", () => {
  it("issues a new deviceId and a signed token when no Authorization header is sent", async () => {
    const response = await POST(new Request(endpoint, { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(typeof body.deviceId).toBe("string");
    expect(typeof body.token).toBe("string");
    await expect(verifyDeviceToken(body.token)).resolves.toBe(body.deviceId);
  });

  it("renews the token but keeps the same deviceId when a valid Device token is sent", async () => {
    const first = await POST(new Request(endpoint, { method: "POST" }));
    const firstBody = await first.json();

    const second = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { Authorization: `Device ${firstBody.token}` },
      })
    );
    const secondBody = await second.json();

    expect(secondBody.deviceId).toBe(firstBody.deviceId);
    expect(secondBody.token).not.toBe(firstBody.token);
  });

  it("never trusts a client-supplied device_id in the request body", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: "attacker-supplied-id" }),
      })
    );
    const body = await response.json();

    expect(body.deviceId).not.toBe("attacker-supplied-id");
  });

  it("issues a fresh deviceId when an invalid/tampered Device token is sent", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { Authorization: "Device not-a-real-token" },
      })
    );
    const body = await response.json();

    expect(typeof body.deviceId).toBe("string");
  });
});
