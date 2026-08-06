import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  company: {
    findUnique: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));

const { GET, POST } = await import("./route");

const endpoint = "http://localhost/api/cards";

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(null);
});

async function authHeaders(deviceId = "device-1") {
  const token = await signDeviceToken(deviceId);
  return { Authorization: `Device ${token}` };
}

describe("GET /api/cards (ADR-007)", () => {
  it("rejects requests without a verified device token and without a session", async () => {
    const response = await GET(new Request(endpoint));
    expect(response.status).toBe(401);
  });

  it("accepts requests with a logged-in session but no device token (Sesja 14)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.card.findMany.mockResolvedValue([]);

    const response = await GET(new Request(endpoint));

    expect(response.status).toBe(200);
    expect(prismaMock.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, userId: "user-1" },
      })
    );
  });

  it("matches cards by device OR account when both a session and a device token are present (Sesja 14 — post link-device)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.card.findMany.mockResolvedValue([]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders("device-1") })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [{ deviceId: "device-1" }, { userId: "user-1" }],
        },
      })
    );
  });

  it("returns only non-archived cards by default, scoped to the caller's device", async () => {
    prismaMock.card.findMany.mockResolvedValue([
      {
        id: "active",
        type: CardType.limit,
        totalVisits: 10,
        usedVisits: 2,
        expiryDate: null,
        company: { id: "co1", name: "FitZone", category: "gym" },
      },
      {
        id: "exhausted",
        type: CardType.limit,
        totalVisits: 10,
        usedVisits: 10,
        expiryDate: null,
        company: { id: "co1", name: "FitZone", category: "gym" },
      },
    ]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders("device-1") })
    );
    const body = await response.json();

    expect(prismaMock.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deviceId: "device-1", deletedAt: null },
      })
    );
    expect(response.status).toBe(200);
    expect(body.cards.map((c: { id: string }) => c.id)).toEqual(["active"]);
  });

  it("returns archived cards when ?archived=true", async () => {
    prismaMock.card.findMany.mockResolvedValue([
      {
        id: "expired",
        type: CardType.unlimited,
        totalVisits: null,
        usedVisits: 0,
        expiryDate: new Date("2000-01-01"),
        company: { id: "co1", name: "FitZone", category: "gym" },
      },
    ]);

    const response = await GET(
      new Request(`${endpoint}?archived=true`, {
        headers: await authHeaders(),
      })
    );
    const body = await response.json();

    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].id).toBe("expired");
  });
});

describe("POST /api/cards — kreator karnetu", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await POST(new Request(endpoint, { method: "POST" }));
    expect(response.status).toBe(401);
    expect(prismaMock.card.create).not.toHaveBeenCalled();
  });

  it("rejects an unlimited card without expiryDate, even though the client sent one", async () => {
    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: "co1",
          type: CardType.unlimited,
          voucherMode: VoucherMode.single,
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("expiryDateRequiredForUnlimited");
    expect(prismaMock.card.create).not.toHaveBeenCalled();
  });

  it("rejects a card pointing at a company that does not exist", async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: "does-not-exist",
          type: CardType.limit,
          totalVisits: 10,
          voucherMode: VoucherMode.single,
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(prismaMock.card.create).not.toHaveBeenCalled();
  });

  it("never trusts a client-supplied deviceId in the request body", async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: "co1" });
    prismaMock.card.create.mockResolvedValue({ id: "new-card" });

    await POST(
      new Request(endpoint, {
        method: "POST",
        headers: {
          ...(await authHeaders("device-1")),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: "co1",
          type: CardType.limit,
          totalVisits: 5,
          voucherMode: VoucherMode.single,
          deviceId: "attacker-supplied-id",
        }),
      })
    );

    expect(prismaMock.card.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deviceId: "device-1" }),
      })
    );
  });

  it("creates a valid limit card", async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: "co1" });
    prismaMock.card.create.mockResolvedValue({ id: "new-card" });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: "co1",
          type: CardType.limit,
          totalVisits: 5,
          voucherMode: VoucherMode.single,
        }),
      })
    );

    expect(response.status).toBe(201);
  });
});
