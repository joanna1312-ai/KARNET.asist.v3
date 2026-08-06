import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  visit: {
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));

const { PATCH, DELETE } = await import("./route");

const visitUrl = (cardId: string, visitId: string) =>
  `http://localhost/api/cards/${cardId}/visits/${visitId}`;
const routeParams = (id: string, visitId: string) => ({
  params: Promise.resolve({ id, visitId }),
});

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(null);
  prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
});

async function authHeaders(deviceId = "device-1") {
  const token = await signDeviceToken(deviceId);
  return { Authorization: `Device ${token}` };
}

const ownedCard = {
  id: "card-1",
  deviceId: "device-1",
  usedVisits: 3,
  deletedAt: null,
};

const existingVisit = {
  id: "visit-1",
  cardId: "card-1",
  visitDate: new Date("2026-07-01"),
  visitTime: null,
  note: null,
};

describe("PATCH /api/cards/:id/visits/:visitId — edycja daty/godziny/notatki", () => {
  it("rejects requests without a verified device token", async () => {
    const response = await PATCH(
      new Request(visitUrl("card-1", "visit-1"), { method: "PATCH" }),
      routeParams("card-1", "visit-1")
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when the card does not belong to the caller's device", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await PATCH(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "PATCH",
        headers: await authHeaders(),
      }),
      routeParams("card-1", "visit-1")
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the visit does not belong to the card", async () => {
    prismaMock.card.findFirst.mockResolvedValue(ownedCard);
    prismaMock.visit.findFirst.mockResolvedValue(null);

    const response = await PATCH(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "PATCH",
        headers: await authHeaders(),
      }),
      routeParams("card-1", "visit-1")
    );

    expect(response.status).toBe(404);
  });

  it("rejects a note longer than 80 characters", async () => {
    prismaMock.card.findFirst.mockResolvedValue(ownedCard);
    prismaMock.visit.findFirst.mockResolvedValue(existingVisit);

    const response = await PATCH(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "PATCH",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ note: "a".repeat(81) }),
      }),
      routeParams("card-1", "visit-1")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toContain("noteTooLong");
    expect(prismaMock.visit.update).not.toHaveBeenCalled();
  });

  it("does not touch card.usedVisits when editing a visit", async () => {
    prismaMock.card.findFirst.mockResolvedValue(ownedCard);
    prismaMock.visit.findFirst.mockResolvedValue(existingVisit);
    prismaMock.visit.update.mockResolvedValue({ ...existingVisit, note: "Korekta" });

    const response = await PATCH(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "PATCH",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Korekta" }),
      }),
      routeParams("card-1", "visit-1")
    );

    expect(response.status).toBe(200);
    expect(prismaMock.card.update).not.toHaveBeenCalled();
    expect(prismaMock.visit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "visit-1" },
        data: expect.objectContaining({ note: "Korekta" }),
      })
    );
  });

  it("applies a partial patch keeping existing values for untouched fields", async () => {
    prismaMock.card.findFirst.mockResolvedValue(ownedCard);
    prismaMock.visit.findFirst.mockResolvedValue({
      ...existingVisit,
      note: "Stara notatka",
    });
    prismaMock.visit.update.mockResolvedValue({});

    await PATCH(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "PATCH",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ visitTime: "18:30" }),
      }),
      routeParams("card-1", "visit-1")
    );

    expect(prismaMock.visit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ note: "Stara notatka" }),
      })
    );
  });
});

describe("DELETE /api/cards/:id/visits/:visitId — usunięcie po potwierdzeniu w UI", () => {
  it("returns 404 when the visit does not belong to the caller's device/card", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await DELETE(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "DELETE",
        headers: await authHeaders(),
      }),
      routeParams("card-1", "visit-1")
    );

    expect(response.status).toBe(404);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("deletes the visit and decrements usedVisits in the same transaction", async () => {
    prismaMock.card.findFirst.mockResolvedValue(ownedCard);
    prismaMock.visit.findFirst.mockResolvedValue(existingVisit);
    prismaMock.visit.delete.mockResolvedValue(existingVisit);
    prismaMock.card.update.mockResolvedValue({ ...ownedCard, usedVisits: 2 });

    const response = await DELETE(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "DELETE",
        headers: await authHeaders(),
      }),
      routeParams("card-1", "visit-1")
    );

    expect(response.status).toBe(204);
    expect(prismaMock.card.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "card-1" },
        data: { usedVisits: 2 },
      })
    );
  });

  it("never lets usedVisits go below zero", async () => {
    prismaMock.card.findFirst.mockResolvedValue({ ...ownedCard, usedVisits: 0 });
    prismaMock.visit.findFirst.mockResolvedValue(existingVisit);
    prismaMock.visit.delete.mockResolvedValue(existingVisit);
    prismaMock.card.update.mockResolvedValue({ ...ownedCard, usedVisits: 0 });

    await DELETE(
      new Request(visitUrl("card-1", "visit-1"), {
        method: "DELETE",
        headers: await authHeaders(),
      }),
      routeParams("card-1", "visit-1")
    );

    expect(prismaMock.card.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usedVisits: 0 } })
    );
  });
});
