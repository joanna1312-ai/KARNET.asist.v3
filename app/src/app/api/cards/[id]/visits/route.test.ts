import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  visit: {
    create: vi.fn(),
  },
  $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { POST } = await import("./route");

const visitsUrl = (cardId: string) => `http://localhost/api/cards/${cardId}/visits`;
const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
});

async function authHeaders(deviceId = "device-1") {
  const token = await signDeviceToken(deviceId);
  return { Authorization: `Device ${token}` };
}

const activeLimitCard = {
  id: "card-1",
  deviceId: "device-1",
  type: CardType.limit,
  totalVisits: 10,
  usedVisits: 2,
  expiryDate: null,
  voucherMode: VoucherMode.single,
  deletedAt: null,
};

describe("POST /api/cards/:id/visits — dodawanie wejścia", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await POST(
      new Request(visitsUrl("card-1"), { method: "POST" }),
      routeParams("card-1")
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when the card does not belong to the caller's device", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await POST(
      new Request(visitsUrl("card-1"), { method: "POST", headers: await authHeaders() }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
  });

  it("rejects adding a visit to an already-archived card (limit exhausted)", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...activeLimitCard,
      usedVisits: 10,
      totalVisits: 10,
    });

    const response = await POST(
      new Request(visitsUrl("card-1"), { method: "POST", headers: await authHeaders() }),
      routeParams("card-1")
    );

    expect(response.status).toBe(409);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects adding a visit to an already-archived card (expired)", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...activeLimitCard,
      expiryDate: new Date("2000-01-01"),
    });

    const response = await POST(
      new Request(visitsUrl("card-1"), { method: "POST", headers: await authHeaders() }),
      routeParams("card-1")
    );

    expect(response.status).toBe(409);
  });

  it("rejects a note longer than 80 characters", async () => {
    prismaMock.card.findFirst.mockResolvedValue(activeLimitCard);

    const response = await POST(
      new Request(visitsUrl("card-1"), {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ note: "a".repeat(81) }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("noteTooLong");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("creates a visit and increments usedVisits in the same transaction", async () => {
    prismaMock.card.findFirst.mockResolvedValue(activeLimitCard);
    prismaMock.visit.create.mockResolvedValue({ id: "visit-1", cardId: "card-1" });
    prismaMock.card.update.mockResolvedValue({ ...activeLimitCard, usedVisits: 3 });

    const response = await POST(
      new Request(visitsUrl("card-1"), {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Wizyta wieczorna" }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.visit.id).toBe("visit-1");
    expect(prismaMock.card.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "card-1" },
        data: { usedVisits: { increment: 1 } },
      })
    );
  });
});
