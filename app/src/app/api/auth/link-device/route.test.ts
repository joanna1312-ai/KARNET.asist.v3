import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    updateMany: vi.fn(),
  },
};

const getServerSessionMock = vi.fn();

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));

const { POST } = await import("./route");

const endpoint = "http://localhost/api/auth/link-device";

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
});

async function deviceHeaders(deviceId = "device-1") {
  const token = await signDeviceToken(deviceId);
  return { Authorization: `Device ${token}` };
}

describe("POST /api/auth/link-device", () => {
  it("rejects requests without a logged-in session", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(
      new Request(endpoint, { method: "POST", headers: await deviceHeaders() })
    );

    expect(response.status).toBe(401);
    expect(prismaMock.card.updateMany).not.toHaveBeenCalled();
  });

  it("rejects requests without a verified device token, even with a valid session", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(new Request(endpoint, { method: "POST" }));

    expect(response.status).toBe(401);
    expect(prismaMock.card.updateMany).not.toHaveBeenCalled();
  });

  it("links only the calling device's cards to the logged-in user", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.card.updateMany.mockResolvedValue({ count: 3 });

    const response = await POST(
      new Request(endpoint, { method: "POST", headers: await deviceHeaders("device-1") })
    );
    const body = await response.json();

    expect(prismaMock.card.updateMany).toHaveBeenCalledWith({
      where: { deviceId: "device-1" },
      data: { deviceId: null, userId: "user-1" },
    });
    expect(response.status).toBe(200);
    expect(body.linkedCount).toBe(3);
  });
});
