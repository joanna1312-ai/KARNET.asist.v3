import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { signDeviceToken } from "@/server/device-token";

const prismaMock = {
  card: {
    findFirst: vi.fn(),
  },
  cardVoucherFile: {
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
};

const getServerSessionMock = vi.fn().mockResolvedValue(null);
const removeVoucherObjectMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next-auth/next", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/server/storage", () => ({
  removeVoucherObject: removeVoucherObjectMock,
}));

const { DELETE } = await import("./route");

const url = (id: string, fileId: string) => `http://localhost/api/cards/${id}/voucher-files/${fileId}`;
const routeParams = (id: string, fileId: string) => ({ params: Promise.resolve({ id, fileId }) });

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = "test-secret-for-vitest-only-not-for-prod-use";
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(null);
});

async function authHeaders(deviceId = "device-1") {
  return { Authorization: `Device ${await signDeviceToken(deviceId)}` };
}

const existingCard = {
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

describe("DELETE /api/cards/:id/voucher-files/:fileId", () => {
  it("returns 404 when the card does not belong to the caller", async () => {
    prismaMock.card.findFirst.mockResolvedValue(null);

    const response = await DELETE(
      new Request(url("card-1", "file-1"), { method: "DELETE", headers: await authHeaders() }),
      routeParams("card-1", "file-1")
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the file does not belong to this card", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);
    prismaMock.cardVoucherFile.findFirst.mockResolvedValue(null);

    const response = await DELETE(
      new Request(url("card-1", "file-1"), { method: "DELETE", headers: await authHeaders() }),
      routeParams("card-1", "file-1")
    );

    expect(response.status).toBe(404);
    expect(prismaMock.cardVoucherFile.delete).not.toHaveBeenCalled();
  });

  it("deletes the row and removes the storage object", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);
    prismaMock.cardVoucherFile.findFirst.mockResolvedValue({
      id: "file-1",
      cardId: "card-1",
      storagePath: "cards/card-1/a.jpg",
    });

    const response = await DELETE(
      new Request(url("card-1", "file-1"), { method: "DELETE", headers: await authHeaders() }),
      routeParams("card-1", "file-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(prismaMock.cardVoucherFile.delete).toHaveBeenCalledWith({ where: { id: "file-1" } });
    expect(removeVoucherObjectMock).toHaveBeenCalledWith("cards/card-1/a.jpg");
  });

  it("still returns 200 when the storage object removal fails (best-effort)", async () => {
    prismaMock.card.findFirst.mockResolvedValue(existingCard);
    prismaMock.cardVoucherFile.findFirst.mockResolvedValue({
      id: "file-1",
      cardId: "card-1",
      storagePath: "cards/card-1/a.jpg",
    });
    removeVoucherObjectMock.mockRejectedValueOnce(new Error("storage_error"));

    const response = await DELETE(
      new Request(url("card-1", "file-1"), { method: "DELETE", headers: await authHeaders() }),
      routeParams("card-1", "file-1")
    );

    expect(response.status).toBe(200);
  });
});
