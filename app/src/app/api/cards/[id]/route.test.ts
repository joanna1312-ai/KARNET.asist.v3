import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  company: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { GET, PATCH, DELETE } = await import("./route");

const cardUrl = (id: string) => `http://localhost/api/cards/${id}`;
const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
});

async function authHeaders(deviceId = "device-1") {
  const token = await signDeviceToken(deviceId);
  return { Authorization: `Device ${token}` };
}

const existingLimitCard = {
  id: "card-1",
  deviceId: "device-1",
  companyId: "co1",
  type: CardType.limit,
  totalVisits: 10,
  usedVisits: 2,
  expiryDate: null,
  voucherMode: VoucherMode.single,
  deletedAt: null,
};

describe("GET /api/cards/:id", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await GET(new Request(cardUrl("card-1")), routeParams("card-1"));
    expect(response.status).toBe(401);
  });

  it("returns 404 when the card does not belong to the caller's device", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await GET(
      new Request(cardUrl("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
  });

  it("returns the card when it belongs to the caller's device", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...existingLimitCard,
      company: { id: "co1", name: "FitZone", category: "gym" },
      visits: [],
    });

    const response = await GET(
      new Request(cardUrl("card-1"), { headers: await authHeaders() }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.card.id).toBe("card-1");
  });
});

describe("PATCH /api/cards/:id — reguła limit/unlimited na scalonym stanie", () => {
  it("returns 404 for a card owned by a different device", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await PATCH(
      new Request(cardUrl("card-1"), {
        method: "PATCH",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ totalVisits: 20 }),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
  });

  it("rejects switching an existing limit card to unlimited without also setting expiryDate", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingLimitCard);

    const response = await PATCH(
      new Request(cardUrl("card-1"), {
        method: "PATCH",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ type: CardType.unlimited }),
      }),
      routeParams("card-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("expiryDateRequiredForUnlimited");
    expect(prismaMock.card.update).not.toHaveBeenCalled();
  });

  it("allows explicitly clearing expiryDate on a limit card (null is a valid patch value)", async () => {
    prismaMock.card.findFirst.mockResolvedValue({
      ...existingLimitCard,
      expiryDate: new Date("2026-12-31"),
    });
    prismaMock.card.update.mockResolvedValue({ id: "card-1" });

    const response = await PATCH(
      new Request(cardUrl("card-1"), {
        method: "PATCH",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ expiryDate: null }),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(200);
    expect(prismaMock.card.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ expiryDate: null }),
      })
    );
  });

  it("applies a valid partial patch (totalVisits only)", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingLimitCard);
    prismaMock.card.update.mockResolvedValue({ id: "card-1" });

    const response = await PATCH(
      new Request(cardUrl("card-1"), {
        method: "PATCH",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ totalVisits: 20 }),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(200);
    expect(prismaMock.card.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalVisits: 20, companyId: "co1" }),
      })
    );
  });
});

describe("DELETE /api/cards/:id — miękkie usunięcie po potwierdzeniu w UI", () => {
  it("returns 404 for a card owned by a different device", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await DELETE(
      new Request(cardUrl("card-1"), {
        method: "DELETE",
        headers: await authHeaders(),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(404);
    expect(prismaMock.card.update).not.toHaveBeenCalled();
  });

  it("soft-deletes an owned card by setting deletedAt", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingLimitCard);
    prismaMock.card.update.mockResolvedValue({ ...existingLimitCard, deletedAt: new Date() });

    const response = await DELETE(
      new Request(cardUrl("card-1"), {
        method: "DELETE",
        headers: await authHeaders(),
      }),
      routeParams("card-1")
    );

    expect(response.status).toBe(204);
    expect(prismaMock.card.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "card-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });
});
