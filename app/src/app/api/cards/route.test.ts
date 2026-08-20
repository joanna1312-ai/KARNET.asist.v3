import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType } from "@/generated/prisma/enums";
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

  it("ignores the device token and scopes strictly to the account when logged in, even if a device token is also sent — no mixing between the two spaces", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.card.findMany.mockResolvedValue([]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders("device-1") })
    );

    expect(response.status).toBe(200);
    expect(prismaMock.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, userId: "user-1" },
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
        _count: { visits: 2 },
      },
      {
        id: "exhausted",
        type: CardType.limit,
        totalVisits: 10,
        usedVisits: 10,
        expiryDate: null,
        company: { id: "co1", name: "FitZone", category: "gym" },
        _count: { visits: 10 },
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
        _count: { visits: 0 },
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

  // Sesja V6.3: usedVisits (surowy licznik) już osiągnął limit, ale tylko 2 z 5 wejść
  // mają datę <= dziś (`_count.visits` liczony przez filtrowaną relację Prisma w
  // route.ts) — karnet ma zostać aktywny, nie trafić do archiwum.
  it("keeps a card active when the limit is reached only by future-dated (not yet realized) visits", async () => {
    prismaMock.card.findMany.mockResolvedValue([
      {
        id: "future-limit",
        type: CardType.limit,
        totalVisits: 5,
        usedVisits: 5,
        expiryDate: null,
        company: { id: "co1", name: "FitZone", category: "gym" },
        _count: { visits: 2 },
      },
    ]);

    const response = await GET(
      new Request(endpoint, { headers: await authHeaders("device-1") })
    );
    const body = await response.json();

    expect(body.cards.map((c: { id: string }) => c.id)).toEqual(["future-limit"]);
    expect(body.cards[0].realizedVisits).toBe(2);
  });
});

describe("POST /api/cards — kreator karnetu", () => {
  it("rejects requests without a verified device token and without a session", async () => {
    const response = await POST(new Request(endpoint, { method: "POST" }));
    expect(response.status).toBe(401);
    expect(prismaMock.card.create).not.toHaveBeenCalled();
  });

  it("accepts requests with a logged-in session but no device token (Sesja 14)", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.company.findUnique.mockResolvedValue({ id: "co1" });
    prismaMock.card.create.mockResolvedValue({ id: "new-card" });

    const response = await POST(
      new Request(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "co1",
          type: CardType.limit,
          totalVisits: 5,
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.card.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", deviceId: null }),
      })
    );
  });

  it("saves a new card to the account (userId), not the device, when logged in — so it does not leak into the anonymous/device view after signing out", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
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
        }),
      })
    );

    expect(prismaMock.card.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", deviceId: null }),
      })
    );
  });

  it("accepts an unlimited card without expiryDate (Sesja V6.15 — always optional)", async () => {
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
          type: CardType.unlimited,
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.card.create).toHaveBeenCalled();
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
        }),
      })
    );

    expect(response.status).toBe(201);
  });
});
